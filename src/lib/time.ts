// Wall-clock date-time arithmetic on local ISO strings ("2026-12-12T19:00").
// Party times are what's written on the invitation, so we never convert time zones here:
// "7:00 p.m. minus 75 minutes" is "5:45 p.m." on the host's clock.

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isLocalIso(s: string): boolean {
  const m = LOCAL.exec(s);
  if (!m) return false;
  const d = toUtcDate(s);
  return d.getUTCMonth() + 1 === Number(m[2]) && d.getUTCDate() === Number(m[3]);
}

/** Treats the wall-clock time as UTC so plain arithmetic never shifts it. */
export function toUtcDate(local: string): Date {
  const m = LOCAL.exec(local);
  if (!m) throw new Error(`Not a local date-time: ${local}`);
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number];
  return new Date(Date.UTC(y, mo - 1, d, h, mi));
}

export function fromUtcDate(d: Date): string {
  return d.toISOString().slice(0, 16);
}

export function addMinutes(local: string, minutes: number): string {
  return fromUtcDate(new Date(toUtcDate(local).getTime() + minutes * 60_000));
}

export function minutesBetween(from: string, to: string): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 60_000);
}

/** "Today" on the host's wall clock in the party's zone, as a local ISO string. */
export function nowLocal(tz: string, now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
