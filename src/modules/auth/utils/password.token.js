

import crypto from "crypto";
import { generateAuthToken } from "../../../lib/jwt.js";
import { createAuthSession } from "../repositories/auth.repository.js";
import { env } from "../../../config/env.js";

export const handlePasswordTokens = async ({
  user,
  generateTokens,
  createSession,
  ipAddress,
  userAgent,
}) => {
  if (!generateTokens) return null;

  const tokens = await generateAuthToken({
    userId: user.id,
    email: user.email,
  });

  if (createSession) {
    await createAuthSession({
      userId: user.id,
      refreshTokenHash: crypto
        .createHash("sha256")
        .update(tokens.refreshToken)
        .digest("hex"),
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_COOKIE_MAX_AGE),
    });
  }

  return tokens;
};
