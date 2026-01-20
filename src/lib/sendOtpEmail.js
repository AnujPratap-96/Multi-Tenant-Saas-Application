import SibApiV3Sdk from 'sib-api-v3-sdk';
import { ApiError } from '../utils/api-error.js';
import { env } from '../config/env.js';
const sendOtpEmail = async (toEmail, otp) => {
    try {
        const client = SibApiV3Sdk.ApiClient.instance;
        client.authentications['api-key'].apiKey = env.BREVO_API_KEY;

        const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

        const emailPayload = {
            to: [{ email: toEmail }],
            sender: {
                name: 'Multi-Tenant App',
                email: 'no-reply@devs-tinder.site',
            },
            subject: 'Your OTP Code',
            htmlContent: `<p>Your OTP is <strong>${otp}</strong></p>`,
        };

        await emailApi.sendTransacEmail(emailPayload);

    } catch (error) {
        throw new ApiError(500, 'Failed to send OTP email');
    }
};
export default sendOtpEmail;