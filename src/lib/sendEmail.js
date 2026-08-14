import { DEFAULT_SENDER } from '../config/brevo.js';
import { enqueueEmail } from '../modules/queue/producers/email.producer.js';

/**
 * Enqueue an email to be sent via the email queue worker.
 * @param {string}   toEmail  - Recipient email
 * @param {object}   template - { subject, htmlContent }
 * @param {object}   [sender] - Optional custom sender override
 */
const sendEmail = async (toEmail, template, sender = DEFAULT_SENDER) => {
  await enqueueEmail({
    to: toEmail,
    subject: template.subject,
    htmlContent: template.htmlContent,
    sender,
  });
};

export default sendEmail;