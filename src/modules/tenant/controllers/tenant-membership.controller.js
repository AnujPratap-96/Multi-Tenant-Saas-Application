// Tenant membership controller - HTTP handling for membership operations
import * as membershipService from "../services/tenant-membership.service.js";
import { successResponse } from "../../../utils/response.js";

/**
 * Add a member to a tenant
 * @route POST /api/v1/tenants/:id/members
 */
export const addMemberController = async (req, res, next) => {
  const { id } = req.params;
  const membership = await membershipService.addMember(id, req.body, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Member added successfully",
    data: membership,
  });
};

/**
 * Update member role
 * @route PATCH /api/v1/tenants/:id/members/:userId
 */
export const updateMemberController = async (req, res, next) => {
  const { id, userId } = req.params;
  const membership = await membershipService.updateMemberRole(id, userId, req.body, req.userId, req);
  return successResponse(res, {
    message: "Member role updated successfully",
    data: membership,
  });
};

/**
 * Remove member from tenant
 * @route DELETE /api/v1/tenants/:id/members/:userId
 */
export const removeMemberController = async (req, res, next) => {
  const { id, userId } = req.params;
  await membershipService.removeMember(id, userId, req.userId, req);
  return successResponse(res, {
    message: "Member removed successfully",
  });
};

/**
 * Suspend member
 * @route POST /api/v1/tenants/:id/members/:userId/suspend
 */
export const suspendMemberController = async (req, res, next) => {
  const { id, userId } = req.params;
  const membership = await membershipService.suspendMember(id, userId, req.userId, req);
  return successResponse(res, {
    message: "Member suspended successfully",
    data: membership,
  });
};

/**
 * Restore suspended member
 * @route POST /api/v1/tenants/:id/members/:userId/restore
 */
export const restoreMemberController = async (req, res, next) => {
  const { id, userId } = req.params;
  const membership = await membershipService.restoreMember(id, userId, req.userId, req);
  return successResponse(res, {
    message: "Member restored successfully",
    data: membership,
  });
};

/**
 * List members of a tenant
 * @route GET /api/v1/tenants/:id/members
 */
export const listMembersController = async (req, res, next) => {
  const { id } = req.params;
  const { page, limit, status, role } = req.query;
  const result = await membershipService.listMembers(id, req.userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    role,
  });
  return successResponse(res, {
    message: "Members retrieved successfully",
    data: result,
  });
};

/**
 * Get member details
 * @route GET /api/v1/tenants/:id/members/:userId
 */
export const getMemberController = async (req, res, next) => {
  const { id, userId } = req.params;
  const membership = await membershipService.getMember(id, userId, req.userId);
  return successResponse(res, {
    message: "Member retrieved successfully",
    data: membership,
  });
};
