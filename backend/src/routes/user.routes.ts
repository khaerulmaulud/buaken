import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router: Router = Router();

/**
 * @openapi
 * /users/me/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update basic profile info
 *     description: Update authenticated user's name and phone number
 *     security:
 *       - bearerAuth: []
 */
router.put("/profile", authMiddleware, userController.updateProfile);

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     tags:
 *       - Users
 *     summary: Upload new avatar
 *     description: Upload and replace the user's profile picture
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.updateAvatar,
);

/**
 * @openapi
 * /users/me/password:
 *   put:
 *     tags:
 *       - Users
 *     summary: Change user password
 *     description: Verify old password and set a new one
 *     security:
 *       - bearerAuth: []
 */
router.put("/password", authMiddleware, userController.updatePassword);

/**
 * @openapi
 * /users/me/email:
 *   put:
 *     tags:
 *       - Users
 *     summary: Change user email
 *     description: Update the account's primary email address
 *     security:
 *       - bearerAuth: []
 */
router.put("/email", authMiddleware, userController.updateEmail);

export default router;
