import { ApiError } from "../../../utils/api-error.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { deactivateOtp } from "../repositories/auth.repository.js";

export const validateOtpState = async (otp) => {
  if (!otp.isActive) {
    throw new ApiError(400, OTP_MESSAGES.INACTIVE);
  }

  if (otp.expiresAt < new Date()) {
    await deactivateOtp(otp.id);
    throw new ApiError(400, OTP_MESSAGES.EXPIRED);
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw new ApiError(429, OTP_MESSAGES.MAX_ATTEMPTS);
  }
};
