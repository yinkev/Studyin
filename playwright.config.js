// Basic Playwright config (JS) to avoid TS/Vitest interop issues
// Starts Next dev server on a fixed port and runs e2e tests from tests/e2e-js
/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/e2e-js',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3005',
    headless: true,
  },
  webServer: {
    command: 'npm run dev:start',
    port: 3005,
    reuseExistingServer: true,
    timeout: 120_000,
  },
};

module.exports = config;
