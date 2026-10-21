import { asyncHandler } from "../../../utils/async-handler.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { loginWithEmailPasswordService, loginWithOtpService } from "../services/login.service.js";
import { logoutService } from "../services/logout.service.js";
import { setAuthCookies } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";
import { googleLoginService } from "../services/google.service.js";
import { clearAuthCookies } from "../../../utils/cookies.js";
import { env } from "../../../config/env.js";

export const loginWithEmailAndPasswordController = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithEmailPasswordService(email, password, ipAddress, userAgent);

  setAuthCookies(res, { accessToken, refreshToken });

  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user,
  });
});

export const loginWithOtpController = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const { requestId, purpose } = req.query;

  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken, user } = await loginWithOtpService(otp, ipAddress, userAgent, requestId, purpose);

  setAuthCookies(res, { accessToken, refreshToken });
  return successResponse(res, {
    success: true,
    message: "Login successful",
    data: user,
  });
});


export const loginWithGoogleController = asyncHandler(async (req, res) => {
  const { ipAddress, userAgent } = getRequestContext(req);
  const { accessToken, refreshToken, user } = await googleLoginService(req.user, ipAddress, userAgent);

  setAuthCookies(res, { accessToken, refreshToken });

  const userJson = JSON.stringify(user);
  const frontendUrl = env.FRONTEND_URL;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Authenticating...</title>
      </head>
      <body>
        <script>
          (function() {
            var sent = false;
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ type: "OAUTH_SUCCESS", user: ${userJson} }, "*");
                sent = true;
                window.close();
              }
            } catch (err) {}
            if (!sent) {
              window.location.href = "${frontendUrl}/dashboard";
            }
          })();
        </script>
        <p style="font-family: sans-serif; text-align: center; margin-top: 40px;">
          Authentication successful. Closing window...
        </p>
      </body>
    </html>
  `);
});

export const logoutController = asyncHandler(async (req, res) => {

  const userId = req.userId;
  const refreshToken = req.cookies?.refreshToken;
  const { ipAddress, userAgent } = getRequestContext(req);
  const data = await logoutService({ userId, refreshToken, ipAddress, userAgent });
  clearAuthCookies(res);
  return successResponse(res, data);
});