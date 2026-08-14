import prisma from '../../lib/prisma.js';
import { logAudit } from '../../lib/audit.logger.js';

// D-1: thin alias over the single audit entry point (lib/audit.logger.js)
export const createAuditLog = async (data) => {
  await logAudit({
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    actorUserId: data.actorUserId || data.userId,
    subjectUserId: data.subjectUserId,
    tenantId: data.tenantId,
    oldValue: data.oldValue,
    newValue: data.newValue,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });
};

function buildWhereClause(tenantId, filters) {
  const where = { tenantId };

  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.action) where.action = filters.action;
  if (filters.actorUserId) where.actorUserId = filters.actorUserId;
  if (filters.entityId) where.entityId = { contains: filters.entityId, mode: 'insensitive' };

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  if (filters.q) {
    where.OR = [
      { entityId: { contains: filters.q, mode: 'insensitive' } },
      { ipAddress: { contains: filters.q, mode: 'insensitive' } },
      { actor: { email: { contains: filters.q, mode: 'insensitive' } } },
      { actor: { firstName: { contains: filters.q, mode: 'insensitive' } } },
      { actor: { lastName: { contains: filters.q, mode: 'insensitive' } } },
      { subject: { email: { contains: filters.q, mode: 'insensitive' } } },
      { subject: { firstName: { contains: filters.q, mode: 'insensitive' } } },
      { subject: { lastName: { contains: filters.q, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export const listAuditLogsByTenant = async (tenantId, options) => {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;
  const where = buildWhereClause(tenantId, options);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: options.sortOrder || 'desc' },
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

export const listAuditLogsForExport = async (tenantId, filters) => {
  const where = buildWhereClause(tenantId, filters);

  return prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
    include: {
      actor: { select: { id: true, email: true, firstName: true, lastName: true } },
      subject: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};
