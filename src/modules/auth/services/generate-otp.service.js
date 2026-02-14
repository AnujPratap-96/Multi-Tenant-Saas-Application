import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import { generateOtp } from "../utils/otp-geneator.js";
import { sendOtpEmail } from "../utils/otp.email.js";
import { findUserByEmail } from "../../users/user.repository.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";

import {
  getOtp,
  saveOtp,
} from "../redis/otp.redis.js";

import { handleOtpResendLogic } from "../utils/otp-resend-handler.js";

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

  if (purpose === OTP_PURPOSE.SIGNUP) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }
  }

  if (purpose === OTP_PURPOSE.LOGIN || purpose === OTP_PURPOSE.FORGOT_PASSWORD) {
    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      throw new ApiError(404, "User with this email does not exist");
    }
  }

  const existingOtp = await getOtp(requestId);

  // 🔁 If exists → resend
  if (existingOtp) {
    return handleOtpResendLogic({
      otpData: existingOtp,
      requestId,
      email,
    });
  }

  // 🆕 Create new OTP
  const { otp, combinedHash } = generateOtp(env.OTP_LENGTH, requestId);
  const now = Date.now();
  const ttl = Math.floor(env.OTP_EXPIRES_IN / 1000);

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

  await sendOtpEmail(email, otp, purpose);

};
