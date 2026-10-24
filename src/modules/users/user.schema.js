import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

const emptyToNull = (val) => (typeof val === "string" && val.trim() === "" ? null : val);

export const updateProfileSchema = requestSchema({
  body: z.object({
    firstName: z.preprocess(emptyToNull, z.string().trim().max(50).nullable().optional()),
    lastName: z.preprocess(emptyToNull, z.string().trim().max(50).nullable().optional()),
    displayName: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
    bio: z.preprocess(emptyToNull, z.string().max(1000).nullable().optional()),
    timezone: z.preprocess(emptyToNull, z.string().max(64).nullable().optional()),
    locale: z.preprocess(emptyToNull, z.string().max(16).nullable().optional()),
    avatarUrl: z.preprocess(emptyToNull, z.string().max(2000000).nullable().optional()),
    jobTitle: z.preprocess(emptyToNull, z.string().trim().max(100).nullable().optional()),
    tenantId: z.string().uuid().optional().nullable().or(z.literal("")),
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
    role: z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, z.enum(["ADMIN", "MANAGER", "USER", "ALL"])).optional().default("ALL"),
    status: z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, z.enum(["ACTIVE", "SUSPENDED", "ALL"])).optional().default("ALL"),
  }),
});

export const updateUserSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
  body: z.object({
    firstName: z.preprocess(emptyToNull, z.string().trim().max(50).nullable().optional()),
    lastName: z.preprocess(emptyToNull, z.string().trim().max(50).nullable().optional()),
    avatarUrl: z.preprocess(emptyToNull, z.string().max(2000000).nullable().optional()),
    emailVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    role: z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, z.enum(["ADMIN", "MANAGER", "USER"])).optional(),
    status: z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, z.enum(["ACTIVE", "SUSPENDED"])).optional(),
  }),
});

export const sessionParamsSchema = requestSchema({
  params: z.object({
    sessionId: z.string().uuid("Invalid session ID"),
  }),
});

export const userSessionParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
    sessionId: z.string().uuid("Invalid session ID"),
  }),
});
