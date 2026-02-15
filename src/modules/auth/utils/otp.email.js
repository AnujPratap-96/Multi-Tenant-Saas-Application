import { OTP_PURPOSE } from "../constants/auth.constants.js";
import { verifyEmailOtpTemplate, forgotPasswordOtpTemplate, loginOtpTemplate } from "../../../templates/otp.template.js";
import  sendEmail  from "../../../lib/sendEmail.js";

export const sendOtpEmail = async (email, otp, purpose) => {
    let emailPayload;

    switch (purpose) {
        case OTP_PURPOSE.SIGNUP:
            emailPayload = verifyEmailOtpTemplate(otp);
            break;

        case OTP_PURPOSE.LOGIN:
            emailPayload = loginOtpTemplate(otp);
            break;

        case OTP_PURPOSE.FORGOT_PASSWORD:
            emailPayload = forgotPasswordOtpTemplate(otp);
            break;

        default:
            throw new Error("Invalid OTP purpose");
    }

    await sendEmail(email, emailPayload);
};
