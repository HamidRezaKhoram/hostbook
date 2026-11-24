import { expect, type Page } from '@playwright/test';

/** YYYY-MM-DD, `days` from today. */
export function dateIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const nav = (page: Page) => page.getByRole('navigation', { name: 'Party' });
export const heading = (page: Page) => page.getByRole('heading', { level: 1 });
export const sheet = (page: Page) => page.getByRole('dialog');

export async function tab(page: Page, label: string) {
  await nav(page).getByRole('link', { name: label }).tap();
}

export interface NewParty {
  type?: string;
  name?: string;
  date?: string;
  time?: string;
  address?: string;
  names?: string[];
}

/** Creates a party through the real form, the way a host would on their phone. */
export async function createParty(page: Page, p: NewParty = {}) {
  const name = p.name ?? 'Dumpling Night';
  await page.goto('./#/new');
  await expect(heading(page)).toHaveText('New party');
  await page.getByRole('radio', { name: new RegExp(`^${p.type ?? 'Potluck'}`) }).tap();
  await page.getByLabel('Name', { exact: true }).fill(name);
  await page.getByLabel('Date').fill(p.date ?? dateIn(20));
  await page.getByLabel('Starts').fill(p.time ?? '19:00');
  if (p.address) await page.getByLabel('Where').fill(p.address);
  if (p.names) await page.getByLabel("Who's invited?").fill(p.names.join('\n'));
  await page.getByLabel('Your name').fill('Hamid');
  await page.getByRole('button', { name: 'Create party' }).tap();
  await expect(heading(page)).toHaveText(name);
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}
