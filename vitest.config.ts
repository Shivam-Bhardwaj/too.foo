import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setupTests.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: resolve(__dirname, 'coverage')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});
