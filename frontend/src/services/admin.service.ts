import { api } from "@/lib/axios";
import type {
  ApiResponse,
  DashboardStats,
  PaginatedResponse,
  User,
} from "@/types";

export const adminService = {
  getDashboardStats: async () => {
    const { data } =
      await api.get<ApiResponse<DashboardStats>>("/admin/dashboard");
    return data.data;
  },

  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const { data } = await api.get<PaginatedResponse<User>>("/admin/users", {
      params,
    });
    return data;
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const { data } = await api.patch<ApiResponse<User>>(
      `/admin/users/${userId}/status`,
      { isActive },
    );
    return data.data;
  },
};
