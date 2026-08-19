import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Response } from 'express';
import { aiService } from '@ai';
import { AuthorizedRequest } from '@auth/types';

class AIController {
  async chat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await aiService.chat(req);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async search(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await aiService.search(req);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async uploadDocument(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await aiService.loadDocument(req);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }
}

export const aiController = new AIController();
