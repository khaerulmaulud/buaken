import type { Request, Response } from 'express';
import {
  type CourierService,
  courierService,
} from '../services/courier.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import {
  errorResponse,
  successResponse,
  successResponseWithMeta,
} from '../utils/response.util.js';

export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  getMyProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profile = await this.courierService.getOrCreateCourierProfile(userId);
    return successResponse(
      res,
      profile,
      'Courier profile retrieved successfully',
    );
  });

  createProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profile = await this.courierService.createCourierProfile(
      userId,
      req.body,
    );
    return successResponse(
      res,
      profile,
      'Courier profile created successfully',
      201,
    );
  });

  updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const profile = await this.courierService.updateCourierProfile(
      userId,
      req.body,
    );
    return successResponse(
      res,
      profile,
      'Courier profile updated successfully',
    );
  });

  updateLocation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;
    const profile = await this.courierService.updateLocation(
      userId,
      latitude,
      longitude,
    );
    return successResponse(res, profile, 'Location updated successfully');
  });

  toggleOnlineStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { isOnline } = req.body;
    const profile = await this.courierService.toggleOnlineStatus(
      userId,
      isOnline,
    );
    return successResponse(
      res,
      profile,
      `You are now ${isOnline ? 'online' : 'offline'}`,
    );
  });

  getAvailableOrders = catchAsync(async (req: Request, res: Response) => {
    const { limit } = req.query;
    console.time('DB query courier.getAvailableOrders');
    const orders = await this.courierService.getAvailableOrders(
      limit ? Number.parseInt(limit as string, 10) : undefined,
    );
    console.timeEnd('DB query courier.getAvailableOrders');
    return successResponse(
      res,
      orders,
      'Available orders retrieved successfully',
    );
  });

  acceptDelivery = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(
        res,
        400,
        'Order ID is required',
        'ORDER_ID_REQUIRED',
      );
    }
    const courierId = req.user.id;
    const order = await this.courierService.acceptDelivery(orderId, courierId);
    return successResponse(res, order, 'Delivery accepted successfully');
  });

  getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const courierId = req.user.id;
    const { page, limit, status } = req.query;
    const statuses = status ? (status as string).split(',') : undefined;
    console.time('DB query courier.getMyOrders');
    const result = await this.courierService.getCourierOrders(
      courierId,
      page ? Number.parseInt(page as string, 10) : undefined,
      limit ? Number.parseInt(limit as string, 10) : undefined,
      statuses,
    );
    console.timeEnd('DB query courier.getMyOrders');
    return successResponseWithMeta(
      res,
      result.orders,
      result.meta,
      'Your deliveries retrieved successfully',
    );
  });

  markPickedUp = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(
        res,
        400,
        'Order ID is required',
        'ORDER_ID_REQUIRED',
      );
    }
    const courierId = req.user.id;
    const order = await this.courierService.markPickedUp(orderId, courierId);
    return successResponse(res, order, 'Order marked as picked up');
  });

  markOnDelivery = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(
        res,
        400,
        'Order ID is required',
        'ORDER_ID_REQUIRED',
      );
    }
    const courierId = req.user.id;
    const order = await this.courierService.markOnDelivery(orderId, courierId);
    return successResponse(res, order, 'Order marked as on delivery');
  });

  markDelivered = catchAsync(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    if (!orderId) {
      return errorResponse(
        res,
        400,
        'Order ID is required',
        'ORDER_ID_REQUIRED',
      );
    }
    const courierId = req.user.id;
    const order = await this.courierService.markDelivered(orderId, courierId);
    return successResponse(res, order, 'Order marked as delivered');
  });

  getDashboardStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const stats = await this.courierService.getCourierDashboardStats(userId);
    return successResponse(
      res,
      stats,
      'Dashboard stats retrieved successfully',
    );
  });
}

export const courierController = new CourierController(courierService);
