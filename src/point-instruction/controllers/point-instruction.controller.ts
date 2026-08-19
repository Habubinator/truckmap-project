import type { NextFunction, Response } from 'express';
import type { AuthorizedRequest } from '@auth/types';
import { HttpCodes } from '@common/enums';
import {
  CreatePointInstructionDto,
  UpdatePointInstructionDto,
} from '../dto';
import { pointInstructionService } from '../services/point-instruction.service';

class PointInstructionController {
  async getApprovedByPointId(
    req: AuthorizedRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pointId = parseInt(req.params.pointId, 10);
      const data = await pointInstructionService.getApprovedByPointId(pointId);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async create(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const pointId = parseInt(req.params.pointId, 10);
      const dto = new CreatePointInstructionDto(req.body);
      const data = await pointInstructionService.create(
        pointId,
        dto,
        req.user.id,
      );
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async update(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const dto = new UpdatePointInstructionDto(req.body);
      const data = await pointInstructionService.update(id, dto, req.user.id);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }

  async remove(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await pointInstructionService.remove(id, req.user.id);
      res.status(HttpCodes.Ok).json({ success: true, data });
    } catch (e: unknown) {
      next(e);
    }
  }
}

export const pointInstructionController = new PointInstructionController();
