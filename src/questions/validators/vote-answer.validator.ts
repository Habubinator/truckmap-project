import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const voteAnswerValidator = checkSchema({
  answerId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  value: {
    in: 'body',
    toInt: true,
    isInt: {
      options: { min: -1, max: 1 },
      errorMessage: validatorMessage('mustBeBetween', '-1', '1'),
    },
  },
});
