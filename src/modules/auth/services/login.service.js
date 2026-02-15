import { env } from "../../../config/env.js";
import bcrypt from "bcryptjs";
import { ApiError } from "../../../utils/api-error.js";
import { findUserByEmail , updateLastLogin } from "../../users/user.repository.js";
import { generateAuthToken } from "../../../lib/jwt.js";
import crypto from "crypto";
import { createAuthSession } from "../repositories/auth.repository.js";
import { createAuditLog } from "../../audit-log/audit-log.repository.js";
import { verifyOtpService } from "./verify-otp.service.js";
import { mapUserToResponse } from "../../users/utils/map-user-fields.js";

export const loginWithEmailPasswordService = async (email, password, ipAddress, userAgent) => {

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
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
    const mappedUser = mapUserToResponse(user);
    return { accessToken, refreshToken , user: mappedUser };
};


export const loginWithOtpService = async (otp, ipAddress, userAgent, requestId, purpose) => {

 const data = await verifyOtpService({
    code: otp,
    requestId,
    purpose
  });

  if (!data) {
    throw new ApiError(400, "Invalid OTP");
  }

  const user = await findUserByEmail(data.email);
  if (!user || !user.isActive) {
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
    action: "LOGIN_WITH_OTP",
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });
  const mappedUser = mapUserToResponse(user);

  return { accessToken, refreshToken , user: mappedUser };
};