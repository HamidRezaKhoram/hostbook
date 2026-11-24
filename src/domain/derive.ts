// Values computed from a party. Pure functions; the UI only displays them.
import { formatList } from '../lib/format';
import { addMinutes } from '../lib/time';
import {
  ALLERGEN_LABELS,
  CATEGORY_ORDER,
  DIET_LABELS,
  MAYBE_SHOWS,
  RELIGIOUS_LABELS,
  ROLE_TIMES,
} from './constants';
import type { Allergen, Diet, Guest, Party, Religious, Task, TaskCategory } from './types';

/** Minutes from the start: explicit offset, else the earliest of the guest's roles. */
export function arrivalOffset(guest: Guest): number {
  if (guest.arrivalOffsetMin !== undefined) return guest.arrivalOffsetMin;
  const roles = guest.roles.length ? guest.roles : ['regular' as const];
  return Math.min(...roles.map((r) => ROLE_TIMES[r].arrive));
}

export function arrivalTime(party: Party, guest: Guest): string {
  return guest.arrivalOverride ?? addMinutes(party.start, arrivalOffset(guest));
}

/** When this guest is asked to stay until, if their role means staying past the end. */
export function leaveTime(party: Party, guest: Guest): string | undefined {
  if (!party.end) return undefined;
  const offsets = guest.roles.map((r) => ROLE_TIMES[r].leave).filter((x) => x !== undefined);
  const extra = guest.leaveOffsetMin ?? (offsets.length ? Math.max(...offsets) : undefined);
  return extra === undefined ? undefined : addMinutes(party.end, extra);
}

const people = (g: Guest) => 1 + g.plusOnes;

export interface Headcount {
  yes: number;
  maybe: number;
  no: number;
  invited: number;
  /** yes + half of maybe (including plus-ones), rounded up. Guests only, not hosts. */
  expected: number;
}

export function headcount(party: Party): Headcount {
  const sum = (rsvp: Guest['rsvp']) =>
    party.guests.filter((g) => g.rsvp === rsvp).reduce((n, g) => n + people(g), 0);
  const yes = sum('yes');
  const maybe = sum('maybe');
  return {
    yes,
    maybe,
    no: sum('no'),
    invited: sum('invited'),
    expected: Math.ceil(yes + MAYBE_SHOWS * maybe),
  };
}

/** Guests who still matter for planning: not declined. */
export const activeGuests = (party: Party) => party.guests.filter((g) => g.rsvp !== 'no');

export const isCovered = (t: Task) => t.assigneeIds.length > 0 && t.status !== 'declined';

export interface CategoryGaps {
  category: TaskCategory;
  tasks: Task[];
  covered: number;
  open: Task[];
}

/** Bring-board groups in board order, each with what is still open. */
export function bringBoard(party: Party): CategoryGaps[] {
  const bring = party.tasks.filter((t) => t.kind === 'bring');
  return CATEGORY_ORDER.map((category) => {
    const tasks = bring.filter((t) => t.category === category);
    const open = tasks.filter((t) => !isCovered(t));
    return { category, tasks, covered: tasks.length - open.length, open };
  }).filter((g) => g.tasks.length > 0);
}

export function openTasks(party: Party): Task[] {
  return party.tasks.filter((t) => t.kind !== 'host' && !isCovered(t));
}

export function tasksFor(party: Party, guestId: string): Task[] {
  return party.tasks.filter((t) => t.assigneeIds.includes(guestId) && t.status !== 'declined');
}

export interface DietaryGroup<K> {
  key: K;
  label: string;
  names: string[];
}

export interface DietarySummary {
  allergies: DietaryGroup<Allergen>[];
  diets: DietaryGroup<Diet>[];
  religious: DietaryGroup<Religious>[];
  notes: { name: string; note: string }[];
  /** "1 tree nut allergy (Sam) · 3 vegetarian · 1 halal", or '' when nothing to know. */
  line: string;
}

function group<K extends string>(
  guests: Guest[],
  pick: (g: Guest) => K[],
  labels: Record<K, string>,
): DietaryGroup<K>[] {
  const map = new Map<K, string[]>();
  for (const g of guests) for (const k of pick(g)) map.set(k, [...(map.get(k) ?? []), g.name]);
  return [...map].map(([key, names]) => ({ key, label: labels[key], names }));
}

/** Dietary needs of everyone still coming. Allergies first: they are about safety. */
export function dietarySummary(party: Party): DietarySummary {
  const guests = activeGuests(party);
  const allergies = group(guests, (g) => g.dietary.allergies, ALLERGEN_LABELS);
  const diets = group(guests, (g) => g.dietary.diets, DIET_LABELS);
  const religious = group(guests, (g) => g.dietary.religious, RELIGIOUS_LABELS);
  const notes = guests
    .filter((g) => g.dietary.note?.trim())
    .map((g) => ({ name: g.name, note: g.dietary.note!.trim() }));
  const line = [
    ...allergies.map(
      (a) =>
        `${a.names.length} ${a.label} ${a.names.length === 1 ? 'allergy' : 'allergies'} (${formatList(a.names)})`,
    ),
    ...diets.map((d) => `${d.names.length} ${d.label}`),
    ...religious.map((r) => `${r.names.length} ${r.label}`),
  ].join(' · ');
  return { allergies, diets, religious, notes, line };
}

/**
 * Allergies nobody has a safe dish for yet: for each allergen someone coming has, is there at
 * least one food dish marked free of it? (Feeds a nudge: guide §8.)
 */
export function allergiesWithoutSafeDish(party: Party): DietaryGroup<Allergen>[] {
  const FOOD: TaskCategory[] = ['main', 'side', 'salad', 'dessert', 'bread', 'snacks'];
  const dishes = party.tasks.filter((t) => FOOD.includes(t.category));
  return dietarySummary(party).allergies.filter(
    (a) => a.key !== 'other' && !dishes.some((d) => d.safeFor?.allergenFree?.includes(a.key)),
  );
}
