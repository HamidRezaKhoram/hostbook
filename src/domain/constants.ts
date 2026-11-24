// Numbers and labels that come from docs/guide/. Change the guide and these together.
import type { Allergen, Bucket, Diet, PartyType, Religious, Role, TaskCategory } from './types';

/** Arrival and leave offsets per role, in minutes from the start (data-model.md, guide §7). */
export const ROLE_TIMES: Record<Role, { arrive: number; leave?: number }> = {
  regular: { arrive: 0 },
  helper: { arrive: -75 },
  seed: { arrive: -20 },
  cohost: { arrive: -90, leave: 60 },
  cleanup: { arrive: 0, leave: 45 },
  driver: { arrive: 0 },
  'guest-of-honor': { arrive: 0 },
};

export const ROLE_LABELS: Record<Role, string> = {
  regular: 'Guest',
  helper: 'Setup helper',
  seed: 'Early friend',
  cleanup: 'Cleanup crew',
  driver: 'Driver',
  cohost: 'Co-host',
  'guest-of-honor': 'Guest of honour',
};

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  peanut: 'peanut',
  'tree-nut': 'tree nut',
  sesame: 'sesame',
  milk: 'milk',
  egg: 'egg',
  fish: 'fish',
  shellfish: 'shellfish',
  soy: 'soy',
  wheat: 'wheat',
  gluten: 'gluten',
  mustard: 'mustard',
  sulphites: 'sulphite',
  other: 'other',
};

export const DIET_LABELS: Record<Diet, string> = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  pescatarian: 'pescatarian',
  'gluten-free': 'gluten-free',
  'dairy-free': 'dairy-free',
  'low-carb': 'low-carb',
  'no-alcohol': 'no alcohol',
  other: 'other diet',
};

export const RELIGIOUS_LABELS: Record<Religious, string> = {
  halal: 'halal',
  kosher: 'kosher',
  'no-pork': 'no pork',
  'no-beef': 'no beef',
  other: 'other',
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  main: 'Mains',
  side: 'Sides',
  salad: 'Salads',
  dessert: 'Desserts',
  drinks: 'Drinks',
  'na-drinks': 'Non-alcoholic drinks',
  ice: 'Ice',
  bread: 'Bread',
  snacks: 'Snacks',
  supplies: 'Supplies',
  equipment: 'Equipment',
  setup: 'Setup',
  cleanup: 'Cleanup',
  cook: 'Cooking',
  transport: 'Rides',
  music: 'Music',
  other: 'Other',
};

/** Order of categories on the bring board. */
export const CATEGORY_ORDER: TaskCategory[] = [
  'main',
  'side',
  'salad',
  'bread',
  'snacks',
  'dessert',
  'drinks',
  'na-drinks',
  'ice',
  'supplies',
  'equipment',
  'setup',
  'cook',
  'music',
  'transport',
  'cleanup',
  'other',
];

export const BUCKET_LABELS: Record<Bucket, string> = {
  w6: '3–6 weeks before',
  w3: '2–3 weeks before',
  w1: '1 week before',
  d2: '1–2 days before',
  day: 'Day of',
  min5: '5 minutes before',
  during: 'During',
  close: 'Closing',
  after: 'After',
};

export const BUCKET_ORDER: Bucket[] = [
  'w6',
  'w3',
  'w1',
  'd2',
  'day',
  'min5',
  'during',
  'close',
  'after',
];

/** Days before the start when each bucket begins (for "what's next"). */
export const BUCKET_STARTS_DAYS_BEFORE: Record<Bucket, number> = {
  w6: 42,
  w3: 21,
  w1: 7,
  d2: 2,
  day: 0,
  min5: 0,
  during: 0,
  close: 0,
  after: 0,
};

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  dinner: 'Dinner party',
  potluck: 'Potluck',
  cocktail: '2-hour drinks party',
  bbq: 'BBQ',
  'game-night': 'Game night',
  'movie-night': 'Movie night',
  'open-house': 'Open house',
  holiday: 'Holiday party',
  cottage: 'Cottage weekend',
  custom: 'Something else',
};

/** Share of "maybe" replies expected to come (quantities.md → Headcount, [H]). */
export const MAYBE_SHOWS = 0.5;
