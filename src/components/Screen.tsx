import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** One tab's page. Moves focus to the heading on open so screen readers announce it. */
export function Screen({ title, children }: { title: string; children: ComponentChildren }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = title === 'Overview' ? 'Hostbook' : `${title} · Hostbook`;
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [title]);
  return (
    <section class="screen" aria-labelledby="screen-title">
      <h1 id="screen-title" class="screen__title" tabIndex={-1} ref={heading}>
        {title}
      </h1>
      {children}
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <div class="card empty">
      <h2 class="empty__title">{title}</h2>
      <div class="empty__body">{children}</div>
    </div>
  );
}
