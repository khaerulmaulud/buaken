import { z } from "zod";
import { complaintCategoryEnum } from "../db/schema/complaints.schema.js";

export const createComplaintSchema = z.object({
  category: z.enum(complaintCategoryEnum.enumValues, {
    errorMap: () => ({ message: "Invalid complaint category" }),
  }),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  orderId: z.string().uuid().optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(["pending", "in_review", "resolved", "closed"]),
  adminNotes: z.string().optional(),
  resolution: z.string().optional(),
});
