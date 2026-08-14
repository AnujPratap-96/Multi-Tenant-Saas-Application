import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

export const createRoleSchema = requestSchema({
  body: z.object({
    name: z.string().trim().min(2).max(50),
    description: z.string().trim().max(200).optional(),
  }),
});

export const updateRoleSchema = requestSchema({
  body: z.object({
    name: z.string().trim().min(2).max(50).optional(),
    description: z.string().trim().max(200).optional(),
  }),
});

export const updateRolePermissionsSchema = requestSchema({
  body: z.object({
    permissionIds: z.array(z.string().uuid()),
  }),
});

export const assignRolePermissionSchema = requestSchema({
  body: z.object({
    roleId: z.string().uuid(),
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

export const updateUserRoleSchema = requestSchema({
  body: z.object({
    roleId: z.string(),
  }),
});
