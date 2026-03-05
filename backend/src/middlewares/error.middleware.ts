import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/error.util.js";
import { errorResponse } from "../utils/response.util.js";

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  // Log error for debugging, except for 401 Authentication errors which are expected
  if (
    !(err instanceof AppError && err.statusCode === 401) &&
    err.name !== "JsonWebTokenError" &&
    err.name !== "TokenExpiredError"
  ) {
    console.error("Error:", {
      name: err.name,
      message: err.message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle known AppError instances
  if (err instanceof AppError) {
    return errorResponse(
      res,
      err.statusCode,
      err.code || "ERROR",
      err.message,
      err.details,
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, 401, "INVALID_TOKEN", "Invalid token");
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, 401, "TOKEN_EXPIRED", "Token has expired");
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return errorResponse(
      res,
      400,
      "VALIDATION_ERROR",
      "Validation failed",
      (err as any).errors,
    );
  }

  // Default to 500 Internal Server Error
  return errorResponse(
    res,
    500,
    "INTERNAL_ERROR",
    env.NODE_ENV === "development" ? err.message : "Internal server error",
  );
};
