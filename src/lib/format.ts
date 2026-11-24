// Canadian formatting (ADR-011): en-CA dates and times, metric first with lb in brackets, CAD.
// Every user-facing number and date goes through here so another locale can be added later.
import { toUtcDate } from './time';

const LOCALE = 'en-CA';
const G_PER_LB = 453.592;

/** Browsers disagree on narrow/no-break spaces in "7:00 p.m."; use plain spaces everywhere. */
const plain = (s: string) => s.replace(/[\u202f\u00a0]/g, ' ');

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...opts });

const TIME = fmt({ hour: 'numeric', minute: '2-digit' });
const DAY = fmt({ weekday: 'short', month: 'short', day: 'numeric' });
const LONG_DAY = fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

/** "7:00 p.m." */
export function formatTime(local: string): string {
  return plain(TIME.format(toUtcDate(local)));
}

/** "Sat, Dec 12" */
export function formatDay(local: string): string {
  return plain(DAY.format(toUtcDate(local)));
}

/** "Saturday, December 12, 2026" */
export function formatLongDay(local: string): string {
  return plain(LONG_DAY.format(toUtcDate(local)));
}

/** "Sat, Dec 12 · 7:00–10:00 p.m.", or with both days when it runs past a day. */
export function formatWhen(start: string, end?: string): string {
  const day = formatDay(start);
  if (!end) return `${day} · ${formatTime(start)}`;
  const t1 = formatTime(start);
  const t2 = formatTime(end);
  if (end.slice(0, 10) !== start.slice(0, 10)) return `${day} · ${t1} – ${formatDay(end)} · ${t2}`;
  const sameHalf = t1.slice(-4) === t2.slice(-4);
  return `${day} · ${sameHalf ? t1.slice(0, -5) : t1}–${t2}`;
}

const round = (n: number, step: number) => Math.round(n / step) * step;
const trim = (n: number) => String(Number(n.toFixed(1)));

/** 25000 → "25 kg (55 lb)"; 450 → "450 g (1 lb)". */
export function formatWeight(grams: number): string {
  const lb = grams / G_PER_LB;
  const lbText = lb < 10 ? trim(round(lb, 0.5)) : String(Math.round(lb));
  if (grams < 1000) return `${round(grams, 10)} g (${lbText} lb)`;
  const kg = grams / 1000;
  return `${kg < 10 ? trim(kg) : Math.round(kg)} kg (${lbText} lb)`;
}

/** 16200, 25200 → "16.2–25.2 kg (36–56 lb)"; equal ends → formatWeight. */
export function formatWeightRange(minG: number, maxG: number): string {
  if (Math.round(minG) === Math.round(maxG)) return formatWeight(minG);
  const lb = (g: number) => {
    const v = g / G_PER_LB;
    return v < 10 ? trim(round(v, 0.5)) : String(Math.round(v));
  };
  const amount =
    maxG < 1000
      ? `${round(minG, 10)}–${round(maxG, 10)} g`
      : `${trim(minG / 1000)}–${trim(maxG / 1000)} kg`;
  return `${amount} (${lb(minG)}–${lb(maxG)} lb)`;
}

/** 341 → "341 mL"; 8000 → "8 L"; 2500 → "2.5 L". */
export function formatVolume(ml: number): string {
  return ml < 1000 ? `${Math.round(ml)} mL` : `${trim(ml / 1000)} L`;
}

const MONEY = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'CAD' });

/** 2450 → "$24.50" */
export function formatMoney(cents: number): string {
  return plain(MONEY.format(cents / 100));
}

/** "3", or "3–5" for a range. */
export function formatRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}–${max}`;
}

/** Join with commas and "and": "Sam, Leo and Jo". */
export function formatList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}
