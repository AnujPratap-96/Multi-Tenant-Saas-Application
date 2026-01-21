import { env } from "../../config/env.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { generateOtpService , verifyOtpService } from "./auth.service.js";
import {successResponse} from "../../utils/response.js";

export const register = asyncHandler(async (req, res) => {

    const { email } = req.body;

    const {token} = await generateOtpService(email);

   res.cookie("signupToken", token, {
        httpOnly: true,
        secure: false,
        maxAge: env.SIGNUP_TOKEN_COOKIE_MAX_AGE
    });    

    return successResponse(res, {message: "OTP sent to email"});

});


export const verifyEmail = asyncHandler(async (req, res) => {
  
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