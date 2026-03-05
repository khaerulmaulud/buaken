import type { NewCourierProfile } from "../db/schema/couriers.schema.js";
// Removed for DI
import {
  BusinessError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../utils/error.util.js";

export class CourierService {
  constructor(
    private readonly courierRepository: typeof import("../repositories/courier.repository.js").courierRepository,
    private readonly orderRepository: typeof import("../repositories/order.repository.js").orderRepository,
    private readonly userRepository: typeof import("../repositories/user.repository.js").userRepository,
  ) {}

  async getCourierProfile(userId: string) {
    const profile = await this.courierRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }
    return profile;
  }

  async getOrCreateCourierProfile(userId: string) {
    const existing = await this.courierRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Auto-create a default profile for existing users who don't have one
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    const profile = await this.courierRepository.createCourierProfile({
      userId,
      vehicleType: "motorcycle",
      vehicleNumber: "PENDING",
      isOnline: false,
      totalDeliveries: 0,
      rating: "0",
    });

    return profile;
  }

  async createCourierProfile(
    userId: string,
    data: Omit<NewCourierProfile, "userId">,
  ) {
    // Check if user exists and is a courier
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    if (user.role !== "courier") {
      throw new ForbiddenError(
        "Only courier users can create courier profiles",
      );
    }

    // Check if profile already exists
    const existingProfile = await this.courierRepository.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictError("Courier profile already exists");
    }

    const profile = await this.courierRepository.createCourierProfile({
      ...data,
      userId,
      isOnline: false,
      totalDeliveries: 0,
      rating: "0",
    });

    return profile;
  }

  async updateCourierProfile(userId: string, data: Partial<NewCourierProfile>) {
    const profile = await this.courierRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }

    const updatedProfile = await this.courierRepository.updateCourierProfile(
      profile.id,
      data,
    );
    return updatedProfile;
  }

  async updateLocation(userId: string, latitude: string, longitude: string) {
    const profile = await this.courierRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }

    const updatedProfile = await this.courierRepository.updateLocation(
      userId,
      latitude,
      longitude,
    );
    return updatedProfile;
  }

  async toggleOnlineStatus(userId: string, isOnline: boolean) {
    const profile = await this.courierRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }

    const updatedProfile = await this.courierRepository.toggleOnlineStatus(
      userId,
      isOnline,
    );
    return updatedProfile;
  }

  async getAvailableOrders(limit = 20) {
    return await this.orderRepository.findAvailableForCourier(limit);
  }

  async acceptDelivery(orderId: string, courierId: string) {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Check if order is available for pickup (pending)
    if (order.status !== "pending") {
      throw new BusinessError("Order is not available for acceptance");
    }

    // Check if order is already assigned
    if (order.courierId) {
      throw new BusinessError("Order is already assigned to another courier");
    }

    // Check if courier profile exists and is online
    const profile = await this.courierRepository.findByUserId(courierId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }

    if (!profile.isOnline) {
      throw new BusinessError("You must be online to accept deliveries");
    }

    // Assign courier to order and set status to confirmed (Waiting Merchant)
    // We transactionally update both courierId and status
    const updatedOrder = await this.orderRepository.updateOrderStatus(
      orderId,
      "confirmed",
      { courierId },
    );
    return updatedOrder;
  }

  async getCourierOrders(
    courierId: string,
    page = 1,
    limit = 20,
    statuses?: string[],
  ) {
    const offset = (page - 1) * limit;
    const orders = await this.orderRepository.findByCourierId(
      courierId,
      limit,
      offset,
      statuses as import("../db/schema/orders.schema.js").OrderStatus[],
    );

    // Get total count for pagination
    const total = await this.orderRepository.countByCourierId(
      courierId,
      statuses as import("../db/schema/orders.schema.js").OrderStatus[],
    );

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markPickedUp(orderId: string, courierId: string) {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.courierId !== courierId) {
      throw new ForbiddenError("This order is not assigned to you");
    }

    if (order.status !== "ready_for_pickup") {
      throw new BusinessError("Order cannot be marked as picked up");
    }

    const updatedOrder = await this.orderRepository.updateOrderStatus(
      orderId,
      "picked_up",
    );
    return updatedOrder;
  }

  async markOnDelivery(orderId: string, courierId: string) {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.courierId !== courierId) {
      throw new ForbiddenError("This order is not assigned to you");
    }

    if (order.status !== "picked_up") {
      throw new BusinessError("Order must be picked up first");
    }

    const updatedOrder = await this.orderRepository.updateOrderStatus(
      orderId,
      "on_delivery",
    );
    return updatedOrder;
  }

  async markDelivered(orderId: string, courierId: string) {
    const order = await this.orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.courierId !== courierId) {
      throw new ForbiddenError("This order is not assigned to you");
    }

    if (order.status !== "on_delivery") {
      throw new BusinessError("Order must be on delivery first");
    }

    // Auto-update payment status to "paid" for COD orders
    const additionalData: { paymentStatus: PaymentStatus } = {
      paymentStatus: "pending",
    };
    if (order.paymentMethod === "cash") {
      additionalData.paymentStatus = "paid";
    }

    const updatedOrder = await this.orderRepository.updateOrderStatus(
      orderId,
      "delivered",
      additionalData,
    );

    // Increment courier's total deliveries
    await this.courierRepository.incrementDeliveries(courierId);

    return updatedOrder;
  }

  async getCourierDashboardStats(userId: string) {
    const profile = await this.courierRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Courier profile");
    }

    const earnings = await this.orderRepository.getCourierEarnings(userId);

    return {
      ...earnings,
      rating: Number(profile.rating || 0),
      totalDeliveriesProfile: profile.totalDeliveries || 0,
    };
  }
}

import { courierRepository } from "../repositories/courier.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import type { PaymentStatus } from "../db/schema/index.js";
export const courierService = new CourierService(
  courierRepository,
  orderRepository,
  userRepository,
);
