import { env } from "./config/env.js";
import logger from "./lib/logger.js";
import { connectDB } from "./lib/db.js";
import app from "./app.js";
import { redisClient } from "./config/redis.js";
import { startWorkers, stopWorkers } from "./modules/queue/services/queue.service.js";
import { setupGracefulShutdown, setHttpServer, registerShutdownHandler } from "./lib/shutdown.js";

async function startServer() {
  await connectDB();
  await redisClient.connect();
  startWorkers();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT}`);
  });
  // B-22: single shutdown module owns all signal handling
  setHttpServer(server);
  registerShutdownHandler(() => redisClient.quit());
  registerShutdownHandler(stopWorkers);
  setupGracefulShutdown();
}

startServer();