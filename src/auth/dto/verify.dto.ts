export type VerifyArgs = {
  email: string;
  verificationKey: string;
  headers: {
    ip: string;
    userAgent: string;
  };
};

export class VerifyDto {
  public readonly email: string;
  public readonly verificationKey: string;
  public readonly headers: { ip: string; userAgent: string };

  constructor(args: VerifyArgs) {
    this.email = args.email;
    this.verificationKey = args.verificationKey;
    this.headers = args.headers;
  }
}
