import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the project at /<repo>/. Everything (assets, manifest, service
// worker scope) hangs off this base. Change it if the repo is renamed.
const BASE = '/hostbook/';

export default defineConfig({
  base: BASE,
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    preact(),
    VitePWA({
      // A new version waits until the host taps "Refresh", so nothing swaps mid-party.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Hostbook',
        short_name: 'Hostbook',
        description: 'Plan gatherings: guests, who brings what, arrival times, tasks and notes.',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf6ef',
        theme_color: '#b4532a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/lib/**', 'src/app/router.ts'],
      reporter: ['text-summary'],
      // Roadmap M2: domain logic stays at 90%+.
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 85 },
    },
  },
});
