import type { Response } from "express";
import type {
  ComplaintStatus,
  NewComplaints,
} from "../db/schema/complaints.schema.js";
import { ForbiddenError, NotFoundError } from "../utils/error.util.js";

// biome-ignore lint/complexity/noStaticOnlyClass: SSE Manager uses static map for connections
export class ComplaintSSEManager {
  private static clients: Map<string, Response> = new Map();

  static addClient(userId: string, res: Response) {
    ComplaintSSEManager.clients.set(userId, res);
    res.write("event: connected\n");
    res.write(
      `data: ${JSON.stringify({ message: "Connected to complaint stream" })}\n\n`,
    );
  }

  static removeClient(userId: string) {
    ComplaintSSEManager.clients.delete(userId);
  }

  static emitToUser(userId: string, event: string, data: any) {
    const client = ComplaintSSEManager.clients.get(userId);
    if (client) {
      client.write(`event: ${event}\n`);
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }
}

export class ComplaintService {
  constructor(
    private readonly complaintRepository: typeof import("../repositories/complaint.repository.js").complaintRepository,
    private readonly orderRepository: typeof import("../repositories/order.repository.js").orderRepository,
  ) {}

  async createComplaint(reporterId: string, data: NewComplaints) {
    // If orderId is provided, verify the user is involved in the order
    if (data.orderId) {
      const order = await this.orderRepository.findByIdWithDetails(
        data.orderId,
      );
      if (!order) {
        throw new NotFoundError("Order");
      }
      const isInvolved =
        order.customerId === reporterId ||
        order.merchantId === reporterId ||
        order.courierId === reporterId;
      if (!isInvolved) {
        throw new ForbiddenError(
          "You can only report orders you are involved in",
        );
      }
    }

    const complaintData = {
      ...data,
      description: data.description,
      reporterId,
      status: "pending" as const,
    };

    return await this.complaintRepository.createComplaint(complaintData);
  }

  async getMyComplaints(reporterId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { items, total } = await this.complaintRepository.findByReporterId(
      reporterId,
      limit,
      offset,
    );

    return {
      complaints: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getComplaintById(
    complaintId: string,
    userId: string,
    userRole: string,
  ) {
    const complaint =
      await this.complaintRepository.findByIdWithDetails(complaintId);
    if (!complaint) {
      throw new NotFoundError("Complaint");
    }

    // Verify access: reporter or admin
    if (userRole !== "admin" && complaint.reporterId !== userId) {
      throw new ForbiddenError("You cannot view this complaint");
    }

    return complaint;
  }

  // Admin methods
  async getAllComplaints(page = 1, limit = 20, status?: ComplaintStatus) {
    const offset = (page - 1) * limit;
    const { items, total } = await this.complaintRepository.findAllWithStats(
      limit,
      offset,
      status,
    );

    return {
      complaints: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(
    complaintId: string,
    status: ComplaintStatus,
    adminId: string,
    notes?: string,
    resolution?: string,
  ) {
    const complaint =
      await this.complaintRepository.findByIdWithDetails(complaintId);
    if (!complaint) {
      throw new NotFoundError("Complaint");
    }

    return await this.complaintRepository.updateStatus(
      complaintId,
      status,
      adminId,
      notes,
      resolution,
    );
  }

  async assignAdmin(complaintId: string, adminId: string) {
    const complaint =
      await this.complaintRepository.findByIdWithDetails(complaintId);
    if (!complaint) {
      throw new NotFoundError("Complaint");
    }

    return await this.complaintRepository.assignAdmin(complaintId, adminId);
  }

  // --- Messages & Chat functionality ---

  async getComplaintMessages(
    complaintId: string,
    userId: string,
    userRole: string,
  ) {
    // 1. Verify access
    await this.getComplaintById(complaintId, userId, userRole);
    // 2. Fetch messages
    return await this.complaintRepository.getMessagesByComplaintId(complaintId);
  }

  async sendMessage(
    complaintId: string,
    senderId: string,
    userRole: string,
    content: string,
    imageUrl?: string,
  ) {
    // 1. Verify access (will throw if not allowed)
    const complaint = await this.getComplaintById(
      complaintId,
      senderId,
      userRole,
    );

    if (complaint.status === "closed" || complaint.status === "resolved") {
      throw new ForbiddenError(
        "Cannot send messages to a resolved or closed complaint",
      );
    }

    // 2. Save message
    const newMessageResult = await this.complaintRepository.createMessage({
      complaintId,
      senderId,
      content,
      imageUrl,
    });

    if (!newMessageResult) {
      throw new Error("Failed to create message");
    }

    // 3. Status update
    // If Admin replies and status is pending, switch to in_review.
    if (userRole === "admin" && complaint.status === "pending") {
      await this.complaintRepository.updateStatus(complaintId, "in_review");
      // Update assigned admin if not assigned yet
      if (!complaint.assignedAdminId) {
        await this.complaintRepository.assignAdmin(complaintId, senderId);
      }
    }

    const createdMessage = await this.complaintRepository.getMessageWithSender(
      newMessageResult.id,
    );

    if (!createdMessage) {
      throw new Error("Failed to fetch created message details");
    }

    // 4. Emit SSE to participants
    // Participants: reporter, and if assignedAdminId exists, the admin.
    // We should also possibly emit to all admins if we want them to see incoming messages,
    // but the spec just says Admin and Customer see in real-time.
    ComplaintSSEManager.emitToUser(
      complaint.reporterId,
      "new_complaint_message",
      createdMessage,
    );
    if (complaint.assignedAdminId) {
      ComplaintSSEManager.emitToUser(
        complaint.assignedAdminId,
        "new_complaint_message",
        createdMessage,
      );
    }

    return createdMessage;
  }
}

import { complaintRepository } from "../repositories/complaint.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
export const complaintService = new ComplaintService(
  complaintRepository,
  orderRepository,
);
