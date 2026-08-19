import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { userService } from '../services';
import {
  UpdateUserDescriptionDto,
  UpdateUserDescriptionArgs,
  UpdateUserSocialMediaDto,
  UpdateUserSocialMediaArgs,
  UserSearchDto,
  UserSearchArgs,
  CreateReportDto,
  CreateReportArgs,
  CreateCompanyDto,
  CreateCompanyArgs,
} from '../dto';
import { AuthorizedRequest } from '@auth/types';
import { PaginateArgs, PaginateDto } from '@common/dto';

class UserController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const dto = new UserSearchDto({
        ...req.query,
        ...req.params,
      } as unknown as UserSearchArgs);

      const data = await userService.findAll(dto);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.findOne(+req.params.userId);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateUserDescription(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const file = req.file;
      const photo = `${file ? `${process.env.CLIENT_URL}/static/profiles/${encodeURIComponent(file.filename)}` : ''}`;

      const dto = new UpdateUserDescriptionDto({
        ...req.body,
        photo,
      } as unknown as UpdateUserDescriptionArgs);

      const data = await userService.updateUserDescription(dto, req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateUserSocialMedia(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new UpdateUserSocialMediaDto(
        req.body as unknown as UpdateUserSocialMediaArgs,
      );

      const data = await userService.updateUserSocialMedia(dto, req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async me(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.me(req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async acceptRequest(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await userService.sendOrAcceptFriendRequest(
        req.user.id,
        +req.params.id,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async denyRequest(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.denyOrDeleteFriendRequest(
        req.user.id,
        +req.params.id,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async userFriends(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.getFriends(+req.params.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async myFriends(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.getFriends(req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async updateLocation(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await userService.updateLocation(req);
      await userService.logLocation(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getClosestParkings(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await userService.getClosestParkings(req);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getNotifications(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new PaginateDto({
        ...req.query,
        ...req.params,
      } as unknown as PaginateArgs);
      const data = await userService.getNotifications(req.user.id, dto);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async markAsRead(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await userService.markAsRead(req.params.notificationId);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getQuestionAnswerStats(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await userService.getQuestionAnswerStats(req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async createReport(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CreateReportDto({
        ...req.body,
      } as unknown as CreateReportArgs);

      const data = await userService.createReport(req.user.id, dto);

      res.status(HttpCodes.Created).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getUserReports(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new PaginateDto({
        ...req.query,
        ...req.params,
      } as unknown as PaginateArgs);

      const data = await userService.getUserReports(req.user.id, dto);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async createCompany(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CreateCompanyDto({
        ...req.body,
      } as unknown as CreateCompanyArgs);

      const data = await userService.createCompany(dto, req.user.id);

      res.status(HttpCodes.Created).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }
}

export const userController = new UserController();
