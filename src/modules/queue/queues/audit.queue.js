import { Queue } from 'bullmq';
import { connection, defaultJobOptions } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';

export const auditQueue = new Queue(QUEUE_NAMES.AUDIT, {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 2,
  },
});
