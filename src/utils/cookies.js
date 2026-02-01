import { env } from "../config/env.js";

const getBaseOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
});

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

export const setSignupCookie = (res, token, name) => {
  res.cookie(name, token, {
    ...getBaseOptions(),
    maxAge: env.SIGNUP_TOKEN_COOKIE_MAX_AGE,
  });
};

export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};