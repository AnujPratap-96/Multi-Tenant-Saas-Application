import { ApiError } from "../../../utils/api-error.js";
import { env } from "../../../config/env.js";
import sendEmail from "../../../lib/sendEmail.js";
import { generateOtp } from "../utils/otp-geneator.js";
import { otpTemplate } from "../../../templates/otp.template.js";

import {
  findOtpByEmailPurpose,
  createOtp,
} from "../repositories/auth.repository.js";

import { findUserByEmail } from "../../users/user.repository.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";
import { handleOtpResendLogic } from "../utils/otp-resend.handler.js";

export const generateOtpService = async ({ email, requestId, purpose }) => {
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (purpose === OTP_PURPOSE.SIGNUP) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }
  }

  const activeOtp = await findOtpByEmailPurpose({ email, purpose });

  if (activeOtp) {
    await handleOtpResendLogic(activeOtp);
  }

  const { otp, token, combinedHash } = generateOtp(env.OTP_LENGTH);

  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN);

  await createOtp({
    email,
    purpose,
    codeHash: combinedHash,
    token,
    requestId,
    expiresAt,
    lastSentAt: new Date(),
  });

  await sendEmail(email, otpTemplate(otp));

  return { token };
};
