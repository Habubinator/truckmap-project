import { checkSchema } from 'express-validator';
import { validatorMessage } from '@common/utils';

export const createReviewValidator = checkSchema({
  pointId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  rating: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    isInt: {
      options: { min: 1, max: 5 },
      errorMessage: validatorMessage('isNumeric'),
    },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  text: {
    in: 'body',
    isString: { errorMessage: validatorMessage('isString') },
    optional: true,
    trim: true,
  },
});

export const addImagesToReviewValidator = checkSchema({
  reviewId: {
    in: 'params',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});

export const replyToReviewValidator = checkSchema({
  reviewId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
  text: {
    in: 'body',
    isString: { errorMessage: validatorMessage('isString') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
    trim: true,
  },
  parentId: {
    in: 'body',
    toInt: true,
    optional: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
  },
});

export const toggleLikeValidator = checkSchema({
  reviewId: {
    in: 'body',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});

export const getRepliesTreeValidator = checkSchema({
  reviewId: {
    in: 'params',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});

export const getPointReviewsWithRepliesValidator = checkSchema({
  pointId: {
    in: 'params',
    toInt: true,
    isNumeric: { errorMessage: validatorMessage('isNumeric') },
    notEmpty: { errorMessage: validatorMessage('notEmpty') },
  },
});
