import { prisma, ReportType, ReportStatus } from '@database';
import { paginate } from '@common/pagination';
import {
  UpdateUserDescriptionDto,
  UserSearchDto,
  CreateCompanyDto,
  UpdateUserSocialMediaDto,
} from '../dto';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import { FriendshipStatus } from '@user/enums';
import { mesiboService } from '@mesibo/services';
import { AuthorizedRequest } from '@auth/types';
import { Point } from '@prisma/client';
import { messageOne } from '@firebase';
import { AppNotification } from '@firebase/enums';
import { PaginateDto } from '@common/dto';
import { getLang } from '@common/locales';
import { resolveLocale, i18n } from '@common/locales';
class UserService {
  async findAll(dto: UserSearchDto) {
    return await paginate({
      modelName: 'User',
      where: {
        OR: [
          { username: { contains: dto.username, mode: 'insensitive' } },
          { name: { contains: dto.username, mode: 'insensitive' } },
        ],
      },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      ...dto,
    });
  }

  async findOne(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });
    if (user) {
      return user;
    }
    throw HttpException.BadRequest(ErrorCodes.NotFound);
  }

  async updateUserDescription(dto: UpdateUserDescriptionDto, id: number) {
    if (!id) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    if (dto.username) {
      const exists = await prisma.user.findFirst({
        where: { username: dto.username, id: { not: id } },
      });
      if (exists) {
        throw HttpException.BadRequest(ErrorCodes.Duplicate);
      }
    }
    const oldCompanyId = (await prisma.user.findUnique({ where: { id } }))
      ?.companyId;
    const user = await prisma.user.update({
      where: {
        id,
      },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      data: {
        ...(dto as any),
      },
    });

    await mesiboService.updateUserProfile(user as any);
    if (dto.companyId && dto.companyId != oldCompanyId) {
      if (oldCompanyId) {
        const company = await prisma.company.findUnique({
          where: {
            id: oldCompanyId,
          },
        });
        await mesiboService.deleteUserFromGroup(company.chatId, `${user.id}`);
      }
      const company = await prisma.company.findUnique({
        where: {
          id: dto.companyId,
        },
        select: {
          chatId: true,
        },
      });
      await mesiboService.AddUserToGroup(company.chatId, `${user.id}`);
    }
    return user;
  }

  async updateUserSocialMedia(dto: UpdateUserSocialMediaDto, id: number) {
    if (!id) {
      throw HttpException.BadRequest(ErrorCodes.NotFound);
    }

    const user = await prisma.user.update({
      where: {
        id,
      },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      data: {
        ...(dto as any),
      },
    });

    return user;
  }

  async me(id: number) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });
    return user;
  }

  async sendOrAcceptFriendRequest(userId: number, targetId: number) {
    if (userId == targetId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'You cant be friends with yourself',
      );
    }

    const existingReverse = await prisma.friends.findUnique({
      where: {
        forId_friendId: {
          forId: targetId,
          friendId: userId,
        },
      },
      include: {
        for: {
          select: { language: true },
        },
      },
    });

    if (existingReverse) {
      const userName = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          username: true,
          name: true,
          id: true,
        },
      });

      try {
        await messageOne(
          targetId,
          {
            title: i18n.__.call(
              { locale: existingReverse.for.language },
              'notifications.friend_accept.title',
            ),
            body: i18n.__.call(
              { locale: existingReverse.for.language },
              'notifications.friend_accept.body',
              userName?.username || userName.name || userName.id,
            ),
            type: AppNotification.FriendInviteAccepted,
            id: `${userId}`,
          },
          userId,
        );
      } catch (error) {
        console.warn(error);
      }
      return await prisma.friends.update({
        where: {
          forId_friendId: {
            forId: targetId,
            friendId: userId,
          },
        },
        data: {
          status: FriendshipStatus.Accepted,
        },
      });
    }

    const alreadySent = await prisma.friends.findUnique({
      where: {
        forId_friendId: {
          forId: userId,
          friendId: targetId,
        },
      },
      include: {
        friend: {
          select: { language: true },
        },
      },
    });

    if (alreadySent) {
      throw HttpException.BadRequest(
        ErrorCodes.Duplicate,
        'Friend request already sent',
      );
    }

    const userName = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        username: true,
        name: true,
        id: true,
      },
    });
    const lang = await prisma.user.findUnique({
      where: {
        id: targetId,
      },
      select: {
        language: true,
      },
    });
    try {
      await messageOne(
        targetId,
        {
          title: i18n.__.call(
            { locale: lang.language },
            'notifications.friend_send.title',
          ),
          body: i18n.__.call(
            { locale: lang.language },
            'notifications.friend_send.body',
            userName?.username || userName.name || userName.id,
          ),
          type: AppNotification.FriendInviteRecieved,
          id: `${userId}`,
        },
        userId,
      );
    } catch (error) {
      console.warn(error);
    }

    return await prisma.friends.create({
      data: {
        forId: userId,
        friendId: targetId,
        status: FriendshipStatus.Pending,
      },
    });
  }

  async denyOrDeleteFriendRequest(userId: number, targetId: number) {
    if (userId == targetId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'You cant be friends with yourself',
      );
    }

    const incomingRequest = await prisma.friends.findUnique({
      where: {
        forId_friendId: {
          forId: targetId,
          friendId: userId,
        },
      },
      include: {
        for: true,
      },
    });

    if (incomingRequest) {
      if (incomingRequest.status == FriendshipStatus.Pending) {
        try {
          await messageOne(
            targetId,
            {
              title: i18n.__.call(
                { locale: incomingRequest.for.language },
                'notifications.friend_reject.title',
              ),
              body: i18n.__.call(
                { locale: incomingRequest.for.language },
                'notifications.friend_reject.body',
                incomingRequest.for?.username ||
                  incomingRequest.for.name ||
                  incomingRequest.for.id,
              ),
              type: AppNotification.FriendInviteRejected,
              id: `${userId}`,
            },
            userId,
          );
        } catch (error) {
          console.warn(error);
        }
      }
      return await prisma.friends.delete({
        where: {
          forId_friendId: {
            forId: targetId,
            friendId: userId,
          },
        },
      });
    }

    const outgoingRequest = await prisma.friends.findUnique({
      where: {
        forId_friendId: {
          forId: userId,
          friendId: targetId,
        },
      },
    });

    if (outgoingRequest) {
      return await prisma.friends.delete({
        where: {
          forId_friendId: {
            forId: userId,
            friendId: targetId,
          },
        },
      });
    }

    throw HttpException.BadRequest(
      ErrorCodes.NotFound,
      'Friend request not found',
    );
  }

  async getFriends(forId: number) {
    return {
      friends: await prisma.user.findMany({
        where: {
          id: {
            not: forId,
          },
          OR: [
            {
              friendsInitiated: {
                some: {
                  OR: [{ forId }, { friendId: forId }],
                  status: FriendshipStatus.Accepted,
                },
              },
            },
            {
              friendsReceived: {
                some: {
                  OR: [{ forId }, { friendId: forId }],
                  status: FriendshipStatus.Accepted,
                },
              },
            },
          ],
        },
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
          company: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      }),
      invitesSent: await prisma.user.findMany({
        where: {
          id: {
            not: forId,
          },
          friendsReceived: {
            some: {
              forId,
              status: FriendshipStatus.Pending,
            },
          },
        },
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
          company: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      }),
      invitesIncoming: await prisma.user.findMany({
        where: {
          id: {
            not: forId,
          },
          friendsInitiated: {
            some: {
              friendId: forId,
              status: FriendshipStatus.Pending,
            },
          },
        },
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
          company: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
        },
      }),
    };
  }

  async logLocation(req: AuthorizedRequest) {
    const { longitude, latitude, reason } = req.body;
    const userId = req.user.id;
    return await prisma.locationLog.create({
      data: {
        userId,
        longitude,
        latitude,
        reason: reason || '',
      },
    });
  }

  async updateLocation(req: AuthorizedRequest) {
    const { longitude, latitude } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        latitude,
        longitude,
        // Самый часто-вызываемый ендпоинт, потому можно сразу тречить изменения языка
        language: resolveLocale(getLang(req)),
      },
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

    let closestChatId = 0;
    try {
      const nearest = await this.getClosestParkings(req);
      closestChatId = nearest[0]?.chatid ?? 0;
    } catch (err) {
      console.error('Error fetching nearest parkings:', err);
    }

    const oldChatId = user.closestParkingChatId ?? 0;
    const newChatId = closestChatId;

    if (oldChatId === newChatId) {
      return user;
    }

    if (oldChatId) {
      try {
        await mesiboService.deleteUserFromGroup(oldChatId, `${userId}`);
      } catch (err) {
        console.warn(
          `Failed to remove user ${userId} from group ${oldChatId}:`,
          err,
        );
      }
    }

    if (newChatId) {
      try {
        await mesiboService.AddUserToGroup(newChatId, `${userId}`);
      } catch (err) {
        console.error(
          `Failed to add user ${userId} to group ${newChatId}:`,
          err,
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { closestParkingChatId: newChatId },
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

    return updatedUser;
  }

  // async getClosestParking(req: AuthorizedRequest): Promise<Point[]> {
  //   const { longitude, latitude } = await prisma.user.findUnique({
  //     where: { id: req.user.id },
  //     select: { latitude: true, longitude: true },
  //   });

  //   if (!longitude || !latitude) {
  //     return [];
  //   }

  //   return await prisma.$queryRaw`
  //     SELECT
  //       p.*,
  //       (6371 * acos(
  //         cos(radians(CAST(${latitude} AS double precision))) *
  //         cos(radians(CAST(p.latitude AS double precision))) *
  //         cos(
  //           radians(CAST(p.longitude AS double precision))
  //           - radians(CAST(${longitude} AS double precision))
  //         ) +
  //         sin(radians(CAST(${latitude} AS double precision))) *
  //         sin(radians(CAST(p.latitude AS double precision)))
  //       ) * 1000) AS distance_meters
  //     FROM "points" AS p
  //     WHERE
  //       p.latitude IS NOT NULL
  //       AND p.longitude IS NOT NULL
  //       AND (
  //         6371 * acos(
  //           cos(radians(CAST(${latitude} AS double precision))) *
  //           cos(radians(CAST(p.latitude AS double precision))) *
  //           cos(
  //             radians(CAST(p.longitude AS double precision))
  //             - radians(CAST(${longitude} AS double precision))
  //           ) +
  //           sin(radians(CAST(${latitude} AS double precision))) *
  //           sin(radians(CAST(p.latitude AS double precision)))
  //         ) * 1000
  //       ) <= p.rchat
  //     ORDER BY distance_meters
  //     LIMIT 1;
  //   `;
  // }

  async getClosestParkings(req: AuthorizedRequest): Promise<Point[]> {
    const { longitude, latitude } = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { latitude: true, longitude: true },
    });

    if (!longitude || !latitude) {
      return [];
    }

    return await prisma.$queryRaw`
    WITH parking_distances AS (
      SELECT *,
        (
          6371 * 1000 * acos(
            cos(radians(CAST(${latitude} AS double precision))) *
            cos(radians(CAST("latitude" AS double precision))) *
            cos(radians(CAST("longitude" AS double precision)) - radians(CAST(${longitude} AS double precision))) +
            sin(radians(CAST(${latitude} AS double precision))) *
            sin(radians(CAST("latitude" AS double precision)))
          )
        ) AS distance_meters
      FROM "points"
      WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL
    )
    SELECT *,
      CASE 
        -- Приоритет 1: в радиусе паркинга
        WHEN "rchat" IS NOT NULL AND distance_meters <= "rchat" THEN 1
        -- Приоритет 2: ближе 50 метров
        WHEN distance_meters <= 50 THEN 2
        ELSE 3
      END AS priority
    FROM parking_distances
    WHERE 
      -- Условие 1: в радиусе паркинга (самый важный)
      ("rchat" IS NOT NULL AND distance_meters <= "rchat")
      OR 
      -- Условие 2: ближе 50 метров
      (distance_meters <= 50)
    ORDER BY priority ASC, distance_meters ASC
    LIMIT 20;
  `;
  }

  async getNotifications(userId: number, dto: PaginateDto) {
    const paginateData = await paginate({
      modelName: 'NotificationList',
      where: { userId },
      include: {
        fromUser: {
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
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...dto,
    });
    return {
      ...paginateData,
      unreadCount: await prisma.notificationList.count({
        where: { userId, isRead: false },
      }),
    };
  }

  async markAsRead(notificationId: string) {
    return await prisma.notificationList.update({
      where: { uuid: notificationId },
      data: { isRead: true },
    });
  }

  async getQuestionAnswerStats(id: number) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
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
        company: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            Answer: true,
            questions: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const bestAnswersCount = await prisma.answer.count({
      where: {
        authorId: id,
        bestForQuestion: {
          isNot: null,
        },
      },
    });

    const uselessAnswersCount = await prisma.answer.count({
      where: {
        authorId: id,
        markedAsIrrelevant: true,
      },
    });

    return {
      stats: {
        totalQuestions: user._count.questions,
        totalAnswers: user._count.Answer,
        bestAnswers: bestAnswersCount,
        uselessAnswers: uselessAnswersCount,
      },
    };
  }

  async createReport(
    userId: number,
    reportData: {
      type: ReportType;
      category: string;
      reason: string;
      description?: string;
      reportedId?: number;
      metadata?: any;
    },
  ) {
    // Validate report type
    const validTypes = Object.values(ReportType);
    if (!validTypes.includes(reportData.type)) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Invalid report type',
      );
    }

    // Validate required fields
    if (!reportData.category || !reportData.reason) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Category and reason are required',
      );
    }

    // If reporting a user, validate that the user exists
    if (reportData.reportedId) {
      const reportedUser = await prisma.user.findUnique({
        where: { id: reportData.reportedId },
        select: { id: true },
      });

      if (!reportedUser) {
        throw HttpException.BadRequest(
          ErrorCodes.NotFound,
          'Reported user not found',
        );
      }

      // Prevent self-reporting
      if (reportData.reportedId === userId) {
        throw HttpException.BadRequest(
          ErrorCodes.BadRequest,
          'You cannot report yourself',
        );
      }
    }

    // Check for duplicate recent reports (same user, same type, same target within 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const recentReport = await prisma.report.findFirst({
      where: {
        userId,
        type: reportData.type,
        reportedId: reportData.reportedId,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (recentReport) {
      throw HttpException.BadRequest(
        ErrorCodes.Duplicate,
        'You have already submitted a similar report in the last 24 hours',
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        userId,
        type: reportData.type as ReportType,
        category: reportData.category,
        reason: reportData.reason,
        description: reportData.description,
        reportedId: reportData.reportedId,
        metadata: reportData.metadata,
        status: ReportStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        reportedUser: reportData.reportedId
          ? {
              select: {
                id: true,
                username: true,
                name: true,
              },
            }
          : undefined,
      },
    });

    return report;
  }

  async getUserReports(userId: number, dto: PaginateDto) {
    return await paginate({
      modelName: 'Report',
      where: { userId },
      include: {
        reportedUser: {
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
  }

  async createCompany(dto: CreateCompanyDto, userId: number) {
    const existingCompany = await prisma.company.findUnique({
      where: { label: dto.label },
    });

    if (existingCompany) {
      throw HttpException.BadRequest(ErrorCodes.Duplicate);
    }

    const company = await prisma.company.create({
      data: {
        label: dto.label,
        status: 'PENDING',
        creatorId: userId,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return company;
  }
}

export const userService = new UserService();
