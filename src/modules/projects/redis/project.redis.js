import { redisClient } from "../../../config/redis.js";

const PROJECT_CACHE_PREFIX = "project:";
const TENANT_PROJECTS_CACHE_PREFIX = "tenant_projects:";
const PROJECT_TTL = 1800; // 30 minutes

const buildProjectKey = (id) => `${PROJECT_CACHE_PREFIX}${id}`;
const buildTenantProjectsKey = (tenantId) => `${TENANT_PROJECTS_CACHE_PREFIX}${tenantId}`;

export const getCachedProject = async (id) => {
  try {
    const key = buildProjectKey(id);
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCachedProject = async (id, projectData) => {
  try {
    const key = buildProjectKey(id);
    await redisClient.set(key, JSON.stringify(projectData), { EX: PROJECT_TTL });
  } catch {
    // ignore cache failure
  }
};

export const getCachedProjectList = async (tenantId, userId, queryParams) => {
  try {
    const userScope = userId || "all";
    const key = `${buildTenantProjectsKey(tenantId)}:${userScope}:${JSON.stringify(queryParams)}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCachedProjectList = async (tenantId, userId, queryParams, projectsData) => {
  try {
    const userScope = userId || "all";
    const key = `${buildTenantProjectsKey(tenantId)}:${userScope}:${JSON.stringify(queryParams)}`;
    await redisClient.set(key, JSON.stringify(projectsData), { EX: PROJECT_TTL });
  } catch {
    // ignore cache failure
  }
};

export const invalidateProjectCache = async (id, tenantId) => {
  try {
    const projectKey = buildProjectKey(id);
    await redisClient.del(projectKey);
    
    // Also invalidate lists for the tenant
    if (tenantId) {
      await invalidateTenantProjectsCache(tenantId);
    }
  } catch {
    // ignore cache failure
  }
};

export const invalidateTenantProjectsCache = async (tenantId) => {
  try {
    const pattern = `${TENANT_PROJECTS_CACHE_PREFIX}${tenantId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch {
    // ignore cache failure
  }
};
