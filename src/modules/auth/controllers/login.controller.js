import crypto from "crypto";
import { asyncHandler } from "../../../utils/async-handler.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { loginWithEmailPasswordService, loginWithOtpService } from "../services/login.service.js";
import { logoutService } from "../services/logout.service.js";
import { setAuthCookies } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";
import { googleLoginService } from "../services/google.service.js";
import { clearAuthCookies } from "../../../utils/cookies.js";
import { env } from "../../../config/env.js";
import { redisClient } from "../../../config/redis.js";
import { ApiError } from "../../../utils/api-error.js";

export const loginWithEmailAndPasswordController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithEmailPasswordService(email, password, ipAddress, userAgent);

  setAuthCookies(res, { accessToken, refreshToken });

  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const loginWithOtpController = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { requestId, purpose } = req.query;

  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithOtpService(otp, ipAddress, userAgent, requestId, purpose);

  setAuthCookies(res, { accessToken, refreshToken });
  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const loginWithGoogleController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  const ticket = crypto.randomBytes(32).toString("hex");
  await redisClient.set(
    `oauth_ticket:${ticket}`,
    JSON.stringify({
      user: req.user,
      ipAddress,
      userAgent,
    }),
    { EX: 300 }
  );

  return res.redirect(`${env.FRONTEND_URL}/auth/callback?ticket=${ticket}`);
});

export const exchangeGoogleTicketController = asyncHandler(async (req, res) => {
  const { ticket } = req.body;
  if (!ticket || typeof ticket !== "string") {
    throw new ApiError(400, "OAuth ticket is required");
  }

  const ticketKey = `oauth_ticket:${ticket}`;
  const dataRaw = await redisClient.get(ticketKey);
  if (!dataRaw) {
    throw new ApiError(401, "Invalid or expired OAuth ticket");
  }
  await redisClient.del(ticketKey);

  const { user: oauthUser, ipAddress, userAgent } = JSON.parse(dataRaw);
  const { accessToken, refreshToken, user } = await googleLoginService(
    oauthUser,
    ipAddress || req.ip,
    userAgent || req.headers["user-agent"] || ""
  );

  setAuthCookies(res, { accessToken, refreshToken });

  return successResponse(res, {
    success: true,
    message: "Google login successful",
    data: user,
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const refreshToken = req.cookies?.refreshToken;
  const { ipAddress, userAgent } = getRequestContext(req);
  const data = await logoutService({ userId, refreshToken, ipAddress, userAgent });
  clearAuthCookies(res);
  return successResponse(res, data);
});
