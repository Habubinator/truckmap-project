import { prisma } from '@database';
import { SubscriptionStatus } from '@prisma/client';
import moment from 'moment';

export const cleanupService = {
  async processExpiredMutes() {
    const now = new Date();

    const expiredMutes = await prisma.userMute.findMany({
      where: {
        expiredAt: {
          lte: now,
        },
      },
    });

    if (expiredMutes.length === 0) {
      console.log('No expired mutes found');
      return { processedMutes: 0 };
    }

    const userIds = expiredMutes.map((mute) => mute.userId);

    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        isMuted: false,
      },
    });

    await prisma.userMute.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });

    console.log(`Processed ${expiredMutes.length} expired mutes`);
    return { processedMutes: expiredMutes.length };
  },

  async processExpiredBans() {
    const now = new Date();

    const expiredBans = await prisma.userBan.findMany({
      where: {
        expiredAt: {
          lte: now,
        },
      },
    });

    if (expiredBans.length === 0) {
      console.log('No expired bans found');
      return { processedBans: 0 };
    }

    const userIds = expiredBans.map((ban) => ban.userId);

    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: {
        isBanned: false,
      },
    });

    await prisma.userBan.deleteMany({
      where: {
        userId: { in: userIds },
      },
    });

    console.log(`Processed ${expiredBans.length} expired bans`);
    return { processedBans: expiredBans.length };
  },

  async processExpiredSubscriptions() {
    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lte: now,
        },
      },
    });

    if (expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found');
      return { processedSubscriptions: 0 };
    }

    await prisma.subscription.updateMany({
      where: {
        id: {
          in: expiredSubscriptions.map((sub) => sub.id),
        },
      },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    console.log(
      `Processed ${expiredSubscriptions.length} expired subscriptions`,
    );
    return { processedSubscriptions: expiredSubscriptions.length };
  },

  async processInactiveCompanies() {
    const oneMonthAgo = moment().subtract(1, 'month').toDate();

    // Find companies with no members and created more than 1 month ago
    const inactiveCompanies = await prisma.company.findMany({
      where: {
        createdAt: {
          lte: oneMonthAgo,
        },
        members: {
          none: {},
        },
      },
    });

    if (inactiveCompanies.length === 0) {
      console.log('No inactive companies found');
      return { processedCompanies: 0 };
    }

    // Delete inactive companies
    await prisma.company.deleteMany({
      where: {
        id: {
          in: inactiveCompanies.map((company) => company.id),
        },
      },
    });

    console.log(`Processed ${inactiveCompanies.length} inactive companies`);
    return { processedCompanies: inactiveCompanies.length };
  },

  async runAllCleanupTasks() {
    console.log(`Starting cleanup tasks at ${new Date().toISOString()}`);

    try {
      const [muteResults, banResults, subscriptionResults, companyResults] =
        await Promise.all([
          this.processExpiredMutes(),
          this.processExpiredBans(),
          this.processExpiredSubscriptions(),
          this.processInactiveCompanies(),
        ]);

      const totalProcessed =
        muteResults.processedMutes +
        banResults.processedBans +
        subscriptionResults.processedSubscriptions +
        companyResults.processedCompanies;

      console.log(`Cleanup completed. Total processed: ${totalProcessed}`);

      return {
        success: true,
        processedMutes: muteResults.processedMutes,
        processedBans: banResults.processedBans,
        processedSubscriptions: subscriptionResults.processedSubscriptions,
        processedCompanies: companyResults.processedCompanies,
        totalProcessed,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Cleanup task failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
      };
    }
  },
};
