// lib/temp-token.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateSignupToken = async({ email, purpose , verified = false }) => {
  return jwt.sign(
    { email, purpose },
    env.JWT_SIGNUP_SECRET,
    { expiresIn: env.JWT_SIGNUP_EXPIRES_IN }
  );
};

