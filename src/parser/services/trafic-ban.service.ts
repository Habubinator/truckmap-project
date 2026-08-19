import { prisma } from '@database';
import { countryToAlpha2 } from 'country-to-iso';
class TraficBanService {
  async getByDate(dateFromRaw?: string | Date, dateToRaw?: string | Date) {
    const dateFrom = this.parseDate(dateFromRaw) || this.startOfToday();
    let dateTo = this.parseDate(dateToRaw);

    if (!dateTo || dateTo < dateFrom) {
      dateTo = dateFrom;
    }

    const traficBans = await prisma.traficBans.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });

    return traficBans.map((ban) => ({
      ...ban,
      countryCode: countryToAlpha2(ban.country),
    }));
  }

  private parseDate(input?: string | Date): Date | null {
    if (!input) return null;
    const date = typeof input === 'string' ? new Date(input) : input;
    return isNaN(date.getTime()) ? null : date;
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}

export const traficBanService = new TraficBanService();
