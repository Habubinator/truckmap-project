import { Router } from 'express';
import { companyController } from '../controllers';
import { auth } from '@auth/middlewares';

export const companyRouter = Router();

/**
 * @swagger
 * /api/company/all:
 *   get:
 *     summary: Get all companies in a list
 *     tags:
 *       - Company
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: label
 *         schema:
 *           type: string
 *         description: Filter companies by label
 *     responses:
 *       "200":
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   label:
 *                     type: string
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
companyRouter.get('/all', auth, companyController.findAllCompamnies);

/**
 * @swagger
 * /api/company/your:
 *   get:
 *     summary: Get your company chat
 *     tags:
 *       - Company
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
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: "Company Chat"
 *                     mesiboId:
 *                       type: integer
 *                       example: 3224001
 *                     typeId:
 *                       type: integer
 *                       example: 2
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
companyRouter.get('/your', auth, companyController.getYourCompanyChat);

/**
 * @swagger
 * /api/company/members:
 *   get:
 *     summary: Get companies with member statistics
 *     description: Returns list of companies that have members, including company details and member count
 *     tags:
 *       - Company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Companies with member statistics retrieved successfully
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
 *                         description: Company ID
 *                         example: 1
 *                       label:
 *                         type: string
 *                         description: Company name/label
 *                         example: "Tech Solutions Inc"
 *                       logo:
 *                         type: string
 *                         nullable: true
 *                         description: Company logo URL
 *                         example: "https://censored-link.com/logo.png"
 *                       _count:
 *                         type: object
 *                         description: Member count statistics
 *                         properties:
 *                           members:
 *                             type: integer
 *                             description: Total number of company members
 *                             example: 25
 *       "401":
 *         description: Unauthorized - authentication required
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
 *                   example: "Authentication required"
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
companyRouter.get('/members', auth, companyController.getCompanyMembers);
