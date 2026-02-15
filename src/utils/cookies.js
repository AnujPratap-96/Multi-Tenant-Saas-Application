import { env } from "../config/env.js";

const getBaseOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
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
export const setPasswordResetCookie = (res, token, name) => {
  res.cookie(name, token, {
    ...getBaseOptions(),
    maxAge: env.PASSWORD_RESET_TOKEN_COOKIE_MAX_AGE,
  });
};

/**
 * ❌ Clear Auth Cookies
 */
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("passwordResetToken");
  res.clearCookie("signupToken");
};
