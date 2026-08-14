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
  // Generic responses (D-10/S-13): never reveal whether the email has an account.
  // When the account-existence check fails, return early WITHOUT storing an OTP.
  const existingUser = await findUserByEmail(email);

  if (purpose === OTP_PURPOSE.SIGNUP && existingUser) {
    return;
  }

  if (
    (purpose === OTP_PURPOSE.LOGIN || purpose === OTP_PURPOSE.FORGOT_PASSWORD) &&
    !existingUser
  ) {
    return;
  }

  const existingOtpReuestID = await getOtpByEmailAndPurpose(email, purpose);
  const existingOTP = await getOtp(existingOtpReuestID);

  if (existingOTP) {
    return handleOtpResendLogic({
      otpData: existingOTP,
      requestId,
      email,
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

  await saveRequestIdByEmailAndPurpose(email, purpose, requestId, ttl);

  await sendOtpEmail(email, otp, purpose);

};
