import { Router } from 'express';
import { adminController } from '../controllers';
import { auth } from '@auth/middlewares';
import { roles } from '@auth/middlewares';
import { Roles } from '@auth/enums';

export const adminRouter = Router();

// Authentication Routes
/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags:
 *       - Admin - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username or email
 *               password:
 *                 type: string
 *                 description: Password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       400:
 *         description: Invalid credentials
 *       403:
 *         description: Not an admin user
 */
adminRouter.post('/login', adminController.login);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Admin logout
 *     tags:
 *       - Admin - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
adminRouter.post('/logout', auth, adminController.logout);

/**
 * @swagger
 * /api/admin/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Admin - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
adminRouter.post('/refresh', adminController.refresh);

// Dashboard Routes
/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags:
 *       - Admin - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                     users:
 *                       type: object
 *                     content:
 *                       type: object
 *                     reports:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  '/dashboard/stats',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getDashboardStats,
);

/**
 * @swagger
 * /api/admin/system/status:
 *   get:
 *     summary: Get system status (Mesibo, message server)
 *     tags:
 *       - Admin - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
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
 *                     mesibo:
 *                       type: object
 *                     messageServer:
 *                       type: object
 *                     serverTime:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
adminRouter.get(
  '/system/status',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getSystemStatus,
);

/**
 * @swagger
 * /api/admin/dashboard/chart:
 *   get:
 *     summary: Get dashboard chart data
 *     tags:
 *       - Admin - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [new-users, active-users, subscribers, user-locations]
 *         description: Chart type
 *     responses:
 *       200:
 *         description: Chart data
 */
adminRouter.get(
  '/dashboard/chart',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getDashboardChartData,
);

// Profile Management Routes

/**
 * @swagger
 * /api/admin/users/{userId}/grant-premium:
 *   post:
 *     summary: Grant premium account to user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tariffId:
 *                 type: integer
 *                 description: Specific tariff ID (optional, uses highest tier if not provided)
 *     responses:
 *       200:
 *         description: Premium granted successfully
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
 *                       example: "Premium granted successfully"
 *                     subscription:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.post(
  '/users/:userId/grant-premium',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.grantPremium,
);

/**
 * @swagger
 * /api/admin/users/{userId}/revoke-premium:
 *   delete:
 *     summary: Revoke premium account from user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Premium revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.delete(
  '/users/:userId/revoke-premium',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.revokePremium,
);

/**
 * @swagger
 * /api/admin/users/{userId}/ban:
 *   post:
 *     summary: Ban user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Violation of community guidelines"
 *               duration:
 *                 type: string
 *                 enum: ["12h", "24h", "permanent"]
 *                 example: "24h"
 *             required:
 *               - reason
 *               - duration
 *     responses:
 *       200:
 *         description: User banned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.post(
  '/users/:userId/ban',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.banUser,
);

/**
 * @swagger
 * /api/admin/users/{userId}/unban:
 *   delete:
 *     summary: Unban user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unbanned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.delete(
  '/users/:userId/unban',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.unbanUser,
);

/**
 * @swagger
 * /api/admin/users/{userId}/mute:
 *   post:
 *     summary: Mute user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: string
 *                 enum: ["12h", "24h", "permanent"]
 *                 example: "12h"
 *             required:
 *               - duration
 *     responses:
 *       200:
 *         description: User muted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.post(
  '/users/:userId/mute',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.muteUser,
);

/**
 * @swagger
 * /api/admin/users/{userId}/unmute:
 *   delete:
 *     summary: Unmute user
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User unmuted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.delete(
  '/users/:userId/unmute',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.unmuteUser,
);

/**
 * @swagger
 * /api/admin/users/{userId}/grant-admin:
 *   post:
 *     summary: Grant admin privileges to user (SuperAdmin only)
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Admin privileges granted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (SuperAdmin only)
 *       404:
 *         description: User not found
 */
adminRouter.post(
  '/users/:userId/grant-admin',
  auth,
  roles(Roles.SuperAdmin),
  adminController.grantAdmin,
);

/**
 * @swagger
 * /api/admin/users/{userId}/revoke-admin:
 *   delete:
 *     summary: Revoke admin privileges from user (SuperAdmin only)
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Admin privileges revoked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions (SuperAdmin only)
 *       404:
 *         description: User not found
 */
adminRouter.delete(
  '/users/:userId/revoke-admin',
  auth,
  roles(Roles.SuperAdmin),
  adminController.revokeAdmin,
);

/**
 * @swagger
 * /api/admin/users/{userId}/edit-profile:
 *   put:
 *     summary: Edit user profile information
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               description:
 *                 type: string
 *               companyId:
 *                 type: integer
 *               countryIsoCode:
 *                 type: string
 *               pmConfidenciality:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *               isShowOnParkings:
 *                 type: boolean
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.put(
  '/users/:userId/edit-profile',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.editUserProfile,
);

/**
 * @swagger
 * /api/admin/users/{userId}/delete-photo:
 *   delete:
 *     summary: Delete user profile photo
 *     tags:
 *       - Admin - Profile Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile photo deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.delete(
  '/users/:userId/delete-photo',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deleteUserPhoto,
);

// Messenger Management Routes

/**
 * @swagger
 * /api/admin/chats/{chatId}/messages:
 *   get:
 *     summary: Get all messages from a group without validation
 *     tags:
 *       - Admin - Messenger
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Chat ID
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
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
adminRouter.get(
  '/chats/:chatId/messages',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getGroupMessages,
);

// Q&A Management Routes

/**
 * @swagger
 * /api/admin/answers/{answerId}:
 *   delete:
 *     summary: Delete an answer
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Answer ID
 *     responses:
 *       200:
 *         description: Answer deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Answer not found
 */
adminRouter.delete(
  '/answers/:answerId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deleteAnswer,
);

/**
 * @swagger
 * /api/admin/answers/{answerId}/set-best:
 *   post:
 *     summary: Mark answer as best answer for a question
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Answer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: integer
 *             required:
 *               - questionId
 *     responses:
 *       200:
 *         description: Answer marked as best successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Answer or question not found
 */
adminRouter.post(
  '/answers/:answerId/set-best',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.setBestAnswer,
);

/**
 * @swagger
 * /api/admin/answers/{answerId}/unset-best:
 *   post:
 *     summary: Remove best answer status
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Answer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Best answer status removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
adminRouter.post(
  '/answers/:answerId/unset-best',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.unsetBestAnswer,
);

/**
 * @swagger
 * /api/admin/answers/{answerId}/set-useless:
 *   post:
 *     summary: Mark answer as useless
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Answer ID
 *     responses:
 *       200:
 *         description: Answer marked as useless successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Answer not found
 */
adminRouter.post(
  '/answers/:answerId/set-useless',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.setUselessAnswer,
);

/**
 * @swagger
 * /api/admin/answers/{answerId}/unset-useless:
 *   post:
 *     summary: Remove irrelevant/useless status from answer
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Answer ID
 *     responses:
 *       200:
 *         description: Irrelevant status removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Answer not found
 */
adminRouter.post(
  '/answers/:answerId/unset-useless',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.unsetUselessAnswer,
);

/**
 * @swagger
 * /api/admin/questions/{questionId}:
 *   delete:
 *     summary: Delete a question
 *     tags:
 *       - Admin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Question not found
 */
adminRouter.delete(
  '/questions/:questionId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deleteQuestion,
);

// Subscription Management Routes

/**
 * @swagger
 * /api/admin/users/{userId}/subscription:
 *   get:
 *     summary: Get user's current subscription
 *     tags:
 *       - Admin - Subscription Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User subscription retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     tariff:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.get(
  '/users/:userId/subscription',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getUserSubscription,
);

/**
 * @swagger
 * /api/admin/users/{userId}/premium-status:
 *   get:
 *     summary: Check if user has active premium subscription
 *     tags:
 *       - Admin - Subscription Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Premium status checked successfully
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
 *                     isPremium:
 *                       type: boolean
 *                     subscription:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
adminRouter.get(
  '/users/:userId/premium-status',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.checkUserPremium,
);

// Tariff Management Routes

/**
 * @swagger
 * /api/admin/tariffs:
 *   get:
 *     summary: Get all active tariffs
 *     tags:
 *       - Admin - Tariff Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tariffs retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       features:
 *                         type: array
 *                       isActive:
 *                         type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
adminRouter.get(
  '/tariffs',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllTariffs,
);

/**
 * @swagger
 * /api/admin/tariffs:
 *   post:
 *     summary: Create new tariff
 *     tags:
 *       - Admin - Tariff Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Monthly"
 *               description:
 *                 type: string
 *                 example: "Monthly premium subscription with all features"
 *               price:
 *                 type: number
 *                 example: 9.99
 *               currency:
 *                 type: string
 *                 enum: ["USD", "EUR", "UAH", "PLN", "CZK", "HUF", "RON"]
 *                 example: "USD"
 *               duration:
 *                 type: integer
 *                 example: 30
 *                 description: Duration in days
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Unlimited questions", "Premium support", "Advanced statistics"]
 *               isActive:
 *                 type: boolean
 *                 example: true
 *             required:
 *               - name
 *               - price
 *               - duration
 *     responses:
 *       200:
 *         description: Tariff created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
adminRouter.post(
  '/tariffs',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.createTariff,
);

/**
 * @swagger
 * /api/admin/tariffs/{tariffId}:
 *   put:
 *     summary: Update existing tariff
 *     tags:
 *       - Admin - Tariff Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tariffId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tariff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: ["USD", "EUR", "UAH", "PLN", "CZK", "HUF", "RON"]
 *               duration:
 *                 type: integer
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tariff updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Tariff not found
 */
adminRouter.put(
  '/tariffs/:tariffId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updateTariff,
);

/**
 * @swagger
 * /api/admin/tariffs/{tariffId}/deactivate:
 *   delete:
 *     summary: Deactivate tariff
 *     tags:
 *       - Admin - Tariff Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tariffId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tariff ID
 *     responses:
 *       200:
 *         description: Tariff deactivated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Tariff not found
 */
adminRouter.delete(
  '/tariffs/:tariffId/deactivate',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deactivateTariff,
);

// Report Management Routes

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get all reports with filtering options
 *     description: Retrieve a paginated list of all reports submitted by users. Supports filtering by status, type, user, and reported user.
 *     tags:
 *       - Admin - Report Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of reports per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"]
 *         description: Filter by report status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ["USER", "CONTENT", "PARKING_SPOT", "SAFETY_ISSUE", "SPAM", "HARASSMENT", "OTHER"]
 *         description: Filter by report type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user who created the report
 *       - in: query
 *         name: reportedId
 *         schema:
 *           type: integer
 *         description: Filter by user who was reported
 *     responses:
 *       200:
 *         description: Successfully retrieved reports
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           type:
 *                             type: string
 *                             example: "USER"
 *                           category:
 *                             type: string
 *                             example: "harassment"
 *                           reason:
 *                             type: string
 *                             example: "Inappropriate behavior"
 *                           description:
 *                             type: string
 *                             example: "Additional details"
 *                           status:
 *                             type: string
 *                             example: "PENDING"
 *                           metadata:
 *                             type: object
 *                             example: {"chatId": 456}
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           resolvedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           reportedUser:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           resolver:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               username:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
adminRouter.get(
  '/reports',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllReports,
);

/**
 * @swagger
 * /api/admin/reports/user/{userId}:
 *   get:
 *     summary: Get all reports for a specific user
 *     description: Retrieve reports created by or about a specific user. Includes both reports the user submitted and reports made against them.
 *     tags:
 *       - Admin - Report Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get reports for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of reports per page
 *     responses:
 *       200:
 *         description: Successfully retrieved user reports
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
 *                   description: Same structure as getAllReports response
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
adminRouter.get(
  '/reports/user/:userId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getReportsForUser,
);

/**
 * @swagger
 * /api/admin/reports/{reportId}:
 *   get:
 *     summary: Get specific report by ID
 *     description: Retrieve detailed information about a specific report including all user details and metadata.
 *     tags:
 *       - Admin - Report Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Successfully retrieved report
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
 *                   description: Complete report object with user details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 *   patch:
 *     summary: Update report status
 *     description: Update the status of a report (e.g., mark as resolved, rejected, etc.). Automatically sets resolvedAt and resolvedBy when marking as resolved or closed.
 *     tags:
 *       - Admin - Report Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"]
 *                 description: New status for the report
 *                 example: "RESOLVED"
 *               reason:
 *                 type: string
 *                 description: Optional reason for the status change
 *                 example: "Issue has been addressed and resolved"
 *     responses:
 *       200:
 *         description: Report status updated successfully
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
 *                   description: Updated report object
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Report not found
 *       500:
 *         description: Internal server error
 */
adminRouter
  .get(
    '/reports/:reportId',
    auth,
    roles(Roles.Admin, Roles.SuperAdmin),
    adminController.getReportById,
  )
  .patch(
    '/reports/:reportId',
    auth,
    roles(Roles.Admin, Roles.SuperAdmin),
    adminController.updateReportStatus,
  );

/**
 * @swagger
 * /api/admin/reports/stats:
 *   get:
 *     summary: Get reports statistics
 *     description: Retrieve comprehensive statistics about reports including counts by status, type, and recent activity.
 *     tags:
 *       - Admin - Report Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved report statistics
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
 *                     total:
 *                       type: integer
 *                       description: Total number of reports
 *                       example: 150
 *                     recentReports:
 *                       type: integer
 *                       description: Number of reports in the last 24 hours
 *                       example: 5
 *                     byStatus:
 *                       type: object
 *                       description: Count of reports by status
 *                       example: {"PENDING": 25, "RESOLVED": 100, "REJECTED": 15, "CLOSED": 10}
 *                     byType:
 *                       type: object
 *                       description: Count of reports by type
 *                       example: {"USER": 80, "CONTENT": 30, "PARKING_SPOT": 20, "HARASSMENT": 15, "OTHER": 5}
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
adminRouter.get(
  '/reports/stats',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getReportsStats,
);

// Company Management Routes

/**
 * @swagger
 * /api/admin/companies:
 *   get:
 *     summary: Get all companies with pagination
 *     description: Retrieve a paginated list of all companies in the system with member counts
 *     tags:
 *       - Admin - Company Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of companies per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["PENDING", "APPROVED", "REJECTED"]
 *         required: false
 *         description: Filter by company status. Omit to get all.
 *     responses:
 *       200:
 *         description: Successfully retrieved companies
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           label:
 *                             type: string
 *                             example: "Transport Solutions LLC"
 *                           logo:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           chatId:
 *                             type: integer
 *                             nullable: true
 *                             example: 12345
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                           _count:
 *                             type: object
 *                             properties:
 *                               members:
 *                                 type: integer
 *                                 example: 15
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         pageSize:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
adminRouter.get(
  '/companies',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllCompanies,
);

/**
 * @swagger
 * /api/admin/companies/{companyId}:
 *   delete:
 *     summary: Delete a company
 *     description: Delete a company from the system. This will remove all associations with users (set their companyId to null).
 *     tags:
 *       - Admin - Company Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
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
 *                       example: "Company deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
adminRouter.delete(
  '/companies/:companyId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deleteCompany,
);

/**
 * @swagger
 * /api/admin/companies/{companyId}/approve:
 *   post:
 *     summary: Approve a pending company
 *     description: Sets company status to APPROVED, creates the Mesibo group chat, and sends a push notification to the creator.
 *     tags:
 *       - Admin - Company Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company approved successfully
 *       400:
 *         description: Company is not in PENDING status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Company not found
 */
adminRouter.post(
  '/companies/:companyId/approve',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.approveCompany,
);

/**
 * @swagger
 * /api/admin/companies/{companyId}/reject:
 *   post:
 *     summary: Reject a pending company
 *     description: Sets company status to REJECTED and sends a push notification to the creator.
 *     tags:
 *       - Admin - Company Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company rejected successfully
 *       400:
 *         description: Company is not in PENDING status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Company not found
 */
adminRouter.post(
  '/companies/:companyId/reject',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.rejectCompany,
);

// ===================
// Users Module Routes
// ===================
adminRouter.get(
  '/users',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllUsers,
);

adminRouter.get(
  '/users/:userId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getUserById,
);

adminRouter.delete(
  '/users/:userId',
  auth,
  roles(Roles.SuperAdmin),
  adminController.deleteUser,
);

// ===================
// Companies Module Routes (Extensions)
// ===================
adminRouter.get(
  '/companies/:companyId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getCompanyById,
);

adminRouter.put(
  '/companies/:companyId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updateCompany,
);

adminRouter.post(
  '/companies/:companyId/members',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.addMemberToCompany,
);

adminRouter.delete(
  '/companies/:companyId/members/:userId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.removeMemberFromCompany,
);

adminRouter.get(
  '/companies/:companyId/chat/:chatId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getCompanyChatMessages,
);

// ===================
// Points Module Routes (NEW)
// ===================
adminRouter.get(
  '/points',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllPoints,
);

adminRouter.get(
  '/points/:pointId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getPointById,
);

adminRouter.post(
  '/points',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.createPoint,
);

adminRouter.put(
  '/points/:pointId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updatePoint,
);

adminRouter.delete(
  '/points/:pointId',
  auth,
  roles(Roles.SuperAdmin),
  adminController.deletePoint,
);

adminRouter.put(
  '/points/:pointId/verify',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.verifyPoint,
);

adminRouter.get(
  '/points/:pointId/reviews',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getPointReviews,
);

adminRouter.delete(
  '/points/:pointId/reviews/:reviewId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.deletePointReview,
);

adminRouter.post(
  '/points/:pointId/recalculate-rating',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.recalculatePointRating,
);

adminRouter.get(
  '/points/:pointId/chat/:chatId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getPointChatMessages,
);

// ===================
// Questions Module Routes
// ===================
adminRouter.get(
  '/questions',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllQuestions,
);

adminRouter.get(
  '/questions/:questionId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getQuestionById,
);

adminRouter.put(
  '/questions/:questionId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updateQuestion,
);

adminRouter.patch(
  '/questions/:questionId/resolve',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.toggleResolveQuestion,
);

adminRouter.get(
  '/questions/:questionId/answers',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getQuestionAnswers,
);

adminRouter.put(
  '/answers/:answerId',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updateAnswer,
);

// ===================
// Point Instructions Module Routes
// ===================

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminPointInstructionPointRef:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 42
 *         name:
 *           type: string
 *           nullable: true
 *           example: Terminal Riga
 *         address:
 *           type: string
 *           nullable: true
 *           example: Port street 1
 *     AdminPointInstructionCreatorRef:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 7
 *         name:
 *           type: string
 *           nullable: true
 *         username:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *     AdminPointInstructionDto:
 *       allOf:
 *         - $ref: '#/components/schemas/PointInstructionDto'
 *         - type: object
 *           properties:
 *             point:
 *               $ref: '#/components/schemas/AdminPointInstructionPointRef'
 *             creator:
 *               nullable: true
 *               allOf:
 *                 - $ref: '#/components/schemas/AdminPointInstructionCreatorRef'
 *     AdminCreatePointInstructionBody:
 *       type: object
 *       description: Admin create — defaults status to APPROVED when omitted
 *       required:
 *         - pointId
 *         - type
 *       properties:
 *         pointId:
 *           type: integer
 *           example: 42
 *         type:
 *           $ref: '#/components/schemas/PointInstructionType'
 *         title:
 *           type: string
 *           maxLength: 128
 *         description:
 *           type: string
 *         latitude:
 *           type: string
 *         longitude:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/PointInstructionStatus'
 *     AdminUpdatePointInstructionBody:
 *       type: object
 *       description: Admin update — can change pointId, fields, and status directly (no re-moderation reset)
 *       properties:
 *         pointId:
 *           type: integer
 *         type:
 *           $ref: '#/components/schemas/PointInstructionType'
 *         title:
 *           type: string
 *           nullable: true
 *           maxLength: 128
 *         description:
 *           type: string
 *           nullable: true
 *         latitude:
 *           type: string
 *           nullable: true
 *         longitude:
 *           type: string
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/PointInstructionStatus'
 *     AdminPointInstructionPaginated:
 *       type: object
 *       required: [success, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           required: [items, meta]
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminPointInstructionDto'
 *             meta:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 20
 *                 pageCount:
 *                   type: integer
 *                   example: 1
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 prevPage:
 *                   type: integer
 *                   nullable: true
 *                 nextPage:
 *                   type: integer
 *                   nullable: true
 */

/**
 * @swagger
 * /api/admin/point-instructions:
 *   get:
 *     summary: List point instructions with optional filters
 *     description: Paginated list. Supports status, type, and pointId filters. Includes point and creator.
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Page size (alias `limit` also accepted)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Alias for pageSize (used by admin UI)
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/PointInstructionStatus'
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/PointInstructionType'
 *       - in: query
 *         name: pointId
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Paginated list of point instructions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminPointInstructionPaginated'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions (Admin/SuperAdmin required)
 */
adminRouter.get(
  '/point-instructions',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getAllPointInstructions,
);

/**
 * @swagger
 * /api/admin/point-instructions/{id}:
 *   get:
 *     summary: Get point instruction by ID
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Point instruction details with point and creator
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminPointInstructionDto'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions
 *       "404":
 *         description: Instruction not found
 */
adminRouter.get(
  '/point-instructions/:id',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.getPointInstructionById,
);

/**
 * @swagger
 * /api/admin/point-instructions:
 *   post:
 *     summary: Create a point instruction (defaults to APPROVED)
 *     description: Admin-authored. If status is omitted, defaults to APPROVED. creatorId is set to the admin user.
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreatePointInstructionBody'
 *           examples:
 *             approvedParking:
 *               summary: Publish parking tip immediately
 *               value:
 *                 pointId: 42
 *                 type: PARKING
 *                 title: Lot A
 *                 description: Park near the blue building
 *                 latitude: "50.4501"
 *                 longitude: "30.5234"
 *                 status: APPROVED
 *     responses:
 *       "200":
 *         description: Created (status APPROVED unless overridden)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminPointInstructionDto'
 *       "400":
 *         description: Validation error (missing pointId/type or invalid enum)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions
 *       "404":
 *         description: Point not found
 */
adminRouter.post(
  '/point-instructions',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.createPointInstruction,
);

/**
 * @swagger
 * /api/admin/point-instructions/{id}:
 *   put:
 *     summary: Update a point instruction
 *     description: Admin can edit fields and status directly (no owner re-moderation reset).
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdatePointInstructionBody'
 *     responses:
 *       "200":
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AdminPointInstructionDto'
 *       "400":
 *         description: Validation error (invalid type or status)
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions
 *       "404":
 *         description: Instruction or point not found
 */
adminRouter.put(
  '/point-instructions/:id',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.updatePointInstruction,
);

/**
 * @swagger
 * /api/admin/point-instructions/{id}/approve:
 *   post:
 *     summary: Approve a pending point instruction
 *     description: Sets status PENDING → APPROVED. Fails if not currently PENDING.
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionSuccessItem'
 *       "400":
 *         description: Instruction is not pending
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions
 *       "404":
 *         description: Instruction not found
 */
adminRouter.post(
  '/point-instructions/:id/approve',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.approvePointInstruction,
);

/**
 * @swagger
 * /api/admin/point-instructions/{id}/reject:
 *   post:
 *     summary: Reject a pending point instruction
 *     description: Sets status PENDING → REJECTED. Fails if not currently PENDING.
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Rejected
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionSuccessItem'
 *       "400":
 *         description: Instruction is not pending
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Insufficient permissions
 *       "404":
 *         description: Instruction not found
 */
adminRouter.post(
  '/point-instructions/:id/reject',
  auth,
  roles(Roles.Admin, Roles.SuperAdmin),
  adminController.rejectPointInstruction,
);

/**
 * @swagger
 * /api/admin/point-instructions/{id}:
 *   delete:
 *     summary: Delete a point instruction
 *     description: Hard delete. SuperAdmin only.
 *     tags:
 *       - Admin - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionDeleteResult'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: SuperAdmin required
 *       "404":
 *         description: Instruction not found
 */
adminRouter.delete(
  '/point-instructions/:id',
  auth,
  roles(Roles.SuperAdmin),
  adminController.deletePointInstruction,
);
