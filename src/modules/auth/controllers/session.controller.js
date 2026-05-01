import { asyncHandler } from "../../../utils/async-handler.js";
import { getRequestContext } from "../../../utils/requestContext.js";
import { setAuthCookies } from "../../../utils/cookies.js";
import { successResponse } from "../../../utils/response.js";
import { refreshAuthTokensService } from "../services/session.service.js";

export const refreshTokensController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const { ipAddress, userAgent } = getRequestContext(req);

  const { accessToken, refreshToken: newRefreshToken, user } = await refreshAuthTokensService(
    refreshToken,
    ipAddress,
    userAgent
  );

  setAuthCookies(res, accessToken, newRefreshToken);

  return successResponse(res, {
    message: "Tokens refreshed successfully",
    data: { user },
  });
});
