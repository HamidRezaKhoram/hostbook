// Hash routing (ADR-003): GitHub Pages can't rewrite paths, and the fragment never reaches a
// server. Pure functions here; the signal wiring lives in route.ts.
//   #/                 your parties
//   #/new              start a party
//   #/p/{id}[/{tab}]   one party: overview, guests, bring, timeline, more

export const TABS = ['overview', 'guests', 'bring', 'timeline', 'more'] as const;
export type Tab = (typeof TABS)[number];

export type Route = { name: 'home' } | { name: 'new' } | { name: 'party'; id: string; tab: Tab };

const isTab = (s: string): s is Tab => (TABS as readonly string[]).includes(s);

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split('?')[0]!.replace(/\/+$/, '');
  const parts = path.split('/').map((p) => decodeURIComponent(p));
  if (parts[0] === 'new' && parts.length === 1) return { name: 'new' };
  if (parts[0] === 'p' && parts[1] && parts.length <= 3) {
    const tab = parts[2] ?? 'overview';
    if (isTab(tab)) return { name: 'party', id: parts[1], tab };
  }
  return { name: 'home' };
}

export function hrefFor(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'new':
      return '#/new';
    case 'party':
      return `#/p/${encodeURIComponent(route.id)}${route.tab === 'overview' ? '' : `/${route.tab}`}`;
  }
}

export const partyHref = (id: string, tab: Tab = 'overview') => hrefFor({ name: 'party', id, tab });
