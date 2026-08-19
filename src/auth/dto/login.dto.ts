type LoginArgs = {
  email: string;
  password: string;
  headers: {
    ip: string;
    userAgent: string;
  };
};

export class LoginDto {
  public readonly email: string;
  public readonly password: string;
  public readonly headers: { ip: string; userAgent: string };

  constructor(args: LoginArgs) {
    this.email = args.email;
    this.password = args.password;
    this.headers = args.headers;
  }
}
