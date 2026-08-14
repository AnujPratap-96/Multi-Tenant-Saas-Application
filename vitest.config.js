process.env.NODE_ENV = 'test';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/utils/setup-env.js'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
