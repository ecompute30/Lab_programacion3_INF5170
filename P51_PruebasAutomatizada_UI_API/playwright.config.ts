import { defineConfig, devices } from '@playwright/test';

/**
 * Práctica 5.1 — Pruebas automatizadas de UI y API.
 * UI bajo prueba: Menú Dinámico Uastiano (Vue 3 + TS, Práctica 4).
 * API bajo prueba: JSONPlaceholder (API pública, sin autenticación).
 * https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://ecompute30.github.io/Lab_programacion3_INF5170/P4_MenuDinamico_Vue/dist/',
    trace: 'retain-on-failure',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'ui-chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
    },
  ],
});
