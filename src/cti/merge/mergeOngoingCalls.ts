/**
 * Domain wrapper for merging an `ongoing_calls` snapshot into the call state map.
 *
 * Delegates to the production implementation in `ctiStompHelpers` during the
 * incremental migration. Callers should import from here, not from the helpers
 * file directly.
 *
 * Pure functions — no React, no side effects.
 */

import {
  mergeOngoingCallsIntoCallStateMap as _mergeOngoing,
  extractCallsByDnFromOngoingCallsPayload as _extractCallsByDn,
} from "../../hooks/ctiStompHelpers";

import type { CtiCallStateMap } from "../types";

/**
 * Merges a `callsByDn` record (from an `ongoing_calls` SSE payload) into the
 * current call state map.  Returns a new map.
 */
export function mergeOngoingCalls(
  prev: CtiCallStateMap,
  callsByDn: Record<string, unknown>,
  onCallRemoved?: (callId: string) => void,
): CtiCallStateMap {
  return _mergeOngoing(
    prev as Record<string, unknown>,
    callsByDn,
    onCallRemoved,
  ) as CtiCallStateMap;
}

/**
 * Normalizes the raw `ongoing_calls` SSE payload into the `callsByDn` shape
 * expected by `mergeOngoingCalls`. Returns `null` when the payload cannot be
 * recognized.
 */
export function extractCallsByDn(
  payload: unknown,
): Record<string, unknown> | null {
  return _extractCallsByDn(payload);
}
