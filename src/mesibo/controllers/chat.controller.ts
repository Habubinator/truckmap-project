import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Response } from 'express';
import { chatService } from '../services';
import { AuthorizedRequest } from '@auth/types';

class ChatController {
  async createChat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await chatService.createChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async updateChat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await chatService.updateChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getPrivateChatsOfUser(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.getPrivateChatsOfUser(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getChat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await chatService.getChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async switchChatNotifications(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.switchChatNotifications(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getCustomChatLink(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.getCustomChatLink(req);
      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          link: data,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async joinByChatLink(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.joinByChatLink(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async inviteUsersToChat(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.inviteUsersToChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async toggleAdminStatus(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.toggleAdminStatus(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async kickUserFromChat(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const data = await chatService.kickUserFromChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async leaveChat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await chatService.leaveChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async deleteChat(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);
      const data = await chatService.deleteChat(req);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async getUsersInParking(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);
      const chatId = Number(req.params.chatId);
      const data = await chatService.getUsersInParking(chatId);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const chatController = new ChatController();
