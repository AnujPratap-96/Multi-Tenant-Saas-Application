import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { ApiError } from "../../utils/api-error.js";
import { 
  generateOtpService, 
  verifyOtpService, 
  setPasswordService, 
  loginService, 
  googleLoginService 
} from "./auth.service.js";
import { successResponse } from "../../utils/response.js";
import { getRequestContext } from "../../utils/requestContext.js";
import { setAuthCookies, setSignupCookie } from "../../utils/cookies.js";
import { validateRedirectUrl } from "../../utils/validators.js";

export const registerController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { token } = await generateOtpService(email);
  
  setSignupCookie(res, token, "signupToken");
  
  return successResponse(res, { message: "OTP sent to email" });
});

export const verifyEmailController = asyncHandler(async (req, res) => {
  const email = req.signupEmail;
  const { otp } = req.body;
  
  const { token } = await verifyOtpService(email, otp);
  
  setSignupCookie(res, token, "passwordToken");
  
  return successResponse(res, { message: "Email verified successfully" });
});

export const setPasswordController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);
  const email = req.passwordEmail;
  const { password } = req.body;
  
  const { accessToken, refreshToken } = await setPasswordService(
    email, 
    password, 
    ipAddress, 
    userAgent
  );
  
  // Clear signup cookies
  res.clearCookie("signupToken");
  res.clearCookie("passwordToken");
  
  setAuthCookies(res, { accessToken, refreshToken });
  
  return successResponse(res, { message: "Password set successfully" });
});

export const loginController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);
  const { email, password } = req.body;
  
  const { accessToken, refreshToken } = await loginService(
    email, 
    password, 
    ipAddress, 
    userAgent
  );
  
  setAuthCookies(res, { accessToken, refreshToken });
  
  return successResponse(res, { message: "Login successful" });
});

export const googleCallbackController = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Google authentication failed");
  }

  const { ipAddress, userAgent } = getRequestContext(req);
  
  const { accessToken, refreshToken } = await googleLoginService(
    req.user,
    ipAddress,
    userAgent
  );

  setAuthCookies(res, { accessToken, refreshToken });

  // Validate redirect URL to prevent open redirect attacks
  const redirectUrl =
    validateRedirectUrl(req.session?.returnTo) ||
    validateRedirectUrl(req.headers.referer) ||
    env.FRONTEND_URL;

  // Clear returnTo from session
  if (req.session?.returnTo) {
    delete req.session.returnTo;
  }

  return res.redirect(redirectUrl);
});




export const logoutController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);

  const refreshToken = req.cookies?.refreshToken;
  const userId = req.user?.id; // from auth middleware

  await logoutService({
    userId,
    refreshToken,
    ipAddress,
    userAgent,
  });

  // 🍪 Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return successResponse(res, {
    message: "Logged out successfully",
  });
});