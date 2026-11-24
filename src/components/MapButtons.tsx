import { mapLinks } from '../lib/maps';

/** "Google Maps" and "Apple Maps" buttons (plus the host's own map link) for an address. */
export function MapButtons({ address, custom }: { address?: string; custom?: string }) {
  const links = mapLinks(address, custom);
  if (!links.length) return null;
  return (
    <div class="map-buttons">
      {links.map((l) => (
        <a
          key={l.label}
          class="btn btn--ghost btn--small"
          href={l.href}
          target="_blank"
          rel="noopener"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
