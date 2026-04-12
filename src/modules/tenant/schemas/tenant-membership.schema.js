// Tenant membership schema validation
import { z } from "zod";
import {requestSchema} from "../../../schemas/request.schema.js";
import { TENANT_ROLES } from "../constants/tenant.constants.js";

// Add member schema
export const addMemberSchema = requestSchema({
  body: z.object({
    userId: z.string().uuid("Invalid user ID"),
    role: z.enum([TENANT_ROLES.ADMIN, TENANT_ROLES.MANAGER, TENANT_ROLES.USER]),
  }),
});

// Update member role schema
export const updateMemberSchema = requestSchema({
  body: z.object({
    role: z.enum([TENANT_ROLES.ADMIN, TENANT_ROLES.MANAGER, TENANT_ROLES.USER]),
  }),
});

// Member ID params schema
export const memberParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
    userId: z.string().uuid("Invalid user ID"),
  }),
});

// List members query schema
export const listMembersQuerySchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.string().optional(),
    role: z.string().optional(),
  }),
});

// Suspend member schema
export const suspendMemberSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
    userId: z.string().uuid("Invalid user ID"),
  }),
});
