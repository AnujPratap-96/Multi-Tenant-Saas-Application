import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    rejectUnauthorized: false, // usually required for cloud
    reconnectStrategy: (retries) => {
      // Fail fast instead of retrying forever
      if (retries > 20) {
        return new Error("Redis connection failed after repeated attempts");
      }
      return Math.min(500 * retries, 2000);
    },
  },
});

redisClient.on("error", (err) =>
  console.error("Redis error:", err)
);


