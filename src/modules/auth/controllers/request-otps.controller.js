import { generateOtpService } from "../services/generate-otp.service.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";

// B-18: single handler factory for the three OTP request endpoints
const requestOtpHandler = (purpose) =>
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const id = req.id;
    await generateOtpService({ email, requestId: id, purpose });
    return successResponse(res, {
      message: "If this email exists, an OTP was sent",
      data: { requestId: id, purpose },
    });
  });

export const emailVerifactionOtpController = requestOtpHandler(OTP_PURPOSE.SIGNUP);
export const loginOtpController = requestOtpHandler(OTP_PURPOSE.LOGIN);
export const forgotPasswordOtpController = requestOtpHandler(OTP_PURPOSE.FORGOT_PASSWORD);