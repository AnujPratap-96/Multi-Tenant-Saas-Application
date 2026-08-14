import prisma from "../../../lib/prisma.js";
import * as rbacRepository from "../repositories/rbac.repository.js";
import { ApiError } from "../../../utils/api-error.js";
import { invalidateMembershipCache } from "../../tenant/redis/tenant.redis.js";

const ENUM_ROLES = ['ADMIN', 'MANAGER', 'USER'];

export const checkPermission = async (tenantId, userId, role, resource, action) => {
  if (role === 'ADMIN') return true;
  return await rbacRepository.checkUserPermission(tenantId, userId, role, resource, action);
};

export const getUserPermissions = async (tenantId, userId, role) => {
  // Roles are referenced by name in membership records; role ids are sys-* seeds
  const roleRecord = await rbacRepository.findRoleByName(role);
  let rolePermissions = [];
  if (roleRecord) {
    rolePermissions = roleRecord.rolePermissions.map((rp) => rp.permission);
  } else {
    const rolePerms = await rbacRepository.findPermissionsByRoleId(role);
    rolePermissions = rolePerms.map((rp) => rp.permission);
  }

  const userOverrides = await rbacRepository.findUserTenantPermissions(tenantId, userId);

  const permissionsMap = new Map();
  rolePermissions.forEach((perm) => {
    permissionsMap.set(`${perm.resource}:${perm.action}`, { ...perm, source: 'ROLE' });
  });

  userOverrides.forEach((uo) => {
    const key = `${uo.permission.resource}:${uo.permission.action}`;
    if (uo.isAllowed) {
      permissionsMap.set(key, { ...uo.permission, source: 'USER_OVERRIDE' });
    } else {
      permissionsMap.delete(key);
    }
  });

  return Array.from(permissionsMap.values());
};

export const getMyPermissions = async (tenantId, userId, role) => {
  const permissions = await getUserPermissions(tenantId, userId, role);
  return {
    role,
    permissions: permissions.map((p) => `${p.resource}:${p.action}`),
    permissionDetails: permissions,
  };
};

export const assignUserPermission = async (tenantId, userId, permissionId, isAllowed) => {
  return await rbacRepository.upsertUserTenantPermission(tenantId, userId, permissionId, isAllowed);
};

export const listRoles = async () => {
  return await rbacRepository.findAllRoles();
};

export const getRole = async (id) => {
  const role = await rbacRepository.findRoleById(id);
  if (!role) throw new ApiError(404, "Role not found");
  return role;
};

export const createRole = async (data) => {
  const existing = await rbacRepository.findRoleById(data.name);
  if (existing) throw new ApiError(400, "A role with this name already exists");
  return await rbacRepository.createRole(data);
};

export const updateRole = async (id, data) => {
  const role = await rbacRepository.findRoleById(id);
  if (!role) throw new ApiError(404, "Role not found");
  if (role.isSystem) throw new ApiError(400, "Cannot modify system roles");
  return await rbacRepository.updateRole(id, data);
};

export const deleteRole = async (id) => {
  const role = await rbacRepository.findRoleById(id);
  if (!role) throw new ApiError(404, "Role not found");
  if (role.isSystem) throw new ApiError(400, "Cannot delete system roles");
  return await rbacRepository.deleteRole(id);
};

export const updateRolePermissions = async (roleId, permissionIds) => {
  const role = await rbacRepository.findRoleById(roleId);
  if (!role) throw new ApiError(404, "Role not found");
  return await rbacRepository.setRolePermissions(roleId, permissionIds);
};

export const listTenantUsers = async (tenantId) => {
  return await rbacRepository.findTenantUsersWithRoles(tenantId);
};

export const updateUserRole = async (tenantId, userId, newRole) => {
  // D-13/S-24: only enum-validated roles; never write a RoleDefinition name into the enum column
  if (!ENUM_ROLES.includes(newRole)) {
    throw new ApiError(400, "Invalid role");
  }
  const updated = await prisma.tenantUser.update({
    where: { tenantId_userId: { tenantId, userId } },
    data: { role: newRole },
  });
  await invalidateMembershipCache(tenantId, userId);
  return updated;
};
