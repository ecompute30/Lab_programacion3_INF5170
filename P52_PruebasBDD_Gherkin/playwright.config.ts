import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

/**
 * Práctica 5.2 — Pruebas BDD con Gherkin sobre el Menú Dinámico Uastiano (Práctica 4).
 * Los escenarios en features/*.feature se transforman en tests de Playwright
 * usando playwright-bdd; las definiciones de pasos viven en steps/*.ts.
 */
const testDir = defineBddConfig({
  language: 'es',
  features: 'features/*.feature',
  steps: 'steps/*.ts',
});

export default defineConfig({
  testDir,
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
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
