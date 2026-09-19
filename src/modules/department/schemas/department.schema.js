import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

export const createDepartmentSchema = requestSchema({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    managerId: z.string().uuid(),
  }),
});

export const updateDepartmentSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    managerId: z.string().uuid().optional(),
  }),
});

export const addDepartmentMemberSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    userId: z.string().uuid(),
    role: z.enum(["MANAGER", "LEAD", "MEMBER"]).default("MEMBER"),
  }),
});

export const removeDepartmentMemberSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
  }),
});

export const listDepartmentMembersQuerySchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});

export const listDepartmentsQuerySchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
  }),
});

export const createTaskTypeSchema = requestSchema({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

export const updateTaskTypeSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

export const departmentIdParamSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const taskTypeIdParamSchema = requestSchema({
  params: z.object({
    id: z.string().uuid(),
  }),
});
