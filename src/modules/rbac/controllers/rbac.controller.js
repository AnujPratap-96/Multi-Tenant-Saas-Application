import * as rbacService from "../services/rbac.service.js";
import * as rbacRepository from "../repositories/rbac.repository.js";
import { successResponse } from "../../../utils/response.js";
import { asyncHandler } from "../../../utils/async-handler.js";

export const getMyPermissionsController = asyncHandler(async (req, res) => {
  const permissions = await rbacService.getMyPermissions(
    req.tenantId,
    req.userId,
    req.tenantMembership.role
  );

  return successResponse(res, {
    message: "Permissions retrieved successfully",
    data: permissions,
  });
});

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

export const listPermissionsController = asyncHandler(async (req, res) => {
  const permissions = await rbacRepository.findAllPermissions();
  return successResponse(res, {
    message: "Permissions retrieved successfully",
    data: permissions,
  });
});

export const listRolesController = asyncHandler(async (req, res) => {
  const roles = await rbacService.listRoles();
  return successResponse(res, {
    message: "Roles retrieved successfully",
    data: roles,
  });
});

export const getRoleController = asyncHandler(async (req, res) => {
  const role = await rbacService.getRole(req.params.id);
  return successResponse(res, {
    message: "Role retrieved successfully",
    data: role,
  });
});

export const createRoleController = asyncHandler(async (req, res) => {
  const role = await rbacService.createRole(req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Role created successfully",
    data: role,
  });
});

export const updateRoleController = asyncHandler(async (req, res) => {
  const role = await rbacService.updateRole(req.params.id, req.body);
  return successResponse(res, {
    message: "Role updated successfully",
    data: role,
  });
});

export const deleteRoleController = asyncHandler(async (req, res) => {
  await rbacService.deleteRole(req.params.id);
  return successResponse(res, {
    message: "Role deleted successfully",
  });
});

export const updateRolePermissionsController = asyncHandler(async (req, res) => {
  const result = await rbacService.updateRolePermissions(req.params.id, req.body.permissionIds);
  return successResponse(res, {
    message: "Role permissions updated successfully",
    data: result,
  });
});

export const listTenantUsersController = asyncHandler(async (req, res) => {
  const users = await rbacService.listTenantUsers(req.tenantId);
  return successResponse(res, {
    message: "Tenant users retrieved successfully",
    data: users,
  });
});

export const updateUserRoleController = asyncHandler(async (req, res) => {
  const result = await rbacService.updateUserRole(req.tenantId, req.params.userId, req.body.roleId);
  return successResponse(res, {
    message: "User role updated successfully",
    data: result,
  });
});
