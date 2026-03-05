import { Router } from "express";
import { menuController } from "../controllers/menu.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  searchMenuSchema,
  toggleAvailabilitySchema,
} from "../validators/menu.validator.js";

const router: Router = Router();

/**
 * @openapi
 * /merchants/{merchantId}/menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get merchant menu
 *     description: Retrieve all menu items for a specific merchant (public endpoint)
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/merchants/:merchantId/menu", menuController.getMenuByMerchant);

/**
 * @openapi
 * /menu-items/search:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Search menu items
 *     description: Search for menu items across all merchants
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Search results retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
 */
router.get(
  "/menu-items/search",
  validate(searchMenuSchema),
  menuController.searchMenuItems,
);

/**
 * @openapi
 * /merchant/menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get own menu
 *     description: Retrieve menu items for the authenticated merchant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Merchant role required
 */
router.get(
  "/merchant/menu",
  authMiddleware,
  roleMiddleware("merchant"),
  menuController.getMyMenu,
);

/**
 * @openapi
 * /merchant/menu/upload-image:
 *   post:
 *     tags:
 *       - Menu
 *     summary: Upload menu item image
 *     description: Upload an image file for a menu item. Returns the image URL.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/merchant/menu/upload-image",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("image"),
  menuController.uploadMenuImage,
);

/**
 * @openapi
 * /merchant/menu:
 *   post:
 *     tags:
 *       - Menu
 *     summary: Create menu item
 *     description: Add a new item to the merchant's menu (supports multipart/form-data with optional image file)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - preparationTime
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               preparationTime:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Merchant role required
 */
router.post(
  "/merchant/menu",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("image"),
  menuController.createMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}:
 *   patch:
 *     tags:
 *       - Menu
 *     summary: Update menu item
 *     description: Update an existing menu item (supports multipart/form-data with optional image file)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               preparationTime:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Menu item not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/merchant/menu/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("image"),
  menuController.updateMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}:
 *   delete:
 *     tags:
 *       - Menu
 *     summary: Delete menu item
 *     description: Remove a menu item from the merchant's menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *       404:
 *         description: Menu item not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/merchant/menu/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  menuController.deleteMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}/availability:
 *   patch:
 *     tags:
 *       - Menu
 *     summary: Toggle menu item availability
 *     description: Toggle the availability status of a menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       404:
 *         description: Menu item not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/merchant/menu/:id/availability",
  authMiddleware,
  roleMiddleware("merchant"),
  validate(toggleAvailabilitySchema),
  menuController.toggleAvailability,
);

/**
 * @openapi
 * /merchants/{merchantId}/menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get merchant menu
 *     description: Retrieve all menu items for a specific merchant (public endpoint)
 *     parameters:
 *       - in: path
 *         name: merchantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Merchant ID
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Merchant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/merchants/:merchantId/menu", menuController.getMenuByMerchant);

/**
 * @openapi
 * /menu-items/search:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Search menu items
 *     description: Search for menu items across all merchants
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Search results retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
 */
router.get(
  "/menu-items/search",
  validate(searchMenuSchema),
  menuController.searchMenuItems,
);

/**
 * @openapi
 * /merchant/menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get own menu
 *     description: Retrieve menu items for the authenticated merchant
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Menu items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MenuItem'
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
router.get(
  "/merchant/menu",
  authMiddleware,
  roleMiddleware("merchant"),
  menuController.getMyMenu,
);

/**
 * @openapi
 * /merchant/menu:
 *   post:
 *     tags:
 *       - Menu
 *     summary: Create menu item
 *     description: Add a new item to the merchant's menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuItemRequest'
 *     responses:
 *       201:
 *         description: Menu item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Validation error
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
  "/merchant/menu",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("image"),
  menuController.createMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}:
 *   patch:
 *     tags:
 *       - Menu
 *     summary: Update menu item
 *     description: Update an existing menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMenuItemRequest'
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Menu item not found
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
  "/merchant/menu/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  upload.single("image"),
  menuController.updateMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}:
 *   delete:
 *     tags:
 *       - Menu
 *     summary: Delete menu item
 *     description: Remove a menu item from the merchant's menu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     responses:
 *       200:
 *         description: Menu item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Menu item not found
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
router.delete(
  "/merchant/menu/:id",
  authMiddleware,
  roleMiddleware("merchant"),
  menuController.deleteMenuItem,
);

/**
 * @openapi
 * /merchant/menu/{id}/availability:
 *   patch:
 *     tags:
 *       - Menu
 *     summary: Toggle menu item availability
 *     description: Toggle the availability status of a menu item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Menu item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Menu item not found
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
  "/merchant/menu/:id/availability",
  authMiddleware,
  roleMiddleware("merchant"),
  validate(toggleAvailabilitySchema),
  menuController.toggleAvailability,
);

export default router;
