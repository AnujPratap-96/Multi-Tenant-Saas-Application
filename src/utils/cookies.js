import { env } from "../config/env.js";

const isSecureCrossSite =
  env.NODE_ENV === "production" ||
  (typeof env.FRONTEND_URL === "string" && env.FRONTEND_URL.startsWith("https://"));

const getBaseOptions = () => ({
  httpOnly: true,
  secure: isSecureCrossSite,
  sameSite: isSecureCrossSite ? "none" : "lax",
  partitioned: isSecureCrossSite,
});

/**
 * 🔐 Set Access + Refresh tokens
 */
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const baseOptions = getBaseOptions();

  res.cookie("accessToken", accessToken, {
    ...baseOptions,
    maxAge: env.ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseOptions,
    maxAge: env.REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
};

/**
 * 🆕 Signup temporary token cookie
 */
export const setSignupCookie = (res, token) => {
  res.cookie("signupToken", token, {
    ...getBaseOptions(),
    maxAge: env.SIGNUP_TOKEN_COOKIE_MAX_AGE,
  });
};

/**
 * 🔁 Password Reset temporary token cookie
 */
export const setPasswordResetCookie = (res, token) => {
  res.cookie("passwordResetToken", token, {
    ...getBaseOptions(),
    maxAge: env.PASSWORD_RESET_TOKEN_COOKIE_MAX_AGE,
  });
};

/**
 * ❌ Clear Auth Cookies
 */
export const clearAuthCookies = (res) => {
  const baseOptions = getBaseOptions();
  res.clearCookie("accessToken", baseOptions);
  res.clearCookie("refreshToken", baseOptions);
  res.clearCookie("passwordResetToken", baseOptions);
  res.clearCookie("signupToken", baseOptions);
};
