import {
  prisma,
  ReportStatus,
  ReportType,
  CompanyStatus,
  PointInstructionStatus,
  PointInstructionType,
} from '@database';
import { messageOne } from '@firebase';
import { AppNotification } from '@firebase/enums';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import moment from 'moment';
import { Roles } from '@auth/enums';
import fs from 'fs';
import path from 'path';
import { paginate } from '@common/pagination';
import { PaginateDto } from '@common/dto';
import { mesiboService } from '@mesibo/services';
import { compare } from 'bcryptjs';
import { tokenService } from '@auth/services/token.service';
import { sessionService } from '@auth/services/session.service';
import type { Request } from 'express';
import type { AuthorizedRequest } from '@auth/types';

export const adminService = {
  // Authentication
  async login(req: Request) {
    const { login, password } = req.body;

    if (!login || !password) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Login and password are required',
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: login }, { username: login }],
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Invalid credentials',
      );
    }

    // Check if user has admin privileges
    if (user.roleId !== Roles.Admin && user.roleId !== Roles.SuperAdmin) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'Access denied. Admin privileges required.',
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Invalid credentials',
      );
    }

    // Check if user is banned
    if (user.isBanned) {
      throw HttpException.Forbidden(ErrorCodes.Forbidden, 'Account is banned');
    }

    // Create session and generate tokens
    const sessionId = await sessionService.create(
      user.id,
      req.headers['user-agent'] || 'unknown',
      req.clientIp || req.ip || 'unknown',
    );
    const { accessToken, refreshToken } = tokenService.generateTokens(
      user.id,
      sessionId,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        roleId: user.roleId,
        roleName: user.role.name,
      },
    };
  },

  async logout(_req: AuthorizedRequest) {
    // For JWT-based auth, logout is handled client-side by removing tokens
    // Server-side could maintain a token blacklist if needed
    return { success: true };
  },

  async refresh(req: Request) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw HttpException.BadRequest(ErrorCodes.Auth, 'Refresh token required');
    }

    try {
      // Verify and decode refresh token
      const claims = tokenService.validateRefreshToken(refreshToken);

      if (!claims) {
        throw HttpException.BadRequest(
          ErrorCodes.Auth,
          'Invalid refresh token',
        );
      }

      // Fetch fresh user data
      const user = await prisma.user.findUnique({
        where: { id: claims.userId },
        include: { role: true },
      });

      if (!user) {
        throw HttpException.BadRequest(ErrorCodes.Auth, 'User not found');
      }

      if (user.roleId !== Roles.Admin && user.roleId !== Roles.SuperAdmin) {
        throw HttpException.Forbidden(
          ErrorCodes.Forbidden,
          'Admin privileges required',
        );
      }

      if (user.isBanned) {
        throw HttpException.Forbidden(
          ErrorCodes.Forbidden,
          'Account is banned',
        );
      }

      // Generate new tokens with existing session
      const tokens = tokenService.generateTokens(user.id, claims.sessionId);
      await sessionService.setRefreshToken(
        claims.sessionId,
        tokens.refreshToken,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (_error) {
      throw HttpException.BadRequest(ErrorCodes.Auth, 'Invalid refresh token');
    }
  },

  // Dashboard Statistics
  async getDashboardStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersDay,
      newUsersWeek,
      newUsersMonth,
      premiumUsers,
      bannedUsers,
      mutedUsers,
      totalQuestions,
      questionsNoAnswer,
      totalPoints,
      verifiedPoints,
      totalAnswers,
      totalCompanies,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.subscription.count({ where: { endDate: { gte: now } } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isMuted: true } }),
      prisma.question.count(),
      prisma.question.count({ where: { bestAnswerId: null } }),
      prisma.point.count(),
      prisma.point.count({ where: { verified: true } }),
      prisma.answer.count(),
      prisma.company.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        newDay: newUsersDay,
        newWeek: newUsersWeek,
        newMonth: newUsersMonth,
        premium: premiumUsers,
        banned: bannedUsers,
        muted: mutedUsers,
      },
      content: {
        questions: totalQuestions,
        questionsNoAnswer,
        answers: totalAnswers,
        points: totalPoints,
        verifiedPoints,
        companies: totalCompanies,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
    };
  },

  // System Status (Message Server health)
  async getSystemStatus() {
    const messageServer = await mesiboService.getMessageServerStatus();

    return {
      mesibo: {
        connected: messageServer.connected,
        error: messageServer.error,
      },
      messageServer,
      apiUptime: Math.floor(process.uptime() * 1000),
      serverTime: new Date().toISOString(),
    };
  },

  // Dashboard Chart Data
  async getDashboardChartData(type: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fillMissingDates = (
      data: Array<{ date: string; count: number }>,
      startDate: Date,
    ): Array<{ date: string; count: number }> => {
      const result: Array<{ date: string; count: number }> = [];
      const dataMap = new Map(
        data.map((d) => [new Date(d.date).toISOString().split('T')[0], d.count]),
      );
      const today = new Date();
      const current = new Date(startDate);

      while (current <= today) {
        const key = current.toISOString().split('T')[0];
        result.push({ date: key, count: dataMap.get(key) || 0 });
        current.setDate(current.getDate() + 1);
      }

      return result;
    };

    switch (type) {
      case 'new-users': {
        const data = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
          SELECT DATE(created_at) as date, COUNT(*)::int as count
          FROM "users"
          WHERE created_at >= ${thirtyDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        return fillMissingDates(data, thirtyDaysAgo);
      }
      case 'active-users': {
        const data = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
          SELECT DATE(last_activity_at) as date, COUNT(DISTINCT user_id)::int as count
          FROM user_activities
          WHERE last_activity_at >= ${thirtyDaysAgo}
          GROUP BY DATE(last_activity_at)
          ORDER BY date ASC
        `;
        return fillMissingDates(data, thirtyDaysAgo);
      }
      case 'subscribers': {
        const data = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
          SELECT DATE(created_at) as date, COUNT(*)::int as count
          FROM subscriptions
          WHERE created_at >= ${thirtyDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        return fillMissingDates(data, thirtyDaysAgo);
      }
      case 'user-locations': {
        const data = await prisma.$queryRaw<Array<{ country: string; count: number }>>`
          SELECT "countryIsoCode" as country, COUNT(*)::int as count
          FROM "users"
          WHERE "countryIsoCode" IS NOT NULL AND "countryIsoCode" != ''
          GROUP BY "countryIsoCode"
          ORDER BY count DESC
        `;
        return data;
      }
      default:
        return [];
    }
  },

  // Profile Management
  async grantPremium(userId: number, tariffId?: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    // Get default premium tariff if not specified
    const targetTariff = await prisma.tariff.findFirst({
      where: { id: tariffId || undefined, isActive: true },
      orderBy: { price: 'desc' },
    });

    if (!targetTariff) {
      throw HttpException.NotFound(ErrorCodes.TariffNotFound);
    }

    // Create new subscription (upsert to handle existing one)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + targetTariff.duration);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffId: targetTariff.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      update: {
        tariffId: targetTariff.id,
        startDate,
        endDate,
        status: 'ACTIVE',
      },
      include: {
        tariff: true,
      },
    });

    return {
      message: 'Premium granted successfully',
      subscription,
    };
  },

  async revokePremium(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    // Cancel user subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!existingSubscription) {
      return { message: 'No active subscription found' };
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'CANCELLED',
        endDate: new Date(), // End immediately
      },
    });

    return {
      message: 'Premium revoked successfully',
      subscription: updatedSubscription,
    };
  },

  async banUser(userId: number, reason: string, duration: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    let expiredAt: Date;
    const now = moment().utc();

    switch (duration) {
      case '12h':
        expiredAt = now.add(12, 'hours').toDate();
        break;
      case '24h':
        expiredAt = now.add(24, 'hours').toDate();
        break;
      case 'permanent':
        expiredAt = now.add(100, 'years').toDate();
        break;
      default:
        throw HttpException.BadRequest(ErrorCodes.InvalidDuration);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });

    await prisma.userBan.upsert({
      where: { userId },
      create: {
        userId,
        reason,
        expiredAt,
      },
      update: {
        reason,
        expiredAt,
      },
    });

    return { message: 'User banned successfully' };
  },

  async unbanUser(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    });

    await prisma.userBan.deleteMany({
      where: { userId },
    });

    return { message: 'User unbanned successfully' };
  },

  async muteUser(userId: number, duration: string, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    let expiredAt: Date;
    const now = moment().utc();

    switch (duration) {
      case '1h':
        expiredAt = now.add(1, 'hour').toDate();
        break;
      case '6h':
        expiredAt = now.add(6, 'hours').toDate();
        break;
      case '12h':
        expiredAt = now.add(12, 'hours').toDate();
        break;
      case '24h':
        expiredAt = now.add(24, 'hours').toDate();
        break;
      case '7d':
        expiredAt = now.add(7, 'days').toDate();
        break;
      case 'permanent':
        expiredAt = now.add(100, 'years').toDate();
        break;
      default:
        throw HttpException.BadRequest(ErrorCodes.InvalidDuration);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isMuted: true },
    });

    await prisma.userMute.upsert({
      where: { userId },
      create: {
        userId,
        reason,
        expiredAt,
      },
      update: {
        reason,
        expiredAt,
      },
    });

    return { message: 'User muted successfully' };
  },

  async unmuteUser(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isMuted: false },
    });

    await prisma.userMute.deleteMany({
      where: { userId },
    });

    return { message: 'User unmuted successfully' };
  },

  async grantAdmin(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: Roles.Admin },
    });

    return updatedUser;
  },

  async revokeAdmin(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: Roles.User },
    });

    return updatedUser;
  },

  async editUserProfile(userId: number, profileData: any) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        description: profileData.description,
        companyId: profileData.companyId,
        countryIsoCode: profileData.countryIsoCode,
        pmConfidenciality: profileData.pmConfidenciality,
        isPublic: profileData.isPublic,
        isShowOnParkings: profileData.isShowOnParkings,
        language: profileData.language,
      },
    });

    return updatedUser;
  },

  async deleteUserPhoto(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    if (user.photo) {
      // Delete the physical file
      const photoPath = path.join(
        process.cwd(),
        'uploads',
        'profiles',
        user.photo,
      );
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { photo: null },
    });

    return updatedUser;
  },

  // Messenger Management
  async getGroupMessages(
    chatId: number,
    params: { page: number; pageSize: number },
  ) {
    if (!chatId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Chat ID is required',
      );
    }

    try {
      // Call Mesibo service with group ID and pagination params
      const response = await mesiboService.getChatMessages({
        query: {
          gid: chatId,
          page: params.page,
          pageSize: params.pageSize,
        },
      } as any);

      // Mesibo returns: { items: [...], meta: { total, page, pageSize } }
      // Frontend expects: { items: [...], meta: { total, page, pageCount } }

      const pageCount =
        response.meta?.total && response.meta?.pageSize
          ? Math.ceil(response.meta.total / response.meta.pageSize)
          : 1;

      return {
        items: response.items || [],
        meta: {
          page: response.meta?.page || params.page,
          pageCount: pageCount,
          total: response.meta?.total || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching chat messages from Mesibo:', error);
      throw HttpException.BadRequest(
        ErrorCodes.Internal,
        'Failed to fetch chat messages',
      );
    }
  },

  // Q&A Management
  async deleteAnswer(answerId: number) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) {
      throw HttpException.NotFound(ErrorCodes.AnswerNotFound);
    }

    const deletedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedAnswer;
  },

  async setBestAnswer(answerId: number, questionId: number) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) {
      throw HttpException.NotFound(ErrorCodes.AnswerNotFound);
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: { bestAnswerId: answerId },
    });

    return updatedQuestion;
  },

  async unsetBestAnswer(questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: { bestAnswerId: null },
    });

    return updatedQuestion;
  },

  async setUselessAnswer(answerId: number) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) {
      throw HttpException.NotFound(ErrorCodes.AnswerNotFound);
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { markedAsIrrelevant: true },
    });

    return updatedAnswer;
  },

  async unsetUselessAnswer(answerId: number) {
    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer) {
      throw HttpException.NotFound(ErrorCodes.AnswerNotFound);
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: { markedAsIrrelevant: false },
    });

    return updatedAnswer;
  },

  async deleteQuestion(questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    // Delete the question and all related answers, votes, etc. (cascade delete)
    const deletedQuestion = await prisma.question.delete({
      where: { id: questionId },
    });

    return deletedQuestion;
  },

  // Subscription Management
  async getUserSubscription(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    return user.subscription;
  },

  async isUserPremium(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const subscription = user.subscription;
    const isPremium =
      subscription &&
      subscription.status === 'ACTIVE' &&
      subscription.endDate >= new Date();

    return {
      isPremium: !!isPremium,
      subscription: subscription,
    };
  },

  async getAllTariffs() {
    return await prisma.tariff.findMany({
      where: { isActive: true },
      orderBy: { id: 'desc' },
    });
  },

  async createTariff(tariffData: any) {
    return await prisma.tariff.create({
      data: {
        name: tariffData.name,
        description: tariffData.description,
        price: tariffData.price,
        currency: tariffData.currency || 'USD',
        duration: tariffData.duration,
        features: tariffData.features || [],
        isActive:
          tariffData.isActive !== undefined ? tariffData.isActive : true,
      },
    });
  },

  async updateTariff(tariffId: number, tariffData: any) {
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
    if (!tariff) {
      throw HttpException.NotFound(ErrorCodes.TariffNotFound);
    }

    return await prisma.tariff.update({
      where: { id: tariffId },
      data: {
        name: tariffData.name,
        description: tariffData.description,
        price: tariffData.price,
        currency: tariffData.currency,
        duration: tariffData.duration,
        features: tariffData.features,
        isActive: tariffData.isActive,
      },
    });
  },

  async deactivateTariff(tariffId: number) {
    const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
    if (!tariff) {
      throw HttpException.NotFound(ErrorCodes.TariffNotFound);
    }

    return await prisma.tariff.update({
      where: { id: tariffId },
      data: { isActive: false },
    });
  },

  // Report Management
  async getAllReports(
    dto: PaginateDto & {
      status?: ReportStatus;
      type?: ReportType;
      userId?: number;
      reportedId?: number;
    },
  ) {
    const whereClause: any = {};

    if (dto.status) {
      whereClause.status = dto.status;
    }

    if (dto.type) {
      whereClause.type = dto.type;
    }

    if (dto.userId) {
      whereClause.userId = dto.userId;
    }

    if (dto.reportedId) {
      whereClause.reportedId = dto.reportedId;
    }

    return await paginate({
      modelName: 'Report',
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
      ...dto,
    });
  },

  async getReportsForUser(userId: number, dto: PaginateDto) {
    return await paginate({
      modelName: 'Report',
      where: {
        OR: [
          { userId }, // Reports created by the user
          { reportedId: userId }, // Reports about the user
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...dto,
    });
  },

  async updateReportStatus(
    reportId: number,
    status: ReportStatus,
    adminId: number,
    reason?: string,
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, status: true },
    });

    if (!report) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === ReportStatus.RESOLVED || status === ReportStatus.CLOSED) {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = adminId;
    }

    return await prisma.report.update({
      where: { id: reportId },
      data: {
        ...updateData,
        reason: reason ? reason : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });
  },

  async getReportById(reportId: number) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    return report;
  },

  async getReportsStats() {
    const stats = await prisma.report.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const typeStats = await prisma.report.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const total = await prisma.report.count();

    const recentReports = await prisma.report.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    return {
      total,
      recentReports,
      byStatus: stats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byType: typeStats.reduce(
        (acc, stat) => {
          acc[stat.type] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  },

  // Company Management
  async getAllCompanies(dto: PaginateDto, status?: CompanyStatus) {
    return await paginate({
      modelName: 'Company',
      where: status ? { status } : undefined,
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
      ...dto,
    });
  },

  async approveCompany(companyId: number) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw HttpException.NotFound(ErrorCodes.NotFound);
    if (company.status !== 'PENDING') throw HttpException.BadRequest(ErrorCodes.BadRequest, 'Company is not pending');

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { status: 'APPROVED' },
    });

    await mesiboService.createChatForCompany(updated);

    if (company.creatorId) {
      await messageOne(company.creatorId, {
        title: 'Заявка одобрена',
        body: `Компания «${company.label}» добавлена в список`,
        type: AppNotification.CompanyRequestApproved,
        id: `${companyId}`,
      });
    }

    return updated;
  },

  async rejectCompany(companyId: number) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw HttpException.NotFound(ErrorCodes.NotFound);
    if (company.status !== 'PENDING') throw HttpException.BadRequest(ErrorCodes.BadRequest, 'Company is not pending');

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { status: 'REJECTED' },
    });

    if (company.creatorId) {
      await messageOne(company.creatorId, {
        title: 'Заявка отклонена',
        body: `Заявка на добавление компании «${company.label}» не одобрена`,
        type: AppNotification.CompanyRequestRejected,
        id: `${companyId}`,
      });
    }

    return updated;
  },

  async deleteCompany(companyId: number) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    return { message: 'Company deleted successfully' };
  },

  // ===================
  // Users Module Methods
  // ===================
  async getAllUsers(dto: PaginateDto, filters: any = {}) {
    const where: any = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (filters.roleId) {
      where.roleId = parseInt(filters.roleId);
    }

    // Company filter
    if (filters.companyId) {
      where.companyId = parseInt(filters.companyId);
    }

    // Ban status filter
    if (filters.isBanned !== undefined) {
      where.isBanned = filters.isBanned === 'true';
    }

    // Email verified filter
    if (filters.emailVerified !== undefined) {
      if (filters.emailVerified === 'true') {
        where.emailVerifiedAt = { not: null };
      } else {
        where.emailVerifiedAt = null;
      }
    }

    // Sorting
    let orderBy: any = { id: 'desc' };
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy = { [filters.sortBy]: sortOrder };
    }

    return await paginate({
      modelName: 'User',
      where,
      include: {
        role: true,
        company: true,
        subscription: { include: { tariff: true } },
      },
      orderBy,
      ...dto,
    });
  },

  async getUserById(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        company: true,
        subscription: { include: { tariff: true } },
        _count: {
          select: {
            questions: true,
            Answer: true,
            PointReview: true,
          },
        },
      },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    return user;
  },

  async deleteUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  },

  // ===================
  // Companies Module Methods (Extensions)
  // ===================
  async getCompanyById(companyId: number) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        members: {
          include: {
            role: true,
          },
        },
        chat: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!company) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    return company;
  },

  async updateCompany(
    companyId: number,
    data: { label?: string; logo?: string },
  ) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.logo && { logo: data.logo }),
      },
      include: {
        members: true,
        chat: true,
      },
    });

    return updated;
  },

  async addMemberToCompany(companyId: number, userId: number) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { companyId },
      include: {
        role: true,
        company: true,
      },
    });

    return {
      message: 'Member added to company successfully',
      user: updated,
    };
  },

  async removeMemberFromCompany(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw HttpException.NotFound(ErrorCodes.UserNotFound);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { companyId: null },
      include: {
        role: true,
      },
    });

    return {
      message: 'Member removed from company successfully',
      user: updated,
    };
  },

  async getCompanyChatMessages(chatId: number) {
    if (!chatId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Chat ID is required',
      );
    }

    try {
      const messages = await mesiboService.getChatMessages({
        query: { gid: chatId },
      } as any);
      return messages;
    } catch (error) {
      console.error('Error fetching company chat messages:', error);
      throw HttpException.BadRequest(
        ErrorCodes.Internal,
        'Failed to fetch chat messages',
      );
    }
  },

  // ===================
  // Points Module Methods (NEW)
  // ===================
  async getAllPoints(dto: PaginateDto, filters: any = {}) {
    const where: any = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Verified filter
    if (filters.verified !== undefined) {
      where.verified = filters.verified === 'true';
    }

    // Type filter
    if (filters.type) {
      where.type = filters.type;
    }

    // Rating range filter
    if (filters.minRating) {
      where.reviews_rating = { gte: parseInt(filters.minRating) };
    }

    // Sorting
    let orderBy: any = { id: 'desc' };
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy = { [filters.sortBy]: sortOrder };
    }

    return await paginate({
      modelName: 'Point',
      where,
      include: {
        chat: true,
        _count: {
          select: {
            PointReview: true,
          },
        },
      },
      orderBy,
      ...dto,
    });
  },

  async getPointById(pointId: number) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
      include: {
        chat: true,
        PointReview: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    return point;
  },

  async createPoint(data: any) {
    const newPoint = await prisma.point.create({
      data: {
        origId: data.origId || `point_${Date.now()}`,
        type: data.type,
        name: data.name,
        address: data.address,
        longitude: data.longitude,
        latitude: data.latitude,
        number_of_parking_spots: data.number_of_parking_spots
          ? parseInt(data.number_of_parking_spots)
          : null,
        bookable: data.bookable || false,
        price_per_night: data.price_per_night || null,
        verified: data.verified || false,
        icon_url: data.icon_url || null,
        rchat: data.rchat ? parseInt(data.rchat) : 50,
      },
      include: {
        chat: true,
      },
    });

    return newPoint;
  },

  async updatePoint(pointId: number, data: any) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const updated = await prisma.point.update({
      where: { id: pointId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.longitude && { longitude: data.longitude }),
        ...(data.latitude && { latitude: data.latitude }),
        ...(data.number_of_parking_spots !== undefined && {
          number_of_parking_spots: parseInt(data.number_of_parking_spots),
        }),
        ...(data.bookable !== undefined && { bookable: data.bookable }),
        ...(data.price_per_night !== undefined && {
          price_per_night: data.price_per_night,
        }),
        ...(data.verified !== undefined && { verified: data.verified }),
        ...(data.icon_url && { icon_url: data.icon_url }),
        ...(data.rchat !== undefined && { rchat: parseInt(data.rchat) }),
        ...(data.type && { type: data.type }),
      },
      include: {
        chat: true,
      },
    });

    return updated;
  },

  async deletePoint(pointId: number) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    await prisma.point.delete({
      where: { id: pointId },
    });

    return { message: 'Point deleted successfully' };
  },

  async verifyPoint(pointId: number, verified: boolean) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const updated = await prisma.point.update({
      where: { id: pointId },
      data: { verified },
    });

    return {
      message: `Point ${verified ? 'verified' : 'unverified'} successfully`,
      point: updated,
    };
  },

  async getPointReviews(pointId: number) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const reviews = await prisma.pointReview.findMany({
      where: { pointId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  },

  async deletePointReview(reviewId: number) {
    const review = await prisma.pointReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    await prisma.pointReview.delete({
      where: { id: reviewId },
    });

    // Recalculate point rating
    await this.recalculatePointRating(review.pointId);

    return { message: 'Review deleted successfully' };
  },

  async recalculatePointRating(pointId: number) {
    const point = await prisma.point.findUnique({
      where: { id: pointId },
    });

    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound);
    }

    const reviews = await prisma.pointReview.findMany({
      where: { pointId },
    });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    const updated = await prisma.point.update({
      where: { id: pointId },
      data: {
        reviews_rating: avgRating,
        reviews_count: reviewCount,
      },
    });

    return {
      message: 'Point rating recalculated successfully',
      point: updated,
    };
  },

  async getPointChatMessages(chatId: number) {
    if (!chatId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Chat ID is required',
      );
    }

    try {
      const messages = await mesiboService.getChatMessages({
        query: { gid: chatId },
      } as any);
      return messages;
    } catch (error) {
      console.error('Error fetching point chat messages:', error);
      throw HttpException.BadRequest(
        ErrorCodes.Internal,
        'Failed to fetch chat messages',
      );
    }
  },

  // ===================
  // Questions Module Methods
  // ===================
  async getAllQuestions(dto: PaginateDto, filters: any = {}) {
    const where: any = {};

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Section filter
    if (filters.sectionId) {
      where.sectionId = parseInt(filters.sectionId);
    }

    // Subsection filter
    if (filters.subsectionId) {
      where.subsectionId = parseInt(filters.subsectionId);
    }

    // Resolved filter
    if (filters.resolved !== undefined) {
      where.resolved = filters.resolved === 'true';
    }

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Sorting
    let orderBy: any = { id: 'desc' };
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy = { [filters.sortBy]: sortOrder };
    }

    return await paginate({
      modelName: 'Question',
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        section: {
          include: {
            translations: true,
          },
        },
        subsection: {
          include: {
            translations: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy,
      ...dto,
    });
  },

  async getQuestionById(questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        section: true,
        subsection: true,
        answers: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        bestAnswer: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                photo: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    return question;
  },

  async updateQuestion(questionId: number, data: any) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.sectionId !== undefined && {
          sectionId: parseInt(data.sectionId),
        }),
        ...(data.subsectionId !== undefined && {
          subsectionId: data.subsectionId ? parseInt(data.subsectionId) : null,
        }),
      },
      include: {
        creator: true,
        section: true,
        subsection: true,
      },
    });

    return updated;
  },

  async toggleResolveQuestion(questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { resolved: !question.resolved },
      include: {
        creator: true,
        section: true,
        subsection: true,
      },
    });

    return {
      message: `Question marked as ${updated.resolved ? 'resolved' : 'unresolved'}`,
      question: updated,
    };
  },

  async getQuestionAnswers(questionId: number) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw HttpException.NotFound(ErrorCodes.QuestionNotFound);
    }

    const answers = await prisma.answer.findMany({
      where: { questionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return answers;
  },

  async updateAnswer(answerId: number, data: any) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer) {
      throw HttpException.NotFound(ErrorCodes.AnswerNotFound);
    }

    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: {
        ...(data.content && { content: data.content }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            photo: true,
          },
        },
        question: true,
      },
    });

    return updated;
  },

  // Point Instruction Management
  async getAllPointInstructions(
    dto: PaginateDto,
    filters: {
      status?: PointInstructionStatus;
      type?: PointInstructionType;
      pointId?: number;
    } = {},
  ) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.pointId) where.pointId = filters.pointId;

    return await paginate({
      modelName: 'PointInstruction',
      where: Object.keys(where).length ? where : undefined,
      include: {
        point: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
      ...dto,
    });
  },

  async getPointInstructionById(id: number) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
      include: {
        point: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }

    return instruction;
  },

  async createPointInstruction(data: {
    pointId: number;
    type: PointInstructionType;
    title?: string;
    description?: string;
    latitude?: string;
    longitude?: string;
    status?: PointInstructionStatus;
    creatorId?: number;
  }) {
    if (!data.pointId || !data.type) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'pointId and type are required',
      );
    }

    if (!Object.values(PointInstructionType).includes(data.type)) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'type must be one of ENTRANCE, PARKING, REGISTRATION, EXIT',
      );
    }

    if (
      data.status !== undefined &&
      !Object.values(PointInstructionStatus).includes(data.status)
    ) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'status must be one of PENDING, APPROVED, REJECTED',
      );
    }

    const point = await prisma.point.findUnique({
      where: { id: data.pointId },
    });
    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Point not found');
    }

    return prisma.pointInstruction.create({
      data: {
        pointId: data.pointId,
        type: data.type,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        status:
          data.status !== undefined
            ? data.status
            : PointInstructionStatus.APPROVED,
        creatorId: data.creatorId,
      },
      include: {
        point: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  },

  async updatePointInstruction(
    id: number,
    data: {
      pointId?: number;
      type?: PointInstructionType;
      title?: string | null;
      description?: string | null;
      latitude?: string | null;
      longitude?: string | null;
      status?: PointInstructionStatus;
    },
  ) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });
    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }

    if (
      data.type !== undefined &&
      !Object.values(PointInstructionType).includes(data.type)
    ) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'type must be one of ENTRANCE, PARKING, REGISTRATION, EXIT',
      );
    }

    if (
      data.status !== undefined &&
      !Object.values(PointInstructionStatus).includes(data.status)
    ) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'status must be one of PENDING, APPROVED, REJECTED',
      );
    }

    if (data.pointId !== undefined) {
      const point = await prisma.point.findUnique({
        where: { id: data.pointId },
      });
      if (!point) {
        throw HttpException.NotFound(ErrorCodes.NotFound, 'Point not found');
      }
    }

    return prisma.pointInstruction.update({
      where: { id },
      data: {
        ...(data.pointId !== undefined && { pointId: data.pointId }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        point: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, username: true },
        },
      },
    });
  },

  async approvePointInstruction(id: number) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });
    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }
    if (instruction.status !== PointInstructionStatus.PENDING) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Instruction is not pending',
      );
    }

    return prisma.pointInstruction.update({
      where: { id },
      data: { status: PointInstructionStatus.APPROVED },
    });
  },

  async rejectPointInstruction(id: number) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });
    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }
    if (instruction.status !== PointInstructionStatus.PENDING) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Instruction is not pending',
      );
    }

    return prisma.pointInstruction.update({
      where: { id },
      data: { status: PointInstructionStatus.REJECTED },
    });
  },

  async deletePointInstruction(id: number) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });
    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }

    await prisma.pointInstruction.delete({ where: { id } });
    return { id };
  },
};
