import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { type AuthService, authService } from '../services/auth.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { successResponse } from '../utils/response.util.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}
  register = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);

    // Set cookie
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, result, 'Registration successful', 201);
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);

    // Set cookie
    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict', // Adjust based on frontend/backend domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return successResponse(res, result, 'Login successful');
  });

  getMe = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const user = await this.authService.getProfile(userId);
    return successResponse(res, user, 'Profile retrieved successfully');
  });

  logout = catchAsync(async (_req: Request, res: Response) => {
    // Clear cookie
    res.clearCookie('token');
    return successResponse(res, null, 'Logout successful');
  });

  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.authService.forgotPassword(email);
    return successResponse(res, result, 'Forgot password request processed');
  });

  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const result = await this.authService.resetPassword(token, newPassword);
    return successResponse(res, result, 'Password reset successful');
  });
}

export const authController = new AuthController(authService);
