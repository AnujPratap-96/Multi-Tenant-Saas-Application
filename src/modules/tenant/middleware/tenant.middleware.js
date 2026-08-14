// Tenant middleware - Middleware for tenant context handling
import { asyncHandler } from "../../../utils/async-handler.js";
import { ApiError } from "../../../utils/api-error.js";
import * as tenantRepository from "../repositories/tenant.repository.js";
import * as membershipRepository from "../repositories/tenant-membership.repository.js";
import * as tenantRedis from "../redis/tenant.redis.js";

/**
 * Resolve tenant from request header and attach to request
 * Extracts X-Tenant-ID header and validates tenant exists and user is a member
 */
export const resolveTenant = asyncHandler(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  
  // Allow if endpoint doesn't require tenant context
  if (!tenantId) {
    return next();
  }
  
  // Verify tenant exists and is active (Check Cache first)
  let tenant = await tenantRedis.getCachedTenant(tenantId);
  if (!tenant) {
    tenant = await tenantRepository.findActiveTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, "Tenant not found or inactive");
    }
    await tenantRedis.setCachedTenant(tenantId, tenant);
  }
  
  // If user is authenticated, verify membership
  if (req.userId) {
    let membership = await tenantRedis.getCachedMembership(tenantId, req.userId);
    
    if (!membership) {
      membership = await membershipRepository.findMembership(tenantId, req.userId);
      if (!membership) {
        throw new ApiError(403, "You are not a member of this tenant");
      }
      await tenantRedis.setCachedMembership(tenantId, req.userId, membership);
    }
    
    if (membership.status === 'SUSPENDED') {
      throw new ApiError(403, "Your access to this tenant is suspended");
    }
    
    if (membership.status === 'REMOVED') {
      throw new ApiError(403, "You are no longer a member of this tenant");
    }
    
    if (membership.status === 'INVITED') {
      throw new ApiError(403, "Accept your invite before accessing this tenant");
    }
    
    req.tenantMembership = membership;
  }
  
  req.tenant = tenant;
  req.tenantId = tenant.id;
  
  next();
});

/**
 * Require tenant context - throws error if X-Tenant-ID is not provided
 */
export const requireTenant = asyncHandler(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
    throw new ApiError(400, "Tenant context required. Please provide X-Tenant-ID header");
  }
  
  if (!req.tenant) {
    throw new ApiError(404, "Tenant not found or inactive");
  }
  
  next();
});

/**
 * Require tenant admin role
 */
export const requireTenantAdmin = asyncHandler(async (req, res, next) => {
  if (!req.tenantId) {
    throw new ApiError(400, "Tenant context required");
  }
  
  if (!req.userId) {
    throw new ApiError(401, "Authentication required");
  }
  
  const isAdmin = await membershipRepository.isTenantAdmin(req.tenantId, req.userId);
  if (!isAdmin) {
    throw new ApiError(403, "Admin access required");
  }
  
  next();
});

/**
 * Require tenant owner role
 */
export const requireTenantOwner = asyncHandler(async (req, res, next) => {
  if (!req.tenantId) {
    throw new ApiError(400, "Tenant context required");
  }
  
  if (!req.userId) {
    throw new ApiError(401, "Authentication required");
  }
  
  const isOwner = await tenantRepository.isTenantOwner(req.tenantId, req.userId);
  if (!isOwner) {
    throw new ApiError(403, "Owner access required");
  }
  
  next();
});
