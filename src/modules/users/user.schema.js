// User schema validation
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";

// Update profile schema
export const updateProfileSchema = requestSchema({
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().min(1).max(50).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
  }),
});

// User ID params schema
export const userParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid user ID"),
  }),
});
