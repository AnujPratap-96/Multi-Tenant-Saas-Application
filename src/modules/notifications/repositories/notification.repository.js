import prisma from "../../../lib/prisma.js";

export const createNotification = async ({
  tenantId,
  userId,
  type,
  entityType = null,
  entityId = null,
  message,
  data = null,
}) => {
  return prisma.notification.create({
    data: {
      tenantId,
      userId,
      type,
      entityType,
      entityId,
      message,
      data,
    },
    select: {
      id: true,
      tenantId: true,
      userId: true,
      type: true,
      entityType: true,
      entityId: true,
      message: true,
      data: true,
      readAt: true,
      createdAt: true,
    },
  });
};

export const listNotifications = async (tenantId, userId, { page = 1, limit = 25, unreadOnly } = {}) => {
  if (!tenantId || !userId) {
    return { items: [], total: 0, page: 1, limit: 25, unreadCount: 0 };
  }
  const where = { tenantId, userId };
  if (unreadOnly) where.readAt = null;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 25;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true,
        type: true,
        entityType: true,
        entityId: true,
        message: true,
        data: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, total, page: pageNum, limit: limitNum, unreadCount: await getUnreadCount(tenantId, userId) };
};

export const getUnreadCount = (tenantId, userId) => {
  if (!tenantId || !userId) return 0;
  return prisma.notification.count({
    where: { tenantId, userId, readAt: null },
  });
};

export const markRead = async (tenantId, userId, notificationId) => {
  if (!tenantId || !userId || !notificationId) return null;
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, tenantId, userId },
  });
  if (!existing) return null;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
    select: { id: true, readAt: true },
  });
};

export const markAllRead = async (tenantId, userId) => {
  if (!tenantId || !userId) return { updated: 0 };
  const result = await prisma.notification.updateMany({
    where: { tenantId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
};
