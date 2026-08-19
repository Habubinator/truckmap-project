import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE_OPTIONS,
} from '@common/constants';
import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services';
import { AuthorizedRequest } from '@auth/types';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await authService.register(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data,
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await authService.login(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          ...data,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, mesiboToken } =
        await authService.verify(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, mesiboToken } =
        await authService.verify(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async logout(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      await authService.logout(req);
      // res.clearCookie(REFRESH_TOKEN_COOKIE);

      res.status(HttpCodes.Ok).json({ success: true });
    } catch (e: unknown) {
      next(e);
    }
  }

  async verifyEmailResend(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      await authService.verifyEmailResend(req);

      res.status(HttpCodes.Ok).json({ success: true });
    } catch (e: unknown) {
      next(e);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken, refreshToken, mesiboToken } =
        await authService.refresh(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async setNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.setNotifications(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          ...data,
        },
      });
    } catch (e: unknown) {
      next(e);
    }
  }

  async createRecoveryToken(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      // await authService.createRecoveryToken(req.body.email);

      res.status(HttpCodes.Ok).json({ success: true });
    } catch (e: unknown) {
      next(e);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      // const userId = await authService.verifyRecoveryToken(req.body.token);
      // await authService.resetPassword(userId, req.body.newPassword);

      res.status(HttpCodes.Ok).json({ success: true });
    } catch (e: unknown) {
      next(e);
    }
  }

  async googleRedirect(_req: Request, res: Response) {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=profile email`;
    res.redirect(url);
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const { user, accessToken, refreshToken } =
        await authService.googleCallback(req);

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        REFRESH_TOKEN_COOKIE_OPTIONS,
      );

      res.status(HttpCodes.Ok).json({
        success: true,
        data: { user, accessToken },
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(HttpCodes.BadGateway).json({
        success: false,
      });
    }
  }

  async googleLogin(req: Request, res: Response) {
    try {
      const { accessToken, refreshToken, mesiboToken } =
        await authService.googleLogin(req, req.body.accessToken);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(HttpCodes.BadGateway).json({
        success: false,
      });
    }
  }

  async appleLogin(req: Request, res: Response) {
    try {
      const { accessToken, refreshToken, mesiboToken } =
        await authService.appleLogin(req);

      res.status(HttpCodes.Ok).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          mesiboToken,
          mesiboStaticToken: process.env.MESIBO_BACKEND_SECRET,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(HttpCodes.BadGateway).json({
        success: false,
      });
    }
  }
}

export const authController = new AuthController();
