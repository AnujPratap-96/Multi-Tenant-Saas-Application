// Audit log service - Business logic for viewing audit logs
import * as auditLogRepository from "../audit-log.repository.js";
import * as membershipRepository from "../../tenant/repositories/tenant-membership.repository.js";
import { ApiError } from "../../../utils/api-error.js";

/**
 * List audit logs for a tenant
 * Restricted to tenant admins
 */
export const listTenantAuditLogs = async (tenantId, userId, options) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Admin access required to view audit logs");
  }

  return await auditLogRepository.listAuditLogsByTenant(tenantId, options);
};
