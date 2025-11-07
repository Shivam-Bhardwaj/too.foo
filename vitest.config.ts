import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      reportsDirectory: resolve(rootDir, 'coverage')
    }
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, '.')
    }
  }
});
