import { describe, expect, it } from 'vitest';
import { mapLinks } from '../../src/lib/maps';

describe('map links', () => {
  it('gives Google and Apple Maps for an address', () => {
    expect(mapLinks('12 Birch Rd, Huntsville, ON')).toEqual([
      {
        label: 'Google Maps',
        href: 'https://www.google.com/maps/search/?api=1&query=12%20Birch%20Rd%2C%20Huntsville%2C%20ON',
      },
      {
        label: 'Apple Maps',
        href: 'https://maps.apple.com/?q=12%20Birch%20Rd%2C%20Huntsville%2C%20ON',
      },
    ]);
  });

  it("puts the host's own map link first, and gives nothing without an address", () => {
    expect(mapLinks(' 12 Birch Rd ', ' https://maps.app.goo.gl/x ').map((l) => l.label)).toEqual([
      'Map link',
      'Google Maps',
      'Apple Maps',
    ]);
    expect(mapLinks(undefined, 'https://maps.app.goo.gl/x')).toEqual([
      { label: 'Map link', href: 'https://maps.app.goo.gl/x' },
    ]);
    expect(mapLinks('  ')).toEqual([]);
    expect(mapLinks()).toEqual([]);
  });
});
