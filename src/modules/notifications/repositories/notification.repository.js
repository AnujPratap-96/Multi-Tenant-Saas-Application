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

export const listNotifications = async (tenantId, userId, { page, limit, unreadOnly }) => {
  const where = { tenantId, userId };
  if (unreadOnly) where.readAt = null;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
  return { items, total, page, limit, unreadCount: await getUnreadCount(tenantId, userId) };
};

export const getUnreadCount = (tenantId, userId) => {
  return prisma.notification.count({
    where: { tenantId, userId, readAt: null },
  });
};

export const markRead = async (tenantId, userId, notificationId) => {
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
  const result = await prisma.notification.updateMany({
    where: { tenantId, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
};
