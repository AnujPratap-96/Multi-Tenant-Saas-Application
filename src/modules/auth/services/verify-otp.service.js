import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { verifyOtp } from "../utils/otp-geneator.js";
import { getOtp, updateOtp, deleteOtp } from "../redis/otp.redis.js";
import { validateOtpState } from "../utils/otp-state.validator.js";

export const verifyOtpService = async ({
  code,
  requestId,
  purpose
}) => {
  if (!requestId) {
    throw new ApiError(400, "RequestId is required");
  }

  const otpData = await getOtp(requestId);
  console.log("OTP data retrieved:", otpData);
  if (!otpData) {
  
    throw new ApiError(400, OTP_MESSAGES.EXPIRED);
  }

  validateOtpState(otpData);

  const isValid = verifyOtp(
    code,
    requestId,
    purpose,
    otpData
  );
console.log("OTP verification result:", isValid);
  if (!isValid) {
    otpData.attempts += 1;

    const ttl = Math.floor(env.OTP_EXPIRES_IN / 1000);

    await updateOtp({
      requestId,
      data: otpData,
      ttl,
    });

    throw new ApiError(400, OTP_MESSAGES.INVALID);
  }

  await deleteOtp(requestId);
  return {
    isValid: true,
    email: otpData.email,
    purpose
  }
};
