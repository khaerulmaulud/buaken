import { Router } from "express";
import { complaintController } from "../controllers/complaint.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: Router = Router();

// User-facing complaint routes (auth required)
router.use(authMiddleware);
router.post("/", complaintController.create.bind(complaintController));
router.get(
  "/my-complaints",
  complaintController.getMyComplaints.bind(complaintController),
);
router.get(
  "/stream",
  complaintController.connectToStream.bind(complaintController),
);
router.get("/:id", complaintController.getById.bind(complaintController));
router.get(
  "/:id/messages",
  complaintController.getMessages.bind(complaintController),
);
router.post(
  "/:id/messages",
  complaintController.sendMessage.bind(complaintController),
);

export default router;
