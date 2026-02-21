import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  /*
   PERMISSIONS
  */
  const permissions = [
    // PROJECT
    { resource: "project", action: "create" },
    { resource: "project", action: "update" },
    { resource: "project", action: "delete" },
    { resource: "project", action: "view" },

    // TASK
    { resource: "task", action: "create" },
    { resource: "task", action: "update" },
    { resource: "task", action: "delete" },
    { resource: "task", action: "view" },

    // USER / TENANT MEMBERS
    { resource: "user", action: "create" },
    { resource: "user", action: "update" },
    { resource: "user", action: "delete" },
    { resource: "user", action: "view" },
    { resource: "user", action: "invite" },
    { resource: "user", action: "remove" },
  ];

  const permissionRecords = [];

  /*
   CREATE PERMISSIONS
  */
  for (const p of permissions) {
    const record = await prisma.permission.upsert({
      where: {
        name: `${p.resource}.${p.action}`,
      },
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
   ROLE PERMISSIONS
  */
  for (const permission of permissionRecords) {

    /*
     ADMIN → all
    */
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: Role.ADMIN,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        role: Role.ADMIN,
        permissionId: permission.id,
      },
    });

    /*
     MANAGER → project/task + user.view
    */
    if (
      permission.resource !== "user" ||
      permission.action === "view"
    ) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: Role.MANAGER,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: Role.MANAGER,
          permissionId: permission.id,
        },
      });
    }

    /*
     USER → only view
    */
    if (permission.action === "view") {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role: Role.USER,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          role: Role.USER,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("RBAC Seed Done");
}

/*
 CALL MAIN (outside function)
*/
main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });