import pkg from "@prisma/client";
import logger from "./logger.js";
import {env} from "../config/env.js";
import { PrismaPg } from "@prisma/adapter-pg";

// 🔌 PostgreSQL adapter (REQUIRED in Prisma 7)
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

const { PrismaClient } = pkg;

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("error", (e) => {
  logger.error(e, "Prisma error");
});

prisma.$on("warn", (e) => {
  logger.warn(e, "Prisma warning");
});

export default prisma;
