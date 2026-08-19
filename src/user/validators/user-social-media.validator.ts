import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const updateUserSocialMediaValidator = checkSchema({
  instagramUrl: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 255 },
      errorMessage: validatorMessage('isLength', 1, 255),
    },
    custom: {
      options: (value: string) => {
        if (value && value.trim() && !value.includes('instagram.com')) {
          throw new Error('URL must contain instagram.com');
        }
        return true;
      },
    },
    trim: true,
  },
  facebookUrl: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 255 },
      errorMessage: validatorMessage('isLength', 1, 255),
    },
    custom: {
      options: (value: string) => {
        if (value && value.trim() && !value.includes('facebook.com')) {
          throw new Error('URL must contain facebook.com');
        }
        return true;
      },
    },
    trim: true,
  },
  tiktokUrl: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 255 },
      errorMessage: validatorMessage('isLength', 1, 255),
    },
    custom: {
      options: (value: string) => {
        if (value && value.trim() && !value.includes('tiktok.com')) {
          throw new Error('URL must contain tiktok.com');
        }
        return true;
      },
    },
    trim: true,
  },
  whatsappPhone: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 32 },
      errorMessage: validatorMessage('isLength', 1, 32),
    },
    custom: {
      options: (value: string) => {
        if (!value || !value.trim()) return true;

        // Allow digits, spaces, dashes, parentheses, plus sign
        if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
          throw new Error('Phone number contains invalid characters');
        }

        // Ensure at least one digit exists
        if (!/\d/.test(value)) {
          throw new Error('Phone number must contain at least one digit');
        }

        return true;
      },
    },
    trim: true,
  },
  viberPhone: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 32 },
      errorMessage: validatorMessage('isLength', 1, 32),
    },
    custom: {
      options: (value: string) => {
        if (!value || !value.trim()) return true;

        if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
          throw new Error('Phone number contains invalid characters');
        }

        if (!/\d/.test(value)) {
          throw new Error('Phone number must contain at least one digit');
        }

        return true;
      },
    },
    trim: true,
  },
  telegramPhone: {
    in: 'body',
    optional: true,
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      options: { max: 32 },
      errorMessage: validatorMessage('isLength', 1, 32),
    },
    custom: {
      options: (value: string) => {
        if (!value || !value.trim()) return true;

        if (!/^[\d\s\-\+\(\)]+$/.test(value)) {
          throw new Error('Phone number contains invalid characters');
        }

        if (!/\d/.test(value)) {
          throw new Error('Phone number must contain at least one digit');
        }

        return true;
      },
    },
    trim: true,
  },
});
