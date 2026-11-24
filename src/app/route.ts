import { signal } from '@preact/signals';
import { parseHash, type Route } from './router';

export const route = signal<Route>(parseHash(location.hash));

window.addEventListener('hashchange', () => {
  route.value = parseHash(location.hash);
});
