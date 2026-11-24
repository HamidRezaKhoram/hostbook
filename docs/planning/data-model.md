# Data Model

TypeScript is the source of truth once code exists (`src/domain/types.ts`). This doc is the plan. Keep both in sync.

## Conventions
- IDs: `crypto.randomUUID()` for local entities; 128-bit random base64url for shareable party IDs (phase 2).
- Times: store **ISO 8601 local date-time strings plus an IANA time zone** on the party (`"2026-12-12T19:00"`, `tz: "America/Toronto"`). Guest arrival times are stored as **offset minutes from party start** (so moving the party moves everyone), with an optional absolute override.
- Money (phase 3): integer cents plus currency code (default `CAD`).
- Quantities in the calculator are stored in **metric** (g, mL) and formatted Canadian-style at display time (`src/lib/format.ts`, ADR-011).
- Sharing (ADR-010): `Party.share?: { partyId: string; ownerUid: string; publishedAt?: string }` and `Guest.token?: string`. Both are random 128-bit base64url, created on first share.
- Every persisted root has `schemaVersion`. Bump it and add a migration on every shape change.

## Types (draft)

```ts
type PartyType = 'dinner' | 'potluck' | 'cocktail' | 'bbq' | 'game-night'
               | 'open-house' | 'holiday' | 'cottage' | 'custom';

interface Party {
  schemaVersion: 1;
  id: string;
  name: string;                 // "Dumpling Night"
  purpose?: string;             // the one-sentence why
  type: PartyType;
  start: string;                // local ISO, e.g. "2026-12-12T19:00"
  end?: string;                 // strongly nudged
  tz: string;                   // IANA zone
  days?: PartyDay[];            // multi-day (cottage)
  location: {
    label?: string;             // "The cottage"
    address?: string;
    mapsUrl?: string;
    parking?: string;
    access?: string;            // door code, buzzer, which door (guest-visible)
  };
  details: {
    food?: 'full-meal' | 'snacks' | 'potluck' | 'eat-first' | string;
    dress?: string;
    plusOnes?: 'yes' | 'no' | 'ask';
    kids?: 'yes' | 'no' | 'ask';
    capacity?: number;
    alcohol?: boolean;
    guestNote?: string;         // shown on guest links
  };
  host: { name: string; phone?: string; whatsapp?: boolean };
  guests: Guest[];
  tasks: Task[];
  runSheet: RunItem[];
  checklist: ChecklistItem[];   // host prep, bucketed
  notes: string;                // private, host only
  debrief?: { worked?: string; change?: string; clicked?: string; at?: string };
  createdAt: string; updatedAt: string;
  lastBackupAt?: string;
}

type Rsvp = 'invited' | 'yes' | 'maybe' | 'no';
type Role = 'regular' | 'helper' | 'seed' | 'cleanup' | 'driver' | 'cohost' | 'guest-of-honor';

interface Guest {
  id: string;
  name: string;
  phone?: string;
  rsvp: Rsvp;
  attended?: boolean;           // set after the party (builds no-show history)
  plusOnes: number;             // 0..n confirmed extra people
  roles: Role[];
  arrivalOffsetMin?: number;    // relative to party start; undefined = from role default
  arrivalOverride?: string;     // absolute local ISO, wins if set
  leaveOffsetMin?: number;      // e.g. cleanup crew stays +60
  dietary: {
    allergies: Allergen[];
    diets: Diet[];
    religious: Religious[];
    note?: string;
  };
  note?: string;                // private, host only
  linkSentAt?: string;          // last time the share link was sent
}

// Health Canada priority allergens (+ gluten), see ADR-011
type Allergen = 'peanut' | 'tree-nut' | 'sesame' | 'milk' | 'egg' | 'fish'
              | 'shellfish' | 'soy' | 'wheat' | 'gluten' | 'mustard' | 'sulphites' | 'other';
type Diet = 'vegetarian' | 'vegan' | 'pescatarian' | 'gluten-free' | 'dairy-free'
          | 'low-carb' | 'no-alcohol' | 'other';
type Religious = 'halal' | 'kosher' | 'no-pork' | 'no-beef' | 'other';

type TaskKind = 'bring' | 'do' | 'host';
type TaskCategory = 'main' | 'side' | 'salad' | 'dessert' | 'drinks' | 'na-drinks'
                  | 'ice' | 'bread' | 'snacks' | 'supplies' | 'equipment'
                  | 'setup' | 'cleanup' | 'cook' | 'transport' | 'music' | 'other';
type TaskStatus = 'open' | 'asked' | 'confirmed' | 'done' | 'declined';

interface Task {
  id: string;
  kind: TaskKind;
  title: string;                // "Green salad"
  category: TaskCategory;
  quantity?: string;            // "for 12", "10 lb", "2 bags" (free text, human)
  assigneeIds: string[];        // guest ids; host tasks use []
  status: TaskStatus;
  when?: 'before' | 'arrival' | 'during' | 'after' | { at: string };
  dayId?: string;               // multi-day
  mealId?: string;              // multi-day meal team
  safeFor?: { allergenFree?: Allergen[]; diets?: Diet[] }; // labels on dishes
  note?: string;                // shown to the assignee
  source?: 'template' | 'calculator' | 'manual';
}

interface RunItem {
  id: string;
  offsetMin: number;            // from start (negative = before)
  title: string;                // "Setup crew arrives"
  whoIds?: string[];
  dayId?: string;
  done?: boolean;
}

type Bucket = 'w6' | 'w3' | 'w1' | 'd2' | 'day' | 'min5' | 'during' | 'close' | 'after';
interface ChecklistItem { id: string; bucket: Bucket; text: string; done: boolean; guideRef?: string }

interface PartyDay { id: string; date: string; label?: string; meals: Meal[] }
interface Meal { id: string; label: string; time?: string; teamIds: string[]; menu?: string }
```

## Role → default arrival offsets

| Role | Arrival offset | Leave offset |
|---|---|---|
| helper | −75 min | — |
| seed | −20 min | — |
| cohost | −90 min | +60 |
| cleanup | 0 | +45 |
| regular / driver / guest-of-honor | 0 | — |

If a guest has several roles, use the **earliest** arrival. Constants live in `src/domain/constants.ts` and come from `docs/guide/quantities.md` → Time.

## Guest share payload (v1)

Short keys keep the link small. Built only by `buildGuestPayload(party, guestId)`.

```ts
interface GuestPayloadV1 {
  v: 1;
  n: string;          // party name
  s: string;          // start, local ISO
  e?: string;         // end
  z: string;          // tz
  l?: { a?: string; m?: string; p?: string; x?: string }; // address, maps, parking, access
  d?: { f?: string; r?: string; g?: string };             // food, dress, guestNote
  h: { n: string; p?: string; w?: 1 };                    // host name, phone, whatsapp
  g: { n: string; a: string; r?: string[]; lv?: string }; // guest name, arrival, roles, leave
  t: { t: string; q?: string; w?: string; o?: string }[]; // their tasks: title, qty, when, note
  u: string;          // updatedAt
}
```

Tests must assert:
- Output contains no other guest's `name`, `phone`, or `dietary`.
- Output never contains `party.notes` or `guest.note`.
- The encoded URL is under 1,500 chars for a guest with 3 tasks and typical fields.
- `decode(encode(x))` round-trips, and old `v` values still decode.

## Derived values (pure functions)

- `expectedHeadcount(party)` = Σ yes (1 + plusOnes) + 0.5 × Σ maybe (1 + plusOnes), rounded up
- `arrivalTime(party, guest)` → local ISO
- `openTasks(party)`, `gapsByCategory(party)`
- `dietarySummary(party)` → counts and names
- `calc(party, { hours, hot })` → see `docs/guide/quantities.md`
- `nudges(party, now)` → `Nudge[]`
