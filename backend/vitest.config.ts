import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['./test/database.global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
  },
});
