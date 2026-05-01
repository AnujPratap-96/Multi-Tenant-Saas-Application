import { asyncHandler } from "../../../utils/async-handler.js";
import { successResponse } from "../../../utils/response.js";
import { prisma } from "../../../lib/db.js";
import { redisClient } from "../../../config/redis.js";

export const getHealth = asyncHandler(async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    services: {
      database: "unknown",
      redis: "unknown",
    },
  };

  try {
    // Check Database
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = "healthy";
  } catch (error) {
    healthCheck.services.database = "unhealthy";
    healthCheck.message = "ERROR";
  }

  try {
    // Check Redis
    await redisClient.ping();
    healthCheck.services.redis = "healthy";
  } catch (error) {
    healthCheck.services.redis = "unhealthy";
    healthCheck.message = "ERROR";
  }

  return successResponse(res, healthCheck);
});
