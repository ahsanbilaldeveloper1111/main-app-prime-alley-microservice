# CTI Module — Architecture & Contract

This document is the authoritative reference for the CTI (telephony) module. Read it before touching any file under `src/hooks/ctiStomp*`, `src/contexts/CtiContext.tsx`, `src/cti/`, `src/utils/dialer.ts`, or the wallboard/live-calls stack.

---

## Architecture Overview

```
CTI Backend (Cisco/Finesse)
        │
        │  SSE stream (EventSource)        STOMP (WebSocket)
        ▼                                          ▼
┌─────────────────────────────────────────────────────────┐
│  Transport Layer  (master tab only)                      │
│  ctiStompPrimaryAuthEffect.ts                            │
│  ctiStompDeferredMasterEffect.ts                         │
│  ctiStompSsePrimaryDispatch.ts                           │
└────────────────────────┬────────────────────────────────┘
                         │ SSE message types:
                         │  complete_state | dns_states | call_events
                         │  ongoing_calls  | stomp_connected | ping
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Merge Layer  (pure functions — no React)                │
│  src/cti/merge/applyCallEvent.ts                         │
│  src/cti/merge/mergeOngoingCalls.ts                      │
│  src/cti/merge/staleEvent.ts                             │
│  (delegates to ctiStompHelpers.ts during migration)      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Domain State  (React Context + useState)                │
│  callStateMap: Record<callId, CtiCallEvent>             │
│  dnsMap:       Record<dn, { dn, devices }>              │
│  useCtiStomp.ts  →  CtiContext.tsx  →  useCti()         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Selectors  (pure — no React in core)                    │
│  src/cti/selectors/activeCalls.ts                        │
│  src/cti/selectors/dnStatus.ts                           │
│  src/cti/selectors/monitoring.ts                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  TanStack Query — REST / Commands                        │
│  src/cti/mutations/  (useCtiDialMutation, etc.)          │
│  src/query/keys.ts   (ctiKeys)                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  UI Consumers                                            │
│  GlobalFloatingCallBar  |  WallboardsLiveView           │
│  CRM (dialNumber)       |  Dialer page                  │
│  LayoutTopBar           |  tickets-detailpage            │
└─────────────────────────────────────────────────────────┘
```

---

## Cross-Tab Sharing

- **Only one tab** maintains the WebSocket + SSE connection (the "master").
- Master is elected via `localStorage.cti_master_tab_id` + 2s heartbeat; failover after 5s silence.
- Master broadcasts SSE events + state updates to all tabs via **BroadcastChannel** (`cti-broadcast-channel`).
- Non-master tabs receive events via `ctiStompCrossTabIntegration.ts` and update their local React state identically to the master.

See `src/utils/CROSS_TAB_CTI_README.md` for implementation details.

---

## SSE Message Types (server → client)

| `type` | Description | Handler |
|--------|-------------|---------|
| `complete_state` | Full device snapshot on connect | `handleCompleteState` → groups all devices into `dnsMap` |
| `dns_states` | Per-device status delta | `handleDnsStates` → patches single DN entry in `dnsMap` |
| `call_events` | Live call lifecycle event | `handleCallEvents` → `applyCallEventToCallStateMap` |
| `ongoing_calls` | Active calls snapshot (reconcile) | `handleOngoingCalls` → `mergeOngoingCalls` |
| `stomp_connected` | STOMP connection ready | Requests `initial-state` + `ongoing-calls` via STOMP |
| `stomp_error` | STOMP protocol error | Sets error state, marks uninitialized |
| `connection` | SSE lifecycle (reconnecting, disconnected) | Drives reconnect loop |
| `ping` | Server keep-alive (~4s interval) | `CtiStreamMissedEventRecovery.markPingReceived` |
| `error` | Server-side error payload | Sets error message |

---

## Call Event Types (`eventType` field)

| eventType | Meaning | UI effect |
|-----------|---------|-----------|
| `RINGING` | New call leg is ringing | New call entry; incoming notification if calledAddress = user |
| `CONNECTED` | Both legs answered | Status → connected |
| `ANSWERED` | Alias for CONNECTED | Status → connected |
| `RETRIEVED` | Held call resumed | Status → connected |
| `HELD` / `ON_HOLD` | Call put on hold | Status → onHold |
| `DROPPED` | One leg disconnected | Party removed; call removed if all terminal |
| `DISCONNECTED` | Full call ended | Call removed from map |
| `ENDED` | Explicit call end | Call removed from map |
| `MONITORING_ENDED` | Supervision session ended (silent / whisper / barge) | `isMonitoring` → false; stale supervision rows pruned; wallboard Live Coaching clears |

---

## Call State Lifecycle

```
(new) RINGING ──► CONNECTED / ANSWERED ──► HELD ──► RETRIEVED ──► CONNECTED
                           │                                             │
                           └──────────────── DROPPED / DISCONNECTED ◄──┘
                                                      │
                                              (removed from map)
```

**Key invariants:**
1. A call is removed from `callStateMap` only when **all parties** are terminal (`DROPPED`/`DISCONNECTED`/`ENDED`), or when `isTerminating: true`.
2. Stale events (older `eventTime` or same `eventTime` + lower `sequence`) are ignored.
3. A callId cannot be re-added within 4 seconds of being removed (rebirth guard).
4. `ongoing_calls` snapshot merges into `callStateMap` without replacing events that are newer.

---

## HELD event — who can resume

`HELD` events include explicit holder metadata (preferred over client-side inference):

| Field | Level | Notes |
|-------|-------|-------|
| `heldByAddress` | Event | DN of the user who put the call on hold — only they should see Resume |
| `heldByDeviceName` | Event | Device that initiated hold |
| `holdSegments[]` | Party | History of hold intervals; **active** segment has `endTime: null` |

Example:

```json
{
  "eventType": "HELD",
  "heldByAddress": "538",
  "heldByDeviceName": "CSFDANIYAL",
  "parties": [{
    "callStatus": "ON_HOLD",
    "holdSegments": [{
      "startTime": "...",
      "endTime": null,
      "heldByAddress": "538",
      "heldByDeviceName": "CSFDANIYAL"
    }]
  }]
}
```

Resolution order in the client: event `heldByAddress` → active `holdSegments[].heldByAddress` → legacy inference (dnsMap / GlobalCalling).

---

## Party Fields

Each party leg inside `parties[]`:

| Field | Type | Notes |
|-------|------|-------|
| `callingAddress` | string | DN / extension of caller |
| `calledAddress` | string | DN / extension of callee |
| `callStatus` | string | `RINGING`, `CONNECTED`, `ON_HOLD`, `HELD`, `DROPPED`, `DISCONNECTED` |
| `callId` | string | Matches parent event callId |
| `startTime` | string (ISO) | Leg answer time; preserved across events (earliest wins) |
| `callingDeviceName` | string | Device identifier |
| `callingDeviceType` | string | `IP_PHONE`, `MOBILE`, `SOFT_HARD`, etc. |
| `holdSegments` | array | On HELD: active segment (`endTime` null) identifies holder |

---

## Monitoring / Supervision Fields

When `isMonitoring: true` on a call event, a `monitoring` object is present:

```ts
{
  monitoringType: "SILENT" | "WHISPER" | "BARGE_IN" | "BARGE-IN",
  monitorDn: string,      // supervisor DN
  monitoredDn: string,    // agent DN
  callId?: string,
}
```

Monitoring state is **carried on every subsequent event** for that callId — wallboard relies on the last seen `monitoring` field, not an independent subscription.

---

## REST Commands (TanStack Query Mutations)

All CTI commands go through `src/cti/mutations/`. Never import `src/utils/dialer.ts` directly from UI components.

| Hook | Endpoint | Notes |
|------|----------|-------|
| `useCtiDialMutation` | `POST /cti/dialCall` | Registers pending outbound; SSE confirms |
| `useCtiEndCallMutation` | `POST /cti/endCall` | SSE `DROPPED`/`DISCONNECTED` removes call |
| `useCtiAttendCallMutation` | `POST /cti/answerCall` | Incoming ring → answered |
| `useCtiHoldCallMutation` | `POST /cti/holdCall` | SSE `HELD` confirms |
| `useCtiResumeCallMutation` | `POST /cti/resumeCall` | SSE `RETRIEVED` confirms |
| `useCtiRemoveCallMutation` | `POST /cti/removeCall` | Force remove a leg |
| `useCtiMergeCallsMutation` | `POST /cti/mergeCall` | Conference two legs |
| `useCtiTransferCallMutation` | `POST /cti/transferCall` | Blind / attended transfer |
| `useCtiStartMonitoringMutation` | `POST /cti/startMonitoring` | Supervisor starts silent/whisper |
| `useCtiStopMonitoringMutation` | `POST /cti/stopMonitoring` | Supervisor stops monitoring |
| `useCtiStartBargeInMutation` | `POST /cti/startBargeIn` | Supervisor barges in |
| `useCtiStopBargeInMutation` | `POST /cti/stopBargeIn` | Stops barge-in |

**Rule:** Mutations initiate commands. They do **not** update `callStateMap` directly. The SSE stream is the single authority for live call state.

---

## Reload / Gap Recovery

On **page load** with persisted calls in `localStorage`:
1. `loadPersistedCallStateMap` restores non-terminal calls into `callStateMap`.
2. `GetCallLegs` REST call verifies which persisted calls are still active; stale entries are pruned.
3. SSE `ongoing_calls` snapshot (triggered by STOMP connect) provides authoritative state.

On **SSE stream gap** (missed ping, sequence jump):
1. `CtiStreamMissedEventRecovery` detects the gap.
2. Soft recovery: STOMP publishes `/app/request/initial-state` + `/app/request/ongoing-calls`.
3. If unresolved: full SSE reconnect.

---

## Scenarios (for fixtures and testing)

1. **Outbound dial** — user dials → `RINGING` → `CONNECTED` → `DROPPED`
2. **Inbound ring** — `RINGING` on user DN → `CONNECTED` (answered) → `DISCONNECTED`
3. **Hold / resume** — `CONNECTED` → `HELD` → `RETRIEVED` → `CONNECTED`
4. **Attended transfer** — `CONNECTED` → consult `RINGING` → `CONNECTED` (consult) → `DROPPED` (original)
5. **Blind transfer** — `CONNECTED` → `DROPPED` immediately after transfer command
6. **Conference / merge** — two legs → merge → `isConference: true`
7. **Silent monitoring** — supervisor `RINGING` on monitoring leg → `CONNECTED` with `isMonitoring: true`
8. **Barge-in** — monitoring → barge → `BARGE_IN` type, three-way audio
9. **Page reload mid-call** — localStorage restore → `GetCallLegs` verify → `ongoing_calls` merge
10. **Master tab close** — follower tab takes over; single SSE connection resumes
11. **Second tab open** — receives `complete_state` + current `callStateMap` via BroadcastChannel
12. **SSE gap (missed ping)** — soft recovery publishes initial-state; state reconciles without full reconnect

---

## Source File Map

| Purpose | File |
|---------|------|
| SSE/STOMP transport (auth, connect) | `hooks/ctiStompPrimaryAuthEffect.ts` |
| SSE dispatcher | `hooks/ctiStompSsePrimaryDispatch.ts` |
| Deferred master effect | `hooks/ctiStompDeferredMasterEffect.ts` |
| Call merge + state machine | `hooks/ctiStompHelpers.ts` → migrating to `cti/merge/` |
| Type definitions | `hooks/ctiStompHookTypes.ts` → `cti/types.ts` |
| Cross-tab manager | `utils/crossTabCtiManager.ts` |
| Cross-tab React integration | `hooks/ctiStompCrossTabIntegration.ts` |
| Gap recovery | `hooks/ctiStreamMissedEventRecovery.ts` |
| Call persistence | `hooks/ctiStompCallStatePersistence.ts` |
| REST commands | `utils/dialer.ts` → wrapped by `cti/mutations/` |
| Main hook | `hooks/useCtiStomp.ts` |
| App context | `contexts/CtiContext.tsx` |
| Selectors | `cti/selectors/` (new) |
| Mutations | `cti/mutations/` (new) |
| Pure types | `cti/types.ts` (new) |
| Wallboard rules | `components/communications/wallboards-live/wallboardEventParsing.ts` |
| Live calls helpers | `components/live-calls/utils/helpers.ts` |
| Address matching | `utils/ctiAddressMatching.ts` |
| Incoming call CRM match | `utils/incomingCallMatching.ts` |

---

## PR Checklist (CTI touches)

- [ ] Live state change goes through merge layer (`cti/merge/` or `ctiStompHelpers`), not UI `useEffect`.
- [ ] New event shape → add fixture under `cti/fixtures/events/` + unit test.
- [ ] New command → add `useCti*Mutation` in `cti/mutations/`; UI calls context, not `dialer.ts` directly.
- [ ] No new `eventLog` consumers in UI (debug flag only).
- [ ] Recovery path considered: reload, tab switch, missed event.
- [ ] TypeScript: no new `any` in merge/selector code.
