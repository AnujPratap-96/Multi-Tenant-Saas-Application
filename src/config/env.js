import "dotenv/config";
import { z } from "zod";
/**
 * Validate environment variables once.
 * App MUST NOT start if this fails.
 */
const envSchema = z
  .object({
    // App
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.string().regex(/^\d+$/).transform(Number),
    // APP_NAME: z.string().min(1),
    // APP_URL: z.string().url(),
    // Database
    DATABASE_URL: z.string().url(),
    // Redis
    REDIS_URL: z.string().url(),
    // JWT
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_SIGNUP_SECRET: z.string().min(32),
    JWT_PASSWORD_RESET_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN: z.string(),   // e.g. 8h
    JWT_REFRESH_EXPIRES_IN: z.string(),  // e.g. 7d
    JWT_SIGNUP_EXPIRES_IN: z.string(),   // e.g. 10m
    JWT_PASSWORD_RESET_EXPIRES_IN: z.string(),   // e.g. 15m
    SIGNUP_TOKEN_COOKIE_MAX_AGE: z.string().regex(/^\d+$/).transform(Number),
    ACCESS_TOKEN_COOKIE_MAX_AGE: z.string().regex(/^\d+$/).transform(Number),
    REFRESH_TOKEN_COOKIE_MAX_AGE: z.string().regex(/^\d+$/).transform(Number),
    PASSWORD_RESET_TOKEN_COOKIE_MAX_AGE: z.string().regex(/^\d+$/).transform(Number),
    // OTP
    OTP_LENGTH: z.string().regex(/^\d+$/).transform(Number),
    OTP_EXPIRES_IN: z.string().regex(/^\d+$/).transform(Number), // seconds
    OTP_MAX_ATTEMPTS: z.string().regex(/^\d+$/).transform(Number),
    MAX_RESEND: z.string().regex(/^\d+$/).transform(Number),
    RESEND_COOLDOWN: z.string().regex(/^\d+$/).transform(Number), // seconds
    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number),
    RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number),
    // Security
    BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/).transform(Number),
    CSRF_SECRET: z.string().min(32, "CSRF_SECRET must be at least 32 characters"),
    // CORS / proxy
    ALLOWED_ORIGINS: z.string().min(1, "ALLOWED_ORIGINS is required (comma-separated origins)"),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),
    TRUST_PROXY: z
      .string()
      .default("false")
      .transform((v) => (v === "true" || v === "1")),
    // Third-party services
    BREVO_API_KEY: z.string().min(1),
    // Logging
    // LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),

    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().min(1),

  });
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1); // Fail fast
}
export const env = Object.freeze(parsed.data);
