import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { getDashboardStats } from "../repositories/dashboard.repository.js";

export const getDashboardStatsController = asyncHandler(async (req, res) => {
  const data = await getDashboardStats(req.tenantId);
  return successResponse(res, {
    message: "Dashboard stats retrieved successfully",
    data,
  });
});
