import { asyncHandler } from "../../utils/async-handler.js";
import { generateOtpService } from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  
    const { email } = req.body;

    const { purpose, expiresAt } = await generateOtpService(email);



    res.status(200).json({
        success: true,
        message: "If the email is valid, an OTP has been sent.",
    });

});
