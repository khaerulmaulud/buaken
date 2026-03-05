import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db } from '../db/index.js';
import { menuItems, type NewMenuItem } from '../db/schema/merchants.schema.js';
import { BaseRepository } from './base.repository.js';

class MenuRepository extends BaseRepository<typeof menuItems> {
  constructor() {
    super(menuItems);
  }

  async findByMerchantId(merchantId: string) {
    return await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.merchantId, merchantId));
  }

  async findAvailableByMerchantId(merchantId: string) {
    return await db
      .select()
      .from(menuItems)
      .where(
        and(
          eq(menuItems.merchantId, merchantId),
          eq(menuItems.isAvailable, true),
        ),
      );
  }

  async findByIdAndMerchantId(id: string, merchantId: string) {
    const results = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.merchantId, merchantId)))
      .limit(1);
    return results[0] || null;
  }

  async searchMenuItems(search: string, limit = 20, offset = 0) {
    return await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        description: menuItems.description,
        price: menuItems.price,
        imageUrl: menuItems.imageUrl,
        isAvailable: menuItems.isAvailable,
        merchantId: menuItems.merchantId,
      })
      .from(menuItems)
      .where(
        and(
          or(
            ilike(menuItems.name, `%${search}%`),
            ilike(menuItems.description, `%${search}%`),
          ),
          eq(menuItems.isAvailable, true),
        ),
      )
      .limit(limit)
      .offset(offset);
  }

  async createMenuItem(data: NewMenuItem) {
    const result = await db.insert(menuItems).values(data).returning();
    return result[0];
  }

  async updateMenuItem(id: string, data: Partial<NewMenuItem>) {
    const result = await db
      .update(menuItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    return result[0] || null;
  }

  async toggleAvailability(id: string, isAvailable: boolean) {
    const result = await db
      .update(menuItems)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
    return result[0] || null;
  }

  async deleteMenuItem(id: string, merchantId: string) {
    const result = await db
      .delete(menuItems)
      .where(and(eq(menuItems.id, id), eq(menuItems.merchantId, merchantId)))
      .returning();
    return result[0] || null;
  }

  async findByIds(ids: string[]) {
    return await db.select().from(menuItems).where(inArray(menuItems.id, ids));
  }

  async countMenuItems(search?: string) {
    const condition = search
      ? and(
          or(
            ilike(menuItems.name, `%${search}%`),
            ilike(menuItems.description, `%${search}%`),
          ),
          eq(menuItems.isAvailable, true),
        )
      : eq(menuItems.isAvailable, true);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(menuItems)
      .where(condition);

    return Number(result[0]?.count || 0);
  }

  async decrementStock(
    id: string,
    quantity: number,
    tx?: PgTransaction<
      PostgresJsQueryResultHKT,
      typeof import('../db/schema/index.js'),
      any
    >,
  ) {
    const dbInstance = tx || db;

    // 🔥 OPTIMASI: 1 Query Langsung! Jauh lebih cepat dan 100% aman dari race-condition.
    const result = await dbInstance
      .update(menuItems)
      .set({
        // Catatan: Jika stock NULL, (NULL - quantity) akan tetap menghasilkan NULL di Postgres
        stock: sql`${menuItems.stock} - ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(menuItems.id, id),
          // Update HANYA JIKA: stock-nya unlimited (NULL) ATAU stock-nya masih cukup
          or(
            sql`${menuItems.stock} IS NULL`,
            sql`${menuItems.stock} >= ${quantity}`,
          ),
        ),
      )
      .returning({ id: menuItems.id }); // Cukup return ID untuk menghemat bandwidth

    return result.length > 0;
  }
}

export const menuRepository = new MenuRepository();
