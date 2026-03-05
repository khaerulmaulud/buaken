import { api } from "../lib/axios";

export interface ChatRoom {
  id: string;
  orderId: string;
  type: "customer_merchant" | "customer_courier" | "merchant_courier";
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: "customer" | "merchant" | "courier" | "system";
  content: string;
  messageType: "text" | "image";
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string; // User might have avatar or profilePic
  };
}

export const chatService = {
  /**
   * Start or get an existing chat room for an order
   */
  startRoom: async (orderId: string, type: string) => {
    const { data } = await api.post<{
      data: { room: ChatRoom; participants: { id: string; role: string }[] };
    }>("/chat/start", { orderId, type });
    return data.data;
  },

  /**
   * Get all active rooms for the current user
   */
  getUserRooms: async () => {
    const { data } = await api.get<{ data: { rooms: ChatRoom[] } }>(
      "/chat/rooms",
    );
    return data.data.rooms;
  },

  /**
   * Get messages for a specific room
   */
  getMessages: async (roomId: string, page = 1, limit = 50) => {
    const { data } = await api.get<{ data: { messages: ChatMessage[] } }>(
      `/chat/${roomId}/messages`,
      {
        params: { page, limit },
      },
    );
    return data.data.messages;
  },

  /**
   * Send a text message
   */
  sendTextMessage: async (roomId: string, content: string) => {
    const { data } = await api.post<{ data: { message: ChatMessage } }>(
      `/chat/${roomId}/send`,
      { content },
    );
    return data.data.message;
  },

  /**
   * Send an image message
   */
  sendImageMessage: async (roomId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const { data } = await api.post<{ data: { message: ChatMessage } }>(
      `/chat/${roomId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return data.data.message;
  },
};
