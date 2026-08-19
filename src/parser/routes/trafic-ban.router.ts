import { Router } from 'express';
import { traficBanController } from '../controllers';
import { auth } from '@auth/middlewares';

export const traficBanRouter = Router();

/**
 * @swagger
 * /api/trafic-ban/by-date:
 *   get:
 *     summary: Get traffic bans by date
 *     tags:
 *       - TraficBan
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date (inclusive) in YYYY-MM-DD format. Defaults to today.
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date (inclusive) in YYYY-MM-DD format. Defaults to `dateFrom` if not provided.
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
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 7309
 *                       date:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-08-27T00:00:00.000Z"
 *                       country:
 *                         type: string
 *                         example: "Austria"
 *                       timeString:
 *                         type: string
 *                         example: "00:00 - 05:00"
 *                       detailsUrl:
 *                         type: string
 *                         format: url
 *                         example: "https://trafficban.com/austria.traffic_ban.details.20138.en.html"
 *                       additionalInfo:
 *                         type: string
 *                         example: "Night ban"
 *                       countryCode:
 *                         type: string
 *                         example: "AT"
 *       "400":
 *         description: Bad request
 *       "500":
 *         description: Internal server error
 */
traficBanRouter.get('/by-date', auth, traficBanController.getByDate);
