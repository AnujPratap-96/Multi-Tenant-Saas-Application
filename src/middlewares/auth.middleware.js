import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { OTP_PURPOSE } from '../modules/auth/constants/auth.constants.js';

export const verifySignupToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.signupToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Signup token missing");
    }
   
    const payload = jwt.verify(token, env.JWT_SIGNUP_SECRET);
    if (payload.purpose !== OTP_PURPOSE.SIGNUP) {
        throw new ApiError(401, "Invalid signup token");
    }
    req.email = payload.email;
  
    req.action = payload.purpose;

    next();
});

export const verifyPasswordResetToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.passwordResetToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Password reset token missing");
    }
    const payload = jwt.verify(token, env.JWT_PASSWORD_RESET_SECRET);
    if (payload.purpose !== OTP_PURPOSE.FORGOT_PASSWORD) {
        throw new ApiError(401, "Invalid password reset token");
    }
    req.email = payload.email;
    req.action = payload.purpose;
    next();
});

export const requireAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Access token missing");
    }
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    req.email = payload.email;
    next();

});