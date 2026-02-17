// src/modules/auth/utils/otp-resend-handler.js

import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { generateOtp } from "./otp-geneator.js";
import { saveRequestIdByEmailAndPurpose, updateOtp, getOtp } from "../redis/otp.redis.js";
import sendEmail from "../../../lib/sendEmail.js";
import { verifyEmailOtpTemplate } from "../../../templates/otp.template.js";

export const handleOtpResendLogic = async ({
  otpData,
  requestId,
  email,
}) => {
  const now = Date.now();
  const cooldown =
    Number(env.OTP_RESEND_COOLDOWN_MS) || 60000;

  if (otpData.resendCount >= env.MAX_RESEND) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_LIMIT);
  }

  if (now - otpData.lastSentAt < cooldown) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_COOLDOWN);
  }

  const { otp, combinedHash } = generateOtp(env.OTP_LENGTH);

  otpData.codeHash = combinedHash;
  otpData.resendCount += 1;
  otpData.lastSentAt = now;
  otpData.attempts = 0;

  const ttl = Math.floor(env.OTP_EXPIRES_IN / 1000);

  await updateOtp({
    requestId,
    data: otpData,
    ttl,
  });
  const otpdata = await getOtp(requestId);

  await saveRequestIdByEmailAndPurpose(email, otpData.purpose, requestId, ttl);
  await sendEmail(email, verifyEmailOtpTemplate(otp));


  return { requestId };
};
