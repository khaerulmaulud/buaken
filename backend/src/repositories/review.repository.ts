import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { type NewReview, reviews } from "../db/schema/reviews.schema.js";
import { BaseRepository } from "./base.repository.js";

class ReviewRepository extends BaseRepository<typeof reviews> {
  constructor() {
    super(reviews);
  }

  async findByMerchantId(merchantId: string, limit = 20, offset = 0) {
    return await db.query.reviews.findMany({
      where: eq(reviews.merchantId, merchantId),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        menuItem: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
    });
  }

  async findByMenuItemId(menuItemId: string, limit = 20, offset = 0) {
    return await db.query.reviews.findMany({
      where: eq(reviews.menuItemId, menuItemId),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
    });
  }

  async findByOrderId(orderId: string) {
    const results = await db
      .select()
      .from(reviews)
      .where(eq(reviews.orderId, orderId))
      .limit(1);
    return results[0] || null;
  }

  async findByCustomerId(customerId: string, limit = 20, offset = 0) {
    return await db.query.reviews.findMany({
      where: eq(reviews.customerId, customerId),
      with: {
        merchant: {
          columns: {
            id: true,
            storeName: true,
            logoUrl: true,
          },
        },
        menuItem: {
          columns: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
    });
  }

  async createReview(data: NewReview) {
    const result = await db.insert(reviews).values(data).returning();
    return result[0];
  }

  async updateReview(id: string, data: Partial<NewReview>) {
    const result = await db
      .update(reviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return result[0] || null;
  }

  async calculateMerchantRating(merchantId: string) {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${reviews.rating})`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.merchantId, merchantId));

    return {
      avgRating: Number(result[0]?.avgRating || 0),
      totalReviews: Number(result[0]?.totalReviews || 0),
    };
  }

  async countReviewsByMerchant(merchantId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.merchantId, merchantId));

    return Number(result[0]?.count || 0);
  }

  async countReviewsByCustomer(customerId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.customerId, customerId));

    return Number(result[0]?.count || 0);
  }

  async deleteReview(id: string, customerId: string) {
    const result = await db
      .delete(reviews)
      .where(and(eq(reviews.id, id), eq(reviews.customerId, customerId)))
      .returning();
    return result[0] || null;
  }

  async addMerchantReply(reviewId: string, reply: string) {
    const [updated] = await db
      .update(reviews)
      .set({
        merchantReply: reply,
        repliedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    return updated;
  }

  async checkReviewExists(orderId: string, menuItemId: string | null) {
    const condition = menuItemId
      ? and(eq(reviews.orderId, orderId), eq(reviews.menuItemId, menuItemId))
      : and(eq(reviews.orderId, orderId), sql`${reviews.menuItemId} IS NULL`);

    const existing = await db.query.reviews.findFirst({
      where: condition,
    });

    return !!existing;
  }

  async findByIdWithDetails(id: string) {
    return await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
      with: {
        customer: { columns: { id: true, name: true, avatarUrl: true } },
        merchant: { columns: { id: true, storeName: true } },
        menuItem: { columns: { id: true, name: true, imageUrl: true } },
      },
    });
  }

  async findByCourierId(courierId: string, limit = 20, offset = 0) {
    return await db.query.reviews.findMany({
      where: eq(reviews.courierId, courierId),
      with: {
        customer: {
          columns: { id: true, name: true, avatarUrl: true },
        },
        order: {
          columns: { id: true, orderNumber: true },
        },
      },
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
    });
  }
}

export const reviewRepository = new ReviewRepository();
