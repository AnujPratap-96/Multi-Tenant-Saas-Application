// Tenant invite schema validation
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";
import { TENANT_ROLES, INVITE_EXPIRY_DAYS } from "../constants/tenant.constants.js";

// Create invite schema
export const createInviteSchema = requestSchema({
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    role: z.enum([TENANT_ROLES.ADMIN, TENANT_ROLES.MANAGER, TENANT_ROLES.USER]),
  }),
});

// Invite ID params schema
export const inviteParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
    inviteId: z.string().uuid("Invalid invite ID"),
  }),
});

// List invites query schema
export const listInvitesQuerySchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.string().optional(),
  }),
});

// Accept invite schema
export const acceptInviteSchema = requestSchema({
  body: z.object({
    token: z.string().min(1, "Invite token is required"),
  }),
});

// Reject invite schema
export const rejectInviteSchema = requestSchema({
  body: z.object({
    token: z.string().min(1, "Invite token is required"),
  }),
});
