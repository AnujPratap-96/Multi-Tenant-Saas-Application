import { Queue } from 'bullmq';
import { connection, defaultJobOptions } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection,
  defaultJobOptions,
});
