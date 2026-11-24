// Small per-device preferences (localStorage is fine for these; parties live in IndexedDB).
const KEY = 'hostbook.prefs';

interface Prefs {
  hostName?: string;
}

function read(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}

export const getPrefs = read;

export function setPrefs(patch: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    /* private mode: preferences are a nicety */
  }
}
