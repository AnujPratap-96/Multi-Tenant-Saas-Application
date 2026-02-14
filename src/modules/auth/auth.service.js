import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import sendEmail from "../../lib/sendEmail.js";
import { generateOtp, verifyOtpWithToken } from "../../utils/generate-Otp.js";
import { findActiveOtp, createOtp, markOtpAsUsed, createAuthSession, deactivateOtp, incrementAttempts, findOtpByEmailPurpose, revokeAuthSessionByRefreshToken } from "./auth.repository.js";
import crypto from "crypto";
import { createAuditLog } from "../audit-log/audit-log.repository.js";
import { findUserByEmail, updateLastLogin, createUser } from "../users/user.repository.js";
import { generateSignupToken, generateAuthToken } from "../../lib/jwt.js";
import bcrypt from "bcryptjs";
import { otpTemplate, forgotPasswordTemplate } from "../../templates/otp.template.js";
import { welcomeTemplate } from "../../templates/welcome.template.js";




export const logoutService = async ({
  userId,
  refreshToken,
  ipAddress,
  userAgent,
}) => {
if (!refreshToken) {
  throw new ApiError(401, "Refresh token required for logout");
}


  // 🔁 Revoke session
  const result = await revokeAuthSessionByRefreshToken(refreshToken);

  if (result.count === 0) {
    throw new ApiError(401, "Session already revoked or invalid");
  }

  // 🧾 Audit log
  await createAuditLog({
    userId,
    action: "LOGOUT",
    entityType: "SESSION",
    entityId: userId,
    ipAddress,
    userAgent,
  });

  return true;
};

export const forgotPasswordService = async (email , id) => {

  const user = await findUserByEmail(email);
  if (!user) {
    return;
  }
console.log("User found for forgot password:", user.email);
  const activeOtp = await findOtpByEmailPurpose({
    email,
    purpose: "FORGOT_PASSWORD",
  });
  console.log("Active OTP for forgot password:", activeOtp);
  if (activeOtp) {
    const now = Date.now();
    if (activeOtp.resendCount >= env.MAX_RESEND) {
      throw new ApiError(429, "OTP resend limit reached");
    }
    const RESEND_COOLDOWN_MS = Number(env.RESEND_COOLDOWN) * 1000;
    if (now - activeOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "Please wait before resending OTP");
    }
    await deactivateOtp(activeOtp.id);
  }
  const { otp,token , combinedHash } = generateOtp(env.OTP_LENGTH);
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRES_IN
  );
  await createOtp({
    email,
    purpose: "FORGOT_PASSWORD",
    codeHash: combinedHash,
    token,
    requestId: id,
    expiresAt,
    resendCount: 0,
    lastSentAt: new Date(),
  });

  await sendEmail(email, forgotPasswordTemplate(otp));
  return {token};
}