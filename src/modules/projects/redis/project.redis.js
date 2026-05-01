import { redisClient } from "../../../config/redis.js";

const PROJECT_CACHE_PREFIX = "project:";
const TENANT_PROJECTS_CACHE_PREFIX = "tenant_projects:";
const PROJECT_TTL = 1800; // 30 minutes

const buildProjectKey = (id) => `${PROJECT_CACHE_PREFIX}${id}`;
const buildTenantProjectsKey = (tenantId) => `${TENANT_PROJECTS_CACHE_PREFIX}${tenantId}`;

export const getCachedProject = async (id) => {
  const key = buildProjectKey(id);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedProject = async (id, projectData) => {
  const key = buildProjectKey(id);
  await redisClient.set(key, JSON.stringify(projectData), { EX: PROJECT_TTL });
};

export const getCachedProjectList = async (tenantId, queryParams) => {
  const key = `${buildTenantProjectsKey(tenantId)}:${JSON.stringify(queryParams)}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedProjectList = async (tenantId, queryParams, projectsData) => {
  const key = `${buildTenantProjectsKey(tenantId)}:${JSON.stringify(queryParams)}`;
  await redisClient.set(key, JSON.stringify(projectsData), { EX: PROJECT_TTL });
};

export const invalidateProjectCache = async (id, tenantId) => {
  const projectKey = buildProjectKey(id);
  await redisClient.del(projectKey);
  
  // Also invalidate lists for the tenant
  if (tenantId) {
    await invalidateTenantProjectsCache(tenantId);
  }
};

export const invalidateTenantProjectsCache = async (tenantId) => {
  const pattern = `${TENANT_PROJECTS_CACHE_PREFIX}${tenantId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
