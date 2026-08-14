import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/lib/prisma.js';
import { redisClient } from '../../src/config/redis.js';
import { API_PREFIX } from '../../src/config/version.js';

/**
 * Obtain a CSRF token + cookie pair for mutating requests.
 * Supertest requests share the same IP, so one token works for the whole suite.
 */
export const getCsrf = async () => {
  const res = await request(app).get(`${API_PREFIX}/csrf-token`);
  const cookie = (res.headers['set-cookie'] || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  return { token: res.body?.data?.token, cookie };
};

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
