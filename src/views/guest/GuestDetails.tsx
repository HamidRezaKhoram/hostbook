// What a guest sees about the party: shared by the live link, the offline link and the board.
import { MapButtons } from '../../components/MapButtons';
import { makeIcs } from '../../domain/ics';
import { downloadText } from '../../lib/download';
import { formatTime, formatWhen } from '../../lib/format';
import type { GuestShare, ShareInfo } from '../../sync/types';

export function PartyFacts({
  info,
  guest,
  url,
}: {
  info: ShareInfo;
  guest?: GuestShare;
  url: string;
}) {
  const custom = guest && guest.arrival !== info.start;
  return (
    <>
      <div class="lede-block">
        <p class="when">{formatWhen(info.start, info.end)}</p>
        {custom && (
          <p class="banner banner--warn">
            You: please arrive at {formatTime(guest.arrival)}
            {guest.roles?.length ? ` (${guest.roles.join(', ').toLowerCase()})` : ''}
            {guest.leave ? `, and stay until ${formatTime(guest.leave)}` : ''}
          </p>
        )}
      </div>

      {guest?.tasks && guest.tasks.length > 0 && (
        <section class="card" aria-labelledby="your-part">
          <h2 id="your-part" class="card__title">
            Your part
          </h2>
          <ul class="plain-list stack-sm">
            {guest.tasks.map((t, i) => (
              <li key={i}>
                <strong>{t.title}</strong>
                {t.qty && <span class="muted"> · {t.qty}</span>}
                {t.when && <span class="muted"> · {t.when}</span>}
                {t.note && <div class="muted">{t.note}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(info.place || guest?.access) && (
        <section class="card" aria-labelledby="where">
          <h2 id="where" class="card__title">
            Where
          </h2>
          {info.place?.label && <p>{info.place.label}</p>}
          {info.place?.address && <p>{info.place.address}</p>}
          <MapButtons address={info.place?.address} custom={info.place?.mapsUrl} />
          {info.place?.parking && (
            <p>
              <strong>Parking:</strong> {info.place.parking}
            </p>
          )}
          {guest?.access && (
            <p>
              <strong>Getting in:</strong> {guest.access}
            </p>
          )}
        </section>
      )}

      {(info.food || info.dress || info.note) && (
        <section class="card" aria-labelledby="good-to-know">
          <h2 id="good-to-know" class="card__title">
            Good to know
          </h2>
          {info.food && <p>{info.food}</p>}
          {info.dress && <p>Wear: {info.dress}</p>}
          {info.note && <p>{info.note}</p>}
        </section>
      )}

      <button
        type="button"
        class="btn btn--ghost btn--block"
        onClick={() =>
          downloadText(
            `${info.name.replace(/[^\w -]/g, '').trim() || 'party'}.ics`,
            makeIcs(info, guest ?? null, url, `${info.start}-${guest?.name ?? 'guest'}`),
            'text/calendar',
          )
        }
      >
        Add to calendar
      </button>
    </>
  );
}

export function GuestFooter() {
  return (
    <p class="fine">
      Made with <a href="#/">Hostbook</a>, a free party planner.
    </p>
  );
}
