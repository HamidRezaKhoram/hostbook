import { signal } from '@preact/signals';

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
  error?: boolean;
}

export const toast = signal<Toast | null>(null);
let n = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Short message at the bottom. Undo-style actions stay 6 seconds. */
export function showToast(text: string, action?: Toast['action'], error = false): void {
  clearTimeout(timer);
  const t: Toast = { id: ++n, text, ...(action ? { action } : {}), ...(error ? { error } : {}) };
  toast.value = t;
  timer = setTimeout(
    () => {
      if (toast.value?.id === t.id) toast.value = null;
    },
    action ? 6000 : 3500,
  );
}

export function dismissToast(): void {
  toast.value = null;
}
