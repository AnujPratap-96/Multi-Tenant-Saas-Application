import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { generateOtp } from "../utils/otp-generator.js";
import { sendOtpEmail } from "../utils/otp.email.js";
import { findUserByEmail } from "../../users/user.repository.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";

import {
  saveOtp,
  saveRequestIdByEmailAndPurpose,
  getOtpByEmailAndPurpose,
  getOtp,
} from "../redis/otp.redis.js";

import { handleOtpResendLogic } from "../utils/otp-resend.handler.js";
import logger from "../../../lib/logger.js";

export const generateOtpService = async ({
  email,
  requestId,
  purpose = OTP_PURPOSE.SIGNUP,
}) => {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!requestId) {
    throw new ApiError(400, "RequestId is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Generic responses (D-10/S-13): never reveal whether the email has an account.
  // When the account-existence check fails, return early WITHOUT storing an OTP.
  const existingUser = await findUserByEmail(normalizedEmail);

  if (purpose === OTP_PURPOSE.SIGNUP && existingUser) {
    logger.warn({ email: normalizedEmail, purpose }, "[AUTH] Signup rejected — user already exists");
    throw new ApiError(400, "An account with this email address already exists");
  }

  if (purpose === OTP_PURPOSE.LOGIN && !existingUser) {
    logger.warn({ email: normalizedEmail, purpose }, "[AUTH] Login OTP rejected — user not found");
    throw new ApiError(404, "No account found with this email address");
  }

  if (purpose === OTP_PURPOSE.FORGOT_PASSWORD && !existingUser) {
    logger.warn({ email: normalizedEmail, purpose }, "[AUTH] Forgot password rejected — user not found");
    throw new ApiError(404, "No account found with this email address");
  }

  const existingOtpReuestID = await getOtpByEmailAndPurpose(normalizedEmail, purpose);
  const existingOTP = await getOtp(existingOtpReuestID);

  if (existingOTP) {
    return handleOtpResendLogic({
      otpData: existingOTP,
      requestId,
      email: normalizedEmail,
      existingRequestId: existingOtpReuestID,
    });
  }

  // 🆕 Create new OTP
  const { otp, combinedHash } = generateOtp(env.OTP_LENGTH, requestId);
  const now = Date.now();
  const ttl = Math.floor(env.OTP_EXPIRES_IN);

  const otpData = {
    email,
    purpose,
    codeHash: combinedHash,
    attempts: 0,
    maxAttempts: env.OTP_MAX_ATTEMPTS || 5,
    resendCount: 0,
    createdAt: now,
    lastSentAt: now,
  };

  await saveOtp({
    requestId,
    data: otpData,
    ttl,
  });
  const otpdata = await getOtp(requestId);

  await saveRequestIdByEmailAndPurpose(normalizedEmail, purpose, requestId, ttl);

  logger.info({ email: normalizedEmail, otp, purpose }, "🔑 [AUTH] Generated OTP successfully");
  await sendOtpEmail(normalizedEmail, otp, purpose);
};
