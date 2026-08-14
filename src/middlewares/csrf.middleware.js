import { doubleCsrf } from "csrf-csrf";
import { env } from "../config/env.js";

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET || "super-secret-key-change-me-32chars!!",
  // v4 requires this — use userId if authenticated, fall back to IP
  getSessionIdentifier: (req) => req.userId || req.ip || "anonymous",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  // v4 renamed getTokenFromRequest → getCsrfTokenFromRequest
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

export { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError };

