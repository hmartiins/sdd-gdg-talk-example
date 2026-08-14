import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const alias = {
  '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
  '@server': fileURLToPath(new URL('./src/server', import.meta.url)),
  '@client': fileURLToPath(new URL('./src/client', import.meta.url)),
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['tests/component/**/*.test.tsx'],
          setupFiles: ['tests/helpers/setup-component.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'contract',
          environment: 'node',
          include: ['tests/contract/**/*.test.ts'],
          // Cada teste abre seu próprio arquivo SQLite temporário; sem estado entre arquivos.
          fileParallelism: true,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'architecture',
          environment: 'node',
          include: ['tests/architecture/**/*.test.ts'],
          testTimeout: 60_000,
        },
      },
      {
        // Projeto `gate`: verifica o próprio `npm run verify`.
        // DELIBERADAMENTE fora de `verify` e de `test` — incluí-lo criaria recursão
        // infinita (verify → gate → verify). Roda sob demanda com `npm run test:gate`.
        resolve: { alias },
        test: {
          name: 'gate',
          environment: 'node',
          include: ['tests/gate/**/*.test.ts'],
          testTimeout: 600_000,
          hookTimeout: 600_000,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/client/main.tsx', 'src/server/main.ts'],
    },
  },
});
