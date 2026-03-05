import { nanoid } from "nanoid";
import { ORDER_STATUS_TRANSITIONS } from "../constants/index.js";
import { db } from "../db/index.js";
import type { NewOrder, OrderStatus } from "../db/schema/orders.schema.js";
import {
  BusinessError,
  ForbiddenError,
  NotFoundError,
} from "../utils/error.util.js";

interface CreateOrderDTO {
  merchantId: string;
  deliveryAddress?: string;
  deliveryAddressId?: string;
  latitude?: number;
  longitude?: number;
  paymentMethod: "cash" | "digital_wallet" | "bank_transfer";
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
  deliveryNotes?: string;
}

export class OrderService {
  constructor(
    private readonly orderRepository: typeof import("../repositories/order.repository.js").orderRepository,
    private readonly addressRepository: typeof import("../repositories/address.repository.js").addressRepository,
    private readonly merchantRepository: typeof import("../repositories/merchant.repository.js").merchantRepository,
    private readonly menuRepository: typeof import("../repositories/menu.repository.js").menuRepository,
  ) {}

  async createOrder(customerId: string, data: CreateOrderDTO) {
    // Validate merchant exists and is open
    const merchant = await this.merchantRepository.findById(data.merchantId);
    if (!merchant) {
      throw new NotFoundError("Merchant");
    }

    if (!merchant.isOpen) {
      throw new BusinessError("Merchant is currently closed");
    }

    // Validate or create delivery address
    let deliveryAddressId = data.deliveryAddressId;

    if (deliveryAddressId) {
      const address = await this.addressRepository.findByIdAndUserId(
        deliveryAddressId,
        customerId,
      );
      if (!address) {
        throw new NotFoundError("Delivery address");
      }
    } else if (data.deliveryAddress) {
      // Create a new address from the string
      // We fill missing fields with defaults since frontend doesn't provide them yet
      const newAddress = await this.addressRepository.createAddress({
        userId: customerId,
        label: "Delivery Address",
        addressLine: data.deliveryAddress,
        city: "Unknown", // Default
        postalCode: "00000", // Default
        latitude: data.latitude?.toString() || "0",
        longitude: data.longitude?.toString() || "0",
        notes: data.deliveryNotes,
        isDefault: false,
      });
      if (!newAddress) {
        throw new Error("Failed to create delivery address");
      }
      deliveryAddressId = newAddress.id;
    } else {
      throw new BusinessError("Delivery address is required");
    }

    // Validate and fetch menu items
    const menuItemIds = data.items.map((item) => item.menuItemId);
    const menuItems = await this.menuRepository.findByIds(menuItemIds);

    if (menuItems.length !== menuItemIds.length) {
      throw new NotFoundError("One or more menu items");
    }

    // Verify all items belong to the merchant and are available
    for (const item of menuItems) {
      if (item.merchantId !== data.merchantId) {
        throw new BusinessError("All items must belong to the same merchant");
      }
      if (!item.isAvailable) {
        throw new BusinessError(`${item.name} is not available`);
      }
    }

    // Calculate prices
    let subtotal = 0;
    const orderItems = data.items.map((orderItem) => {
      const menuItem = menuItems.find((mi) => mi.id === orderItem.menuItemId);
      if (!menuItem) {
        throw new BusinessError(`Menu item not found`);
      }

      const price = Number(menuItem.price);
      subtotal += price * orderItem.quantity;

      return {
        orderId: nanoid(),
        menuItemId: orderItem.menuItemId,
        quantity: orderItem.quantity,
        price: menuItem.price,
        notes: orderItem.notes,
      };
    });

    const deliveryFee = Number(merchant.deliveryFee);
    const serviceFee = subtotal * 0.05; // 5% service fee
    const totalAmount = subtotal + deliveryFee + serviceFee;

    // Check minimum order
    // if (subtotal < Number(merchant.minOrder)) {
    //   throw new BusinessError(`Minimum order amount is ${merchant.minOrder}`);
    // }

    // Generate order number
    const orderNumber = `ORD-${nanoid(10).toUpperCase()}`;

    // Create order with transaction
    const order = await db.transaction(async (tx) => {
      // Decrement stock for each item
      for (const item of orderItems) {
        const success = await this.menuRepository.decrementStock(
          item.menuItemId,
          item.quantity,
          tx,
        );
        if (!success) {
          const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
          throw new BusinessError(
            `Insufficient stock for ${menuItem?.name || "item"}`,
          );
        }
      }

      const orderData: NewOrder = {
        orderNumber,
        customerId,
        merchantId: data.merchantId,
        deliveryAddressId: deliveryAddressId!,
        deliveryNotes: data.deliveryNotes ?? null,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "pending",
        paymentMethod: data.paymentMethod,
        paymentStatus: "pending",
      };

      return await this.orderRepository.createOrderWithItems(
        orderData,
        orderItems,
        tx,
      );
    });
    if (!order) {
      throw new Error("Failed to create order");
    }

    // Return order with details
    return await this.orderRepository.findByIdWithDetails(order.id);
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Verify access rights
    const hasAccess =
      order.customerId === userId ||
      (userRole === "merchant" && order.merchant?.userId === userId) ||
      (userRole === "courier" && order.courierId === userId);

    if (!hasAccess) {
      throw new ForbiddenError("You don't have access to this order");
    }

    return order;
  }

  async getCustomerOrders(customerId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const orders = await this.orderRepository.findByCustomerId(
      customerId,
      limit,
      offset,
    );
    const total = await this.orderRepository.countOrdersByCustomer(customerId);

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

  async getMerchantOrders(
    userId: string,
    page = 1,
    limit = 20,
    statuses?: string[],
  ) {
    const merchant = await this.merchantRepository.findByUserId(userId);
    if (!merchant) {
      throw new NotFoundError("Merchant profile");
    }

    const offset = (page - 1) * limit;
    console.time("DB query orders.getMerchantOrders");
    const orders = await this.orderRepository.findByMerchantId(
      merchant.id,
      limit,
      offset,
      statuses as import("../db/schema/orders.schema.js").OrderStatus[],
    );
    console.timeEnd("DB query orders.getMerchantOrders");
    const total = await this.orderRepository.countOrdersByMerchant(
      merchant.id,
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

  async cancelOrder(orderId: string, customerId: string, reason?: string) {
    const order = await orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Verify ownership
    if (order.customerId !== customerId) {
      throw new ForbiddenError("You can only cancel your own orders");
    }

    // Check if order can be cancelled
    if (!["pending", "confirmed"].includes(order.status)) {
      throw new BusinessError("Order cannot be cancelled at this stage");
    }

    const updatedOrder = await orderRepository.updateOrderStatus(
      orderId,
      "cancelled",
      { cancellationReason: reason },
    );

    return updatedOrder;
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string,
    userRole: string,
  ) {
    const order = await orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Verify authorization
    if (userRole === "merchant" && order.merchant?.userId !== userId) {
      throw new ForbiddenError("You can only update your own merchant orders");
    }

    if (userRole === "courier" && order.courierId !== userId) {
      throw new ForbiddenError("You can only update your assigned orders");
    }

    // Validate status transition
    const validTransitions =
      ORDER_STATUS_TRANSITIONS[order.status as OrderStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BusinessError(
        `Cannot transition from ${order.status} to ${newStatus}`,
      );
    }

    // Auto-update payment status for COD orders when delivered
    const additionalData: any = {};
    if (
      newStatus === "delivered" &&
      order.paymentMethod === "cash" &&
      order.paymentStatus !== "paid"
    ) {
      additionalData.paymentStatus = "paid";
    }

    const updatedOrder = await orderRepository.updateOrderStatus(
      orderId,
      newStatus,
      additionalData,
    );

    return updatedOrder;
  }

  async customerConfirmDelivery(orderId: string, customerId: string) {
    const order = await orderRepository.findByIdWithDetails(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Verify ownership
    if (order.customerId !== customerId) {
      throw new ForbiddenError("You can only confirm your own orders");
    }

    // Only allow confirmation if order is marked as delivered by courier
    if (order.status !== "delivered") {
      throw new BusinessError("Order must be delivered by courier first");
    }

    // Auto-update payment status to "paid" for COD orders
    const additionalData: any = {};
    if (order.paymentMethod === "cash" && order.paymentStatus !== "paid") {
      additionalData.paymentStatus = "paid";
    }

    // Update order (even if no payment update, this confirms customer received it)
    const updatedOrder = await orderRepository.updateOrderStatus(
      orderId,
      "delivered",
      additionalData,
    );

    return updatedOrder;
  }

  async autoConfirmOldDeliveries() {
    // Find orders that have been "delivered" for more than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const oldDeliveries =
      await this.orderRepository.findOldDeliveredOrders(threeDaysAgo);

    let updatedCount = 0;
    for (const order of oldDeliveries) {
      // Auto-update payment status to "paid" for COD orders
      if (order.paymentMethod === "cash" && order.paymentStatus !== "paid") {
        await this.orderRepository.updateOrderStatus(order.id, "delivered", {
          paymentStatus: "paid",
        });
        updatedCount++;
      }
    }

    return { updatedCount, message: `Auto-confirmed ${updatedCount} orders` };
  }
}

import { addressRepository } from "../repositories/address.repository.js";
import { menuRepository } from "../repositories/menu.repository.js";
import { merchantRepository } from "../repositories/merchant.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
export const orderService = new OrderService(
  orderRepository,
  addressRepository,
  merchantRepository,
  menuRepository,
);
