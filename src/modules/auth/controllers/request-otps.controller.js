import { generateOtpService } from "../services/generate-otp.service.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from '../../../utils/response.js';
import { OTP_PURPOSE } from "../constants/auth.constants.js";

export const emailVerifactionOtpController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const id = req.id;

await generateOtpService({
  email,
  requestId: id,
  purpose: OTP_PURPOSE.SIGNUP,
});
  return successResponse(res, { message: "OTP sent to email", data: { requestId: id, purpose: OTP_PURPOSE.SIGNUP } });
});


export const loginOtpController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const id = req.id;
  await generateOtpService({
    email,
    requestId: id,
    purpose: OTP_PURPOSE.LOGIN,
  });
  return successResponse(res, { message: "OTP sent to email", data: { requestId: id } });
});


export const forgotPasswordOtpController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const id = req.id;
  await generateOtpService({
    email,
    requestId: id,
    purpose: OTP_PURPOSE.FORGOT_PASSWORD,
  });
  return successResponse(res, { message: "OTP sent to email", data: { requestId: id } });
});