// Tenant invite service - Business logic for invite operations
import { randomBytes } from "crypto";
import { ApiError } from "../../../utils/api-error.js";
import prisma from "../../../lib/prisma.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import * as inviteRepository from "../repositories/tenant-invite.repository.js";
import { TENANT_AUDIT_ACTIONS, TENANT_USER_STATUS } from "../constants/tenant.constants.js";

/**
 * Generate invite token
 * @returns {string} Random token
 */
const generateInviteToken = () => {
  return randomBytes(32).toString('hex');
};

/**
 * Send invite email (placeholder - integrate with email service)
 * @param {Object} invite - Invite data
 */
const sendInviteEmail = async (invite) => {
  // TODO: Integrate with actual email service
  console.log(`Sending invite email to ${invite.email} with token ${invite.token}`);
};

/**
 * Create an invite
 * @param {string} tenantId - Tenant ID
 * @param {Object} data - Invite data
 * @param {string} invitedById - User ID of inviter
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Created invite
 */
export const createInvite = async (tenantId, data, invitedById, req) => {
  const { email, role } = data;

  // Check if inviting user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, invitedById);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can invite users");
  }

  // Check if tenant exists
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Check if there's already a pending invite for this email
  const existingInvite = await inviteRepository.findInviteByEmail(tenantId, email);
  if (existingInvite) {
    throw new ApiError(400, "There's already a pending invite for this email");
  }

  // Check if user is already a member
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const existingMembership = await membershipRepository.findMembership(tenantId, user.id);
    if (existingMembership && existingMembership.status !== 'REMOVED') {
      throw new ApiError(400, "User is already a member of this tenant");
    }
  }

  // Generate token and create invite
  const token = generateInviteToken();
  const invite = await inviteRepository.createInvite({
    tenantId,
    email,
    role,
    invitedById,
    token,
  });

  // Send invite email
  await sendInviteEmail(invite);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: invitedById,
    tenantId,
    newValue: { email, role },
    req,
  });

  return invite;
};

/**
 * List invites for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of invites
 */
export const listInvites = async (tenantId, userId, options = {}) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can list invites");
  }

  return await inviteRepository.listInvites(tenantId, options);
};

/**
 * Cancel an invite
 * @param {string} tenantId - Tenant ID
 * @param {string} inviteId - Invite ID (userId of invited user)
 * @param {string} userId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Cancelled invite
 */
export const cancelInvite = async (tenantId, inviteId, userId, req) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can cancel invites");
  }

  // Get the invited user
  const invite = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId: inviteId,
      status: 'INVITED',
    },
  });

  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  const cancelledInvite = await inviteRepository.cancelInvite(tenantId, inviteId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_CANCELLED,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: inviteId,
    tenantId,
    req,
  });

  return cancelledInvite;
};

/**
 * Resend an invite
 * @param {string} tenantId - Tenant ID
 * @param {string} inviteId - Invite ID (userId of invited user)
 * @param {string} userId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Resent invite
 */
export const resendInvite = async (tenantId, inviteId, userId, req) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can resend invites");
  }

  // Get the invited user
  const invite = await prisma.tenantUser.findFirst({
    where: {
      tenantId,
      userId: inviteId,
      status: 'INVITED',
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  // Generate new token
  const token = generateInviteToken();
  
  // Store new token in Redis
  await inviteRepository.storeInviteToken(token, {
    tenantId,
    email: invite.user.email,
    role: invite.role,
    invitedById: invite.invitedById,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Send invite email
  await sendInviteEmail({
    token,
    email: invite.user.email,
    role: invite.role,
    tenantId,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_RESENT,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: inviteId,
    tenantId,
    req,
  });

  return {
    ...invite,
    token,
  };
};

/**
 * Accept an invite
 * @param {string} token - Invite token
 * @param {string} userId - User ID accepting the invite
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Updated membership
 */
export const acceptInvite = async (token, userId, req) => {
  // Get invite from token
  const inviteData = await inviteRepository.getInviteByToken(token);
  if (!inviteData) {
    throw new ApiError(400, "Invalid or expired invite token");
  }

  const { tenantId, email, role } = inviteData;

  // Verify user owns this email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
    throw new ApiError(403, "This invite was sent to a different email address");
  }

  // Check if there's a pending invite
  const existingInvite = await inviteRepository.findInviteByEmail(tenantId, email);
  if (!existingInvite) {
    throw new ApiError(400, "No pending invite found for this email");
  }

  // Accept the invite
  const membership = await inviteRepository.acceptInvite(tenantId, userId);

  // Delete the invite token
  await inviteRepository.deleteInviteToken(token);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_ACCEPTED,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    tenantId,
    newValue: { role },
    req,
  });

  return membership;
};

/**
 * Reject an invite
 * @param {string} token - Invite token
 * @param {string} userId - User ID rejecting the invite
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Rejected membership
 */
export const rejectInvite = async (token, userId, req) => {
  // Get invite from token
  const inviteData = await inviteRepository.getInviteByToken(token);
  if (!inviteData) {
    throw new ApiError(400, "Invalid or expired invite token");
  }

  const { tenantId, email } = inviteData;

  // Verify user owns this email
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
    throw new ApiError(403, "This invite was sent to a different email address");
  }

  // Reject the invite
  const membership = await inviteRepository.rejectInvite(tenantId, userId);

  // Delete the invite token
  await inviteRepository.deleteInviteToken(token);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_REJECTED,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: userId,
    tenantId,
    req,
  });

  return membership;
};
