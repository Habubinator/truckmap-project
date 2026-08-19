import { PointInstructionType } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';

const VALID_TYPES = new Set(Object.values(PointInstructionType));

export type CreatePointInstructionArgs = {
  type: string;
  title?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
};

export class CreatePointInstructionDto {
  type: PointInstructionType;
  title?: string;
  description?: string;
  latitude?: string;
  longitude?: string;

  constructor(args: CreatePointInstructionArgs) {
    if (!args.type || !VALID_TYPES.has(args.type as PointInstructionType)) {
      throw HttpException.BadRequest(
        ErrorCodes.Validation,
        'type must be one of ENTRANCE, PARKING, REGISTRATION, EXIT',
      );
    }

    this.type = args.type as PointInstructionType;
    this.title = args.title?.trim() || undefined;
    this.description = args.description?.trim() || undefined;
    this.latitude = args.latitude?.trim() || undefined;
    this.longitude = args.longitude?.trim() || undefined;
  }
}
