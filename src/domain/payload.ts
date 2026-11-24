// Offline fallback links (ADR-005): a guest's view packed into the URL fragment, for when live
// sharing is off. The fragment never reaches a server. Short keys keep links SMS-sized.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { GuestShare, ShareInfo } from '../sync/types';

interface PayloadV1 {
  v: 1;
  i: ShareInfo;
  g: GuestShare;
  u: string;
}

export interface GuestPayload {
  info: ShareInfo;
  guest: GuestShare;
  updatedAt: string;
}

export function encodeGuestPayload(p: GuestPayload): string {
  const body: PayloadV1 = { v: 1, i: p.info, g: p.guest, u: p.updatedAt };
  return compressToEncodedURIComponent(JSON.stringify(body));
}

/** `null` for anything that isn't a payload we understand (bad copy-paste, future version). */
export function decodeGuestPayload(encoded: string): GuestPayload | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const body = JSON.parse(json) as Partial<PayloadV1>;
    if (body.v !== 1 || !body.i?.name || !body.g?.name || typeof body.u !== 'string') return null;
    return { info: body.i, guest: body.g, updatedAt: body.u };
  } catch {
    return null;
  }
}

/** Route for offline links: `#/i/<payload>` (live links are `#/g/<partyId>/<token>`). */
export function guestPayloadLink(appUrl: string, p: GuestPayload): string {
  return `${appUrl.replace(/#.*$/, '')}#/i/${encodeGuestPayload(p)}`;
}
