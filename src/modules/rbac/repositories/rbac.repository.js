// RBAC repository - Database operations for roles and permissions
import prisma from "../../../lib/prisma.js";

/**
 * Permission CRUD
 */
export const findAllPermissions = async () => {
  return await prisma.permission.findMany();
};

export const findPermissionById = async (id) => {
  return await prisma.permission.findUnique({ where: { id } });
};

/**
 * Role-Based Permissions
 */
export const findPermissionsByRole = async (role) => {
  return await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });
};

export const assignPermissionToRole = async (role, permissionId) => {
  return await prisma.rolePermission.upsert({
    where: { role_permissionId: { role, permissionId } },
    update: {},
    create: { role, permissionId },
  });
};

/**
 * User-Specific Tenant Permissions
 */
export const findUserTenantPermissions = async (tenantId, userId) => {
  return await prisma.tenantUserPermission.findMany({
    where: { tenantId, userId },
    include: { permission: true },
  });
};

export const upsertUserTenantPermission = async (tenantId, userId, permissionId, isAllowed = true) => {
  return await prisma.tenantUserPermission.upsert({
    where: {
      tenantId_userId_permissionId: { tenantId, userId, permissionId },
    },
    update: { isAllowed },
    create: { tenantId, userId, permissionId, isAllowed },
  });
};

export const removeUserTenantPermission = async (tenantId, userId, permissionId) => {
  return await prisma.tenantUserPermission.delete({
    where: {
      tenantId_userId_permissionId: { tenantId, userId, permissionId },
    },
  });
};

/**
 * Check permission (Combined Role + User overrides)
 */
export const checkUserPermission = async (tenantId, userId, role, resource, action) => {
  // 1. Check user-specific overrides first
  const specificPermission = await prisma.tenantUserPermission.findFirst({
    where: {
      tenantId,
      userId,
      permission: { resource, action },
    },
  });

  if (specificPermission !== null) {
    return specificPermission.isAllowed;
  }

  // 2. Check role-based permissions
  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      role,
      permission: { resource, action },
    },
  });

  return rolePermission !== null;
};
