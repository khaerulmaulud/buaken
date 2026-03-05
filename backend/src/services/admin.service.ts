import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders } from "../db/schema/orders.schema.js";
import { users } from "../db/schema/users.schema.js";
import { NotFoundError } from "../utils/error.util.js";

export class AdminService {
  constructor(
    private readonly complaintRepository: typeof import("../repositories/complaint.repository.js").complaintRepository,
  ) {}

  // Dashboard Overviews
  async getDashboardStats() {
    // Count total users, merchants, couriers
    // Count active orders, completed orders
    // Count pending complaints

    const [userCounts] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        merchants: sql<number>`count(*) filter (where ${eq(users.role, "merchant")})`,
        couriers: sql<number>`count(*) filter (where ${eq(users.role, "courier")})`,
      })
      .from(users);

    const [orderCounts] = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        activeOrders: sql<number>`count(*) filter (where ${sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_delivery')`})`,
        completedOrders: sql<number>`count(*) filter (where ${eq(orders.status, "delivered")})`,
        revenue: sql<number>`sum(${orders.subtotal}) filter (where ${eq(orders.status, "delivered")})`,
      })
      .from(orders);

    const pendingComplaints =
      await this.complaintRepository.countAll("pending");

    return {
      users: {
        total: Number(userCounts?.totalUsers || 0),
        merchants: Number(userCounts?.merchants || 0),
        couriers: Number(userCounts?.couriers || 0),
      },
      orders: {
        total: Number(orderCounts?.totalOrders || 0),
        active: Number(orderCounts?.activeOrders || 0),
        completed: Number(orderCounts?.completedOrders || 0),
        revenue: Number(orderCounts?.revenue || 0),
      },
      complaints: {
        pending: pendingComplaints,
      },
    };
  }

  // User Management
  async getAllUsers(page = 1, limit = 20, search?: string, role?: string) {
    const offset = (page - 1) * limit;

    let whereClause: any;
    if (search) {
      whereClause = or(
        ilike(users.email, `%${search}%`),
        ilike(users.name, `%${search}%`),
      );
    }
    if (role) {
      const roleFilter = eq(users.role, role as any);
      whereClause = whereClause ? and(whereClause, roleFilter) : roleFilter;
    }

    const items = await db.query.users.findMany({
      where: whereClause,
      limit,
      offset,
      columns: {
        password: false,
      },
      orderBy: [desc(users.createdAt)],
    });

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause);

    return {
      users: items,
      meta: {
        page,
        limit,
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
      },
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const [user] = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId))
      .returning({ id: users.id, isActive: users.isActive });

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }
}

import { complaintRepository } from "../repositories/complaint.repository.js";
export const adminService = new AdminService(complaintRepository);
