import type { NextFunction, Request, Response } from 'express';
import type {
  ChatRoomType,
  ChatSenderRole,
} from '../db/schema/chats.schema.js';
import { ChatService, ChatSSEManager } from '../services/chat.service.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/error.util.js';
import { successResponse } from '../utils/response.util.js';

const chatService = new ChatService();

/**
 * Connect to SSE Stream
 * GET /api/chat/stream
 */
export const connectToChatStream = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new AppError(401, 'Unauthorized'));

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Keep connection open
    res.flushHeaders();

    ChatSSEManager.addClient(userId, res);

    // Provide cleanup mechanism on abort
    req.on('close', () => {
      ChatSSEManager.removeClient(userId);
    });
  },
);

/**
 * Start or Get Chat Room
 * POST /api/chat/start
 */
export const startChatRoom = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { orderId, type } = req.body;
    const userId = req.user?.id;

    if (!userId) return next(new AppError(401, 'Unauthorized'));
    if (!orderId || !type) return next(new AppError(400, 'Missing parameters'));

    const result = await chatService.startOrGetRoom(
      orderId,
      type as ChatRoomType,
      userId,
    );

    return successResponse(
      res,
      { room: result.room, participants: result.participants },
      'Chat room started',
      201,
    );
  },
);

/**
 * Get Message History
 * GET /api/chat/:roomId/messages
 */
export const getMessages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const userId = req.user?.id;
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Number.parseInt(req.query.limit as string, 10) || 50;

    if (!userId) return next(new AppError(401, 'Unauthorized'));
    if (!roomId) return next(new AppError(400, 'Room ID is required'));
    const messages = await chatService.getRoomMessages(
      roomId,
      userId,
      page,
      limit,
    );

    return successResponse(res, { messages }, 'Messages retrieved', 200);
  },
);

/**
 * Send Message (Text)
 * POST /api/chat/:roomId/send
 */
export const sendTextMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const { content } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userId || !userRole) return next(new AppError(401, 'Unauthorized'));
    if (!content) return next(new AppError(400, 'Message content required'));
    if (!roomId) return next(new AppError(400, 'Room ID is required'));
    const message = await chatService.sendMessage(
      roomId,
      userId,
      userRole as ChatSenderRole,
      content,
      'text',
    );

    return successResponse(res, { message }, 'Message sent', 201);
  },
);

/**
 * Get Active Rooms for User
 * GET /api/chat/rooms
 */
export const getUserRooms = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) return next(new AppError(401, 'Unauthorized'));

    const rooms = await chatService.getUserActiveRooms(userId);
    return successResponse(res, { rooms }, 'Rooms retrieved', 200);
  },
);

/**
 * Send Message (Image)
 * POST /api/chat/:roomId/image
 * file: 'image'
 */
export const sendImageMessage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    if (!userId || !userRole) return next(new AppError(401, 'Unauthorized'));
    if (!req.file) return next(new AppError(400, 'Image file is required'));
    if (!roomId) return next(new AppError(400, 'Room ID is required'));
    // Import storage service inside the handler to prevent circular references at top layer
    const { storageService } = await import('../services/storage.service.js');
    const imageUrl = await storageService.uploadFile(req.file, 'chat');

    const message = await chatService.sendMessage(
      roomId,
      userId,
      userRole as ChatSenderRole,
      'Sent an image',
      'image',
      imageUrl,
    );

    return successResponse(res, { message }, 'Image message sent', 201);
  },
);
