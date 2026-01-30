import prisma from '../../lib/prisma.js';

export const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  ipAddress,
  userAgent,
  newValue,
}) => {
  return prisma.auditLog.create({
    data: {
      actorUserId: userId,
      subjectUserId: userId,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent,
      newValue,
    },
  });
};
