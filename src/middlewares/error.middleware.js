import logger from "../lib/logger.js";
import { ApiError } from "../utils/ApiError.js";
import { errorResponse } from "../utils/response.js";
import { ZodError } from "zod";

export default function errorMiddleware(err, req, res, next) {
  let error = err;

  // Zod validation errors
  if (err instanceof ZodError) {
    error = new ApiError(400, "Validation failed", err.errors);
  }

  // Unknown errors → convert to operational error
  if (!(error instanceof ApiError)) {
    error = new ApiError(500, "Internal Server Error");
  }

  // Logging (always)
  logger.error({
    reqId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode: error.statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    userId: req.user?.id,
    tenantId: req.tenant?.id
  });

  return errorResponse(res, {
    statusCode: error.statusCode,
    message: error.message,
    error: error.details || null
  });
}
