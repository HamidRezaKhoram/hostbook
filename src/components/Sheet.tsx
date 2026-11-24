import type { ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';

/**
 * A bottom sheet on the native <dialog>: focus trap, Esc and the back gesture come free.
 * Mount it to open; it calls onClose when dismissed (Done, Esc, or a tap on the backdrop).
 */
export function Sheet({
  title,
  onClose,
  children,
  doneLabel = 'Done',
}: {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  doneLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current!;
    if (!d.open) d.showModal();
    return () => {
      if (d.open) d.close();
    };
  }, []);
  const close = () => ref.current?.close();
  return (
    <dialog
      ref={ref}
      class="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div class="sheet__panel">
        <header class="sheet__head">
          <h2 id={titleId} class="sheet__title">
            {title}
          </h2>
          <button type="button" class="btn btn--small" onClick={close}>
            {doneLabel}
          </button>
        </header>
        <div class="sheet__body">{children}</div>
      </div>
    </dialog>
  );
}
