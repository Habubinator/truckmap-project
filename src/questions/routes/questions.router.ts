import { Router } from 'express';
import { questionController } from '../controllers';
import { auth } from '@auth/middlewares';
import {
  createAnswerValidator,
  voteAnswerValidator,
  voteQuestionValidator,
  markAnswerIrrelevantValidator,
  markBestAnswerValidator,
} from '@questions/validators';
export const questionsRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaginateDto:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number
 *           example: 1
 *         pageSize:
 *           type: integer
 *           description: Page size
 *           example: 20
 *         pageCount:
 *           type: integer
 *           description: Total number of pages
 *           example: 0
 *         total:
 *           type: integer
 *           description: Total number of items
 *           example: 0
 *     QSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         subsections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QSubsection'
 *     QSubsection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         sectionId:
 *           type: integer
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "How do I implement voting in a Q&A system?"
 *         content:
 *           type: string
 *           example: "I'm building a Q&A app and want to allow users to vote on answers..."
 *         sectionId:
 *           type: integer
 *           example: 3
 *         subsectionId:
 *           type: integer
 *           nullable: true
 *           example: 5
 *         resolved:
 *           type: boolean
 *           example: false
 *         creatorId:
 *           type: integer
 *           example: 42
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-24T12:34:56Z"
 *         bestAnswerId:
 *           type: integer
 *           nullable: true
 *           example: 101
 *
 *     Answer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         content:
 *           type: string
 *           example: "You can add a voteCount field and update it when users vote."
 *         questionId:
 *           type: integer
 *           example: 1
 *         authorId:
 *           type: integer
 *           example: 99
 *         author:
 *           $ref: '#/components/schemas/UserShort'
 *         markedAsIrrelevant:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-24T14:00:00Z"
 *         _count:
 *           type: object
 *           description: Prisma count object for linked data models
 *           properties:
 *             replies:
 *               type: integer
 *               description: Comments count
 *               example: 3
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserShort:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "John Doe"
 *         username:
 *           type: string
 *           example: "johndoe"
 *         photo:
 *           type: string
 *           nullable: true
 *           example: "https://censored-link.com/avatar.png"
 *         company:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               example: 2
 *             name:
 *               type: string
 *               example: "OpenAI"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       required:
 *         - success
 *         - data
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           description: Основная полезная нагрузка ответа
 */

/**
 * @swagger
 * /api/questions/all:
 *   get:
 *     summary: Retrieve all questions
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: integer
 *         description: Filter questions by section ID
 *       - in: query
 *         name: subsectionId
 *         schema:
 *           type: integer
 *         description: Filter questions by subsection ID
 *     responses:
 *       200:
 *         description: Successful request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Question'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         pageCount:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.get('/all', auth, questionController.findAll);

/**
 * @swagger
 * /api/questions/one/{questionId}:
 *   get:
 *     summary: Get one question
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID вопроса
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Question'
 *                   properties:
 *                     section:
 *                       $ref: '#/components/schemas/QSection'
 *                     subsection:
 *                       $ref: '#/components/schemas/QSubsection'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get('/one/:questionId', auth, questionController.findOne);

/**
 * @swagger
 * /api/questions/user/answered:
 *   get:
 *     summary: Get users questions that have been answered by authorized user
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get(
  '/user/answered',
  auth,
  questionController.getQuestionsThatAnswered,
);

/**
 * @swagger
 * /api/questions/user/{userId}:
 *   get:
 *     summary: Get users questions
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get('/user/:userId', auth, questionController.getUserQuestions);

/**
 * @swagger
 * /api/questions/my:
 *   get:
 *     summary: Get my questions
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get('/my', auth, questionController.getMyQuestions);

/**
 * @swagger
 * /api/questions/search:
 *   get:
 *     summary: Search questions
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: query
 *         name: phrase
 *         schema:
 *           type: string
 *         description: Search phrase
 *       - in: query
 *         name: titleOnly
 *         schema:
 *           type: string
 *         description: Search only by title
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successful request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Question'
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         pageCount:
 *                           type: integer
 *                         total:
 *                           type: integer
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.get('/search', auth, questionController.searchQuestion);

/**
 * @swagger
 * /api/questions/sections:
 *   get:
 *     summary: Get sections
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QSection'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get('/sections', auth, questionController.getSections);

/**
 * @swagger
 * /api/questions/subsections/{sectionId}:
 *   get:
 *     summary: Get sub-sections of a section
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID раздела
 *     responses:
 *       200:
 *         description: Успешный запрос
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/QSubsection'
 *       400:
 *         description: Ошибка запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */
questionsRouter.get(
  '/subsections/:sectionId',
  auth,
  questionController.getSubSections,
);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the question (less than 64 symbols)
 *               content:
 *                 type: string
 *                 description: The content of the question
 *               sectionId:
 *                 type: integer
 *                 description: The ID of the section the question belongs to
 *               subsectionId:
 *                 type: integer
 *                 nullable: true
 *                 description: The ID of the subsection the question belongs to (optional)
 *     responses:
 *       200:
 *         description: The created question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       400:
 *         description: Bad request, invalid input
 *       500:
 *         description: Internal server error
 */
questionsRouter.post('/', auth, questionController.createQuestion);

/**
 * @swagger
 * /api/questions/answers:
 *   post:
 *     summary: Create an answer for a question
 *     tags:
 *       - Answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - content
 *             properties:
 *               questionId:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: The created answer
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Answer'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/answers',
  auth,
  createAnswerValidator,
  questionController.createAnswer,
);

/**
 * @swagger
 * /api/questions/vote:
 *   post:
 *     summary: Vote on a question
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionId
 *               - value
 *             properties:
 *               questionId:
 *                 type: integer
 *               value:
 *                 type: integer
 *                 enum: [-1, 1]
 *     responses:
 *       200:
 *         description: The vote result
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
 *                         value:
 *                           type: integer
 *                           example: 10
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/vote',
  auth,
  voteQuestionValidator,
  questionController.voteQuestion,
);

/**
 * @swagger
 * /api/questions/answers/vote:
 *   post:
 *     summary: Vote on an answer
 *     tags:
 *       - Answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerId
 *               - value
 *             properties:
 *               answerId:
 *                 type: integer
 *               value:
 *                 type: integer
 *                 enum: [-1, 1]
 *     responses:
 *       200:
 *         description: The vote result
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
 *                         value:
 *                           type: integer
 *                           example: 5
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/answers/vote',
  auth,
  voteAnswerValidator,
  questionController.voteAnswer,
);

/**
 * @swagger
 * /api/questions/answers/irrelevant:
 *   post:
 *     summary: Mark an answer as irrelevant (author only)
 *     tags:
 *       - Answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerId
 *             properties:
 *               answerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The updated answer
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Answer'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/answers/irrelevant',
  auth,
  markAnswerIrrelevantValidator,
  questionController.markAnswerIrrelevant,
);

/**
 * @swagger
 * /api/questions/answers/best:
 *   post:
 *     summary: Mark an answer as best (author only)
 *     tags:
 *       - Answer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answerId
 *             properties:
 *               answerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The updated question
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Question'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/answers/best',
  auth,
  markBestAnswerValidator,
  questionController.markBestAnswer,
);

/**
 * @swagger
 * components:
 *   schemas:
 *     AnswerComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         content:
 *           type: string
 *           example: "This is a helpful comment on the answer"
 *         answerId:
 *           type: integer
 *           example: 101
 *         authorId:
 *           type: integer
 *           example: 42
 *         parentId:
 *           type: integer
 *           nullable: true
 *           example: null
 *         isEdited:
 *           type: boolean
 *           example: false
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-24T15:30:00Z"
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             username:
 *               type: string
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AnswerComment'
 *
 *     CommentVote:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 42
 *         commentId:
 *           type: integer
 *           example: 1
 *         value:
 *           type: integer
 *           enum: [-1, 0, 1]
 *           example: 1
 *
 *     EditAnswerRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           example: "Updated answer content with more details"
 *
 *     CreateCommentRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           example: "This is a comment on the answer"
 *         parentId:
 *           type: integer
 *           nullable: true
 *           example: null
 *           description: ID of parent comment for nested replies
 *
 *     EditCommentRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           example: "Updated comment content"
 *
 *     VoteCommentRequest:
 *       type: object
 *       required:
 *         - commentId
 *         - value
 *       properties:
 *         commentId:
 *           type: integer
 *           example: 1
 *         value:
 *           type: integer
 *           enum: [-1, 0, 1]
 *           example: 1
 *           description: "Vote value: -1 for downvote, 0 to remove vote, 1 for upvote"
 */

/**
 * @swagger
 * /api/questions/answers/{answerId}:
 *   put:
 *     summary: Edit an answer
 *     tags:
 *       - Answer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the answer to edit
 *         example: 101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditAnswerRequest'
 *     responses:
 *       200:
 *         description: Answer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Answer'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user not authorized to edit this answer
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.put('/answers/:answerId', auth, questionController.editAnswer);

/**
 * @swagger
 * /api/questions/answers/{answerId}:
 *   delete:
 *     summary: Delete an answer
 *     tags:
 *       - Answer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the answer to delete
 *         example: 101
 *     responses:
 *       200:
 *         description: Answer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Answer deleted successfully"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user not authorized to delete this answer
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.delete(
  '/answers/:answerId',
  auth,
  questionController.deleteAnswer,
);

/**
 * @swagger
 * /api/questions/answers/{answerId}/comments:
 *   get:
 *     summary: Get comments for an answer
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the answer to get comments for
 *         example: 101
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AnswerComment'
 *                     meta:
 *                       $ref: '#/components/schemas/PaginateDto'
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.get(
  '/answers/:answerId/comments',
  auth,
  questionController.getCommentsByAnswer,
);

/**
 * @swagger
 * /api/questions/answers/{answerId}/comments:
 *   post:
 *     summary: Create a comment on an answer
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the answer to comment on
 *         example: 101
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       200:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AnswerComment'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Answer not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.post(
  '/answers/:answerId/comments',
  auth,
  questionController.createComment,
);

/**
 * @swagger
 * /api/questions/comments/{commentId}:
 *   put:
 *     summary: Edit a comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to edit
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditCommentRequest'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AnswerComment'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user not authorized to edit this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.put(
  '/comments/:commentId',
  auth,
  questionController.editComment,
);

/**
 * @swagger
 * /api/questions/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Comment deleted successfully"
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - user not authorized to delete this comment
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.delete(
  '/comments/:commentId',
  auth,
  questionController.deleteComment,
);

/**
 * @swagger
 * /api/questions/comments/vote:
 *   post:
 *     summary: Vote on a comment
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoteCommentRequest'
 *     responses:
 *       200:
 *         description: Vote registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CommentVote'
 *       400:
 *         description: Bad request - invalid input data
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
questionsRouter.post('/comments/vote', auth, questionController.voteComment);

/**
 * @swagger
 * /api/questions/top-best:
 *   get:
 *     summary: Get top best users by answer score
 *     description: Returns top 20 users with highest answer scores (best answer quality)
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: Top best users retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                         example: 123
 *                       name:
 *                         type: string
 *                         description: User's display name
 *                         example: "John Doe"
 *                       username:
 *                         type: string
 *                         description: User's username
 *                         example: "johndoe"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         description: User's profile photo URL
 *                         example: "https://censored-link.com/photo.jpg"
 *                       answerScore:
 *                         type: integer
 *                         description: answer score
 *                         example: 100
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
questionsRouter.get('/top-best', questionController.getTopBest);

/**
 * @swagger
 * /api/questions/top-active:
 *   get:
 *     summary: Get top active users by answers count
 *     description: Returns top 20 users with highest number of answers (most active contributors)
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: Top active users retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                         example: 123
 *                       name:
 *                         type: string
 *                         description: User's display name
 *                         example: "John Doe"
 *                       username:
 *                         type: string
 *                         description: User's username
 *                         example: "johndoe"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         description: User's profile photo URL
 *                         example: "https://censored-link.com/photo.jpg"
 *                       _count:
 *                         type: object
 *                         description: Answer count statistics
 *                         properties:
 *                           Answer:
 *                             type: integer
 *                             description: Total number of answers provided by the user
 *                             example: 42
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
questionsRouter.get('/top-active', questionController.getTopActive);
