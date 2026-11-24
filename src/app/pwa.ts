import { signal } from '@preact/signals';
import { registerSW } from 'virtual:pwa-register';

/** True when a new version is downloaded and waiting for the host to tap "Refresh". */
export const updateReady = signal(false);
let applyUpdate: (() => Promise<void>) | undefined;

export function startPwa(): void {
  if (!('serviceWorker' in navigator)) return;
  const update = registerSW({
    onNeedRefresh() {
      updateReady.value = true;
    },
  });
  applyUpdate = () => update(true);
  // Ask the browser not to evict our data (ADR-004). Harmless if refused.
  void navigator.storage?.persist?.();
}

export function refreshToNewVersion(): void {
  void applyUpdate?.();
}
