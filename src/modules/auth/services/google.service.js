import crypto from "crypto";
import { env } from "../../../config/env.js";
import { generateAuthToken } from "../../../lib/jwt.js";
import { createAuditLog } from "../../audit-log/audit-log.repository.js";
import { updateLastLogin } from "../../users/user.repository.js";
import { ApiError } from "../../../utils/api-error.js";
import { createAuthSession } from "../repositories/auth.repository.js";
import { mapUserToResponse } from "../../users/utils/map-user-fields.js";
export const googleLoginService = async (user, ipAddress, userAgent) => {
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
    action: "LOGIN",
    entityType: "USER",
    entityId: user.id,
    ipAddress,
    userAgent,
  });

  const mappedUser = mapUserToResponse(user);
  return { accessToken, refreshToken, user: mappedUser };
};
