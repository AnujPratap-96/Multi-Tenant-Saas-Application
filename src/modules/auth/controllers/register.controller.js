
import { generateOtpService } from "../services/generate-otp.service.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from '../../../utils/response.js';


export const registerController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const id = req.id;
  const token = await generateOtpService(email, id);
  return successResponse(res, { message: "OTP sent to email", data: { token, requestId: id } });
});