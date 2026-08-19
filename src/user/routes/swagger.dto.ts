/**
 * @swagger
 * components:
 *   schemas:
 *     PointDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 82
 *         origId:
 *           type: string
 *           example: "57"
 *         type:
 *           type: string
 *           example: "rest_parking"
 *         name:
 *           type: string
 *           example: "Horb am Neckar"
 *         address:
 *           type: string
 *           example: "Horb am Neckar, Deutschland"
 *         longitude:
 *           type: string
 *           example: "8.60279"
 *         latitude:
 *           type: string
 *           example: "48.44849"
 *         number_of_parking_spots:
 *           type: integer
 *           example: 4
 *         number_of_bookable_spots:
 *           type: integer
 *           nullable: true
 *         verified:
 *           type: boolean
 *           example: true
 *         reviews_count:
 *           type: integer
 *           nullable: true
 *         reviews_rating:
 *           type: integer
 *           nullable: true
 *         icon_url:
 *           type: string
 *           nullable: true
 *         slug:
 *           type: string
 *           nullable: true
 *         bookable:
 *           type: boolean
 *           nullable: true
 *         price_per_night:
 *           type: string
 *           example: "false"
 *         security_rating:
 *           type: integer
 *           example: 0
 *         chatid:
 *           type: integer
 *           example: 3227365
 *         distance:
 *           type: number
 *           format: float
 *           example: 465.49
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserDto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 11
 *         mesiboId:
 *           type: integer
 *           nullable: true
 *           example: 123
 *         name:
 *           type: string
 *           nullable: true
 *           example: "User 007408"
 *         username:
 *           type: string
 *           nullable: true
 *           example: "user123"
 *         email:
 *           type: string
 *           nullable: true
 *           example: "test@gmail.com"
 *         longitude:
 *           type: string
 *           nullable: true
 *           example: "30.5234"
 *         latitude:
 *           type: string
 *           nullable: true
 *           example: "50.4501"
 *         companyId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         company:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             label:
 *               type: string
 *               example: "Acme Corp"
 *             logo:
 *               type: string
 *               nullable: true
 *               example: "acme-logo.png"
 *         photo:
 *           type: string
 *           nullable: true
 *           example: "some-photo.png"
 *         countryIsoCode:
 *           type: string
 *           nullable: true
 *           example: "UA"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "User desc"
 *         pmConfidenciality:
 *           type: string
 *           nullable: true
 *           example: "All"
 *         instagramUrl:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           description: Instagram profile URL
 *           example: "https://instagram.com/johndoe"
 *         facebookUrl:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           description: Facebook profile URL
 *           example: "https://facebook.com/johndoe"
 *         tiktokUrl:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           description: TikTok profile URL
 *           example: "https://tiktok.com/@johndoe"
 *         whatsappPhone:
 *           type: string
 *           nullable: true
 *           maxLength: 32
 *           description: WhatsApp phone number (flexible format)
 *           example: "+1 (555) 123-4567"
 *         viberPhone:
 *           type: string
 *           nullable: true
 *           maxLength: 32
 *           description: Viber phone number (flexible format)
 *           example: "+380501234567"
 *         telegramPhone:
 *           type: string
 *           nullable: true
 *           maxLength: 32
 *           description: Telegram phone number (flexible format)
 *           example: "+44 20 7946 0958"
 *         regType:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         isPublic:
 *           type: boolean
 *           example: true
 *         isBanned:
 *           type: boolean
 *           example: false
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 3
 *             name:
 *               type: string
 *               example: "user"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FriendRequestDto:
 *       type: object
 *       properties:
 *         forId:
 *           type: integer
 *           example: 11
 *         friendId:
 *           type: integer
 *           example: 22
 *         status:
 *           type: integer
 *           description: 1 - Pending, 2 - Accepted
 *           example: 1
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         uuid:
 *           type: string
 *           format: uuid
 *           example: "15aef672-f7dc-4b1e-bc92-8e8a3293f5a1"
 *         title:
 *           type: string
 *           example: "New message"
 *         body:
 *           type: string
 *           example: "You have a new message"
 *         type:
 *           type: integer
 *           example: 1
 *         id:
 *           type: string
 *           example: "msg-001"
 *         userId:
 *           type: integer
 *           example: 42
 *         isRead:
 *           type: boolean
 *           example: false
 *         fromUser:
 *           $ref: '#/components/schemas/UserDto'
 *
 *     PaginatedNotifications:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         totalItems:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 5
 *         currentPage:
 *           type: integer
 *           example: 1
 */
