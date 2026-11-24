import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createParty, heading, sheet, tab } from './helpers';

// User stories from docs/planning/product-spec.md, played with real taps on each phone.

const FIFTEEN = [
  'Maya',
  'Leo',
  'Sam',
  'Jo',
  'Ana',
  'Priya',
  'Kim',
  'Omar',
  'Lena',
  'Tomás',
  'Aiko',
  'Ravi',
  'Zoe',
  'Finn',
  'Noor',
];

test('story 1: a potluck with 15 pasted names, ready in one form', async ({ page }) => {
  await createParty(page, {
    address: '12 Birch Rd',
    names: FIFTEEN.map((n, i) => `${i + 1}. ${n}`),
  });
  await expect(page.getByText('12 Birch Rd')).toBeVisible();
  await expect(page.getByText('15 no reply')).toBeVisible();

  await tab(page, 'Guests');
  await expect(page.getByRole('button', { name: /No reply/ })).toHaveCount(15);
  await expect(page.getByRole('button', { name: /^Tomás/ })).toBeVisible();

  await tab(page, 'Bring');
  await expect(page.getByRole('heading', { name: /^Salads/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ice/ })).toBeVisible();
  await expect(page.getByText(/^\d+ still open$/)).toBeVisible();

  await tab(page, 'Timeline');
  await expect(page.getByRole('heading', { name: /3–6 weeks before/ })).toBeVisible();
  await page.getByRole('radio', { name: 'On the day' }).tap();
  await expect(page.getByText('Guests arrive')).toBeVisible();
  await expect(page.getByText('7:00 p.m.').first()).toBeVisible();
});

test('story 2: assign the ice to Leo, then mark it confirmed; it survives a reload', async ({
  page,
}) => {
  await createParty(page, { names: ['Maya', 'Leo'] });
  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Leo/ }).tap();
  await sheet(page).getByRole('radio', { name: 'Yes' }).tap();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();

  await tab(page, 'Bring');
  const before = Number((await page.getByText(/still open$/).textContent())!.split(' ')[0]);
  await page.getByRole('button', { name: /^Ice/ }).tap();
  await sheet(page).getByRole('checkbox', { name: 'Leo' }).tap();
  await expect(sheet(page).getByRole('radio', { name: 'Asked' })).toBeChecked();
  await sheet(page).getByRole('radio', { name: 'Confirmed' }).tap();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();

  const ice = page.getByRole('button', { name: /^Ice/ });
  await expect(ice).toContainText('Leo');
  await expect(ice).toContainText('Confirmed');
  await expect(page.getByText(`${before - 1} still open`)).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: /^Ice/ })).toContainText('Confirmed');
  await tab(page, 'Guests');
  await expect(page.getByRole('button', { name: /^Leo/ })).toContainText('Ice');
});

test('story 3: helpers arrive 75 minutes early, and the host can override it', async ({ page }) => {
  await createParty(page, { names: ['Maya', 'Jo'] });
  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Maya/ }).tap();
  await sheet(page).getByRole('radio', { name: 'Yes' }).tap();
  await sheet(page).getByRole('checkbox', { name: 'Setup helper' }).tap();
  await expect(sheet(page).getByText('Arrives 5:45 p.m.')).toBeVisible();
  await sheet(page).getByLabel('Change arrival time').fill('18:00');
  await expect(sheet(page).getByText('Arrives 6:00 p.m.')).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Use the time for their role' }).tap();
  await expect(sheet(page).getByText('Arrives 5:45 p.m.')).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
  await expect(page.getByRole('button', { name: /^Maya/ })).toContainText(
    'arrives 5:45 p.m. · Setup helper',
  );

  await tab(page, 'Timeline');
  await page.getByRole('radio', { name: 'On the day' }).tap();
  await expect(page.getByText('Maya arrives (setup helper)')).toBeVisible();

  // Moving the party moves the helper with it.
  await tab(page, 'Overview');
  await page.getByRole('button', { name: 'Edit details' }).tap();
  await sheet(page).getByLabel('Starts').fill('20:00');
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
  await tab(page, 'Guests');
  await expect(page.getByRole('button', { name: /^Maya/ })).toContainText('arrives 6:45 p.m.');
});

test('story 5 & 6: open items, a new item, and the dietary summary on the bring board', async ({
  page,
}) => {
  await createParty(page, { names: ['Sam'] });
  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Sam/ }).tap();
  await sheet(page).getByRole('radio', { name: 'Yes' }).tap();
  await sheet(page).getByRole('checkbox', { name: 'tree nut' }).tap();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
  await expect(page.getByRole('button', { name: /^Sam/ })).toContainText('tree nut allergy');

  await tab(page, 'Bring');
  await expect(page.getByText('Dietary: 1 tree nut allergy (Sam)')).toBeVisible();
  const open = Number((await page.getByText(/still open$/).textContent())!.split(' ')[0]);
  await page.getByRole('button', { name: '+ Add' }).tap();
  await sheet(page).getByLabel('What').fill('Chips and salsa');
  await sheet(page).getByRole('button', { name: 'Add', exact: true }).tap();
  await expect(sheet(page).getByRole('heading', { name: 'Chips and salsa' })).toBeVisible();
  await sheet(page).getByRole('checkbox', { name: 'tree nut' }).tap();
  await sheet(page).getByRole('button', { name: 'Done' }).tap();
  await expect(page.getByText(`${open + 1} still open`)).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Snacks/ })).toBeVisible();
});

test('story 9: after the party, mark who came, debrief, and duplicate for next time', async ({
  page,
}) => {
  await createParty(page, { names: ['Maya', 'Leo'] });
  await tab(page, 'Guests');
  for (const name of ['Maya', 'Leo']) {
    await page.getByRole('button', { name: new RegExp(`^${name}`) }).tap();
    await sheet(page).getByRole('radio', { name: 'Yes' }).tap();
    await sheet(page).getByRole('button', { name: 'Done' }).tap();
  }
  await tab(page, 'More');
  await page.getByRole('checkbox', { name: 'Leo' }).tap();
  await page.getByLabel('What worked?').fill('Dumpling folding station');
  await page.getByRole('button', { name: /Duplicate/ }).tap();
  await expect(heading(page)).toHaveText('Dumpling Night (copy)');
  await tab(page, 'Guests');
  await expect(page.getByRole('button', { name: /No reply/ })).toHaveCount(2);
  await tab(page, 'More');
  await expect(page.getByRole('checkbox', { name: 'Leo' })).toHaveCount(0);
  await expect(page.getByLabel('What worked?')).toHaveValue('');

  await page.getByRole('link', { name: 'All parties' }).tap();
  await expect(page.getByRole('link', { name: /Dumpling Night/ })).toHaveCount(2);
  await expect(page.getByRole('link', { name: /Dumpling Night \(copy\)/ })).toBeVisible();
});

test('removing a guest can be undone', async ({ page }) => {
  await createParty(page, { names: ['Maya', 'Sam'] });
  await tab(page, 'Guests');
  await page.getByRole('button', { name: /^Sam/ }).tap();
  await sheet(page).getByRole('button', { name: 'Remove Sam' }).tap();
  await expect(page.getByRole('button', { name: /^Sam/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).tap();
  await expect(page.getByRole('button', { name: /^Sam/ })).toBeVisible();
});

test('back up, delete, and restore a party', async ({ page }) => {
  await createParty(page, { names: ['Maya'] });
  await tab(page, 'More');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: /Save a backup/ }).tap();
  const file = await (await downloading).path();
  const backup = JSON.parse(readFileSync(file, 'utf8'));
  expect(backup).toMatchObject({ app: 'hostbook', parties: [{ name: 'Dumpling Night' }] });

  await page.getByRole('button', { name: 'Delete party' }).tap();
  await sheet(page).getByRole('button', { name: 'Delete party' }).tap();
  await expect(heading(page)).toHaveText('Your parties');
  await expect(page.getByText('No parties yet')).toBeVisible();

  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByText('Restored: 1 new, 0 updated')).toBeVisible();
  await expect(page.getByRole('link', { name: /Dumpling Night/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: /Dumpling Night/ })).toBeVisible();
});

test('story 10: works offline after the first visit, and keeps the data', async ({
  page,
  context,
  browserName,
}) => {
  // Playwright's WebKit can't run service workers; the Android (Chromium) phones cover this.
  test.skip(browserName !== 'chromium', 'service workers are tested on Chromium');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(heading(page)).toHaveText('Your parties');
  await createParty(page, { name: 'Cabin Night', type: 'Game night', names: ['Maya'] });
  await tab(page, 'Bring');
  await expect(page.getByRole('heading', { name: /^Snacks/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /^Snacks/ })).toBeVisible();
});
