import type { Request, Response } from 'express';
import { z } from 'zod';
import { validateImageFile } from '../middlewares/upload.middleware.js';
import { type MenuService, menuService } from '../services/menu.service.js';
import {
  type MerchantService,
  merchantService,
} from '../services/merchant.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  errorResponse,
  successResponse,
  successResponseWithMeta,
} from '../utils/response.util.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../validators/menu.validator.js';

export class MenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly merchantService: MerchantService,
  ) {}

  getMenuByMerchant = catchAsync(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const { availableOnly } = req.query;

    const parsedId = z.string().uuid().safeParse(merchantId);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Merchant ID',
        'MERCHANT_ID_INVALID',
      );
    }
    const menuItems = await this.menuService.getMenuByMerchantId(
      parsedId.data,
      availableOnly === 'true',
    );
    return successResponse(res, menuItems, 'Menu items retrieved successfully');
  });

  searchMenuItems = catchAsync(async (req: Request, res: Response) => {
    const result = await this.menuService.searchMenuItems(
      req.query.search as string,
      req.query.page
        ? Number.parseInt(req.query.page as string, 10)
        : undefined,
      req.query.limit
        ? Number.parseInt(req.query.limit as string, 10)
        : undefined,
    );
    return successResponseWithMeta(
      res,
      result.menuItems,
      result.meta,
      'Search results retrieved successfully',
    );
  });

  getMyMenu = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;

    console.time('DB query menu.getMyMenu');
    const merchant = await this.merchantService.getMerchantByUserId(userId);
    console.timeEnd('DB query menu.getMyMenu');

    if (!merchant) {
      return errorResponse(
        res,
        404,
        'Merchant profile not found. Please create a merchant profile first.',
        'MERCHANT_NOT_FOUND',
      );
    }

    const menuItems = await this.menuService.getMenuByMerchantId(
      merchant.id,
      false,
    );

    return successResponse(
      res,
      menuItems,
      'Your menu items retrieved successfully',
    );
  });

  uploadMenuImage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;

    if (!req.file) {
      return errorResponse(res, 400, 'No image file provided', 'NO_FILE');
    }

    await validateImageFile(req.file);
    const imageUrl = await this.menuService.uploadMenuImage(userId, req.file);

    return successResponse(res, { imageUrl }, 'Image uploaded successfully');
  });

  createMenuItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;

    const data = {
      name: req.body.name,
      description: req.body.description,
      // Fallback for form-data, native for JSON
      price:
        typeof req.body.price === 'string'
          ? Number(req.body.price)
          : req.body.price,
      imageUrl: req.body.imageUrl || undefined,
      isAvailable:
        req.body.isAvailable === 'true' || req.body.isAvailable === true,
      preparationTime: req.body.preparationTime
        ? typeof req.body.preparationTime === 'string'
          ? Number(req.body.preparationTime)
          : req.body.preparationTime
        : 15,
      categoryId: req.body.categoryId || undefined,
      stock: req.body.stock
        ? typeof req.body.stock === 'string'
          ? Number(req.body.stock)
          : req.body.stock
        : undefined,
    };

    const validationResult = createMenuItemSchema.shape.body.safeParse(data);
    if (!validationResult.success) {
      return errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        validationResult.error.errors,
      );
    }

    const validatedData = validationResult.data;

    // If a file was uploaded directly in this request, upload it
    if (req.file) {
      await validateImageFile(req.file);
      validatedData.imageUrl = await this.menuService.uploadMenuImage(
        userId,
        req.file,
      );
    }

    const menuItem = await this.menuService.createMenuItem(userId, {
      ...validatedData,
      price: validatedData.price.toString(),
    });
    return successResponse(
      res,
      menuItem,
      'Menu item created successfully',
      201,
    );
  });

  updateMenuItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'MENU_ITEM_ID_INVALID',
        'Invalid or missing Menu item ID',
      );
    }

    // Build partial update data intelligently handling both JSON and strings
    // biome-ignore lint/suspicious/noExplicitAny: dynamic form-data parsing
    const data: any = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.description !== undefined)
      data.description = req.body.description;
    if (req.body.price !== undefined)
      data.price =
        typeof req.body.price === 'string'
          ? Number(req.body.price)
          : req.body.price;
    if (req.body.imageUrl !== undefined)
      data.imageUrl = req.body.imageUrl || undefined;
    if (req.body.isAvailable !== undefined)
      data.isAvailable =
        req.body.isAvailable === 'true' || req.body.isAvailable === true;
    if (req.body.preparationTime !== undefined)
      data.preparationTime =
        typeof req.body.preparationTime === 'string'
          ? Number(req.body.preparationTime)
          : req.body.preparationTime;
    if (req.body.categoryId !== undefined)
      data.categoryId = req.body.categoryId;
    if (req.body.stock !== undefined)
      data.stock =
        typeof req.body.stock === 'string'
          ? Number(req.body.stock)
          : req.body.stock;

    const validationResult = updateMenuItemSchema.shape.body.safeParse(data);
    if (!validationResult.success) {
      return errorResponse(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        validationResult.error.errors,
      );
    }

    const validatedData = validationResult.data;

    // If a file was uploaded directly in this request, upload it
    if (req.file) {
      await validateImageFile(req.file);
      validatedData.imageUrl = await this.menuService.uploadMenuImage(
        userId,
        req.file,
      );
    }

    const menuItem = await this.menuService.updateMenuItem(
      parsedId.data,
      userId,
      {
        ...validatedData,
        price: validatedData.price ? validatedData.price.toString() : undefined,
      },
    );
    return successResponse(res, menuItem, 'Menu item updated successfully');
  });

  deleteMenuItem = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Menu item ID',
        'MENU_ITEM_ID_INVALID',
      );
    }
    await this.menuService.deleteMenuItem(parsedId.data, userId);
    return successResponse(res, null, 'Menu item deleted successfully');
  });

  toggleAvailability = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Menu item ID',
        'MENU_ITEM_ID_INVALID',
      );
    }
    const { isAvailable } = req.body;
    const menuItem = await this.menuService.toggleAvailability(
      parsedId.data,
      userId,
      isAvailable,
    );
    return successResponse(
      res,
      menuItem,
      `Menu item is now ${isAvailable ? 'available' : 'unavailable'}`,
    );
  });
}

export const menuController = new MenuController(menuService, merchantService);
