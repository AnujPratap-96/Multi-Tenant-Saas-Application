import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';



export const verifyPasswordToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.passwordToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Password reset token missing");
    }
    const payload = jwt.verify(token, env.JWT_SIGNUP_SECRET);
    if ( payload.purpose !== "COMPLETE_SIGNUP") {
        throw new ApiError(401, "Invalid password reset token");
    }
    req.passwordEmail = payload.email;
    next();
});

export const requireAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new ApiError(401, "Access token missing");
    }
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.userId = payload.userId;
    next();

});