import { asyncHandler } from "../../../utils/async-handler";
import { verifyOtpService } from "../services/verify-otp.service.js";
import { setSignupCookie } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";

export const verifyEmailController = asyncHandler(async (req, res) => {
  const { token , requestId} = req.query;
  const { otp } = req.body;
  
 const passwordToken = await verifyOtpService(otp, token, requestId);
  setSignupCookie(res, passwordToken , "passwordToken");
  return successResponse(res, { message: "Email verified successfully" });
});
