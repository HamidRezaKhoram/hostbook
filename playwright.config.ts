import { defineConfig, devices } from '@playwright/test';

// Tests run against the production build (`vite preview`), so the /hostbook/ base path and
// the service worker are exercised exactly as on GitHub Pages. Build first (test-all.sh does).
const PORT = 4173;

/** Samsung Galaxy S22 in Samsung Internet (Chromium). Playwright has no built-in profile for it. */
const GALAXY_S22 = {
  browserName: 'chromium' as const,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36',
  screen: { width: 360, height: 780 },
  viewport: { width: 360, height: 700 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/hostbook/`,
    trace: 'retain-on-failure',
  },
  // Target phones: iPhone, Pixel 7 and newer, Samsung Galaxy S22 and newer. The S22 is the
  // narrowest (360 px), so it catches layouts that only break on small Android screens.
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    { name: 'galaxy-s22', use: GALAXY_S22 },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/hostbook/`,
    reuseExistingServer: !process.env.CI,
  },
});
