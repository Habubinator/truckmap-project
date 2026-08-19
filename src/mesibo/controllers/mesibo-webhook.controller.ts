import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { mesiboWebHookService } from '../services';

class WebhookController {
  async listen(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      await mesiboWebHookService.listen(req);
      res.status(HttpCodes.Ok);
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const webhookController = new WebhookController();
