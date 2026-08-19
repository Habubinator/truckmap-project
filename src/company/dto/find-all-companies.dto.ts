import { PaginateArgs, PaginateDto } from '@common/dto';

type FindAllCompaniesArgs = {
  label: string;
} & PaginateArgs;

export class FindAllCompaniesDto extends PaginateDto {
  label: string;
  constructor(args: FindAllCompaniesArgs) {
    super(args);
    this.label = args.label;
  }
}
