import * as auditLogService from "../services/audit-log.service.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

export const listAuditLogsController = asyncHandler(async (req, res) => {
  const result = await auditLogService.listTenantAuditLogs(
    req.tenantId,
    req.userId,
    req.validated.query
  );

  return successResponse(res, {
    message: "Audit logs retrieved successfully",
    data: result,
  });
});

export const exportAuditLogsController = asyncHandler(async (req, res) => {
  const csv = await auditLogService.exportAuditLogs(
    req.tenantId,
    req.userId,
    req.validated.query
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
  res.send(csv);
});
