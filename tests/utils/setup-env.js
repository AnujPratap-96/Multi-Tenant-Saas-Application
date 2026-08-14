import 'dotenv/config';
import { redisClient } from '../../src/config/redis.js';
import { afterAll } from 'vitest';

let connected = false;

export async function setup() {
  if (!connected && !redisClient.isReady) {
    try {
      await Promise.race([
        redisClient.connect(),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      connected = redisClient.isReady;
    } catch (error) {
      console.warn('Redis connect failed in tests:', error.message);
    }
  }
}

await setup();

afterAll(async () => {
  if (redisClient.isReady) {
    await redisClient.quit();
  }
});
