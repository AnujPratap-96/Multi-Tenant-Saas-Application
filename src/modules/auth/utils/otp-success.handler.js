import {
  generateSignupToken,
  generateAuthToken,
  generatePasswordResetToken,
} from "../../../lib/jwt.js";

import { OTP_PURPOSE } from "../constants/auth.constants.js";

export const handleOtpSuccess = (otp, purpose) => {
  switch (purpose) {
    case OTP_PURPOSE.SIGNUP:
      return {
        success: true,
        token: generateSignupToken({
          email: otp.email,
          purpose: "COMPLETE_SIGNUP",
        }),
      };

    case OTP_PURPOSE.LOGIN:
      return {
        success: true,
        token: generateAuthToken({
          email: otp.email,
        }),
      };

    case OTP_PURPOSE.FORGOT_PASSWORD:
      return {
        success: true,
        token: generatePasswordResetToken({
          email: otp.email,
        }),
      };

    default:
      return { success: true };
  }
};
