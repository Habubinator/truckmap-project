export type CreateCompanyArgs = {
  label: string;
};

export class CreateCompanyDto {
  label: string;

  constructor(args: CreateCompanyArgs) {
    this.label = args.label;
  }
}
