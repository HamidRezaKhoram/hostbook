// Calendar file for a guest (RFC 5545). Times are the party's wall clock in its time zone.
import type { GuestShare, ShareInfo } from '../sync/types';
import { addMinutes } from '../lib/time';

const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (local: string) => `${local.replace(/[-:]/g, '')}00`;

/** Lines longer than 75 octets are folded (RFC 5545 §3.1). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 75;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

export function makeIcs(
  info: ShareInfo,
  guest: GuestShare | null,
  url: string,
  uid: string,
  now = new Date(),
): string {
  const start = guest?.arrival ?? info.start;
  const end = guest?.leave ?? info.end ?? addMinutes(info.start, 180);
  const details = [
    guest && guest.arrival !== info.start ? `You: arrive ${guest.arrival.slice(11)}` : '',
    ...(guest?.tasks ?? []).map((t) => `Bring/do: ${t.title}${t.qty ? ` (${t.qty})` : ''}`),
    info.place?.parking ? `Parking: ${info.place.parking}` : '',
    guest?.access ? `Getting in: ${guest.access}` : '',
    info.note ?? '',
    url,
  ].filter(Boolean);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hostbook//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@hostbook`,
    `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${info.tz}:${stamp(start)}`,
    `DTEND;TZID=${info.tz}:${stamp(end)}`,
    `SUMMARY:${esc(info.name)}`,
    ...(info.place?.address ? [`LOCATION:${esc(info.place.address)}`] : []),
    `DESCRIPTION:${esc(details.join('\n'))}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
