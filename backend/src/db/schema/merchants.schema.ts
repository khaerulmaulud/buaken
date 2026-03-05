import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Merchants table
export const merchants = pgTable(
  'merchants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    storeName: varchar('store_name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    logoUrl: varchar('logo_url', { length: 500 }),
    bannerUrl: varchar('banner_url', { length: 500 }),
    addressLine: text('address_line').notNull(),
    latitude: varchar('latitude', { length: 50 }).notNull(),
    longitude: varchar('longitude', { length: 50 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    isOpen: boolean('is_open').default(true).notNull(),
    rating: decimal('rating', { precision: 3, scale: 2 })
      .default('0')
      .notNull(),
    totalReviews: integer('total_reviews').default(0).notNull(),
    openingTime: time('opening_time').notNull(),
    closingTime: time('closing_time').notNull(),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).notNull(),
    minOrder: decimal('min_order', { precision: 10, scale: 2 }).notNull(),
    estimatedDeliveryTime: integer('estimated_delivery_time').notNull(), // in minutes
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: index('merchants_user_id_idx').on(table.userId),
      cityIdx: index('merchants_city_idx').on(table.city),
      isOpenIdx: index('merchants_is_open_idx').on(table.isOpen),
    };
  },
);

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  iconUrl: varchar('icon_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    merchantId: uuid('merchant_id')
      .notNull()
      .references(() => merchants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    isAvailable: boolean('is_available').default(true).notNull(),
    stock: integer('stock'),
    preparationTime: integer('preparation_time').notNull(), // in minutes
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      merchantIdx: index('menu_items_merchant_id_idx').on(table.merchantId),
      categoryIdx: index('menu_items_category_id_idx').on(table.categoryId),
      nameIdx: index('menu_items_name_idx').on(table.name),
    };
  },
);

// Relations
export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  menuItems: many(menuItems),
  orders: many(orders),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [menuItems.merchantId],
    references: [merchants.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

// Import types for other tables
import { orderItems, orders } from './orders.schema';
import { reviews } from './reviews.schema';

// Type exports
export type Merchant = typeof merchants.$inferSelect;
export type NewMerchant = typeof merchants.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
