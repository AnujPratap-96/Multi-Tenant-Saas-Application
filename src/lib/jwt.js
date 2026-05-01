// lib/temp-token.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const generateSignupToken = async ({ email, purpose, verified = false }) => {
  return jwt.sign(
    { email, purpose },
    env.JWT_SIGNUP_SECRET,
    { expiresIn: env.JWT_SIGNUP_EXPIRES_IN, algorithm: 'HS256' }
  );
};
export const generateAuthToken = async ({ userId = '', email }) => {
  const payload = { userId, email };
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN, algorithm: 'HS256' });
  return { accessToken, refreshToken };
}

export const generatePasswordResetToken = async ({ email , purpose }) => {
  return jwt.sign({ email, purpose }, env.JWT_PASSWORD_RESET_SECRET, { expiresIn: env.JWT_PASSWORD_RESET_EXPIRES_IN, algorithm: 'HS256' });
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
};