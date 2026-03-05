import type { Request, Response } from 'express';
import { z } from 'zod';
import {
  type ReviewService,
  reviewService,
} from '../services/review.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  errorResponse,
  successResponse,
  successResponseWithMeta,
} from '../utils/response.util.js';

export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  createReview = catchAsync(async (req: Request, res: Response) => {
    const customerId = req.user.id;
    const review = await this.reviewService.createReview(customerId, req.body);
    return successResponse(res, review, 'Review created successfully', 201);
  });

  getMerchantReviews = catchAsync(async (req: Request, res: Response) => {
    const { merchantId } = req.params;

    const parsedId = z.string().uuid().safeParse(merchantId);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Merchant ID',
        'MERCHANT_ID_INVALID',
      );
    }
    const { page, limit } = req.query;
    const result = await this.reviewService.getMerchantReviews(
      parsedId.data,
      page ? Number.parseInt(page as string, 10) : undefined,
      limit ? Number.parseInt(limit as string, 10) : undefined,
    );
    return successResponseWithMeta(
      res,
      result.reviews,
      result.meta,
      'Reviews retrieved successfully',
    );
  });

  getMyReviews = catchAsync(async (req: Request, res: Response) => {
    const customerId = req.user.id;
    const { page, limit } = req.query;
    const result = await this.reviewService.getCustomerReviews(
      customerId,
      page ? Number.parseInt(page as string, 10) : undefined,
      limit ? Number.parseInt(limit as string, 10) : undefined,
    );
    return successResponseWithMeta(
      res,
      result.reviews,
      result.meta,
      'Your reviews retrieved successfully',
    );
  });

  updateReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Review ID',
        'REVIEW_ID_INVALID',
      );
    }
    const customerId = req.user.id;
    const review = await this.reviewService.updateReview(
      parsedId.data,
      customerId,
      req.body,
    );
    return successResponse(res, review, 'Review updated successfully');
  });

  deleteReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Review ID',
        'REVIEW_ID_INVALID',
      );
    }
    const customerId = req.user.id;
    await this.reviewService.deleteReview(parsedId.data, customerId);
    return successResponse(res, null, 'Review deleted successfully');
  });

  replyToReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Review ID',
        'REVIEW_ID_INVALID',
      );
    }
    const merchantUserId = req.user.id;
    const { reply } = req.body;
    const review = await this.reviewService.addMerchantReply(
      parsedId.data,
      merchantUserId,
      reply,
    );
    return successResponse(res, review, 'Reply added successfully');
  });

  getMenuItemReviews = catchAsync(async (req: Request, res: Response) => {
    const { menuItemId } = req.params;

    const parsedId = z.string().uuid().safeParse(menuItemId);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        'Invalid or missing Menu item ID',
        'MENU_ITEM_ID_INVALID',
      );
    }
    const { page, limit } = req.query;
    const result = await this.reviewService.getMenuItemReviews(
      parsedId.data,
      page ? Number.parseInt(page as string, 10) : undefined,
      limit ? Number.parseInt(limit as string, 10) : undefined,
    );
    return successResponseWithMeta(
      res,
      result.reviews,
      result.meta,
      'Menu item reviews retrieved successfully',
    );
  });

  uploadReviewImage = catchAsync(async (req: Request, res: Response) => {
    console.log('[ReviewController] Upload request received');
    console.log(
      '[ReviewController] File details:',
      req.file
        ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          }
        : 'No file',
    );

    if (!req.file) {
      return errorResponse(res, 400, 'No image file provided', 'NO_FILE');
    }

    // Import storage service dynamically to avoid circular dependencies
    const { storageService } = await import('../services/storage.service.js');

    console.log(
      '[ReviewController] Uploading to Supabase (bucket: avatars)...',
    );
    // Upload to Supabase Storage in avatars bucket
    const imageUrl = await storageService.uploadFile(req.file, 'avatars');
    console.log('[ReviewController] Upload success:', imageUrl);

    return successResponse(res, { imageUrl }, 'Image uploaded successfully');
  });
}

export const reviewController = new ReviewController(reviewService);
