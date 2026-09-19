import { notificationQueue } from '../queues/notification.queue.js';
import { JOB_NAMES } from '../constants/queue.constants.js';

export const enqueueNotification = async (data) => {
  const job = await notificationQueue.add(JOB_NAMES.SEND_NOTIFICATION, data, {
    removeOnComplete: { age: 86400 * 7 },
    removeOnFail: { age: 86400 * 7 },
  });
  return job;
};
