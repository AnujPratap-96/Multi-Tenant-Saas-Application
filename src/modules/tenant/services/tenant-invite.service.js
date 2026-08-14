// Tenant invite service - Business logic for invite operations (D-7)
import { randomBytes } from "crypto";
import { ApiError } from "../../../utils/api-error.js";
import prisma from "../../../lib/prisma.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import * as inviteRepository from "../repositories/tenant-invite.repository.js";
import { TENANT_AUDIT_ACTIONS, TENANT_USER_STATUS, INVITE_EXPIRY_DAYS } from "../constants/tenant.constants.js";
import * as tenantRedis from "../redis/tenant.redis.js";
import sendEmail from "../../../lib/sendEmail.js";
import { inviteTemplate } from "../../../templates/invite.template.js";

/**
 * Generate invite token
 * @returns {string} Random token
 */
const generateInviteToken = () => {
  return randomBytes(32).toString('hex');
};

const inviteExpiresAt = () => {
  const date = new Date();
  date.setDate(date.getDate() + INVITE_EXPIRY_DAYS);
  return date;
};

/**
 * Send invite email
 * @param {Object} invite - Invite data ({ token, email, role, tenantId, invitedById })
 */
const sendInviteEmail = async (invite) => {
  const { token, email, role, tenantId, invitedById } = invite;

  const [tenant, inviter] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: invitedById }, select: { firstName: true, lastName: true } }),
  ]);

  const inviterName = inviter ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || 'A team member' : 'A team member';
  const tenantName = tenant?.name || 'the team';

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inviteLink = `${frontendUrl}/invite/accept?token=${token}`;

  const template = inviteTemplate({ inviterName, tenantName, role, inviteLink });

  await sendEmail(email, template);
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
  if (existingInvite && existingInvite.status === 'PENDING') {
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

  // Generate token and create invite (email-keyed row)
  const token = generateInviteToken();
  const expiresAt = inviteExpiresAt();
  const invite = await inviteRepository.upsertInvite({
    tenantId,
    email,
    role,
    invitedById,
    tokenHash: inviteRepository.hashToken(token),
    expiresAt,
  });

  // Store plaintext token in Redis (7-day TTL) for the accept link
  await inviteRepository.storeInviteToken(token, {
    tenantId,
    email,
    role,
    invitedById,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Known emails also get a TenantUser row with INVITED status
  let membership = null;
  if (user) {
    const existingMembership = await membershipRepository.findMembership(tenantId, user.id);
    if (existingMembership) {
      // REMOVED -> reactivate as INVITED
      membership = await membershipRepository.updateMember(tenantId, user.id, {
        role,
        status: 'INVITED',
        invitedById,
        removedAt: null,
      });
    } else {
      membership = await membershipRepository.addMember({
        tenantId,
        userId: user.id,
        role,
        status: 'INVITED',
        invitedById,
      });
    }
  }

  // Send invite email
  await sendInviteEmail({
    token,
    email,
    role,
    tenantId,
    invitedById,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: invitedById,
    subjectUserId: user?.id ?? null,
    tenantId,
    newValue: { email, role },
    req,
  });

  return {
    id: invite.id,
    email,
    role,
    tenantId,
    invitedById,
    status: 'PENDING',
    expiresAt,
    user: user || null,
    membership,
  };
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
 * @param {string} inviteId - Invite ID
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

  const invite = await inviteRepository.findInviteById(tenantId, inviteId);
  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  const cancelledInvite = await inviteRepository.updateInviteStatus(inviteId, {
    status: 'CANCELLED',
  });

  // Clean up the INVITED membership row for known emails
  const user = await prisma.user.findUnique({ where: { email: invite.email } });
  if (user) {
    const membership = await membershipRepository.findMembership(tenantId, user.id);
    if (membership && membership.status === 'INVITED') {
      await membershipRepository.updateMember(tenantId, user.id, {
        status: 'REMOVED',
        removedAt: new Date(),
      });
      await tenantRedis.invalidateMembershipCache(tenantId, user.id);
    }
  }

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_CANCELLED,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: user?.id ?? null,
    tenantId,
    newValue: { email: invite.email },
    req,
  });

  return cancelledInvite;
};

/**
 * Resend an invite
 * @param {string} tenantId - Tenant ID
 * @param {string} inviteId - Invite ID
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

  const invite = await inviteRepository.findInviteById(tenantId, inviteId);
  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  if (invite.status !== 'PENDING') {
    throw new ApiError(400, "Only pending invites can be resent");
  }

  // Generate new token
  const token = generateInviteToken();
  const expiresAt = inviteExpiresAt();

  // Rotate the hashed token in the table
  await inviteRepository.updateInviteStatus(inviteId, {
    tokenHash: inviteRepository.hashToken(token),
    expiresAt,
  });

  // Store new plaintext token in Redis
  await inviteRepository.storeInviteToken(token, {
    tenantId,
    email: invite.email,
    role: invite.role,
    invitedById: invite.invitedById,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  });

  // Send invite email
  await sendInviteEmail({
    token,
    email: invite.email,
    role: invite.role,
    tenantId,
    invitedById: invite.invitedById,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.INVITE_RESENT,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: userId,
    subjectUserId: null,
    tenantId,
    newValue: { email: invite.email, role: invite.role },
    req,
  });

  // Never return the token (S-17)
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    tenantId,
    invitedById: invite.invitedById,
    status: 'PENDING',
    expiresAt,
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

  // Check the invite row is still pending
  const invite = await inviteRepository.findInviteByEmail(tenantId, email);
  if (!invite || invite.status !== 'PENDING') {
    throw new ApiError(400, "No pending invite found for this email");
  }

  if (invite.expiresAt < new Date()) {
    throw new ApiError(400, "Invite has expired");
  }

  // Create or activate the membership
  let membership = await membershipRepository.findMembership(tenantId, userId);
  if (membership) {
    if (membership.status === 'ACTIVE' || membership.status === 'SUSPENDED') {
      throw new ApiError(400, "User is already a member of this tenant");
    }
    membership = await membershipRepository.updateMember(tenantId, userId, {
      role,
      status: 'ACTIVE',
      invitedById: invite.invitedById,
      removedAt: null,
    });
  } else {
    membership = await membershipRepository.addMember({
      tenantId,
      userId,
      role,
      status: 'ACTIVE',
      invitedById: invite.invitedById,
    });
  }

  // Mark invite accepted
  await inviteRepository.updateInviteStatus(invite.id, {
    status: 'ACCEPTED',
    acceptedAt: new Date(),
  });

  // Delete the invite token
  await inviteRepository.deleteInviteToken(token);

  await tenantRedis.invalidateMembershipCache(tenantId, userId);

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

  // Check the invite row is still pending
  const invite = await inviteRepository.findInviteByEmail(tenantId, email);
  if (!invite || invite.status !== 'PENDING') {
    throw new ApiError(400, "No pending invite found for this email");
  }

  // Remove the INVITED membership row
  let membership = null;
  const existingMembership = await membershipRepository.findMembership(tenantId, userId);
  if (existingMembership) {
    membership = await membershipRepository.updateMember(tenantId, userId, {
      status: 'REMOVED',
      removedAt: new Date(),
    });
  }

  // Mark invite rejected
  await inviteRepository.updateInviteStatus(invite.id, {
    status: 'REJECTED',
    acceptedAt: null,
  });

  // Delete the invite token
  await inviteRepository.deleteInviteToken(token);

  await tenantRedis.invalidateMembershipCache(tenantId, userId);

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
