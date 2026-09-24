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
      project: {
        select: {
          id: true,
          name: true,
          departments: { select: { departmentId: true } },
          members: { select: { userId: true, role: true, removedAt: true } },
        },
      },
      departments: {
        include: { department: { select: { id: true, name: true } } },
      },
    },
  });
};

export const createTaskDepartments = async (taskId, departmentIds) => {
  if (!departmentIds || !departmentIds.length) return [];
  return await prisma.taskDepartment.createMany({
    data: departmentIds.map((departmentId) => ({ taskId, departmentId })),
  });
};

export const listMyTasks = async (tenantId, userId, { page = 1, limit = 20, status, priority, search } = {}) => {
  const skip = (page - 1) * limit;
  const where = {
    tenantId,
    deletedAt: null,
    assignees: { some: { userId, removedAt: null } },
  };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        assignees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        project: { select: { id: true, name: true } },
        departments: { include: { department: { select: { id: true, name: true } } } },
      },
    }),
    prisma.task.count({ where }),
  ]);
  return {
    tasks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const listTasksByProject = async (projectId, tenantId, { page = 1, limit = 20, status, priority, search } = {}) => {
  const pageNum = Number.isFinite(page) && page > 0 ? page : 1;
  const limitNum = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const skip = (pageNum - 1) * limitNum;
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
      take: limitNum,
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
export const addAssignee = async (taskId, userId, assignedById = null, reason = null) => {
  return await prisma.taskAssignee.upsert({
    where: { taskId_userId: { taskId, userId } },
    update: { removedAt: null, assignedById, reason },
    create: { taskId, userId, assignedById, reason },
  });
};

export const removeAssignee = async (taskId, userId, reason = null) => {
  return await prisma.taskAssignee.update({
    where: { taskId_userId: { taskId, userId } },
    data: { removedAt: new Date(), reason },
  });
};

export const writeTaskActivity = async (data) => {
  return prisma.taskActivity.create({ data });
};

export const writeDeadlineHistory = async (data) => {
  return prisma.taskDeadlineHistory.create({ data });
};

/**
 * Comment Operations
 */
export const createComment = async (data) => {
  return await prisma.taskComment.create({
    data,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentions: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
};

export const createCommentMentions = async (commentId, userIds) => {
  if (!userIds || !userIds.length) return [];
  return prisma.taskCommentMention.createMany({
    data: userIds.map((userId) => ({ taskCommentId: commentId, userId })),
  });
};

export const listComments = async (taskId) => {
  return await prisma.taskComment.findMany({
    where: { taskId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentions: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      replies: {
        where: { deletedAt: null },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      },
    },
  });
};

export const findCommentById = async (commentId) => {
  return await prisma.taskComment.findFirst({
    where: { id: commentId, deletedAt: null },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      mentions: { select: { userId: true } },
    },
  });
};

export const updateComment = async (commentId, comment) => {
  return prisma.taskComment.update({
    where: { id: commentId },
    data: { comment, editedAt: new Date() },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentions: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  });
};

export const deleteComment = async (commentId) => {
  return await prisma.taskComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
};

export const listTaskActivity = async (taskId, tenantId, { page = 1, limit = 30 } = {}) => {
  const where = { taskId, tenantId };
  const [items, total] = await Promise.all([
    prisma.taskActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { actor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    }),
    prisma.taskActivity.count({ where }),
  ]);
  return { items, total, page, limit };
};
