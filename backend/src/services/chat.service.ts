import type { Response } from "express";
import type { User } from "../db/schema/index.js";
import type {
  ChatMessage,
  ChatRoom,
  ChatRoomType,
  ChatSenderRole,
} from "../db/schema/chats.schema.js";
import {
  chatMessageRepository,
  chatRoomRepository,
} from "../repositories/chat.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { AppError } from "../utils/error.util.js";

// Simple SSE connection manager
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class ChatSSEManager {
  private static clients: Map<string, Response> = new Map();

  static addClient(userId: string, res: Response) {
    ChatSSEManager.clients.set(userId, res);

    // Send initial connection success message
    res.write("event: connected\n");
    res.write(
      `data: ${JSON.stringify({ message: "Connected to chat stream" })}\n\n`,
    );
  }

  static removeClient(userId: string) {
    ChatSSEManager.clients.delete(userId);
  }

  static emitToUser(
    userId: string,
    event: string,
    data: ChatMessage & { sender: Partial<User> },
  ) {
    const client = ChatSSEManager.clients.get(userId);
    if (client) {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}

export class ChatService {
  /**
   * Initialize a chat room or return existing one
   */
  async startOrGetRoom(
    orderId: string,
    type: ChatRoomType,
    requestingUserId: string,
  ): Promise<{
    room: ChatRoom;
    participants: { id: string; role: string }[];
  }> {
    // 1. Verify existence of the order
    const order = await orderRepository.findByIdWithDetails(orderId);

    if (!order) throw new AppError(404, "Order not found");

    // 2. Authorization check
    const isCustomer = order.customerId === requestingUserId;
    const isCourier = order.courierId === requestingUserId;
    const isMerchant = order.merchant?.userId === requestingUserId;

    if (!isCustomer && !isCourier && !isMerchant) {
      throw new AppError(403, "Unauthorized access to this order chat");
    }

    // 3. Find existing room
    let room = await chatRoomRepository.findRoomByOrderAndType(orderId, type);

    // 4. If not exists, create it
    if (!room) {
      const createdRoom = await chatRoomRepository.createRoom({
        orderId,
        type,
      });
      if (!createdRoom) throw new AppError(500, "Failed to create room");
      room = createdRoom;
    }

    // Prepare participants list
    const participants = this.resolveRoomParticipants(order, type);

    return {
      room,
      participants,
    };
  }

  /**
   * Helper to figure out who the two participants are based on order and type.
   */
  resolveRoomParticipants(
    order: {
      customerId: string;
      merchant: { userId: string } | null;
      courierId: string | null;
    },
    type: ChatRoomType,
  ) {
    const participants: { id: string; role: string }[] = [];
    if (type === "customer_merchant") {
      participants.push({ id: order.customerId, role: "customer" });
      if (order.merchant?.userId)
        participants.push({ id: order.merchant.userId, role: "merchant" });
    } else if (type === "customer_courier") {
      participants.push({ id: order.customerId, role: "customer" });
      if (order.courierId)
        participants.push({ id: order.courierId, role: "courier" });
    } else if (type === "merchant_courier") {
      if (order.merchant?.userId)
        participants.push({ id: order.merchant.userId, role: "merchant" });
      if (order.courierId)
        participants.push({ id: order.courierId, role: "courier" });
    }
    return participants;
  }

  /**
   * Get messages for a given room
   */
  async getRoomMessages(
    roomId: string,
    requestingUserId: string,
    page = 1,
    limit = 50,
  ) {
    // 1. Validate room & access
    const room = await chatRoomRepository.findRoomWithOrderDetails(roomId);

    if (!room || !room.order) throw new AppError(404, "Room not found");

    const order = room.order as {
      customerId: string;
      merchant: { userId: string } | null;
      courierId: string | null;
    };
    const isCustomer = order.customerId === requestingUserId;
    const isCourier = order.courierId === requestingUserId;
    const isMerchant = order.merchant?.userId === requestingUserId;

    if (!isCustomer && !isCourier && !isMerchant) {
      throw new AppError(403, "Unauthorized access to this chat room");
    }

    // 2. Fetch paginated messages
    const skip = (page - 1) * limit;
    const messages = await chatMessageRepository.findMessagesByRoomId(
      roomId,
      limit,
      skip,
    );

    return messages.reverse(); // Newest to oldest array inversion for standard UI mapping
  }

  /**
   * Save and dispatch new message
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    senderRole: ChatSenderRole,
    content: string,
    messageType: "text" | "image" = "text",
    imageUrl?: string,
  ) {
    // 1. Validate room & access
    const room = await chatRoomRepository.findRoomWithOrderDetails(roomId);

    if (!room || !room.order) throw new AppError(404, "Room not found");
    if (room.isArchived)
      throw new AppError(400, "Cannot send message to archived chat");

    const order = room.order as {
      customerId: string;
      merchant: { userId: string } | null;
      courierId: string | null;
    };
    const isCustomer = order.customerId === senderId;
    const isCourier = order.courierId === senderId;
    const isMerchant = order.merchant?.userId === senderId;

    if (!isCustomer && !isCourier && !isMerchant) {
      throw new AppError(403, "Unauthorized to send message in this room");
    }

    // 2. Store message
    const newMessage = await chatMessageRepository.createMessage({
      roomId,
      senderId,
      senderRole,
      content,
      messageType,
      imageUrl,
    });

    if (!newMessage) throw new AppError(500, "Failed to create message");

    // Re-fetch message with sender info to emit full object
    const createdMessage = await chatMessageRepository.findMessageWithSender(
      newMessage.id,
    );

    if (!createdMessage)
      throw new AppError(500, "Failed to fetch created message details");

    // 3. Emit SSE to participants
    const participants = this.resolveRoomParticipants(order, room.type);
    for (const p of participants) {
      ChatSSEManager.emitToUser(p.id, "new_message", createdMessage);
    }

    return createdMessage;
  }

  /**
   * Find active rooms for a user
   */
  async getUserActiveRooms(userId: string) {
    const userRooms = await chatRoomRepository.findUserActiveRooms();

    // Filter for rooms where user is participant.
    const activeRooms = userRooms.filter((r) => {
      const parts = this.resolveRoomParticipants(
        r.order,
        r.type as ChatRoomType,
      );
      return parts.some((p) => p.id === userId);
    });

    return activeRooms;
  }
}
