// src/modules/auth/services/verify-otp.js

import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { verifyOtpWithToken } from "../utils/otp-geneator.js";

import {
  getOtp,
  updateOtp,
  deleteOtp,
} from "../redis/otp.redis.js";

import { validateOtpState } from "../utils/otp-state.validator.js";
import { handleOtpSuccess } from "../utils/otp-success.handler.js";

export const verifyOtpService = async ({
  code,
  requestId,
}) => {
  if (!requestId) {
    throw new ApiError(400, "RequestId is required");
  }

  const otpData = await getOtp(requestId);

  validateOtpState(otpData);

  const isValid = await verifyOtpWithToken(
    code,
    requestId,
    otpData.codeHash
  );

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

  return handleOtpSuccess(otpData, otpData.purpose);
};
