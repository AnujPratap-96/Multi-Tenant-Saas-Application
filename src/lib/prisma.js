import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";
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
// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
export default prisma;
