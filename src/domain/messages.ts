// Ready-to-send texts for guests. Friendly, short, editable before sending (ui-guidelines.md).
import { formatList, formatTime, formatWhen } from '../lib/format';
import { arrivalTime, tasksFor } from './derive';
import type { Guest, Party } from './types';

export type MessageKind = 'invite' | 'week' | 'day';

/** Ends with one full stop: "7:00 p.m." stays as it is, never "p.m..". */
const stop = (s: string) => (s.endsWith('.') ? s : `${s}.`);

function asks(party: Party, guest: Guest): string {
  const items = tasksFor(party, guest.id).map((t) =>
    t.quantity ? `${t.title} (${t.quantity})` : t.title,
  );
  return items.length ? ` Could you bring or help with ${formatList(items)}?` : '';
}

function arrival(party: Party, guest: Guest): string {
  const at = arrivalTime(party, guest);
  return at === party.start ? '' : ` Could you come at ${formatTime(at)}?`;
}

export function guestMessage(kind: MessageKind, party: Party, guest: Guest, url: string): string {
  const first = guest.name.split(' ')[0];
  const when = formatWhen(party.start, party.end);
  switch (kind) {
    case 'invite':
      return `Hey ${first}! ${party.name} is on ${stop(when)}${arrival(party, guest)}${asks(party, guest)} Details and RSVP: ${url}`;
    case 'week':
      return `Hi ${first}! ${party.name} is one week away (${when}).${arrival(party, guest)}${asks(party, guest)} Your details: ${url}`;
    case 'day':
      return `See you tomorrow, ${first}! ${party.name}, ${stop(formatTime(arrivalTime(party, guest)))}${party.location.address ? ` ${stop(party.location.address)}` : ''} Everything you need: ${url}`;
  }
}

export function boardMessage(party: Party, url: string): string {
  return `Help fill the bring list for ${party.name} (${formatWhen(party.start, party.end)}). Pick something: ${url}`;
}

/** Phone number as WhatsApp wants it: digits with country code (10-digit numbers are North American). */
export function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `1${digits}` : digits;
}

export function smsHref(phone: string | undefined, body: string): string {
  // "?&body=" works on both iOS and Android.
  return `sms:${(phone ?? '').replace(/[^\d+]/g, '')}?&body=${encodeURIComponent(body)}`;
}

export function whatsappHref(phone: string | undefined, text: string): string {
  const to = phone ? whatsappDigits(phone) : '';
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}
