// src/modules/auth/utils/otp-resend-handler.js

import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { OTP_PURPOSE, OTP_MESSAGES } from "../constants/auth.constants.js";
import { generateOtp } from "./otp-generator.js";
import { saveRequestIdByEmailAndPurpose, updateOtp, getOtp, deleteOtp } from "../redis/otp.redis.js";
import { sendOtpEmail } from "./otp.email.js";

export const handleOtpResendLogic = async ({
  otpData,
  requestId,
  email,
  existingRequestId,
}) => {
  const now = Date.now();
  const cooldown = env.RESEND_COOLDOWN * 1000;

  if (otpData.resendCount >= env.MAX_RESEND) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_LIMIT);
  }

  if (now - otpData.lastSentAt < cooldown) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_COOLDOWN);
  }

  const { otp, combinedHash } = generateOtp(env.OTP_LENGTH, requestId);

  otpData.codeHash = combinedHash;
  otpData.resendCount += 1;
  otpData.lastSentAt = now;
  otpData.attempts = 0;

  const ttl = Math.floor(env.OTP_EXPIRES_IN);

  // Delete the old requestId's OTP so the previous code can't be used (D-10/S-21)
  if (existingRequestId && existingRequestId !== requestId) {
    await deleteOtp(existingRequestId);
  }

  await updateOtp({
    requestId,
    data: otpData,
    ttl,
  });

  await saveRequestIdByEmailAndPurpose(email, otpData.purpose, requestId, ttl);
  await sendOtpEmail(email, otp, otpData.purpose);

  return { requestId };
};
