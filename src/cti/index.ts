/**
 * CTI domain module — public API.
 *
 * Import from here rather than from internal sub-paths where possible:
 *   import { applyCallEvent, getActiveCalls, useCtiDialMutation } from "@cti";
 */

// Types
export * from "./types";

// Merge layer
export { applyCallEvent } from "./merge/applyCallEvent";
export { mergeOngoingCalls, extractCallsByDn } from "./merge/mergeOngoingCalls";
export { isStaleEvent, toEventTimeMs } from "./merge/staleEvent";

export {
  extractHeldByFromPayload,
  getActiveHoldSegment,
  resolveHeldByForCallState,
  type CtiHoldSegment,
  type CtiHeldBySource,
  type ResolvedHeldBy,
} from "./hold/resolveHeldBy";

// Selectors
export {
  getActiveCalls,
  getCallsForAddress,
  getRemoteAddressForCall,
  getLiveParties,
  callEventToActiveCall,
  mapCallStateToActiveCallStatus,
  isIncomingCallForAddress,
} from "./selectors/activeCalls";

export {
  getDnStatus,
  getDnsByStatus,
  getDeviceForDn,
} from "./selectors/dnStatus";

export {
  getMonitoringSessionsForSupervisor,
  getMonitoringInfoForMonitoredDn,
  supervisorIsBargedIn,
  agentIsBeingSilentlyMonitored,
  getMonitoringCallIdForSupervisor,
  isBargeInType,
} from "./selectors/monitoring";

// TanStack Query mutation hooks
export { useCtiDialMutation } from "./mutations/useCtiDialMutation";
export { useCtiEndCallMutation } from "./mutations/useCtiEndCallMutation";
export { useCtiAttendCallMutation } from "./mutations/useCtiAttendCallMutation";
export { useCtiHoldCallMutation } from "./mutations/useCtiHoldCallMutation";
export { useCtiResumeCallMutation } from "./mutations/useCtiResumeCallMutation";
export { useCtiTransferCallMutation } from "./mutations/useCtiTransferCallMutation";
export { useCtiMergeCallsMutation } from "./mutations/useCtiMergeCallsMutation";
export { useCtiStartMonitoringMutation } from "./mutations/useCtiStartMonitoringMutation";
export { useCtiStopMonitoringMutation } from "./mutations/useCtiStopMonitoringMutation";
export { useCtiStartBargeInMutation } from "./mutations/useCtiStartBargeInMutation";
export { useCtiStopBargeInMutation } from "./mutations/useCtiStopBargeInMutation";
