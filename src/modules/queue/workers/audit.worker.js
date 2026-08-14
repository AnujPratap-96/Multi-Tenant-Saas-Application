import { Worker } from 'bullmq';
import { connection } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';
import prisma from '../../../lib/prisma.js';
import logger from '../../../lib/logger.js';

const processAudit = async (job) => {
  const data = job.data;

  await prisma.auditLog.create({ data });

  logger.debug({ jobId: job.id, action: data.action }, 'Audit log written');
};

export const auditWorker = new Worker(QUEUE_NAMES.AUDIT, processAudit, {
  connection,
  concurrency: 10,
});

auditWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, action: job.data?.action, err: err.message }, 'Audit job failed');
});
