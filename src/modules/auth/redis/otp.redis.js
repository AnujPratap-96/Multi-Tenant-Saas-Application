// src/modules/auth/redis/otp.redis.js

import { redisClient } from "../../../config/redis.js";

const buildKey = (requestId) => `otp:${requestId}`;

const emailKeyWithPurpose = (email, purpose) => `otp:${purpose}:${email}`;

export const saveRequestIdByEmailAndPurpose = async (email, purpose, requestId, ttl) => {
  const key = emailKeyWithPurpose(email, purpose);
  await redisClient.set(
    key,
    requestId,
    { EX: ttl }
  );
}

export const getOtpByEmailAndPurpose = async (email, purpose) => {
  const key = emailKeyWithPurpose(email, purpose);
  return await redisClient.get(key);
}

export const getOtp = async (requestId) => {
  const key = buildKey(requestId);
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const saveOtp = async ({
  requestId,
  data,
  ttl,
}) => {
  const key = buildKey(requestId);

  await redisClient.set(
    key,
    JSON.stringify(data),
    { EX: ttl }
  );
};

export const updateOtp = async ({
  requestId,
  data,
  ttl,
}) => {
  const key = buildKey(requestId);

  await redisClient.set(
    key,
    JSON.stringify(data),
    { EX: ttl }
  );
};

export const deleteOtp = async (requestId) => {
  const key = buildKey(requestId);
  await redisClient.del(key);
};


export const deleteOtpByEmailAndPurpose = async (email, purpose) => {
  const key = emailKeyWithPurpose(email, purpose);
  await redisClient.del(key);
}