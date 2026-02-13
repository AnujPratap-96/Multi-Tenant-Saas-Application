import { env } from '../config/env.js';

export const welcomeTemplate = (userName = 'there') => ({
  subject: 'Welcome to Multi-Tenant App 🚀',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        <h2 style="color: #111827;">Welcome, ${userName}! 🎉</h2>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          We're excited to have you onboard <strong>Multi-Tenant App</strong>.
          Your account has been successfully created.
        </p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Here's what you can do next:
        </p>
        <ul style="color: #374151; font-size: 15px; line-height: 1.6;">
          <li>Create or join a tenant workspace</li>
          <li>Manage projects and tasks efficiently</li>
          <li>Collaborate seamlessly with your team</li>
        </ul>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${env.APP_URL}" style="
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
          ">Go to Dashboard</a>
        </div>
        <p style="margin-top: 32px; color: #6b7280; font-size: 13px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
        <p style="color: #6b7280; font-size: 13px;">— Team Multi-Tenant App 💙</p>
      </div>
    </div>
  `,
});

export const passwordSetTemplate = () => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f5f7fa; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px;">
      
      <h2 style="color: #222;">Password Successfully Set</h2>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Your password has been successfully set for your account.
      </p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        You can now log in using your email and password.
      </p>

      <div style="margin-top: 30px; padding: 15px; background-color: #f0f4ff; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #333;">
          If you did not perform this action, please contact our support team immediately.
        </p>
      </div>

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        This is an automated message. Please do not reply.
      </p>

    </div>
  </div>
  `;
};

export const passwordChangedTemplate = () => {
  return `
  <div style="font-family: Arial, sans-serif; background-color: #f5f7fa; padding: 40px 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 30px;">
      
      <h2 style="color: #222;">Your Password Has Been Changed</h2>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        We wanted to let you know that your account password was recently changed.
      </p>

      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        If you made this change, no further action is required.
      </p>

      <div style="margin-top: 25px; padding: 15px; background-color: #ffecec; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px; color: #a00;">
          If you did not change your password, please reset it immediately and contact support.
        </p>
      </div>

      <p style="margin-top: 40px; font-size: 12px; color: #999;">
        For security reasons, we recommend keeping your password confidential and secure.
      </p>

      <p style="font-size: 12px; color: #999;">
        This is an automated security notification.
      </p>

    </div>
  </div>
  `;
};
