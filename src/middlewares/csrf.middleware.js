import { doubleCsrf } from "csrf-csrf";
import { env } from "../config/env.js";

const {
  invalidCsrfTokenError,
  generateCsrfToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  // Stateless double-submit cookie: avoid binding to dynamic proxy/load-balancer IPs
  getSessionIdentifier: () => "",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  // v4 renamed getTokenFromRequest → getCsrfTokenFromRequest
  getCsrfTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

export { doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError };

