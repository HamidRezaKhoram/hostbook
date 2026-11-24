import { describe, expect, it } from 'vitest';
import {
  calculate,
  calculateForParty,
  drinksPerPerson,
  partyHours,
  type CalcLine,
} from '../../src/domain/calc';
import { sampleParty } from './helpers';

const byKey = (lines: CalcLine[]) => Object.fromEntries(lines.map((l) => [l.key, l]));

describe('calculator matches docs/guide/quantities.md', () => {
  it('drinks: 2 in the first hour, then 1 per hour', () => {
    expect([1, 2, 2.5, 4].map(drinksPerPerson)).toEqual([2, 3, 4, 5]);
    expect(drinksPerPerson(0)).toBe(2);
  });

  it('worked example: 20 guests, 4 hours → 100 drinks, ~25 non-alcoholic', () => {
    const c = byKey(calculate({ people: 20, hours: 4 }));
    expect(c.drinks!.min).toBe(100);
    expect(c.na!.min).toBe(25);
    expect(c.wine!.text).toBe('7 bottles'); // 75 × 45% / 5 glasses = 6.75
    expect(c.beer!.text).toBe('27 cans'); // 75 × 35% = 26.25
    expect(c.spirits!.text).toBe('1 bottle'); // 75 × 20% / 17 = 0.88
  });

  it('spec story 7: 18 guests, 4 h, hot → 90 drinks, ≥ 23 NA, 24.3–33.3 kg of ice', () => {
    const c = byKey(calculate({ people: 18, hours: 4, hot: true }));
    expect(c.drinks!.min).toBe(90);
    expect(c.na!.min).toBe(23);
    expect([c.ice!.min, c.ice!.max]).toEqual([24300, 33300]);
    expect(c.ice!.text).toBe('24.3–33.3 kg (54–73 lb)');
    expect(c['ice-bags']!.text).toBe('7–9 bags');
    expect(c.water!.text).toBe('18 L');
  });

  it('ice without heat, and a custom bag size', () => {
    const c = byKey(calculate({ people: 10, hours: 3, iceBagKg: 2 }));
    expect([c.ice!.min, c.ice!.max]).toEqual([9000, 11500]);
    expect(c['ice-bags']!.label).toBe('Bags of ice (2 kg)');
    expect(c['ice-bags']!.text).toBe('5–6 bags');
  });

  it('no alcohol: every drink is non-alcoholic and no bottles are suggested', () => {
    const c = byKey(calculate({ people: 10, hours: 2, alcohol: false }));
    expect(c.na!.min).toBe(30);
    expect(c.wine).toBeUndefined();
  });

  it('full meal per person, +10–15% for a buffet', () => {
    const plain = byKey(calculate({ people: 10, hours: 3 }));
    expect([plain.food!.min, plain.food!.max]).toEqual([4500, 7000]);
    expect([plain.protein!.min, plain.protein!.max]).toEqual([2250, 2800]);
    expect(plain.sides!.text).toBe('2–3 kinds');
    expect(plain.bread!.text).toBe('10–20 pieces');
    expect(plain.cutlery!.min).toBe(15);
    expect(plain.plates!.min).toBe(30);
    const buffet = byKey(calculate({ people: 10, hours: 3, buffet: true }));
    expect([buffet.food!.min, buffet.food!.max]).toEqual([4950, 8050]);
  });

  it('appetizer plans', () => {
    const before = byKey(calculate({ people: 10, hours: 2, food: 'appetizers-before-meal' }));
    expect(before.appetizers!.text).toBe('40–60 pieces');
    expect(before.appetizers!.tag).toBe('S');
    expect(
      byKey(calculate({ people: 10, hours: 2, food: 'appetizers-only' })).appetizers!.text,
    ).toBe('60–80 pieces');
    const heavy = byKey(calculate({ people: 10, hours: 2, food: 'heavy-appetizers' }));
    expect([heavy.appetizers!.text, heavy.appetizers!.tag]).toEqual(['120–150 pieces', 'H']);
    expect(heavy.cutlery).toBeUndefined();
    expect(heavy.plates!.min).toBe(15);
  });

  it('no food: no food lines and no plates', () => {
    const c = byKey(calculate({ people: 10, hours: 2, food: 'none' }));
    expect(c.food ?? c.appetizers ?? c.plates).toBeUndefined();
  });

  it('supplies and seats', () => {
    const c = byKey(calculate({ people: 25, hours: 3 }));
    expect([c.cups!.min, c.napkins!.min, c.trash!.min, c.seats!.min]).toEqual([50, 75, 3, 9]);
    expect(byKey(calculate({ people: 8, hours: 3, seated: true })).seats!.min).toBe(8);
    expect(byKey(calculate({ people: 0, hours: 3 })).trash!.min).toBe(1);
  });
});

describe('calculator for a party', () => {
  it('uses expected guests + hosts, party length, food style', () => {
    const p = sampleParty(); // 4 expected + 1 host, 4 h, potluck → buffet full meal
    const c = byKey(calculateForParty(p));
    expect(c.drinks!.min).toBe(25);
    expect(c.food!.min).toBe(2475);
    expect(c.seats!.label).toMatch(/third/);
  });

  it('dinner parties seat everyone; snacks parties get appetizers; eat-first gets no food', () => {
    const p = sampleParty();
    expect(
      byKey(calculateForParty({ ...p, type: 'dinner', details: { food: 'full-meal' } })).seats!.min,
    ).toBe(5);
    expect(
      byKey(calculateForParty({ ...p, details: { food: 'snacks' } })).appetizers,
    ).toBeDefined();
    expect(byKey(calculateForParty({ ...p, details: { food: 'eat-first' } })).food).toBeUndefined();
    expect(byKey(calculateForParty({ ...p, details: {} }, { hot: true })).water!.min).toBe(5000);
  });

  it('caps the hours for long parties and defaults to 3 without an end', () => {
    const p = sampleParty();
    expect(partyHours(p)).toBe(4);
    expect(partyHours({ ...p, end: undefined })).toBe(3);
    expect(partyHours({ ...p, end: '2026-12-14T14:00' })).toBe(8);
    expect(partyHours({ ...p, end: '2026-12-12T19:20' })).toBe(1);
  });
});
