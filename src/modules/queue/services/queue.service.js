import { emailWorker } from '../workers/email.worker.js';
import { auditWorker } from '../workers/audit.worker.js';
import logger from '../../../lib/logger.js';

const workers = [emailWorker, auditWorker];

export const startWorkers = () => {
  logger.info('Queue workers are active (auto-started on creation)');
};

export const stopWorkers = async () => {
  logger.info('Stopping queue workers...');
  await Promise.all(workers.map((w) => w.close()));
  logger.info('All queue workers stopped');
};
