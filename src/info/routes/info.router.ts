import { Router } from 'express';
import { auth } from '@auth/middlewares';
import { infoController } from '../controllers/info.controller';

export const infoRouter = Router();

/**
 * @swagger
 * /api/info/my-country:
 *   get:
 *     summary: Get current user's country and tachograph code via Nominatim reverse geocoding (OpenStreetMap)
 *     tags:
 *       - Info
 *     security:
 *       - bearerAuth: []
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
 *                     isoCode:
 *                       type: string
 *                       example: "AT"
 *                     tachographCode:
 *                       type: string
 *                       nullable: true
 *                       example: "E"
 *                       description: Country-level tachograph code
 *                     regionTachographCode:
 *                       type: string
 *                       nullable: true
 *                       example: "M"
 *                       description: Region-level tachograph code (e.g. Spanish regions). Null if no regional code exists for this location.
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: "Austria"
 *                     country:
 *                       type: string
 *                       nullable: true
 *                       example: "España"
 *                       description: Raw country display name from Nominatim
 *                     state:
 *                       type: string
 *                       nullable: true
 *                       example: "Community of Madrid"
 *                     regionCode:
 *                       type: string
 *                       nullable: true
 *                       example: "ES-MD"
 *                       description: ISO 3166-2 region code from Nominatim
 *       "400":
 *         description: User location not set
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Could not determine country from location
 */
infoRouter.get('/my-country', auth, infoController.getMyCountry);

/**
 * @swagger
 * /api/info/countries:
 *   get:
 *     summary: Get list of all countries with trucking info
 *     tags:
 *       - Info
 *     security:
 *       - bearerAuth: []
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
 *                       isoCode:
 *                         type: string
 *                         example: "AT"
 *                       tachographCode:
 *                         type: string
 *                         example: "A"
 *                       nameRu:
 *                         type: string
 *                         example: "Австрия"
 *       "401":
 *         description: Unauthorized
 */
infoRouter.get('/countries', auth, infoController.getCountries);

/**
 * @swagger
 * /api/info/countries/{isoCode}/rules:
 *   get:
 *     summary: Get trucking rules for a specific country in a given language
 *     tags:
 *       - Info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: isoCode
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 2
 *         description: ISO 3166-1 alpha-2 country code (case-insensitive, e.g. AT or at)
 *         example: "AT"
 *       - in: query
 *         name: lang
 *         required: false
 *         schema:
 *           type: string
 *           enum: [en, ru, bg, cs, de, es, fr, hr, it, lv, lt, hu, nl, pl, ro, sk, sl, sr, uk]
 *           default: en
 *         description: Language code for the rules. Falls back to Russian (ru) if translation is unavailable.
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
 *                     isoCode:
 *                       type: string
 *                       example: "AT"
 *                     tachographCode:
 *                       type: string
 *                       example: "A"
 *                     nameRu:
 *                       type: string
 *                       example: "Австрия"
 *                     lang:
 *                       type: string
 *                       example: "en"
 *                     rules:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         roadPayment:
 *                           type: string
 *                           nullable: true
 *                         speedLimits:
 *                           type: string
 *                           nullable: true
 *                         axleLoad:
 *                           type: string
 *                           nullable: true
 *                         seatbelts:
 *                           type: string
 *                           nullable: true
 *                         trafficLights:
 *                           type: string
 *                           nullable: true
 *                         alcoholLimits:
 *                           type: string
 *                           nullable: true
 *                         drugDriving:
 *                           type: string
 *                           nullable: true
 *                         prohibitedLanes:
 *                           type: string
 *                           nullable: true
 *                         helmet:
 *                           type: string
 *                           nullable: true
 *                         mobilePhone:
 *                           type: string
 *                           nullable: true
 *                         specialRules:
 *                           type: string
 *                           nullable: true
 *       "401":
 *         description: Unauthorized
 *       "404":
 *         description: Country not found
 */
infoRouter.get('/countries/:isoCode/rules', auth, infoController.getCountryRules);
