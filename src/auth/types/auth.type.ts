import { User, Role, Subscription, Tariff } from '@prisma/client';
import { Request } from 'express';

export type AuthorizedUser = Pick<User, 'id' | 'name' | 'isBanned'> & {
  role: Role;
};

export type SubscriptionWithTariff = Subscription & {
  tariff: Tariff;
};

export type AuthorizedRequest = Request & {
  user: AuthorizedUser;
  subscription?: SubscriptionWithTariff;
  isPremium?: boolean;
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthorizedUser;
  }
}
