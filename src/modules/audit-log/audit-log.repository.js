import prisma from '../../lib/prisma.js';

export const createAuditLog = async (data) => {
  return prisma.auditLog.create({
    data: {
      actorUserId: data.actorUserId || data.userId,
      subjectUserId: data.subjectUserId,
      tenantId: data.tenantId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      oldValue: data.oldValue,
      newValue: data.newValue,
    },
  });
};

export const listAuditLogsByTenant = async (tenantId, { page = 1, limit = 20, entityType, action, actorUserId }) => {
  const skip = (page - 1) * limit;
  const where = { tenantId };

  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (actorUserId) where.actorUserId = actorUserId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        subject: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
