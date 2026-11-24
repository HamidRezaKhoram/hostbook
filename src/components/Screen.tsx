import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** One page. Moves focus to the heading on open so screen readers announce it. */
export function Screen({
  title,
  docTitle,
  kicker,
  children,
}: {
  title: string;
  /** Browser tab title, if different from the heading. */
  docTitle?: string;
  /** Small line above the heading (e.g. the party name). */
  kicker?: ComponentChildren;
  children: ComponentChildren;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const tabTitle = docTitle ?? title;
  useEffect(() => {
    document.title = tabTitle === 'Hostbook' ? tabTitle : `${tabTitle} · Hostbook`;
    heading.current?.focus({ preventScroll: true });
  }, [tabTitle]);
  return (
    <section class="screen" aria-labelledby="screen-title">
      {kicker && <div class="screen__kicker">{kicker}</div>}
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
