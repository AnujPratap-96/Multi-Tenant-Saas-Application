import { asyncHandler } from "../../../utils/async-handler.js";
import { verifyOtpService } from "../services/verify-otp.service.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";
import { successResponse } from "../../../utils/response.js";
import {  setSignupCookie} from "../../../utils/cookies.js";

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { requestId, purpose } = req.query;
  const { otp } = req.body;

  const result = await verifyOtpService({
    code: otp,
    requestId,
    purpose
  });
 const token = generateSignupToken(result.email , result.purpose , verified = true);
  if (result.purpose === OTP_PURPOSE.SIGNUP) {
    setSignupCookie(res, token);
  }
  return successResponse(res, {
    message: "OTP verified successfully",
    data: {
      purpose: result.purpose
    }
  });
});
