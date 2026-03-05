import type { Request, Response } from 'express';
import { type AdminService, adminService } from '../services/admin.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  successResponse,
  successResponseWithMeta,
} from '../utils/response.util.js';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  getDashboard = catchAsync(async (_req: Request, res: Response) => {
    const stats = await this.adminService.getDashboardStats();
    successResponse(res, stats, 'Dashboard stats retrieved');
  });

  getUsers = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const { users, meta } = await this.adminService.getAllUsers(
      page,
      limit,
      search,
      role,
    );

    successResponseWithMeta(res, users, meta, 'Users retrieved');
  });

  updateUserStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await this.adminService.updateUserStatus(id!, isActive);

    successResponse(
      res,
      user,
      `User ${isActive ? 'activated' : 'deactivated'}`,
    );
  });
}

export const adminController = new AdminController(adminService);
