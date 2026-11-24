// Hash routing (ADR-003): GitHub Pages can't rewrite paths, and the fragment never
// reaches a server. Pure functions here; the signal wiring lives in route.ts.

export const TABS = ['overview', 'guests', 'bring', 'timeline', 'more'] as const;
export type Tab = (typeof TABS)[number];

export type Route = { name: 'tab'; tab: Tab };

const isTab = (s: string): s is Tab => (TABS as readonly string[]).includes(s);

/** '#/guests' → guests tab. Empty or unknown → overview. Tolerates trailing slashes and queries. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0]!.replace(/\/+$/, '');
  return { name: 'tab', tab: isTab(path) ? path : 'overview' };
}

export function hrefFor(tab: Tab): string {
  return tab === 'overview' ? '#/' : `#/${tab}`;
}
