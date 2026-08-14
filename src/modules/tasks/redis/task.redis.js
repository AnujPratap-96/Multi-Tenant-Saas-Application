import { redisClient } from "../../../config/redis.js";

const TASK_CACHE_PREFIX = "task:";
const PROJECT_TASKS_CACHE_PREFIX = "project_tasks:";
const TASK_TTL = 1800; // 30 minutes

const buildTaskKey = (id) => `${TASK_CACHE_PREFIX}${id}`;
const buildProjectTasksKey = (tenantId, projectId) => `${PROJECT_TASKS_CACHE_PREFIX}${tenantId}:${projectId}`;

export const getCachedTask = async (id) => {
  const key = buildTaskKey(id);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedTask = async (id, taskData) => {
  const key = buildTaskKey(id);
  await redisClient.set(key, JSON.stringify(taskData), { EX: TASK_TTL });
};

export const getCachedTaskList = async (tenantId, projectId, queryParams) => {
  const key = `${buildProjectTasksKey(tenantId, projectId)}:${JSON.stringify(queryParams)}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedTaskList = async (tenantId, projectId, queryParams, tasksData) => {
  const key = `${buildProjectTasksKey(tenantId, projectId)}:${JSON.stringify(queryParams)}`;
  await redisClient.set(key, JSON.stringify(tasksData), { EX: TASK_TTL });
};

export const invalidateTaskCache = async (id, projectId, tenantId) => {
  await redisClient.del(buildTaskKey(id));
  if (projectId) {
    await invalidateProjectTasksCache(tenantId, projectId);
  }
};

export const invalidateProjectTasksCache = async (tenantId, projectId) => {
  const pattern = `${buildProjectTasksKey(tenantId, projectId)}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
