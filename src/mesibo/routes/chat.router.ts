import { Router } from 'express';
import { chatController } from '../controllers';
import { uploadSingleFile } from '@common/middlewares';
import { auth } from '@auth/middlewares';

export const chatRouter = Router();

/**
 * @swagger
 * /api/chats/new:
 *   post:
 *     summary: Create a new chat with optional photo
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Chat avatar image
 *               chatName:
 *                 type: string
 *                 description: Name of the chat
 *               members:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of user IDs to include in the chat
 *             required:
 *               - chatName
 *               - members
 *     responses:
 *       200:
 *         description: Chat created successfully
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
 *                     mesiboId:
 *                       type: integer
 *                       example: 2201
 *                     name:
 *                       type: string
 *                       example: "test"
 *                     photo:
 *                       type: string
 *                       format: uri
 *                       example: "https://app.censored-link.com/static/chats/123.png"
 *                     joinlink:
 *                       type: string
 *                       example: "97ea7cb2-3648-4ff6-a967-08e96476b83a"
 *                     typeId:
 *                       type: integer
 *                       example: 3
 *             example:
 *               success: true
 *               data:
 *                 mesiboId: 2201
 *                 name: "test"
 *                 photo: "https://app.censored-link.com/static/chats/123.png"
 *                 joinlink: "97ea7cb2-3648-4ff6-a967-08e96476b83a"
 *                 typeId: 3
 *       400:
 *         description: Bad request
 */
chatRouter.post(
  '/new',
  auth,
  uploadSingleFile('chats', 'photo'),
  chatController.createChat,
);

/**
 * @swagger
 * /api/chats/update/{chatId}:
 *   post:
 *     summary: Update chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo chat ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Chat avatar image (optional)
 *               chatName:
 *                 type: string
 *                 description: New name of the chat (optional)
 *     responses:
 *       200:
 *         description: Chat updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mesiboId:
 *                   type: integer
 *                   example: 2201
 *                 name:
 *                   type: string
 *                   example: "test"
 *                 photo:
 *                   type: string
 *                   format: uri
 *                   example: "https://app.censored-link.com/static/chats/123.png"
 *                 joinlink:
 *                   type: string
 *                   example: "97ea7cb2-3648-4ff6-a967-08e96476b83a"
 *                 typeId:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Bad request (e.g., invalid chatId or missing parameters)
 *       403:
 *         description: Forbidden (user is not a member or not an admin)
 *       404:
 *         description: Not found (chat with specified chatId does not exist)
 */
chatRouter.post(
  '/update/:chatId',
  auth,
  uploadSingleFile('chats', 'photo'),
  chatController.updateChat,
);

/**
 * @swagger
 * /api/chats/private:
 *   get:
 *     summary: Get private chats of the current user
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: List of private chats
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
 *                       mesiboId:
 *                         type: integer
 *                         example: 2195
 *                       name:
 *                         type: string
 *                         example: "test"
 *                       photo:
 *                         type: string
 *                         example: ""
 *                       joinlink:
 *                         type: string
 *                         example: "0168ee65-7947-4bf1-a1ca-4b28d56784a6"
 *                       typeId:
 *                         type: integer
 *                         example: 3
 *                       _count:
 *                         type: object
 *                         properties:
 *                           members:
 *                             type: integer
 *                             example: 2
 *             example:
 *               success: true
 *               data:
 *                 - mesiboId: 2195
 *                   name: "test"
 *                   photo: ""
 *                   joinlink: "0168ee65-7947-4bf1-a1ca-4b28d56784a6"
 *                   typeId: 3
 *                   _count:
 *                     members: 2
 *                 - mesiboId: 2196
 *                   name: "test"
 *                   photo: ""
 *                   joinlink: "41e75707-952a-4c41-907e-d296ac316586"
 *                   typeId: 3
 *                   _count:
 *                     members: 2
 *                 - mesiboId: 2199
 *                   name: "test"
 *                   photo: ""
 *                   joinlink: "eb34ed6d-e650-48b7-8445-71cf512b6fc0"
 *                   typeId: 3
 *                   _count:
 *                     members: 3
 *       400:
 *         description: Error
 */
chatRouter.get('/private', auth, chatController.getPrivateChatsOfUser);
/**
 * @swagger
 * /api/chats/one/{chatId}/notifications:
 *   patch:
 *     summary: Toggle chat notifications for current user
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo chat ID
 *     responses:
 *       200:
 *         description: Notification setting updated
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
 *                     userId:
 *                       type: integer
 *                       example: 11
 *                     chatId:
 *                       type: integer
 *                       example: 2200
 *                     notifications:
 *                       type: boolean
 *                       example: false
 *                     isAdmin:
 *                       type: boolean
 *                       example: true
 *             example:
 *               success: true
 *               data:
 *                 userId: 11
 *                 chatId: 2200
 *                 notifications: false
 *                 isAdmin: true
 */
chatRouter.patch(
  '/one/:chatId/notifications',
  auth,
  chatController.switchChatNotifications,
);

/**
 * @swagger
 * /api/chats/one/{chatId}/link:
 *   get:
 *     summary: Get join link for a custom chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo chat ID
 *     responses:
 *       200:
 *         description: Join link
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
 *                     link:
 *                       type: string
 *                       example: "b1cd74ed-e265-4374-bfc1-a066a5ebf869"
 *             example:
 *               success: true
 *               data:
 *                 link: "b1cd74ed-e265-4374-bfc1-a066a5ebf869"
 */
chatRouter.get('/one/:chatId/link', auth, chatController.getCustomChatLink);

/**
 * @swagger
 * /api/chats/join/{joinlink}:
 *   post:
 *     summary: Join chat by join link
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: joinlink
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat join link
 *     responses:
 *       200:
 *         description: Joined chat successfully
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
 *                     invited:
 *                       type: integer
 *                       example: 11
 *                     chat:
 *                       type: integer
 *                       example: 2200
 *             example:
 *               success: true
 *               data:
 *                 success: true
 *                 invited: 11
 *                 chat: 2200
 */
chatRouter.post('/join/:joinlink', auth, chatController.joinByChatLink);

/**
 * @swagger
 * /api/chats/one/{chatId}/invite:
 *   post:
 *     summary: Invite multiple users to a chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - userIds
 *           example:
 *             userIds: [17, 18, 19]
 *     responses:
 *       200:
 *         description: Users invited successfully
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
 *                     invited:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [17, 18, 19]
 *                     chat:
 *                       type: integer
 *                       example: 2200
 *             example:
 *               success: true
 *               data:
 *                 invited: [17, 18, 19]
 *                 chat: 2200
 */
chatRouter.post('/one/:chatId/invite', auth, chatController.inviteUsersToChat);

/**
 * @swagger
 * /api/chats/one/{chatId}/users/{userId}/admin:
 *   patch:
 *     summary: Toggle admin status of a chat member
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Mesibo chat ID
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Target user ID
 *     responses:
 *       200:
 *         description: Admin status toggled successfully
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
 *                     userId:
 *                       type: integer
 *                       example: 17
 *                     chatId:
 *                       type: integer
 *                       example: 2200
 *                     isAdmin:
 *                       type: boolean
 *                       example: true
 *             example:
 *               success: true
 *               data:
 *                 userId: 17
 *                 chatId: 2200
 *                 isAdmin: true
 *       400:
 *         description: Bad request (chat/user not found or internal error)
 *       403:
 *         description: Forbidden (requester not admin or not member)
 */
chatRouter.patch(
  '/one/:chatId/users/:userId/admin',
  auth,
  chatController.toggleAdminStatus,
);

/**
 * @swagger
 * /api/chats/one/{chatId}/kick/{userId}:
 *   delete:
 *     summary: Kick a user from a chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User kicked successfully
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
 *                     removedUserId:
 *                       type: integer
 *                       example: 17
 *             example:
 *               success: true
 *               data:
 *                 removedUserId: 17
 */
chatRouter.delete(
  '/one/:chatId/kick/:userId',
  auth,
  chatController.kickUserFromChat,
);

/**
 * @swagger
 * /api/chats/one/{chatId}/leave:
 *   delete:
 *     summary: Leave a chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Left chat successfully
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
 *                     removedUserId:
 *                       type: integer
 *                       example: 11
 *             example:
 *               success: true
 *               data:
 *                 removedUserId: 11
 */
chatRouter.delete('/one/:chatId/leave', auth, chatController.leaveChat);

/**
 * @swagger
 * /api/chats/one/{chatId}:
 *   delete:
 *     summary: Delete a chat
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chat deleted successfully
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
 *                     group:
 *                       type: object
 *                       properties:
 *                         gid:
 *                           type: integer
 *                           example: 2200
 *                     op:
 *                       type: string
 *                       example: "groupdel"
 *                     result:
 *                       type: boolean
 *                       example: true
 *             example:
 *               success: true
 *               data:
 *                 group:
 *                   gid: 2200
 *                 op: "groupdel"
 *                 result: true
 */
chatRouter.delete('/one/:chatId', auth, chatController.deleteChat);

/**
 * @swagger
 * /api/chats/one/{chatId}:
 *   get:
 *     summary: Get chat details by ID
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo chat ID
 *     responses:
 *       200:
 *         description: Chat details
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
 *                     mesiboId:
 *                       type: integer
 *                       example: 2200
 *                     name:
 *                       type: string
 *                       example: "test"
 *                     photo:
 *                       type: string
 *                       example: ""
 *                     joinlink:
 *                       type: string
 *                       example: "b1cd74ed-e265-4374-bfc1-a066a5ebf869"
 *                     typeId:
 *                       type: integer
 *                       example: 3
 *                     point:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 15
 *                         price_per_night:
 *                           type: string
 *                           example: "200"
 *                         type:
 *                           type: string
 *                           example: "Garage"
 *                         chatid:
 *                           type: integer
 *                           example: 2200
 *                         verified:
 *                           type: boolean
 *                           example: true
 *                         number_of_parking_spots:
 *                           type: integer
 *                           example: 10
 *                         address:
 *                           type: string
 *                           example: "123 Street Name, City"
 *                         name:
 *                           type: string
 *                           example: "Central Garage"
 *                         security_rating:
 *                           type: integer
 *                           example: 4
 *                         latitude:
 *                           type: string
 *                           example: "50.4501"
 *                         longitude:
 *                           type: string
 *                           example: "30.5234"
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: integer
 *                             example: 9
 *                           notifications:
 *                             type: boolean
 *                             example: true
 *                           isAdmin:
 *                             type: boolean
 *                             example: false
 *             example:
 *               success: true
 *               data:
 *                 mesiboId: 2200
 *                 name: "test"
 *                 photo: ""
 *                 joinlink: "b1cd74ed-e265-4374-bfc1-a066a5ebf869"
 *                 typeId: 3
 *                 point:
 *                   id: 15
 *                   price_per_night: "200"
 *                   type: "Garage"
 *                   chatid: 2200
 *                   verified: true
 *                   number_of_parking_spots: 10
 *                   address: "123 Street Name, City"
 *                   name: "Central Garage"
 *                   security_rating: 4
 *                   latitude: "50.4501"
 *                   longitude: "30.5234"
 *                 members:
 *                   - userId: 9
 *                     notifications: true
 *                     isAdmin: false
 *                   - userId: 21
 *                     notifications: true
 *                     isAdmin: false
 *                   - userId: 11
 *                     notifications: true
 *                     isAdmin: true
 *                   - userId: 17
 *                     notifications: true
 *                     isAdmin: false
 */
chatRouter.get('/one/:chatId', auth, chatController.getChat);

/**
 * @swagger
 * /api/chats/parking/{chatId}:
 *   get:
 *     summary: Get users in a parking by Mesibo Chat ID
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mesibo Chat ID of the parking
 *     responses:
 *       200:
 *         description: List of users in the parking chat
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
 *                     $ref: '#/components/schemas/UserDto'
 *             example:
 *               success: true
 *               data:
 *                 - id: 11
 *                   mesiboId: 123
 *                   name: "User 007408"
 *                   username: "user123"
 *                   email: "test@gmail.com"
 *                   longitude: "30.5234"
 *                   latitude: "50.4501"
 *                   companyId: 1
 *                   company:
 *                     id: 1
 *                     label: "Acme Corp"
 *                     logo: "acme-logo.png"
 *                   photo: "some-photo.png"
 *                   countryIsoCode: "UA"
 *                   description: "User desc"
 *                   pmConfidenciality: "All"
 *                   regType: 1
 *                   isPublic: true
 *                   isBanned: false
 *                   role:
 *                     id: 3
 *                     name: "user"
 */
chatRouter.get('/parking/:chatId', auth, chatController.getUsersInParking);
