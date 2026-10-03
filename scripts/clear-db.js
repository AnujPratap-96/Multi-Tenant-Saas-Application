import prisma from "../src/lib/prisma.js";
import { redisClient } from "../src/config/redis.js";

async function clearDatabase() {
  console.log("Connecting to database...");
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        console.log(`Truncated table: ${tablename}`);
      } catch (error) {
        console.error(`Error truncating ${tablename}:`, error.message);
      }
    }
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.flushAll();
    console.log("Flushed Redis cache.");
    await redisClient.quit();
  } catch (err) {
    console.warn("Redis flush notice:", err.message);
  }

  console.log("All database tables cleared successfully.");
  await prisma.$disconnect();
}

clearDatabase().catch((err) => {
  console.error("Failed to clear database:", err);
  process.exit(1);
});
