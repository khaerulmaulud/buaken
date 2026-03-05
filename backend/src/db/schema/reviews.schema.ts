import { relations } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courierProfiles } from './couriers.schema';
import { menuItems, merchants } from './merchants.schema';
import { orders } from './orders.schema';
import { users } from './users.schema';

// Reviews table
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'cascade',
    }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    merchantId: uuid('merchant_id').references(() => merchants.id, {
      onDelete: 'cascade',
    }),
    courierId: uuid('courier_id').references(() => courierProfiles.id, {
      onDelete: 'cascade',
    }),
    menuItemId: uuid('menu_item_id').references(() => menuItems.id, {
      onDelete: 'cascade',
    }),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    imageUrl: text('image_url'),
    imageUrls: text('image_urls').array(), // Support multiple images
    merchantReply: text('merchant_reply'),
    repliedAt: timestamp('replied_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (_table) => ({
    // One review per order/menu item combination
    // Constraint removed to allow order-less reviews
  }),
);

// Relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  merchant: one(merchants, {
    fields: [reviews.merchantId],
    references: [merchants.id],
  }),
  courier: one(courierProfiles, {
    fields: [reviews.courierId],
    references: [courierProfiles.id],
  }),
  menuItem: one(menuItems, {
    fields: [reviews.menuItemId],
    references: [menuItems.id],
  }),
}));

// Type exports
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
