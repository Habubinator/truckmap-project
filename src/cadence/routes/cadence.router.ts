import { Router } from 'express';
import { cadenceController } from '../controllers/cadence.controller';
import { paginateValidator } from '@common/validators';
import { uploadSingleFile } from '@common/middlewares';
import { auth } from '@auth/middlewares';
import './swagger.dto';

export const cadenceRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CadenceDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 11
 *         label:
 *           type: string
 *           example: "Q4 2024 Route"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2024-10-01T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2024-12-31T23:59:59.000Z"
 *         mileageStart:
 *           type: number
 *           format: float
 *           example: 150000.5
 *         mileageEnd:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 165000.8
 *         truck:
 *           type: string
 *           example: "Volvo VNL 780"
 *         truckPhoto:
 *           type: string
 *           nullable: true
 *           example: "https://censored-link.com/static/cadences/truck-photo.jpg"
 *         dayLength:
 *           type: number
 *           format: float
 *           example: 11
 *         wheelTime:
 *           type: number
 *           format: float
 *           example: 8.5
 *         paycheck:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 15000
 *         currency:
 *           type: string
 *           enum: [USD, EUR, UAH, PLN, CZK, HUF, RON]
 *           example: "USD"
 *         isFinished:
 *           type: boolean
 *           example: false
 *           description: "Whether the cadence is marked as finished"
 *         user:
 *           $ref: '#/components/schemas/UserDto'
 *         _count:
 *           type: object
 *           properties:
 *             weeks:
 *               type: integer
 *               example: 12
 *             days:
 *               type: integer
 *               example: 84
 *
 *     CadenceWeekDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         cadenceId:
 *           type: integer
 *           example: 1
 *         start:
 *           type: string
 *           format: date-time
 *           example: "2024-10-01T00:00:00.000Z"
 *         end:
 *           type: string
 *           format: date-time
 *           example: "2024-10-07T23:59:59.000Z"
 *         days:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CadenceDayDto'
 *
 *     CadenceDayDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         weekId:
 *           type: integer
 *           example: 1
 *         cadenceId:
 *           type: integer
 *           example: 1
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-10-01"
 *           description: "Calendar date for this day slot"
 *         dayOfWeek:
 *           type: integer
 *           example: 2
 *           description: "1=Monday .. 7=Sunday"
 *         start:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-10-01T06:00:00.000Z"
 *           description: "Shift start time (null until shift opened)"
 *         end:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2024-10-01T17:00:00.000Z"
 *           description: "Shift end time (null until shift closed)"
 *         drivingHours:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 9.5
 *           description: "Actual driving hours stored in hours (input is received in minutes and converted)"
 *         mileageStart:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 150000.5
 *         mileageEnd:
 *           type: number
 *           format: float
 *           nullable: true
 *           example: 150450.2
 *         wasPause:
 *           type: boolean
 *           example: true
 *           description: "true if driver had a 3-hour uninterrupted break"
 *         isShiftOpen:
 *           type: boolean
 *           example: false
 *           description: "Shift is currently open"
 *         isShiftClosed:
 *           type: boolean
 *           example: false
 *           description: "Shift was completed and locked"
 *         isDayOff:
 *           type: boolean
 *           example: false
 *           description: "Day marked as rest/day off"
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Good weather, smooth traffic"
 *
 *     PaginatedCadences:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CadenceDto'
 *         meta:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             pageCount:
 *               type: integer
 *               example: 5
 *             total:
 *               type: integer
 *               example: 50
 *             prevPage:
 *               type: integer
 *               nullable: true
 *               example: null
 *             nextPage:
 *               type: integer
 *               nullable: true
 *               example: 2
 */

/**
 * @swagger
 * /api/cadences/days:
 *   get:
 *     summary: Get a paginated list of cadence days with optional filters
 *     tags:
 *       - Cadence Days
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
 *           default: 10
 *         description: Number of days per page
 *       - in: query
 *         name: cadenceId
 *         schema:
 *           type: integer
 *         description: Filter by cadence ID
 *       - in: query
 *         name: weekId
 *         schema:
 *           type: integer
 *         description: Filter by week ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter days starting after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter days ending before this date
 *       - in: query
 *         name: minMileage
 *         schema:
 *           type: number
 *         description: Filter by minimum starting mileage
 *       - in: query
 *         name: maxMileage
 *         schema:
 *           type: number
 *         description: Filter by maximum starting mileage
 *     responses:
 *       "200":
 *         description: Successfully retrieved cadence days
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
 *                         $ref: '#/components/schemas/CadenceDayDto'
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
 *                         prevPage:
 *                           type: integer
 *                           nullable: true
 *                         nextPage:
 *                           type: integer
 *                           nullable: true
 *       "400":
 *         description: Bad request, invalid query parameters
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get(
  '/days',
  auth,
  paginateValidator,
  cadenceController.getCadenceDays,
);

/**
 * @swagger
 * /api/cadences:
 *   post:
 *     summary: Create a new cadence
 *     tags:
 *       - Cadences
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - startDate
 *               - endDate
 *               - mileageStart
 *               - truck
 *               - dayLength
 *               - wheelTime
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Q4 2024 Route"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-10-01T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-31T23:59:59.000Z"
 *               mileageStart:
 *                 type: number
 *                 format: float
 *                 example: 150000.5
 *               mileageEnd:
 *                 type: number
 *                 format: float
 *                 example: 165000.8
 *               truck:
 *                 type: string
 *                 example: "Volvo VNL 780"
 *               truckPhoto:
 *                 type: string
 *                 format: binary
 *               dayLength:
 *                 type: number
 *                 format: float
 *                 example: 11
 *               wheelTime:
 *                 type: number
 *                 format: float
 *                 example: 8.5
 *               paycheck:
 *                 type: number
 *                 format: float
 *                 example: 15000
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, UAH, PLN, CZK, HUF, RON]
 *                 example: "USD"
 *     responses:
 *       "201":
 *         description: Cadence created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post(
  '/',
  auth,
  uploadSingleFile('cadences', 'truckPhoto'),
  cadenceController.createCadence,
);

// /**
//  * @swagger
//  * /api/cadences:
//  *   get:
//  *     summary: Get a paginated list of cadences with optional filters
//  *     tags:
//  *       - Cadences
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *         description: Page number for pagination
//  *       - in: query
//  *         name: pageSize
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *         description: Number of cadences per page
//  *       - in: query
//  *         name: userId
//  *         schema:
//  *           type: integer
//  *         description: Filter by user ID
//  *       - in: query
//  *         name: startDate
//  *         schema:
//  *           type: string
//  *           format: date-time
//  *         description: Filter cadences starting after this date
//  *       - in: query
//  *         name: endDate
//  *         schema:
//  *           type: string
//  *           format: date-time
//  *         description: Filter cadences ending before this date
//  *       - in: query
//  *         name: truck
//  *         schema:
//  *           type: string
//  *         description: Filter by truck name (partial match)
//  *       - in: query
//  *         name: minMileage
//  *         schema:
//  *           type: number
//  *         description: Filter by minimum starting mileage
//  *       - in: query
//  *         name: maxMileage
//  *         schema:
//  *           type: number
//  *         description: Filter by maximum starting mileage
//  *       - in: query
//  *         name: currency
//  *         schema:
//  *           type: string
//  *           enum: [USD, EUR, UAH, PLN, CZK, HUF, RON]
//  *         description: Filter by currency
//  *     responses:
//  *       "200":
//  *         description: Successfully retrieved cadences
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                   example: true
//  *                 data:
//  *                   $ref: '#/components/schemas/PaginatedCadences'
//  *       "400":
//  *         description: Bad request, invalid query parameters
//  *       "500":
//  *         description: Internal server error
//  */
// cadenceRouter.get('/', paginateValidator, cadenceController.getAllCadences);

/**
 * @swagger
 * /api/cadences/my:
 *   get:
 *     summary: Get current user's cadences
 *     tags:
 *       - Cadences
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
 *           default: 10
 *         description: Number of cadences per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter cadences starting after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter cadences ending before this date
 *       - in: query
 *         name: truck
 *         schema:
 *           type: string
 *         description: Filter by truck name (partial match)
 *     responses:
 *       "200":
 *         description: Successfully retrieved user's cadences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedCadences'
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get(
  '/my',
  auth,
  paginateValidator,
  cadenceController.getMyCadences,
);

/**
 * @swagger
 * /api/cadences/{id}:
 *   get:
 *     summary: Get a specific cadence by ID
 *     tags:
 *       - Cadences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     responses:
 *       "200":
 *         description: Successfully retrieved cadence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDto'
 *       "400":
 *         description: Bad request, invalid ID
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/:id', auth, cadenceController.getCadenceById);

/**
 * @swagger
 * /api/cadences/{id}:
 *   put:
 *     summary: Update a cadence
 *     tags:
 *       - Cadences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 example: "Q4 2024 Route Updated"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               mileageStart:
 *                 type: number
 *                 format: float
 *               mileageEnd:
 *                 type: number
 *                 format: float
 *               truck:
 *                 type: string
 *               truckPhoto:
 *                 type: string
 *                 format: binary
 *               dayLength:
 *                 type: number
 *                 format: float
 *               wheelTime:
 *                 type: number
 *                 format: float
 *               paycheck:
 *                 type: number
 *                 format: float
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, UAH, PLN, CZK, HUF, RON]
 *     responses:
 *       "200":
 *         description: Cadence updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden, not your cadence
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.put(
  '/:id',
  auth,
  uploadSingleFile('cadences', 'truckPhoto'),
  cadenceController.updateCadence,
);

/**
 * @swagger
 * /api/cadences/{id}/dates:
 *   patch:
 *     summary: Update cadence dates and regenerate weeks/days
 *     tags:
 *       - Cadences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: New start date for the cadence
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: New end date for the cadence
 *               dayLength:
 *                 type: number
 *                 format: float
 *                 description: New day length in hours
 *     responses:
 *       "200":
 *         description: Cadence dates updated successfully with regenerated weeks/days
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDto'
 *       "400":
 *         description: Bad request, validation error or overlapping dates
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden, not your cadence
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.patch('/:id/dates', auth, cadenceController.updateCadenceDates);

/**
 * @swagger
 * /api/cadences/{id}:
 *   delete:
 *     summary: Delete a cadence
 *     tags:
 *       - Cadences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     responses:
 *       "200":
 *         description: Cadence deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       "400":
 *         description: Bad request, invalid ID
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden, not your cadence
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.delete('/:id', auth, cadenceController.deleteCadence);

/**
 * @swagger
 * /api/cadences/{id}/finished:
 *   patch:
 *     summary: Update cadence finished status
 *     tags:
 *       - Cadences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isFinished
 *             properties:
 *               isFinished:
 *                 type: boolean
 *                 description: Whether the cadence is finished
 *                 example: true
 *     responses:
 *       "200":
 *         description: Cadence finished status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "403":
 *         description: Forbidden, not your cadence
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.patch('/:id/finished', auth, cadenceController.updateCadenceFinished);

// CADENCE WEEK ROUTES

/**
 * @swagger
 * /api/cadences/weeks:
 *   post:
 *     summary: Create a new cadence week
 *     tags:
 *       - Cadence Weeks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cadenceId
 *               - start
 *               - end
 *             properties:
 *               cadenceId:
 *                 type: integer
 *                 example: 1
 *               start:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-10-01T00:00:00.000Z"
 *               end:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-10-07T23:59:59.000Z"
 *     responses:
 *       "201":
 *         description: Cadence week created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceWeekDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post('/weeks', auth, cadenceController.createCadenceWeek);

/**
 * @swagger
 * /api/cadences/{cadenceId}/weeks:
 *   get:
 *     summary: Get all weeks for a specific cadence
 *     tags:
 *       - Cadence Weeks
 *     parameters:
 *       - in: path
 *         name: cadenceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The cadence ID
 *     responses:
 *       "200":
 *         description: Successfully retrieved cadence weeks
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
 *                     $ref: '#/components/schemas/CadenceWeekDto'
 *       "400":
 *         description: Bad request, invalid cadence ID
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/:cadenceId/weeks', auth, cadenceController.getCadenceWeeks);

/**
 * @swagger
 * /api/cadences/weeks/{id}:
 *   put:
 *     summary: Update a cadence week
 *     tags:
 *       - Cadence Weeks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The week ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start:
 *                 type: string
 *                 format: date-time
 *               end:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       "200":
 *         description: Cadence week updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceWeekDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Week not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.put('/weeks/:id', auth, cadenceController.updateCadenceWeek);

/**
 * @swagger
 * /api/cadences/weeks/{id}:
 *   delete:
 *     summary: Delete a cadence week
 *     tags:
 *       - Cadence Weeks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The week ID
 *     responses:
 *       "200":
 *         description: Cadence week deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       "400":
 *         description: Bad request, invalid ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Week not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.delete('/weeks/:id', auth, cadenceController.deleteCadenceWeek);

// CADENCE DAY ROUTES

/**
 * @swagger
 * /api/cadences/days:
 *   post:
 *     summary: Create a new cadence day
 *     tags:
 *       - Cadence Days
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekId
 *               - cadenceId
 *               - date
 *               - dayOfWeek
 *               - start
 *               - end
 *               - mileageStart
 *             properties:
 *               weekId:
 *                 type: integer
 *                 example: 1
 *               cadenceId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-10-01"
 *                 description: "Calendar date for this day"
 *               dayOfWeek:
 *                 type: integer
 *                 example: 2
 *                 description: "1=Monday .. 7=Sunday"
 *               start:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-10-01T06:00:00.000Z"
 *               end:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-10-01T17:00:00.000Z"
 *               mileageStart:
 *                 type: number
 *                 format: float
 *                 example: 150000.5
 *               mileageEnd:
 *                 type: number
 *                 format: float
 *                 example: 150450.2
 *               wasPause:
 *                 type: boolean
 *                 example: true
 *                 description: "true if driver made a 3 hour break"
 *               notes:
 *                 type: string
 *                 example: "Good weather, smooth traffic"
 *     responses:
 *       "201":
 *         description: Cadence day created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDayDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post('/days', auth, cadenceController.createCadenceDay);

/**
 * @swagger
 * /api/cadences/days/{id}:
 *   put:
 *     summary: Update a cadence day
 *     tags:
 *       - Cadence Days
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The day ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               mileageStart:
 *                 type: number
 *                 format: float
 *               mileageEnd:
 *                 type: number
 *                 format: float
 *               wasPause:
 *                 type: boolean
 *                 description: "true if driver made a 3 hour break"
 *               notes:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Cadence day updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDayDto'
 *       "400":
 *         description: Bad request, validation error
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.put('/days/:id', auth, cadenceController.updateCadenceDay);

/**
 * @swagger
 * /api/cadences/days/{id}:
 *   delete:
 *     summary: Delete a cadence day
 *     tags:
 *       - Cadence Days
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The day ID
 *     responses:
 *       "200":
 *         description: Cadence day deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       "400":
 *         description: Bad request, invalid ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.delete('/days/:id', auth, cadenceController.deleteCadenceDay);

// Shift Operation Routes

/**
 * @swagger
 * /api/cadences/days/{id}/open-shift:
 *   post:
 *     summary: Open a shift for a specific day
 *     tags:
 *       - Cadence Days
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The day ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Shift start time
 *                 example: "2026-01-27T06:00:00.000Z"
 *               mileageStart:
 *                 type: number
 *                 format: float
 *                 description: Starting mileage (auto-filled from previous day if omitted)
 *                 example: 150000.5
 *     responses:
 *       "200":
 *         description: Shift opened successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDayDto'
 *       "400":
 *         description: Bad request - day already has a shift or is a day off
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post('/days/:id/open-shift', auth, cadenceController.openShift);

/**
 * @swagger
 * /api/cadences/days/{id}/open-shift:
 *   patch:
 *     summary: Update an open shift (correct start time or starting mileage)
 *     tags:
 *       - Cadence Days
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: CadenceDay ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Corrected shift start time
 *                 example: "2026-01-27T06:00:00.000Z"
 *               mileageStart:
 *                 type: number
 *                 format: float
 *                 description: Corrected starting mileage
 *                 example: 150000.5
 *     responses:
 *       "200":
 *         description: Open shift updated successfully
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
 *                       example: 42
 *                     weekId:
 *                       type: integer
 *                       example: 10
 *                     cadenceId:
 *                       type: integer
 *                       example: 3
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: "2026-01-27"
 *                     dayOfWeek:
 *                       type: integer
 *                       example: 2
 *                       description: "1=Monday .. 7=Sunday"
 *                     start:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2026-01-27T06:00:00.000Z"
 *                       description: "Updated shift start time"
 *                     end:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     drivingHours:
 *                       type: number
 *                       format: float
 *                       nullable: true
 *                       example: null
 *                     mileageStart:
 *                       type: number
 *                       format: float
 *                       nullable: true
 *                       example: 150000.5
 *                       description: "Updated starting mileage"
 *                     mileageEnd:
 *                       type: number
 *                       format: float
 *                       nullable: true
 *                       example: null
 *                     wasPause:
 *                       type: boolean
 *                       example: false
 *                     isShiftOpen:
 *                       type: boolean
 *                       example: true
 *                     isShiftClosed:
 *                       type: boolean
 *                       example: false
 *                     isDayOff:
 *                       type: boolean
 *                       example: false
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     week:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         start:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-01-27T00:00:00.000Z"
 *                         end:
 *                           type: string
 *                           format: date-time
 *                           example: "2026-02-02T00:00:00.000Z"
 *                     cadence:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 3
 *                         label:
 *                           type: string
 *                           example: "January trip"
 *                         userId:
 *                           type: integer
 *                           example: 7
 *       "400":
 *         description: Shift is not open or is already closed
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 */
cadenceRouter.patch('/days/:id/open-shift', auth, cadenceController.updateOpenShift);

/**
 * @swagger
 * /api/cadences/days/{id}/close-shift:
 *   post:
 *     summary: Close an open shift for a specific day
 *     tags:
 *       - Cadence Days
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The day ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endTime
 *               - drivingHours
 *               - mileageEnd
 *             properties:
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: Shift end time
 *                 example: "2026-01-27T17:00:00.000Z"
 *               drivingHours:
 *                 type: number
 *                 format: float
 *                 description: Actual driving hours during this shift
 *                 example: 9.5
 *               wasPause:
 *                 type: boolean
 *                 description: Whether driver had a 3-hour uninterrupted break
 *                 example: true
 *               mileageEnd:
 *                 type: number
 *                 format: float
 *                 description: Ending mileage
 *                 example: 150450.2
 *               notes:
 *                 type: string
 *                 description: Optional shift notes
 *                 example: "Good weather, smooth traffic"
 *     responses:
 *       "200":
 *         description: Shift closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDayDto'
 *       "400":
 *         description: Bad request - shift not open or already closed
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post('/days/:id/close-shift', auth, cadenceController.closeShift);

/**
 * @swagger
 * /api/cadences/days/{id}/day-off:
 *   post:
 *     summary: Mark a day as a rest day (day off)
 *     tags:
 *       - Cadence Days
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The day ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *     responses:
 *       "200":
 *         description: Day marked as day off successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CadenceDayDto'
 *       "400":
 *         description: Bad request - day already has a shift or is already a day off
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Day not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.post('/days/:id/day-off', auth, cadenceController.markDayOff);

// Statistics Routes

/**
 * @swagger
 * /api/cadences/statistics/all-time:
 *   get:
 *     summary: Get all-time driving statistics for the authenticated user
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: All-time statistics retrieved successfully
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
 *                     totalDrivingHours:
 *                       type: number
 *                       example: 2400.5
 *                     totalWorkingHours:
 *                       type: number
 *                       example: 3600.0
 *                     totalKilometers:
 *                       type: number
 *                       example: 180000.25
 *                     averageKilometersPerDay:
 *                       type: number
 *                       example: 750.0
 *                     averageDrivingHoursPerDay:
 *                       type: number
 *                       example: 10.0
 *                     averageWorkingHoursPerDay:
 *                       type: number
 *                       example: 15.0
 *                     totalDays:
 *                       type: integer
 *                       example: 240
 *                     periodStart:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     periodEnd:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/statistics/all-time', auth, cadenceController.getAllTimeStatistics);

/**
 * @swagger
 * /api/cadences/statistics/period:
 *   get:
 *     summary: Get driving statistics for a specific period
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the period (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the period (YYYY-MM-DD)
 *         example: "2024-12-31"
 *     responses:
 *       "200":
 *         description: Period statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CadenceStatistics'
 *       "400":
 *         description: Bad request - missing or invalid dates
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/statistics/period', auth, cadenceController.getPeriodStatistics);

/**
 * @swagger
 * /api/cadences/statistics/cadence/{cadenceId}:
 *   get:
 *     summary: Get statistics for a specific cadence
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cadenceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the cadence
 *     responses:
 *       "200":
 *         description: Cadence statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/CadenceStatistics'
 *                     - type: object
 *                       properties:
 *                         cadenceId:
 *                           type: integer
 *                         cadenceLabel:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *       "400":
 *         description: Bad request - invalid cadence ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/statistics/cadence/:cadenceId', auth, cadenceController.getCadenceStatistics);

/**
 * @swagger
 * /api/cadences/statistics/monthly:
 *   get:
 *     summary: Get monthly driving statistics
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2024)
 *         example: 2024
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *         example: 10
 *     responses:
 *       "200":
 *         description: Monthly statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/CadenceStatistics'
 *                     - type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *                         month:
 *                           type: integer
 *                         monthName:
 *                           type: string
 *       "400":
 *         description: Bad request - missing or invalid year/month
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/statistics/monthly', auth, cadenceController.getMonthlyStatistics);

/**
 * @swagger
 * /api/cadences/statistics/yearly:
 *   get:
 *     summary: Get yearly driving statistics
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year (e.g., 2024)
 *         example: 2024
 *     responses:
 *       "200":
 *         description: Yearly statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/CadenceStatistics'
 *                     - type: object
 *                       properties:
 *                         year:
 *                           type: integer
 *       "400":
 *         description: Bad request - missing or invalid year
 *       "401":
 *         description: Unauthorized
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/statistics/yearly', auth, cadenceController.getYearlyStatistics);

/**
 * @swagger
 * /api/cadences/{cadenceId}/weekly-statistics:
 *   get:
 *     summary: Get weekly statistics for a specific cadence with EU driving regulations tracking
 *     tags:
 *       - Cadence Statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cadenceId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the cadence
 *         example: 1
 *     responses:
 *       "200":
 *         description: Weekly statistics retrieved successfully
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
 *                     cadenceId:
 *                       type: integer
 *                       example: 1
 *                     cadenceLabel:
 *                       type: string
 *                       example: "Q4 2024 Route"
 *                     cadencePeriod:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 *                     weeks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           weekNumber:
 *                             type: integer
 *                             example: 1
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                           workingHours:
 *                             type: string
 *                             example: "63h10m/90h"
 *                             description: "Actual worked hours/Maximum allowed hours"
 *                           drivingHours:
 *                             type: string
 *                             example: "42.5/56"
 *                             description: "Actual driving hours/Maximum weekly driving hours"
 *                           remainingExtendedDriving:
 *                             type: string
 *                             example: "1/2"
 *                             description: "Remaining 10-hour driving days this week"
 *                           remainingReducedRest:
 *                             type: string
 *                             example: "2/3"
 *                             description: "Remaining 9-hour rest periods allowed"
 *                           distanceKm:
 *                             type: integer
 *                             example: 1250
 *                           daysWorked:
 *                             type: integer
 *                             example: 7
 *                           details:
 *                             type: object
 *                             properties:
 *                               totalWorkHours:
 *                                 type: number
 *                                 example: 63.17
 *                               totalDrivingHours:
 *                                 type: number
 *                                 example: 42.5
 *                               extendedDrivingDaysUsed:
 *                                 type: integer
 *                                 example: 1
 *                               reducedRestDaysUsed:
 *                                 type: integer
 *                                 example: 1
 *                               daysWithPause:
 *                                 type: integer
 *                                 example: 2
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalWeeks:
 *                           type: integer
 *                           example: 12
 *                         totalWorkingHours:
 *                           type: number
 *                           example: 756.0
 *                         totalDrivingHours:
 *                           type: number
 *                           example: 510.0
 *                         totalDistance:
 *                           type: number
 *                           example: 15000
 *                         totalDaysWorked:
 *                           type: integer
 *                           example: 84
 *       "400":
 *         description: Bad request - invalid cadence ID
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Cadence not found
 *       "500":
 *         description: Internal server error
 */
cadenceRouter.get('/:cadenceId/weekly-statistics', auth, cadenceController.getCadenceWeeklyStatistics);

/**
 * @swagger
 * components:
 *   schemas:
 *     CadenceStatistics:
 *       type: object
 *       properties:
 *         totalDrivingHours:
 *           type: number
 *           description: Total hours spent driving
 *           example: 2400.5
 *         totalWorkingHours:
 *           type: number
 *           description: Total working hours
 *           example: 3600.0
 *         totalKilometers:
 *           type: number
 *           description: Total kilometers driven
 *           example: 180000.25
 *         averageKilometersPerDay:
 *           type: number
 *           description: Average kilometers per day
 *           example: 750.0
 *         averageDrivingHoursPerDay:
 *           type: number
 *           description: Average driving hours per day
 *           example: 10.0
 *         averageWorkingHoursPerDay:
 *           type: number
 *           description: Average working hours per day
 *           example: 15.0
 *         totalDays:
 *           type: integer
 *           description: Total number of working days
 *           example: 240
 *         periodStart:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Start of the period
 *         periodEnd:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: End of the period
 */
