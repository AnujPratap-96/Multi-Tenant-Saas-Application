import prisma from "../../../lib/prisma.js";

const computeMinutes = (startedAt, endedAt) => {
  if (!startedAt || !endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 60000);
};

export const createTimeEntry = async ({
  tenantId,
  userId,
  taskId,
  startedAt,
  endedAt,
  description,
}) => {
  const start = startedAt ? new Date(startedAt) : new Date();
  const end = endedAt ? new Date(endedAt) : null;
  return prisma.timeEntry.create({
    data: {
      tenantId,
      userId,
      taskId,
      startedAt: start,
      endedAt: end,
      durationMinutes: computeMinutes(start, end),
      description: description ?? null,
    },
    select: {
      id: true,
      tenantId: true,
      taskId: true,
      userId: true,
      startedAt: true,
      endedAt: true,
      durationMinutes: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findTimeEntryById = async (entryId, tenantId) => {
  return prisma.timeEntry.findFirst({
    where: { id: entryId, tenantId, deletedAt: null },
    include: { task: { select: { id: true, title: true, tenantId: true } } },
  });
};

export const stopTimeEntry = async (entryId, tenantId, userId) => {
  const existing = await prisma.timeEntry.findFirst({
    where: { id: entryId, tenantId, userId, deletedAt: null },
  });
  if (!existing) return null;
  const end = new Date();
  return prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      endedAt: end,
      durationMinutes: computeMinutes(existing.startedAt, end),
    },
    select: {
      id: true,
      taskId: true,
      userId: true,
      startedAt: true,
      endedAt: true,
      durationMinutes: true,
      description: true,
    },
  });
};

export const updateTimeEntry = async (entryId, tenantId, data) => {
  const { startedAt, endedAt, description } = data;
  const existing = await prisma.timeEntry.findFirst({
    where: { id: entryId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const start = startedAt ? new Date(startedAt) : existing.startedAt;
  const end =
    endedAt === undefined ? existing.endedAt : endedAt ? new Date(endedAt) : null;

  return prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      startedAt: start,
      endedAt: end,
      durationMinutes: computeMinutes(start, end),
      description:
        description === undefined ? existing.description : description ?? null,
    },
    select: {
      id: true,
      taskId: true,
      userId: true,
      startedAt: true,
      endedAt: true,
      durationMinutes: true,
      description: true,
    },
  });
};

export const softDeleteTimeEntry = async (entryId, tenantId) => {
  return prisma.timeEntry.update({
    where: { id: entryId },
    data: { deletedAt: new Date() },
  });
};

export const listTaskTimeEntries = async (taskId, tenantId, { page, limit }) => {
  const where = { taskId, tenantId, deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.timeEntry.count({ where }),
  ]);
  return { items, total, page, limit };
};

export const listUserTimeEntries = async (userId, tenantId, { page, limit }) => {
  const where = { userId, tenantId, deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        taskId: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.timeEntry.count({ where }),
  ]);
  return { items, total, page, limit };
};
