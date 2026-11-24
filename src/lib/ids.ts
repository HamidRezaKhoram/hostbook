/** 128 random bits as 22 base64url characters. Used for share IDs and guest tokens (ADR-010). */
export function newShareId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const SHARE_ID_PATTERN = /^[A-Za-z0-9_-]{22}$/;
