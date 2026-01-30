import SibApiV3Sdk from 'sib-api-v3-sdk';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
export const sendOtpEmail = async (toEmail, otp) => {
    try {
        const client = SibApiV3Sdk.ApiClient.instance;
        client.authentications['api-key'].apiKey = env.BREVO_API_KEY;
        const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
        const emailPayload = {
            to: [{ email: toEmail }],
            sender: {
                name: 'Multi-Tenant App',
                email: 'no-reply@devs-tinder.site',
            },
            subject: 'Your OTP Code',
            htmlContent: `<p>Your OTP is <strong>${otp}</strong></p>`,
        };
        await emailApi.sendTransacEmail(emailPayload);
    } catch (error) {
        throw new ApiError(500, 'Failed to send OTP email');
    }
};
export const sendWelcomeEmail = async (toEmail, userName = 'there') => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;
    client.authentications['api-key'].apiKey = env.BREVO_API_KEY;
    const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    const emailPayload = {
      to: [{ email: toEmail }],
      sender: {
        name: 'Multi-Tenant App',
        email: 'no-reply@devs-tinder.site',
      },
      subject: 'Welcome to Multi-Tenant App 🚀',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
            <h2 style="color: #111827;">Welcome, ${userName}! 🎉</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              We’re excited to have you onboard <strong>Multi-Tenant App</strong>.
              Your account has been successfully created and you're all set to start building amazing things.
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              Here’s what you can do next:
            </p>
            <ul style="color: #374151; font-size: 15px; line-height: 1.6;">
              <li>Create or join a tenant workspace</li>
              <li>Manage projects and tasks efficiently</li>
              <li>Collaborate seamlessly with your team</li>
            </ul>
            <div style="margin-top: 24px; text-align: center;">
              <a
                href="${env.APP_URL}"
                style="
                  display: inline-block;
                  background-color: #4f46e5;
                  color: #ffffff;
                  padding: 12px 24px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 600;
                "
              >
                Go to Dashboard
              </a>
            </div>
            <p style="margin-top: 32px; color: #6b7280; font-size: 13px;">
              If you didn’t create this account, you can safely ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 13px;">
              — Team Multi-Tenant App 💙
            </p>
          </div>
        </div>
      `,
    };
    await emailApi.sendTransacEmail(emailPayload);
  } catch (error) {
    throw new ApiError(500, 'Failed to send welcome email');
  }
};
