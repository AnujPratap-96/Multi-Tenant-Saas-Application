import { redisClient } from "../../../config/redis.js";

const TENANT_CACHE_PREFIX = "tenant:";
const TENANT_MEMBERSHIP_PREFIX = "tenant_m:";
const TENANT_TTL = 3600; // 1 hour
const MEMBERSHIP_TTL = 300; // 5 minutes

const buildTenantKey = (tenantId) => `${TENANT_CACHE_PREFIX}${tenantId}`;
const buildMembershipKey = (tenantId, userId) => `${TENANT_MEMBERSHIP_PREFIX}${tenantId}:${userId}`;

export const getCachedTenant = async (tenantId) => {
  const key = buildTenantKey(tenantId);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedTenant = async (tenantId, tenantData) => {
  const key = buildTenantKey(tenantId);
  await redisClient.set(key, JSON.stringify(tenantData), { EX: TENANT_TTL });
};

export const getCachedMembership = async (tenantId, userId) => {
  const key = buildMembershipKey(tenantId, userId);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedMembership = async (tenantId, userId, membershipData) => {
  const key = buildMembershipKey(tenantId, userId);
  await redisClient.set(key, JSON.stringify(membershipData), { EX: MEMBERSHIP_TTL });
};

export const invalidateTenantCache = async (tenantId) => {
  const key = buildTenantKey(tenantId);
  await redisClient.del(key);
};

export const invalidateMembershipCache = async (tenantId, userId) => {
  const key = buildMembershipKey(tenantId, userId);
  await redisClient.del(key);
};

export const invalidateAllTenantMemberships = async (tenantId) => {
  const pattern = `${TENANT_MEMBERSHIP_PREFIX}${tenantId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
