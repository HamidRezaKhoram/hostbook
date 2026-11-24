import { describe, expect, it } from 'vitest';
import { newShareId, SHARE_ID_PATTERN } from '../../src/lib/ids';

describe('share ids', () => {
  it('are 22 url-safe characters (128 random bits) and never repeat', () => {
    const ids = Array.from({ length: 2000 }, newShareId);
    for (const id of ids) expect(id).toMatch(SHARE_ID_PATTERN);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
