import { enqueueAuditLog } from '../modules/queue/producers/audit.producer.js';
import logger from './logger.js';
import prisma from './prisma.js';

export const logAudit = async ({
  action,
  entityType,
  entityId = null,
  actorUserId = null,
  subjectUserId = null,
  tenantId = null,
  oldValue = null,
  newValue = null,
  req = null,
}) => {
  const auditData = {
    action,
    entityType,
    entityId,
    actorUserId,
    subjectUserId,
    tenantId,
    oldValue,
    newValue,
    ipAddress: req?.ip ?? null,
    userAgent: req?.headers?.["user-agent"] ?? null,
  };

  try {
    await enqueueAuditLog(auditData);
  } catch (err) {
    logger.warn({ err: err.message }, 'Audit log enqueue failed, writing directly to DB');
    try {
      await prisma.auditLog.create({ data: auditData });
    } catch (dbErr) {
      logger.error({ err: dbErr.message }, 'Direct audit log DB write failed');
    }
  }
};

