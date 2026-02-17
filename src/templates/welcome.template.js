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

export const passwordResetTemplate = () => ({
  subject: 'Your Password Was Changed 🔐',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        
        <h2 style="color: #111827;">Your Password Was Changed</h2>

        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          This is a confirmation that your account password was successfully updated.
        </p>

        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          If you made this change, no further action is required.
        </p>

        <div style="margin-top: 24px; padding: 16px; background-color: #fef2f2; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #b91c1c;">
            If you did NOT change your password, please secure your account immediately and contact our support team.
          </p>
        </div>

        <p style="margin-top: 32px; color: #6b7280; font-size: 13px;">
          For security reasons, we never send passwords via email.
        </p>

        <p style="color: #6b7280; font-size: 13px;">
          — Team Multi-Tenant App 💙
        </p>
      </div>
    </div>
  `,
});


export const forgotPasswordTemplate = () => ({
  subject: 'Password Reset Successful ✅',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        
        <h2 style="color: #111827;">Your Password Has Been Reset</h2>

        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          Your account password was successfully reset using the password recovery process.
        </p>

        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
          You can now log in using your new password.
        </p>

        <div style="margin-top: 24px; padding: 16px; background-color: #fef2f2; border-radius: 6px;">
          <p style="margin: 0; font-size: 14px; color: #b91c1c;">
            If you did not request this password reset, please secure your account immediately and contact support.
          </p>
        </div>

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
          This is an automated security notification.
        </p>

        <p style="color: #6b7280; font-size: 13px;">
          — Team Multi-Tenant App 💙
        </p>
      </div>
    </div>
  `,
});
