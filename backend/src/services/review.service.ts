import {
  BusinessError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../utils/error.util.js";

interface CreateReviewDTO {
  orderId?: string;
  merchantId?: string;
  menuItemId?: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

export class ReviewService {
  constructor(
    private readonly reviewRepository: typeof import("../repositories/review.repository.js").reviewRepository,
    private readonly merchantRepository: typeof import("../repositories/merchant.repository.js").merchantRepository,
    private readonly orderRepository: typeof import("../repositories/order.repository.js").orderRepository,
  ) {}

  async createReview(customerId: string, data: CreateReviewDTO) {
    let merchantId = data.merchantId;

    // Handle image logic: merge imageUrl into imageUrls if needed
    let finalImageUrls = data.imageUrls || [];
    if (data.imageUrl && !finalImageUrls.includes(data.imageUrl)) {
      finalImageUrls = [data.imageUrl, ...finalImageUrls];
    }

    // If orderId is provided, validate order and get merchantId from it
    if (data.orderId) {
      const order = await this.orderRepository.findByIdWithDetails(
        data.orderId,
      );
      if (!order) {
        throw new NotFoundError("Order");
      }

      if (order.customerId !== customerId) {
        throw new ForbiddenError("You can only review your own orders");
      }

      if (order.status !== "delivered") {
        throw new BusinessError("You can only review delivered orders");
      }
      merchantId = order.merchantId;
    }

    if (!merchantId) {
      throw new BusinessError(
        "Merchant ID is required if no Order ID is provided",
      );
    }

    // Check if review already exists for this order/menu item combination (skip if no orderId)
    if (data.orderId) {
      const existingReview = await this.reviewRepository.checkReviewExists(
        data.orderId,
        data.menuItemId || null,
      );
      if (existingReview) {
        throw new ConflictError(
          "You have already reviewed this " +
            (data.menuItemId ? "menu item" : "order"),
        );
      }
    }

    // Create review
    const review = await this.reviewRepository.createReview({
      orderId: data.orderId,
      customerId,
      merchantId,
      menuItemId: data.menuItemId,
      rating: data.rating,
      comment: data.comment,
      imageUrl: data.imageUrl, // Keep for backward compatibility if needed, or remove? Schema has it.
      imageUrls: finalImageUrls,
    });

    // Update merchant rating
    const { avgRating, totalReviews } =
      await this.reviewRepository.calculateMerchantRating(merchantId);
    await this.merchantRepository.updateRating(
      merchantId,
      avgRating,
      totalReviews,
    );

    return review;
  }

  async getMerchantReviews(merchantId: string, page = 1, limit = 20) {
    const merchant = await this.merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    const offset = (page - 1) * limit;
    const reviews = await this.reviewRepository.findByMerchantId(
      merchantId,
      limit,
      offset,
    );
    const total =
      await this.reviewRepository.countReviewsByMerchant(merchantId);

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerReviews(customerId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const reviews = await this.reviewRepository.findByCustomerId(
      customerId,
      limit,
      offset,
    );
    const total =
      await this.reviewRepository.countReviewsByCustomer(customerId);

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateReview(
    reviewId: string,
    customerId: string,
    data: { rating?: number; comment?: string },
  ) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review");
    }

    if (review.customerId !== customerId) {
      throw new ForbiddenError("You can only update your own reviews");
    }

    const updatedReview = await this.reviewRepository.updateReview(
      reviewId,
      data,
    );

    // Recalculate merchant rating
    const { avgRating, totalReviews } =
      await this.reviewRepository.calculateMerchantRating(
        review.merchantId as string,
      );
    await this.merchantRepository.updateRating(
      review.merchantId as string,
      avgRating,
      totalReviews,
    );

    return updatedReview;
  }

  async deleteReview(reviewId: string, customerId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError("Review");
    }

    if (review.customerId !== customerId) {
      throw new ForbiddenError("You can only delete your own reviews");
    }

    const deletedReview = await this.reviewRepository.deleteReview(
      reviewId,
      customerId,
    );

    // Recalculate merchant rating
    const { avgRating, totalReviews } =
      await this.reviewRepository.calculateMerchantRating(
        review.merchantId as string,
      );
    await this.merchantRepository.updateRating(
      review.merchantId as string,
      avgRating,
      totalReviews,
    );

    return deletedReview;
  }

  async addMerchantReply(
    reviewId: string,
    merchantUserId: string,
    reply: string,
  ) {
    const review = await this.reviewRepository.findByIdWithDetails(reviewId);
    if (!review) {
      throw new NotFoundError("Review");
    }

    // Verify merchant owns the reviewed merchant
    const merchant = await this.merchantRepository.findByUserId(merchantUserId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }

    if (review.merchantId !== merchant.id) {
      throw new ForbiddenError(
        "You can only reply to reviews of your own merchant",
      );
    }

    // Check if already replied
    if (review.merchantReply) {
      throw new BusinessError("You have already replied to this review");
    }

    const updatedReview = await this.reviewRepository.addMerchantReply(
      reviewId,
      reply,
    );

    return updatedReview;
  }

  async getMenuItemReviews(menuItemId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const reviews = await this.reviewRepository.findByMenuItemId(
      menuItemId,
      limit,
      offset,
    );

    // Get total count (we don't have this method yet, but we can estimate)
    const total = reviews.length; // Simplified for now

    return {
      reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

import { merchantRepository } from "../repositories/merchant.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { reviewRepository } from "../repositories/review.repository.js";
export const reviewService = new ReviewService(
  reviewRepository,
  merchantRepository,
  orderRepository,
);
