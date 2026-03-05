import type { Request, Response } from "express";
import { z } from "zod";
import {
  type ComplaintService,
  ComplaintSSEManager,
  complaintService,
} from "../services/complaint.service.js";
import type { ComplaintStatus, NewComplaints } from "../db/schema/index.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  errorResponse,
  successResponse,
  successResponseWithMeta,
} from "../utils/response.util.js";
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
} from "../validators/complaint.validator.js";

export class ComplaintController {
  constructor(private readonly complaintService: ComplaintService) {}

  create = catchAsync(async (req: Request, res: Response) => {
    const validatedData = createComplaintSchema.parse(req.body);
    const userId = (req as any).user.id;

    const complaint = await this.complaintService.createComplaint(
      userId,
      validatedData as NewComplaints,
    );

    successResponse(res, complaint, "Complaint submitted successfully", 201);
  });

  getMyComplaints = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const { complaints, meta } = await this.complaintService.getMyComplaints(
      userId,
      page,
      limit,
    );

    successResponseWithMeta(
      res,
      complaints,
      meta,
      "Complaints retrieved successfully",
    );
  });

  getById = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Complaint ID",
        "COMPLAINT_ID_INVALID",
      );
    }
    const complaint = await this.complaintService.getComplaintById(
      parsedId.data,
      userId,
      userRole,
    );

    successResponse(res, complaint, "Complaint details retrieved successfully");
  });

  // Admin endpoints
  getAll = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = (req.query.status as ComplaintStatus) || undefined;

    const { complaints, meta } = await this.complaintService.getAllComplaints(
      page,
      limit,
      status,
    );

    successResponseWithMeta(res, complaints, meta, "All complaints retrieved");
  });

  updateStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid or missing Complaint ID",
        "COMPLAINT_ID_INVALID",
      );
    }
    const adminId = (req as any).user.id;
    const validatedData = updateComplaintStatusSchema.parse(req.body);

    const updated = await this.complaintService.updateStatus(
      parsedId.data,
      validatedData.status,
      adminId,
      validatedData.adminNotes,
      validatedData.resolution,
    );

    successResponse(res, updated, "Complaint status updated");
  });

  // --- Chat Endpoints ---

  connectToStream = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return errorResponse(res, 401, "Unauthorized", "UNAUTHORIZED");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    ComplaintSSEManager.addClient(userId, res);

    req.on("close", () => {
      ComplaintSSEManager.removeClient(userId);
    });
  });

  getMessages = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid Complaint ID",
        "COMPLAINT_ID_INVALID",
      );
    }

    const messages = await this.complaintService.getComplaintMessages(
      parsedId.data,
      userId,
      userRole,
    );

    successResponse(res, messages, "Messages retrieved");
  });

  sendMessage = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { content } = req.body; // Will just trust for now, or use zod

    if (!content) {
      return errorResponse(
        res,
        400,
        "Message content is required",
        "CONTENT_REQUIRED",
      );
    }

    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return errorResponse(
        res,
        400,
        "Invalid Complaint ID",
        "COMPLAINT_ID_INVALID",
      );
    }

    const message = await this.complaintService.sendMessage(
      parsedId.data,
      userId,
      userRole,
      content,
    );

    successResponse(res, message, "Message sent", 201);
  });
}

export const complaintController = new ComplaintController(complaintService);
