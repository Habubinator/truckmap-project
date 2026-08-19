import {
  prisma,
  PointInstructionStatus,
  PointInstructionType,
} from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';
import {
  CreatePointInstructionDto,
  UpdatePointInstructionDto,
} from '../dto';

const TYPE_ORDER: Record<PointInstructionType, number> = {
  ENTRANCE: 0,
  PARKING: 1,
  REGISTRATION: 2,
  EXIT: 3,
};

class PointInstructionService {
  async getApprovedByPointId(pointId: number) {
    const point = await prisma.point.findUnique({ where: { id: pointId } });
    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Point not found');
    }

    const items = await prisma.pointInstruction.findMany({
      where: {
        pointId,
        status: PointInstructionStatus.APPROVED,
      },
      select: {
        id: true,
        pointId: true,
        type: true,
        title: true,
        description: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return items.sort(
      (a, b) =>
        TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.id - b.id,
    );
  }

  async create(
    pointId: number,
    dto: CreatePointInstructionDto,
    userId: number,
  ) {
    const point = await prisma.point.findUnique({ where: { id: pointId } });
    if (!point) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Point not found');
    }

    return prisma.pointInstruction.create({
      data: {
        pointId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: PointInstructionStatus.PENDING,
        creatorId: userId,
      },
    });
  }

  async update(
    id: number,
    dto: UpdatePointInstructionDto,
    userId: number,
  ) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });

    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }

    if (instruction.creatorId !== userId) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You can only edit your own instructions',
      );
    }

    const nextStatus =
      instruction.status === PointInstructionStatus.APPROVED
        ? PointInstructionStatus.PENDING
        : instruction.status;

    return prisma.pointInstruction.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        status: nextStatus,
      },
    });
  }

  async remove(id: number, userId: number) {
    const instruction = await prisma.pointInstruction.findUnique({
      where: { id },
    });

    if (!instruction) {
      throw HttpException.NotFound(ErrorCodes.NotFound, 'Instruction not found');
    }

    if (instruction.creatorId !== userId) {
      throw HttpException.Forbidden(
        ErrorCodes.Forbidden,
        'You can only delete your own instructions',
      );
    }

    if (instruction.status !== PointInstructionStatus.PENDING) {
      throw HttpException.BadRequest(
        ErrorCodes.BadRequest,
        'Only pending instructions can be deleted by the owner',
      );
    }

    await prisma.pointInstruction.delete({ where: { id } });
    return { id };
  }
}

export const pointInstructionService = new PointInstructionService();
