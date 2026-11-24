// What is shared with guests through Firebase (ADR-010). Only guest-visible data lives here:
// the host's full party (contacts, dietary info, private notes) never leaves the device.

/** Party logistics visible to anyone holding the party link (guest links and the potluck board). */
export interface ShareInfo {
  name: string;
  start: string; // local ISO date-time, e.g. "2026-12-12T19:00"
  end?: string;
  tz: string; // IANA zone
  place?: { label?: string; address?: string; mapsUrl?: string; parking?: string };
  food?: string;
  dress?: string;
  note?: string;
  hostName: string;
}

/** One guest's own part, visible only to holders of that guest's token. */
export interface GuestShare {
  name: string;
  arrival: string; // local ISO date-time
  leave?: string;
  roles?: string[];
  tasks?: { title: string; qty?: string; when?: string; note?: string }[];
  /** Door code / buzzer and the host's phone go only to invited guests, never to the open board. */
  access?: string;
  hostPhone?: string;
}

/** An item on the bring board. */
export interface BoardSlot {
  title: string;
  category?: string;
  qty?: string;
  note?: string;
}

export interface Claim {
  uid: string; // who claimed it (anonymous auth uid); the host's uid when the host assigned it
  name: string; // the name shown on the board
  at: number; // server time, ms
}

export interface BoardEntry {
  slot: BoardSlot;
  claim?: Claim;
}

export type GuestRsvp = 'yes' | 'maybe' | 'no';

export interface ReplyInput {
  rsvp: GuestRsvp;
  plusOnes?: number;
  note?: string;
}

export interface Reply extends ReplyInput {
  at: number;
}

/** Everything the host publishes in one go. `null` removes a guest or slot. */
export interface SharePublish {
  info: ShareInfo;
  guests?: Record<string, GuestShare | null>;
  board?: Record<string, BoardSlot | null>;
}

/** What a guest link opens. */
export interface GuestView {
  info: ShareInfo;
  guest: GuestShare;
  reply: Reply | null;
}

export const LIMITS = { claimName: 40, note: 500, plusOnes: 10 } as const;
