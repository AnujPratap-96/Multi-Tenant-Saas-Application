import app from '../../src/app.js';
import prisma from '../../src/lib/prisma.js';
import { redisClient } from '../../src/config/redis.js';

/**
 * Clean up database and redis between tests
 */
export const cleanup = async () => {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Error truncating ${tablename}:`, error);
      }
    }
  }

  await redisClient.flushAll();
};

export { app, prisma };
