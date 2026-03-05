import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  type ChatRoomType,
  chatMessages,
  chatRooms,
  type NewChatMessage,
  type NewChatRoom,
} from '../db/schema/chats.schema.js';
import { BaseRepository } from './base.repository.js';

export class ChatRoomRepository extends BaseRepository<typeof chatRooms> {
  constructor() {
    super(chatRooms);
  }

  async findRoomByOrderAndType(orderId: string, type: ChatRoomType) {
    return await db.query.chatRooms.findFirst({
      where: and(eq(chatRooms.orderId, orderId), eq(chatRooms.type, type)),
    });
  }

  async findRoomWithOrderDetails(roomId: string) {
    return await db.query.chatRooms.findFirst({
      where: eq(chatRooms.id, roomId),
      with: {
        order: {
          with: { merchant: true },
        },
      },
    });
  }

  async findUserActiveRooms() {
    return await db.query.chatRooms.findMany({
      where: eq(chatRooms.isArchived, false),
      with: {
        order: {
          with: { merchant: true },
        },
      },
    });
  }

  async createRoom(data: NewChatRoom) {
    const result = await db.insert(chatRooms).values(data).returning();
    return result[0];
  }
}

export class ChatMessageRepository extends BaseRepository<typeof chatMessages> {
  constructor() {
    super(chatMessages);
  }

  async findMessagesByRoomId(roomId: string, limit: number, skip: number) {
    return await db.query.chatMessages.findMany({
      where: eq(chatMessages.roomId, roomId),
      orderBy: desc(chatMessages.createdAt),
      limit,
      offset: skip,
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findMessageWithSender(messageId: string) {
    return await db.query.chatMessages.findFirst({
      where: eq(chatMessages.id, messageId),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createMessage(data: NewChatMessage) {
    const result = await db.insert(chatMessages).values(data).returning();
    return result[0];
  }
}

export const chatRoomRepository = new ChatRoomRepository();
export const chatMessageRepository = new ChatMessageRepository();
