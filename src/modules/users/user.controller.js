// User controller - HTTP handling for user operations
import * as userService from "./user.service.js";
import { successResponse } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";

/**
 * Get current user profile
 * @route GET /api/v1/users/me
 */
export const getMyProfileController = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.userId);
  return successResponse(res, {
    message: "Profile retrieved successfully",
    data: user,
  });
});

/**
 * Update current user profile
 * @route PATCH /api/v1/users/me
 */
export const updateMyProfileController = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.userId, req.body);
  return successResponse(res, {
    message: "Profile updated successfully",
    data: user,
  });
});

/**
 * Get user profile by ID
 * @route GET /api/v1/users/:id
 */
export const getUserByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserProfile(id);
  return successResponse(res, {
    message: "User profile retrieved successfully",
    data: user,
  });
});
