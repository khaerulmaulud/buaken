import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db } from '../db/index.js';
import {
  type NewOrder,
  type NewOrderItem,
  type OrderStatus,
  orderItems,
  orders,
} from '../db/schema/orders.schema.js';
import { BaseRepository } from './base.repository.js';

class OrderRepository extends BaseRepository<typeof orders> {
  constructor() {
    super(orders);
  }

  async findByIdWithDetails(id: string) {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
        merchant: true,
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        courier: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        deliveryAddress: true,
      },
    });
  }

  async findByCustomerId(customerId: string, limit = 20, offset = 0) {
    return await db.query.orders.findMany({
      where: eq(orders.customerId, customerId),
      with: {
        merchant: {
          columns: {
            id: true,
            storeName: true,
            logoUrl: true,
          },
        },
        orderItems: {
          with: {
            menuItem: {
              columns: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(orders.createdAt)],
    });
  }

  async findByMerchantId(
    merchantId: string,
    limit = 20,
    offset = 0,
    statuses?: OrderStatus[],
  ) {
    return await db.query.orders.findMany({
      where:
        statuses && statuses.length > 0
          ? and(
              eq(orders.merchantId, merchantId),
              inArray(orders.status, statuses),
            )
          : eq(orders.merchantId, merchantId),
      with: {
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        deliveryAddress: true,
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(orders.createdAt)],
    });
  }

  async findByCourierId(
    courierId: string,
    limit = 20,
    offset = 0,
    statuses?: OrderStatus[],
  ) {
    return await db.query.orders.findMany({
      where:
        statuses && statuses.length > 0
          ? and(
              eq(orders.courierId, courierId),
              inArray(orders.status, statuses),
            )
          : eq(orders.courierId, courierId),
      with: {
        merchant: true,
        customer: {
          columns: {
            id: true,
            name: true,
            phone: true,
          },
        },
        deliveryAddress: true,
      },
      limit,
      offset,
      orderBy: [desc(orders.createdAt)],
    });
  }

  async findAvailableForCourier(limit = 20) {
    return await db.query.orders.findMany({
      where: and(
        eq(orders.status, 'pending'),
        sql`${orders.courierId} IS NULL`,
      ),
      with: {
        merchant: {
          columns: {
            id: true,
            storeName: true,
            addressLine: true,
            latitude: true,
            longitude: true,
          },
        },
        deliveryAddress: true,
      },
      limit,
      orderBy: [desc(orders.createdAt)],
    });
  }

  async createOrder(data: NewOrder) {
    const result = await db.insert(orders).values(data).returning();
    return result[0];
  }

  async createOrderWithItems(
    orderData: NewOrder,
    items: NewOrderItem[],
    tx?: PgTransaction<
      PostgresJsQueryResultHKT,
      typeof import('../db/schema/index.js'),
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      any
    >,
  ) {
    const dbInstance = tx || db;

    // Create order
    const [order] = await dbInstance
      .insert(orders)
      .values(orderData)
      .returning();

    // Create order items
    const orderItemsData: Array<NewOrderItem> = items.map((item) => ({
      ...item,
      orderId: order?.id as string,
    }));

    await dbInstance.insert(orderItems).values(orderItemsData);

    return order;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    additionalData?: Partial<NewOrder>,
  ) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const updateData: any = {
      status,
      ...additionalData,
    };

    // Set timestamp based on status
    if (status === 'confirmed') updateData.confirmedAt = new Date();
    if (status === 'picked_up') updateData.pickedUpAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();
    if (status === 'cancelled') updateData.cancelledAt = new Date();

    const result = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return result[0] || null;
  }

  async assignCourier(orderId: string, courierId: string) {
    const result = await db
      .update(orders)
      .set({ courierId })
      .where(eq(orders.id, orderId))
      .returning();
    return result[0] || null;
  }

  async countOrdersByCustomer(customerId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.customerId, customerId));

    return Number(result[0]?.count || 0);
  }

  async countOrdersByMerchant(merchantId: string, statuses?: OrderStatus[]) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        statuses && statuses.length > 0
          ? and(
              eq(orders.merchantId, merchantId),
              inArray(orders.status, statuses),
            )
          : eq(orders.merchantId, merchantId),
      );

    return Number(result[0]?.count || 0);
  }

  async countByCourierId(courierId: string, statuses?: OrderStatus[]) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        statuses && statuses.length > 0
          ? and(
              eq(orders.courierId, courierId),
              inArray(orders.status, statuses),
            )
          : eq(orders.courierId, courierId),
      );

    return Number(result[0]?.count || 0);
  }

  async findOldDeliveredOrders(beforeDate: Date) {
    return await db.query.orders.findMany({
      where: and(
        eq(orders.status, 'delivered'),
        sql`${orders.deliveredAt} < ${beforeDate.toISOString()}`,
        eq(orders.paymentStatus, 'pending'),
      ),
      with: {
        merchant: true,
        customer: true,
      },
      limit: 100, // Process in batches
    });
  }

  async getMerchantEarnings(merchantId: string) {
    const completedStatuses: OrderStatus[] = ['delivered'];

    // Total earnings (all time)
    const totalResult = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${orders.subtotal}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          inArray(orders.status, completedStatuses),
        ),
      );

    // Today's earnings
    const todayResult = await db
      .select({
        todayRevenue: sql<string>`COALESCE(SUM(${orders.subtotal}::numeric), 0)`,
        todayOrders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          inArray(orders.status, completedStatuses),
          sql`DATE(${orders.createdAt}) = CURRENT_DATE`,
        ),
      );

    // Active orders (non-terminal statuses)
    const activeStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'on_delivery',
    ];
    const activeResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.merchantId, merchantId),
          inArray(orders.status, activeStatuses),
        ),
      );

    return {
      totalRevenue: Number(totalResult[0]?.totalRevenue || 0),
      totalOrders: Number(totalResult[0]?.totalOrders || 0),
      todayRevenue: Number(todayResult[0]?.todayRevenue || 0),
      todayOrders: Number(todayResult[0]?.todayOrders || 0),
      activeOrders: Number(activeResult[0]?.count || 0),
    };
  }

  async getCourierEarnings(courierId: string) {
    const completedStatuses: OrderStatus[] = ['delivered'];

    // Total earnings (delivery fee)
    const totalResult = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(${orders.deliveryFee}::numeric), 0)`,
        totalDeliveries: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.courierId, courierId),
          inArray(orders.status, completedStatuses),
        ),
      );

    // Today's earnings
    const todayResult = await db
      .select({
        todayEarnings: sql<string>`COALESCE(SUM(${orders.deliveryFee}::numeric), 0)`,
        todayDeliveries: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.courierId, courierId),
          inArray(orders.status, completedStatuses),
          sql`DATE(${orders.createdAt}) = CURRENT_DATE`,
        ),
      );

    // Active deliveries
    const activeStatuses: OrderStatus[] = ['picked_up', 'on_delivery'];
    const activeResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.courierId, courierId),
          inArray(orders.status, activeStatuses),
        ),
      );

    return {
      totalEarnings: Number(totalResult[0]?.totalEarnings || 0),
      totalDeliveries: Number(totalResult[0]?.totalDeliveries || 0),
      todayEarnings: Number(todayResult[0]?.todayEarnings || 0),
      todayDeliveries: Number(todayResult[0]?.todayDeliveries || 0),
      activeDeliveries: Number(activeResult[0]?.count || 0),
    };
  }

  async countMenuItemsByMerchant(merchantId: string) {
    const { menuItems: menuItemsTable } = await import(
      '../db/schema/merchants.schema.js'
    );
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.merchantId, merchantId));

    return Number(result[0]?.count || 0);
  }
}

export const orderRepository = new OrderRepository();
