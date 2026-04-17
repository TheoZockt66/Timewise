import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/app/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
