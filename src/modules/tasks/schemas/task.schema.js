// Task schema validation
import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";
import { TASK_STATUS, TASK_PRIORITY } from "../constants/task.constants.js";

export const createTaskSchema = requestSchema({
  body: z.object({
    projectId: z.string().uuid("Invalid project ID"),
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().max(2000).optional(),
    status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]).optional(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]).optional(),
    dueDate: z.string().datetime().optional(),
  }),
});

export const updateTaskSchema = requestSchema({
  body: z.object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]).optional(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]).optional(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

export const listTasksSchema = requestSchema({
  query: z.object({
    projectId: z.string().uuid("Invalid project ID"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum([TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE]).optional(),
    priority: z.enum([TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]).optional(),
    search: z.string().optional(),
  }),
});

export const taskParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid task ID"),
  }),
});

export const addAssigneeSchema = requestSchema({
  body: z.object({
    userId: z.string().uuid("Invalid user ID"),
  }),
});

export const createCommentSchema = requestSchema({
  body: z.object({
    comment: z.string().trim().min(1).max(1000),
  }),
});

export const commentParamsSchema = requestSchema({
  params: z.object({
    id: z.string().uuid("Invalid task ID"),
    commentId: z.string().uuid("Invalid comment ID"),
  }),
});
