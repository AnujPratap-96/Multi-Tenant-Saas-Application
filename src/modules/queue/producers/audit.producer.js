import { auditQueue } from '../queues/audit.queue.js';
import { JOB_NAMES, AUDIT_JOB_PRIORITY } from '../constants/queue.constants.js';

export const enqueueAuditLog = async (data, opts = {}) => {
  const job = await auditQueue.add(JOB_NAMES.WRITE_AUDIT_LOG, data, {
    priority: AUDIT_JOB_PRIORITY.LOW,
    ...opts,
  });
  return job;
};
