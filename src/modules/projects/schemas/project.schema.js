// Project schema validation
import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";
import { MIN_PROJECT_NAME_LENGTH, MAX_PROJECT_NAME_LENGTH, PROJECT_ROLES } from "../constants/project.constants.js";

// Create project schema
export const createProjectSchema = requestSchema({
  body: z.object({
    name: z.string()
      .trim()
      .min(MIN_PROJECT_NAME_LENGTH, `Project name must be at least ${MIN_PROJECT_NAME_LENGTH} characters`)
      .max(MAX_PROJECT_NAME_LENGTH, `Project name must not exceed ${MAX_PROJECT_NAME_LENGTH} characters`),
    description: z.string().trim().max(500).optional(),
  }),
});

// Update project schema
export const updateProjectSchema = requestSchema({
  body: z.object({
    name: z.string()
      .trim()
      .min(MIN_PROJECT_NAME_LENGTH, `Project name must be at least ${MIN_PROJECT_NAME_LENGTH} characters`)
      .max(MAX_PROJECT_NAME_LENGTH, `Project name must not exceed ${MAX_PROJECT_NAME_LENGTH} characters`)
      .optional(),
    description: z.string().trim().max(500).optional(),
    isArchived: z.boolean().optional(),
  }),
});

// Project ID params schema
export const projectParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid project ID"),
  }),
});

// List projects query schema
export const listProjectsSchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    isArchived: z.coerce.boolean().default(false),
  }),
});

// Project member schema
export const addMemberSchema = requestSchema({
  body: z.object({
    userId: z.string().uuid("Invalid user ID"),
    role: z.enum([PROJECT_ROLES.OWNER, PROJECT_ROLES.MAINTAINER, PROJECT_ROLES.MEMBER]).default(PROJECT_ROLES.MEMBER),
  }),
});
