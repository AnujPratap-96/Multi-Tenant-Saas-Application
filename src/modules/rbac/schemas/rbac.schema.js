// RBAC schema validation
import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

export const assignRolePermissionSchema = requestSchema({
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'USER']),
    permissionId: z.string().uuid(),
  }),
});

export const assignUserPermissionSchema = requestSchema({
  body: z.object({
    userId: z.string().uuid(),
    permissionId: z.string().uuid(),
    isAllowed: z.boolean().default(true),
  }),
});
