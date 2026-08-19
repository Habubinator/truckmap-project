import { HttpCodes } from '@common/enums';
import { getLang } from '@common/locales';
import type { NextFunction, Request, Response } from 'express';
import { GetCountryRulesDto } from '../dto';
import { infoService } from '../services/info.service';
import type { AuthorizedRequest } from '@auth/types';

class InfoController {
  async getMyCountry(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const data = await infoService.getMyCountry(req.user.id, getLang(req));
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getCountries(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await infoService.getCountries(getLang(req));
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getCountryRules(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = new GetCountryRulesDto({
        isoCode: req.params.isoCode,
        lang: getLang(req),
      });
      const data = await infoService.getCountryRules(dto.isoCode, dto.lang);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const infoController = new InfoController();
