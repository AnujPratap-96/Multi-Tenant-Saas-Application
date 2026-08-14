import * as auditLogRepository from "../audit-log.repository.js";
import * as membershipRepository from "../../tenant/repositories/tenant-membership.repository.js";
import { ApiError } from "../../../utils/api-error.js";

async function requireAdmin(tenantId, userId) {
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Admin access required to view audit logs");
  }
}

// S-25: quote every field, escape embedded quotes, neutralize CSV formula injection
const escapeCsv = (value) => {
  const str = value == null ? "" : String(value);
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${sanitized.replace(/"/g, '""')}"`;
};

export const listTenantAuditLogs = async (tenantId, userId, options) => {
  await requireAdmin(tenantId, userId);
  return await auditLogRepository.listAuditLogsByTenant(tenantId, options);
};

export const exportAuditLogs = async (tenantId, userId, filters) => {
  await requireAdmin(tenantId, userId);
  const logs = await auditLogRepository.listAuditLogsForExport(tenantId, filters);

  const header = [
    "Timestamp",
    "Action",
    "Entity Type",
    "Entity ID",
    "Actor",
    "Actor Email",
    "Subject",
    "Subject Email",
    "IP Address",
    "User Agent",
    "Changes",
  ].map(escapeCsv).join(",");

  const rows = logs.map((log) => {
    const actorName = log.actor ? `${log.actor.firstName || ''} ${log.actor.lastName || ''}`.trim() : '';
    const subjectName = log.subject ? `${log.subject.firstName || ''} ${log.subject.lastName || ''}`.trim() : '';
    const changes = JSON.stringify({ old: log.oldValue, new: log.newValue });
    return [
      log.createdAt.toISOString(),
      log.action,
      log.entityType,
      log.entityId || '',
      actorName,
      log.actor?.email || '',
      subjectName,
      log.subject?.email || '',
      log.ipAddress || '',
      log.userAgent || '',
      changes,
    ].map(escapeCsv).join(",");
  });

  // UTF-8 BOM so Excel renders non-ASCII correctly
  return "\uFEFF" + header + "\r\n" + rows.join("\r\n");
};
