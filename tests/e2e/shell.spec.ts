import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { createParty, heading, nav, sheet, tab, trackErrors } from './helpers';

// The app shell, driven with real taps on phone profiles: iPhone 13 (WebKit), Pixel 7 and
// Galaxy S22 (Chromium).

const TABS = ['Overview', 'Guests', 'Bring', 'Timeline', 'More'];

test('opens on an empty party list without errors', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await expect(heading(page)).toHaveText('Your parties');
  await expect(page.getByText('No parties yet')).toBeVisible();
  await expect(page).toHaveTitle('Hostbook');
  expect(errors).toEqual([]);
});

test('tapping each tab shows its screen and marks it current', async ({ page }) => {
  await createParty(page);
  for (const label of [...TABS.slice(1), 'Overview']) {
    await tab(page, label);
    await expect(heading(page)).toHaveText(label === 'Overview' ? 'Dumpling Night' : label);
    await expect(nav(page).getByRole('link', { name: label })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1);
  }
  await expect(page).toHaveTitle('Dumpling Night · Hostbook');
});

test('unknown parties and routes are handled', async ({ page }) => {
  await page.goto('./#/p/not-a-real-party/guests');
  await expect(heading(page)).toHaveText('Party not found');
  await page.getByRole('link', { name: 'Your parties' }).tap();
  await expect(heading(page)).toHaveText('Your parties');
  await page.goto('./#/what');
  await expect(heading(page)).toHaveText('Your parties');
});

test('the back button returns to the previous tab', async ({ page }) => {
  await createParty(page);
  await tab(page, 'Guests');
  await tab(page, 'Bring');
  await page.goBack();
  await expect(heading(page)).toHaveText('Guests');
});

test('tab bar targets are at least 48×48 px and sit at the bottom', async ({ page }) => {
  await createParty(page);
  const viewport = page.viewportSize()!;
  for (const link of await nav(page).getByRole('link').all()) {
    const box = (await link.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(48);
    expect(box.height).toBeGreaterThanOrEqual(48);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 100);
  }
});

async function noSidewaysScroll(page: Page, where: string) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${where} overflows`).toBeLessThanOrEqual(0);
}

for (const width of [360, 375, 430]) {
  test(`no sideways scrolling at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('./');
    await noSidewaysScroll(page, 'home');
    await createParty(page, { names: ['Maya', 'Leo', 'Alexandria-Wilhelmina Featherstonehaugh'] });
    await noSidewaysScroll(page, 'overview');
    for (const label of TABS.slice(1)) {
      await tab(page, label);
      await noSidewaysScroll(page, label);
    }
    await tab(page, 'Guests');
    await page.getByRole('button', { name: /Alexandria/ }).tap();
    await noSidewaysScroll(page, 'guest sheet');
  });
}

test('the tab bar never hides the end of a screen', async ({ page }) => {
  await createParty(page);
  await tab(page, 'More');
  await expect(heading(page)).toHaveText('More');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const lastBox = (await page.locator('.screen > :last-child').boundingBox())!;
  const navBox = (await nav(page).boundingBox())!;
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(navBox.y);
});

test('switching away from a long, scrolled screen shows the next one from the top', async ({
  page,
}) => {
  await createParty(page, { names: ['Maya', 'Leo', 'Sam'] });
  for (const [from, to] of [
    ['Bring', 'Overview'],
    ['Timeline', 'Guests'],
    ['Bring', 'More'],
  ]) {
    await tab(page, from!);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Record the scroll position at the moment the new screen enters the page, before the
    // browser paints it: anything but 0 means one frame of the new screen at the old position.
    await page.evaluate(() => {
      const w = window as unknown as { firstFrameY?: number };
      delete w.firstFrameY;
      const h1 = document.querySelector('h1')!;
      const before = h1.textContent;
      const obs = new MutationObserver(() => {
        const now = document.querySelector('h1');
        if (now && now.textContent !== before && w.firstFrameY === undefined) {
          w.firstFrameY = window.scrollY;
          obs.disconnect();
        }
      });
      obs.observe(document.getElementById('app')!, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
    await tab(page, to!);
    await expect(heading(page)).toHaveText(to === 'Overview' ? 'Dumpling Night' : to!);
    const y = await page.evaluate(
      () => (window as unknown as { firstFrameY?: number }).firstFrameY,
    );
    expect(y, `${from} → ${to}: first frame of the new screen`).toBe(0);
    expect(await page.evaluate(() => window.scrollY), `${from} → ${to}: at the top`).toBe(0);
  }
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

test('has no serious accessibility problems on any screen, light or dark', async ({ page }) => {
  const check = async (where: string) => {
    const { violations } = await new AxeBuilder({ page }).analyze();
    const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${where}: ${v.id} ${v.nodes[0]?.target}`)).toEqual([]);
  };
  await createParty(page, { names: ['Maya', 'Leo'] });
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('./');
    await check(`${scheme} home`);
    await page.goto('./#/new');
    await check(`${scheme} new`);
    await page.goto('./');
    await page.getByRole('link', { name: /Dumpling Night/ }).tap();
    await check(`${scheme} overview`);
    for (const label of TABS.slice(1)) {
      await tab(page, label);
      await check(`${scheme} ${label}`);
    }
    await tab(page, 'Guests');
    await page.getByRole('button', { name: /Maya/ }).tap();
    await expect(sheet(page)).toBeVisible();
    await check(`${scheme} guest sheet`);
    await sheet(page).getByRole('button', { name: 'Done' }).tap();
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
