import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders.schema';
import { users } from './users.schema';

// Chat room type enum
export const chatRoomTypeEnum = pgEnum('chat_room_type', [
  'customer_merchant',
  'customer_courier',
  'merchant_courier',
]);

// Chat message type enum
export const chatMessageTypeEnum = pgEnum('chat_message_type', [
  'text',
  'image',
]);

// Chat sender role enum
export const chatSenderRoleEnum = pgEnum('chat_sender_role', [
  'customer',
  'merchant',
  'courier',
  'system',
]);

// Chat rooms table
export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    type: chatRoomTypeEnum('type').notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      orderIdx: index('chat_rooms_order_id_idx').on(table.orderId),
      typeIdx: index('chat_rooms_type_idx').on(table.type),
      statusIdx: index('chat_rooms_status_idx').on(table.isArchived),
      orderTypeUnique: index('chat_rooms_order_type_unique_idx').on(
        table.orderId,
        table.type,
      ), // Usually one room per type per order
    };
  },
);

// Chat messages table
export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.id, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderRole: chatSenderRoleEnum('sender_role').notNull(),
    content: text('content').notNull(),
    messageType: chatMessageTypeEnum('message_type').default('text').notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      roomIdx: index('chat_messages_room_id_idx').on(
        table.roomId,
        table.createdAt.desc(),
      ),
      senderIdx: index('chat_messages_sender_id_idx').on(table.senderId),
      readStatusIdx: index('chat_messages_is_read_idx').on(table.isRead),
    };
  },
);

// Relations
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  order: one(orders, {
    fields: [chatRooms.orderId],
    references: [orders.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

// Type exports
export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type ChatRoomType = (typeof chatRoomTypeEnum.enumValues)[number];
export type ChatMessageType = (typeof chatMessageTypeEnum.enumValues)[number];
export type ChatSenderRole = (typeof chatSenderRoleEnum.enumValues)[number];
