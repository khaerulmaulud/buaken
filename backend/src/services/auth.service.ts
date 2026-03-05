// Removed direct repository import for DI

import crypto from "node:crypto";
import type { NewCourierProfile } from "../db/schema/couriers.schema.js";
import type { NewMerchant } from "../db/schema/merchants.schema.js";
import type {
  AuthResponse,
  LoginDTO,
  RegisterDTO,
} from "../types/auth.types.js";
import { sendPasswordResetEmail } from "../utils/email.util.js";
import {
  BusinessError,
  ConflictError,
  InvalidCredentialsError,
  NotFoundError,
} from "../utils/error.util.js";
import { generateAccessToken } from "../utils/jwt.util.js";
import { comparePassword, hashPassword } from "../utils/password.util.js";

export class AuthService {
  constructor(
    private readonly userRepository: typeof import("../repositories/user.repository.js").userRepository,
    private readonly merchantRepository: typeof import("../repositories/merchant.repository.js").merchantRepository,
    private readonly courierRepository: typeof import("../repositories/courier.repository.js").courierRepository,
  ) {}

  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: data.role,
      isVerified: false,
      isActive: true,
    });
    if (!user) {
      throw new Error("Failed to create user");
    }
    if (!user.id) {
      throw new Error("User ID is undefined after creation");
    }

    // Auto-create default profiles based on role
    try {
      if (user.role === "merchant") {
        await this.merchantRepository.createMerchant({
          userId: user.id,
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
        } as NewMerchant);
      } else if (user.role === "courier") {
        await this.courierRepository.createCourierProfile({
          userId: user.id,
          vehicleType: "motorcycle",
          vehicleNumber: "PENDING",
          isOnline: false,
          totalDeliveries: 0,
          rating: "0",
        } as NewCourierProfile);
      }
    } catch (profileError) {
      // Log but don't fail registration if profile creation fails
      console.error(
        "Failed to auto-create profile during registration:",
        profileError,
      );
    }

    // Generate token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findActiveByEmail(data.email);
    if (!user) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError("Invalid email or password");
    }

    if (!user.id) {
      throw new Error("User ID is undefined");
    }

    // Generate token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async verifyEmail(userId: string) {
    const user = await this.userRepository.verifyUser(userId);
    if (!user) {
      throw new NotFoundError("User");
    }
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findActiveByEmail(email);
    if (!user) {
      // Return a 200/success response even if the user isn't found
      // for security reasons (don't leak registered emails)
      return { message: "If an account exists, a reset email was sent." };
    }

    // 1. Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    // Hash it for the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    // 2. Save token to user record
    await this.userRepository.updateResetToken(
      user.email,
      hashedToken,
      tokenExpires,
    );

    // 3. Send the plain token to user via email
    await sendPasswordResetEmail(user.email, resetToken);

    return { message: "Reset email sent successfully" };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Hash the incoming token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user by hashed token
    const user = await this.userRepository.findByResetToken(hashedToken);
    if (!user) {
      throw new BusinessError("Token is invalid or has expired");
    }

    // 3. Check if token is expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires <= new Date()) {
      throw new BusinessError("Token has expired");
    }

    // 4. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 5. Update user
    await this.userRepository.updateProfile(user.id, {
      // Types didn't include password, but we can update it in db
    });

    // Actually we need a specific method to update user password
    // For now we'll do an inline update, but it's better in the repository
    const { db } = await import("../db/index.js");
    const { users } = await import("../db/schema/users.schema.js");
    const { eq } = await import("drizzle-orm");

    await db
      .update(users)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { message: "Password reset successful" };
  }
}

import { courierRepository } from "../repositories/courier.repository.js";
import { merchantRepository } from "../repositories/merchant.repository.js";
import { userRepository } from "../repositories/user.repository.js";
export const authService = new AuthService(
  userRepository,
  merchantRepository,
  courierRepository,
);
