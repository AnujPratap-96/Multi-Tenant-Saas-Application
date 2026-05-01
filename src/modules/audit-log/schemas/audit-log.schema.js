// Audit log schema validation
import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

export const listAuditLogsSchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    entityType: z.string().optional(),
    action: z.string().optional(),
    actorUserId: z.string().uuid().optional(),
  }),
});
