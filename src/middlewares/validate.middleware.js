import logger from "../lib/logger.js";
import { ApiError } from "../utils/api-error.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    logger.warn(
      {
        path: req.path,
        method: req.method,
        errors: result.error.flatten(),
      },
      "Validation failed"
    );

    throw new ApiError(422, "Validation error", result.error.flatten());
  }

  req.validated = result.data; // ✅ safe, parsed data
  next();
};
