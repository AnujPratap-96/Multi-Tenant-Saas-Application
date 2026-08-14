import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  /*
   PERMISSIONS
  */
  const permissions = [
    { resource: "project", action: "create" },
    { resource: "project", action: "update" },
    { resource: "project", action: "delete" },
    { resource: "project", action: "view" },
    { resource: "project", action: "archive" },
    { resource: "task", action: "create" },
    { resource: "task", action: "update" },
    { resource: "task", action: "delete" },
    { resource: "task", action: "view" },
    { resource: "task", action: "assign" },
    { resource: "comment", action: "create" },
    { resource: "comment", action: "delete" },
    { resource: "user", action: "create" },
    { resource: "user", action: "update" },
    { resource: "user", action: "delete" },
    { resource: "user", action: "view" },
    { resource: "user", action: "invite" },
    { resource: "user", action: "remove" },
    { resource: "user", action: "deactivate" },
    { resource: "rbac", action: "view" },
    { resource: "rbac", action: "manage" },
    { resource: "audit", action: "view" },
    { resource: "tenant", action: "manage" },
  ];

  const permissionRecords = [];

  for (const p of permissions) {
    const record = await prisma.permission.upsert({
      where: { name: `${p.resource}.${p.action}` },
      update: {},
      create: {
        name: `${p.resource}.${p.action}`,
        resource: p.resource,
        action: p.action,
      },
    });
    permissionRecords.push(record);
  }

  /*
   ROLES
  */
  const roles = {
    ADMIN: await prisma.roleDefinition.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { id: 'sys-admin', name: 'ADMIN', description: 'Full access to all resources', isSystem: true },
    }),
    MANAGER: await prisma.roleDefinition.upsert({
      where: { name: 'MANAGER' },
      update: {},
      create: { id: 'sys-manager', name: 'MANAGER', description: 'Can manage projects and tasks', isSystem: true },
    }),
    USER: await prisma.roleDefinition.upsert({
      where: { name: 'USER' },
      update: {},
      create: { id: 'sys-user', name: 'USER', description: 'Basic view-only access', isSystem: true },
    }),
  };

  /*
   ROLE PERMISSIONS
  */
  const MANAGER_ADMIN_RESOURCES = new Set(["rbac", "audit"]);

  for (const permission of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.ADMIN.id, permissionId: permission.id } },
      update: {},
      create: { roleId: roles.ADMIN.id, permissionId: permission.id },
    });

    if ((permission.resource !== "user" || permission.action === "view")
      && (permission.resource === "project" || permission.resource === "task"
        || permission.resource === "comment"
        || (MANAGER_ADMIN_RESOURCES.has(permission.resource) && permission.action === "view"))) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.MANAGER.id, permissionId: permission.id } },
        update: {},
        create: { roleId: roles.MANAGER.id, permissionId: permission.id },
      });
    }

    if ((permission.action === "view"
      && (permission.resource === "project" || permission.resource === "task" || permission.resource === "user"))
      || (permission.resource === "comment" && permission.action === "create")) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles.USER.id, permissionId: permission.id } },
        update: {},
        create: { roleId: roles.USER.id, permissionId: permission.id },
      });
    }
  }

  console.log("RBAC Seed Done");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
