// Department repository - DB operations for departments
import prisma from "../../../lib/prisma.js";

export const createDepartment = async ({ tenantId, name, description, managerId, createdById }) => {
  return prisma.department.create({
    data: {
      tenantId,
      name,
      description,
      managerId,
      createdById,
      members: {
        create: { userId: managerId, role: "MANAGER" },
      },
    },
    include: {
      manager: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } } } },
    },
  });
};

export const findDepartmentById = async (id, tenantId) => {
  return prisma.department.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      manager: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
};

export const findDepartmentByName = async (tenantId, name) => {
  return prisma.department.findFirst({
    where: { tenantId, name, deletedAt: null },
  });
};

export const listDepartments = async (tenantId, { page = 1, limit = 20, search = "", idFilter = null } = {}) => {
  const skip = (page - 1) * limit;
  const where = { tenantId, deletedAt: null };
  if (idFilter) where.id = { in: idFilter };
  if (search) where.name = { contains: search, mode: "insensitive" };
  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        manager: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.department.count({ where }),
  ]);
  return { departments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const updateDepartment = async (id, data) => {
  return prisma.department.update({
    where: { id },
    data,
    include: {
      manager: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
};

export const softDeleteDepartment = async (id) => {
  return prisma.department.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// Members
export const addDepartmentMember = async (departmentId, userId, role = "MEMBER") => {
  return prisma.departmentMember.upsert({
    where: { departmentId_userId: { departmentId, userId } },
    update: { role, removedAt: null },
    create: { departmentId, userId, role },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
};

export const findDepartmentMember = async (departmentId, userId) => {
  return prisma.departmentMember.findUnique({
    where: { departmentId_userId: { departmentId, userId } },
  });
};

export const listDepartmentMembers = async (departmentId, { page = 1, limit = 20, search = "" } = {}) => {
  const skip = (page - 1) * limit;
  const where = { departmentId, removedAt: null };
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  const [members, total] = await Promise.all([
    prisma.departmentMember.findMany({
      where,
      skip,
      take: limit,
      orderBy: { addedAt: "asc" },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, homeDepartment: { select: { id: true, name: true } } } },
      },
    }),
    prisma.departmentMember.count({ where }),
  ]);
  return { members, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const removeDepartmentMember = async (departmentId, userId) => {
  return prisma.departmentMember.update({
    where: { departmentId_userId: { departmentId, userId } },
    data: { removedAt: new Date() },
  });
};

export const getUserDepartmentIds = async (tenantId, userId) => {
  const rows = await prisma.departmentMember.findMany({
    where: { userId, removedAt: null, department: { tenantId, deletedAt: null } },
    select: { departmentId: true },
  });
  return rows.map((r) => r.departmentId);
};

export const isDepartmentManager = async (tenantId, userId, departmentId) => {
  const dept = await prisma.department.findFirst({
    where: { id: departmentId, tenantId, deletedAt: null },
    select: { managerId: true },
  });
  if (dept && dept.managerId === userId) return true;
  const member = await prisma.departmentMember.findFirst({
    where: { departmentId, userId, role: "MANAGER", removedAt: null },
    select: { departmentId: true },
  });
  return !!member;
};

export const isDepartmentMember = async (tenantId, userId, departmentId) => {
  const member = await prisma.departmentMember.findFirst({
    where: { departmentId, userId, removedAt: null, department: { tenantId, deletedAt: null } },
    select: { departmentId: true },
  });
  return !!member;
};

// TaskType
export const createTaskType = async ({ tenantId, name, description, departmentId }) => {
  return prisma.taskType.create({
    data: { tenantId, name, description, departmentId },
  });
};

export const findTaskTypeById = async (id, tenantId) => {
  return prisma.taskType.findFirst({ where: { id, tenantId } });
};

export const listTaskTypes = async (tenantId) => {
  return prisma.taskType.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
};

export const updateTaskType = async (id, data) => {
  return prisma.taskType.update({ where: { id }, data });
};

export const deleteTaskType = async (id) => {
  return prisma.taskType.delete({ where: { id } });
};
