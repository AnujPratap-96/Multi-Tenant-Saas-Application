// Tenant schema validation
import { z } from "zod";
import { requestSchema } from "../../schemas/request.schema.js";
import { TENANT_PLANS, MIN_TENANT_NAME_LENGTH, MAX_TENANT_NAME_LENGTH } from "../constants/tenant.constants.js";

// Create tenant schema
export const createTenantSchema = requestSchema({
  body: z.object({
    name: z.string()
      .trim()
      .min(MIN_TENANT_NAME_LENGTH, `Tenant name must be at least ${MIN_TENANT_NAME_LENGTH} characters`)
      .max(MAX_TENANT_NAME_LENGTH, `Tenant name must not exceed ${MAX_TENANT_NAME_LENGTH} characters`),
    plan: z.enum([TENANT_PLANS.FREE, TENANT_PLANS.PRO, TENANT_PLANS.ENTERPRISE])
      .optional(),
  }),
});

// Update tenant schema
export const updateTenantSchema = requestSchema({
  body: z.object({
    name: z.string()
      .trim()
      .min(MIN_TENANT_NAME_LENGTH, `Tenant name must be at least ${MIN_TENANT_NAME_LENGTH} characters`)
      .max(MAX_TENANT_NAME_LENGTH, `Tenant name must not exceed ${MAX_TENANT_NAME_LENGTH} characters`)
      .optional(),
    plan: z.enum([TENANT_PLANS.FREE, TENANT_PLANS.PRO, TENANT_PLANS.ENTERPRISE])
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

// Tenant ID params schema
export const tenantParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
  }),
});

// List tenants query schema
export const listTenantsQuerySchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
});

// Switch tenant schema
export const switchTenantSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid tenant ID"),
  }),
});
