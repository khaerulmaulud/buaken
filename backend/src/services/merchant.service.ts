import type { NewMerchant } from "../db/schema/merchants.schema.js";
// Removed for DI
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../utils/error.util.js";

export class MerchantService {
  constructor(
    private readonly merchantRepository: typeof import("../repositories/merchant.repository.js").merchantRepository,
    private readonly userRepository: typeof import("../repositories/user.repository.js").userRepository,
    private readonly storageService: typeof import("./storage.service.js").storageService,
  ) {}

  async getMerchants(filters: {
    city?: string;
    isOpen?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const merchants = await this.merchantRepository.findWithFilters({
      city: filters.city,
      isOpen: filters.isOpen,
      search: filters.search,
      limit,
      offset,
    });

    const total = await this.merchantRepository.countMerchants({
      city: filters.city,
      isOpen: filters.isOpen,
      search: filters.search,
    });

    return {
      merchants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMerchantById(id: string) {
    const merchant = await this.merchantRepository.findByIdWithDetails(id);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }
    return merchant;
  }

  async getMerchantByUserId(userId: string) {
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }
    return merchant;
  }

  async getOrCreateMerchantProfile(userId: string) {
    const existing = await this.merchantRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Auto-create a default profile for existing users who don't have one
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const merchant = await this.merchantRepository.createMerchant({
      userId,
      storeName: `${user.name}'s Store`,
      description:
        "Welcome to my store! Update this description to tell customers about your food.",
      addressLine: "Please update your address",
      latitude: "-6.2088",
      longitude: "106.8456",
      city: "Jakarta",
      phone: user.phone || "08000000000",
      isOpen: false,
      openingTime: "08:00",
      closingTime: "22:00",
      deliveryFee: "5000",
      minOrder: "15000",
      estimatedDeliveryTime: 30,
    });

    return merchant;
  }

  async createMerchant(userId: string, data: Omit<NewMerchant, "userId">) {
    // Check if user exists and is a merchant
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.role !== "merchant") {
      throw new ForbiddenError(
        "Only merchant users can create merchant profiles",
      );
    }

    // Check if merchant profile already exists
    const existingMerchant = await this.merchantRepository.findByUserId(userId);
    if (existingMerchant) {
      throw new ConflictError("Merchant profile already exists");
    }

    // Create merchant
    const merchant = await this.merchantRepository.createMerchant({
      ...data,
      userId,
    });

    return merchant;
  }

  async updateMerchant(
    merchantId: string,
    userId: string,
    data: Partial<NewMerchant>,
  ) {
    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    // Verify ownership
    if (merchant.userId !== userId) {
      throw new ForbiddenError("You can only update your own merchant profile");
    }

    const updatedMerchant = await this.merchantRepository.updateMerchant(
      merchantId,
      data,
    );
    return updatedMerchant;
  }

  async updateLogo(
    merchantId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const merchant = await this.merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    if (merchant.userId !== userId) {
      throw new ForbiddenError("You can only update your own merchant profile");
    }

    const logoUrl = await this.storageService.uploadFile(
      file,
      "merchants/logos",
    );

    if (merchant.logoUrl) {
      await this.storageService
        .deleteFile(merchant.logoUrl as string)
        .catch(console.error);
    }

    return await this.merchantRepository.updateMerchant(merchantId, {
      logoUrl,
    });
  }

  async updateBanner(
    merchantId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const merchant = await this.merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    if (merchant.userId !== userId) {
      throw new ForbiddenError("You can only update your own merchant profile");
    }

    const bannerUrl = await this.storageService.uploadFile(
      file,
      "merchants/banners",
    );

    if (merchant.bannerUrl) {
      await this.storageService
        .deleteFile(merchant.bannerUrl as string)
        .catch(console.error);
    }

    return await this.merchantRepository.updateMerchant(merchantId, {
      bannerUrl,
    });
  }

  async toggleOpenStatus(merchantId: string, userId: string, isOpen: boolean) {
    const merchant = await merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    // Verify ownership
    if (merchant.userId !== userId) {
      throw new ForbiddenError("You can only update your own merchant status");
    }

    const updatedMerchant = await this.merchantRepository.toggleOpenStatus(
      merchantId,
      isOpen,
    );
    return updatedMerchant;
  }

  async getMerchantDashboardStats(userId: string) {
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }

    const { orderRepository } =
      await import("../repositories/order.repository.js");

    const [earnings, menuItemCount] = await Promise.all([
      orderRepository.getMerchantEarnings(merchant.id),
      orderRepository.countMenuItemsByMerchant(merchant.id),
    ]);

    return {
      ...earnings,
      menuItemCount,
    };
  }
}

import { merchantRepository } from "../repositories/merchant.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { storageService } from "./storage.service.js";

export const merchantService = new MerchantService(
  merchantRepository,
  userRepository,
  storageService,
);
