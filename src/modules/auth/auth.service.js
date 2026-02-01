import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { sendOtpEmail, sendWelcomeEmail } from "../../lib/sendEmail.js";
import { generateOtp, verifyOtpCode } from "../../utils/generate-Otp.js";
import { findActiveOtp, createOtp, markOtpAsUsed, createAuthSession, deactivateOtp , incrementAttempts } from "./auth.repository.js";
import crypto from "crypto";
import { createAuditLog } from "../audit-log/audit-log.repository.js";
import { findUserByEmail, updateLastLogin, createUser } from "../users/user.repository.js";
import { generateSignupToken, generateAuthToken } from "../../lib/jwt.js";
import bcrypt from "bcryptjs";

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
  
  if (activeOtp) {
    const now = Date.now();
    if (activeOtp.resendCount >= env.MAX_RESEND) {
      throw new ApiError(429, "OTP resend limit reached");
    }
    const RESEND_COOLDOWN_MS = Number(env.OTP_RESEND_COOLDOWN_MS || 60000);
    if (now - activeOtp.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiError(429, "Please wait before resending OTP");
    }
    
    await deactivateOtp(activeOtp.id);
  }
  
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
  if (!activeOtp) {
    throw new ApiError(400, "No active OTP found or OTP expired");
  }
  
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

export const setPasswordService = async (email, password, ipAddress, userAgent) => {
  const user = await findUserByEmail(email);
  if (user) {
    throw new ApiError(400, "User with this email already exists");
  }
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const newUser = await createUser({
    email,
    password: hashedPassword, 
  });
  
  await updateLastLogin(newUser.id);
  
  const { accessToken, refreshToken } = await generateAuthToken({
    userId: newUser.id,
    email: newUser.email,
  });
  
  await createAuthSession({
    userId: newUser.id,
    refreshTokenHash: crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex"),
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
  });
  
  await createAuditLog({
    userId: newUser.id,
    action: "CREATE",
    entityType: "USER",
    entityId: newUser.id,
    ipAddress,
    userAgent,
    newValue: {
      email: newUser.email,
      emailVerified: true,
    },
  });
  
  await sendWelcomeEmail(email, newUser.name);
  return { accessToken, refreshToken };
};

export const loginService = async (email, password, ipAddress, userAgent) => {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  
  const { accessToken, refreshToken } = await generateAuthToken({
    userId: user.id,
    email: user.email,
  });
  
  await createAuthSession({
    userId: user.id,
    refreshTokenHash: crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex"),
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
  });
  
  await updateLastLogin(user.id);
  
  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });
  return { accessToken, refreshToken };
};

export const googleLoginService = async (user, ipAddress, userAgent) => {
  if(!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }
  const { accessToken, refreshToken } = await generateAuthToken({
    userId: user.id,
    email: user.email,
  });

  await createAuthSession({
    userId: user.id,
    refreshTokenHash: crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex"),
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
  });

  await updateLastLogin(user.id);

  await createAuditLog({
    userId: user.id,
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  return { accessToken, refreshToken };
};