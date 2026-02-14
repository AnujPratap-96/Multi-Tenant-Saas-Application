import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { setAuthCookies, clearAuthCookies } from "../../../utils/cookies.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { passwordService } from "../services/password.service.js";
import { verifyOtpService } from "../services/verify-otp.service.js";

/**
 * Handle password actions:
 * - SIGNUP
 * - SET_PASSWORD
 * - CHANGE_PASSWORD
 */
export const passwordController = asyncHandler(async (req, res) => {
    const { password, } = req.body;
    const { email } = req.email;
    const action = req.action; // "SIGNUP", "SET_PASSWORD", or "CHANGE_PASSWORD"
    const { ipAddress, userAgent } = getRequestContext(req);
    const result = await passwordService({
        email,
        password,
        action,
        ipAddress,
        userAgent
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


const verifyForgotPasswordOtpController = asyncHandler(async (req, res) => {
    const { requestId, purpose } = req.query;
    const { otp } = req.body;
    const result = await verifyOtpService({
        code: otp,
        requestId,
        purpose
    });
    if (result.isValid && result.purpose === "FORGOT_PASSWORD") {
        const token = await passwordService.generatePasswordResetToken({ email: result.email });
        setPasswordResetCookie(res, token, "passwordResetToken");
        return successResponse(res, {
            message: "OTP verified successfully",
            purpose: result.purpose,
        });
    }
    throw new ApiError(400, "OTP verification failed");
});