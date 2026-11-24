import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The app shell, driven with real taps on phone profiles (iPhone 13 WebKit, Pixel 7 Chromium).

const TABS = [
  { label: 'Overview', hash: '#/', heading: 'Overview' },
  { label: 'Guests', hash: '#/guests', heading: 'Guests' },
  { label: 'Bring', hash: '#/bring', heading: 'Bring' },
  { label: 'Timeline', hash: '#/timeline', heading: 'Timeline' },
  { label: 'More', hash: '#/more', heading: 'More' },
];

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const heading = (page: Page) => page.getByRole('heading', { level: 1 });

function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('opens on the overview without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await expect(heading(page)).toHaveText('Overview');
  await expect(page).toHaveTitle('Hostbook');
  expect(errors).toEqual([]);
});

test('tapping each tab shows its screen and marks it current', async ({ page }) => {
  await page.goto('./');
  for (const tab of TABS.slice(1).concat(TABS[0]!)) {
    await nav(page).getByRole('link', { name: tab.label }).tap();
    await expect(heading(page)).toHaveText(tab.heading);
    expect(new URL(page.url()).hash || '#/').toBe(tab.hash);
    await expect(nav(page).getByRole('link', { name: tab.label })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1);
  }
});

test('deep links open the right tab; unknown routes fall back to the overview', async ({
  page,
}) => {
  await page.goto('./#/timeline');
  await expect(heading(page)).toHaveText('Timeline');
  await page.goto('./#/does-not-exist');
  await expect(heading(page)).toHaveText('Overview');
});

test('the back button returns to the previous tab', async ({ page }) => {
  await page.goto('./');
  await nav(page).getByRole('link', { name: 'Guests' }).tap();
  await nav(page).getByRole('link', { name: 'Bring' }).tap();
  await page.goBack();
  await expect(heading(page)).toHaveText('Guests');
});

test('tab bar targets are at least 48×48 px and sit at the bottom', async ({ page }) => {
  await page.goto('./');
  const viewport = page.viewportSize()!;
  for (const link of await nav(page).getByRole('link').all()) {
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
  }
});

for (const width of [360, 375, 430]) {
  test(`no sideways scrolling at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    for (const tab of TABS) {
      await page.goto(`./${tab.hash}`);
      await expect(heading(page)).toHaveText(tab.heading);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${tab.label} overflows`).toBeLessThanOrEqual(0);
    }
  });
}

test('the tab bar never hides the end of a screen', async ({ page }) => {
  await page.goto('./#/more');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const last = page.locator('.screen > :last-child');
  const lastBox = (await last.boundingBox())!;
  const navBox = (await nav(page).boundingBox())!;
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y);
});

test('follows the phone dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(light).toBe('rgb(250, 246, 239)');
  expect(dark).toBe('rgb(28, 24, 21)');
});

test('has no serious accessibility problems on any tab, light or dark', async ({ page }) => {
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const tab of TABS) {
      await page.goto(`./${tab.hash}`);
      await expect(heading(page)).toHaveText(tab.heading);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${scheme} ${tab.label}: ${v.id}`)).toEqual([]);
    }
  }
});

test('is installable: manifest and icons are served under /hostbook/', async ({
  page,
  request,
}) => {
  await page.goto('./');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({
    name: 'Hostbook',
    start_url: '/hostbook/',
    scope: '/hostbook/',
    display: 'standalone',
  });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  for (const icon of manifest.icons) {
    const res = await request.get(new URL(icon.src, page.url()).href);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()['content-type']).toBe('image/png');
  }
});

test('keeps working offline after the first visit', async ({ page, context, browserName }) => {
  // Playwright's WebKit can't run service workers; Chromium (Pixel) covers this.
  test.skip(browserName !== 'chromium', 'service workers are tested on Chromium');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(heading(page)).toHaveText('Overview');
  await nav(page).getByRole('link', { name: 'Bring' }).tap();
  await expect(heading(page)).toHaveText('Bring');
  await page.goto('./#/timeline');
  await expect(heading(page)).toHaveText('Timeline');
});
