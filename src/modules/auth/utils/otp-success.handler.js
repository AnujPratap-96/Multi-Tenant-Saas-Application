export const handleOtpSuccess = (otp, purpose) => {
  switch (purpose) {
    case OTP_PURPOSE.SIGNUP: {
      const token = generateSignupToken({
        email: otp.email,
        purpose: "COMPLETE_SIGNUP",
      });

      return {
        success: true,
        purpose,
        cookies: [
          {
            name: "passwordToken",
            value: token,
          },
        ],
      };
    }

    case OTP_PURPOSE.LOGIN: {
      const { accessToken, refreshToken } =
        generateAuthToken({
          email: otp.email,
        });

      return {
        success: true,
        purpose,
        cookies: [
          {
            name: "accessToken",
            value: accessToken,
          },
          {
            name: "refreshToken",
            value: refreshToken,
          },
        ],
      };
    }

    case OTP_PURPOSE.FORGOT_PASSWORD: {
      const token = generatePasswordResetToken({
        email: otp.email,
      });

      return {
        success: true,
        purpose,
        cookies: [
          {
            name: "resetToken",
            value: token,
          },
        ],
      };
    }

    default:
      return {
        success: true,
        purpose,
        cookies: [],
      };
  }
};
