import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { companyService } from '../services';
import { AuthorizedRequest } from '@auth/types';

class CompanyController {
  async findAllCompamnies(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await companyService.findAllCompamnies(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getYourCompanyChat(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await companyService.getYourCompanyChat(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getCompanyMembers(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await companyService.getCompanyMembers();

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const companyController = new CompanyController();
