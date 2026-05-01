// RBAC middleware - Permission checking middleware
import { asyncHandler } from "../../../utils/async-handler.js";
import { ApiError } from "../../../utils/api-error.js";
import * as rbacService from "../services/rbac.service.js";

/**
 * Middleware to check if user has required permission
 * @param {string} resource - Resource name (e.g., 'PROJECT', 'TASK')
 * @param {string} action - Action name (e.g., 'CREATE', 'DELETE')
 */
export const requirePermission = (resource, action) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.tenantId || !req.userId) {
      throw new ApiError(400, "Tenant context and authentication required");
    }

    const hasPermission = await rbacService.checkPermission(
      req.tenantId,
      req.userId,
      req.tenantMembership.role,
      resource,
      action
    );

    if (!hasPermission) {
      throw new ApiError(403, `Insufficient permissions: Cannot ${action} on ${resource}`);
    }

    next();
  });
};
