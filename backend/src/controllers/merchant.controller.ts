import type { Request, Response } from 'express';
import { z } from 'zod';
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

export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  listMerchants = catchAsync(async (req: Request, res: Response) => {
    const { city, isOpen, search, page, limit } = req.query;
    const result = await this.merchantService.getMerchants({
      city: city as string,
      isOpen: isOpen === 'true' ? true : isOpen === 'false' ? false : undefined,
      search: search as string,
      page: page ? Number.parseInt(page as string, 10) : undefined,
      limit: limit ? Number.parseInt(limit as string, 10) : undefined,
    });

    return successResponseWithMeta(
      res,
      result.merchants,
      result.meta,
      'Merchants retrieved successfully',
    );
  });

  getMerchantDetail = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Merchant ID',
        'MERCHANT_ID_INVALID',
      );
    }
    const merchant = await this.merchantService.getMerchantById(parsedId.data);
    return successResponse(
      res,
      merchant,
      'Merchant details retrieved successfully',
    );
  });

  getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const merchant =
      await this.merchantService.getOrCreateMerchantProfile(userId);
    return successResponse(
      res,
      merchant,
      'Merchant profile retrieved successfully',
    );
  });

  createProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const merchant = await this.merchantService.createMerchant(
      userId,
      req.body,
    );
    return successResponse(
      res,
      merchant,
      'Merchant profile created successfully',
      201,
    );
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Merchant ID',
        'MERCHANT_ID_INVALID',
      );
    }
    const merchant = await this.merchantService.updateMerchant(
      parsedId.data,
      userId,
      req.body,
    );
    return successResponse(
      res,
      merchant,
      'Merchant profile updated successfully',
    );
  });

  toggleStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Merchant ID',
        'MERCHANT_ID_INVALID',
      );
    }
    const { isOpen } = req.body;
    const merchant = await this.merchantService.toggleOpenStatus(
      parsedId.data,
      userId,
      isOpen,
    );
    return successResponse(
      res,
      merchant,
      `Merchant is now ${isOpen ? 'open' : 'closed'}`,
    );
  });

  updateLogo = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (!req.file) {
      return errorResponse(res, 400, 'FILE_MISSING', 'No image file uploaded');
    }

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'MERCHANT_ID_INVALID',
        'Invalid or missing Merchant ID',
      );
    }

    const merchant = await this.merchantService.updateLogo(
      parsedId.data,
      userId,
      req.file,
    );
    return successResponse(res, merchant, 'Merchant logo updated successfully');
  });

  updateBanner = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { id } = req.params;

    if (!req.file) {
      return errorResponse(res, 400, 'FILE_MISSING', 'No image file uploaded');
    }

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'MERCHANT_ID_INVALID',
        'Invalid or missing Merchant ID',
      );
    }

    const merchant = await this.merchantService.updateBanner(
      parsedId.data,
      userId,
      req.file,
    );
    return successResponse(
      res,
      merchant,
      'Merchant banner updated successfully',
    );
  });

  getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const stats = await this.merchantService.getMerchantDashboardStats(userId);
    return successResponse(
      res,
      stats,
      'Dashboard stats retrieved successfully',
    );
  });
}

export const merchantController = new MerchantController(merchantService);
