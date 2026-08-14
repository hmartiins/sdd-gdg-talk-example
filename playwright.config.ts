import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * E2E contra servidor, navegador e banco REAIS (FR-012, Princípio II).
 *
 * O banco de teste é um arquivo temporário próprio, apontado por DATABASE_FILE. Isso dá as
 * duas garantias que a spec pede: o banco de desenvolvimento nunca é tocado, e interromper
 * a suíte no meio não deixa estado sujo para a execução seguinte — basta apagar o arquivo.
 */

const testDbFile = fileURLToPath(new URL('./.playwright/e2e.sqlite', import.meta.url));
const port = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'mobile-320',
      use: {
        ...devices['Desktop Chrome'],
        // Princípio IV: o piso de largura suportado é 320px, então é nele que testamos.
        viewport: { width: 320, height: 640 },
      },
    },
  ],

  webServer: {
    command: 'npm run build && npm run start',
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: String(port),
      DATABASE_FILE: testDbFile,
      E2E_SEED: '1',
      LOG_LEVEL: 'silent',
    },
  },
});
