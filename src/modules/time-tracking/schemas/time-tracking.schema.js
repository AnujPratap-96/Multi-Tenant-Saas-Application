import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

const isoDateTime = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime());

export const createTimeEntrySchema = requestSchema({
  params: z.object({
    taskId: z.string().uuid(),
  }),
  body: z.object({
    startedAt: isoDateTime.optional(),
    endedAt: isoDateTime.optional(),
    description: z.string().max(1000).optional(),
  }),
});

export const stopTimeEntrySchema = requestSchema({
  params: z.object({
    entryId: z.string().uuid(),
  }),
});

export const listTaskTimeEntriesSchema = requestSchema({
  params: z.object({
    taskId: z.string().uuid(),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
});

export const updateTimeEntrySchema = requestSchema({
  params: z.object({
    entryId: z.string().uuid(),
  }),
  body: z.object({
    startedAt: isoDateTime.optional(),
    endedAt: isoDateTime.optional().nullable(),
    description: z.string().max(1000).optional(),
  }),
});

export const deleteTimeEntrySchema = requestSchema({
  params: z.object({
    entryId: z.string().uuid(),
  }),
});

export const listMyTimeEntriesSchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }),
});
