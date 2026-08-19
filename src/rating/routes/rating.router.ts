import { Router } from 'express';
import { ratingController } from '../controllers';
import { uploadMultipleFiles } from '@common/middlewares';
import { auth } from '@auth/middlewares';
import {
  addImagesToReviewValidator,
  createReviewValidator,
  getPointReviewsWithRepliesValidator,
  replyToReviewValidator,
  toggleLikeValidator,
} from '@rating/validators';

export const reviewsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PointReviewDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Review ID
 *           example: 123
 *         userId:
 *           type: integer
 *           description: ID of the user who created the review
 *           example: 1
 *         pointId:
 *           type: integer
 *           description: Point ID
 *           example: 82
 *         rating:
 *           type: integer
 *           description: Rating of the review (from 1 to 5)
 *           example: 4
 *         text:
 *           type: string
 *           description: Text of the review
 *           example: "Great parking spot, clean and secure."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation date and time
 *           example: "2025-04-25T12:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Review update date and time
 *           example: "2025-04-25T12:30:00Z"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             description: Image URL
 *             example: "https://censored-link.com/image1.png"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *               example: 1
 *             firstName:
 *               type: string
 *               description: User's first name
 *               example: "John"
 *             lastName:
 *               type: string
 *               description: User's last name
 *               example: "Doe"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewReplyDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Reply ID
 *           example: 456
 *         reviewId:
 *           type: integer
 *           description: ID of the review being replied to
 *           example: 123
 *         userId:
 *           type: integer
 *           description: ID of the user who wrote the reply
 *           example: 2
 *         text:
 *           type: string
 *           description: Reply text
 *           example: "Thanks for the feedback!"
 *         parentId:
 *           type: integer
 *           description: ID of the parent reply (if any)
 *           nullable: true
 *           example: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Reply creation date and time
 *           example: "2025-04-25T13:00:00Z"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ToggleLikeDto:
 *       type: object
 *       properties:
 *         liked:
 *           type: boolean
 *           description: Flag indicating whether the like was toggled
 *           example: true
 *         reviewId:
 *           type: integer
 *           description: ID of the review the like was toggled for
 *           example: 123
 *         userId:
 *           type: integer
 *           description: ID of the user who toggled the like
 *           example: 1
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     PointReviewWithRepliesDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Review ID
 *           example: 123
 *         userId:
 *           type: integer
 *           description: ID of the user who created the review
 *           example: 1
 *         pointId:
 *           type: integer
 *           description: Point ID
 *           example: 82
 *         rating:
 *           type: integer
 *           description: Rating of the review (from 1 to 5)
 *           example: 4
 *         text:
 *           type: string
 *           description: Text of the review
 *           example: "Great parking spot, clean and secure."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Review creation date and time
 *           example: "2025-04-25T12:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Review update date and time
 *           example: "2025-04-25T12:30:00Z"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             description: Image URL
 *             example: "https://censored-link.com/image1.png"
 *         likesCount:
 *           type: integer
 *           description: Total number of likes for the review
 *           example: 10
 *         liked:
 *           type: boolean
 *           description: Whether the current user liked the review
 *           example: true
 *         user:
 *           type: object
 *           $ref: '#/components/schemas/UserDto'
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewReplyDto'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewImagesDto:
 *       type: object
 *       properties:
 *         reviewId:
 *           type: integer
 *           description: ID of the review to which images are added
 *           example: 123
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *             description: Images to be added to the review (up to 5)
 *             example: "image1.png"
 */

/**
 * @swagger
 * /api/reviews/create:
 *   post:
 *     summary: Create a new review for a point
 *     tags:
 *       - Reviews
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pointId:
 *                 type: integer
 *                 example: 82
 *               rating:
 *                 type: integer
 *                 example: 4
 *               text:
 *                 type: string
 *                 example: "Great parking spot, clean and secure."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: Review images (up to 5)
 *                   example: "image1.png"
 *     responses:
 *       "200":
 *         description: Review successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PointReviewDto'
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
reviewsRouter.post(
  '/create',
  auth,
  uploadMultipleFiles('reviews', 'images', 5),
  createReviewValidator,
  ratingController.createReview,
);

/**
 * @swagger
 * /api/reviews/all/{pointId}:
 *   get:
 *     summary: Get all reviews for a specific point, including replies
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the point
 *     responses:
 *       "200":
 *         description: Successfully retrieved reviews with replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PointReviewWithRepliesDto'
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
reviewsRouter.get(
  '/all/:pointId',
  auth,
  getPointReviewsWithRepliesValidator,
  ratingController.getPointReviewsWithReplies,
);

/**
 * @swagger
 * /api/reviews/images/{reviewId}:
 *   post:
 *     summary: Add multiple images to a review
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *           description: ID of the review
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: Review images (up to 5)
 *                   example: "image1.png"
 *     responses:
 *       "200":
 *         description: Successfully added images
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
reviewsRouter.post(
  '/images/:reviewId',
  auth,
  uploadMultipleFiles('reviews', 'images', 5),
  addImagesToReviewValidator,
  ratingController.addImagesToReview,
);

/**
 * @swagger
 * /api/reviews/reply:
 *   post:
 *     summary: Reply to a review or a comment
 *     tags:
 *       - Reviews
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewId:
 *                 type: integer
 *                 example: 82
 *               text:
 *                 type: string
 *                 example: "Thanks for the feedback!"
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 example: 10
 *     responses:
 *       "200":
 *         description: Successfully created a reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ReviewReplyDto'
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
reviewsRouter.post(
  '/reply',
  auth,
  replyToReviewValidator,
  ratingController.replyToReviewOrComment,
);

/**
 * @swagger
 * /api/reviews/like:
 *   post:
 *     summary: Toggle like on a review
 *     tags:
 *       - Reviews
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewId:
 *                 type: integer
 *                 example: 82
 *     responses:
 *       200:
 *         description: Successfully toggled like
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         liked:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
reviewsRouter.post(
  '/like',
  auth,
  toggleLikeValidator,
  ratingController.toggleLike,
);
