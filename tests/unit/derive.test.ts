import { describe, expect, it } from 'vitest';
import {
  activeGuests,
  allergiesWithoutSafeDish,
  arrivalOffset,
  arrivalTime,
  bringBoard,
  dietarySummary,
  headcount,
  leaveTime,
  openTasks,
  tasksFor,
} from '../../src/domain/derive';
import { guest, sampleParty } from './helpers';

describe('arrival and leave times (guide §7)', () => {
  const party = sampleParty();

  it('uses role defaults, the earliest role winning', () => {
    expect(arrivalTime(party, guest('A'))).toBe('2026-12-12T19:00');
    expect(arrivalTime(party, guest('B', { roles: ['helper'] }))).toBe('2026-12-12T17:45');
    expect(arrivalTime(party, guest('C', { roles: ['seed'] }))).toBe('2026-12-12T18:40');
    expect(arrivalTime(party, guest('D', { roles: ['seed', 'cohost'] }))).toBe('2026-12-12T17:30');
    expect(arrivalOffset(guest('E', { roles: [] }))).toBe(0);
  });

  it('lets the host override with an offset or an exact time', () => {
    expect(arrivalTime(party, guest('A', { roles: ['helper'], arrivalOffsetMin: -30 }))).toBe(
      '2026-12-12T18:30',
    );
    expect(arrivalTime(party, guest('A', { arrivalOverride: '2026-12-12T20:15' }))).toBe(
      '2026-12-12T20:15',
    );
  });

  it('moving the party moves everyone', () => {
    const later = { ...party, start: '2026-12-12T20:00' };
    expect(arrivalTime(later, party.guests[0]!)).toBe('2026-12-12T18:45');
  });

  it('asks cleanup crew and co-hosts to stay after the end', () => {
    expect(party.end).toBe('2026-12-12T23:00');
    expect(leaveTime(party, guest('A'))).toBeUndefined();
    expect(leaveTime(party, guest('A', { roles: ['cleanup'] }))).toBe('2026-12-12T23:45');
    expect(leaveTime(party, guest('A', { roles: ['cleanup', 'cohost'] }))).toBe('2026-12-13T00:00');
    expect(leaveTime(party, guest('A', { leaveOffsetMin: 15 }))).toBe('2026-12-12T23:15');
    expect(
      leaveTime({ ...party, end: undefined }, guest('A', { roles: ['cleanup'] })),
    ).toBeUndefined();
  });
});

describe('headcount', () => {
  it('counts yes + half of maybe, with plus-ones, rounded up', () => {
    // yes: Maya 1 + Leo 2 = 3; maybe: Sam 1 → 3.5 → 4
    expect(headcount(sampleParty())).toEqual({ yes: 3, maybe: 1, no: 1, invited: 1, expected: 4 });
  });

  it('active guests excludes those who said no', () => {
    expect(activeGuests(sampleParty()).map((g) => g.name)).toEqual(['Maya', 'Leo', 'Sam', 'Ana']);
  });
});

describe('bring board and tasks', () => {
  it('groups bring tasks in board order and lists what is still open', () => {
    const board = bringBoard(sampleParty());
    expect(board.map((g) => g.category)).toEqual([
      'main',
      'side',
      'salad',
      'bread',
      'dessert',
      'drinks',
      'na-drinks',
      'ice',
      'supplies',
      'equipment',
    ]);
    const ice = board.find((g) => g.category === 'ice')!;
    expect([ice.covered, ice.open.length]).toEqual([1, 0]);
    const dessert = board.find((g) => g.category === 'dessert')!;
    expect([dessert.covered, dessert.open.map((t) => t.title)]).toEqual([
      1,
      ['Second dessert or fruit'],
    ]);
  });

  it('treats declined tasks as open again', () => {
    const p = sampleParty();
    p.tasks.find((t) => t.category === 'ice')!.status = 'declined';
    expect(openTasks(p).some((t) => t.category === 'ice')).toBe(true);
    expect(tasksFor(p, p.guests[1]!.id)).toEqual([]);
  });

  it('open tasks never include the host’s own to-dos', () => {
    expect(openTasks(sampleParty()).every((t) => t.kind !== 'host')).toBe(true);
  });
});

describe('dietary summary (guide §8)', () => {
  it('summarises people still coming, allergies first', () => {
    const s = dietarySummary(sampleParty());
    expect(s.allergies).toEqual([{ key: 'tree-nut', label: 'tree nut', names: ['Sam'] }]);
    expect(s.diets).toEqual([{ key: 'vegetarian', label: 'vegetarian', names: ['Maya', 'Ana'] }]);
    expect(s.religious).toEqual([{ key: 'halal', label: 'halal', names: ['Ana'] }]);
    expect(s.notes).toEqual([{ name: 'Sam', note: 'EpiPen in bag' }]);
    expect(s.line).toBe('1 tree nut allergy (Sam) · 2 vegetarian · 1 halal');
  });

  it('pluralises allergies and is empty when there is nothing to know', () => {
    const p = sampleParty();
    p.guests[0]!.dietary.allergies = ['tree-nut'];
    expect(dietarySummary(p).line).toMatch(/^2 tree nut allergies \(Maya and Sam\)/);
    expect(dietarySummary({ ...p, guests: [] }).line).toBe('');
  });

  it('flags allergies with no dish marked safe', () => {
    const p = sampleParty();
    expect(allergiesWithoutSafeDish(p).map((a) => a.key)).toEqual(['tree-nut']);
    p.tasks.find((t) => t.title === 'Dessert')!.safeFor = { allergenFree: ['tree-nut', 'peanut'] };
    expect(allergiesWithoutSafeDish(p)).toEqual([]);
  });
});
