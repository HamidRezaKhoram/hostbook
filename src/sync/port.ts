import type { BoardEntry, GuestView, Reply, ReplyInput, SharePublish } from './types';

export type Unsubscribe = () => void;

/**
 * The only door between the app and the sharing backend (ADR-010). Domain and UI code use this
 * interface, never Firebase directly, so the app still works with sync switched off.
 */
export interface SyncPort {
  /** Anonymous user id of this device (signs in on first use). */
  uid(): Promise<string>;

  // ---- host ----
  /** Create or update the guest-visible projection. Touches only the given guests/slots. */
  publish(partyId: string, data: SharePublish): Promise<void>;
  /** Remove the share and every reply and claim in it. */
  unpublish(partyId: string): Promise<void>;
  /** Host assigns a board slot to someone by name, or clears it with `null`. */
  assign(partyId: string, slotId: string, name: string | null): Promise<void>;
  watchReplies(partyId: string, cb: (replies: Record<string, Reply>) => void): Unsubscribe;

  // ---- guest (and host) ----
  watchBoard(partyId: string, cb: (board: Record<string, BoardEntry>) => void): Unsubscribe;
  /** `null` when the link is wrong or the host removed this guest. */
  loadGuestView(partyId: string, token: string): Promise<GuestView | null>;
  sendReply(partyId: string, token: string, reply: ReplyInput): Promise<void>;
  /** `false` if someone else already has it. */
  claim(partyId: string, slotId: string, name: string): Promise<boolean>;
  release(partyId: string, slotId: string): Promise<void>;
}
