import logger from "../lib/logger.js";
import { ApiError, mapZodErrors } from "../utils/api-error.js";
import { errorResponse } from "../utils/response.js";
import { ZodError } from "zod";
import { invalidCsrfTokenError } from "./csrf.middleware.js";

export default function errorMiddleware(err, req, res, next) {
  if (!err) {
    return next();
  }
  let error = err;
  if (err instanceof ZodError) {
    const mappedError = mapZodErrors(err);
    error = new ApiError(400, "Validation failed", mappedError);
  } else if (err === invalidCsrfTokenError || err.code === "EBADCSRFTOKEN") {
    error = new ApiError(403, "Invalid or missing CSRF token");
  } else if (err.type === "entity.too.large" || err.status === 413) {
    error = new ApiError(413, "Request payload too large (max 10MB)");
  } else if (err.code === "P2025") {
    error = new ApiError(404, "Record not found");
  } else if (!(err instanceof ApiError)) {
    error = new ApiError(500, "Internal Server Error");
  }
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel]({
    reqId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode: error.statusCode,
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
  return errorResponse(res, {
    statusCode: error.statusCode,
    message: error.message,
    error: error.details ?? null,
  });
}
