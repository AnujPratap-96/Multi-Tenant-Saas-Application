import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const OTP_WINDOW_MS = 15 * 60 * 1000;

// Per-email limit for OTP request endpoints (D-10/S-13)
export const otpSendRateLimiter = rateLimit({
  windowMs: OTP_WINDOW_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `otp-send:${(req.body?.email || "unknown").toString().toLowerCase()}`,
  message: "Too many OTP requests for this email, please try again later",
});

// Per-requestId + IP limit for OTP verification attempts (D-10/S-13)
export const otpVerifyRateLimiter = rateLimit({
  windowMs: OTP_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    `otp-verify:${req.query?.requestId || "none"}:${ipKeyGenerator(req.ip)}`,
  message: "Too many OTP verification attempts, please try again later",
});
