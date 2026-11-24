import { expect, test, type Browser, type Page } from '@playwright/test';
import { createParty, heading, sheet, tab } from './helpers';

// Live sharing between two phones (ADR-010), through the local Firebase emulators. The host and
// each guest have separate browser contexts: separate storage, separate anonymous accounts.

/** A shared page's first load fetches Firebase and signs in: allow for a slow network. */
const FIRST_LOAD = { timeout: 15_000 };

/** A second phone of the same kind as the one under test. */
async function otherPhone(browser: Browser): Promise<Page> {
  const { viewport, userAgent, deviceScaleFactor, isMobile, hasTouch, baseURL } =
    test.info().project.use;
  const ctx = await browser.newContext({
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
    baseURL,
  });
  return ctx.newPage();
}

async function linkFromShareSheet(page: Page): Promise<string> {
  const link = sheet(page).getByLabel('Link', { exact: true });
  await expect(link).toHaveValue(/^http/, { timeout: 15_000 });
  return link.inputValue();
}

async function setRsvp(page: Page, name: string, rsvp: string) {
  await page.getByRole('button', { name: new RegExp(`^${name}`) }).tap();
  await sheet(page).getByRole('radio', { name: rsvp }).tap();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
}

test('story 4: Leo opens his link, sees his part, replies and picks a dish; the host sees it live', async ({
  page,
  browser,
}) => {
  await createParty(page, { address: '12 Birch Rd, Huntsville, ON', names: ['Leo', 'Sam'] });
  await tab(page, 'Bring');
  await page.getByRole('button', { name: /^Ice/ }).tap();
  await sheet(page).getByRole('checkbox', { name: 'Leo' }).tap();
  await sheet(page).getByLabel('How much').fill('5 kg');
  await sheet(page).getByRole('button', { name: 'Done' }).tap();

  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Leo/ }).tap();
  await sheet(page).getByRole('button', { name: 'Send Leo their link' }).tap();
  const url = await linkFromShareSheet(page);
  expect(url).toMatch(/\/hostbook\/#\/g\/[\w-]{22}\/[\w-]{22}$/);
  await expect(sheet(page).getByRole('textbox', { name: /^Message/ })).toHaveValue(
    /^Hey Leo! Dumpling Night is on .* Could you bring or help with Ice \(5 kg\)\? Details and RSVP: http/,
  );
  await sheet(page).getByRole('button', { name: 'Close' }).tap();

  const leo = await otherPhone(browser);
  await leo.goto(url);
  await expect(heading(leo)).toHaveText('Dumpling Night', FIRST_LOAD);
  await expect(leo.getByText('Hi Leo!')).toBeVisible();
  await expect(leo.getByRole('region', { name: 'Your part' })).toContainText('Ice · 5 kg');
  await expect(leo.getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
    'href',
    /query=12%20Birch%20Rd/,
  );
  await expect(leo.getByRole('link', { name: 'Apple Maps' })).toHaveAttribute(
    'href',
    /maps\.apple\.com\/\?q=12%20Birch/,
  );

  await leo.getByRole('radio', { name: "I'm coming" }).tap();
  await leo.getByLabel('Bringing anyone?').fill('1');
  await leo.getByLabel('Note for Hamid').fill('Can I bring my sister?');
  await leo.getByRole('button', { name: 'Send' }).tap();
  await expect(leo.getByText('Sent! Hamid can see it now.')).toBeVisible();

  // The host sees the reply without reloading.
  const leoRow = page.getByRole('button', { name: /^Leo/ });
  await expect(leoRow).toContainText('Yes', { timeout: 10_000 });
  await expect(leoRow).toContainText('+1');
  await leoRow.tap();
  await expect(sheet(page).getByText('“Can I bring my sister?”')).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();

  // Leo picks a dessert from the bring list; it shows up as his, confirmed.
  await leo.getByRole('button', { name: "I'll bring Dessert" }).tap();
  await expect(leo.getByText("You're bringing this")).toBeVisible();
  await tab(page, 'Bring');
  const dessert = page.getByRole('button', { name: /^Dessert/ }).first();
  await expect(dessert).toContainText('Leo', { timeout: 10_000 });
  await expect(dessert).toContainText('Confirmed');

  // The host's change reaches Leo's link.
  await tab(page, 'Overview');
  await page.getByRole('button', { name: 'Edit details' }).tap();
  await sheet(page).getByLabel('Name', { exact: true }).fill('Dumpling Night II');
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
  await expect(async () => {
    await leo.reload();
    await expect(heading(leo)).toHaveText('Dumpling Night II', { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await leo.context().close();
});

test('the open bring board: a friend picks a salad and joins the guest list', async ({
  page,
  browser,
}) => {
  await createParty(page, { names: ['Leo'] });
  await tab(page, 'Bring');
  await page.getByRole('button', { name: 'Share the bring board' }).tap();
  const url = await linkFromShareSheet(page);
  expect(url).toMatch(/#\/b\/[\w-]{22}$/);
  await sheet(page).getByRole('button', { name: 'Close' }).tap();

  const priya = await otherPhone(browser);
  await priya.goto(url);
  await expect(heading(priya)).toHaveText('Dumpling Night', FIRST_LOAD);
  await expect(priya.getByText('Getting in')).toHaveCount(0);
  await priya.getByRole('button', { name: "I'll bring Green salad" }).tap();
  await expect(priya.getByText('Add your name first')).toBeVisible();
  await priya.getByLabel('Your name').fill('Priya');
  await priya.getByRole('button', { name: "I'll bring Green salad" }).tap();
  await expect(priya.getByText("You're bringing this")).toBeVisible();

  await expect(page.getByRole('button', { name: /^Green salad/ })).toContainText('Priya', {
    timeout: 10_000,
  });
  await tab(page, 'Guests');
  await expect(page.getByRole('button', { name: /^Priya/ })).toContainText('Yes');

  // Changing her mind frees it up again.
  await priya.getByRole('button', { name: 'Undo' }).tap();
  await tab(page, 'Bring');
  await expect(page.getByRole('button', { name: /^Green salad/ })).toContainText('Open', {
    timeout: 10_000,
  });
  await priya.context().close();
});

test('stopping sharing turns old links off', async ({ page, browser }) => {
  await createParty(page, { names: ['Leo'] });
  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Leo/ }).tap();
  await sheet(page).getByRole('button', { name: 'Send Leo their link' }).tap();
  const url = await linkFromShareSheet(page);
  await sheet(page).getByRole('button', { name: 'Close' }).tap();
  const leo = await otherPhone(browser);
  await leo.goto(url);
  await expect(heading(leo)).toHaveText('Dumpling Night', FIRST_LOAD);

  await tab(page, 'More');
  await page.getByRole('button', { name: 'Stop sharing' }).tap();
  await expect(page.getByText('Stopped sharing')).toBeVisible();
  await leo.reload();
  await expect(heading(leo)).toHaveText('This link has expired', FIRST_LOAD);
  await leo.context().close();
});

test('without a connection, the host gets an offline link that still has the details', async ({
  page,
  browser,
  context,
}) => {
  await createParty(page, { names: ['Leo', 'Maya'] });
  await tab(page, 'Guests');
  await setRsvp(page, 'Maya', 'Yes');
  await page.getByRole('button', { name: /^Maya/ }).tap();
  await sheet(page).getByRole('checkbox', { name: 'Setup helper' }).tap();
  await context.setOffline(true);
  await sheet(page).getByRole('button', { name: 'Send Maya their link' }).tap();
  await expect(sheet(page).getByText('No connection, so this is an offline link')).toBeVisible();
  const url = await linkFromShareSheet(page);
  expect(url).toContain('#/i/');
  await context.setOffline(false);

  const maya = await otherPhone(browser);
  await maya.goto(url);
  await expect(maya.getByText('Hi Maya!')).toBeVisible(FIRST_LOAD);
  await expect(maya.getByText('You: please arrive at 5:45 p.m. (setup helper)')).toBeVisible();
  await expect(maya.getByRole('link', { name: "Text: I'm coming" })).toHaveAttribute(
    'href',
    /^sms:/,
  );
  await maya.context().close();
});

test('movie night is on the list', async ({ page }) => {
  await createParty(page, { type: 'Movie night', name: 'Film Club' });
  await tab(page, 'Bring');
  await expect(page.getByRole('button', { name: /^Popcorn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Blankets and pillows/ })).toBeVisible();
});

test('the overview links the address to Google and Apple Maps', async ({ page }) => {
  await createParty(page, { address: '1 Main St, Toronto' });
  await expect(page.getByRole('link', { name: 'Google Maps' })).toHaveAttribute(
    'href',
    'https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Toronto',
  );
  await expect(page.getByRole('link', { name: 'Apple Maps' })).toHaveAttribute(
    'href',
    'https://maps.apple.com/?q=1%20Main%20St%2C%20Toronto',
  );
});
