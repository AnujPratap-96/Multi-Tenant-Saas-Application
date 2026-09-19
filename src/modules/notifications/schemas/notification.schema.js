import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

export const listNotificationsSchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    unreadOnly: z.coerce.boolean().optional(),
  }),
});

export const markReadSchema = requestSchema({
  params: z.object({
    notificationId: z.string().uuid(),
  }),
});

export const unreadCountSchema = requestSchema({});
