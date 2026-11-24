import { dismissToast, toast } from '../app/toast';

export function ToastHost() {
  const t = toast.value;
  return (
    <div class="toast-host" role="status" aria-live="polite">
      {t && (
        <div class={`toast${t.error ? ' toast--error' : ''}`} key={t.id}>
          <span>{t.text}</span>
          {t.action && (
            <button
              type="button"
              class="btn btn--small btn--on-dark"
              onClick={() => {
                t.action!.run();
                dismissToast();
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
