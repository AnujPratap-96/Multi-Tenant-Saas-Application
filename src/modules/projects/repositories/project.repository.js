// Project repository - Database operations for projects
import prisma from "../../../lib/prisma.js";

/**
 * Create a project with owner
 */
export const createProjectWithOwner = async ({ name, description, tenantId, createdById }) => {
  return await prisma.project.create({
    data: {
      name,
      description,
      tenantId,
      createdById,
      members: {
        create: {
          userId: createdById,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: true,
    },
  });
};

/**
 * Find project by ID and tenant
 */
export const findProjectById = async (id, tenantId) => {
  return await prisma.project.findFirst({
    where: {
      id,
      tenantId,
      deletedAt: null,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
      departments: { select: { departmentId: true } },
    },
  });
};

export const createProjectDepartments = async (projectId, departmentIds) => {
  if (!departmentIds || !departmentIds.length) return [];
  return await prisma.projectDepartment.createMany({
    data: departmentIds.map((departmentId) => ({ projectId, departmentId })),
  });
};

/**
 * List projects for a tenant
 */
export const listProjectsByTenant = async (tenantId, { page = 1, limit = 20, search = '', isArchived = false, scoped = null }) => {
  const skip = (page - 1) * limit;
  const where = {
    tenantId,
    deletedAt: null,
    isArchived,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Department-scoped visibility (non-admin): member of project OR manager of one of its departments
  if (scoped && scoped.managedDeptIds && scoped.managedDeptIds.length) {
    where.OR = [
      { members: { some: { userId: scoped.userId, removedAt: null } } },
      { departments: { some: { departmentId: { in: scoped.managedDeptIds } } } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true, tasks: true },
        },
        departments: { select: { departmentId: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update project
 */
export const updateProject = async (id, data) => {
  return await prisma.project.update({
    where: { id },
    data,
  });
};

/**
 * Soft delete project
 */
export const softDeleteProject = async (id) => {
  return await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

/**
 * Add member to project (B-21: upsert so re-adding a removed member reactivates)
 */
export const addProjectMember = async (projectId, userId, role = 'MEMBER') => {
  return await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId, userId },
    },
    update: {
      role,
      removedAt: null,
    },
    create: {
      projectId,
      userId,
      role,
    },
  });
};

/**
 * Remove member from project (soft delete via removedAt)
 */
export const removeProjectMember = async (projectId, userId) => {
  return await prisma.projectMember.update({
    where: {
      projectId_userId: { projectId, userId },
    },
    data: {
      removedAt: new Date(),
    },
  });
};

/**
 * Check if user is project member
 */
export const getProjectMembership = async (projectId, userId) => {
  return await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
};

/**
 * Update project member role
 */
export const updateProjectMemberRole = async (projectId, userId, role) => {
  return await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });
};

/**
 * Get project dashboard stats
 */
export const getProjectDashboardStats = async (projectId, tenantId) => {
  const [memberCount, taskCounts] = await Promise.all([
    prisma.projectMember.count({ where: { projectId, removedAt: null } }),
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId, tenantId, deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const taskStats = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  taskCounts.forEach((t) => { taskStats[t.status] = t._count.id; });

  return {
    memberCount,
    taskStats,
    totalTasks: Object.values(taskStats).reduce((a, b) => a + b, 0),
  };
};

/**
 * List active project members with user info
 */
export const listProjectMembers = async (projectId) => {
  return await prisma.projectMember.findMany({
    where: {
      projectId,
      removedAt: null,
    },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
    orderBy: { addedAt: 'asc' },
  });
};
