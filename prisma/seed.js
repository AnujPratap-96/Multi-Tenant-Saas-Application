import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Roles & Permissions...");

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

  console.log("✓ RBAC Seeded (23 permissions, 3 system roles)");

  /*
   DEFAULT TENANT & ACCOUNTS
  */
  console.log("🌱 Seeding Default Accounts & Tenant...");
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Admin User (Owner)
  const adminUser = await prisma.user.upsert({
    where: { email: "officialthakur94@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "officialthakur94@gmail.com",
      firstName: "Anuj",
      lastName: "Pratap",
      displayName: "Anuj Pratap",
      password: defaultPasswordHash,
      emailVerified: true,
      bio: "Founder & Cloud Solutions Architect",
    },
  });

  // 2. Manager User (Friend)
  const managerUser = await prisma.user.upsert({
    where: { email: "thakurajsingh9@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "thakurajsingh9@gmail.com",
      firstName: "Ajay",
      lastName: "Singh",
      displayName: "Ajay Singh",
      password: defaultPasswordHash,
      emailVerified: true,
      bio: "Technical Operations Manager",
    },
  });

  // 3. Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: "webkul" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: "Webkul",
        slug: "webkul",
        plan: "ENTERPRISE",
        ownerUserId: adminUser.id,
        isActive: true,
      },
    });
  }

  // 4. Tenant Memberships
  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: adminUser.id } },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: managerUser.id } },
    update: { role: "MANAGER", status: "ACTIVE" },
    create: {
      tenantId: tenant.id,
      userId: managerUser.id,
      role: "MANAGER",
      status: "ACTIVE",
      invitedById: adminUser.id,
    },
  });

  // 5. Default Department
  let dept = await prisma.department.findFirst({
    where: { tenantId: tenant.id, name: "Engineering & Cloud" },
  });

  if (!dept) {
    dept = await prisma.department.create({
      data: {
        tenantId: tenant.id,
        name: "Engineering & Cloud",
        description: "Core architecture, API platforms, and distributed microservices",
        managerId: adminUser.id,
        createdById: adminUser.id,
      },
    });

    await prisma.departmentMember.createMany({
      data: [
        { departmentId: dept.id, userId: adminUser.id, role: "MANAGER" },
        { departmentId: dept.id, userId: managerUser.id, role: "LEAD" },
      ],
      skipDuplicates: true,
    });
  }

  // 6. Default Project
  let project = await prisma.project.findFirst({
    where: { tenantId: tenant.id, name: "SaaS Multi-Tenant Core" },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: "SaaS Multi-Tenant Core",
        description: "Next-generation enterprise workspace platform",
        createdById: adminUser.id,
      },
    });

    await prisma.projectDepartment.create({
      data: {
        projectId: project.id,
        departmentId: dept.id,
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: adminUser.id, role: "OWNER" },
        { projectId: project.id, userId: managerUser.id, role: "MAINTAINER" },
      ],
      skipDuplicates: true,
    });
  }

  // 7. Default Task
  const existingTask = await prisma.task.findFirst({
    where: { projectId: project.id },
  });

  if (!existingTask) {
    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        title: "Initialize Secure Multi-Tenant Architecture",
        description: "Verify isolated tenant data segregation, JWT lifecycle, and audit logs.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdById: adminUser.id,
        assignees: {
          create: [{ userId: adminUser.id }, { userId: managerUser.id }],
        },
      },
    });
  }

  console.log("✓ Seed Completed successfully!");
  console.log(`  Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`  Admin: ${adminUser.email} (Role: ADMIN)`);
  console.log(`  Manager: ${managerUser.email} (Role: MANAGER)`);
  console.log(`  Department: ${dept.name}`);
  console.log(`  Project: ${project.name}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
