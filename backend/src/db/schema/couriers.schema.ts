import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

// Vehicle type enum
export const vehicleTypeEnum = pgEnum('vehicle_type', [
  'motorcycle',
  'bicycle',
  'car',
]);

// Courier profiles table
export const courierProfiles = pgTable(
  'courier_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    vehicleType: vehicleTypeEnum('vehicle_type').notNull(),
    vehicleNumber: varchar('vehicle_number', { length: 50 }).notNull(),
    isOnline: boolean('is_online').default(false).notNull(),
    currentLatitude: varchar('current_latitude', { length: 50 }),
    currentLongitude: varchar('current_longitude', { length: 50 }),
    totalDeliveries: integer('total_deliveries').default(0).notNull(),
    rating: decimal('rating', { precision: 3, scale: 2 })
      .default('0')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: index('courier_profiles_user_id_idx').on(table.userId),
    };
  },
);

// Relations
export const courierProfilesRelations = relations(
  courierProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [courierProfiles.userId],
      references: [users.id],
    }),
  }),
);

// Type exports
export type CourierProfile = typeof courierProfiles.$inferSelect;
export type NewCourierProfile = typeof courierProfiles.$inferInsert;
export type VehicleType = (typeof vehicleTypeEnum.enumValues)[number];
