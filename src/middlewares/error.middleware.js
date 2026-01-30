import logger from "../lib/logger.js";
import { ApiError, mapZodErrors } from "../utils/api-error.js";
import { errorResponse } from "../utils/response.js";
import { ZodError } from "zod";
export default function errorMiddleware(err, req, res, next) {
  if (!err) {
    return next();
  }
  let error = err;
  if (err instanceof ZodError) {
    const mappedError = mapZodErrors(err);
    error = new ApiError(400, "Validation failed", mappedError);
  } 
  else if (!(err instanceof ApiError)) {
    error = new ApiError(500, "Internal Server Error");
  }
  logger.error({
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
