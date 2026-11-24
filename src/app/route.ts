import { signal } from '@preact/signals';
import { parseHash, type Route } from './router';

export const route = signal<Route>(parseHash(location.hash));

/**
 * Every screen change starts at the top. The scroll is reset *before* the new screen renders:
 * resetting afterwards shows one frame of the new screen at the old position, and WebKit can
 * keep a stale scroll range when a long, scrolled screen is swapped for another (both found by
 * the phone tests).
 */
function show(next: Route): void {
  window.scrollTo(0, 0);
  route.value = next;
}

window.addEventListener('hashchange', () => show(parseHash(location.hash)));

export function go(hash: string, replace = false): void {
  if (replace) {
    history.replaceState(null, '', hash);
    show(parseHash(hash));
  } else {
    location.hash = hash;
  }
}
