import { Router } from 'express';
import {
  googleLoginValidator,
  loginValidator,
  registerValidator,
  verifyEmailResendValidator,
  // createTokenValidator,
  // resetPasswordValidator,
  // verifyEmailResendValidator,
} from '../validators';
import { authController } from '../controllers';
import { auth } from '../middlewares';

export const authRouter = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: string@mail.com
 *               username:
 *                 type: string
 *                 example: user123
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       "200":
 *         description: Registration successful
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
 *                     msg:
 *                       type: string
 *                       example: "Please verify your email via code"
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/register', registerValidator, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       "200":
 *         description: Successful login
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
 *                     accessToken:
 *                       type: string
 *                       example: "your-access-token"
 *                     refreshToken:
 *                       type: string
 *                       example: "your-refresh-token"
 *                     mesiboToken:
 *                       type: string
 *                       example: "your-mesibo-token"
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: "user@censored-link.com"
 *         password:
 *           type: string
 *           example: "SecurePassword123"
 */
authRouter.post('/login', loginValidator, authController.login);

/**
 * @swagger
 * /api/auth/verify/resend:
 *   post:
 *     summary: Resend verify email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                example: string@mail.com
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
authRouter.post(
  '/verify/resend',
  verifyEmailResendValidator,
  authController.verifyEmailResend,
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify user email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationKey
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address associated with the verification key
 *               verificationKey:
 *                 type: string
 *                 description: Unique verification key sent to the user's email
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/verify', authController.verify);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user session
 *     tags:
 *       - Auth
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/logout', auth, authController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Auth
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden resource
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/notifications:
 *   post:
 *     summary: Set push notification token for the current session
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationToken:
 *                 type: string
 *                 description: Device push notification token (e.g. FCM/APNS token)
 *             required:
 *               - notificationToken
 *     responses:
 *       "200":
 *         description: Notification token set successfully
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
 *                     result:
 *                       type: boolean
 *                       example: true
 *       "401":
 *         description: Unauthorized – missing or invalid refresh token
 *       "403":
 *         description: Forbidden – session is not valid
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/notifications', authController.setNotifications);

// /**
//  * @swagger
//  * /api/auth/recovery/token:
//  *   post:
//  *     summary: Create recovery token and send mail
//  *     tags:
//  *       - Auth
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *          schema:
//  *            type: object
//  *            required:
//  *              - email
//  *            properties:
//  *              email:
//  *                type: string
//  *                example: string@mail.com
//  *     responses:
//  *       "200":
//  *         description: Success
//  *       "400":
//  *         description: Bad request
//  *       "500":
//  *         description: Internal server error
//  */
// authRouter.post(
//   '/recovery/token',
//   createTokenValidator,
//   authController.createRecoveryToken,
// );

// /**
//  * @swagger
//  * /api/auth/recovery/reset-password:
//  *   post:
//  *     summary: Reset password using recovery token
//  *     tags:
//  *       - Auth
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *          schema:
//  *            type: object
//  *            required:
//  *              - token
//  *              - newPassword
//  *            properties:
//  *              token:
//  *                type: string
//  *              newPassword:
//  *                type: string
//  *     responses:
//  *       "200":
//  *         description: Success
//  *       "400":
//  *         description: Bad request
//  *       "500":
//  *         description: Internal server error
//  */
// authRouter.post(
//   '/recovery/reset-password',
//   resetPasswordValidator,
//   authController.resetPassword,
// );

/**
 * @swagger
 * /api/auth/google/login:
 *   post:
 *     summary: Google login with access token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: Google OAuth access token
 *                 example: "ya29.a0AfH6S..."
 *     responses:
 *       "200":
 *         description: Successfully authenticated
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden resource
 *       "500":
 *         description: Internal server error
 */
authRouter.post(
  '/google/login',
  googleLoginValidator,
  authController.googleLogin,
);

authRouter.get('/google/callback', authController.googleCallback);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth refirect
 *     description: Redirects user to Google OAuth.
 *     tags:
 *       - Auth
 *     responses:
 *       302:
 *         description: Succesffull reditect to Google.
 *       500:
 *         description: Server error.
 */
authRouter.get('/google', authController.googleRedirect);

/**
 * @swagger
 * /api/auth/apple/login:
 *   post:
 *     summary: Apple Sign In login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIdentifier
 *               - identityToken
 *             properties:
 *               userIdentifier:
 *                 type: string
 *                 description: Unique stable identifier for the user (doesn't change)
 *                 example: "000123.456.789"
 *               identityToken:
 *                 type: string
 *                 description: JWT token containing user information and authentication data
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               authorizationCode:
 *                 type: string
 *                 description: One-time authorization code for server-side authentication
 *                 example: "c12345abcd..."
 *               email:
 *                 type: string
 *                 description: User's email (only available on first sign-in)
 *                 example: "user@censored-link.com"
 *               fullName:
 *                 type: object
 *                 description: User's full name (only available on first sign-in)
 *                 properties:
 *                   givenName:
 *                     type: string
 *                     description: First name
 *                     example: "John"
 *                   familyName:
 *                     type: string
 *                     description: Last name
 *                     example: "Doe"
 *     responses:
 *       "200":
 *         description: Successfully authenticated
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
 *                     accessToken:
 *                       type: string
 *                       example: "your-access-token"
 *                     refreshToken:
 *                       type: string
 *                       example: "your-refresh-token"
 *                     mesiboToken:
 *                       type: string
 *                       example: "your-mesibo-token"
 *                     mesiboStaticToken:
 *                       type: string
 *                       example: "your-mesibo-static-token"
 *       "400":
 *         description: Bad request - missing required parameters
 *       "502":
 *         description: Bad Gateway - authentication failed
 *       "500":
 *         description: Internal server error
 */
authRouter.post('/apple/login', authController.appleLogin);
