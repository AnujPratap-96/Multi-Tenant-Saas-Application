// RBAC controller - HTTP handling for permissions
import * as rbacService from "../services/rbac.service.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

/**
 * Get current user's permissions
 */
export const getMyPermissionsController = asyncHandler(async (req, res) => {
  const permissions = await rbacService.getUserPermissions(
    req.tenantId, 
    req.userId, 
    req.tenantMembership.role
  );
  
  return successResponse(res, {
    message: "Permissions retrieved successfully",
    data: permissions,
  });
});

/**
 * Assign permission to user (Admin only)
 */
export const assignUserPermissionController = asyncHandler(async (req, res) => {
  const { userId, permissionId, isAllowed } = req.body;
  
  const result = await rbacService.assignUserPermission(
    req.tenantId, 
    userId, 
    permissionId, 
    isAllowed
  );
  
  return successResponse(res, {
    message: "User permission updated successfully",
    data: result,
  });
});
