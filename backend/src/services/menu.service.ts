import type { NewMenuItem } from "../db/schema/merchants.schema.js";
// Removed for DI
import { ForbiddenError, NotFoundError } from "../utils/error.util.js";
import { storageService } from "./storage.service.js";

export class MenuService {
  constructor(
    private readonly menuRepository: typeof import("../repositories/menu.repository.js").menuRepository,
    private readonly merchantRepository: typeof import("../repositories/merchant.repository.js").merchantRepository,
  ) {}

  async uploadMenuImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }
    const imageUrl = await storageService.uploadFile(file, "menu-items");
    return imageUrl;
  }

  async getMenuByMerchantId(merchantId: string, availableOnly = false) {
    const merchant = await this.merchantRepository.findById(merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    if (availableOnly) {
      return await this.menuRepository.findAvailableByMerchantId(merchantId);
    }

    return await this.menuRepository.findByMerchantId(merchantId);
  }

  async getMenuItemById(id: string) {
    const menuItem = await this.menuRepository.findById(id);
    if (!menuItem) {
      throw new NotFoundError("Menu item");
    }
    return menuItem;
  }

  async searchMenuItems(search: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    // const menuItems = await this.menuRepository.searchMenuItems(
    //   search,
    //   limit,
    //   offset,
    // );
    // const total = await this.menuRepository.countMenuItems(search);
    const [menuItems, total] = await Promise.all([
      this.menuRepository.searchMenuItems(search, limit, offset),
      this.menuRepository.countMenuItems(search),
    ]);
    return {
      menuItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createMenuItem(userId: string, data: Omit<NewMenuItem, "merchantId">) {
    // Get merchant profile
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }

    // Create menu item
    const menuItem = await this.menuRepository.createMenuItem({
      ...data,
      merchantId: merchant.id,
    });

    return menuItem;
  }

  async updateMenuItem(id: string, userId: string, data: Partial<NewMenuItem>) {
    const menuItem = await this.menuRepository.findById(id);
    if (!menuItem) {
      throw new NotFoundError("Menu item");
    }

    // Verify ownership
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant || merchant.id !== menuItem.merchantId) {
      throw new ForbiddenError("You can only update your own menu items");
    }

    const updatedMenuItem = await this.menuRepository.updateMenuItem(id, data);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: string, userId: string) {
    const menuItem = await this.menuRepository.findById(id);
    if (!menuItem) {
      throw new NotFoundError("Menu item");
    }

    // Verify ownership
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant || merchant.id !== menuItem.merchantId) {
      throw new ForbiddenError("You can only delete your own menu items");
    }

    const deletedMenuItem = await this.menuRepository.deleteMenuItem(
      id,
      merchant.id,
    );
    return deletedMenuItem;
  }

  async toggleAvailability(id: string, userId: string, isAvailable: boolean) {
    const menuItem = await this.menuRepository.findById(id);
    if (!menuItem) {
      throw new NotFoundError("Menu item");
    }

    // Verify ownership
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant || merchant.id !== menuItem.merchantId) {
      throw new ForbiddenError("You can only update your own menu items");
    }

    const updatedMenuItem = await this.menuRepository.toggleAvailability(
      id,
      isAvailable,
    );
    return updatedMenuItem;
  }
}

import { menuRepository } from "../repositories/menu.repository.js";
import { merchantRepository } from "../repositories/merchant.repository.js";
export const menuService = new MenuService(menuRepository, merchantRepository);
