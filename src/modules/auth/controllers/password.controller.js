import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { setAuthCookies, clearAuthCookies, setPasswordResetCookie } from "../../../utils/cookies.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { passwordService } from "../services/password.service.js";
import { verifyOtpService } from "../services/verify-otp.service.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";
import { generatePasswordResetToken } from "../../../lib/jwt.js";
/**
 * Handle password actions:
 * - SIGNUP
 * - SET_PASSWORD
 * - CHANGE_PASSWORD
 */
export const passwordController = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const email = req.email;
    const action = req.action; // "SIGNUP", "SET_PASSWORD", or "CHANGE_PASSWORD"
    const { ipAddress, userAgent } = getRequestContext(req);

    const result = await passwordService({
        email,
        newPassword: password,
        action,
        ipAddress,
        userAgent,
    });

    clearAuthCookies(res); // Clear any existing auth cookies
    if (result.accessToken && result.refreshToken) {
        setAuthCookies(res, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    }
    return successResponse(res, {
        message: result.message,
        user: result.user,
    });
});


export const changePasswordController = asyncHandler(async (req, res) => {
    const { old_password, new_password} = req.body;
    const email = req.email;
    const { ipAddress, userAgent } = getRequestContext(req);
    const result = await passwordService({
        email,
        newPassword: new_password,
        oldPassword: old_password,
        action: PASSWORD_ACTION.CHANGE_PASSWORD,
        ipAddress,
        userAgent,
    });
    clearAuthCookies(res); // Clear any existing auth cookies
    if (result.accessToken && result.refreshToken) {
        setAuthCookies(res, {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    }
    return successResponse(res, {
        message: result.message,
        user: result.user,
    }); 
});

export const verifyForgotPasswordOtpController = asyncHandler(async (req, res) => {
    const { requestId, purpose } = req.query;
    const { otp } = req.body;
    const result = await verifyOtpService({
        code: otp,
        requestId,
        purpose
    });
    if (result.isValid && result.purpose === "FORGOT_PASSWORD") {
        clearAuthCookies(res); // Clear any existing auth cookies
        const token = await generatePasswordResetToken({ email: result.email , purpose });
        console.log("Generated password reset token:", token);
        setPasswordResetCookie(res, token);
        return successResponse(res, {
            message: "OTP verified successfully",
            purpose: result.purpose,
        });
    }
    throw new ApiError(400, "OTP verification failed");
});