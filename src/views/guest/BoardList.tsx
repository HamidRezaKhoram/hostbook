import type { BoardEntry } from '../../sync/types';

/** The bring board: open items to claim, your items to undo, everyone else's as taken. */
export function BoardList({
  board,
  myUid,
  busy,
  onClaim,
  onRelease,
}: {
  board: Record<string, BoardEntry>;
  myUid: string | null;
  busy: string | null;
  onClaim: (slotId: string) => void;
  onRelease: (slotId: string) => void;
}) {
  const entries = Object.entries(board).sort(
    ([, a], [, b]) =>
      (a.slot.category ?? '').localeCompare(b.slot.category ?? '') ||
      a.slot.title.localeCompare(b.slot.title),
  );
  const open = entries.filter(([, e]) => !e.claim).length;
  if (!entries.length) return null;
  return (
    <section class="stack-sm" aria-labelledby="bring-board">
      <h2 id="bring-board" class="section-title">
        What to bring <span class="muted">{open ? `${open} still needed` : 'all covered'}</span>
      </h2>
      <ul class="plain-list rows card">
        {entries.map(([id, e]) => {
          const mine = !!myUid && e.claim?.uid === myUid;
          return (
            <li key={id} class="row row--check">
              <span class="row__main">
                <span class="row__title">
                  {e.slot.title}
                  {e.slot.qty && <span class="muted"> · {e.slot.qty}</span>}
                </span>
                <span class="row__sub">
                  {mine
                    ? "You're bringing this"
                    : e.claim
                      ? `${e.claim.name} is bringing this`
                      : e.slot.category}
                </span>
              </span>
              {mine ? (
                <button
                  type="button"
                  class="btn btn--ghost btn--small"
                  disabled={busy === id}
                  onClick={() => onRelease(id)}
                >
                  Undo
                </button>
              ) : (
                !e.claim && (
                  <button
                    type="button"
                    class="btn btn--small"
                    disabled={busy === id}
                    onClick={() => onClaim(id)}
                    aria-label={`I'll bring ${e.slot.title}`}
                  >
                    I'll bring it
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
