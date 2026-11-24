import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';
import { decodeGuestPayload, encodeGuestPayload, guestPayloadLink } from '../../src/domain/payload';
import { guestShare, shareInfo } from '../../src/domain/share';
import { sampleParty } from './helpers';

const sample = () => {
  const p = sampleParty();
  const leo = p.guests[1]!;
  // A realistic guest: three tasks.
  for (const t of p.tasks.filter((t) => t.kind === 'bring').slice(0, 2)) t.assigneeIds = [leo.id];
  return { info: shareInfo(p), guest: guestShare(p, leo), updatedAt: '2026-11-24T12:00:00.000Z' };
};

describe('offline guest links', () => {
  it('round-trips', () => {
    const s = sample();
    expect(decodeGuestPayload(encodeGuestPayload(s))).toEqual(s);
  });

  it('stays SMS-sized (< 1,500 characters) for a guest with three tasks', () => {
    const link = guestPayloadLink('https://hamidrezakhoram.github.io/hostbook/#/guests', sample());
    expect(link.startsWith('https://hamidrezakhoram.github.io/hostbook/#/i/')).toBe(true);
    expect(link.length).toBeLessThan(1500);
    expect(sample().guest.tasks).toHaveLength(3);
  });

  it('rejects anything that is not a payload we understand', () => {
    expect(decodeGuestPayload('')).toBeNull();
    expect(decodeGuestPayload('not-a-payload')).toBeNull();
    expect(decodeGuestPayload('%%%')).toBeNull();
    expect(decodeGuestPayload(compressToEncodedURIComponent('{"v":2}'))).toBeNull();
    expect(
      decodeGuestPayload(compressToEncodedURIComponent('{"v":1,"i":{},"g":{"name":"x"},"u":"x"}')),
    ).toBeNull();
    expect(decodeGuestPayload(compressToEncodedURIComponent('[1,2'))).toBeNull();
  });
});
