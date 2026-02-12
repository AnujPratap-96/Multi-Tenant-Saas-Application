import { ApiError } from "../../../utils/api-error.js";
import { verifyOtpWithToken } from "../utils/otp-geneator.js";

import {
  findActiveOtp,
  incrementAttempts,
  markOtpAsUsed,
} from "../repositories/auth.repository.js";

import { OTP_MESSAGES } from "../constants/auth.constants.js";
import { validateOtpState } from "../utils/otp-state.validator.js";
import { handleOtpSuccess } from "../utils/otp-success.handler.js";

export const verifyOtpService = async ({
  code,
  token,
  requestId,
  purpose,
}) => {
  const activeOtp = await findActiveOtp({ token, requestId, purpose });

  if (!activeOtp) {
    throw new ApiError(400, OTP_MESSAGES.INVALID);
  }

  await validateOtpState(activeOtp);

  const isValid = await verifyOtpWithToken(
    code,
    token,
    activeOtp.codeHash
  );

  if (!isValid) {
    await incrementAttempts(activeOtp.id);
    throw new ApiError(400, OTP_MESSAGES.INVALID);
  }

  await markOtpAsUsed(activeOtp.id);

  return handleOtpSuccess(activeOtp, purpose);
};
