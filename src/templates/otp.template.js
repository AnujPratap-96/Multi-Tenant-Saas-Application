export const otpTemplate = (otp) => ({
  subject: 'Email Verification Code',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        <h2 style="color: #111827;">Your OTP Code 🔐</h2>
        <p style="color: #374151; font-size: 15px;">
          Use the following code to verify your identity:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="
            display: inline-block;
            background-color: #f3f4f6;
            padding: 16px 32px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 6px;
            border-radius: 8px;
            color: #4f46e5;
          ">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          This code expires in 10 minutes. If you didn't request this, ignore this email.
        </p>
      </div>
    </div>
  `,
});


export const forgotPasswordTemplate = (resetCode) => ({
  subject: 'Reset Your Password',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 32px;">
        <h2 style="color: #111827;">Reset Your Password 🔑</h2>
        <p style="color: #374151; font-size: 15px;">
          We received a request to reset your password. Use the code below to proceed:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="
            display: inline-block;
            background-color: #f3f4f6;
            padding: 16px 32px;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 6px;
            border-radius: 8px;
            color: #4f46e5;
          ">${resetCode}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          This code is valid for 10 minutes. If you didn’t request a password reset,
          you can safely ignore this email.
        </p>
      </div>
    </div>
  `,
});

