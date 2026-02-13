import { asyncHandler } from "../../../utils/async-handler";
import { verifyOtpService } from "../services/verify-otp.service.js";
import { setSignupCookie } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";

export const verifyOtpController = asyncHandler(async (req, res) => {
  const { requestId } = req.query;
  const { otp } = req.body;

  const result = await verifyOtpService({
    code: otp,
    requestId,
  });

  // 🔐 Set all cookies dynamically
  if (result.cookies?.length) {
    result.cookies.forEach((cookie) => {
      setSignupCookie(res, cookie.value, cookie.name);
    });
  }

  return successResponse(res, {
    message: "OTP verified successfully",
    purpose: result.purpose,
  });
});
