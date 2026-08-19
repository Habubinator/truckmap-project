import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const createAnswerValidator = checkSchema({
  questionId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  content: {
    in: 'body',
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
    trim: true,
  },
});
