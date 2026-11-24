// "How much to buy": every number comes from docs/guide/quantities.md. Change both together.
import { formatRange, formatVolume, formatWeightRange } from '../lib/format';
import { minutesBetween } from '../lib/time';
import { headcount } from './derive';
import type { Party, TaskCategory } from './types';

export type FoodPlan =
  'full-meal' | 'appetizers-before-meal' | 'appetizers-only' | 'heavy-appetizers' | 'none';

export interface CalcInput {
  /** People eating and drinking (expected guests + hosts). */
  people: number;
  hours: number;
  /** 27 °C+ or outdoors in summer: doubles ice and water. */
  hot?: boolean;
  food?: FoodPlan;
  buffet?: boolean;
  alcohol?: boolean;
  /** Everyone gets a seat (dinner) instead of seats for a third (mingling). */
  seated?: boolean;
  iceBagKg?: number;
}

export type CalcUnit =
  | 'drinks'
  | 'bottles'
  | 'cans'
  | 'g'
  | 'mL'
  | 'bags'
  | 'pieces'
  | 'servings'
  | 'kinds'
  | 'items'
  | 'seats';

export interface CalcLine {
  key: string;
  section: 'drinks' | 'ice' | 'food' | 'supplies';
  label: string;
  min: number;
  max: number;
  unit: CalcUnit;
  /** Display text, Canadian units: "16.2–25.2 kg (36–56 lb)", "7 bottles". */
  text: string;
  /** Where the line goes if turned into a task. */
  category: TaskCategory;
  /** [S] sourced, [H] heuristic (quantities.md). */
  tag: 'S' | 'H';
}

const SINGULAR: Record<CalcUnit, string> = {
  drinks: 'drink',
  bottles: 'bottle',
  cans: 'can',
  g: 'g',
  mL: 'mL',
  bags: 'bag',
  pieces: 'piece',
  servings: 'serving',
  kinds: 'kind',
  items: 'item',
  seats: 'seat',
};

export const DEFAULT_ICE_BAG_KG = 4;
const NA_SHARE = 0.25;
const MIX = { wine: 0.45, beer: 0.35, spirits: 0.2 };
const GLASSES_PER_WINE = 5;
const SHOTS_PER_SPIRITS = 17;

const ceil = Math.ceil;

function count(
  key: string,
  section: CalcLine['section'],
  label: string,
  min: number,
  max: number,
  unit: CalcUnit,
  category: TaskCategory,
  tag: 'S' | 'H',
): CalcLine {
  const [lo, hi] = [ceil(min), ceil(max)];
  const word = hi === 1 ? SINGULAR[unit] : unit;
  return {
    key,
    section,
    label,
    min: lo,
    max: hi,
    unit,
    text: `${formatRange(lo, hi)} ${word}`,
    category,
    tag,
  };
}

function grams(
  key: string,
  section: CalcLine['section'],
  label: string,
  min: number,
  max: number,
  category: TaskCategory,
  tag: 'S' | 'H',
): CalcLine {
  const [lo, hi] = [Math.round(min), Math.round(max)];
  return {
    key,
    section,
    label,
    min: lo,
    max: hi,
    unit: 'g',
    text: formatWeightRange(lo, hi),
    category,
    tag,
  };
}

/** 2 drinks in the first hour, 1 per hour after (minimum one hour). */
export const drinksPerPerson = (hours: number) => 2 + Math.max(0, Math.ceil(hours) - 1);

export function calculate(input: CalcInput): CalcLine[] {
  const P = Math.max(0, Math.round(input.people));
  const hot = input.hot ? 2 : 1;
  const alcohol = input.alcohol ?? true;
  const bag = (input.iceBagKg ?? DEFAULT_ICE_BAG_KG) * 1000;
  const food = input.food ?? 'full-meal';
  const lines: CalcLine[] = [];

  // ---- drinks ----
  const total = P * drinksPerPerson(input.hours);
  const na = alcohol ? ceil(total * NA_SHARE) : total;
  const alc = total - na;
  lines.push(count('drinks', 'drinks', 'Drinks in total', total, total, 'drinks', 'drinks', 'S'));
  lines.push(count('na', 'drinks', 'Non-alcoholic drinks', na, na, 'drinks', 'na-drinks', 'H'));
  if (alc > 0) {
    const wine = ceil((alc * MIX.wine) / GLASSES_PER_WINE);
    const beer = ceil(alc * MIX.beer);
    const spirits = ceil((alc * MIX.spirits) / SHOTS_PER_SPIRITS);
    lines.push(count('wine', 'drinks', 'Wine (750 mL)', wine, wine, 'bottles', 'drinks', 'H'));
    lines.push(
      count(
        'beer',
        'drinks',
        'Beer, cider or seltzer (341–355 mL)',
        beer,
        beer,
        'cans',
        'drinks',
        'H',
      ),
    );
    lines.push(
      count('spirits', 'drinks', 'Spirits (750 mL)', spirits, spirits, 'bottles', 'drinks', 'H'),
    );
  }
  const water = 500 * P * hot;
  lines.push({
    key: 'water',
    section: 'drinks',
    label: 'Water',
    min: water,
    max: water,
    unit: 'mL',
    text: formatVolume(water),
    category: 'na-drinks',
    tag: 'H',
  });
  lines.push(
    count(
      'coffee',
      'drinks',
      'Coffee or tea at the end',
      P / 2,
      P / 2,
      'servings',
      'na-drinks',
      'H',
    ),
  );

  // ---- ice ----
  const iceMin = 450 * P * hot + 450 * P;
  const iceMax = 700 * P * hot + 450 * P;
  lines.push(grams('ice', 'ice', 'Ice (drinks + chilling)', iceMin, iceMax, 'ice', 'S'));
  lines.push(
    count(
      'ice-bags',
      'ice',
      `Bags of ice (${bag / 1000} kg)`,
      iceMin / bag,
      iceMax / bag,
      'bags',
      'ice',
      'H',
    ),
  );

  // ---- food ----
  const extra = input.buffet ? [1.1, 1.15] : [1, 1];
  const [lo, hi] = extra as [number, number];
  if (food === 'full-meal') {
    lines.push(grams('food', 'food', 'Food in total', 450 * P * lo, 700 * P * hi, 'main', 'S'));
    lines.push(
      grams('protein', 'food', 'Main protein (as bought)', 225 * P * lo, 280 * P * hi, 'main', 'S'),
    );
    lines.push(count('sides', 'food', 'Side dishes', 2, 3, 'kinds', 'side', 'H'));
    lines.push(
      grams('side-each', 'food', 'Each side dish', 110 * P * lo, 110 * P * hi, 'side', 'H'),
    );
    lines.push(
      count('bread', 'food', 'Bread or rolls', P * lo, 2 * P * hi, 'pieces', 'bread', 'H'),
    );
    lines.push(count('dessert', 'food', 'Dessert', P * lo, P * hi, 'servings', 'dessert', 'H'));
  } else if (food !== 'none') {
    const per = {
      'appetizers-before-meal': [4, 6, 'S'],
      'appetizers-only': [6, 8, 'S'],
      'heavy-appetizers': [12, 15, 'H'],
    } as const;
    const [a, b, tag] = per[food];
    lines.push(
      count(
        'appetizers',
        'food',
        'Appetizer pieces',
        a * P * lo,
        b * P * hi,
        'pieces',
        'snacks',
        tag,
      ),
    );
  }

  // ---- supplies ----
  const meal = food === 'full-meal';
  lines.push(count('cups', 'supplies', 'Cups', 2 * P, 2 * P, 'items', 'supplies', 'H'));
  if (food !== 'none') {
    lines.push(
      count(
        'plates',
        'supplies',
        'Plates',
        1.5 * (meal ? 2 : 1) * P,
        1.5 * (meal ? 2 : 1) * P,
        'items',
        'supplies',
        'H',
      ),
    );
  }
  lines.push(count('napkins', 'supplies', 'Napkins', 3 * P, 3 * P, 'items', 'supplies', 'H'));
  if (meal)
    lines.push(
      count('cutlery', 'supplies', 'Cutlery sets', 1.5 * P, 1.5 * P, 'items', 'supplies', 'H'),
    );
  const bags = Math.max(1, ceil(P / 10));
  lines.push(
    count(
      'trash',
      'supplies',
      'Large trash bags (+ recycling)',
      bags,
      bags,
      'items',
      'supplies',
      'H',
    ),
  );
  const seats = input.seated ? P : ceil(P / 3);
  lines.push(
    count(
      'seats',
      'supplies',
      input.seated ? 'Seats (everyone)' : 'Seats (about a third)',
      seats,
      seats,
      'seats',
      'equipment',
      'H',
    ),
  );

  return lines;
}

/** Hours used for the calculator: the party length, capped at 8 (multi-day: use one day). */
export function partyHours(party: Party): number {
  if (!party.end) return 3;
  return Math.min(8, Math.max(1, minutesBetween(party.start, party.end) / 60));
}

export function calculateForParty(
  party: Party,
  opts: Pick<CalcInput, 'hot' | 'buffet' | 'iceBagKg'> = {},
): CalcLine[] {
  const foodByStyle: Record<string, FoodPlan> = {
    'full-meal': 'full-meal',
    potluck: 'full-meal',
    snacks: 'appetizers-only',
    'eat-first': 'none',
  };
  return calculate({
    people: headcount(party).expected + (party.host.count ?? 1),
    hours: partyHours(party),
    food: foodByStyle[party.details.food ?? 'full-meal'] ?? 'full-meal',
    alcohol: party.details.alcohol ?? true,
    seated: party.type === 'dinner',
    buffet: opts.buffet ?? party.details.food === 'potluck',
    ...opts,
  });
}
