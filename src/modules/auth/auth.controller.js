import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { generateOtpService , verifyOtpService , setPasswordService , loginService } from "./auth.service.js";
import {successResponse} from "../../utils/response.js";
import { getRequestContext } from "../../utils/requestContext.js";

export const registerController = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const {token} = await generateOtpService(email);
   res.cookie("signupToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: env.SIGNUP_TOKEN_COOKIE_MAX_AGE
    });    
    return successResponse(res, {message: "OTP sent to email"});
});
export const verifyEmailController = asyncHandler(async (req, res) => {
    const email = req.signupEmail;
    const { otp } = req.body;
    const { token } = await verifyOtpService( email, otp );
    res.cookie("passwordToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: env.SIGNUP_TOKEN_COOKIE_MAX_AGE
    });
    return successResponse(res, { message: "Email verified successfully" });
});
export const setPasswordController = asyncHandler(async (req, res) => {
    const {ipAddress, userAgent} = getRequestContext(req);
 const email = req.passwordEmail;
    const { password } = req.body;
   const { accessToken, refreshToken } = await setPasswordService(email, password, ipAddress, userAgent);
   res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: env.ACCESS_TOKEN_COOKIE_MAX_AGE
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: env.REFRESH_TOKEN_COOKIE_MAX_AGE
    });
    return successResponse(res, { message: "Password set successfully" });
});
export const loginController = asyncHandler(async (req, res) => {
    const { ipAddress, userAgent } = getRequestContext(req);
    const { email, password } = req.body;
    const { accessToken, refreshToken } = await loginService(email, password, ipAddress, userAgent);
   res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: env.ACCESS_TOKEN_COOKIE_MAX_AGE
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        maxAge: env.REFRESH_TOKEN_COOKIE_MAX_AGE
    });
    return successResponse(res, { message: "Login successful" });
});