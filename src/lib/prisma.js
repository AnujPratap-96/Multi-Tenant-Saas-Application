import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";
import { registerShutdownHandler } from "./shutdown.js";
const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});
// Prisma logs → your logger
prisma.$on("error", (e) => {
  logger.error(e, "Prisma error");
});
prisma.$on("warn", (e) => {
  logger.warn(e, "Prisma warning");
});
// Graceful shutdown (B-22: single shutdown module, no duplicate signal handlers)
registerShutdownHandler(() => prisma.$disconnect());
export default prisma;
