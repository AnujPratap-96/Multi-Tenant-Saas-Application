// Tenant service - Business logic for tenant operations
import { ApiError } from "../../../utils/api-error.js";
import { logAudit } from "../../../lib/audit.logger.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as User from "../../users/user.repository.js";
import * as tenantHelper from "../utils/tenant-helper.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import { DEFAULT_TENANT_PLAN, TENANT_AUDIT_ACTIONS, TENANT_USER_STATUS } from "../constants/tenant.constants.js";
import * as tenantRedis from "../redis/tenant.redis.js";

/**
 * Create a new tenant
 * @param {Object} data - Tenant data
 * @param {string} ownerUserId - Owner user ID
 * @param {Object} req - Request object for audit
 * @returns {Promise<Object>} Created tenant
 */
export const createTenant = async (data, ownerUserId, req) => {
  const { name, plan = DEFAULT_TENANT_PLAN } = data;

  // Validate owner user exists
  const ownerUser = await User.findUserById(ownerUserId);
  if (!ownerUser) {
    throw new ApiError(400, "Owner user not found");
  }

  const { slug, Tname } = tenantHelper.createTenantSlugAndName(name);

  // Check if slug already exists
  const existingTenant = await tenantRepository.findTenantBySlug(slug);
  if (existingTenant) {
    throw new ApiError(400, "A tenant with a similar name already exists. Please choose a different name.");
  }


  const tenant = await tenantRepository.createTenantWithOwner({
    name: Tname,
    slug,
    plan,
    ownerUserId,
  });

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.CREATE,
    entityType: "TENANT",
    entityId: tenant.id,
    actorUserId: ownerUserId,
    tenantId: tenant.id,
    newValue: { name: Tname, slug, plan },
    req,
  });
  return tenant;
};

/**
 * Get tenant by ID
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Tenant
 */
export const getTenant = async (tenantId, userId) => {
  // Check if user is a member
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(403, "You are not a member of this tenant");
  }

  // Try to get from cache
  const cachedTenant = await tenantRedis.getCachedTenant(tenantId);
  let tenant = cachedTenant;

  if (!tenant) {
    tenant = await tenantRepository.findActiveTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, "Tenant not found");
    }
    // Save to cache
    await tenantRedis.setCachedTenant(tenantId, tenant);
  }

  return {
    ...tenant,
    userRole: membership.role,
    userStatus: membership.status,
  };
};

/**
 * Update tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} data - Update data
 * @param {string} userId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Updated tenant
 */
export const updateTenant = async (tenantId, data, userId, req) => {
  // Check if user is admin
  const isAdmin = await membershipRepository.isTenantAdmin(tenantId, userId);
  if (!isAdmin) {
    throw new ApiError(403, "Only admins can update tenant");
  }

  const oldTenant = await tenantRepository.findTenantById(tenantId);
  if (!oldTenant) {
    throw new ApiError(404, "Tenant not found");
  }

  if (oldTenant.deletedAt) {
    throw new ApiError(400, "Cannot update a deleted tenant");
  }

  const tenant = await tenantRepository.updateTenant(tenantId, data);

  // Invalidate cache
  await tenantRedis.invalidateTenantCache(tenantId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.UPDATE,
    entityType: 'TENANT',
    entityId: tenant.id,
    actorUserId: userId,
    tenantId: tenant.id,
    oldValue: { name: oldTenant.name, plan: oldTenant.plan },
    newValue: { name: tenant.name, plan: tenant.plan },
    req,
  });

  return tenant;
};

/**
 * Delete (soft delete) tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Deleted tenant
 */
export const deleteTenant = async (tenantId, userId, req) => {
  // Check if user is owner
  const isOwner = await tenantRepository.isTenantOwner(tenantId, userId);
  if (!isOwner) {
    throw new ApiError(403, "Only the owner can delete the tenant");
  }

  const tenant = await tenantRepository.findTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  if (tenant.deletedAt) {
    throw new ApiError(400, "Tenant is already deleted");
  }

  const deletedTenant = await tenantRepository.softDeleteTenant(tenantId);

  // Invalidate cache
  await tenantRedis.invalidateTenantCache(tenantId);
  await tenantRedis.invalidateAllTenantMemberships(tenantId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.DELETE,
    entityType: 'TENANT',
    entityId: tenant.id,
    actorUserId: userId,
    tenantId: tenant.id,
    oldValue: { name: tenant.name, plan: tenant.plan },
    req,
  });

  return deletedTenant;
};

/**
 * Restore tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @param {Object} req - Request object
 * @returns {Promise<Object>} Restored tenant
 */
export const restoreTenant = async (tenantId, userId, req) => {
  // Check if user is owner
  const isOwner = await tenantRepository.isTenantOwner(tenantId, userId);
  if (!isOwner) {
    throw new ApiError(403, "Only the owner can restore the tenant");
  }

  const tenant = await tenantRepository.findTenantByIdIncludingDeleted(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found");
  }

  if (!tenant.deletedAt) {
    throw new ApiError(400, "Tenant is not deleted");
  }

  const restoredTenant = await tenantRepository.restoreTenant(tenantId);

  // Log audit
  await logAudit({
    action: TENANT_AUDIT_ACTIONS.RESTORE,
    entityType: 'TENANT',
    entityId: tenant.id,
    actorUserId: userId,
    tenantId: tenant.id,
    newValue: { name: restoredTenant.name, plan: restoredTenant.plan },
    req,
  });

  return restoredTenant;
};

/**
 * List tenants for current user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} List of tenants
 */
export const listTenants = async (userId, options = {}) => {
  return await tenantRepository.listTenantsForUser(userId, options);
};

/**
 * Switch to a different tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} userId - Current user ID
 * @returns {Promise<Object>} Tenant membership info
 */
export const switchTenant = async (tenantId, userId) => {
  // Check if user is a member (any status except REMOVED)
  const membership = await membershipRepository.findMembership(tenantId, userId);
  if (!membership) {
    throw new ApiError(403, "You are not a member of this tenant");
  }

  if (membership.status === TENANT_USER_STATUS.SUSPENDED) {
    throw new ApiError(403, "Your access to this tenant is suspended");
  }

  if (membership.status === TENANT_USER_STATUS.REMOVED) {
    throw new ApiError(403, "You are no longer a member of this tenant");
  }

  const tenant = await tenantRepository.findActiveTenantById(tenantId);
  if (!tenant) {
    throw new ApiError(404, "Tenant not found or inactive");
  }

  return {
    tenant,
    role: membership.role,
    status: membership.status,
  };
};

/**
 * Get user's tenant memberships (/my endpoint)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of tenant memberships
 */
export const getUserTenants = async (userId) => {
  return await tenantRepository.getUserTenants(userId);
};
