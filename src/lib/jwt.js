// lib/temp-token.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const generateSignupToken = ({ email, purpose }) => {
  return jwt.sign(
    { email, purpose },
    env.JWT_TEMP_SECRET,
    { expiresIn: env.JWT_TEMP_EXPIRES_IN }
  );
};
