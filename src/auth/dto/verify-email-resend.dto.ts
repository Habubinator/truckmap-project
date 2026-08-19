export type VerifyEmailResendArgs = {
  email: string;
};

export class VerifyEmailResendDto {
  public readonly email: string;

  constructor(args: VerifyEmailResendArgs) {
    this.email = args.email;
  }
}
