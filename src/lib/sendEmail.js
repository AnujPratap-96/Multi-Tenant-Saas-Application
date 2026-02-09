import { emailApi, DEFAULT_SENDER } from '../config/brevo.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Generic email sender
 * @param {string}   toEmail  - Recipient email
 * @param {object}   template - { subject, htmlContent }
 * @param {object}   [sender] - Optional custom sender override
 */
 const sendEmail = async (toEmail, template, sender = DEFAULT_SENDER) => {
  try {
    const emailPayload = {
      to: [{ email: toEmail }],
      sender,
      subject: template.subject,
      htmlContent: template.htmlContent,
    };

    const response = await emailApi.sendTransacEmail(emailPayload);
    return response;
  } catch (error) {
    console.error(`Email send failed to ${toEmail}:`, error?.message || error);
    throw new ApiError(500, `Failed to send email: ${template.subject}`);
  }
};

export default sendEmail;