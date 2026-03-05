import type { Request, Response } from "express";
import { z } from "zod";
import { type OrderService, orderService } from "../services/order.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  errorResponse,
  successResponse,
  successResponseWithMeta,
} from "../utils/response.util.js";

export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  createOrder = catchAsync(async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      return errorResponse(res, 401, "User not authenticated", "UNAUTHORIZED");
    }
    const customerId = req.user.id;
    const order = await this.orderService.createOrder(customerId, req.body);
    return successResponse(res, order, "Order created successfully", 201);
  });

  getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const customerId = req.user?.id;
    const { page, limit } = req.query;
    const result = await this.orderService.getCustomerOrders(
      customerId,
      page ? parseInt(page as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    );
    return successResponseWithMeta(
      res,
      result.orders,
      result.meta,
      "Orders retrieved successfully",
    );
  });

  getOrderDetail = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Order ID",
        "ORDER_ID_INVALID",
      );
    }
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const order = await this.orderService.getOrderById(
      parsedId.data,
      userId,
      userRole,
    );
    return successResponse(res, order, "Order details retrieved successfully");
  });

  cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Order ID",
        "ORDER_ID_INVALID",
      );
    }
    const customerId = req.user?.id;
    const { reason } = req.body;
    const order = await this.orderService.cancelOrder(
      parsedId.data,
      customerId,
      reason,
    );
    return successResponse(res, order, "Order cancelled successfully");
  });

  getMerchantOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page, limit, status } = req.query;
    const statuses = status ? (status as string).split(",") : undefined;
    const result = await this.orderService.getMerchantOrders(
      userId,
      page ? parseInt(page as string, 10) : undefined,
      limit ? parseInt(limit as string, 10) : undefined,
      statuses,
    );
    return successResponseWithMeta(
      res,
      result.orders,
      result.meta,
      "Merchant orders retrieved successfully",
    );
  });

  updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Order ID",
        "ORDER_ID_INVALID",
      );
    }
    const { status } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const order = await this.orderService.updateOrderStatus(
      parsedId.data,
      status,
      userId,
      userRole,
    );
    return successResponse(res, order, `Order status updated to ${status}`);
  });

  confirmDelivery = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Order ID",
        "ORDER_ID_INVALID",
      );
    }
    const customerId = req.user?.id;
    const order = await this.orderService.customerConfirmDelivery(
      parsedId.data,
      customerId,
    );
    return successResponse(
      res,
      order,
      "Delivery confirmed successfully. Thank you!",
    );
  });
}

export const orderController = new OrderController(orderService);
