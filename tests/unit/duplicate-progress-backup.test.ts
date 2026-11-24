import { describe, expect, it } from 'vitest';
import { makeBackup, mergeParties, readBackup, backupFileName } from '../../src/domain/backup';
import { duplicateParty } from '../../src/domain/duplicate';
import { currentBucket, prepProgress } from '../../src/domain/progress';
import { withShareIds } from '../../src/domain/share';
import { sampleParty, seq } from './helpers';

describe('duplicateParty: same party next year', () => {
  it('keeps the plan and the people, resets what happened', () => {
    const p = withShareIds(sampleParty(), seq('s'));
    p.guests[0]!.attended = true;
    p.guests[0]!.reply = { rsvp: 'yes', note: 'Yay', at: 1 };
    p.tasks[1]!.claimUid = 'someone';
    p.guests[0]!.arrivalOverride = '2026-12-12T18:00';
    p.checklist[0]!.done = true;
    p.runSheet[0]!.done = true;
    p.debrief = { worked: 'Dumplings' };
    p.lastBackupAt = '2026-12-13T00:00:00.000Z';
    const copy = duplicateParty(p, new Date('2027-01-01T00:00:00Z'), seq('n'));

    expect(copy.name).toBe('Dumpling Night (copy)');
    expect(copy.id).not.toBe(p.id);
    expect(copy.createdAt).toBe('2027-01-01T00:00:00.000Z');
    expect(copy.share ?? copy.debrief ?? copy.lastBackupAt).toBeUndefined();
    expect(copy.guests.map((g) => g.name)).toEqual(p.guests.map((g) => g.name));
    expect(
      copy.guests.every((g) => g.rsvp === 'invited' && !g.token && g.attended === undefined),
    ).toBe(true);
    expect(copy.guests[0]!.arrivalOverride).toBeUndefined();
    expect(copy.guests[0]!.reply).toBeUndefined();
    expect(copy.tasks.every((t) => t.claimUid === undefined)).toBe(true);
    expect(copy.guests[0]!.roles).toEqual(['helper']);
    expect(copy.guests[2]!.dietary.allergies).toEqual(['tree-nut']);
    expect(copy.tasks.every((t) => t.status === 'open' && t.assigneeIds.length === 0)).toBe(true);
    expect(copy.checklist.every((c) => !c.done)).toBe(true);
    expect(copy.runSheet.every((r) => r.done === undefined)).toBe(true);
    const ids = [copy.id, ...copy.guests.map((g) => g.id), ...copy.tasks.map((t) => t.id)];
    expect(ids.some((x) => [p.id, ...p.guests.map((g) => g.id)].includes(x))).toBe(false);
    // the original is untouched
    expect(p.guests[0]!.attended).toBe(true);
  });
});

describe('prep progress', () => {
  const p = sampleParty(); // Sat Dec 12, 7–11 p.m.

  it.each([
    ['2026-10-01T12:00', 'w6'],
    ['2026-11-25T12:00', 'w3'],
    ['2026-12-06T12:00', 'w1'],
    ['2026-12-10T20:00', 'd2'],
    ['2026-12-12T10:00', 'day'],
    ['2026-12-12T18:57', 'min5'],
    ['2026-12-12T20:00', 'during'],
    ['2026-12-13T09:00', 'after'],
  ] as const)('at %s the stage is %s', (now, bucket) => {
    expect(currentBucket(p, now)).toBe(bucket);
  });

  it('a party with no end is "during" once it starts', () => {
    expect(currentBucket({ ...p, end: undefined }, '2026-12-13T09:00')).toBe('during');
  });

  it('suggests the oldest undone items up to the current stage', () => {
    const q = sampleParty();
    q.checklist.filter((c) => c.bucket === 'w6').forEach((c) => (c.done = true));
    const prog = prepProgress(q, '2026-11-25T12:00');
    expect(prog.current).toBe('w3');
    expect(prog.next).toHaveLength(3);
    expect(prog.next.every((c) => c.bucket === 'w3')).toBe(true);
    expect(prog.done).toBe(5);
    expect(prog.total).toBe(q.checklist.length);
    expect(prepProgress(q, '2026-10-01T12:00').next).toEqual([]);
  });
});

describe('backups', () => {
  it('round-trips every party', () => {
    const a = sampleParty();
    const b = { ...sampleParty(), id: 'other' };
    const text = makeBackup([a, b], new Date('2026-12-01T00:00:00Z'));
    expect(JSON.parse(text)).toMatchObject({
      app: 'hostbook',
      version: 1,
      exportedAt: '2026-12-01T00:00:00.000Z',
    });
    expect(readBackup(text)).toEqual({ parties: [a, b], skipped: [] });
    expect(backupFileName(new Date('2026-12-01T10:00:00Z'))).toBe(
      'hostbook-backup-2026-12-01.json',
    );
  });

  it('accepts a single party file and skips broken parties', () => {
    const a = sampleParty();
    expect(readBackup(JSON.stringify(a)).parties).toEqual([a]);
    const mixed = JSON.stringify({
      app: 'hostbook',
      version: 1,
      exportedAt: 'x',
      parties: [a, { schemaVersion: 1 }],
    });
    const r = readBackup(mixed);
    expect(r.parties).toHaveLength(1);
    expect(r.skipped[0]).toMatch(/^#2: Can't read this party/);
  });

  it('rejects files that are not backups', () => {
    expect(() => readBackup('hello')).toThrow(/not a Hostbook backup/);
    expect(() => readBackup('{"app":"hostbook","parties":3}')).toThrow(/not a Hostbook backup/);
    expect(() => readBackup('{"name":"x"}')).toThrow(/no schema version/);
  });

  it('merging keeps the most recently changed copy', () => {
    const old = { ...sampleParty(), id: 'a', updatedAt: '2026-01-01' };
    const newer = { ...old, name: 'Newer', updatedAt: '2026-02-01' };
    const other = { ...old, id: 'b' };
    expect(mergeParties([old], [newer, other])).toMatchObject({ added: 1, updated: 1 });
    expect(mergeParties([old], [newer]).parties[0]!.name).toBe('Newer');
    expect(mergeParties([newer], [old])).toMatchObject({ added: 0, updated: 0, parties: [newer] });
  });
});
