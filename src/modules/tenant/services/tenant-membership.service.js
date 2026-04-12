// Tenant membership service - Business logic for membership operations
import { ApiError } from "../../../utils/api-error.js";
import prisma from "../../../lib/prisma.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import { TENANT_AUDIT_ACTIONS, TENANT_USER_STATUS } from "../constants/tenant.constants.js";

/**
 * Add a member to a tenant
 * @param {string} tenantId - Tenant ID
 * @ data - Member dataparam {Object}
 * @param {string} invitedById - User ID of inviter
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Created membership
 */
export const addMember = async (tenantId, data, invitedById, req) => {
  const { userId, role } = data;

  // Check if inviting user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, invitedById);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can add members");
  }

  // Check if tenant exists
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  // Check if user is already a member
  const existingMembership = await membershipRepository.findMembership(tenantId, userId);
  if (existingMembership) {
    if (existingMembership.status === TENANT_USER_STATUS.REMOVED) {
      // Reactivate if previously removed
      const updated = await membershipRepository.updateMember(tenantId, userId, {
        role,
        status: TENANT_USER_STATUS.ACTIVE,
        removedAt: null,
      });

      await logAudit({
        action: TENANT_AUDIT_ACTIONS.ADD_MEMBER,
        entityType: 'TENANT',
        entityId: tenantId,
        actorUserId: invitedById,
        subjectUserId: userId,
        tenantId,
        newValue: { role },
        req,
      });

      return updated;
    }
    throw new ApiError(400, "User is already a member of this tenant");
  }

  const membership = await membershipRepository.addMember({
    tenantId,
    userId,
    role,
    status: TENANT_USER_STATUS.ACTIVE,
    invitedById,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.ADD_MEMBER,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: invitedById,
    subjectUserId: userId,
    tenantId,
    newValue: { role },
    req,
  });

  return membership;
};

/**
 * Update member role
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Member user ID
 * @param {Object} data - Update data
 * @param {string} actorUserId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Updated membership
 */
export const updateMemberRole = async (tenantId, userId, data, actorUserId, req) => {
  // Check if actor is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, actorUserId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can update member roles");
  }

  // Check if member exists
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  // Cannot change owner role
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (tenant.ownerUserId === userId) {
    throw new ApiError(400, "Cannot change the owner's role");
  }

  const oldRole = membership.role;
  const updatedMembership = await membershipRepository.updateMember(tenantId, userId, {
    role: data.role,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.ROLE_CHANGE,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: actorUserId,
    subjectUserId: userId,
    tenantId,
    oldValue: { role: oldRole },
    newValue: { role: data.role },
    req,
  });

  return updatedMembership;
};

/**
 * Remove member from tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Member user ID
 * @param {string} actorUserId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Removed membership
 */
export const removeMember = async (tenantId, userId, actorUserId, req) => {
  // Check if actor is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, actorUserId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can remove members");
  }

  // Check if member exists
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  // Cannot remove owner
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (tenant.ownerUserId === userId) {
    throw new ApiError(400, "Cannot remove the owner");
  }

  const removedMembership = await membershipRepository.removeMember(tenantId, userId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.REMOVE_MEMBER,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: actorUserId,
    subjectUserId: userId,
    tenantId,
    oldValue: { role: membership.role, status: membership.status },
    req,
  });

  return removedMembership;
};

/**
 * Suspend member
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Member user ID
 * @param {string} actorUserId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Suspended membership
 */
export const suspendMember = async (tenantId, userId, actorUserId, req) => {
  // Check if actor is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, actorUserId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can suspend members");
  }

  // Check if member exists
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  // Cannot suspend owner
  const tenant = await tenantRepository.findTenantById(tenantId);
  if (tenant.ownerUserId === userId) {
    throw new ApiError(400, "Cannot suspend the owner");
  }

  if (membership.status === TENANT_USER_STATUS.SUSPENDED) {
    throw new ApiError(400, "Member is already suspended");
  }

  const suspendedMembership = await membershipRepository.suspendMember(tenantId, userId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.SUSPEND_MEMBER,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: actorUserId,
    subjectUserId: userId,
    tenantId,
    oldValue: { status: membership.status },
    newValue: { status: TENANT_USER_STATUS.SUSPENDED },
    req,
  });

  return suspendedMembership;
};

/**
 * Restore suspended member
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Member user ID
 * @param {string} actorUserId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Restored membership
 */
export const restoreMember = async (tenantId, userId, actorUserId, req) => {
  // Check if actor is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, actorUserId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can restore members");
  }

  // Check if member exists
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  if (membership.status !== TENANT_USER_STATUS.SUSPENDED) {
    throw new ApiError(400, "Member is not suspended");
  }

  const restoredMembership = await membershipRepository.restoreMember(tenantId, userId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.RESTORE_MEMBER,
    entityType: 'TENANT',
    entityId: tenantId,
    actorUserId: actorUserId,
    subjectUserId: userId,
    tenantId,
    oldValue: { status: TENANT_USER_STATUS.SUSPENDED },
    newValue: { status: TENANT_USER_STATUS.ACTIVE },
    req,
  });

  return restoredMembership;
};

/**
 * List members of a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of members
 */
export const listMembers = async (tenantId, userId, options = {}) => {
  // Check if user is a member
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(403, "You are not a member of this tenant");
  }

  return await membershipRepository.listMembers(tenantId, options);
};

/**
 * Get member details
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Member user ID
 * @param {string} currentUserId - Current user ID
 * @returns {Promise<Object>} Member details
 */
export const getMember = async (tenantId, userId, currentUserId) => {
  // Check if current user is a member
  const currentMembership = await membershipRepository.findMembership(tenantId, currentUserId);
  if (!currentMembership) {
    throw new ApiError(403, "You are not a member of this tenant");
  }

  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(404, "Member not found");
  }

  return membership;
};
