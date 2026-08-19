import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { traficBanService } from '../services';

class TraficBanController {
  async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const { dateFrom, dateTo } = req.query;
      const data = await traficBanService.getByDate(
        new Date(dateFrom as string | null | undefined),
        new Date(dateTo as string | null | undefined),
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const traficBanController = new TraficBanController();
