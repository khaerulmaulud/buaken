import { Router } from "express";
import { merchantController } from "../controllers/merchant.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createMerchantSchema,
  toggleStatusSchema,
  updateMerchantSchema,
} from "../validators/merchant.validator.js";

const router: Router = Router();

/**
 * @openapi
 * /merchants:
 *   get:
 *     tags:
 *       - Merchants
 *     summary: List merchants
 *     description: Retrieve a list of all merchants/restaurants (public endpoint)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by merchant name or description
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: boolean
 *         description: Filter by open/closed status
 *     responses:
 *       200:
 *         description: Merchants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponseWithMeta'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Merchant'
 */
router.get("/merchants", merchantController.listMerchants);

/**
 * @openapi
 * /merchants/{id}:
 *   get:
 *     tags:
 *       - Merchants
 *     summary: Get merchant details
 *     description: Retrieve detailed information about a specific merchant/restaurant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Merchant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Merchant'
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/merchants/:id", merchantController.getMerchantDetail);

/**
 * @openapi
 * /merchant/profile:
 *   get:
 *     tags:
 *       - Merchants
 *     summary: Get own merchant profile
 *     description: Retrieve the authenticated merchant's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Merchant'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Merchant role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Merchant profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/merchant/profile",
  authMiddleware,
  roleMiddleware("merchant"),
  merchantController.getMyProfile,
);

/**
 * @openapi
 * /merchant/dashboard-stats:
 *   get:
 *     tags:
 *       - Merchants
 *     summary: Get merchant dashboard stats
 *     description: Retrieve earnings, order counts, and menu item stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get(
  "/merchant/dashboard-stats",
  authMiddleware,
  roleMiddleware("merchant"),
  merchantController.getDashboardStats,
);

/**
 * @openapi
 * /merchant/profile:
 *   post:
 *     tags:
 *       - Merchants
 *     summary: Create merchant profile
 *     description: Create a new merchant profile for the authenticated merchant user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMerchantRequest'
 *     responses:
 *       201:
 *         description: Merchant profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Validation error or profile already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Merchant role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/merchant/profile",
  authMiddleware,
  roleMiddleware("merchant"),
  validate(createMerchantSchema),
  merchantController.createProfile,
);

/**
 * @openapi
 * /merchant/profile/{id}:
 *   patch:
 *     tags:
 *       - Merchants
 *     summary: Update merchant profile
 *     description: Update the merchant's profile information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMerchantRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Merchant'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/merchant/profile/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  validate(updateMerchantSchema),
  merchantController.updateProfile,
);

/**
 * @openapi
 * /merchant/profile/{id}/logo:
 *   patch:
 *     tags:
 *       - Merchants
 *     summary: Update merchant logo
 *     description: Upload and update the merchant's logo
 *     security:
 *       - bearerAuth: []
 */
import { upload } from "../middlewares/upload.middleware.js";

router.patch(
  "/merchant/profile/:id/logo",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("logo"),
  merchantController.updateLogo,
);

/**
 * @openapi
 * /merchant/profile/{id}/banner:
 *   patch:
 *     tags:
 *       - Merchants
 *     summary: Update merchant banner
 *     description: Upload and update the merchant's banner
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/merchant/profile/:id/banner",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("banner"),
  merchantController.updateBanner,
);

/**
 * @openapi
 * /merchant/status/{id}:
 *   patch:
 *     tags:
 *       - Merchants
 *     summary: Toggle merchant status
 *     description: Toggle the merchant's open/closed status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOpen
 *             properties:
 *               isOpen:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/merchant/status/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  validate(toggleStatusSchema),
  merchantController.toggleStatus,
);

export default router;
