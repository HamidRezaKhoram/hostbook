import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash, partyHref, TABS, type Route } from '../../src/app/router';

describe('routes', () => {
  it.each(['', '#', '#/', '#//', '#/nope', '#/p', '#/p/', '#/new/x', '#/p/abc/nope', '#/p/a/b/c'])(
    'treats %j as home',
    (hash) => expect(parseHash(hash)).toEqual({ name: 'home' }),
  );

  it('parses the new-party screen', () => {
    expect(parseHash('#/new')).toEqual({ name: 'new' });
    expect(parseHash('#/new/')).toEqual({ name: 'new' });
  });

  it('parses a party, defaulting to its overview', () => {
    expect(parseHash('#/p/abc-123')).toEqual({ name: 'party', id: 'abc-123', tab: 'overview' });
    expect(parseHash('#/p/abc-123/guests?from=x')).toEqual({
      name: 'party',
      id: 'abc-123',
      tab: 'guests',
    });
  });

  const routes: Route[] = [
    { name: 'home' },
    { name: 'new' },
    ...TABS.map((tab) => ({ name: 'party', id: 'id with/slash', tab }) as const),
  ];
  it.each(routes)('round-trips %j', (r) => expect(parseHash(hrefFor(r))).toEqual(r));

  it('keeps overview links short', () => {
    expect(partyHref('abc')).toBe('#/p/abc');
    expect(partyHref('abc', 'bring')).toBe('#/p/abc/bring');
  });
});
