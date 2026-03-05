import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  type NewUserAddress,
  userAddresses,
} from '../db/schema/users.schema.js';
import { BaseRepository } from './base.repository.js';

class AddressRepository extends BaseRepository<typeof userAddresses> {
  constructor() {
    super(userAddresses);
  }

  async findByUserId(userId: string) {
    return await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId));
  }

  async findByIdAndUserId(id: string, userId: string) {
    const results = await db
      .select()
      .from(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
      .limit(1);
    return results[0] || null;
  }

  async findDefaultByUserId(userId: string) {
    const results = await db
      .select()
      .from(userAddresses)
      .where(
        and(
          eq(userAddresses.userId, userId),
          eq(userAddresses.isDefault, true),
        ),
      )
      .limit(1);
    return results[0] || null;
  }

  async createAddress(data: NewUserAddress) {
    const result = await db.insert(userAddresses).values(data).returning();
    return result[0];
  }

  async updateAddress(id: string, data: Partial<NewUserAddress>) {
    const result = await db
      .update(userAddresses)
      .set(data)
      .where(eq(userAddresses.id, id))
      .returning();
    return result[0] || null;
  }

  async setAsDefault(addressId: string, userId: string) {
    // First, unset all default addresses for this user
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId));

    // Then set the selected address as default
    const result = await db
      .update(userAddresses)
      .set({ isDefault: true })
      .where(eq(userAddresses.id, addressId))
      .returning();
    return result[0] || null;
  }

  async deleteAddress(id: string, userId: string) {
    const result = await db
      .delete(userAddresses)
      .where(and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)))
      .returning();
    return result[0] || null;
  }
}

export const addressRepository = new AddressRepository();
