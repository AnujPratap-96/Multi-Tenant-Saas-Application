import crypto from "crypto";
import { env } from "../../../config/env.js";
import { generateAuthToken, verifyRefreshToken } from "../../../lib/jwt.js";
import { ApiError } from "../../../utils/api-error.js";
import { createAuthSession, findSessionByHash, revokeSession } from "../repositories/auth.repository.js";

export const refreshAuthTokensService = async (refreshToken, ipAddress, userAgent) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token required");
  }

  // 1. Verify JWT
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // 2. Hash and lookup session in DB
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await findSessionByHash(refreshTokenHash);

  if (!session) {
    throw new ApiError(401, "Session not found or revoked");
  }

  // 3. JWT Rotation: Revoke current session
  await revokeSession(session.id);

  // 4. Issue new pair
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAuthToken({
    userId: session.user.id,
    email: session.user.email,
  });

  // 5. Create new session
  await createAuthSession({
    userId: session.user.id,
    refreshTokenHash: crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex"),
    ipAddress,
    userAgent,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: session.user,
  };
};
