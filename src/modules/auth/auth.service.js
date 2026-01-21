import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import sendOtpEmail from "../../lib/sendOtpEmail.js";
import { generateOtp, verifyOtpCode } from "../../utils/generate-Otp.js";
import { findActiveOtp, createOtp , markOtpAsUsed } from "./auth.repository.js";
import { findUserByEmail } from "../users/user.repository.js";
import { generateSignupToken } from "../../lib/jwt.js";

export const generateOtpService = async (email) => {

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "User with this email already exists");
  }


  const activeOtp = await findActiveOtp({
    email,
    purpose: "SIGNUP",
  });

  // 🔁 RESEND LOGIC
  if (activeOtp) {
    const now = Date.now();

    if (activeOtp.resendCount >= env.MAX_RESEND) {
      throw new ApiError(429, "OTP resend limit reached");
    }

    const RESEND_COOLDOWN_MS = Number(env.OTP_RESEND_COOLDOWN_MS || 60000);

    if (now - activeOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "Please wait before resending OTP");
    }


    // deactivate old OTP
    await deactivateOtp(activeOtp.id);
  }

  // generate new OTP
  const { otp, hash } = generateOtp(env.OTP_LENGTH);

  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRES_IN
  );

  await createOtp({
    email,
    purpose: "SIGNUP",
    codeHash: hash,
    expiresAt,
    resendCount: activeOtp ? activeOtp.resendCount + 1 : 0,
    lastSentAt: new Date(),
  });

  await sendOtpEmail(email, otp);
  const token = await generateSignupToken({
    email,
    purpose: "SIGNUP",
  });

  return { token };
};

export const verifyOtpService = async (email, code) => {
  const activeOtp = await findActiveOtp({
    email,
    purpose: "SIGNUP",
  });
console.log("Active OTP:", activeOtp);
  if (!activeOtp) {
    throw new ApiError(400, "No active OTP found or OTP expired");
  }

  // extra safety (do not rely only on query)
  if (!activeOtp.isActive) {
    throw new ApiError(400, "OTP is no longer active");
  }

  if (activeOtp.expiresAt < new Date()) {
    throw new ApiError(400, "OTP has expired");
  }

  if (activeOtp.attempts >= activeOtp.maxAttempts) {
    throw new ApiError(429, "Maximum OTP verification attempts exceeded");
  }

  const isValid = await verifyOtpCode(code, activeOtp.codeHash);
  console.log("Is OTP valid:", isValid);
  if (!isValid) {
    await incrementAttempts(activeOtp.id);
    throw new ApiError(400, "Invalid OTP code");
  }

  await markOtpAsUsed(activeOtp.id);

  const token = await generateSignupToken({
    email,
    purpose: "COMPLETE_SIGNUP",
    verified: true
  });
  return { token };
};
