import { defineConfig } from 'evalite/config';

export default defineConfig({
  setupFiles: ['./evals/setup-env.ts'],
  testTimeout: 180_000,
  maxConcurrency: 2,
  // Raised once there is a baseline from real runs.
  scoreThreshold: 0,
});
