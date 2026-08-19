import { REFRESH_TOKEN_COOKIE } from '@common/constants';
import { ErrorCodes } from '@common/enums';
import { HttpException } from '@common/exceptions';
import { prisma } from '@database';
import { emitEvent } from '@common/utils';
import { MAIL_SEND, MailDto } from '@mail';
import { codeHTML } from '../utils';
import { compare, genSalt, hash } from 'bcryptjs';
import { Request } from 'express';
import { LoginDto, RegisterDto, VerifyDto, VerifyEmailResendDto } from '../dto';
import { regType, Roles } from '../enums';
import { sessionService } from './session.service';
import { tokenService } from './token.service';
import axios from 'axios';
import { Profile } from '@auth/types';
import { mesiboService } from '@mesibo/services';

class AuthService {
  async register(req: Request) {
    const dto = new RegisterDto({
      ...req.body,
      headers: {
        ip: req.clientIp || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    const candidate = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (candidate) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.auth.emailTaken', dto.email),
      );
    }

    const usernameCandidate = await prisma.user.findUnique({
      where: { username: dto.username },
      select: { id: true },
    });

    if (usernameCandidate) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.auth.usernameTaken', dto.username),
      );
    }

    await this.createUser(
      dto.email,
      dto.username,
      dto.password,
      Roles.User,
      false,
      regType.Email,
    );

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      omit: {
        roleId: true,
        emailVerificationKey: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
      include: {
        role: true,
      },
    });

    const verifKeyUser = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        emailVerificationKey: true,
      },
    });

    this.sendVerificationEmail(user.email, verifKeyUser.emailVerificationKey);

    return { msg: 'Please verify your email via code' };
  }

  async login(req: Request) {
    const dto = new LoginDto({
      ...req.body,
      headers: {
        ip: req.clientIp || 'hidden',
        userAgent: req.headers['user-agent'] || 'hidden',
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      omit: {
        roleId: true,
        emailVerificationKey: true,
        createdAt: true,
        updatedAt: true,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.auth.invalidLoginOrPassword'),
      );
    }

    const isValidPassword = await compare(dto.password, user.passwordHash);
    if (!isValidPassword) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.auth.invalidLoginOrPassword'),
      );
    }

    if (!user.emailVerifiedAt) {
      throw HttpException.BadRequest(
        ErrorCodes.Verify,
        req.__('errors.auth.emailVerified'),
      );
    }

    const sessionId = await sessionService.create(
      user.id,
      dto.headers.userAgent,
      dto.headers.ip,
    );
    const tokens = tokenService.generateTokens(user.id, sessionId);
    let mesiboToken: string | null = null;
    try {
      mesiboToken = user.mesiboId
        ? await mesiboService.getNewToken(user.id, req)
        : await mesiboService.getNewToken(
            (await mesiboService.registerUserOnMesibo(user as any, req)).id,
            req
          );
    } catch {
      // Mesibo unavailable — login still succeeds, mesiboToken is null
    }
    await sessionService.setRefreshToken(sessionId, tokens.refreshToken);

    return { ...tokens, mesiboToken };
  }

  async verifyEmailResend(req: Request) {
    const dto = new VerifyEmailResendDto(req.body);

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { emailVerificationKey: true },
    });

    if (!user) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.auth.userWithEmailNotFound', dto.email),
      );
    }

    this.sendVerificationEmail(dto.email, user.emailVerificationKey);
  }

  private sendVerificationEmail(to: string, verificationKey: string) {
    // const link = `${process.env.API_URL}/auth/verify/${verificationKey}`;

    emitEvent(
      MAIL_SEND,
      new MailDto({
        to: [to],
        subject: `Email verification on ${process.env.DOMAIN}`,
        html: codeHTML(
          `Email verification on ${process.env.DOMAIN}`,
          'Please, verify your email via code',
          verificationKey,
        ),
      }),
    );
  }

  async verify(req: Request) {
    const dto = new VerifyDto({
      ...req.body,
      headers: {
        ip: req.clientIp || '',
        userAgent: req.headers['user-agent'] || '',
      },
    });

    const userId = await prisma.user.findUnique({
      where: {
        email: dto.email,
        emailVerificationKey: dto.verificationKey,
      },
      select: { id: true },
    });

    if (!userId) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest);
    }

    await prisma.user.update({
      where: { id: userId.id },
      data: {
        emailVerificationKey: null,
        emailVerifiedAt: new Date(),
      },
    });

    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        mesiboId: true,
        name: true,
      },
    });

    const sessionId = await sessionService.create(
      user.id,
      dto.headers.userAgent,
      dto.headers.ip,
    );
    const tokens = tokenService.generateTokens(user.id, sessionId);
    const mesiboToken = user.mesiboId
      ? await mesiboService.getNewToken(user.id, req)
      : await mesiboService.getNewToken(
          (await mesiboService.registerUserOnMesibo(user as any, req)).id,
          req
        );
    await sessionService.setRefreshToken(sessionId, tokens.refreshToken);

    return { ...tokens, mesiboToken };
  }

  async googleCallback(req: Request) {
    const { code } = req.query;

    const responce = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const { data } = responce;

    const {
      access_token,
      // id_token
    } = data;

    const profile: { data: Profile } = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const existingUser = await prisma.user.findUnique({
      where: { email: profile.data.email },
      omit: {
        roleId: true,
        emailVerificationKey: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
      include: { role: true },
    });
    let user = existingUser;

    if (!existingUser) {
      user = await authService.createUser(
        profile.data.email,
        profile.data.email.match(/^([^@]+)/)[1],
        this.getRandomNumber(8),
        Roles.User,
        true,
        regType.Google,
      );
    }

    const sessionId = await sessionService.create(
      user.id,
      req.headers['user-agent'] || '',
      req.clientIp || '',
    );
    const tokens = tokenService.generateTokens(user.id, sessionId);
    const mesiboToken = user.mesiboId
      ? await mesiboService.getNewToken(user.id, req)
      : await mesiboService.getNewToken(
          (await mesiboService.registerUserOnMesibo(user as any, req)).id,
          req
        );
    await sessionService.setRefreshToken(sessionId, tokens.refreshToken);

    return { user, ...tokens, mesiboToken };
  }

  async googleLogin(req: Request, access_token: string) {
    const profile: { data: Profile } = await axios.get(
      'https://www.googleapis.com/oauth2/v1/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const existingUser = await prisma.user.findUnique({
      where: { email: profile.data.email },
      select: { id: true, emailVerifiedAt: true, mesiboId: true, name: true },
    });
    let user = existingUser;

    if (!existingUser) {
      user = await authService.createUser(
        profile.data.email,
        profile.data.email.match(/^([^@]+)/)[1],
        this.getRandomNumber(8),
        Roles.User,
        true,
        regType.Google,
      );
    } else {
      if (!existingUser.emailVerifiedAt) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerifiedAt: new Date(),
            emailVerificationKey: null,
          },
        });
      }
    }

    const sessionId = await sessionService.create(
      user.id,
      req.headers['user-agent'] || '',
      req.clientIp || '',
    );
    const tokens = tokenService.generateTokens(user.id, sessionId);
    const mesiboToken = user.mesiboId
      ? await mesiboService.getNewToken(user.id, req)
      : await mesiboService.getNewToken(
          (await mesiboService.registerUserOnMesibo(user as any, req)).id,
          req
        );
    await sessionService.setRefreshToken(sessionId, tokens.refreshToken);

    return { ...tokens, mesiboToken };
  }

  async appleLogin(req: Request) {
    const { userIdentifier, identityToken, email, fullName } = req.body;

    if (!userIdentifier || !identityToken) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Missing required Apple login parameters',
      );
    }

    // For Apple, we use userIdentifier as the unique identifier
    // First check if user exists by appleUserId or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ appleUserId: userIdentifier }, ...(email ? [{ email }] : [])],
      },
      select: {
        id: true,
        emailVerifiedAt: true,
        mesiboId: true,
        name: true,
        email: true,
        appleUserId: true,
      },
    });

    let user = existingUser;

    if (!existingUser) {
      // Create new user
      const userEmail = email || `${userIdentifier}@apple.privaterelay.com`;
      const userName = fullName
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : `User ${this.getRandomNumber(6)}`;

      // Generate a unique username based on email or userIdentifier
      const baseUsername = email
        ? email.match(/^([^@]+)/)[1]
        : `apple_${userIdentifier.slice(-8)}`;

      user = await authService.createUser(
        userEmail,
        baseUsername,
        this.getRandomNumber(8),
        Roles.User,
        true, // Apple users are automatically verified
        regType.Apple,
      );

      // Update the user with Apple-specific data
      await prisma.user.update({
        where: { id: user.id },
        data: {
          appleUserId: userIdentifier,
          ...(fullName && { name: userName }),
        },
      });
    } else {
      // If existing user but not verified, mark as verified
      if (!existingUser.emailVerifiedAt) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerifiedAt: new Date(),
            emailVerificationKey: null,
          },
        });
      }

      // Update Apple user data if needed
      const updateData: any = {};

      // Update email if provided and different
      if (email && existingUser.email !== email) {
        updateData.email = email;
      }

      // Ensure appleUserId is set (for users migrated from old system)
      if (!existingUser.appleUserId) {
        updateData.appleUserId = userIdentifier;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
      }
    }

    const sessionId = await sessionService.create(
      user.id,
      req.headers['user-agent'] || '',
      req.clientIp || '',
    );
    const tokens = tokenService.generateTokens(user.id, sessionId);
    const mesiboToken = user.mesiboId
      ? await mesiboService.getNewToken(user.id, req)
      : await mesiboService.getNewToken(
          (await mesiboService.registerUserOnMesibo(user as any, req)).id,
          req
        );
    await sessionService.setRefreshToken(sessionId, tokens.refreshToken);

    return { ...tokens, mesiboToken };
  }

  async logout(req: Request) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw HttpException.Unauthorized(
        ErrorCodes.Auth,
        req.__('errors.auth.sessionNotFound'),
      );
    }

    const claims = await tokenService.validateRefreshToken(refreshToken);

    await sessionService.destroy(claims, req);
    const mesiboId = (
      await prisma.user.findUnique({ where: { id: claims.userId } })
    )?.mesiboId;
    if (mesiboId) {
      try {
        await mesiboService.deleteUserToken(mesiboId);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async refresh(req: Request) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw HttpException.Unauthorized(ErrorCodes.Auth);
    }

    const claims = tokenService.validateRefreshToken(refreshToken);
    await sessionService.validate(claims, req);

    const tokens = tokenService.generateTokens(claims.userId, claims.sessionId);
    const mesiboId = (
      await prisma.user.findUnique({ where: { id: claims.userId } })
    )?.mesiboId;
    if (mesiboId) {
      // Новые токены подключаются с задержкой, потому на клиенте проблемы
      // await mesiboService.deleteUserToken(mesiboId);
    }
    const mesiboToken = await mesiboService.getNewToken(claims.userId, req);
    await sessionService.setRefreshToken(claims.sessionId, tokens.refreshToken);

    return { ...tokens, mesiboToken };
  }

  async setNotifications(req: Request) {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const { notificationToken } = req.body;
    if (!refreshToken) {
      throw HttpException.Unauthorized(ErrorCodes.Auth);
    }

    const claims = tokenService.validateRefreshToken(refreshToken);
    await sessionService.validate(claims, req);
    await sessionService.setNotificationToken(
      claims.sessionId,
      notificationToken,
    );

    return { result: true };
  }

  // async createRecoveryToken(email: string) {
  //   const user = await prisma.user.findUnique({ where: { email } });

  //   if (!user) {
  //     throw HttpException.BadRequest(
  //       ErrorCodes.BadRequest,
  //       'User to recovery not found',
  //     );
  //   }

  //   const token = v4().replaceAll('-', '');
  //   const body = {
  //     tokenHash: encrypt(token),
  //     expiresAt: moment.utc().add(30, 'minutes').toDate(),
  //   };

  //   await prisma.recoveryToken.upsert({
  //     where: { userId: user.id },
  //     create: {
  //       userId: user.id,
  //       ...body,
  //     },
  //     update: body,
  //   });

  //   emitEvent(
  //     MAIL_SEND,
  //     new MailDto({
  //       to: [email],
  //       subject: `Password recovery on ${process.env.DOMAIN}`,
  //       html: mailHtml(
  //         `Password recovery on ${process.env.DOMAIN}`,
  //         '',
  //         `https://${process.env.DOMAIN}/password-recovery/${token}`,
  //         'Recover password',
  //       ),
  //     }),
  //   );
  // }

  // async verifyRecoveryToken(token: string) {
  //   const recoveryToken = await prisma.recoveryToken.findFirst({
  //     where: { tokenHash: encrypt(token) },
  //   });

  //   if (!recoveryToken) {
  //     throw HttpException.BadRequest(
  //       ErrorCodes.BadRequest,
  //       'Recovery token not found',
  //     );
  //   }

  //   if (moment(recoveryToken.expiresAt).diff(moment.utc(), 'minutes') > 30) {
  //     await prisma.recoveryToken.delete({
  //       where: { userId: recoveryToken.userId },
  //     });
  //     throw HttpException.BadRequest(
  //       ErrorCodes.BadRequest,
  //       'Recovery token expired',
  //     );
  //   }

  //   return recoveryToken.userId;
  // }

  async resetPassword(userId: number, newPassword: string) {
    const salt = await genSalt(10);
    const passwordHash = await hash(newPassword, salt);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest, 'User not found');
    }

    await prisma.$transaction([
      prisma.recoveryToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.userSession.deleteMany({
        where: { userId: user.id },
      }),
    ]);
  }

  private async hashPassword(password: string) {
    const salt = await genSalt(10);
    const passwordHash = await hash(password, salt);

    return passwordHash;
  }

  async changePassword(req: Request) {
    const id = +req.params.id;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    if (!targetUser) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        req.__('errors.users.notFound'),
      );
    }

    const passwordHash = await this.hashPassword(req.body.password);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  getRandomNumber(limit = 4) {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(limit, '0');
  }

  async createUser(
    email: string,
    username: string,
    password: string,
    roleId: Roles,
    verified: boolean = false,
    regType: regType,
    permissions: { rolePermissionId: number }[] = [],
  ) {
    const passwordHash = await this.hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: `User ${this.getRandomNumber(6)}`,
        username,
        email,
        passwordHash,
        roleId,
        emailVerificationKey: verified ? null : this.getRandomNumber(),
        emailVerifiedAt: verified ? new Date() : null,
        regType: regType,
        permissions:
          permissions.length > 0
            ? {
                createMany: {
                  data: permissions,
                },
              }
            : undefined,
      },
      include: { role: true },
    });
    try {
      await mesiboService.registerUserOnMesibo(user as any);
    } catch (error) {
      console.error('Registration of mesibo user is failed because: \n', error);
    }
    return user;
  }
}

export const authService = new AuthService();
