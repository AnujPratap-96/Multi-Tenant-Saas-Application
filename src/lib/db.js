import prisma from "./prisma.js";
import logger from "./logger.js";
export async function connectDB() {
  try {
    logger.info("Connecting to database...");
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection successful");
  } catch (error) {
    logger.fatal(error, "Database connection failed");
    process.exit(1); // FAIL FAST
  }
}
