import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@workspace/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@workspace/dataverse': path.resolve(__dirname, 'packages/dataverse/src'),
      '@workspace/pcf-context': path.resolve(__dirname, 'packages/pcf-context/src'),
      '@workspace/hooks': path.resolve(__dirname, 'packages/hooks/src'),
      '@workspace/test-utils': path.resolve(__dirname, 'packages/test-utils/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./packages/test-utils/src/setup.ts'],
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'apps/*/src/**/*.test.{ts,tsx}'],
    env: {
      NODE_ENV: 'test',
    },
  },
});
