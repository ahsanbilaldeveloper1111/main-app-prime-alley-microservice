/**
 * Stale-event detection for the CTI call state map.
 *
 * An event is "stale" when it arrives out of order — either its `eventTime`
 * is older than what is already stored, or the same timestamp but a lower
 * sequence number.
 *
 * Pure functions — no React, no side effects.
 */

import type { CtiCallEvent } from "../types";

/**
 * Returns true when the incoming event should be silently discarded because
 * the stored call state is already newer.
 */
export function isStaleEvent(
  incoming: Pick<CtiCallEvent, "eventTime" | "sequence">,
  stored: Partial<Pick<CtiCallEvent, "eventTime" | "sequence">>,
): boolean {
  const incomingMs = toEventTimeMs(incoming.eventTime);
  const storedMs = toEventTimeMs(stored.eventTime);

  if (incomingMs < storedMs) {
    return true;
  }

  if (incomingMs === storedMs && storedMs > 0) {
    const incomingSeq = incoming.sequence ?? 0;
    const storedSeq = stored.sequence ?? 0;
    return incomingSeq <= storedSeq;
  }

  return false;
}

/** Parse an ISO event timestamp to epoch ms; returns 0 on failure. */
export function toEventTimeMs(eventTime: string | undefined): number {
  if (!eventTime) return 0;
  const ms = new Date(eventTime).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
