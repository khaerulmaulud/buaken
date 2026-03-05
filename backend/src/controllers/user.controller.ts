import type { Request, Response } from 'express';
import { type UserService, userService } from '../services/user.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { BusinessError } from '../utils/error.util.js';
import { successResponse } from '../utils/response.util.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await this.userService.updateProfile(userId, updateData);

    return successResponse(res, user, 'Profile updated successfully');
  });

  updateAvatar = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new BusinessError('No image file provided');
    }

    const user = await this.userService.updateAvatar(userId, file);
    return successResponse(res, user, 'Avatar updated successfully');
  });

  updatePassword = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new BusinessError('Current and new password are required');
    }

    // Pass the raw request to the service layer for database validation
    await this.userService.updatePassword(userId, currentPassword, newPassword);

    return successResponse(res, null, 'Password updated successfully');
  });

  updateEmail = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { email } = req.body;

    if (!email) {
      throw new BusinessError('New email is required');
    }

    const user = await this.userService.updateEmail(userId, email);

    return successResponse(res, user, 'Email updated successfully');
  });
}

// Global instance for routes
export const userController = new UserController(userService);
