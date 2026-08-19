type RegisterArgs = {
  email: string;
  username: string;
  password: string;
  headers: {
    ip: string;
    userAgent: string;
  };
};

export class RegisterDto {
  public readonly email: string;
  public readonly username: string;
  public readonly password: string;
  public readonly headers: { ip: string; userAgent: string };

  constructor(args: RegisterArgs) {
    this.email = args.email;
    this.headers = args.headers;
    this.username = args.username;
    this.password = args.password;
  }
}
