import { relations } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';
import { users } from './users.schema';

// Enums
export const complaintCategoryEnum = pgEnum('complaint_category', [
  'order_not_received',
  'wrong_order',
  'merchant_fraud',
  'courier_issue',
  'payment_problem',
  'quality_issue',
  'other',
]);

export const complaintStatusEnum = pgEnum('complaint_status', [
  'pending',
  'in_review',
  'resolved',
  'closed',
]);

export type ComplaintStatus = 'pending' | 'in_review' | 'resolved' | 'closed';

// Complaints Table
export const complaints = pgTable('complaints', {
  id: uuid('id').defaultRandom().primaryKey(),
  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: complaintCategoryEnum('category').notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  orderId: uuid('order_id').references(() => orders.id, {
    onDelete: 'set null',
  }),
  status: complaintStatusEnum('status').default('pending').notNull(),
  assignedAdminId: uuid('assigned_admin_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  adminNotes: text('admin_notes'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
});

export const complaintMessages = pgTable('complaint_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  complaintId: uuid('complaint_id')
    .notNull()
    .references(() => complaints.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const complaintsRelations = relations(complaints, ({ one, many }) => ({
  reporter: one(users, {
    fields: [complaints.reporterId],
    references: [users.id],
    relationName: 'complaint_reporter',
  }),
  assignedAdmin: one(users, {
    fields: [complaints.assignedAdminId],
    references: [users.id],
    relationName: 'complaint_admin',
  }),
  order: one(orders, {
    fields: [complaints.orderId],
    references: [orders.id],
  }),
  messages: many(complaintMessages),
}));

export const complaintMessagesRelations = relations(
  complaintMessages,
  ({ one }) => ({
    complaint: one(complaints, {
      fields: [complaintMessages.complaintId],
      references: [complaints.id],
    }),
    sender: one(users, {
      fields: [complaintMessages.senderId],
      references: [users.id],
    }),
  }),
);

// Type exports
export type Complaints = typeof complaints.$inferSelect;
export type NewComplaints = typeof complaints.$inferInsert;
export type ComplaintMessages = typeof complaintMessages.$inferSelect;
export type NewComplaintMessages = typeof complaintMessages.$inferInsert;
