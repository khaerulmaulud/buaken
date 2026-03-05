import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  type ComplaintStatus,
  complaintMessages,
  complaints,
  type NewComplaints,
} from '../db/schema/complaints.schema.js';
import { BaseRepository } from './base.repository.js';

class ComplaintRepository extends BaseRepository<typeof complaints> {
  constructor() {
    super(complaints);
  }

  async createComplaint(data: NewComplaints) {
    const [complaint] = await db.insert(complaints).values(data).returning();
    return complaint;
  }

  async findByIdWithDetails(id: string) {
    return await db.query.complaints.findFirst({
      where: eq(complaints.id, id),
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedAdmin: {
          columns: {
            id: true,
            name: true,
          },
        },
        order: {
          with: {
            merchant: {
              columns: {
                storeName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByReporterId(reporterId: string, limit = 20, offset = 0) {
    const items = await db.query.complaints.findMany({
      where: eq(complaints.reporterId, reporterId),
      limit,
      offset,
      orderBy: [desc(complaints.createdAt)],
      with: {
        order: {
          with: {
            merchant: {
              columns: {
                storeName: true,
              },
            },
          },
        },
      },
    });
    const total = await this.countByReporterId(reporterId);
    return { items, total };
  }

  async findAllWithStats(limit = 20, offset = 0, status?: ComplaintStatus) {
    const whereClause = status ? eq(complaints.status, status) : undefined;

    const items = await db.query.complaints.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(complaints.createdAt)],
      with: {
        reporter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedAdmin: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    const total = await this.countAll(status);
    return { items, total };
  }

  async updateStatus(
    id: string,
    status: ComplaintStatus,
    adminId?: string,
    notes?: string,
    resolution?: string,
  ) {
    const updateData: Partial<NewComplaints> = { status };
    if (adminId) updateData.assignedAdminId = adminId;
    if (notes) updateData.adminNotes = notes;
    if (resolution) {
      updateData.resolution = resolution;
      updateData.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id))
      .returning();
    return updated;
  }

  async assignAdmin(id: string, adminId: string) {
    const [updated] = await db
      .update(complaints)
      .set({ assignedAdminId: adminId })
      .where(eq(complaints.id, id))
      .returning();
    return updated;
  }

  async countByReporterId(reporterId: string) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(eq(complaints.reporterId, reporterId));
    return Number(result[0]?.count || 0);
  }

  async countAll(status?: ComplaintStatus) {
    const whereClause = status ? eq(complaints.status, status) : undefined;
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(whereClause);
    return Number(result[0]?.count || 0);
  }

  // --- Messages Methods ---

  async createMessage(data: {
    complaintId: string;
    senderId: string;
    content: string;
    imageUrl?: string;
  }) {
    const [message] = await db
      .insert(complaintMessages)
      .values(data)
      .returning();
    return message;
  }

  async getMessagesByComplaintId(complaintId: string) {
    return await db.query.complaintMessages.findMany({
      where: eq(complaintMessages.complaintId, complaintId),
      orderBy: [asc(complaintMessages.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getMessageWithSender(messageId: string) {
    return await db.query.complaintMessages.findFirst({
      where: eq(complaintMessages.id, messageId),
      with: {
        sender: {
          columns: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }
}

export const complaintRepository = new ComplaintRepository();
