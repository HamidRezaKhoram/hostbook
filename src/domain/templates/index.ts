// Party templates: the guide's playbooks (§15) as starting tasks, run sheet and checklist.
import type { ChecklistItem, Party, PartyType, Task } from '../types';
import { ALCOHOL_CHECKLIST, COMMON_CHECKLIST, type ChecklistSeed } from './checklist';

export type TaskSeed = Omit<Task, 'id' | 'assigneeIds' | 'status' | 'source'>;
/** Minutes from the start, or from the end (`{ fromEnd: -30 }` = 30 min before the end). */
export type At = number | { fromEnd: number };
export interface RunSeed {
  at: At;
  title: string;
}

export interface Template {
  durationMin: number;
  details: Party['details'];
  tasks: TaskSeed[];
  runSheet: RunSeed[];
  checklist: Omit<ChecklistItem, 'id' | 'done'>[];
}

const bring = (title: string, category: Task['category'], quantity?: string): TaskSeed =>
  quantity ? { kind: 'bring', title, category, quantity } : { kind: 'bring', title, category };
const job = (title: string, category: Task['category'], when?: Task['when']): TaskSeed =>
  when ? { kind: 'do', title, category, when } : { kind: 'do', title, category };
const mine = (title: string, category: Task['category']): TaskSeed => ({
  kind: 'host',
  title,
  category,
});

const OPENING: RunSeed[] = [
  { at: -75, title: 'Setup helpers arrive' },
  { at: -20, title: 'Early friends arrive' },
  { at: -5, title: 'Music on, lights set, drinks out' },
  { at: 0, title: 'Guests arrive' },
];
const CLOSING: RunSeed[] = [
  { at: { fromEnd: -30 }, title: 'Last call, music down, coffee and dessert out' },
  { at: { fromEnd: 0 }, title: 'Thank you and goodbyes' },
];
const STOP_ALCOHOL: RunSeed = { at: { fromEnd: -60 }, title: 'Stop serving alcohol' };

const checklist = (alcohol: boolean, extra: ChecklistSeed[] = []) => [
  ...COMMON_CHECKLIST,
  ...(alcohol ? ALCOHOL_CHECKLIST : []),
  ...extra,
];

const CORE_DRINKS = [
  bring('Non-alcoholic drink (something nice)', 'na-drinks'),
  bring('Ice', 'ice'),
];

export const TEMPLATES: Record<PartyType, Template> = {
  dinner: {
    durationMin: 210,
    details: { food: 'full-meal', alcohol: true, plusOnes: 'ask', kids: 'no' },
    tasks: [
      mine('Main dish (make-ahead)', 'main'),
      bring('Wine', 'drinks', '2 bottles'),
      ...CORE_DRINKS,
      bring('Starter or appetizer', 'snacks'),
      bring('Dessert', 'dessert'),
      job('Help clear and wash up', 'cleanup', 'after'),
    ],
    runSheet: [
      ...OPENING.filter((r) => r.at !== -75),
      { at: 45, title: 'Sit down; starter' },
      { at: 75, title: 'Main course' },
      { at: 105, title: 'One question for the whole table' },
      { at: 120, title: 'Dessert' },
      STOP_ALCOHOL,
      ...CLOSING,
    ],
    checklist: checklist(true, [
      {
        bucket: 'w1',
        text: 'Plan the seating: separate couples, connectors in the middle',
        guideRef: '9',
      },
      { bucket: 'w3', text: 'Test any new recipe before the night', guideRef: '15' },
    ]),
  },

  potluck: {
    durationMin: 240,
    details: { food: 'potluck', alcohol: true, plusOnes: 'yes', kids: 'ask' },
    tasks: [
      mine('Main dish or centrepiece', 'main'),
      bring('Second main', 'main', 'for 10'),
      bring('Green salad', 'salad', 'for 10'),
      bring('Pasta or grain salad', 'salad', 'for 10'),
      bring('Hot side dish', 'side', 'for 10'),
      bring('Vegetable side dish', 'side', 'for 10'),
      bring('Bread or rolls', 'bread'),
      bring('Dessert', 'dessert', 'for 12'),
      bring('Second dessert or fruit', 'dessert', 'for 12'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
      bring('Cups, plates and napkins', 'supplies'),
      bring('Serving spoons and tongs', 'equipment'),
      bring('Trash and recycling bags', 'supplies'),
      job('Setup crew', 'setup', 'before'),
      job('Cleanup crew', 'cleanup', 'after'),
    ],
    runSheet: [
      ...OPENING,
      { at: 45, title: 'Food out: everyone eats' },
      { at: 150, title: 'Desserts out' },
      STOP_ALCOHOL,
      ...CLOSING,
    ],
    checklist: checklist(true, [
      { bucket: 'w3', text: 'Ask bringers to label dishes with main ingredients', guideRef: '6' },
      {
        bucket: 'd2',
        text: 'Free up fridge space, an empty oven and an extension cord for slow cookers',
        guideRef: '15',
      },
    ]),
  },

  cocktail: {
    durationMin: 120,
    details: { food: 'snacks', alcohol: true, plusOnes: 'no' },
    tasks: [
      mine('Batch cocktail', 'drinks'),
      mine('Name tags and a marker', 'supplies'),
      bring('Wine', 'drinks', '2 bottles'),
      bring('Beer or cider', 'drinks', '6-pack'),
      ...CORE_DRINKS,
      bring('Finger food', 'snacks', 'for 10'),
      bring('Second finger food', 'snacks', 'for 10'),
    ],
    runSheet: [
      { at: -20, title: 'Early friends arrive' },
      { at: -5, title: 'Music on, lights set, drinks out' },
      { at: 0, title: 'Guests arrive: name tags at the door' },
      { at: 20, title: 'First icebreaker' },
      { at: 75, title: 'Second icebreaker' },
      { at: { fromEnd: -10 }, title: 'Last call' },
      { at: { fromEnd: 0 }, title: 'Thank you and goodbyes (end on time)' },
    ],
    checklist: checklist(true, [
      { bucket: 'w3', text: 'Choose 2–3 easy icebreaker questions', guideRef: '10' },
    ]),
  },

  bbq: {
    durationMin: 240,
    details: { food: 'full-meal', alcohol: true, plusOnes: 'yes', kids: 'yes' },
    tasks: [
      job('Grill master', 'cook', 'during'),
      bring('Burgers or sausages', 'main'),
      bring('Veggie or vegan option for the grill', 'main'),
      bring('Side dish', 'side', 'for 10'),
      bring('Second side dish', 'side', 'for 10'),
      bring('Salad', 'salad', 'for 10'),
      bring('Buns', 'bread'),
      bring('Dessert', 'dessert'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
      bring('Cooler', 'equipment'),
      bring('Lawn games', 'equipment'),
      bring('Sunscreen and bug spray', 'supplies'),
      job('Cleanup crew', 'cleanup', 'after'),
    ],
    runSheet: [
      ...OPENING,
      { at: -45, title: 'Light the grill' },
      { at: 60, title: 'Food on the grill' },
      { at: 150, title: 'Dessert' },
      STOP_ALCOHOL,
      ...CLOSING,
    ],
    checklist: checklist(true, [
      { bucket: 'w1', text: 'Decide the rain plan B', guideRef: '15' },
      {
        bucket: 'day',
        text: 'Shade, sunscreen, bug spray, lots of ice (double when hot)',
        guideRef: '15',
      },
    ]),
  },

  'game-night': {
    durationMin: 210,
    details: { food: 'snacks', alcohol: true, plusOnes: 'ask' },
    tasks: [
      mine('Pick the games and learn the rules', 'equipment'),
      bring('A favourite game', 'equipment'),
      bring('Snacks (not greasy)', 'snacks'),
      bring('Second snack', 'snacks'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
    ],
    runSheet: [
      { at: -5, title: 'Table set, games out, snacks out' },
      { at: 0, title: 'Guests arrive' },
      { at: 20, title: 'Quick warm-up game' },
      { at: 45, title: 'Main game' },
      { at: { fromEnd: -30 }, title: 'One last quick game' },
      { at: { fromEnd: 0 }, title: 'Thank you and goodbyes' },
    ],
    checklist: checklist(true),
  },

  'movie-night': {
    durationMin: 210,
    details: { food: 'snacks', alcohol: true, plusOnes: 'ask' },
    tasks: [
      mine('Shortlist 2–3 films for a vote', 'other'),
      mine('Test the screen, sound, subtitles and streaming login', 'equipment'),
      bring('Popcorn', 'snacks'),
      bring('Candy and sweets', 'dessert'),
      bring('Savoury snacks (quiet ones)', 'snacks'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
      bring('Blankets and pillows', 'equipment'),
      bring('Floor cushions or extra chairs', 'equipment'),
    ],
    runSheet: [
      { at: -30, title: 'Test screen and sound; dim the lights' },
      { at: 0, title: 'Guests arrive: snacks and drinks' },
      { at: 30, title: 'Vote on the film; phones away' },
      { at: 40, title: 'Film starts' },
      { at: 110, title: 'Pause for refills (long films)' },
      { at: { fromEnd: -30 }, title: 'Credits: talk about the film' },
      { at: { fromEnd: 0 }, title: 'Thank you and goodbyes' },
    ],
    checklist: checklist(true, [
      { bucket: 'w1', text: 'Shortlist 2–3 films and check their running times', guideRef: '15' },
      {
        bucket: 'd2',
        text: 'Test streaming login, sound and subtitles; download the film if Wi-Fi is weak',
        guideRef: '15',
      },
      {
        bucket: 'day',
        text: 'A seat with a view for everyone, blankets out, glare off the screen',
        guideRef: '15',
      },
    ]),
  },

  'open-house': {
    durationMin: 240,
    details: { food: 'snacks', alcohol: true, plusOnes: 'yes', kids: 'yes' },
    tasks: [
      mine('Food that holds at room temperature', 'snacks'),
      bring('Finger food', 'snacks'),
      bring('Second finger food', 'snacks'),
      bring('Sweets', 'dessert'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
      job('Door and coats', 'setup', 'during'),
    ],
    runSheet: [
      { at: -5, title: 'Music on, lights set, food and drinks out' },
      { at: 0, title: 'Doors open' },
      { at: 60, title: 'Restock food and ice' },
      { at: 120, title: 'Restock food and ice' },
      { at: 180, title: 'Restock food and ice' },
      STOP_ALCOHOL,
      { at: { fromEnd: 0 }, title: 'Doors close' },
    ],
    checklist: checklist(true, [
      {
        bucket: 'w3',
        text: 'Invite says "come whenever, stay as long as you like"',
        guideRef: '15',
      },
    ]),
  },

  holiday: {
    durationMin: 240,
    details: { food: 'snacks', alcohol: true, plusOnes: 'yes' },
    tasks: [
      mine('Small ritual: toast, cookie exchange or ugly sweaters', 'other'),
      bring('Holiday treats to share', 'dessert'),
      bring('Savoury snacks', 'snacks'),
      bring('Drinks', 'drinks'),
      ...CORE_DRINKS,
      job('Cleanup crew', 'cleanup', 'after'),
    ],
    runSheet: [...OPENING, { at: 90, title: 'Toast or ritual' }, STOP_ALCOHOL, ...CLOSING],
    checklist: checklist(true, [
      { bucket: 'w6', text: 'Send invites 4–6 weeks ahead: December fills fast', guideRef: '5' },
    ]),
  },

  cottage: {
    durationMin: 44 * 60, // Friday 6 p.m. to Sunday 2 p.m.
    details: { food: 'full-meal', alcohol: true, plusOnes: 'ask', kids: 'ask' },
    tasks: [
      job('Friday dinner team: shop, cook, clean', 'cook'),
      job('Saturday breakfast team', 'cook'),
      job('Saturday lunch team', 'cook'),
      job('Saturday dinner team', 'cook'),
      job('Sunday breakfast team', 'cook'),
      bring('Shared staples: coffee, oil, butter, eggs, salt, toilet paper', 'supplies'),
      bring('Drinks for the weekend', 'drinks'),
      ...CORE_DRINKS,
      bring('Games', 'equipment'),
      job('Driver: car 1', 'transport', 'before'),
      job('Driver: car 2', 'transport', 'before'),
      job('Closing duties: fridge, bins, water, locks', 'cleanup', 'after'),
    ],
    runSheet: [
      { at: 0, title: 'Arrive and settle in' },
      { at: 60, title: 'Friday dinner' },
      { at: 15 * 60, title: 'Saturday breakfast' },
      { at: 16 * 60, title: 'The big thing: hike, boat or sauna' },
      { at: 19 * 60, title: 'Saturday lunch' },
      { at: 25 * 60, title: 'Saturday dinner' },
      { at: 39 * 60, title: 'Sunday breakfast' },
      { at: { fromEnd: -120 }, title: 'Closing duties' },
      { at: { fromEnd: 0 }, title: 'Check out' },
    ],
    checklist: checklist(true, [
      { bucket: 'w6', text: 'Invite 6–10 weeks ahead so people can book time off', guideRef: '5' },
      { bucket: 'w3', text: 'Rooms and beds: who sleeps where', guideRef: '15' },
      { bucket: 'w3', text: 'Carpools: drivers, riders, departure times', guideRef: '15' },
      {
        bucket: 'w1',
        text: 'Send the packing list: bedding?, swimsuit, warm layer, rain jacket, bug spray',
        guideRef: '15',
      },
      {
        bucket: 'd2',
        text: 'Check the fire ban and write down the civic (911) address',
        guideRef: '13',
      },
    ]),
  },

  custom: {
    durationMin: 180,
    details: {},
    tasks: [...CORE_DRINKS],
    runSheet: [...OPENING, ...CLOSING],
    checklist: checklist(false),
  },
};
