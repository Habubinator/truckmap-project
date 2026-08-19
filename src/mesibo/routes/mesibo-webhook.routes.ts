import { Router } from 'express';
import { webhookController } from '../controllers';

export const mesiboRouter = Router();

/**
 * @swagger
 * /api/mesibo/webhook:
 *   post:
 *     summary: Webhook endpoint for mesibo hooks (internal functionality)
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
mesiboRouter.all('/webhook', webhookController.listen);
