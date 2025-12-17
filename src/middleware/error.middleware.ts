// Global Error Handling Middleware
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { logger } from "../utils/logger";
import { ApiError } from "../utils/errors";

/**
 * Custom error response interface
 */
interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log error
  logger.error("Error occurred:", {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Default error response
  let statusCode = 500;
  let message = "Internal server error";
  let errors: any = undefined;

  // Handle custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }

  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (err.code) {
      case "P2002":
        message = "A record with this value already exists";
        errors = { field: err.meta?.target };
        break;
      case "P2025":
        statusCode = 404;
        message = "Record not found";
        break;
      case "P2003":
        message = "Invalid reference to related record";
        break;
      default:
        message = "Database operation failed";
    }
  }

  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data provided";
  }

  // Handle JWT errors
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

/**
 * Async handler wrapper to catch promise rejections
 * IMPORTANTE: Questo è essenziale per i controller
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
