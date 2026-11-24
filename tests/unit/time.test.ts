import { describe, expect, it } from 'vitest';
import { addMinutes, isLocalIso, minutesBetween, nowLocal, toUtcDate } from '../../src/lib/time';

describe('wall-clock time', () => {
  it('adds and subtracts minutes across midnight and month ends', () => {
    expect(addMinutes('2026-12-12T19:00', -75)).toBe('2026-12-12T17:45');
    expect(addMinutes('2026-12-31T23:30', 45)).toBe('2027-01-01T00:15');
    expect(addMinutes('2026-03-01T00:10', -20)).toBe('2026-02-28T23:50');
  });

  it('ignores daylight saving: party times are what the invitation says', () => {
    // Clocks spring forward on 2026-03-08 in Toronto; the party still runs 7 p.m. + 3 h = 10 p.m.
    expect(addMinutes('2026-03-08T19:00', 180)).toBe('2026-03-08T22:00');
  });

  it('measures minutes between two times', () => {
    expect(minutesBetween('2026-12-12T19:00', '2026-12-12T23:00')).toBe(240);
    expect(minutesBetween('2026-12-12T19:00', '2026-12-12T17:45')).toBe(-75);
  });

  it('validates local date-times', () => {
    expect(isLocalIso('2026-12-12T19:00')).toBe(true);
    expect(isLocalIso('2026-02-30T19:00')).toBe(false);
    expect(isLocalIso('2026-12-12 19:00')).toBe(false);
    expect(isLocalIso('2026-12-12T19:00:00Z')).toBe(false);
    expect(() => toUtcDate('tomorrow')).toThrow(/Not a local date-time/);
  });

  it("gives 'now' on the party's wall clock", () => {
    const now = new Date('2026-12-13T03:30:00Z');
    expect(nowLocal('America/Toronto', now)).toBe('2026-12-12T22:30');
    expect(nowLocal('America/Vancouver', now)).toBe('2026-12-12T19:30');
  });
});
