import { describe, expect, it } from 'vitest';
import { newParty, newTask, parseNameList } from '../../src/domain/factories';
import { NOW, seq } from './helpers';

describe('parseNameList', () => {
  it('turns a pasted list into clean, unique names', () => {
    const text = '1. Maya\n2) Leo\n- Sam\n• Jo, Ana; Priya\n* [x] Kim\n\n   maya  \nMary  Ann';
    expect(parseNameList(text)).toEqual([
      'Maya',
      'Leo',
      'Sam',
      'Jo',
      'Ana',
      'Priya',
      'Kim',
      'Mary Ann',
    ]);
  });

  it('handles Windows line endings and empty input', () => {
    expect(parseNameList('Maya\r\nLeo\r\n')).toEqual(['Maya', 'Leo']);
    expect(parseNameList('  \n ,, \n')).toEqual([]);
  });
});

describe('newParty', () => {
  it('builds a party from its template with an end time and run sheet', () => {
    const p = newParty(
      {
        type: 'dinner',
        name: ' Dumpling Night ',
        start: '2026-12-12T19:00',
        tz: 'America/Toronto',
        hostName: 'Hamid',
      },
      NOW,
      seq(),
    );
    expect(p).toMatchObject({
      schemaVersion: 1,
      id: 'id-1',
      name: 'Dumpling Night',
      end: '2026-12-12T22:30',
      host: { name: 'Hamid', count: 1 },
      createdAt: NOW.toISOString(),
      details: { food: 'full-meal' },
    });
    expect(p.purpose).toBeUndefined();
    expect(
      p.tasks.every(
        (t) => t.status === 'open' && t.assigneeIds.length === 0 && t.source === 'template',
      ),
    ).toBe(true);
    const offsets = p.runSheet.map((r) => r.offsetMin);
    expect(offsets).toEqual([...offsets].sort((a, b) => a - b));
    expect(p.runSheet.at(-1)).toMatchObject({ offsetMin: 210, title: 'Thank you and goodbyes' });
    expect(p.checklist.every((c) => !c.done)).toBe(true);
  });

  it('respects a custom end: run-sheet items "from the end" move with it', () => {
    const p = newParty(
      {
        type: 'cocktail',
        name: 'Drinks',
        start: '2026-12-02T19:00',
        end: '2026-12-02T21:30',
        tz: 'America/Toronto',
        hostName: 'H',
        purpose: ' Meet the new team ',
      },
      NOW,
      seq(),
    );
    expect(p.purpose).toBe('Meet the new team');
    expect(p.runSheet.find((r) => r.title === 'Last call')!.offsetMin).toBe(140);
  });

  it('makes manual tasks', () => {
    expect(newTask(' Chairs ', 'do', 'equipment', seq())).toEqual({
      id: 'id-1',
      kind: 'do',
      title: 'Chairs',
      category: 'equipment',
      assigneeIds: [],
      status: 'open',
      source: 'manual',
    });
    expect(newTask('Thing').category).toBe('other');
  });
});
