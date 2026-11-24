import { defineConfig } from 'vitest/config';

// Tests that need the Firebase emulators. Run via `npm run test:emulator` (emulators:exec starts them).
export default defineConfig({
  test: {
    include: ['tests/emulator/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
