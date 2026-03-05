import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  menuItems,
  merchants,
  type NewMerchant,
} from "../db/schema/merchants.schema.js";
import { BaseRepository } from "./base.repository.js";

class MerchantRepository extends BaseRepository<typeof merchants> {
  constructor() {
    super(merchants);
  }

  async findByUserId(userId: string) {
    const results = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, userId))
      .limit(1);
    return results[0] || null;
  }

  async findWithFilters(filters: {
    city?: string;
    isOpen?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { city, isOpen, search, limit = 20, offset = 0 } = filters;

    const conditions = [];
    if (city) conditions.push(eq(merchants.city, city));
    if (isOpen !== undefined) conditions.push(eq(merchants.isOpen, isOpen));
    if (search) {
      const matchingMerchantIds = db
        .select({ merchantId: menuItems.merchantId })
        .from(menuItems)
        .where(
          or(
            ilike(menuItems.name, `%${search}%`),
            ilike(menuItems.description, `%${search}%`),
          ),
        );

      conditions.push(
        or(
          ilike(merchants.storeName, `%${search}%`),
          ilike(merchants.description, `%${search}%`),
          inArray(merchants.id, matchingMerchantIds),
        ),
      );
    }

    const query = db
      .select()
      .from(merchants)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${merchants.rating} DESC`);

    return await query;
  }

  async findByIdWithDetails(id: string) {
    return await db.query.merchants.findFirst({
      where: eq(merchants.id, id),
      with: {
        menuItems: {
          where: eq(merchants.id, id),
        },
        user: {
          columns: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async createMerchant(data: NewMerchant) {
    const result = await db.insert(merchants).values(data).returning();
    return result[0];
  }

  async updateMerchant(id: string, data: Partial<NewMerchant>) {
    const result = await db
      .update(merchants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();
    return result[0] || null;
  }

  async toggleOpenStatus(id: string, isOpen: boolean) {
    const result = await db
      .update(merchants)
      .set({ isOpen, updatedAt: new Date() })
      .where(eq(merchants.id, id))
      .returning();
    return result[0] || null;
  }

  async updateRating(
    merchantId: string,
    newRating: number,
    totalReviews: number,
  ) {
    const result = await db
      .update(merchants)
      .set({
        rating: newRating.toFixed(2),
        totalReviews,
        updatedAt: new Date(),
      })
      .where(eq(merchants.id, merchantId))
      .returning();
    return result[0] || null;
  }

  async countMerchants(filters: {
    city?: string;
    isOpen?: boolean;
    search?: string;
  }) {
    const { city, isOpen, search } = filters;

    const conditions = [];
    if (city) conditions.push(eq(merchants.city, city));
    if (isOpen !== undefined) conditions.push(eq(merchants.isOpen, isOpen));
    if (search) {
      const matchingMerchantIds = db
        .select({ merchantId: menuItems.merchantId })
        .from(menuItems)
        .where(
          or(
            ilike(menuItems.name, `%${search}%`),
            ilike(menuItems.description, `%${search}%`),
          ),
        );

      conditions.push(
        or(
          ilike(merchants.storeName, `%${search}%`),
          ilike(merchants.description, `%${search}%`),
          inArray(merchants.id, matchingMerchantIds),
        ),
      );
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchants)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(result[0]?.count || 0);
  }
}

export const merchantRepository = new MerchantRepository();
