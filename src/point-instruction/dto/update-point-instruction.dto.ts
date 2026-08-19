import { PointInstructionType } from '@database';
import { HttpException } from '@common/exceptions';
import { ErrorCodes } from '@common/enums';

const VALID_TYPES = new Set(Object.values(PointInstructionType));

export type UpdatePointInstructionArgs = {
  type?: string;
  title?: string | null;
  description?: string | null;
  latitude?: string | null;
  longitude?: string | null;
};

export class UpdatePointInstructionDto {
  type?: PointInstructionType;
  title?: string | null;
  description?: string | null;
  latitude?: string | null;
  longitude?: string | null;

  constructor(args: UpdatePointInstructionArgs) {
    if (args.type !== undefined) {
      if (!VALID_TYPES.has(args.type as PointInstructionType)) {
        throw HttpException.BadRequest(
          ErrorCodes.Validation,
          'type must be one of ENTRANCE, PARKING, REGISTRATION, EXIT',
        );
      }
      this.type = args.type as PointInstructionType;
    }

    if (args.title !== undefined) {
      this.title = args.title === null ? null : args.title.trim() || null;
    }
    if (args.description !== undefined) {
      this.description =
        args.description === null ? null : args.description.trim() || null;
    }
    if (args.latitude !== undefined) {
      this.latitude =
        args.latitude === null ? null : args.latitude.trim() || null;
    }
    if (args.longitude !== undefined) {
      this.longitude =
        args.longitude === null ? null : args.longitude.trim() || null;
    }
  }
}
