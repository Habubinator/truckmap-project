import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const appleLoginValidator = checkSchema({
  userIdentifier: {
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  identityToken: {
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});
