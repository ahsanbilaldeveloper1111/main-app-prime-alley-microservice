/**
 * Thin domain wrapper around the production merge implementation.
 *
 * Strategy (incremental migration):
 *  1. These functions delegate to `ctiStompHelpers` today — no behavior change.
 *  2. As tests are added against fixtures, the implementation can be moved here
 *     and the helpers file can be slimmed down.
 *  3. All callers of `applyCallEventToCallStateMap` should import from here,
 *     not from `ctiStompHelpers` directly.
 *
 * Pure functions — no React, no side effects except storage save callback.
 */

import { applyCallEventToCallStateMap as _applyCallEvent } from "../../hooks/ctiStompHelpers";

import type { CtiCallEvent, CtiCallStateMap, CtiDnsMap } from "../types";

/**
 * Applies one incoming CTI call event to the immutable call state map.
 *
 * Returns a new map (never mutates `prev`). If the event is stale or the call
 * terminates, the callId is removed from the returned map.
 *
 * @param prev      Current call state map
 * @param callId    The call id from the event
 * @param evt       The incoming event
 * @param dnsMap    Current device/DN map (for device-type enrichment)
 * @param saveToStorage  Side-effect callback for localStorage persistence
 * @param onCallsRemoved Optional callback when call ids are pruned
 */
export function applyCallEvent(
  prev: CtiCallStateMap,
  callId: string,
  evt: CtiCallEvent,
  dnsMap: CtiDnsMap,
  saveToStorage: (map: CtiCallStateMap) => void,
  onCallsRemoved?: (ids: readonly string[]) => void,
): CtiCallStateMap {
  return _applyCallEvent(
    prev as Record<string, unknown>,
    callId,
    evt,
    dnsMap,
    saveToStorage,
    onCallsRemoved,
  ) as CtiCallStateMap;
}
