import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { mesiboService } from '../services';
import { AuthorizedRequest } from '@auth/types';

class MesiboController {
  async saveMesiboFile(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await mesiboService.saveMesiboFile(req);
      res.status(HttpCodes.Ok).json(data);
    } catch (e: unknown) {
      next(e);
    }
  }

  async addUserToChat(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await mesiboService.AddUserToGroup(
        Number(req.params.mesiboChatId),
        `${req.user.id}`,
      );
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async request(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await mesiboService.request(req.body);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getChatMessages(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await mesiboService.getChatMessages(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getYourMesiboAccess(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const mesiboToken = await mesiboService.getYourMesiboAccess(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const mesiboController = new MesiboController();
