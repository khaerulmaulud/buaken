import { eq } from 'drizzle-orm';
import type { PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db/index.js';

export class BaseRepository<T extends PgTable> {
  constructor(protected table: T) {}

  async findAll() {
    return await db.select().from(this.table as PgTable);
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(this.table as PgTable)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .where(eq((this.table as any).id, id))
      .limit(1);
    return results[0] || null;
  }

  async create(data: PgInsertValue<T>) {
    const result = await db.insert(this.table).values(data).returning();
    return result[0];
  }

  async update(id: string, data: PgInsertValue<T>) {
    const result = await db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .where(eq((this.table as any).id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    const result = await db
      .delete(this.table as PgTable)
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      .where(eq((this.table as any).id, id))
      .returning();
    return result[0] || null;
  }
}
