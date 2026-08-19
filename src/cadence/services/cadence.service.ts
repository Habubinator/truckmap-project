import { prisma } from '@database';
import { paginate } from '@common/pagination';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import {
  CreateCadenceDto,
  UpdateCadenceDto,
  CadenceSearchDto,
  CreateCadenceWeekDto,
  UpdateCadenceWeekDto,
  CreateCadenceDayDto,
  UpdateCadenceDayDto,
  CadenceDaySearchDto,
  UpdateCadenceDatesDto,
  OpenShiftDto,
  UpdateOpenShiftDto,
  CloseShiftDto,
  DayOffDto,
} from '../dto';

class CadenceService {
  async createCadence(dto: CreateCadenceDto, userId: number) {
    // Validate that user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'User not found');
    }

    // Check for overlapping cadences
    const overlapping = await prisma.cadence.findFirst({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startDate: { lte: dto.startDate } },
              { endDate: { gte: dto.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: dto.endDate } },
              { endDate: { gte: dto.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: dto.startDate } },
              { endDate: { lte: dto.endDate } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Cadence dates overlap with existing cadence',
      );
    }

    // Create cadence with automatic weeks and days
    const cadence = await prisma.cadence.create({
      data: {
        ...dto,
        userId,
      },
    });

    // Generate weeks and days automatically
    await this.generateWeeksAndDays(
      cadence.id,
      dto.startDate,
      dto.endDate,
      dto.mileageStart,
    );

    // Return cadence with generated weeks and days
    return await prisma.cadence.findUnique({
      where: { id: cadence.id },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
            emailVerifiedAt: true,
          },
        },
        weeks: {
          include: {
            days: {
              orderBy: { start: 'asc' },
            },
          },
          orderBy: { start: 'asc' },
        },
        _count: {
          select: {
            weeks: true,
            days: true,
          },
        },
      },
    });
  }

  private async generateWeeksAndDays(
    cadenceId: number,
    startDate: Date,
    endDate: Date,
    mileageStart: number,
  ) {
    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);
    let isFirstDay = true;

    while (currentDate <= finalDate) {
      // Find Monday of this week
      const weekStart = new Date(currentDate);
      const dow = weekStart.getDay(); // 0=Sun, 1=Mon
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      weekStart.setDate(weekStart.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);

      const createdWeek = await prisma.cadenceWeek.create({
        data: {
          cadenceId,
          start: weekStart,
          end: weekEnd,
        },
      });

      // Always create exactly 7 days (Mon-Sun)
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + d);
        dayDate.setHours(0, 0, 0, 0);

        await prisma.cadenceDay.create({
          data: {
            weekId: createdWeek.id,
            cadenceId,
            date: dayDate,
            dayOfWeek: d + 1, // 1=Mon..7=Sun
            mileageStart: isFirstDay ? mileageStart : null,
          },
        });

        isFirstDay = false;
      }

      // Move to next Monday
      currentDate = new Date(weekEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private async regenerateWeeksAndDays(
    cadenceId: number,
    startDate: Date,
    endDate: Date,
    _dayLength: number,
    preserveExistingData = true,
  ) {
    const existingDaysMap = new Map<
      string,
      {
        date: Date;
        start: Date | null;
        end: Date | null;
        drivingHours: number | null;
        mileageStart: number | null;
        mileageEnd: number | null;
        wasPause: boolean;
        isShiftOpen: boolean;
        isShiftClosed: boolean;
        isDayOff: boolean;
        notes: string | null;
      }
    >();

    if (preserveExistingData) {
      const existingDays = await prisma.cadenceDay.findMany({
        where: { cadenceId },
        select: {
          date: true,
          start: true,
          end: true,
          drivingHours: true,
          mileageStart: true,
          mileageEnd: true,
          wasPause: true,
          isShiftOpen: true,
          isShiftClosed: true,
          isDayOff: true,
          notes: true,
        },
      });

      for (const day of existingDays) {
        const key = day.date.toISOString().split('T')[0];
        existingDaysMap.set(key, day);
      }
    }

    // Delete existing weeks and days (CASCADE will handle days)
    await prisma.cadenceWeek.deleteMany({
      where: { cadenceId },
    });

    let currentDate = new Date(startDate);
    const finalDate = new Date(endDate);

    while (currentDate <= finalDate) {
      // Find Monday of this week
      const weekStart = new Date(currentDate);
      const dow = weekStart.getDay();
      const mondayOffset = dow === 0 ? -6 : 1 - dow;
      weekStart.setDate(weekStart.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const createdWeek = await prisma.cadenceWeek.create({
        data: {
          cadenceId,
          start: weekStart,
          end: weekEnd,
        },
      });

      // Always create exactly 7 days (Mon-Sun)
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + d);
        dayDate.setHours(0, 0, 0, 0);

        const dateKey = dayDate.toISOString().split('T')[0];
        const existing = existingDaysMap.get(dateKey);

        await prisma.cadenceDay.create({
          data: {
            weekId: createdWeek.id,
            cadenceId,
            date: dayDate,
            dayOfWeek: d + 1,
            ...(existing
              ? {
                  start: existing.start,
                  end: existing.end,
                  drivingHours: existing.drivingHours,
                  mileageStart: existing.mileageStart,
                  mileageEnd: existing.mileageEnd,
                  wasPause: existing.wasPause,
                  isShiftOpen: existing.isShiftOpen,
                  isShiftClosed: existing.isShiftClosed,
                  isDayOff: existing.isDayOff,
                  notes: existing.notes,
                }
              : {
                  mileageStart: null,
                }),
          },
        });
      }

      // Move to next Monday
      currentDate = new Date(weekEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  async findAllCadences(dto: CadenceSearchDto) {
    const where: any = {};

    if (dto.userId) {
      where.userId = dto.userId;
    }

    if (dto.startDate || dto.endDate) {
      where.AND = [];
      if (dto.startDate) {
        where.AND.push({ startDate: { gte: dto.startDate } });
      }
      if (dto.endDate) {
        where.AND.push({ endDate: { lte: dto.endDate } });
      }
    }

    if (dto.truck) {
      where.truck = { contains: dto.truck, mode: 'insensitive' };
    }

    if (dto.minMileage || dto.maxMileage) {
      where.mileageStart = {};
      if (dto.minMileage) {
        where.mileageStart.gte = dto.minMileage;
      }
      if (dto.maxMileage) {
        where.mileageStart.lte = dto.maxMileage;
      }
    }

    if (dto.currency) {
      where.currency = dto.currency;
    }

    return await paginate({
      modelName: 'Cadence',
      where,
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
            emailVerifiedAt: true,
          },
        },
        _count: {
          select: {
            weeks: true,
            days: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
      ...dto,
    });
  }

  async findOneCadence(id: number, includeDetails = true) {
    const cadence = await prisma.cadence.findUnique({
      where: { id },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
            emailVerifiedAt: true,
          },
        },
        ...(includeDetails && {
          weeks: {
            include: {
              days: {
                orderBy: { start: 'asc' },
              },
            },
            orderBy: { start: 'asc' },
          },
        }),
        _count: {
          select: {
            weeks: true,
            days: true,
          },
        },
      },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    return cadence;
  }

  async updateCadence(id: number, dto: UpdateCadenceDto, userId?: number) {
    const cadence = await prisma.cadence.findUnique({
      where: { id },
      select: {
        userId: true,
        startDate: true,
        endDate: true,
        dayLength: true,
      },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // If userId is provided, check ownership
    if (userId && cadence.userId !== userId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'You can only update your own cadences',
      );
    }

    // Determine the new dates and dayLength for validation and regeneration
    const newStartDate = dto.startDate || cadence.startDate;
    const newEndDate = dto.endDate || cadence.endDate;
    const newDayLength = dto.dayLength || cadence.dayLength;

    // Check for overlapping cadences if dates are being updated
    if (dto.startDate || dto.endDate) {
      const overlapping = await prisma.cadence.findFirst({
        where: {
          id: { not: id },
          userId: cadence.userId,
          OR: [
            {
              AND: [
                { startDate: { lte: newStartDate } },
                { endDate: { gte: newStartDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: newEndDate } },
                { endDate: { gte: newEndDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: newStartDate } },
                { endDate: { lte: newEndDate } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw HttpException.BadRequest(
          ErrorCodes.BadRequest,
          'Updated dates would overlap with existing cadence',
        );
      }
    }

    // Check if dates or dayLength changed and regeneration is needed
    const datesChanged =
      (dto.startDate &&
        dto.startDate.getTime() !== cadence.startDate.getTime()) ||
      (dto.endDate && dto.endDate.getTime() !== cadence.endDate.getTime());

    const dayLengthChanged =
      dto.dayLength && dto.dayLength !== cadence.dayLength;

    // Update the cadence first
    await prisma.cadence.update({
      where: { id },
      data: dto,
    });

    // If dates or dayLength changed, regenerate weeks and days
    if (datesChanged || dayLengthChanged) {
      await this.regenerateWeeksAndDays(
        id,
        newStartDate,
        newEndDate,
        newDayLength,
        true, // preserve existing data where possible
      );
    }

    // Return the updated cadence with regenerated weeks/days
    return await prisma.cadence.findUnique({
      where: { id },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
            emailVerifiedAt: true,
          },
        },
        weeks: {
          include: {
            days: true,
          },
          orderBy: { start: 'asc' },
        },
        _count: {
          select: {
            weeks: true,
            days: true,
          },
        },
      },
    });
  }

  async updateCadenceDates(
    id: number,
    dto: UpdateCadenceDatesDto,
    userId: number,
  ) {
    const cadence = await prisma.cadence.findUnique({
      where: { id, userId },
      select: {
        userId: true,
        startDate: true,
        endDate: true,
        dayLength: true,
      },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // Determine the new dates and dayLength for validation and regeneration
    const newStartDate = dto.startDate || cadence.startDate;
    const newEndDate = dto.endDate || cadence.endDate;
    const newDayLength = dto.dayLength || cadence.dayLength;

    // Validate that endDate is after startDate
    if (newEndDate <= newStartDate) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'End date must be after start date',
      );
    }

    // Check for overlapping cadences if dates are being updated
    if (dto.startDate || dto.endDate) {
      const overlapping = await prisma.cadence.findFirst({
        where: {
          id: { not: id },
          userId,
          OR: [
            {
              AND: [
                { startDate: { lte: newStartDate } },
                { endDate: { gte: newStartDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: newEndDate } },
                { endDate: { gte: newEndDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: newStartDate } },
                { endDate: { lte: newEndDate } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw HttpException.BadRequest(
          ErrorCodes.BadRequest,
          'Updated dates would overlap with existing cadence',
        );
      }
    }

    // Check if dates or dayLength changed and regeneration is needed
    const datesChanged =
      (dto.startDate &&
        dto.startDate.getTime() !== cadence.startDate.getTime()) ||
      (dto.endDate && dto.endDate.getTime() !== cadence.endDate.getTime());

    const dayLengthChanged =
      dto.dayLength && dto.dayLength !== cadence.dayLength;

    // Update the cadence first
    const updateData: any = {};
    if (dto.startDate) updateData.startDate = dto.startDate;
    if (dto.endDate) updateData.endDate = dto.endDate;
    if (dto.dayLength) updateData.dayLength = dto.dayLength;

    await prisma.cadence.update({
      where: { id },
      data: updateData,
    });

    // If dates or dayLength changed, regenerate weeks and days
    if (datesChanged || dayLengthChanged) {
      await this.regenerateWeeksAndDays(
        id,
        newStartDate,
        newEndDate,
        newDayLength,
        true, // preserve existing data where possible
      );
    }

    // Return the updated cadence with regenerated weeks/days
    return await prisma.cadence.findUnique({
      where: { id },
      include: {
        user: {
          omit: {
            roleId: true,
            emailVerificationKey: true,
            passwordHash: true,
            createdAt: true,
            updatedAt: true,
            emailVerifiedAt: true,
          },
        },
        weeks: {
          include: {
            days: true,
          },
          orderBy: { start: 'asc' },
        },
        _count: {
          select: {
            weeks: true,
            days: true,
          },
        },
      },
    });
  }

  async deleteCadence(id: number, userId?: number) {
    const cadence = await prisma.cadence.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // If userId is provided, check ownership
    if (userId && cadence.userId !== userId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'You can only delete your own cadences',
      );
    }

    return await prisma.cadence.delete({
      where: { id },
    });
  }

  async updateCadenceFinished(
    id: number,
    isFinished: boolean,
    userId?: number,
  ) {
    const cadence = await prisma.cadence.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // If userId is provided, check ownership
    if (userId && cadence.userId !== userId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'You can only update your own cadences',
      );
    }

    return await prisma.cadence.update({
      where: { id },
      data: { isFinished },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  // CADENCE WEEK CRUD OPERATIONS

  async createCadenceWeek(dto: CreateCadenceWeekDto, userId: number) {
    // Verify cadence exists
    const cadence = await prisma.cadence.findUnique({
      where: { id: dto.cadenceId, userId },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // Validate week dates are within cadence period
    if (dto.start < cadence.startDate || dto.end > cadence.endDate) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Week dates must be within cadence period',
      );
    }

    return await prisma.cadenceWeek.create({
      data: dto,
      include: {
        cadence: {
          select: { id: true, label: true, userId: true },
        },
        days: {
          orderBy: { start: 'asc' },
        },
      },
    });
  }

  async findCadenceWeeks(cadenceId: number, userId: number) {
    return await prisma.cadenceWeek.findMany({
      where: {
        cadenceId,
        cadence: {
          userId,
        },
      },
      include: {
        days: {
          orderBy: { start: 'asc' },
        },
        _count: {
          select: {
            days: true,
          },
        },
      },
      orderBy: { start: 'asc' },
    });
  }

  async updateCadenceWeek(
    id: number,
    dto: UpdateCadenceWeekDto,
    userId: number,
  ) {
    const week = await prisma.cadenceWeek.findUnique({
      where: {
        id,
        cadence: {
          userId,
        },
      },
      include: { cadence: { select: { startDate: true, endDate: true } } },
    });

    if (!week) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Week not found');
    }

    // Validate updated dates are within cadence period
    const newStart = dto.start || week.start;
    const newEnd = dto.end || week.end;

    if (newStart < week.cadence.startDate || newEnd > week.cadence.endDate) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Week dates must be within cadence period',
      );
    }

    return await prisma.cadenceWeek.update({
      where: { id },
      data: dto,
      include: {
        cadence: {
          select: { id: true, label: true, userId: true },
        },
        days: {
          orderBy: { start: 'asc' },
        },
      },
    });
  }

  async deleteCadenceWeek(id: number, userId: number) {
    const week = await prisma.cadenceWeek.findUnique({
      where: {
        id,
        cadence: {
          userId,
        },
      },
    });

    if (!week) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Week not found');
    }

    return await prisma.cadenceWeek.delete({
      where: { id },
    });
  }

  // CADENCE DAY CRUD OPERATIONS

  async createCadenceDay(dto: CreateCadenceDayDto, userId: number) {
    // Verify week and cadence exist
    const week = await prisma.cadenceWeek.findUnique({
      where: {
        id: dto.weekId,
        cadence: {
          userId,
        },
      },
      include: { cadence: { select: { id: true } } },
    });

    if (!week) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Week not found');
    }

    if (week.cadence.id !== dto.cadenceId) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Week does not belong to specified cadence',
      );
    }

    // Validate day dates are within week period
    // if (dto.start < week.start || dto.end > week.end) {
    //   throw HttpException.BadRequest(
    //     ErrorCodes.BadRequest,
    //     'Day dates must be within week period',
    //   );
    // }

    return await prisma.cadenceDay.create({
      data: { ...dto } as any,
      include: {
        week: {
          select: { id: true, start: true, end: true },
        },
        cadence: {
          select: { id: true, label: true, userId: true },
        },
      },
    });
  }

  async findCadenceDays(dto: CadenceDaySearchDto, userId: number) {
    const where: any = {
      cadence: {
        userId,
      },
    };

    if (dto.cadenceId) {
      where.cadenceId = dto.cadenceId;
    }

    if (dto.weekId) {
      where.weekId = dto.weekId;
    }

    if (dto.startDate || dto.endDate) {
      where.AND = [];
      if (dto.startDate) {
        where.AND.push({ start: { gte: dto.startDate } });
      }
      if (dto.endDate) {
        where.AND.push({ end: { lte: dto.endDate } });
      }
    }

    if (dto.minMileage || dto.maxMileage) {
      where.mileageStart = {};
      if (dto.minMileage) {
        where.mileageStart.gte = dto.minMileage;
      }
      if (dto.maxMileage) {
        where.mileageStart.lte = dto.maxMileage;
      }
    }

    return await paginate({
      modelName: 'CadenceDay',
      where,
      include: {
        week: {
          select: { id: true, start: true, end: true },
        },
        cadence: {
          select: { id: true, label: true, userId: true },
        },
      },
      orderBy: { start: 'asc' },
      ...dto,
    });
  }

  async updateCadenceDay(id: number, dto: UpdateCadenceDayDto, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: {
        id,
        cadence: {
          userId,
        },
      },
      include: { week: { select: { start: true, end: true } } },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    if (day.isShiftClosed) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Cannot edit a closed shift',
      );
    }

    return await prisma.cadenceDay.update({
      where: { id },
      data: dto,
      include: {
        week: {
          select: { id: true, start: true, end: true },
        },
        cadence: {
          select: { id: true, label: true, userId: true },
        },
      },
    });
  }

  async deleteCadenceDay(id: number, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: {
        id,
        cadence: {
          userId,
        },
      },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    return await prisma.cadenceDay.delete({
      where: { id },
    });
  }

  // SHIFT OPERATIONS

  async openShift(dayId: number, dto: OpenShiftDto, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: {
        id: dayId,
        cadence: { userId },
      },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    if (day.isShiftOpen || day.isShiftClosed || day.isDayOff) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Day already has an active shift, closed shift, or is marked as day off',
      );
    }

    // If mileageStart not provided, try to get from previous closed day
    let mileageStart = dto.mileageStart ?? null;
    if (mileageStart === null) {
      const prevDay = await prisma.cadenceDay.findFirst({
        where: {
          cadenceId: day.cadenceId,
          isShiftClosed: true,
          mileageEnd: { not: null },
          date: { lt: day.date },
        },
        orderBy: { date: 'desc' },
        select: { mileageEnd: true },
      });

      if (prevDay?.mileageEnd) {
        mileageStart = prevDay.mileageEnd;
      }
    }

    return await prisma.cadenceDay.update({
      where: { id: dayId },
      data: {
        isShiftOpen: true,
        start: dto.startTime,
        mileageStart,
      },
      include: {
        week: { select: { id: true, start: true, end: true } },
        cadence: { select: { id: true, label: true, userId: true } },
      },
    });
  }

  async updateOpenShift(dayId: number, dto: UpdateOpenShiftDto, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: { id: dayId, cadence: { userId } },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    if (!day.isShiftOpen) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest, 'Shift is not open');
    }

    if (day.isShiftClosed) {
      throw HttpException.BadRequest(ErrorCodes.BadRequest, 'Shift is already closed');
    }

    return await prisma.cadenceDay.update({
      where: { id: dayId },
      data: {
        ...(dto.startTime && { start: dto.startTime }),
        ...(dto.mileageStart !== undefined && { mileageStart: dto.mileageStart }),
      },
      include: {
        week: { select: { id: true, start: true, end: true } },
        cadence: { select: { id: true, label: true, userId: true } },
      },
    });
  }

  async closeShift(dayId: number, dto: CloseShiftDto, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: {
        id: dayId,
        cadence: { userId },
      },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    if (!day.isShiftOpen) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Shift is not open',
      );
    }

    if (day.isShiftClosed) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Shift is already closed',
      );
    }

    console.log(
      `[closeShift] dayId=${dayId} userId=${userId} drivingHours=${dto.drivingHours} mileageEnd=${dto.mileageEnd}`,
    );

    return await prisma.cadenceDay.update({
      where: { id: dayId },
      data: {
        isShiftOpen: false,
        isShiftClosed: true,
        end: dto.endTime,
        drivingHours: dto.drivingHours,
        wasPause: dto.wasPause,
        mileageEnd: dto.mileageEnd,
        notes: dto.notes,
      },
      include: {
        week: { select: { id: true, start: true, end: true } },
        cadence: { select: { id: true, label: true, userId: true } },
      },
    });
  }

  async markDayOff(dayId: number, dto: DayOffDto, userId: number) {
    const day = await prisma.cadenceDay.findUnique({
      where: {
        id: dayId,
        cadence: { userId },
      },
    });

    if (!day) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Day not found');
    }

    if (day.isShiftOpen || day.isShiftClosed || day.isDayOff) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Day already has an active shift, closed shift, or is marked as day off',
      );
    }

    return await prisma.cadenceDay.update({
      where: { id: dayId },
      data: {
        isDayOff: true,
        notes: dto.notes,
      },
      include: {
        week: { select: { id: true, start: true, end: true } },
        cadence: { select: { id: true, label: true, userId: true } },
      },
    });
  }

  // STATISTICS METHODS

  async getUserStatistics(userId: number, startDate?: Date, endDate?: Date) {
    const whereCondition: any = {
      cadence: {
        userId,
      },
      isShiftClosed: true,
      start: { not: null },
      end: { not: null },
    };

    // Add date filtering if provided
    if (startDate || endDate) {
      if (!whereCondition.AND) whereCondition.AND = [];
      if (startDate) {
        whereCondition.AND.push({ date: { gte: startDate } });
      }
      if (endDate) {
        whereCondition.AND.push({ date: { lte: endDate } });
      }
    }

    // Get all closed cadence days for the user in the specified period
    const days = await prisma.cadenceDay.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
    });

    if (days.length === 0) {
      return {
        totalDrivingHours: 0,
        totalWorkingHours: 0,
        totalKilometers: 0,
        averageKilometersPerDay: 0,
        averageDrivingHoursPerDay: 0,
        averageWorkingHoursPerDay: 0,
        totalDays: 0,
        periodStart: startDate || null,
        periodEnd: endDate || null,
      };
    }

    const MS_PER_HOUR = 1000 * 60 * 60;
    let totalDrivingHours = 0;
    let totalWorkingHours = 0;
    let totalKilometers = 0;

    for (const day of days) {
      // Use actual driving hours from day record
      totalDrivingHours += day.drivingHours || 0;

      // Calculate actual working hours from shift times
      if (day.start && day.end) {
        totalWorkingHours +=
          (day.end.getTime() - day.start.getTime()) / MS_PER_HOUR;
      }

      // Calculate kilometers (mileageEnd - mileageStart)
      if (day.mileageEnd != null && day.mileageStart != null) {
        totalKilometers += day.mileageEnd - day.mileageStart;
      }
    }

    const totalDays = days.length;

    return {
      totalDrivingHours: parseFloat(totalDrivingHours.toFixed(2)),
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      totalKilometers: parseFloat(totalKilometers.toFixed(2)),
      averageKilometersPerDay: parseFloat(
        (totalKilometers / totalDays).toFixed(2),
      ),
      averageDrivingHoursPerDay: parseFloat(
        (totalDrivingHours / totalDays).toFixed(2),
      ),
      averageWorkingHoursPerDay: parseFloat(
        (totalWorkingHours / totalDays).toFixed(2),
      ),
      totalDays,
      periodStart: startDate || days[0]?.start || null,
      periodEnd: endDate || days[days.length - 1]?.end || null,
    };
  }

  async getAllTimeStatistics(userId: number) {
    return await this.getUserStatistics(userId);
  }

  async getPeriodStatistics(userId: number, startDate: Date, endDate: Date) {
    return await this.getUserStatistics(userId, startDate, endDate);
  }

  async getCadenceStatistics(cadenceId: number, userId: number) {
    // Verify user owns the cadence
    const cadence = await prisma.cadence.findUnique({
      where: { id: cadenceId, userId },
      include: {
        days: {
          where: { isShiftClosed: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    const days = cadence.days;

    if (days.length === 0) {
      return {
        cadenceId,
        cadenceLabel: cadence.label,
        totalDrivingHours: 0,
        totalWorkingHours: 0,
        totalKilometers: 0,
        averageKilometersPerDay: 0,
        averageDrivingHoursPerDay: 0,
        averageWorkingHoursPerDay: 0,
        totalDays: 0,
        startDate: cadence.startDate,
        endDate: cadence.endDate,
      };
    }

    let totalKilometers = 0;
    let totalDrivingHours = 0;
    let totalWorkingHours = 0;

    for (const day of days) {
      if (day.mileageEnd && day.mileageStart) {
        totalKilometers += day.mileageEnd - day.mileageStart;
      }
      totalDrivingHours += day.drivingHours ?? 0;
      if (day.start && day.end) {
        const diffMs =
          new Date(day.end).getTime() - new Date(day.start).getTime();
        totalWorkingHours += diffMs / (1000 * 60 * 60);
      }
    }

    const totalDays = days.length;

    return {
      cadenceId,
      cadenceLabel: cadence.label,
      totalDrivingHours: parseFloat(totalDrivingHours.toFixed(2)),
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      totalKilometers: parseFloat(totalKilometers.toFixed(2)),
      averageKilometersPerDay: parseFloat(
        (totalKilometers / totalDays).toFixed(2),
      ),
      averageDrivingHoursPerDay: parseFloat(
        (totalDrivingHours / totalDays).toFixed(2),
      ),
      averageWorkingHoursPerDay: parseFloat(
        (totalWorkingHours / totalDays).toFixed(2),
      ),
      totalDays,
      startDate: cadence.startDate,
      endDate: cadence.endDate,
    };
  }

  async getMonthlyStatistics(userId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed
    const endDate = new Date(year, month, 0); // last day of month

    const stats = await this.getUserStatistics(userId, startDate, endDate);

    return {
      ...stats,
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('default', {
        month: 'long',
      }),
    };
  }

  async getYearlyStatistics(userId: number, year: number) {
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    const stats = await this.getUserStatistics(userId, startDate, endDate);

    return {
      ...stats,
      year,
    };
  }

  async getCadenceWeeklyStatistics(
    cadenceId: number,
    userId: number,
    lang: string,
  ) {
    const MS_PER_HOUR = 1000 * 60 * 60;

    // Verify user owns the cadence
    const cadence = await prisma.cadence.findUnique({
      where: { id: cadenceId, userId },
      include: {
        weeks: {
          include: {
            days: {
              orderBy: { date: 'asc' },
            },
          },
          orderBy: { start: 'asc' },
        },
      },
    });

    if (!cadence) {
      throw HttpException.BadRequest(ErrorCodes.NotFound, 'Cadence not found');
    }

    // Collect ALL closed days across entire cadence for cross-week 9(15) tracking
    const allClosedDays = cadence.weeks
      .flatMap((w) => w.days)
      .filter((d) => d.isShiftClosed && d.start && d.end)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Build a map: dayId -> previous closed day (for rest period calculation)
    const prevClosedDayMap = new Map<number, (typeof allClosedDays)[0]>();
    for (let i = 1; i < allClosedDays.length; i++) {
      prevClosedDayMap.set(allClosedDays[i].id, allClosedDays[i - 1]);
    }

    // 9(15) counter tracks across weeks (resets on 24h+ rest)
    let reducedRestCounter = 3;

    // Format localized labels
    const hourLabel = lang === 'ru' ? 'ч' : lang === 'ua' ? 'г' : 'h';
    const minuteLabel = lang === 'ru' ? 'м' : lang === 'ua' ? 'хв' : 'm';

    // Process each week using for-loop (need access to previous week results)
    const computedStats: Array<{
      weekNumber: number;
      startDate: Date;
      endDate: Date;
      workingHours: string;
      drivingHours: string;
      remainingExtendedDriving: string;
      remainingReducedRest: string;
      distanceKm: number;
      daysWorked: number;
      details: {
        totalWorkHours: number;
        totalDrivingHours: number;
        maxDrivingHoursThisWeek: number;
        twoWeekDrivingTotal: number;
        extendedDrivingDaysUsed: number;
        reducedRestDeductionsThisWeek: number;
        reducedRestCounterRemaining: number;
        daysWithPause: number;
      };
    }> = [];

    for (let weekIndex = 0; weekIndex < cadence.weeks.length; weekIndex++) {
      const week = cadence.weeks[weekIndex];
      let weekWorkedHours = 0;
      let weekDrivingHours = 0;
      let weekDistance = 0;
      let extendedDrivingDaysUsed = 0;
      let reducedRestDeductionsThisWeek = 0;
      let has3HourPauseCount = 0;
      let closedDayCount = 0;

      // Process each day in the week
      for (const day of week.days) {
        if (day.isDayOff || !day.isShiftClosed || !day.start || !day.end) {
          continue;
        }

        closedDayCount++;
        const actualDrivingHours = day.drivingHours || 0;
        const shiftDuration =
          (day.end.getTime() - day.start.getTime()) / MS_PER_HOUR;

        weekDrivingHours += actualDrivingHours;
        weekWorkedHours += shiftDuration;

        // Distance
        if (day.mileageEnd != null && day.mileageStart != null) {
          weekDistance += day.mileageEnd - day.mileageStart;
        }

        // Extended driving: actual driving > 9h (EU max 2 per week)
        if (actualDrivingHours > 9) {
          extendedDrivingDaysUsed++;
        }

        // 3-hour pause count
        if (day.wasPause) {
          has3HourPauseCount++;
        }

        // 9(15) reduced daily rest calculation
        const prevDay = prevClosedDayMap.get(day.id);
        if (prevDay && prevDay.end) {
          const restHours =
            (day.start.getTime() - prevDay.end.getTime()) / MS_PER_HOUR;

          // 24h+ rest resets counter
          if (restHours >= 24) {
            reducedRestCounter = 3;
            continue;
          }

          let hasURD = false; // Unconditional Reduced Deduction (insufficient rest)
          let hasSEP = false; // Shift Extension Penalty (shift > 13h)

          // Check URD: rest < 11h means reduced rest was taken
          if (restHours < 11) {
            hasURD = true;
          }

          // Check SEP: shift duration > 13h
          if (shiftDuration > 13) {
            // 3h break only protects when rest before was >= 13h
            if (restHours >= 13 && day.wasPause) {
              hasSEP = false;
            } else {
              hasSEP = true;
            }
          }

          // URD + SEP on same day = 1 deduction (not 2)
          if (hasURD || hasSEP) {
            reducedRestCounter = Math.max(0, reducedRestCounter - 1);
            reducedRestDeductionsThisWeek++;
          }
        }
      }

      // Extended driving remaining (max 2 per week)
      const remainingExtendedDriving = Math.max(0, 2 - extendedDrivingDaysUsed);

      // 90h/2-week rolling budget
      const prevWeekDriving =
        weekIndex > 0
          ? computedStats[weekIndex - 1].details.totalDrivingHours
          : 0;
      const twoWeekBudget = 90 - prevWeekDriving;
      const maxDrivingThisWeek = Math.min(56, twoWeekBudget);

      const workHrs = Math.floor(weekWorkedHours);
      const workMins = Math.round((weekWorkedHours - workHrs) * 60);

      computedStats.push({
        weekNumber: weekIndex + 1,
        startDate: week.start,
        endDate: week.end,
        workingHours: `${workHrs}${hourLabel}${workMins}${minuteLabel}`,
        drivingHours: `${weekDrivingHours.toFixed(1)}/${maxDrivingThisWeek}`,
        remainingExtendedDriving: `${remainingExtendedDriving}/2`,
        remainingReducedRest: `${reducedRestCounter}/3`,
        distanceKm: Math.round(weekDistance),
        daysWorked: closedDayCount,
        details: {
          totalWorkHours: parseFloat(weekWorkedHours.toFixed(2)),
          totalDrivingHours: parseFloat(weekDrivingHours.toFixed(2)),
          maxDrivingHoursThisWeek: maxDrivingThisWeek,
          twoWeekDrivingTotal: parseFloat(
            (prevWeekDriving + weekDrivingHours).toFixed(2),
          ),
          extendedDrivingDaysUsed,
          reducedRestDeductionsThisWeek,
          reducedRestCounterRemaining: reducedRestCounter,
          daysWithPause: has3HourPauseCount,
        },
      });
    }

    return {
      cadenceId,
      cadenceLabel: cadence.label,
      cadencePeriod: {
        start: cadence.startDate,
        end: cadence.endDate,
      },
      weeks: computedStats,
      summary: {
        totalWeeks: computedStats.length,
        totalWorkingHours: parseFloat(
          computedStats
            .reduce((sum, week) => sum + week.details.totalWorkHours, 0)
            .toFixed(2),
        ),
        totalDrivingHours: parseFloat(
          computedStats
            .reduce((sum, week) => sum + week.details.totalDrivingHours, 0)
            .toFixed(2),
        ),
        totalDistance: computedStats.reduce(
          (sum, week) => sum + week.distanceKm,
          0,
        ),
        totalDaysWorked: computedStats.reduce(
          (sum, week) => sum + week.daysWorked,
          0,
        ),
      },
    };
  }
}

export const cadenceService = new CadenceService();
