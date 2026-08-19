import { Router } from 'express';
import { auth } from '@auth/middlewares';
import { pointInstructionController } from '../controllers/point-instruction.controller';

export const pointInstructionRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PointInstructionType:
 *       type: string
 *       enum: [ENTRANCE, PARKING, REGISTRATION, EXIT]
 *     PointInstructionStatus:
 *       type: string
 *       enum: [PENDING, APPROVED, REJECTED]
 *     PointInstructionPublicDto:
 *       type: object
 *       description: |
 *         Approved instruction from GET /api/points/{pointId}/instructions.
 *         Omits status and creatorId (always APPROVED for this endpoint).
 *       required: [id, pointId, type, createdAt, updatedAt]
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         pointId:
 *           type: integer
 *           example: 42
 *         type:
 *           $ref: '#/components/schemas/PointInstructionType'
 *         title:
 *           type: string
 *           nullable: true
 *           maxLength: 128
 *           example: Gate 2
 *         description:
 *           type: string
 *           nullable: true
 *           example: Turn right after the barrier
 *         latitude:
 *           type: string
 *           nullable: true
 *           example: "50.4501"
 *         longitude:
 *           type: string
 *           nullable: true
 *           example: "30.5234"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     PointInstructionDto:
 *       type: object
 *       description: Full instruction row (user create/update response)
 *       required: [id, pointId, type, status, createdAt, updatedAt]
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         pointId:
 *           type: integer
 *           example: 42
 *         type:
 *           $ref: '#/components/schemas/PointInstructionType'
 *         title:
 *           type: string
 *           nullable: true
 *           maxLength: 128
 *           example: Gate 2
 *         description:
 *           type: string
 *           nullable: true
 *           example: Turn right after the barrier
 *         latitude:
 *           type: string
 *           nullable: true
 *           example: "50.4501"
 *         longitude:
 *           type: string
 *           nullable: true
 *           example: "30.5234"
 *         status:
 *           $ref: '#/components/schemas/PointInstructionStatus'
 *         creatorId:
 *           type: integer
 *           nullable: true
 *           example: 7
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreatePointInstructionBody:
 *       type: object
 *       description: Matches CreatePointInstructionDto
 *       required:
 *         - type
 *       properties:
 *         type:
 *           $ref: '#/components/schemas/PointInstructionType'
 *         title:
 *           type: string
 *           maxLength: 128
 *           example: Lot A
 *         description:
 *           type: string
 *           example: Park near the blue building
 *         latitude:
 *           type: string
 *           example: "50.4501"
 *         longitude:
 *           type: string
 *           example: "30.5234"
 *     UpdatePointInstructionBody:
 *       type: object
 *       description: Matches UpdatePointInstructionDto — all fields optional; null clears nullable string fields
 *       properties:
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
 *     PointInstructionSuccessList:
 *       type: object
 *       required: [success, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PointInstructionPublicDto'
 *     PointInstructionSuccessItem:
 *       type: object
 *       required: [success, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/PointInstructionDto'
 *     PointInstructionDeleteResult:
 *       type: object
 *       required: [success, data]
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           required: [id]
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *     ApiErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         code:
 *           type: integer
 */

/**
 * @swagger
 * /api/points/instructions/{id}:
 *   put:
 *     summary: Update own instruction
 *     description: |
 *       Owner-only. Body matches UpdatePointInstructionDto.
 *       If status was APPROVED, it is reset to PENDING for re-moderation.
 *       REJECTED/PENDING statuses are left unchanged (still PENDING after edit if already PENDING).
 *     tags:
 *       - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Instruction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePointInstructionBody'
 *           examples:
 *             updateDescription:
 *               summary: Update description and coords
 *               value:
 *                 description: Enter via Gate B, then left
 *                 latitude: "50.4501"
 *                 longitude: "30.5234"
 *     responses:
 *       "200":
 *         description: Instruction updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionSuccessItem'
 *       "400":
 *         description: Validation error (invalid type enum)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       "404":
 *         description: Instruction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
pointInstructionRouter.put(
  '/instructions/:id',
  auth,
  pointInstructionController.update,
);

/**
 * @swagger
 * /api/points/instructions/{id}:
 *   delete:
 *     summary: Delete own pending instruction
 *     description: Owner-only. Allowed only while status is PENDING.
 *     tags:
 *       - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Instruction ID
 *     responses:
 *       "200":
 *         description: Instruction deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionDeleteResult'
 *       "400":
 *         description: Instruction is not PENDING
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       "404":
 *         description: Instruction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
pointInstructionRouter.delete(
  '/instructions/:id',
  auth,
  pointInstructionController.remove,
);

/**
 * @swagger
 * /api/points/{pointId}/instructions:
 *   get:
 *     summary: Get approved access instructions for a point
 *     description: |
 *       Returns only APPROVED instructions for the point.
 *       Ordered by type (ENTRANCE → PARKING → REGISTRATION → EXIT), then by id ascending.
 *       Response items omit status and creatorId.
 *     tags:
 *       - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Point ID
 *     responses:
 *       "200":
 *         description: Approved instructions (may be an empty array)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionSuccessList'
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Point not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
pointInstructionRouter.get(
  '/:pointId/instructions',
  auth,
  pointInstructionController.getApprovedByPointId,
);

/**
 * @swagger
 * /api/points/{pointId}/instructions:
 *   post:
 *     summary: Submit an access instruction for moderation
 *     description: |
 *       Body matches CreatePointInstructionDto.
 *       Always created with status PENDING; creatorId is the authenticated user.
 *     tags:
 *       - Point Instructions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Point ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePointInstructionBody'
 *           examples:
 *             entrance:
 *               summary: Entrance block
 *               value:
 *                 type: ENTRANCE
 *                 title: Gate 2
 *                 description: Enter from the industrial road
 *                 latitude: "50.4501"
 *                 longitude: "30.5234"
 *     responses:
 *       "200":
 *         description: Instruction created with PENDING status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PointInstructionSuccessItem'
 *       "400":
 *         description: Validation error (missing or invalid type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Point not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiErrorResponse'
 */
pointInstructionRouter.post(
  '/:pointId/instructions',
  auth,
  pointInstructionController.create,
);
