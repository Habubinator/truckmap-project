import { Router } from 'express';
import { userController } from '../controllers';
import { paginateValidator } from '@common/validators';
import { uploadSingleFile } from '@common/middlewares';
import { auth } from '@auth/middlewares';
import { updateUserSocialMediaValidator } from '../validators/user-social-media.validator';
export const usersRouter = Router();

/**
 * @swagger
 * /api/users/all:
 *   get:
 *     summary: Get a paginated list of users, optionally filtered by username
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter users by username (partial match)
 *     responses:
 *       "200":
 *         description: Successfully retrieved users
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
 *                     $ref: '#/components/schemas/UserDto'
 *       "400":
 *         description: Bad request, invalid query parameters
 *       "500":
 *         description: Internal server error
 */
usersRouter.get('/all', auth, paginateValidator, userController.findAll);

/**
 * @swagger
 * /api/users/one/{userId}:
 *   get:
 *     summary: Get a single user by ID (includes subscription and tariff data)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of user
 *     responses:
 *       "200":
 *         description: Successful user object with subscription and tariff information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/UserDto'
 *                     - type: object
 *                       properties:
 *                         subscription:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                             status:
 *                               type: string
 *                               enum: ["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"]
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             autoRenew:
 *                               type: boolean
 *                             tariff:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 currency:
 *                                   type: string
 *                                 duration:
 *                                   type: integer
 *                                 features:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *       "400":
 *         description: Bad request (invalid ID)
 *       "404":
 *         description: User not found
 *       "500":
 *         description: Internal server error
 */
usersRouter.get('/one/:userId', auth, userController.findOne);

/**
 * @swagger
 * /api/users/update-description:
 *   put:
 *     summary: Update user description
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               company:
 *                 type: integer
 *               photo:
 *                 type: string
 *                 format: binary
 *               countryIsoCode:
 *                 type: string
 *               description:
 *                 type: string
 *               pmConfidenciality:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               isShowOnParkings:
 *                 type: boolean
 *     responses:
 *       "200":
 *         description: Successful user object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDto'
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
usersRouter.put(
  '/update-description',
  auth,
  uploadSingleFile('profiles', 'photo'),
  userController.updateUserDescription,
);

/**
 * @swagger
 * /api/users/update-social-media:
 *   put:
 *     summary: Update user social media information
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instagramUrl:
 *                 type: string
 *                 maxLength: 255
 *                 description: Instagram profile URL (must contain 'instagram.com')
 *                 example: "https://instagram.com/johndoe"
 *               facebookUrl:
 *                 type: string
 *                 maxLength: 255
 *                 description: Facebook profile URL (must contain 'facebook.com')
 *                 example: "https://facebook.com/johndoe"
 *               tiktokUrl:
 *                 type: string
 *                 maxLength: 255
 *                 description: TikTok profile URL (must contain 'tiktok.com')
 *                 example: "https://tiktok.com/@johndoe"
 *               whatsappPhone:
 *                 type: string
 *                 maxLength: 32
 *                 description: WhatsApp phone number (accepts +, -, (), spaces)
 *                 example: "+1 (555) 123-4567"
 *               viberPhone:
 *                 type: string
 *                 maxLength: 32
 *                 description: Viber phone number (accepts +, -, (), spaces)
 *                 example: "+380501234567"
 *               telegramPhone:
 *                 type: string
 *                 maxLength: 32
 *                 description: Telegram phone number (accepts +, -, (), spaces)
 *                 example: "+44 20 7946 0958"
 *     responses:
 *       "200":
 *         description: Successful user object with updated social media info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDto'
 *       "400":
 *         description: Bad request - validation errors
 *       "500":
 *         description: Internal server error
 */
usersRouter.put(
  '/update-social-media',
  auth,
  updateUserSocialMediaValidator,
  userController.updateUserSocialMedia,
);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile (includes subscription and tariff data)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Current user object with subscription and tariff information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/UserDto'
 *                     - type: object
 *                       properties:
 *                         subscription:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                             status:
 *                               type: string
 *                               enum: ["ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"]
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             autoRenew:
 *                               type: boolean
 *                             tariff:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                                 price:
 *                                   type: number
 *                                 currency:
 *                                   type: string
 *                                 duration:
 *                                   type: integer
 *                                 features:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: User not found
 *       "500":
 *         description: Internal server error
 */
usersRouter.get('/me', auth, userController.me);

/**
 * @swagger
 * /api/users/friends/accept/{userId}:
 *   post:
 *     summary: Accept a friend request or send one.
 *     tags:
 *       - Friends
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose request is being accepted
 *     responses:
 *       "200":
 *         description: List of incoming friend requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FriendRequestDto'
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
usersRouter.post('/friends/accept/:id', auth, userController.acceptRequest);

/**
 * @swagger
 * /api/users/friends/deny/{userId}:
 *   delete:
 *     summary: Deny or cancel a friend request
 *     tags:
 *       - Friends
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to deny or delete
 *     responses:
 *       "200":
 *         description: Friend request denied or deleted
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
usersRouter.delete('/friends/deny/:id', auth, userController.denyRequest);

/**
 * @swagger
 * /api/users/friends/user/{userId}:
 *   get:
 *     summary: Get a list of friends for a specific user
 *     tags:
 *       - Friends
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose friends to retrieve
 *     responses:
 *       "200":
 *         description: List of friends
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
 *       "400":
 *         description: Invalid user ID
 *       "500":
 *         description: Internal server error
 */
usersRouter.get('/friends/user/:id', auth, userController.userFriends);

/**
 * @swagger
 * /api/users/friends/me:
 *   get:
 *     summary: Get the current user's friends
 *     tags:
 *       - Friends
 *     responses:
 *       "200":
 *         description: List of current user's friends, sent and incoming invitations
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
 *                     friends:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserDto'
 *                     invitesSent:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserDto'
 *                     invitesIncoming:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UserDto'
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
usersRouter.get('/friends/me', auth, userController.myFriends);

/**
 * @swagger
 * /api/users/location/update:
 *   post:
 *     summary: Update user's location
 *     tags:
 *       - Location
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: string
 *                 example: "48.8584"
 *               longitude:
 *                 type: string
 *                 example: "2.2945"
 *               reason:
 *                 type: string
 *                 example: "Just because"
 *             required:
 *               - latitude
 *               - longitude
 *     responses:
 *       "200":
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDto'
 *       "400":
 *         description: Invalid request
 *       "500":
 *         description: Internal server error
 */
usersRouter.post('/location/update', auth, userController.updateLocation);

/**
 * @swagger
 * /api/users/location/get-closest:
 *   get:
 *     summary: Get closest parking points to the user's location
 *     tags:
 *       - Location
 *     responses:
 *       "200":
 *         description: List of closest points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PointDto'
 *       "400":
 *         description: Missing or invalid parameters
 *       "500":
 *         description: Internal server error
 */
usersRouter.get(
  '/location/get-closest',
  auth,
  userController.getClosestParkings,
);

/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Get your notifications
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedNotifications'
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
usersRouter.get('/notifications', auth, userController.getNotifications);

/**
 * @swagger
 * /api/users/notifications/{notificationId}:
 *   patch:
 *     summary: Mark notification as read
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification UUID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
usersRouter.patch(
  '/notifications/:notificationId',
  auth,
  userController.markAsRead,
);

/**
 * @swagger
 * /api/users/get-qa-stats:
 *   get:
 *     summary: Get question and answers statistics for user
 *     description: Returns comprehensive statistics about user's questions and answers activity
 *     tags:
 *       - Users
 *     responses:
 *       "200":
 *         description: Successful response with Q&A statistics
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: integer
 *                           description: Total number of questions created by the user
 *                           example: 15
 *                         totalAnswers:
 *                           type: integer
 *                           description: Total number of answers provided by the user
 *                           example: 42
 *                         bestAnswers:
 *                           type: integer
 *                           description: Number of user's answers that were marked as best answers
 *                           example: 8
 *                         uselessAnswers:
 *                           type: integer
 *                           description: Number of user's useless answers
 *                           example: 5
 *       "400":
 *         description: Bad request (invalid user ID)
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
 *                   example: "Invalid user ID"
 *       "404":
 *         description: User not found
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
 *                   example: "User not found"
 *       "500":
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
usersRouter.get('/get-qa-stats', auth, userController.getQuestionAnswerStats);

/**
 * @swagger
 * /api/users/reports:
 *   post:
 *     summary: Submit a parking or message complaint
 *     description: |
 *       Two complaint flows are supported for the mobile app:
 *
 *       **Parking complaint** (`type: "PARKING_SPOT"`):
 *       Report a parking spot problem. Use `category: "parking"`, include
 *       `metadata.parkingId` and `metadata.reasons` array.
 *       Available reasons: `closed`, `wrong_category` (can select one or both).
 *       Limit: 1 parking complaint per 24 hours (any spot).
 *
 *       **Message complaint** (`type: "CONTENT"`):
 *       Report a chat message. Use `category: "message"`, set `reportedId` to the
 *       message author's userId, include `metadata.messageId` and `metadata.reasons` array.
 *       Available reasons: `spam`, `threats`, `insult`, `fraud`, `pornography` (select one or more).
 *       Limit: 1 complaint per reported user per 24 hours.
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - category
 *               - reason
 *             properties:
 *               type:
 *                 type: string
 *                 enum: ["USER", "CONTENT", "PARKING_SPOT", "SAFETY_ISSUE", "SPAM", "HARASSMENT", "OTHER"]
 *                 description: Use `PARKING_SPOT` for parking complaints, `CONTENT` for message complaints.
 *                 example: "PARKING_SPOT"
 *               category:
 *                 type: string
 *                 description: Use `"parking"` for parking complaints, `"message"` for message complaints.
 *                 example: "parking"
 *               reason:
 *                 type: string
 *                 description: Use `"Parking complaint"` or `"Message complaint"`.
 *                 example: "Parking complaint"
 *               reportedId:
 *                 type: integer
 *                 description: userId of the message author. Required for message complaints, omit for parking complaints.
 *                 example: 42
 *               metadata:
 *                 type: object
 *                 description: |
 *                   For **parking**: `{ parkingId: string, reasons: ("closed"|"wrong_category")[] }`
 *                   For **message**: `{ messageId: string, reasons: ("spam"|"threats"|"insult"|"fraud"|"pornography")[] }`
 *                 example: {"parkingId": "parking_789", "reasons": ["closed", "wrong_category"]}
 *           examples:
 *             parking_complaint:
 *               summary: Parking — closed and wrong category selected
 *               value:
 *                 type: "PARKING_SPOT"
 *                 category: "parking"
 *                 reason: "Parking complaint"
 *                 metadata:
 *                   parkingId: "parking_789"
 *                   reasons: ["closed", "wrong_category"]
 *             message_complaint:
 *               summary: Message — spam and threats selected
 *               value:
 *                 type: "CONTENT"
 *                 category: "message"
 *                 reason: "Message complaint"
 *                 reportedId: 42
 *                 metadata:
 *                   messageId: "msg_abc123"
 *                   reasons: ["spam", "threats"]
 *     responses:
 *       "201":
 *         description: Report created successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     type:
 *                       type: string
 *                       example: "PARKING_SPOT"
 *                     category:
 *                       type: string
 *                       example: "parking"
 *                     reason:
 *                       type: string
 *                       example: "Parking complaint"
 *                     status:
 *                       type: string
 *                       enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"]
 *                       example: "PENDING"
 *                     metadata:
 *                       type: object
 *                       example: {"parkingId": "parking_789", "reasons": ["closed", "wrong_category"]}
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-04-20T10:30:00Z"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         username:
 *                           type: string
 *                         name:
 *                           type: string
 *                     reportedUser:
 *                       type: object
 *                       nullable: true
 *                       description: Populated only for message complaints (type CONTENT)
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 42
 *                         username:
 *                           type: string
 *                           example: "baduser"
 *                         name:
 *                           type: string
 *                           example: "Bad User"
 *       "400":
 *         description: Validation error
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
 *                   examples:
 *                     invalid_type:
 *                       value: "Invalid report type"
 *                     missing_fields:
 *                       value: "Category and reason are required"
 *                     user_not_found:
 *                       value: "Reported user not found"
 *                     self_report:
 *                       value: "You cannot report yourself"
 *                     duplicate:
 *                       value: "You have already submitted a similar report in the last 24 hours"
 *       "401":
 *         description: Unauthorized
 *   get:
 *     summary: Get current user's submitted reports
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       "200":
 *         description: Success
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           type:
 *                             type: string
 *                             enum: ["PARKING_SPOT", "CONTENT"]
 *                             example: "CONTENT"
 *                           category:
 *                             type: string
 *                             example: "message"
 *                           reason:
 *                             type: string
 *                             example: "Message complaint"
 *                           status:
 *                             type: string
 *                             enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"]
 *                             example: "PENDING"
 *                           metadata:
 *                             type: object
 *                             example: {"messageId": "msg_abc123", "reasons": ["spam"]}
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           resolvedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                           reportedUser:
 *                             type: object
 *                             nullable: true
 *                             description: Populated for message complaints only
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pageSize:
 *                           type: integer
 *                           example: 20
 *                         pageCount:
 *                           type: integer
 *                           example: 3
 *                         total:
 *                           type: integer
 *                           example: 50
 *                         prevPage:
 *                           type: integer
 *                           nullable: true
 *                           example: null
 *                         nextPage:
 *                           type: integer
 *                           nullable: true
 *                           example: 2
 *       "401":
 *         description: Unauthorized
 */
usersRouter.route('/reports')
  .post(auth, userController.createReport)
  .get(auth, paginateValidator, userController.getUserReports);

/**
 * @swagger
 * /api/users/companies:
 *   post:
 *     summary: Create a new company
 *     description: |
 *       Submit a new company for admin review. The company is created with `PENDING` status and will not appear in the
 *       app until an admin approves it. The creator receives a push notification when the request is approved or rejected.
 *     tags:
 *       - Companies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *             properties:
 *               label:
 *                 type: string
 *                 description: The company name/label (must be unique)
 *                 example: "Transport Solutions LLC"
 *     responses:
 *       "201":
 *         description: Company created successfully
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
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     label:
 *                       type: string
 *                       example: "Transport Solutions LLC"
 *                     logo:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     status:
 *                       type: string
 *                       enum: ["PENDING", "APPROVED", "REJECTED"]
 *                       example: "PENDING"
 *                       description: Always PENDING on creation. Admin must approve before the company is visible.
 *                     chatId:
 *                       type: integer
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     _count:
 *                       type: object
 *                       properties:
 *                         members:
 *                           type: integer
 *                           example: 0
 *       "400":
 *         description: Bad request - company with this label already exists
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
 *                   example: "Company with this label already exists"
 *       "401":
 *         description: Unauthorized - invalid or missing authentication token
 *       "500":
 *         description: Internal server error
 */
usersRouter.post('/companies', auth, userController.createCompany);
