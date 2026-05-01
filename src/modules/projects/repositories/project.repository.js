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
    },
  });
};

/**
 * List projects for a tenant
 */
export const listProjectsByTenant = async (tenantId, { page = 1, limit = 20, search = '', isArchived = false }) => {
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
 * Add member to project
 */
export const addProjectMember = async (projectId, userId, role = 'MEMBER') => {
  return await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role,
    },
  });
};

/**
 * Remove member from project
 */
export const removeProjectMember = async (projectId, userId) => {
  return await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
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
