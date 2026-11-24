import { describe, expect, it } from 'vitest';
import { BUCKET_ORDER, PARTY_TYPE_LABELS } from '../../src/domain/constants';
import { newParty } from '../../src/domain/factories';
import { TEMPLATES } from '../../src/domain/templates';
import type { PartyType } from '../../src/domain/types';
import { NOW, seq } from './helpers';

const TYPES = Object.keys(PARTY_TYPE_LABELS) as PartyType[];

describe.each(TYPES)('%s template', (type) => {
  const p = newParty(
    { type, name: 'X', start: '2026-12-11T18:00', tz: 'America/Toronto', hostName: 'H' },
    NOW,
    seq(),
  );

  it('makes a valid party with an end time and covered basics', () => {
    expect(TEMPLATES[type]).toBeDefined();
    expect(p.end! > p.start).toBe(true);
    expect(p.tasks.some((t) => t.category === 'ice')).toBe(true);
    expect(p.tasks.some((t) => t.category === 'na-drinks')).toBe(true);
    expect(new Set(p.tasks.map((t) => t.id)).size).toBe(p.tasks.length);
  });

  it('run sheet fits inside the party and ends with the close', () => {
    const duration = TEMPLATES[type].durationMin;
    for (const r of p.runSheet) expect(r.offsetMin).toBeLessThanOrEqual(duration);
    expect(p.runSheet.at(-1)!.offsetMin).toBe(duration);
  });

  it('checklist covers every stage, each item linked to a real guide section', () => {
    const buckets = new Set(p.checklist.map((c) => c.bucket));
    expect([...buckets].sort()).toEqual([...BUCKET_ORDER].sort());
    for (const c of p.checklist)
      if (c.guideRef) expect(Number(c.guideRef)).toBeGreaterThanOrEqual(1);
    for (const c of p.checklist) if (c.guideRef) expect(Number(c.guideRef)).toBeLessThanOrEqual(17);
  });
});

it('parties with alcohol remind the host to stop serving an hour before the end', () => {
  const p = newParty(
    { type: 'bbq', name: 'X', start: '2026-07-11T15:00', tz: 'America/Toronto', hostName: 'H' },
    NOW,
    seq(),
  );
  expect(p.runSheet.find((r) => r.title === 'Stop serving alcohol')!.offsetMin).toBe(240 - 60);
  expect(p.checklist.some((c) => /how they are getting home/.test(c.text))).toBe(true);
});
