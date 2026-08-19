import { validatorMessage } from '@common/utils';
import { checkSchema } from 'express-validator';

export const registerValidator = checkSchema({
  username: {
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  email: {
    isEmail: { errorMessage: validatorMessage('isEmail') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  password: {
    isString: { errorMessage: validatorMessage('isString') },
    isLength: {
      errorMessage: validatorMessage('isLength', 8, 64),
      options: { min: 8, max: 64 },
    },
    matches: {
      options: /^(?=.*[A-Z])(?=.*\d)/,
      errorMessage: validatorMessage(
        'passwordStrength',
        'at least one uppercase letter and one number',
      ),
    },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});
