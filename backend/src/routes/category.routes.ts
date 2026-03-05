import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { db } from "../db/index.js";
import { categories } from "../db/schema/merchants.schema.js";
import { successResponseWithMeta } from "../utils/response.util.js";

const router: Router = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: List all categories
 *     description: Retrieve all food categories (public endpoint)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                           iconUrl:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 */
router.get(
  "/categories",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const allCategories = await db.select().from(categories);
      return successResponseWithMeta(res, allCategories, {
        page: 1,
        limit: allCategories.length,
        total: allCategories.length,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
