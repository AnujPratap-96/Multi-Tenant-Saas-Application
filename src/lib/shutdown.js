// lib/shutdown.js (B-22: single shutdown module — closes HTTP server, workers, DB, Redis)
import logger from "./logger.js";

let server = null;
let registered = false;
const handlers = [];

export const registerShutdownHandler = (fn) => {
  handlers.push(fn);
};

export const setHttpServer = (srv) => {
  server = srv;
};

export const setupGracefulShutdown = () => {
  if (registered) return;
  registered = true;

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down...`);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      logger.info("HTTP server closed");
    }
    for (const fn of handlers.splice(0)) {
      try {
        await fn();
      } catch (err) {
        logger.error(err, "Shutdown handler failed");
      }
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};