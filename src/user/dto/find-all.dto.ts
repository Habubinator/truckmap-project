import { PaginateArgs, PaginateDto } from '@common/dto';

export type UserSearchArgs = {
  username?: string | null | undefined;
} & PaginateArgs;

export class UserSearchDto extends PaginateDto {
  public readonly username: string;

  constructor(args: UserSearchArgs) {
    super(args);
    this.username = args.username || '';
  }
}
