// Re-export all types from schemas
export * from "../db/schema/index.js";

// Common DTOs and interfaces can be added here
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
