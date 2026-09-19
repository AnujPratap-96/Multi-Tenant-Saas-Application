import 'dotenv/config';
import { redisClient } from '../../src/config/redis.js';
import { afterAll } from 'vitest';

let connected = false;

export async function setup() {
  if (!connected && !redisClient.isReady) {
    try {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout')), 3000)),
      ]);
      connected = redisClient.isReady;
    } catch (error) {
      console.warn('Redis connect failed in tests:', error.message);
      try {
        await redisClient.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}

await setup();

afterAll(async () => {
  try {
    if (redisClient.isReady) {
      await redisClient.quit();
    } else if (redisClient.isOpen) {
      await redisClient.disconnect();
    }
  } catch {
    /* ignore */
  }
});
