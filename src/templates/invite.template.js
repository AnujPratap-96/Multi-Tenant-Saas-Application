export const inviteTemplate = ({ inviterName, tenantName, role, inviteLink }) => ({
  subject: `You're invited to join ${tenantName}`,
  htmlContent: `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        <h2 style="color: #111827;">You're Invited! 🎉</h2>

        <p style="color: #374151; font-size: 15px;">
          <strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.
        </p>

        <p style="color: #374151; font-size: 15px;">
          Click the button below to accept the invitation:
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            padding: 14px 32px;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
          ">Accept Invitation</a>
        </div>

        <p style="color: #6b7280; font-size: 13px;">
          This invitation expires in 7 days. If you did not expect this invitation, you can ignore this email.
        </p>

        <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
          This is an automated message from Multi-Tenant App.
        </p>
      </div>
    </div>
  `,
});
