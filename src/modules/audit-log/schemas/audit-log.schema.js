import { z } from "zod";
import { requestSchema } from "../../../schemas/request.schema.js";

const auditEntityValues = ["USER", "TENANT", "PROJECT", "TASK", "COMMENT", "SESSION"];

const auditActionValues = [
  "CREATE", "UPDATE", "DELETE", "INVITE", "REMOVE", "LOGIN", "LOGOUT",
  "PASSWORD_RESET", "PASSWORD_CHANGE", "PASSWORD_SET", "ROLE_CHANGE",
  "ADD_MEMBER", "REMOVE_MEMBER", "SUSPEND_MEMBER", "RESTORE_MEMBER",
  "SWITCH_TENANT", "RESTORE", "INVITE_ACCEPTED", "INVITE_REJECTED",
  "INVITE_CANCELLED", "INVITE_RESENT",
  "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_DELETE", "PROJECT_ARCHIVE",
  "PROJECT_MEMBER_ADD", "PROJECT_MEMBER_REMOVE", "PROJECT_MEMBER_UPDATE",
  "TASK_CREATE", "TASK_UPDATE", "TASK_DELETE", "TASK_STATUS_CHANGE",
  "TASK_ASSIGNEE_ADD", "TASK_ASSIGNEE_REMOVE", "TASK_COMMENT_ADD", "TASK_COMMENT_DELETE",
];

export const listAuditLogsSchema = requestSchema({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(200).default(50),
    entityType: z.enum(auditEntityValues).optional(),
    action: z.enum(auditActionValues).optional(),
    actorUserId: z.string().uuid().optional(),
    entityId: z.string().optional(),
    q: z.string().optional(),
    startDate: z.string().datetime({ offset: true }).optional(),
    endDate: z.string().datetime({ offset: true }).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});
