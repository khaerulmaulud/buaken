import type { Response } from 'express';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const successResponse = <T = any>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
};

export const successResponseWithMeta = <T = any>(
  res: Response,
  data: T,
  meta: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string,
  statusCode: number = 200,
): Response<SuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
    },
    ...(message && { message }),
  });
};

export const errorResponse = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any,
): Response<ErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
};
