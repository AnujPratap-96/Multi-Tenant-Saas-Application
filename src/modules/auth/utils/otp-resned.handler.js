import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { deactivateOtp } from "../repositories/auth.repository.js";

export const handleOtpResendLogic = async (activeOtp) => {
  const now = Date.now();

  if (activeOtp.resendCount >= env.MAX_RESEND) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_LIMIT);
  }

  const cooldown = Number(env.OTP_RESEND_COOLDOWN_MS || 60000);

  if (now - activeOtp.lastSentAt.getTime() < cooldown) {
    throw new ApiError(429, OTP_MESSAGES.RESEND_COOLDOWN);
  }

  await deactivateOtp(activeOtp.id);
};
