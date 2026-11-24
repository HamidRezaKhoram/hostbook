import { addMinutes, minutesBetween } from '../lib/time';
import { TEMPLATES } from './templates';
import {
  SCHEMA_VERSION,
  type Guest,
  type Party,
  type PartyType,
  type Rsvp,
  type Task,
  type TaskCategory,
  type TaskKind,
} from './types';

export type IdFn = () => string;
const uuid: IdFn = () => crypto.randomUUID();

export interface NewPartyInput {
  type: PartyType;
  name: string;
  start: string;
  tz: string;
  hostName: string;
  end?: string;
  purpose?: string;
}

/** A party built from its type's template: tasks, run sheet, checklist, default end time. */
export function newParty(input: NewPartyInput, now = new Date(), id: IdFn = uuid): Party {
  const t = TEMPLATES[input.type];
  const stamp = now.toISOString();
  const end = input.end ?? addMinutes(input.start, t.durationMin);
  const durationMin = minutesBetween(input.start, end);
  const at = (offset: number | { fromEnd: number }) =>
    typeof offset === 'number' ? offset : durationMin + offset.fromEnd;
  return {
    schemaVersion: SCHEMA_VERSION,
    id: id(),
    name: input.name.trim(),
    ...(input.purpose ? { purpose: input.purpose.trim() } : {}),
    type: input.type,
    start: input.start,
    end,
    tz: input.tz,
    location: {},
    details: { ...t.details },
    host: { name: input.hostName.trim(), count: 1 },
    guests: [],
    tasks: t.tasks.map((x) => ({
      id: id(),
      assigneeIds: [],
      status: 'open',
      source: 'template',
      ...x,
    })),
    runSheet: t.runSheet
      .map((r) => ({ id: id(), offsetMin: at(r.at), title: r.title }))
      .sort((a, b) => a.offsetMin - b.offsetMin),
    checklist: t.checklist.map((c) => ({ id: id(), done: false, ...c })),
    notes: '',
    createdAt: stamp,
    updatedAt: stamp,
  };
}

export function newGuest(name: string, rsvp: Rsvp = 'invited', id: IdFn = uuid): Guest {
  return {
    id: id(),
    name: name.trim(),
    rsvp,
    plusOnes: 0,
    roles: ['regular'],
    dietary: { allergies: [], diets: [], religious: [] },
  };
}

export function newTask(
  title: string,
  kind: TaskKind = 'bring',
  category: TaskCategory = 'other',
  id: IdFn = uuid,
): Task {
  return {
    id: id(),
    kind,
    title: title.trim(),
    category,
    assigneeIds: [],
    status: 'open',
    source: 'manual',
  };
}

/**
 * Turns a pasted list into names: one per line (or comma-separated on one line), without
 * numbering, bullets, or duplicates. "1. Maya\n- Leo\n• Sam, Jo" → [Maya, Leo, Sam, Jo].
 */
export function parseNameList(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    for (const part of line.split(/[,;]/)) {
      const name = part
        .replace(/^\s*(?:(?:[-*•·–]|\d+[.)]|\[[ x]\])\s*)+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
      const key = name.toLocaleLowerCase('en-CA');
      if (name && !seen.has(key)) {
        seen.add(key);
        names.push(name);
      }
    }
  }
  return names;
}
