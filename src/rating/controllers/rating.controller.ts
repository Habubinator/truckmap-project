import { HttpCodes } from '@common/enums';
import { validateRequest } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { ratingService } from '../services';
import { AuthorizedRequest } from '@auth/types';

class RatingController {
  async createReview(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { pointId, rating, text } = req.body;
      const files = req.files as Express.Multer.File[];
      const imageUrls = files
        ? files.map(
            (file) =>
              `${process.env.CLIENT_URL}/static/reviews/${encodeURIComponent(file.filename)}`,
          )
        : [];

      const data = await ratingService.createReview(
        req.user.id,
        Number(pointId),
        Number(rating),
        text,
        imageUrls,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async addImagesToReview(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { reviewId } = req.params;
      const files = req.files as Express.Multer.File[];

      const imageUrls = files.map(
        (file) =>
          `${process.env.CLIENT_URL}/static/reviews/${encodeURIComponent(file.filename)}`,
      );

      const data = await ratingService.addImagesToReview(
        req.user.id,
        Number(reviewId),
        imageUrls,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async replyToReviewOrComment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { reviewId, text, parentId } = req.body;

      const data = await ratingService.replyToReviewOrComment(
        req.user.id,
        reviewId,
        text,
        parentId,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async toggleLike(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { reviewId } = req.body;

      const data = await ratingService.toggleLike(req.user.id, reviewId);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async getRepliesTree(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { reviewId } = req.params;

      const data = await ratingService.getRepliesTree(Number(reviewId));

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async getPointReviewsWithReplies(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { pointId } = req.params;

      const data = await ratingService.getPointReviewsWithReplies(
        Number(pointId),
        req.user?.id,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}

export const ratingController = new RatingController();
