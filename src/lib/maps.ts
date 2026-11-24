// Directions links. Google Maps opens the app on Android and iPhone (or the website); Apple
// Maps opens the Maps app on iPhone. A host-pasted map link always comes first.

export interface MapLink {
  label: string;
  href: string;
}

export function mapLinks(address?: string, custom?: string): MapLink[] {
  const links: MapLink[] = [];
  if (custom?.trim()) links.push({ label: 'Map link', href: custom.trim() });
  const a = address?.trim();
  if (a) {
    const q = encodeURIComponent(a);
    links.push({
      label: 'Google Maps',
      href: `https://www.google.com/maps/search/?api=1&query=${q}`,
    });
    links.push({ label: 'Apple Maps', href: `https://maps.apple.com/?q=${q}` });
  }
  return links;
}
