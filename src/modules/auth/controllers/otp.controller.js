import { asyncHandler } from "../../../utils/async-handler";
import { verifyOtpService } from "../services/verify-otp.service.js";
import { OTP_PURPOSE } from "../constants/auth.constants.js";
import { successResponse } from "../../../utils/response.js";
import { setPasswordResetCookie, setSignupCookie, clearAuthCookies } from "../../../utils/cookies.js";

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { requestId, purpose } = req.query;
  const { otp } = req.body;

  const result = await verifyOtpService({
    code: otp,
    requestId,
    purpose
  });


  return successResponse(res, {
    message: "OTP verified successfully",
    purpose: result.purpose,
  });
});
