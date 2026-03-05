import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/user.repository.js";
import { BusinessError, NotFoundError } from "../utils/error.util.js";
import { storageService } from "./storage.service.js";

export class UserService {
  constructor(
    private readonly userRepository: typeof import("../repositories/user.repository.js").userRepository,
    private readonly storageService: typeof import("./storage.service.js").storageService,
  ) {}

  async getUserById(userId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    // Don't return password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    // Only pass allowed fields
    const updateData = {
      name: data.name,
      phone: data.phone,
    };

    const user = await this.userRepository.updateProfile(userId, updateData);
    if (!user) {
      throw new NotFoundError("User");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = await this.storageService.uploadFile(file, "avatars");

    // Get current user to check if they already have an avatar to delete
    const currentUser = await this.userRepository.findById(userId);
    if (currentUser?.avatarUrl) {
      await this.storageService.deleteFile(currentUser.avatarUrl as string);
    }

    const maxRetries = 3;
    let retries = 0;
    let user;

    while (retries < maxRetries) {
      try {
        user = await this.userRepository.updateAvatar(userId, avatarUrl);
        if (user) break;
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          // If update fails after retries, try to clean up the uploaded file
          await this.storageService.deleteFile(avatarUrl).catch(console.error);
          throw error;
        }
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 100 * retries));
      }
    }

    if (!user) {
      await this.storageService.deleteFile(avatarUrl).catch(console.error);
      throw new NotFoundError("User");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePassword(
    userId: string,
    currentPasswordRaw: string,
    newPasswordRaw: string,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const isMatch = await bcrypt.compare(currentPasswordRaw, user.password);
    if (!isMatch) {
      throw new BusinessError("Incorrect current password");
    }

    const hashedPassword = await bcrypt.hash(newPasswordRaw, 10);
    const updatedUser = await this.userRepository.updateProfile(userId, {
      password: hashedPassword,
    } as any);

    if (!updatedUser) throw new NotFoundError("User");
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updateEmail(userId: string, newEmail: string) {
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new BusinessError("Email is already registered by another account");
    }

    const updatedUser = await this.userRepository.updateProfile(userId, {
      email: newEmail,
    } as any);
    if (!updatedUser) throw new NotFoundError("User");

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}

// Global instance for manual DI
export const userService = new UserService(userRepository, storageService);
