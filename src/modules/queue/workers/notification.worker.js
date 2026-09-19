import { Worker } from 'bullmq';
import { connection } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';
import logger from '../../../lib/logger.js';

// Delivery worker. The Notification row is already persisted synchronously by
// the notification service; this worker is the extension point for real-time
// push (websockets/SSE) and email digests. For now it records delivery intent.
const processNotification = async (job) => {
  const { userId, type, entityType, entityId, message } = job.data;
  logger.info(
    { jobId: job.id, userId, type, entityType, entityId, message },
    'Notification delivery job processed'
  );
  return { delivered: true };
};

export const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATION,
  processNotification,
  { connection, concurrency: 5 }
);

notificationWorker.on('failed', (job, err) => {
  logger.error(
    { jobId: job.id, userId: job.data?.userId, err: err.message },
    'Notification job failed'
  );
});
