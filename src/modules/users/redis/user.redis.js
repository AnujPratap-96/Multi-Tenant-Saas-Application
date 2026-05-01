import { redisClient } from "../../../config/redis.js";

const USER_CACHE_PREFIX = "user:";
const USER_TTL = 3600; // 1 hour

const buildUserKey = (userId) => `${USER_CACHE_PREFIX}${userId}`;

export const getCachedUser = async (userId) => {
  const key = buildUserKey(userId);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCachedUser = async (userId, userData) => {
  const key = buildUserKey(userId);
  await redisClient.set(key, JSON.stringify(userData), { EX: USER_TTL });
};

export const invalidateUserCache = async (userId) => {
  const key = buildUserKey(userId);
  await redisClient.del(key);
};
