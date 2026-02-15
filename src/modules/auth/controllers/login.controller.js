import { asyncHandler } from "../../../utils/async-handler.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { loginWithEmailPasswordService, loginWithOtpService } from "../services/login.service.js";
import { setAuthCookies } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";
import { googleLoginService } from "../services/google.service.js";
import { clearAuthCookies } from "../../../utils/cookies.js";
import { da } from "zod/locales";

export const loginWithEmailAndPasswordController = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithEmailPasswordService(email, password, ipAddress, userAgent);

  setAuthCookies(res, accessToken, refreshToken);

  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user
  });
});

export const loginWithOtpController = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { requestId, purpose } = req.query;

  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithOtpService(otp, ipAddress, userAgent, requestId, purpose);

  setAuthCookies(res, accessToken, refreshToken);
  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user
  });
});


export const loginWithGoogleController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);
  const { accessToken, refreshToken, user } = await googleLoginService(req.user, ipAddress, userAgent);

  setAuthCookies(res, accessToken, refreshToken);
  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user
  });

});

export const logoutController = asyncHandler(async (req, res) => {

  const { userId } = req.user;
  const { ipAddress, userAgent } = getRequestContext(req);
  const data = await logoutService(userId, ipAddress, userAgent);
  clearAuthCookies(res);
  return successResponse(res, data);
});