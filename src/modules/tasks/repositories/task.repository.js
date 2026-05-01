// Task repository - Database operations for tasks
import prisma from "../../../lib/prisma.js";

/**
 * Task CRUD
 */
export const createTask = async (data) => {
  return await prisma.task.create({
    data,
    include: {
      assignees: { include: { user: true } },
    },
  });
};

export const findTaskById = async (id, tenantId) => {
  return await prisma.task.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      assignees: {
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      createdBy: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      project: { select: { id: true, name: true } },
    },
  });
};

export const listTasksByProject = async (projectId, tenantId, { page = 1, limit = 20, status, priority, search }) => {
  const skip = (page - 1) * limit;
  const where = {
    projectId,
    tenantId,
    deletedAt: null,
  };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const updateTask = async (id, data) => {
  return await prisma.task.update({
    where: { id },
    data,
  });
};

export const softDeleteTask = async (id) => {
  return await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

/**
 * Assignee Operations
 */
export const addAssignee = async (taskId, userId) => {
  return await prisma.taskAssignee.create({
    data: { taskId, userId },
  });
};

export const removeAssignee = async (taskId, userId) => {
  return await prisma.taskAssignee.delete({
    where: { taskId_userId: { taskId, userId } },
  });
};

/**
 * Comment Operations
 */
export const createComment = async (data) => {
  return await prisma.taskComment.create({
    data,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
};

export const listComments = async (taskId) => {
  return await prisma.taskComment.findMany({
    where: { taskId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
};

export const deleteComment = async (commentId) => {
  return await prisma.taskComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
};
