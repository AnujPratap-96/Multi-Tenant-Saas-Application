import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

export const updateProfileSchema = requestSchema({
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export const userParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
});

export const listUsersQuerySchema = requestSchema({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("10"),
    q: z.string().optional(),
    role: z.enum(["ADMIN", "MANAGER", "USER", "ALL"]).optional().default("ALL"),
    status: z.enum(["ACTIVE", "SUSPENDED", "ALL"]).optional().default("ALL"),
  }),
});

export const updateUserSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    emailVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    role: z.enum(["ADMIN", "MANAGER", "USER"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  }),
});

export const sessionParamsSchema = requestSchema({
  params: z.object({
    sessionId: z.string().uuid("Invalid session ID"),
  }),
});
