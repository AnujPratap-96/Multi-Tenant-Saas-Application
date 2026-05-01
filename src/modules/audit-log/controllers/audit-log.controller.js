// Audit log controller - HTTP handling for viewing audit logs
import * as auditLogService from "../services/audit-log.service.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

/**
 * List audit logs
 */
export const listAuditLogsController = asyncHandler(async (req, res) => {
  const options = {
    page: parseInt(req.query.page),
    limit: parseInt(req.query.limit),
    entityType: req.query.entityType,
    action: req.query.action,
    actorUserId: req.query.actorUserId,
  };
  
  const result = await auditLogService.listTenantAuditLogs(req.tenantId, req.userId, options);
  
  return successResponse(res, {
    message: "Audit logs retrieved successfully",
    data: result,
  });
});
