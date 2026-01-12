import "dotenv/config";  
import { z } from "zod";

/**
 * Environment schema
 * App MUST NOT start if this fails
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  PORT: z
    .string()
    .regex(/^\d+$/, "PORT must be a number")
    .transform(Number),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
});

/**
 * Validate process.env ONCE
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.format());
  process.exit(1); // FAIL FAST
}

/**
 * Export immutable env
 */
export const env = Object.freeze(parsed.data);
