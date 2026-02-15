import { ApiError } from "../../../utils/api-error.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";

export const validateOtpState = (otp) => {
  if (!otp) {
    console.log("OTP data is null or undefined");
    throw new ApiError(400, OTP_MESSAGES.EXPIRED);
  }

  if (otp.attempts >= otp.maxAttempts) {
    throw new ApiError(429, OTP_MESSAGES.MAX_ATTEMPTS);
  }
};
