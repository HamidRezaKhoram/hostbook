import { describe, expect, it } from 'vitest';
import { hrefFor, parseHash, TABS } from '../../src/app/router';

describe('parseHash', () => {
  it.each(['', '#', '#/', '#//'])('treats %j as the overview', (hash) => {
    expect(parseHash(hash)).toEqual({ name: 'tab', tab: 'overview' });
  });

  it.each(TABS)('round-trips the %s tab through hrefFor', (tab) => {
    expect(parseHash(hrefFor(tab))).toEqual({ name: 'tab', tab });
  });

  it('tolerates a trailing slash and a query string', () => {
    expect(parseHash('#/guests/')).toEqual({ name: 'tab', tab: 'guests' });
    expect(parseHash('#/bring?from=share')).toEqual({ name: 'tab', tab: 'bring' });
  });

  it('falls back to the overview for unknown routes', () => {
    expect(parseHash('#/nope')).toEqual({ name: 'tab', tab: 'overview' });
    expect(parseHash('#/guests/extra')).toEqual({ name: 'tab', tab: 'overview' });
  });
});
