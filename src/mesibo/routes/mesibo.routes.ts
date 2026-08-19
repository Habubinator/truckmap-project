import { Router } from 'express';
import { mesiboController } from '../controllers';
import { uploadSingleFile } from '@common/middlewares';
import { auth } from '@auth/middlewares';

export const mesiboApiRouter = Router();

/**
 * @swagger
 * /api/mesibo-api/upload:
 *   post:
 *     summary: Upload file
 *     tags:
 *       - Mesibo
 *     responses:
 *       "200":
 *         description: Successfull request
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
mesiboApiRouter.post(
  '/upload',
  uploadSingleFile('mesibo', 'photo'),
  mesiboController.saveMesiboFile,
);

/**
 * @swagger
 * /api/mesibo-api/join-chat/{mesiboChatId}:
 *   post:
 *     summary: Add user to a Mesibo chat
 *     tags:
 *       - Mesibo
 *     parameters:
 *       - in: path
 *         name: mesiboChatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The Mesibo chat ID
 *     responses:
 *       "200":
 *         description: User successfully added to the chat
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
 *                   description: mesibo responce
 *       "400":
 *         description: Invalid request or user/chat not found
 *       "500":
 *         description: Internal server error
 */
mesiboApiRouter.post(
  '/join-chat/:mesiboChatId',
  auth,
  mesiboController.addUserToChat,
);

/**
 * @swagger
 * /api/mesibo-api/request:
 *   post:
 *     summary: Request
 *     tags:
 *       - Mesibo
 *     responses:
 *       "200":
 *         description: Successfull request
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
mesiboApiRouter.post('/request', mesiboController.request);

/**
 * @swagger
 * /api/mesibo-api/my-token:
 *   get:
 *     summary: Get my token
 *     tags:
 *       - Mesibo
 *     responses:
 *       "200":
 *         description: Successfull request
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
mesiboApiRouter.get('/my-token', auth, mesiboController.getYourMesiboAccess);

/**
 * @swagger
 * /api/mesibo-api/messages:
 *   get:
 *     summary: Get paginated list of messages for a specific group
 *     tags:
 *       - Mesibo
 *     parameters:
 *       - in: query
 *         name: gid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID for which to retrieve messages
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Successfully retrieved paginated messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       gid:
 *                         type: integer
 *                       title:
 *                         type: string
 *                         nullable: true
 *                       subtitle:
 *                         type: string
 *                         nullable: true
 *                       body:
 *                         type: string
 *                         nullable: true
 *                       url:
 *                         type: string
 *                         nullable: true
 *                       message:
 *                         type: string
 *                         nullable: true
 *                       ts:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *       400:
 *         description: Missing required group ID (gid)
 *       500:
 *         description: Internal server error
 */
mesiboApiRouter.get('/messages', mesiboController.getChatMessages);
