import { defineConfig, devices } from '@playwright/test';

// Tests run against a production build (`npm run build:e2e` → dist-e2e) served by `vite preview`,
// so the /hostbook/ base path and the service worker work exactly as on GitHub Pages. That build
// talks to the local Firebase emulators, never the real project: run via `npm run test:e2e`.
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
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  // `npm run test:e2e` runs the Android phones, then the iPhone with 2 workers: more parallel
  // WebKit pages next to the Firebase emulators crash WebKit's browser process (seen during the
  // axe sweeps) on an ordinary machine. Each pass on its own is stable.
  workers: process.env.CI ? 2 : 4,
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
    command: `npx vite preview --outDir dist-e2e --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/hostbook/`,
    reuseExistingServer: !process.env.CI,
  },
});
