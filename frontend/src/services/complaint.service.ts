import { api } from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface Complaint {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: "pending" | "in_review" | "resolved" | "closed";
  reporterId: string;
  orderId?: string;
  assignedAdminId?: string;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  assignedAdmin?: {
    id: string;
    name: string;
  };
  order?: {
    id: string;
    orderNumber?: string;
    merchant?: {
      storeName: string;
    };
  };
}

export interface ComplaintMessage {
  id: string;
  complaintId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
}

export const complaintService = {
  // User endpoints
  create: async (data: any) => {
    const { data: res } = await api.post("/complaints", data);
    return res.data;
  },

  getMyComplaints: async (page = 1) => {
    const { data } = await api.get<PaginatedResponse<Complaint>>(
      "/complaints/my-complaints",
      {
        params: { page },
      },
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Complaint>>(`/complaints/${id}`);
    return data.data;
  },

  getMessages: async (id: string) => {
    const { data } = await api.get<{ data: ComplaintMessage[] }>(
      `/complaints/${id}/messages`,
    );
    return data.data;
  },

  sendMessage: async (id: string, content: string) => {
    const { data } = await api.post<{ data: ComplaintMessage }>(
      `/complaints/${id}/messages`,
      {
        content,
      },
    );
    return data.data;
  },

  // Admin endpoints (RBAC enforced on backend)
  getAll: async (params: { page?: number; status?: string }) => {
    const { data } = await api.get<PaginatedResponse<Complaint>>(
      "/admin/complaints",
      {
        params,
      },
    );
    return data;
  },

  updateStatus: async (
    id: string,
    data: { status: string; adminNotes?: string; resolution?: string },
  ) => {
    const { data: res } = await api.patch(
      `/admin/complaints/${id}/status`,
      data,
    );
    return res.data;
  },

  getAdminMessages: async (id: string) => {
    const { data } = await api.get<{ data: ComplaintMessage[] }>(
      `/admin/complaints/${id}/messages`,
    );
    return data.data;
  },

  sendAdminMessage: async (id: string, content: string) => {
    const { data } = await api.post<{ data: ComplaintMessage }>(
      `/admin/complaints/${id}/messages`,
      {
        content,
      },
    );
    return data.data;
  },
};
