import * as userService from "./user.service.js";
import { successResponse } from "../../utils/response.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const getMyProfileController = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfile(req.userId);
  return successResponse(res, {
    message: "Profile retrieved successfully",
    data: user,
  });
});

export const updateMyProfileController = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.userId, req.body);
  return successResponse(res, {
    message: "Profile updated successfully",
    data: user,
  });
});

export const listUsersController = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.tenantId, req.validated.query);
  return successResponse(res, {
    message: "Users retrieved successfully",
    data: result,
  });
});

export const getUserDetailController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserDetail(req.tenantId, id);
  return successResponse(res, {
    message: "User details retrieved successfully",
    data: user,
  });
});

export const updateUserByAdminController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.updateUserByAdmin(req.userId, id, req.tenantId, req.body);
  return successResponse(res, {
    message: "User updated successfully",
    data: user,
  });
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await userService.deleteUser(id, req.tenantId);
  return successResponse(res, {
    message: result.message,
  });
});

export const reactivateUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await userService.reactivateUser(id, req.tenantId);
  return successResponse(res, {
    message: result.message,
  });
});

export const getMySessionsController = asyncHandler(async (req, res) => {
  const sessions = await userService.getUserSessions(req.userId);
  return successResponse(res, {
    message: "Sessions retrieved successfully",
    data: sessions,
  });
});

export const revokeMySessionController = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await userService.revokeUserSession(req.userId, sessionId);
  return successResponse(res, {
    message: result.message,
  });
});
