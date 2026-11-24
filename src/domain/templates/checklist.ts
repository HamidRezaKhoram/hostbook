// The host prep checklist from docs/guide/checklists.md. `ref` points at the guide section.
import type { Bucket } from '../types';

export interface ChecklistSeed {
  bucket: Bucket;
  text: string;
  guideRef?: string;
}

const c = (bucket: Bucket, text: string, guideRef?: string): ChecklistSeed =>
  guideRef ? { bucket, text, guideRef } : { bucket, text };

export const COMMON_CHECKLIST: ChecklistSeed[] = [
  c('w6', 'Write the purpose sentence and give the party a name', '1'),
  c('w6', 'Check the date with the 1–2 anchor guests', '4'),
  c('w6', 'Draft the guest list: anchors, connectors, a good mix', '3'),
  c('w6', 'Decide plus-ones and kids', '3'),
  c('w6', 'Rough budget'),
  c(
    'w3',
    'Send invites: what, why, start and end, where, who, what to bring, food, dress, reply-by, dietary question',
    '5',
  ),
  c('w3', 'Plan the menu with at most one last-minute dish', '8'),
  c('w3', 'List what guests bring, with specific slots incl. ice, cups, utensils', '6'),
  c('w3', 'Ask helpers: setup, door, bar, cleanup, driver', '6'),
  c('w3', 'Book or borrow chairs, tables, cooler, glasses, speaker'),
  c('w1', 'Chase replies and get the expected headcount', '3'),
  c('w1', 'Collect dietary needs; check every guest has a real option', '8'),
  c('w1', 'Reminder 1: what each person brings and when to arrive', '5'),
  c('w1', 'Fill the gaps in the bring list yourself', '6'),
  c('w1', 'Shopping list: non-perishables and drinks now'),
  c('w1', 'Make the playlist (twice the party length)', '9'),
  c('w1', 'Heads-up note to neighbours if it will be loud or parking is tight', '9'),
  c('d2', 'Perishable shopping and the ice plan'),
  c('d2', 'Cook the make-ahead dishes', '8'),
  c('d2', 'Clean: entry, bathroom, main room, kitchen'),
  c('d2', "Clear fridge space and a counter for guests' dishes"),
  c('d2', 'Reminder 2: time, address, parking, door code, weather, what to wear', '5'),
  c('d2', 'Charge the speaker and test the music'),
  c('day', 'Furniture into small conversation groups; food and drinks on opposite sides', '9'),
  c('day', 'Coat spot, shoe spot, trash and recycling bins visible', '9'),
  c('day', 'Bathroom: toilet paper, hand towel, soap, plunger, light on', '9'),
  c('day', 'Lamps on, overhead lights off, candles ready', '9'),
  c('day', 'Drink station: ice, opener, non-alcoholic option, water', '8'),
  c('day', 'Containers for leftovers', '12'),
  c('day', 'Get yourself ready before the helpers arrive', '10'),
  c('min5', 'Music on, lights set, candles lit', '10'),
  c('min5', 'One snack out, drinks out with ice', '10'),
  c('min5', 'Drink in hand. Breathe.', '10'),
  c('during', 'Greet at the door, drink within 2 minutes, introduce with a hook', '10'),
  c('during', 'Scan the room every 15–20 minutes', '11'),
  c('during', 'Welcome or toast once most people are there', '10'),
  c('during', 'Restock food, drinks, ice and toilet paper', '11'),
  c('close', 'Last call, music softer, lights up a little', '12'),
  c('close', 'Thank-you moment', '12'),
  c('close', 'Leftovers to go; check everyone has a safe ride', '13'),
  c('close', 'Food into the fridge, candles out, doors locked', '14'),
  c('after', 'Thank-you message, with special thanks to helpers and bringers', '14'),
  c('after', 'Share photos (with permission)', '14'),
  c('after', 'Return dishes left behind', '14'),
  c('after', 'Debrief: what worked, what to change, who clicked', '14'),
];

export const ALCOHOL_CHECKLIST: ChecklistSeed[] = [
  c('during', 'Stop serving alcohol at least an hour before the end', '13'),
  c('w1', 'Ask guests how they are getting home', '13'),
];
