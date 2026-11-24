import { describe, expect, it } from 'vitest';
import { makeIcs } from '../../src/domain/ics';
import {
  boardMessage,
  guestMessage,
  smsHref,
  whatsappDigits,
  whatsappHref,
} from '../../src/domain/messages';
import { guestShare, shareInfo } from '../../src/domain/share';
import { sampleParty } from './helpers';

const URL = 'https://hamidrezakhoram.github.io/hostbook/#/g/abc/def';

describe('guest messages', () => {
  const p = sampleParty();
  const [maya, leo] = p.guests;

  it('invites with the time and the ask', () => {
    expect(guestMessage('invite', p, leo!, URL)).toBe(
      `Hey Leo! Dumpling Night is on Sat, Dec 12 · 7:00–11:00 p.m. Could you bring or help with Ice (10 kg)? Details and RSVP: ${URL}`,
    );
    expect(guestMessage('invite', p, maya!, URL)).toContain('Could you come at 5:45 p.m.?');
  });

  it('reminds a week and a day before', () => {
    expect(guestMessage('week', p, leo!, URL)).toMatch(/^Hi Leo! Dumpling Night is one week away/);
    expect(guestMessage('day', p, maya!, URL)).toBe(
      `See you tomorrow, Maya! Dumpling Night, 5:45 p.m. 12 Birch Rd. Everything you need: ${URL}`,
    );
    expect(guestMessage('day', { ...p, location: {} }, leo!, URL)).not.toContain('Birch');
    expect(guestMessage('week', p, maya!, URL)).not.toContain('bring or help');
  });

  it('asks for help with the open board', () => {
    expect(boardMessage(p, URL)).toBe(
      `Help fill the bring list for Dumpling Night (Sat, Dec 12 · 7:00–11:00 p.m.). Pick something: ${URL}`,
    );
  });
});

describe('SMS and WhatsApp links', () => {
  it('builds links that open the right app with the text filled in', () => {
    expect(smsHref('+1 (555) 010-0100', 'Hi & bye')).toBe('sms:+15550100100?&body=Hi%20%26%20bye');
    expect(smsHref(undefined, 'Hi')).toBe('sms:?&body=Hi');
    expect(whatsappDigits('(555) 010-0100')).toBe('15550100100');
    expect(whatsappDigits('+44 7700 900123')).toBe('447700900123');
    expect(whatsappHref('555-010-0100', 'Hi')).toBe('https://wa.me/15550100100?text=Hi');
    expect(whatsappHref(undefined, 'Hi')).toBe('https://wa.me/?text=Hi');
  });
});

describe('calendar file', () => {
  const p = sampleParty();
  const now = new Date('2026-11-24T12:00:00Z');

  it("uses the guest's own arrival and the party's time zone", () => {
    const ics = makeIcs(shareInfo(p), guestShare(p, p.guests[0]!), URL, 'abc', now);
    expect(ics).toContain('DTSTART;TZID=America/Toronto:20261212T174500\r\n');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20261212T230000\r\n');
    expect(ics).toContain('SUMMARY:Dumpling Night\r\n');
    expect(ics).toContain('LOCATION:12 Birch Rd\r\n');
    expect(ics).toContain('DTSTAMP:20261124T120000Z');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    for (const line of ics.split('\r\n'))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  it('escapes text and works without a guest or end', () => {
    const info = { ...shareInfo(p), name: 'Tacos, Tunes; Fun', end: undefined, place: undefined };
    const ics = makeIcs(info, null, URL, 'x', now);
    expect(ics).toContain('SUMMARY:Tacos\\, Tunes\\; Fun');
    expect(ics).toContain('DTEND;TZID=America/Toronto:20261212T220000');
    expect(ics).not.toContain('LOCATION');
    const leo = guestShare(p, p.guests[1]!);
    expect(makeIcs(shareInfo(p), leo, URL, 'x', now)).toContain('Bring/do: Ice (10 kg)');
  });
});
