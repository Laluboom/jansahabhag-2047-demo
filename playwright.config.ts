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

// Not vite's default 4173: a stray preview on that port used to be silently
// reused, so the suite ran against whatever app happened to be serving it.
const PORT = Number(process.env.E2E_PORT ?? 4273);
const BASE_URL = `http://localhost:${PORT}`;

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
    baseURL: BASE_URL,
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
    // --strictPort so vite fails loudly instead of sliding to the next free
    // port and leaving Playwright waiting on one nothing is serving.
    command: `npm run preview -- --port ${PORT} --strictPort`,
    // url, not port: waits for an HTTP response rather than a bare TCP listener.
    url: BASE_URL,
    // Never reuse: an existing server on this port is someone else's, and
    // testing it would report a pass for a build this run never produced.
    reuseExistingServer: false,
    timeout: 120000,
  },
});
