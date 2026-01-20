import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import sendOtpEmail from "../../lib/sendOtpEmail.js";
import generateOtp from "../../utils/generate-Otp.js";
import { findActiveOtp, createOtp } from "./auth.repository.js";
import { findUserByEmail } from "../users/user.repository.js";

export const generateOtpService = async (email) => {

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "OTP request not allowed");
  }
  const activeOtp = await findActiveOtp({
    email,
    purpose: "SIGNUP",
  });

  if (activeOtp) {
    throw new ApiError(429, "OTP already active");
  }


  // 4️⃣ Generate OTP

  const { otp, hash } = generateOtp(env.OTP_LENGTH);


  // 5️⃣ Calculate expiry
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRES_IN * 60 * 1000
  );


  // 6️⃣ Persist OTP

  await createOtp({
    email,
    purpose: "SIGNUP",
    codeHash: hash,
    expiresAt,
  });


  // 7️⃣ Send OTP email

  await sendOtpEmail(email, otp);

  return {
    email,
    purpose: "SIGNUP",
    expiresAt,
  };
};
