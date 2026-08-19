import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const googleLoginValidator = checkSchema({
  accessToken: {
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});
