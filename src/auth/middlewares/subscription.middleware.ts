import { ErrorCodes } from '@common/enums';
import { HttpException } from '@common/exceptions';
import { prisma } from '@database';
import type { NextFunction, Response } from 'express';
import type { AuthorizedRequest } from '../types';

export const requireSubscription = async (
  req: AuthorizedRequest,
  _: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      next(HttpException.Unauthorized(ErrorCodes.Auth));
      return;
    }

    // Get user with subscription details
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });

    if (!userWithSubscription) {
      next(HttpException.Unauthorized(ErrorCodes.UserNotFound));
      return;
    }

    const subscription = userWithSubscription.subscription;

    // Check if user has an active subscription
    if (
      !subscription ||
      subscription.status !== 'ACTIVE' ||
      subscription.endDate < new Date()
    ) {
      next(
        HttpException.Forbidden(
          ErrorCodes.SubscriptionRequired,
          req.__('errors.subscription.required'),
        ),
      );
      return;
    }

    // Add subscription info to request for use in controllers
    req.subscription = subscription;

    next();
  } catch (error) {
    console.log(error);
    next(HttpException.Forbidden(ErrorCodes.Forbidden));
  }
};

export const requireSubscriptionWithFeature =
  (requiredFeature: string) =>
  async (req: AuthorizedRequest, _: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        next(HttpException.Unauthorized(ErrorCodes.Auth));
        return;
      }

      // Get user with subscription details
      const userWithSubscription = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          subscription: {
            include: {
              tariff: true,
            },
          },
        },
      });

      if (!userWithSubscription) {
        next(HttpException.Unauthorized(ErrorCodes.UserNotFound));
        return;
      }

      const subscription = userWithSubscription.subscription;

      // Check if user has an active subscription
      if (
        !subscription ||
        subscription.status !== 'ACTIVE' ||
        subscription.endDate < new Date()
      ) {
        next(
          HttpException.Forbidden(
            ErrorCodes.SubscriptionRequired,
            req.__('errors.subscription.required'),
          ),
        );
        return;
      }

      // Check if the tariff includes the required feature
      const tariffFeatures = (subscription.tariff.features as string[]) || [];
      if (!tariffFeatures.includes(requiredFeature)) {
        next(
          HttpException.Forbidden(
            ErrorCodes.FeatureNotAvailable,
            req.__('errors.subscription.featureNotAvailable', requiredFeature),
          ),
        );
        return;
      }

      // Add subscription info to request for use in controllers
      req.subscription = subscription;

      next();
    } catch (error) {
      console.log(error);
      next(HttpException.Forbidden(ErrorCodes.Forbidden));
    }
  };

export const checkSubscriptionStatus = async (
  req: AuthorizedRequest,
  _: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      next();
      return;
    }

    // Get user with subscription details (non-blocking)
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        subscription: {
          include: {
            tariff: true,
          },
        },
      },
    });

    if (userWithSubscription?.subscription) {
      const subscription = userWithSubscription.subscription;
      const isActive =
        subscription.status === 'ACTIVE' && subscription.endDate >= new Date();

      // Add subscription info to request (whether active or not)
      req.subscription = subscription;
      req.isPremium = isActive;
    } else {
      req.isPremium = false;
    }

    next();
  } catch (error) {
    console.log(error);
    req.isPremium = false;
    next();
  }
};
