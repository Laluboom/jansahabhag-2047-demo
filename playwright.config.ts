import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Detect local chromium binary from cache if available without downloading external packages
const possiblePaths = [
  path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'),
  path.join(process.env.HOME || '', '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell'),
  path.join(process.env.HOME || '', '.cache/ms-playwright/chromium-1228/chrome-linux64/chrome'),
];
const detectedExecutable = possiblePaths.find((p) => fs.existsSync(p));

/**
 * Playwright E2E Configuration for JanSahabhag 2047 Demo
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: detectedExecutable
      ? {
          executablePath: detectedExecutable,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        }
      : undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
