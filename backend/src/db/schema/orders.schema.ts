import { relations } from 'drizzle-orm';
import {
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { menuItems, merchants } from './merchants.schema';
import { userAddresses, users } from './users.schema';

// Order status enum
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'on_delivery',
  'delivered',
  'cancelled',
]);

// Payment method enum
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'digital_wallet',
  'bank_transfer',
]);

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'refunded',
]);

// Orders table
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'restrict' }),
    courierId: uuid('courier_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Address
    deliveryAddressId: uuid('delivery_address_id')
      .notNull()
      .references(() => userAddresses.id, { onDelete: 'restrict' }),
    deliveryNotes: text('delivery_notes'),

    // Pricing
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).notNull(),
    serviceFee: decimal('service_fee', { precision: 10, scale: 2 })
      .default('0')
      .notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),

    // Status
    status: orderStatusEnum('status').default('pending').notNull(),

    // Payment
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
      .default('pending')
      .notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
    pickedUpAt: timestamp('picked_up_at'),
    deliveredAt: timestamp('delivered_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancellationReason: text('cancellation_reason'),
  },
  (table) => {
    return {
      customerIdx: index('orders_customer_id_idx').on(
        table.customerId,
        table.createdAt.desc(),
      ),
      merchantIdx: index('orders_merchant_id_idx').on(
        table.merchantId,
        table.createdAt.desc(),
      ),
      courierIdx: index('orders_courier_id_idx').on(
        table.courierId,
        table.createdAt.desc(),
      ),
      statusIdx: index('orders_status_idx').on(table.status),
      merchantStatusIdx: index('orders_merchant_status_idx').on(
        table.merchantId,
        table.status,
      ),
      courierStatusIdx: index('orders_courier_status_idx').on(
        table.courierId,
        table.status,
      ),
    };
  },
);

// Order items table
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItems.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(), // Price at time of order
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      orderIdx: index('order_items_order_id_idx').on(table.orderId),
    };
  },
);

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
    relationName: 'customerOrders',
  }),
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  courier: one(users, {
    fields: [orders.courierId],
    references: [users.id],
    relationName: 'courierOrders',
  }),
  deliveryAddress: one(userAddresses, {
    fields: [orders.deliveryAddressId],
    references: [userAddresses.id],
  }),
  orderItems: many(orderItems),
  review: one(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

// Import types for other tables
import { reviews } from './reviews.schema';

// Type exports
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
