import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { type NewUser, users } from "../db/schema/users.schema.js";
import { BaseRepository } from "./base.repository.js";

class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmail(email: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return results[0] || null;
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return results[0] || null;
  }

  async findByIdWithProfile(id: string) {
    const results = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        addresses: true,
        merchantProfile: true,
        courierProfile: true,
      },
    });
    return results || null;
  }

  async createUser(data: NewUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }

  async updateProfile(
    id: string,
    data: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const result = await db
      .update(users)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }

  async updateResetToken(
    email: string,
    resetPasswordToken: string | null,
    resetPasswordExpires: Date | null,
  ) {
    const result = await db
      .update(users)
      .set({ resetPasswordToken, resetPasswordExpires, updatedAt: new Date() })
      .where(eq(users.email, email))
      .returning();
    return result[0] || null;
  }

  async findByResetToken(token: string) {
    const results = await db
      .select()
      .from(users)
      .where(eq(users.resetPasswordToken, token))
      .limit(1);
    return results[0] || null;
  }

  async findActiveByEmail(email: string) {
    const results = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.isActive, true)))
      .limit(1);
    return results[0] || null;
  }

  async verifyUser(id: string) {
    const result = await db
      .update(users)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  }
}

export const userRepository = new UserRepository();
