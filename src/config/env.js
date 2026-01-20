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
    // JWT_ACCESS_EXPIRES_IN: z.string(),   // e.g. 15m
    // JWT_REFRESH_EXPIRES_IN: z.string(),  // e.g. 7d

    // OTP
    OTP_LENGTH: z.string().regex(/^\d+$/).transform(Number),
    OTP_EXPIRES_IN: z.string().regex(/^\d+$/).transform(Number), // seconds
    OTP_MAX_ATTEMPTS: z.string().regex(/^\d+$/).transform(Number),

    // Rate limiting
    RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number),
    RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number),

    // Security
    BCRYPT_SALT_ROUNDS: z.string().regex(/^\d+$/).transform(Number),

    // Email
    // EMAIL_FROM: z.string().email(),
    // SMTP_HOST: z.string().min(1),
    // SMTP_PORT: z.string().regex(/^\d+$/).transform(Number),
    // SMTP_USER: z.string().min(1),
    // SMTP_PASS: z.string().min(1),

    // Logging
    // LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
  });


const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1); // Fail fast
}

export const env = Object.freeze(parsed.data);
