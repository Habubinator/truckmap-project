import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const createQuestionValidator = checkSchema({
  title: {
    in: 'body',
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
    trim: true,
    isLength: {
      options: { max: 64 },
      errorMessage: validatorMessage('invalidLength', 'title', '64'),
    },
  },
  content: {
    in: 'body',
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
    trim: true,
  },
  sectionId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  subsectionId: {
    in: 'body',
    optional: true,
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
  },
});
