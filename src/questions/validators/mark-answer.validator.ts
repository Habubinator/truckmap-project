import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const markAnswerIrrelevantValidator = checkSchema({
  answerId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});

export const markBestAnswerValidator = checkSchema({
  answerId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});
