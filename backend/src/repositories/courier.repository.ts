import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  courierProfiles,
  type NewCourierProfile,
} from '../db/schema/couriers.schema.js';
import { BaseRepository } from './base.repository.js';

class CourierRepository extends BaseRepository<typeof courierProfiles> {
  constructor() {
    super(courierProfiles);
  }

  async findByUserId(userId: string) {
    const results = await db
      .select()
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(1);
    return results[0] || null;
  }

  async createCourierProfile(data: NewCourierProfile) {
    const result = await db.insert(courierProfiles).values(data).returning();
    return result[0];
  }

  async updateCourierProfile(id: string, data: Partial<NewCourierProfile>) {
    const result = await db
      .update(courierProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(courierProfiles.id, id))
      .returning();
    return result[0] || null;
  }

  async updateLocation(userId: string, latitude: string, longitude: string) {
    const result = await db
      .update(courierProfiles)
      .set({
        currentLatitude: latitude,
        currentLongitude: longitude,
        updatedAt: new Date(),
      })
      .where(eq(courierProfiles.userId, userId))
      .returning();
    return result[0] || null;
  }

  async toggleOnlineStatus(userId: string, isOnline: boolean) {
    const result = await db
      .update(courierProfiles)
      .set({ isOnline, updatedAt: new Date() })
      .where(eq(courierProfiles.userId, userId))
      .returning();
    return result[0] || null;
  }

  async incrementDeliveries(userId: string) {
    const result = await db
      .update(courierProfiles)
      .set({
        totalDeliveries: sql`${courierProfiles.totalDeliveries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(courierProfiles.userId, userId))
      .returning();
    return result[0] || null;
  }

  async updateRating(userId: string, newRating: number) {
    const result = await db
      .update(courierProfiles)
      .set({
        rating: newRating.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(courierProfiles.userId, userId))
      .returning();
    return result[0] || null;
  }

  async findOnlineCouriers() {
    return await db
      .select()
      .from(courierProfiles)
      .where(eq(courierProfiles.isOnline, true));
  }
}

export const courierRepository = new CourierRepository();
