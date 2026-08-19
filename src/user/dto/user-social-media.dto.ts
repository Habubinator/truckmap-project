export type UpdateUserSocialMediaArgs = {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  whatsappPhone: string;
  viberPhone: string;
  telegramPhone: string;
};

export class UpdateUserSocialMediaDto {
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  whatsappPhone: string;
  viberPhone: string;
  telegramPhone: string;

  constructor(args: UpdateUserSocialMediaArgs) {
    this.instagramUrl = args.instagramUrl || undefined;
    this.facebookUrl = args.facebookUrl || undefined;
    this.tiktokUrl = args.tiktokUrl || undefined;
    this.whatsappPhone = args.whatsappPhone || undefined;
    this.viberPhone = args.viberPhone || undefined;
    this.telegramPhone = args.telegramPhone || undefined;
  }
}
