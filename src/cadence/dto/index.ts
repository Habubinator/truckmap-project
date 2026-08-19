import { Currency } from '@prisma/client';
import { PaginateDto } from '@common/dto';

export interface CreateCadenceArgs {
  label: string;
  startDate: string;
  endDate: string;
  mileageStart: string;
  mileageEnd?: string;
  truck: string;
  truckPhoto?: string;
  dayLength: string;
  wheelTime: string;
  paycheck?: string;
  currency?: Currency;
}

export interface UpdateCadenceArgs {
  label?: string;
  startDate?: string;
  endDate?: string;
  mileageStart?: string;
  mileageEnd?: string;
  truck?: string;
  truckPhoto?: string;
  dayLength?: string;
  wheelTime?: string;
  paycheck?: string;
  currency?: Currency;
}

export interface UpdateCadenceDatesArgs {
  startDate?: string;
  endDate?: string;
  dayLength?: string;
}

export interface CadenceSearchArgs {
  page: number;
  pageSize: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  truck?: string;
  minMileage?: string;
  maxMileage?: string;
  currency?: Currency;
}

export interface CreateCadenceWeekArgs {
  cadenceId: string;
  start: string;
  end: string;
}

export interface UpdateCadenceWeekArgs {
  start?: string;
  end?: string;
}

export interface CreateCadenceDayArgs {
  weekId: string;
  cadenceId: string;
  date: string;
  dayOfWeek: string;
  start: string;
  end: string;
  mileageStart: string;
  mileageEnd?: string;
  wasPause?: string | boolean;
  notes?: string;
}

export interface UpdateCadenceDayArgs {
  startTime?: string;
  endTime?: string;
  mileageStart?: string;
  mileageEnd?: string;
  wasPause?: string;
  notes?: string;
}

export interface CadenceDaySearchArgs {
  page: number;
  pageSize: number;
  cadenceId?: string;
  weekId?: string;
  startDate?: string;
  endDate?: string;
  minMileage?: string;
  maxMileage?: string;
}

export class CreateCadenceDto {
  label: string;
  startDate: Date;
  endDate: Date;
  mileageStart: number;
  mileageEnd?: number;
  truck: string;
  truckPhoto?: string;
  dayLength: number;
  wheelTime: number;
  paycheck?: number;
  currency: Currency;

  constructor(args: CreateCadenceArgs) {
    this.label = args.label;
    this.startDate = new Date(args.startDate);
    this.endDate = new Date(args.endDate);
    this.mileageStart = parseFloat(args.mileageStart);
    this.mileageEnd = args.mileageEnd ? parseFloat(args.mileageEnd) : undefined;
    this.truck = args.truck;
    this.truckPhoto = args.truckPhoto;
    this.dayLength = parseFloat(args.dayLength);
    this.wheelTime = parseFloat(args.wheelTime);
    this.paycheck = args.paycheck ? parseFloat(args.paycheck) : undefined;
    this.currency = args.currency || Currency.USD;
  }
}

export class UpdateCadenceDto {
  label?: string;
  startDate?: Date;
  endDate?: Date;
  mileageStart?: number;
  mileageEnd?: number;
  truck?: string;
  truckPhoto?: string;
  dayLength?: number;
  wheelTime?: number;
  paycheck?: number;
  currency?: Currency;

  constructor(args: UpdateCadenceArgs) {
    this.label = args.label;
    this.startDate = args.startDate ? new Date(args.startDate) : undefined;
    this.endDate = args.endDate ? new Date(args.endDate) : undefined;
    this.mileageStart = args.mileageStart
      ? parseFloat(args.mileageStart)
      : undefined;
    this.mileageEnd = args.mileageEnd ? parseFloat(args.mileageEnd) : undefined;
    this.truck = args.truck;
    this.truckPhoto = args.truckPhoto;
    this.dayLength = args.dayLength ? parseFloat(args.dayLength) : undefined;
    this.wheelTime = args.wheelTime ? parseFloat(args.wheelTime) : undefined;
    this.paycheck = args.paycheck ? parseFloat(args.paycheck) : undefined;
    this.currency = args.currency;
  }
}

export class CadenceSearchDto extends PaginateDto {
  userId?: number;
  startDate?: Date;
  endDate?: Date;
  truck?: string;
  minMileage?: number;
  maxMileage?: number;
  currency?: Currency;

  constructor(args: CadenceSearchArgs) {
    super(args);
    this.userId = args.userId ? parseInt(args.userId) : undefined;
    this.startDate = args.startDate ? new Date(args.startDate) : undefined;
    this.endDate = args.endDate ? new Date(args.endDate) : undefined;
    this.truck = args.truck;
    this.minMileage = args.minMileage ? parseFloat(args.minMileage) : undefined;
    this.maxMileage = args.maxMileage ? parseFloat(args.maxMileage) : undefined;
    this.currency = args.currency;
  }
}

export class CreateCadenceWeekDto {
  cadenceId: number;
  start: Date;
  end: Date;

  constructor(args: CreateCadenceWeekArgs) {
    this.cadenceId = parseInt(args.cadenceId);
    this.start = new Date(args.start);
    this.end = new Date(args.end);
  }
}

export class UpdateCadenceWeekDto {
  start?: Date;
  end?: Date;

  constructor(args: UpdateCadenceWeekArgs) {
    this.start = args.start ? new Date(args.start) : undefined;
    this.end = args.end ? new Date(args.end) : undefined;
  }
}

export class CreateCadenceDayDto {
  weekId: number;
  cadenceId: number;
  date: Date;
  dayOfWeek: number;
  start: Date;
  end: Date;
  mileageStart: number;
  mileageEnd?: number;
  wasPause: boolean;
  notes?: string;

  constructor(args: CreateCadenceDayArgs) {
    this.weekId = parseInt(args.weekId);
    this.cadenceId = parseInt(args.cadenceId);
    this.date = new Date(args.date);
    this.dayOfWeek = parseInt(args.dayOfWeek);
    this.start = new Date(args.start);
    this.end = new Date(args.end);
    this.mileageStart = parseFloat(args.mileageStart);
    this.mileageEnd = args.mileageEnd ? parseFloat(args.mileageEnd) : undefined;
    this.wasPause =
      typeof args.wasPause === 'boolean'
        ? args.wasPause
        : args.wasPause === 'true';
    this.notes = args.notes;
  }
}

export class UpdateCadenceDayDto {
  start?: Date;
  end?: Date;
  mileageStart?: number;
  mileageEnd?: number;
  wasPause?: boolean;
  notes?: string;

  constructor(args: UpdateCadenceDayArgs) {
    this.start = args.startTime ? new Date(args.startTime) : undefined;
    this.end = args.endTime ? new Date(args.endTime) : undefined;
    this.mileageStart = args.mileageStart
      ? parseFloat(args.mileageStart)
      : undefined;
    this.mileageEnd = args.mileageEnd ? parseFloat(args.mileageEnd) : undefined;
    this.wasPause =
      args.wasPause !== undefined
        ? typeof args.wasPause === 'boolean'
          ? args.wasPause
          : args.wasPause === 'true'
        : undefined;
    this.notes = args.notes;
  }
}

export class UpdateCadenceDatesDto {
  startDate?: Date;
  endDate?: Date;
  dayLength?: number;

  constructor(args: UpdateCadenceDatesArgs) {
    this.startDate = args.startDate ? new Date(args.startDate) : undefined;
    this.endDate = args.endDate ? new Date(args.endDate) : undefined;
    this.dayLength = args.dayLength ? parseFloat(args.dayLength) : undefined;
  }
}

export class CadenceDaySearchDto extends PaginateDto {
  cadenceId?: number;
  weekId?: number;
  startDate?: Date;
  endDate?: Date;
  minMileage?: number;
  maxMileage?: number;

  constructor(args: CadenceDaySearchArgs) {
    super(args);
    this.cadenceId = args.cadenceId ? parseInt(args.cadenceId) : undefined;
    this.weekId = args.weekId ? parseInt(args.weekId) : undefined;
    this.startDate = args.startDate ? new Date(args.startDate) : undefined;
    this.endDate = args.endDate ? new Date(args.endDate) : undefined;
    this.minMileage = args.minMileage ? parseFloat(args.minMileage) : undefined;
    this.maxMileage = args.maxMileage ? parseFloat(args.maxMileage) : undefined;
  }
}

export interface OpenShiftArgs {
  startTime: string;
  mileageStart?: string;
}

export class OpenShiftDto {
  startTime: Date;
  mileageStart?: number;

  constructor(args: OpenShiftArgs) {
    this.startTime = new Date(args.startTime);
    this.mileageStart = args.mileageStart
      ? parseFloat(args.mileageStart)
      : undefined;
  }
}

export interface CloseShiftArgs {
  endTime: string;
  drivingHours: string;
  wasPause?: string | boolean;
  mileageEnd: string;
  notes?: string;
}

export class CloseShiftDto {
  endTime: Date;
  drivingHours: number;
  wasPause: boolean;
  mileageEnd: number;
  notes?: string;

  constructor(args: CloseShiftArgs) {
    this.endTime = new Date(args.endTime);
    this.drivingHours = parseFloat(args.drivingHours);
    this.wasPause =
      typeof args.wasPause === 'boolean'
        ? args.wasPause
        : args.wasPause === 'true';
    this.mileageEnd = parseFloat(args.mileageEnd);
    this.notes = args.notes;
  }
}

export interface UpdateOpenShiftArgs {
  startTime?: string;
  mileageStart?: string;
}

export class UpdateOpenShiftDto {
  startTime?: Date;
  mileageStart?: number;

  constructor(args: UpdateOpenShiftArgs) {
    this.startTime = args.startTime ? new Date(args.startTime) : undefined;
    this.mileageStart = args.mileageStart ? parseFloat(args.mileageStart) : undefined;
  }
}

export interface DayOffArgs {
  notes?: string;
}

export class DayOffDto {
  notes?: string;

  constructor(args: DayOffArgs) {
    this.notes = args.notes;
  }
}
