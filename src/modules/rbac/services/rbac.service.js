// RBAC service - Business logic for permissions
import * as rbacRepository from "../repositories/rbac.repository.js";
import { ApiError } from "../../../utils/api-error.js";

/**
 * Check if user has permission
 */
export const checkPermission = async (tenantId, userId, role, resource, action) => {
  // Admin by default has all permissions (you can change this logic)
  if (role === 'ADMIN') return true;

  return await rbacRepository.checkUserPermission(tenantId, userId, role, resource, action);
};

/**
 * Get all permissions for a user in a tenant
 */
export const getUserPermissions = async (tenantId, userId, role) => {
  const [rolePermissions, userOverrides] = await Promise.all([
    rbacRepository.findPermissionsByRole(role),
    rbacRepository.findUserTenantPermissions(tenantId, userId),
  ]);

  // Aggregate: start with role permissions, then apply overrides
  const permissionsMap = new Map();
  
  rolePermissions.forEach(rp => {
    permissionsMap.set(`${rp.permission.resource}:${rp.permission.action}`, {
      ...rp.permission,
      source: 'ROLE'
    });
  });

  userOverrides.forEach(uo => {
    const key = `${uo.permission.resource}:${uo.permission.action}`;
    if (uo.isAllowed) {
      permissionsMap.set(key, { ...uo.permission, source: 'USER_OVERRIDE' });
    } else {
      permissionsMap.delete(key);
    }
  });

  return Array.from(permissionsMap.values());
};

/**
 * Assign permission to a specific user in a tenant
 */
export const assignUserPermission = async (tenantId, userId, permissionId, isAllowed) => {
  return await rbacRepository.upsertUserTenantPermission(tenantId, userId, permissionId, isAllowed);
};
