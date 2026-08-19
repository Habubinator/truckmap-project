import { HttpCodes, ErrorCodes } from '@common/enums';
import { HttpException } from '@common/exceptions';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { cadenceService } from '../services/cadence.service';
import { AuthorizedRequest } from '@auth/types';
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
  CreateCadenceArgs,
  UpdateCadenceArgs,
  CadenceSearchArgs,
  CreateCadenceWeekArgs,
  UpdateCadenceWeekArgs,
  CreateCadenceDayArgs,
  UpdateCadenceDayArgs,
  CadenceDaySearchArgs,
  UpdateCadenceDatesArgs,
  OpenShiftArgs,
  UpdateOpenShiftArgs,
  CloseShiftArgs,
  DayOffArgs,
} from '../dto';
import { getLang } from '@common/locales';

class CadenceController {
  async createCadence(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const file = req.file;
      const truckPhoto = file
        ? `${process.env.CLIENT_URL}/static/cadences/${encodeURIComponent(file.filename)}`
        : '';

      const dto = new CreateCadenceDto({
        ...req.body,
        truckPhoto,
      } as unknown as CreateCadenceArgs);

      const data = await cadenceService.createCadence(dto, req.user.id);

      res.status(HttpCodes.Created).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  //   async getAllCadences(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       validateRequest(req);

  //       const dto = new CadenceSearchDto({
  //         ...req.query,
  //         ...req.params,
  //       } as unknown as CadenceSearchArgs);

  //       const data = await cadenceService.findAllCadences(dto);

  //       res.status(HttpCodes.Ok).json({
  //         success: true,
  //         data,
  //       });
  //     } catch (e: unknown) {
  //       console.error(e);
  //       next(e);
  //     }
  //   }

  async getMyCadences(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CadenceSearchDto({
        ...req.query,
        ...req.params,
        userId: req.user.id.toString(),
      } as unknown as CadenceSearchArgs);

      const data = await cadenceService.findAllCadences(dto);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getCadenceById(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      //   const includeDetails = req.query.includeDetails === 'true';

      const data = await cadenceService.findOneCadence(id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateCadence(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const file = req.file;
      const truckPhoto = file
        ? `${process.env.CLIENT_URL}/static/cadences/${encodeURIComponent(file.filename)}`
        : undefined;

      const dto = new UpdateCadenceDto({
        ...req.body,
        ...(truckPhoto && { truckPhoto }),
      } as unknown as UpdateCadenceArgs);

      const data = await cadenceService.updateCadence(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateCadenceDates(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new UpdateCadenceDatesDto({
        ...req.body,
      } as unknown as UpdateCadenceDatesArgs);

      const data = await cadenceService.updateCadenceDates(
        id,
        dto,
        req.user.id,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async deleteCadence(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);

      await cadenceService.deleteCadence(id, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  // CADENCE WEEK ENDPOINTS

  async createCadenceWeek(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CreateCadenceWeekDto({
        ...req.body,
      } as unknown as CreateCadenceWeekArgs);

      const data = await cadenceService.createCadenceWeek(dto, req.user.id);

      res.status(HttpCodes.Created).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getCadenceWeeks(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const cadenceId = parseInt(req.params.cadenceId);

      const data = await cadenceService.findCadenceWeeks(
        cadenceId,
        req.user.id,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateCadenceWeek(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new UpdateCadenceWeekDto({
        ...req.body,
      } as unknown as UpdateCadenceWeekArgs);

      const data = await cadenceService.updateCadenceWeek(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async deleteCadenceWeek(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);

      await cadenceService.deleteCadenceWeek(id, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  // CADENCE DAY ENDPOINTS

  async createCadenceDay(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CreateCadenceDayDto({
        ...req.body,
      } as unknown as CreateCadenceDayArgs);

      const data = await cadenceService.createCadenceDay(dto, req.user.id);

      res.status(HttpCodes.Created).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getCadenceDays(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CadenceDaySearchDto({
        ...req.query,
        ...req.params,
      } as unknown as CadenceDaySearchArgs);

      const data = await cadenceService.findCadenceDays(dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateCadenceDay(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new UpdateCadenceDayDto({
        ...req.body,
      } as unknown as UpdateCadenceDayArgs);

      const data = await cadenceService.updateCadenceDay(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async deleteCadenceDay(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);

      await cadenceService.deleteCadenceDay(id, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  // SHIFT OPERATIONS

  async openShift(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new OpenShiftDto(req.body as OpenShiftArgs);

      const data = await cadenceService.openShift(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateOpenShift(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const id = parseInt(req.params.id);
      const dto = new UpdateOpenShiftDto(req.body as UpdateOpenShiftArgs);
      const data = await cadenceService.updateOpenShift(id, dto, req.user.id);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async closeShift(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new CloseShiftDto(req.body as CloseShiftArgs);

      const data = await cadenceService.closeShift(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async markDayOff(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const dto = new DayOffDto(req.body as DayOffArgs);

      const data = await cadenceService.markDayOff(id, dto, req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  // STATISTICS METHODS

  async getAllTimeStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const statistics = await cadenceService.getAllTimeStatistics(req.user.id);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getPeriodStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Start date and end date are required',
        );
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Invalid date format',
        );
      }

      const statistics = await cadenceService.getPeriodStatistics(
        req.user.id,
        start,
        end,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getCadenceStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const cadenceId = parseInt(req.params.cadenceId);

      const statistics = await cadenceService.getCadenceStatistics(
        cadenceId,
        req.user.id,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getMonthlyStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { year, month } = req.query;

      if (!year || !month) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Year and month are required',
        );
      }

      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);

      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Invalid year or month',
        );
      }

      const statistics = await cadenceService.getMonthlyStatistics(
        req.user.id,
        yearNum,
        monthNum,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getYearlyStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { year } = req.query;

      if (!year) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Year is required',
        );
      }

      const yearNum = parseInt(year as string);

      if (isNaN(yearNum)) {
        throw HttpException.BadRequest(ErrorCodes.Validation, 'Invalid year');
      }

      const statistics = await cadenceService.getYearlyStatistics(
        req.user.id,
        yearNum,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getCadenceWeeklyStatistics(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const cadenceId = parseInt(req.params.cadenceId);

      if (isNaN(cadenceId)) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'Invalid cadence ID',
        );
      }

      const statistics = await cadenceService.getCadenceWeeklyStatistics(
        cadenceId,
        req.user.id,
        getLang(req),
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: statistics,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateCadenceFinished(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const id = parseInt(req.params.id);
      const { isFinished } = req.body;

      if (typeof isFinished !== 'boolean') {
        throw HttpException.BadRequest(
          ErrorCodes.BadRequest,
          'isFinished must be a boolean',
        );
      }

      const data = await cadenceService.updateCadenceFinished(
        id,
        isFinished,
        req.user.id,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }
}

export const cadenceController = new CadenceController();
