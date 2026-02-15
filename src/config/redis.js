import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    rejectUnauthorized: false, // usually required for cloud
  },
});

redisClient.on("error", (err) =>
  console.error("Redis error:", err)
);


