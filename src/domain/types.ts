// The host's party, as stored on the device (data-model.md). Pure types, no logic.

export const SCHEMA_VERSION = 1;

export type PartyType =
  | 'dinner'
  | 'potluck'
  | 'cocktail'
  | 'bbq'
  | 'game-night'
  | 'open-house'
  | 'holiday'
  | 'cottage'
  | 'custom';

export type Rsvp = 'invited' | 'yes' | 'maybe' | 'no';

export type Role =
  'regular' | 'helper' | 'seed' | 'cleanup' | 'driver' | 'cohost' | 'guest-of-honor';

/** Health Canada priority allergens, plus gluten (ADR-011). */
export type Allergen =
  | 'peanut'
  | 'tree-nut'
  | 'sesame'
  | 'milk'
  | 'egg'
  | 'fish'
  | 'shellfish'
  | 'soy'
  | 'wheat'
  | 'gluten'
  | 'mustard'
  | 'sulphites'
  | 'other';

export type Diet =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'gluten-free'
  | 'dairy-free'
  | 'low-carb'
  | 'no-alcohol'
  | 'other';

export type Religious = 'halal' | 'kosher' | 'no-pork' | 'no-beef' | 'other';

export type FoodStyle = 'full-meal' | 'snacks' | 'potluck' | 'eat-first';
export type YesNoAsk = 'yes' | 'no' | 'ask';

export interface Dietary {
  allergies: Allergen[];
  diets: Diet[];
  religious: Religious[];
  note?: string;
}

export interface Guest {
  id: string;
  name: string;
  phone?: string;
  rsvp: Rsvp;
  /** Set after the party; builds the host's own no-show history. */
  attended?: boolean;
  plusOnes: number;
  roles: Role[];
  /** Minutes from the party start; undefined = from the guest's roles. */
  arrivalOffsetMin?: number;
  /** Absolute local date-time; wins over everything else. */
  arrivalOverride?: string;
  leaveOffsetMin?: number;
  dietary: Dietary;
  /** Private: never shared. */
  note?: string;
  linkSentAt?: string;
  /** Capability token for this guest's live link (ADR-010), made on first share. */
  token?: string;
}

export type TaskKind = 'bring' | 'do' | 'host';

export type TaskCategory =
  | 'main'
  | 'side'
  | 'salad'
  | 'dessert'
  | 'drinks'
  | 'na-drinks'
  | 'ice'
  | 'bread'
  | 'snacks'
  | 'supplies'
  | 'equipment'
  | 'setup'
  | 'cleanup'
  | 'cook'
  | 'transport'
  | 'music'
  | 'other';

export type TaskStatus = 'open' | 'asked' | 'confirmed' | 'done' | 'declined';
export type TaskWhen = 'before' | 'arrival' | 'during' | 'after' | { at: string };

export interface Task {
  id: string;
  kind: TaskKind;
  title: string;
  category: TaskCategory;
  /** Human text: "for 12", "10 kg", "2 bags". */
  quantity?: string;
  assigneeIds: string[];
  status: TaskStatus;
  when?: TaskWhen;
  dayId?: string;
  mealId?: string;
  /** Labels on a dish: which allergens it is free of and which diets it suits. */
  safeFor?: { allergenFree?: Allergen[]; diets?: Diet[] };
  /** Shown to the assignee. */
  note?: string;
  source?: 'template' | 'calculator' | 'manual';
}

export interface RunItem {
  id: string;
  /** Minutes from the start; negative = before. */
  offsetMin: number;
  title: string;
  whoIds?: string[];
  dayId?: string;
  done?: boolean;
}

export type Bucket = 'w6' | 'w3' | 'w1' | 'd2' | 'day' | 'min5' | 'during' | 'close' | 'after';

export interface ChecklistItem {
  id: string;
  bucket: Bucket;
  text: string;
  done: boolean;
  guideRef?: string;
}

export interface Meal {
  id: string;
  label: string;
  time?: string;
  teamIds: string[];
  menu?: string;
}

export interface PartyDay {
  id: string;
  date: string;
  label?: string;
  meals: Meal[];
}

export interface Party {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  purpose?: string;
  type: PartyType;
  /** Local wall-clock date-time, e.g. "2026-12-12T19:00". */
  start: string;
  end?: string;
  /** IANA time zone, e.g. "America/Toronto". */
  tz: string;
  days?: PartyDay[];
  location: {
    label?: string;
    address?: string;
    mapsUrl?: string;
    parking?: string;
    /** Door code, buzzer, which door: invited guests only, never the open board. */
    access?: string;
  };
  details: {
    food?: FoodStyle;
    dress?: string;
    plusOnes?: YesNoAsk;
    kids?: YesNoAsk;
    capacity?: number;
    alcohol?: boolean;
    /** Shown on every guest link. */
    guestNote?: string;
  };
  host: { name: string; phone?: string; whatsapp?: boolean; count?: number };
  guests: Guest[];
  tasks: Task[];
  runSheet: RunItem[];
  checklist: ChecklistItem[];
  /** Private, host only. */
  notes: string;
  debrief?: { worked?: string; change?: string; clicked?: string; at?: string };
  /** Set once the party is shared live (ADR-010). */
  share?: { partyId: string; publishedAt?: string };
  createdAt: string;
  updatedAt: string;
  lastBackupAt?: string;
}
