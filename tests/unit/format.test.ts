import { describe, expect, it } from 'vitest';
import {
  formatDay,
  formatList,
  formatLongDay,
  formatMoney,
  formatRange,
  formatTime,
  formatVolume,
  formatWeight,
  formatWeightRange,
  formatWhen,
} from '../../src/lib/format';

describe('Canadian formatting (ADR-011)', () => {
  it('formats times the en-CA way', () => {
    expect(formatTime('2026-12-12T19:00')).toBe('7:00 p.m.');
    expect(formatTime('2026-12-12T09:05')).toBe('9:05 a.m.');
    expect(formatTime('2026-12-12T00:00')).toBe('12:00 a.m.');
  });

  it('formats days', () => {
    expect(formatDay('2026-12-12T19:00')).toBe('Sat, Dec 12');
    expect(formatLongDay('2026-12-12T19:00')).toBe('Saturday, December 12, 2026');
  });

  it('formats a party window compactly', () => {
    expect(formatWhen('2026-12-12T19:00', '2026-12-12T22:00')).toBe(
      'Sat, Dec 12 · 7:00–10:00 p.m.',
    );
    expect(formatWhen('2026-12-12T11:00', '2026-12-12T14:00')).toBe(
      'Sat, Dec 12 · 11:00 a.m.–2:00 p.m.',
    );
    expect(formatWhen('2026-12-12T19:00')).toBe('Sat, Dec 12 · 7:00 p.m.');
    expect(formatWhen('2026-12-11T18:00', '2026-12-13T14:00')).toBe(
      'Fri, Dec 11 · 6:00 p.m. – Sun, Dec 13 · 2:00 p.m.',
    );
  });

  it('puts kilograms first and pounds in brackets', () => {
    expect(formatWeight(25000)).toBe('25 kg (55 lb)');
    expect(formatWeight(4500)).toBe('4.5 kg (10 lb)');
    expect(formatWeight(450)).toBe('450 g (1 lb)');
    expect(formatWeight(225)).toBe('230 g (0.5 lb)');
    expect(formatWeightRange(16200, 25200)).toBe('16.2–25.2 kg (36–56 lb)');
    expect(formatWeightRange(450, 700)).toBe('450–700 g (1–1.5 lb)');
    expect(formatWeightRange(1000, 1000)).toBe('1 kg (2 lb)');
  });

  it('uses mL and L', () => {
    expect(formatVolume(341)).toBe('341 mL');
    expect(formatVolume(8000)).toBe('8 L');
    expect(formatVolume(2500)).toBe('2.5 L');
  });

  it('uses Canadian dollars', () => {
    expect(formatMoney(2450)).toBe('$24.50');
    expect(formatMoney(123456)).toBe('$1,234.56');
  });

  it('formats ranges and lists', () => {
    expect(formatRange(3, 3)).toBe('3');
    expect(formatRange(3, 5)).toBe('3–5');
    expect(formatList([])).toBe('');
    expect(formatList(['Sam'])).toBe('Sam');
    expect(formatList(['Sam', 'Leo'])).toBe('Sam and Leo');
    expect(formatList(['Sam', 'Leo', 'Jo'])).toBe('Sam, Leo and Jo');
  });
});
