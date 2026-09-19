import { Queue } from 'bullmq';
import { connection, defaultJobOptions } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection,
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 3,
  },
});
