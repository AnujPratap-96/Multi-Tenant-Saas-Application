// Tenant invite controller - HTTP handling for invite operations
import * as inviteService from "../services/tenant-invite.service.js";
import { successResponse } from "../../../utils/response.js";

/**
 * Create an invite
 * @route POST /api/v1/tenants/:id/invites
 */
export const createInviteController = async (req, res, next) => {
  const { id } = req.params;
  const invite = await inviteService.createInvite(id, req.body, req.userId, req);
  return successResponse(res, {
    statusCode: 201,
    message: "Invite sent successfully",
    data: invite,
  });
};

/**
 * List invites for a tenant
 * @route GET /api/v1/tenants/:id/invites
 */
export const listInvitesController = async (req, res, next) => {
  const { id } = req.params;
  const { page, limit, status } = req.query;
  const result = await inviteService.listInvites(id, req.userId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
  });
  return successResponse(res, {
    message: "Invites retrieved successfully",
    data: result,
  });
};

/**
 * Cancel an invite
 * @route DELETE /api/v1/tenants/:id/invites/:inviteId
 */
export const cancelInviteController = async (req, res, next) => {
  const { id, inviteId } = req.params;
  const invite = await inviteService.cancelInvite(id, inviteId, req.userId, req);
  return successResponse(res, {
    message: "Invite cancelled successfully",
    data: invite,
  });
};

/**
 * Resend an invite
 * @route POST /api/v1/tenants/:id/invites/:inviteId/resend
 */
export const resendInviteController = async (req, res, next) => {
  const { id, inviteId } = req.params;
  const invite = await inviteService.resendInvite(id, inviteId, req.userId, req);
  return successResponse(res, {
    message: "Invite resent successfully",
    data: invite,
  });
};

/**
 * Accept an invite
 * @route POST /api/v1/tenants/invites/accept
 */
export const acceptInviteController = async (req, res, next) => {
  const { token } = req.body;
  const membership = await inviteService.acceptInvite(token, req.userId, req);
  return successResponse(res, {
    message: "Invite accepted successfully",
    data: membership,
  });
};

/**
 * Reject an invite
 * @route POST /api/v1/tenants/invites/reject
 */
export const rejectInviteController = async (req, res, next) => {
  const { token } = req.body;
  const membership = await inviteService.rejectInvite(token, req.userId, req);
  return successResponse(res, {
    message: "Invite rejected successfully",
    data: membership,
  });
};
