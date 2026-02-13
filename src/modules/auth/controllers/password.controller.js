// src/modules/auth/controllers/password.controller.js

import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { setAuthCookies } from "../../../utils/cookies.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { passwordService } from "../services/password.service.js";
import { PASSWORD_ACTION } from "../constants/auth.constants.js";

/**
 * Handle password actions:
 * - SIGNUP
 * - SET_PASSWORD
 * - RESET_PASSWORD
 */
export const passwordController = asyncHandler(async (req, res) => {
    const {
        password,
        action = PASSWORD_ACTION.SIGNUP,
    } = req.body;
    const { email } = req.email;
    const { ipAddress, userAgent } = getRequestContext(req);
    const result = await passwordService({
        email,
        password,
        action,
        ipAddress,
        userAgent
    });

    // 🔐 If tokens exist, set cookies
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
