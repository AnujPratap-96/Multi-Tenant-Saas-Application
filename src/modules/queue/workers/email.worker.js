import { Worker } from 'bullmq';
import { connection } from '../config/queue.config.js';
import { QUEUE_NAMES } from '../constants/queue.constants.js';
import { emailApi, DEFAULT_SENDER } from '../../../config/brevo.js';
import logger from '../../../lib/logger.js';

const processEmail = async (job) => {
  const { to, subject, htmlContent, sender } = job.data;

  const emailPayload = {
    to: [{ email: to }],
    sender: sender || DEFAULT_SENDER,
    subject,
    htmlContent,
  };

  const response = await emailApi.sendTransacEmail(emailPayload);
  logger.info({ jobId: job.id, to, subject }, 'Email sent successfully');
  return response;
};

export const emailWorker = new Worker(QUEUE_NAMES.EMAIL, processEmail, {
  connection,
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job.id, to: job.data.to, attempts: job.attemptsMade, err: err.message }, 'Email job failed');
});
