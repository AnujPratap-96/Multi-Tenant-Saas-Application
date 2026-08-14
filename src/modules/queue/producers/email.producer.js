import { emailQueue } from '../queues/email.queue.js';
import { JOB_NAMES } from '../constants/queue.constants.js';

export const enqueueEmail = async ({ to, subject, htmlContent, sender }, opts = {}) => {
  const job = await emailQueue.add(JOB_NAMES.SEND_EMAIL, { to, subject, htmlContent, sender }, opts);
  return job;
};
