import { redisClient } from "../../../config/redis.js";

const TASK_CACHE_PREFIX = "task:";
const PROJECT_TASKS_CACHE_PREFIX = "project_tasks:";
const TASK_TTL = 1800; // 30 minutes

const buildTaskKey = (id) => `${TASK_CACHE_PREFIX}${id}`;
const buildProjectTasksKey = (projectId) => `${PROJECT_TASKS_CACHE_PREFIX}${projectId}`;

export const getCachedTask = async (id) => {
  const key = buildTaskKey(id);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedTask = async (id, taskData) => {
  const key = buildTaskKey(id);
  await redisClient.set(key, JSON.stringify(taskData), { EX: TASK_TTL });
};

export const getCachedTaskList = async (projectId, queryParams) => {
  const key = `${buildProjectTasksKey(projectId)}:${JSON.stringify(queryParams)}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedTaskList = async (projectId, queryParams, tasksData) => {
  const key = `${buildProjectTasksKey(projectId)}:${JSON.stringify(queryParams)}`;
  await redisClient.set(key, JSON.stringify(tasksData), { EX: TASK_TTL });
};

export const invalidateTaskCache = async (id, projectId) => {
  await redisClient.del(buildTaskKey(id));
  if (projectId) {
    await invalidateProjectTasksCache(projectId);
  }
};

export const invalidateProjectTasksCache = async (projectId) => {
  const pattern = `${PROJECT_TASKS_CACHE_PREFIX}${projectId}:*`;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
};
