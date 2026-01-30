export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const validationMessages = {
  email: {
    required: "Email is required",
    invalid: "Please enter a valid email address",
  },
  password: {
    required: "Password is required",
    minLength: "Password must be at least 8 characters",
  },
  otp: {
    required: "OTP is required",
    length: "OTP must be 6 digits",
  },
};

export function mapZodErrors(err) {
  const errors = {};
  // err.errors is already a flat array
  err.issues.forEach((e) => {
    // Get last path segment as field name
    const field = e.path[e.path.length - 1];
    let msg;
    // Handle missing field
    if (e.code === "invalid_type" && e.received === "undefined") {
      msg = validationMessages[field]?.required || "This field is required";
    }
    // Handle min length / too small
    else if (e.code === "too_small") {
      msg = validationMessages[field]?.minLength || e.message;
    }
    // Custom messages in Zod
    else if (e.code === "custom") {
      msg = e.message;
    }
    // Fallback for invalid type or format
    else {
      msg = validationMessages[field]?.invalid || e.message;
    }
    // Assign to errors object
    errors[field] = msg;
  });
  return errors;
}
