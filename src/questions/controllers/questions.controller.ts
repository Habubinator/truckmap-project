import { HttpCodes } from '@common/enums';
import { validateRequest, sendJsonResponse } from '@common/utils';
import type { NextFunction, Request, Response } from 'express';
import { questionService } from '../services';
import { PaginateArgs, PaginateDto } from '@common/dto';
import { AuthorizedRequest } from '@auth/types';
import { CreateQuestionDto, CreateQuestionArgs } from '../dto';
import { getLang } from '@common/locales';

class QuestionController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const dto = new PaginateDto({
        ...req.query,
        ...req.params,
      } as unknown as PaginateArgs);

      const data = await questionService.findAll(
        dto,
        +req.query.sectionId || undefined,
        +req.query.subsectionId || undefined,
        getLang(req),
      );

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await questionService.findOne(
        +req.params.questionId,
        getLang(req),
      );

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getUserQuestions(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await questionService.getUserQuestions(
        +req.params.userId,
        getLang(req),
      );

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getQuestionsThatAnswered(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await questionService.getQuestionsThatAnswered(
        req,
        getLang(req),
      );

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getMyQuestions(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const data = await questionService.getMyQuestions(req, getLang(req));

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async searchQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const dto = new PaginateDto({
        ...req.query,
        ...req.params,
      } as unknown as PaginateArgs);

      const data = await questionService.searchQuestion(
        dto,
        `${req.query.phrase}`,
        req.query.titleOnly === 'true',
        getLang(req),
      );

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getSections(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await questionService.getSections(getLang(req));

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async getSubSections(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await questionService.getSubSections(
        +req.params.sectionId,
        getLang(req),
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async createQuestion(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const dto = new CreateQuestionDto({
        ...req.body,
        creatorId: req.user.id,
      } as unknown as CreateQuestionArgs);

      const data = await questionService.createQuestion(dto);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      console.error(e);
      next(e);
    }
  }

  async createAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { questionId, content } = req.body;

      const data = await questionService.createAnswer(
        questionId,
        req.user.id,
        content,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async editAnswer(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { answerId } = req.params;
      const { content } = req.body;

      const data = await questionService.editAnswer(
        +answerId,
        req.user.id,
        content,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async deleteAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { answerId } = req.params;

      const data = await questionService.deleteAnswer(+answerId, req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async getCommentsByAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { answerId } = req.params;

      const dto = new PaginateDto({
        ...req.query,
        ...req.params,
      } as unknown as PaginateArgs);

      const data = await questionService.getCommentsByAnswer(+answerId, dto);

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async createComment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { answerId } = req.params;
      const { content, parentId } = req.body;

      const data = await questionService.createComment(
        +answerId,
        req.user.id,
        content,
        parentId,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async editComment(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { commentId } = req.params;
      const { content } = req.body;

      const data = await questionService.editComment(
        +commentId,
        req.user.id,
        content,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async deleteComment(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { commentId } = req.params;

      const data = await questionService.deleteComment(+commentId, req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async voteComment(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { commentId, value } = req.body;

      const data = await questionService.voteComment(
        req.user.id,
        commentId,
        value == 0 ? 0 : value > 0 ? 1 : -1,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async voteQuestion(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { questionId, value } = req.body;

      const data = await questionService.voteQuestion(
        req.user.id,
        questionId,
        value == 0 ? 0 : value > 0 ? 1 : -1,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async voteAnswer(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const { answerId, value } = req.body;

      const data = await questionService.voteAnswer(
        req.user.id,
        answerId,
        value == 0 ? 0 : value > 0 ? 1 : -1,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async markAnswerIrrelevant(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { answerId } = req.body;

      const data = await questionService.markAnswerIrrelevant(
        answerId,
        req.user.id,
      );

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async markBestAnswer(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      validateRequest(req);

      const { answerId } = req.body;

      const data = await questionService.markBestAnswer(answerId, req.user.id);

      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async getTopBest(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await questionService.getTopBest();

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e) {
      console.error(e);
      next(e);
    }
  }

  async getTopActive(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(req);

      const data = await questionService.getTopActive();

      sendJsonResponse(res, { success: true, data }, HttpCodes.Ok);
    } catch (e) {
      console.error(e);
      next(e);
    }
  }
}

export const questionController = new QuestionController();
