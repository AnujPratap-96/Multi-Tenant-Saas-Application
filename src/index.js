import { env } from "./config/env.js";
import logger from "./lib/logger.js";
import { connectDB } from "./lib/db.js";
import app from "./app.js"; // we'll create this next
import { redisClient } from "./config/redis.js";
async function startServer() {
  await connectDB(); // 👈 DB READY FIRST
  await redisClient.connect(); // 👈 Redis READY FIRST
  app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT}`);
  });
}

startServer();

process.on("SIGINT", async () => {
  logger.info("SIGINT received. Shutting down...");
  await redisClient.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down...");

  process.exit(0);
});
