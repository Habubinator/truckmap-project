export type UpdateUserDescriptionArgs = {
  name: string;
  email: string;
  company: number;
  photo: string;
  countryIsoCode: string;
  description: string;
  pmConfidenciality: string;
  isPublic: string;
  username: string;
  isShowOnParkings: string;
};

export class UpdateUserDescriptionDto {
  name: string;
  email: string;
  companyId: number;
  photo: string;
  countryIsoCode: string;
  description: string;
  pmConfidenciality: string;
  isPublic: boolean;
  username: string;
  isShowOnParkings: boolean;

  constructor(args: UpdateUserDescriptionArgs) {
    this.name = args.name || undefined;
    this.email = args.email || undefined;
    this.username = args.username || undefined;
    this.companyId = +args.company || undefined;
    this.photo = args.photo || undefined;
    this.countryIsoCode = args.countryIsoCode || undefined;
    this.description = args.description || undefined;
    this.pmConfidenciality = args.pmConfidenciality || undefined;
    this.isPublic =
      args.isPublic == 'true'
        ? true
        : args.isPublic == 'false'
          ? false
          : undefined;
    this.isShowOnParkings =
      args.isShowOnParkings == 'true'
        ? true
        : args.isShowOnParkings == 'false'
          ? false
          : undefined;
  }
}
