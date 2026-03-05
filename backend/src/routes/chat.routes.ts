import { Router } from "express";
import {
  connectToChatStream,
  getMessages,
  getUserRooms,
  sendImageMessage,
  sendTextMessage,
  startChatRoom,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js"; // Ensure existing multer config

const router: Router = Router();

// Protect all chat routes
router.use(authMiddleware);

// SSE connection directly
router.get("/stream", connectToChatStream);

// Core room interactions
router.get("/rooms", getUserRooms);
router.post("/start", startChatRoom);

// Messages in room
router.get("/:roomId/messages", getMessages);
router.post("/:roomId/send", sendTextMessage);
router.post("/:roomId/image", upload.single("image"), sendImageMessage);

export default router;
