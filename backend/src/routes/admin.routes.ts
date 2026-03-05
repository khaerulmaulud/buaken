import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import { complaintController } from "../controllers/complaint.controller.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router: Router = Router();

// Protect all admin routes with auth + admin RBAC
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard
router.get("/dashboard", adminController.getDashboard.bind(adminController));

// Users
router.get("/users", adminController.getUsers.bind(adminController));
router.patch(
  "/users/:id/status",
  adminController.updateUserStatus.bind(adminController),
);

// Complaints (admin management)
router.get("/complaints", complaintController.getAll.bind(complaintController));
router.patch(
  "/complaints/:id/status",
  complaintController.updateStatus.bind(complaintController),
);
router.get(
  "/complaints/:id/messages",
  complaintController.getMessages.bind(complaintController),
);
router.post(
  "/complaints/:id/messages",
  complaintController.sendMessage.bind(complaintController),
);

export default router;
