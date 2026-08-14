import { enqueueAuditLog } from '../modules/queue/producers/audit.producer.js';
import logger from './logger.js';

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
  try {
    await enqueueAuditLog({
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
    });
  } catch (err) {
    logger.error({ err: err.message }, 'Audit log enqueue failed');
  }
};

