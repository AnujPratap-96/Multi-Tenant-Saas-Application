import prisma from "../../../lib/prisma.js";

export const findAllPermissions = async () => {
  return await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
};

export const findAllRoles = async () => {
  return await prisma.roleDefinition.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
};

export const findRoleById = async (id) => {
  return await prisma.roleDefinition.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
};

export const findRoleByName = async (name) => {
  return await prisma.roleDefinition.findUnique({
    where: { name },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
  });
};

export const createRole = async (data) => {
  return await prisma.roleDefinition.create({
    data: {
      name: data.name,
      description: data.description,
      isSystem: false,
    },
  });
};

export const updateRole = async (id, data) => {
  return await prisma.roleDefinition.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

export const deleteRole = async (id) => {
  await prisma.rolePermission.deleteMany({ where: { roleId: id } });
  return await prisma.roleDefinition.delete({ where: { id } });
};

export const findPermissionsByRoleId = async (roleId) => {
  return await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
};

export const assignPermissionToRole = async (roleId, permissionId) => {
  return await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId } },
    update: {},
    create: { roleId, permissionId },
  });
};

export const removePermissionFromRole = async (roleId, permissionId) => {
  return await prisma.rolePermission.delete({
    where: { roleId_permissionId: { roleId, permissionId } },
  });
};

export const setRolePermissions = async (roleId, permissionIds) => {
  const existing = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permissionId: true },
  });
  const existingIds = existing.map((rp) => rp.permissionId);

  const toAdd = permissionIds.filter((pid) => !existingIds.includes(pid));
  const toRemove = existingIds.filter((pid) => !permissionIds.includes(pid));

  await Promise.all([
    ...toAdd.map((permissionId) =>
      prisma.rolePermission.create({ data: { roleId, permissionId } })
    ),
    ...toRemove.map((permissionId) =>
      prisma.rolePermission.delete({
        where: { roleId_permissionId: { roleId, permissionId } },
      })
    ),
  ]);

  return await findPermissionsByRoleId(roleId);
};

export const findUserTenantPermissions = async (tenantId, userId) => {
  return await prisma.tenantUserPermission.findMany({
    where: { tenantId, userId },
    include: { permission: true },
  });
};

export const upsertUserTenantPermission = async (tenantId, userId, permissionId, isAllowed = true) => {
  return await prisma.tenantUserPermission.upsert({
    where: { tenantId_userId_permissionId: { tenantId, userId, permissionId } },
    update: { isAllowed },
    create: { tenantId, userId, permissionId, isAllowed },
  });
};

export const removeUserTenantPermission = async (tenantId, userId, permissionId) => {
  return await prisma.tenantUserPermission.delete({
    where: { tenantId_userId_permissionId: { tenantId, userId, permissionId } },
  });
};

export const checkUserPermission = async (tenantId, userId, role, resource, action) => {
  const specificPermission = await prisma.tenantUserPermission.findFirst({
    where: { tenantId, userId, permission: { resource, action } },
  });

  if (specificPermission !== null) {
    return specificPermission.isAllowed;
  }

  const roleRecord = await prisma.roleDefinition.findUnique({ where: { name: role } });
  if (!roleRecord) return false;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: {
      roleId: roleRecord.id,
      permission: { resource, action },
    },
  });

  return rolePermission !== null;
};

export const findTenantUsersWithRoles = async (tenantId) => {
  const members = await prisma.tenantUser.findMany({
    where: { tenantId, status: { not: 'REMOVED' } },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const roleRecords = await prisma.roleDefinition.findMany();
  const roleMap = Object.fromEntries(roleRecords.map((r) => [r.name, r]));

  return members.map((m) => ({
    ...m,
    roleDefinition: roleMap[m.role] || null,
  }));
};
