/**
 * CTI Domain Types
 *
 * Single source of truth for all CTI-related shapes. Prefer these over
 * the inline `any` types scattered in ctiStompHelpers / useCtiStomp.
 *
 * Migration note: ctiStompHookTypes.ts re-exports from here for backward compat.
 */

// ---------------------------------------------------------------------------
// Party status enum (subset of values the CTI platform emits)
// ---------------------------------------------------------------------------

export type CtiPartyStatus =
  | "RINGING"
  | "CONNECTED"
  | "ANSWERED"
  | "RETRIEVED"
  | "ON_HOLD"
  | "HELD"
  | "DROPPED"
  | "DISCONNECTED"
  | "ENDED"
  | string; // allow unknown future values without crashing

// ---------------------------------------------------------------------------
// Call event types
// ---------------------------------------------------------------------------

export type CtiEventType =
  | "RINGING"
  | "CONNECTED"
  | "ANSWERED"
  | "RETRIEVED"
  | "HELD"
  | "ON_HOLD"
  | "DROPPED"
  | "DISCONNECTED"
  | "ENDED"
  | "MONITORING_ENDED"
  | string;

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------

export type CtiMonitoringType =
  | "SILENT"
  | "WHISPER"
  | "BARGE_IN"
  | "BARGE-IN"
  | "BARGEIN"
  | string;

export interface CtiMonitoringInfo {
  monitoringType?: CtiMonitoringType;
  monitorDn?: string;
  monitoredDn?: string;
  callId?: string;
}

// ---------------------------------------------------------------------------
// Call party leg
// ---------------------------------------------------------------------------

export interface CtiHoldSegment {
  startTime?: string;
  endTime?: string | null;
  heldByAddress?: string;
  heldByDeviceName?: string;
}

export interface CtiPartyLeg {
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callStatus?: CtiPartyStatus;
  callingDeviceName?: string;
  callingDeviceType?: string;
  calledDeviceName?: string;
  calledDeviceType?: string;
  /** ISO timestamp — preserved as earliest-wins across events */
  startTime?: string;
  endTime?: string;
  /** Present on HELD events — active segment (endTime null) identifies the holder */
  holdSegments?: CtiHoldSegment[];
}

// ---------------------------------------------------------------------------
// Call event / call state entry
// ---------------------------------------------------------------------------

export interface CtiCallEvent {
  callId: string;
  eventType: CtiEventType;
  sequence: number;
  /** ISO timestamp — used for stale-event detection */
  eventTime: string;
  isConference: boolean;
  isOneToOne: boolean;
  isTerminating: boolean;
  hasActiveParticipants: boolean;
  eventName: string;
  currentState?: string;
  parties: CtiPartyLeg[];
  /** Address of the party who initiated hold (only they can resume) */
  heldByAddress?: string;
  /** Device name of the party who put the call on hold (HELD events) */
  heldByDeviceName?: string;
  /** True when call has a monitoring session attached */
  isMonitoring?: boolean;
  monitoring?: CtiMonitoringInfo;
}

// ---------------------------------------------------------------------------
// Device (from dnsMap)
// ---------------------------------------------------------------------------

export interface CtiDevice {
  dn: string;
  deviceName: string;
  status: string;
  terminalState: string;
  deviceType: string;
}

export interface CtiDnEntry {
  dn: string;
  devices: Record<string, CtiDevice>;
}

// ---------------------------------------------------------------------------
// Summary strip
// ---------------------------------------------------------------------------

export interface CtiSummaryData {
  extensions: number;
  online: number;
  offline: number;
  connected: number;
  on_hold: number;
  incoming: number;
  answered: number;
  incomingEvents: number;
}

// ---------------------------------------------------------------------------
// State maps
// ---------------------------------------------------------------------------

export type CtiCallStateMap = Record<string, CtiCallEvent>;
export type CtiDnsMap = Record<string, CtiDnEntry>;

// ---------------------------------------------------------------------------
// DN status (derived by selectors)
// ---------------------------------------------------------------------------

export type CtiDnStatus =
  | "idle"
  | "ringing"
  | "onCall"
  | "onHold"
  | "monitoring"
  | "unknown";

// ---------------------------------------------------------------------------
// Active call (floating bar / dialer view model)
// ---------------------------------------------------------------------------

export interface CtiActiveCall {
  /** Map key (may equal callId or a temp pending id) */
  id: string;
  /** The remote party's number / DN */
  number: string;
  status: "dialing" | "ringing" | "connected" | "onHold" | "ended";
  startTime: Date;
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  callingDeviceType?: string;
  duration?: number;
}

// ---------------------------------------------------------------------------
// Dial params (mirrors src/utils/dialer.ts — typed properly here)
// ---------------------------------------------------------------------------

export interface CtiDialParams {
  callingAddress: string;
  calledAddress: string;
  callingDeviceType: string;
  callingDeviceName: string;
}

export interface CtiEndCallParams {
  callId: string;
  callingAddress: string;
  calledAddress: string;
  callingDeviceType: string;
  callingDeviceName: string;
}

export interface CtiHoldCallParams extends CtiEndCallParams {
  controllerAddress?: string;
  controllerDeviceName?: string;
  controllerDeviceType?: string;
}

export interface CtiResumeCallParams {
  callId: string;
  callingAddress: string;
  calledAddress: string;
  callingDeviceType: string;
  callingDeviceName: string;
}

export interface CtiAttendCallParams {
  callId: string;
  callingAddress: string;
  calledAddress: string;
  controllerAddress: string;
  controllerDeviceName: string;
  controllerDeviceType: string;
}

export interface CtiTransferCallParams {
  callId: string;
  transferInitiatorAddress: string;
  transferInitiatorDeviceType: string;
  transferInitiatorDeviceName: string;
  transferAddress: string;
  targetAddress: string;
  mode: string;
}

export interface CtiMergeCallsParams {
  heldCallId: string;
  activeCallId: string;
  callingAddress: string;
  callingDeviceType: string;
  callingDeviceName: string;
}

export interface CtiMonitoringParams {
  monitorDeviceType: string;
  monitorDeviceName: string;
  monitoredDeviceType: string;
  monitoredDeviceName: string;
  monitoredDeviceDn: string;
  type: string;
  tone: string;
  monitor: string;
}

export interface CtiStopMonitoringParams {
  monitorDeviceType: string;
  monitorDeviceName: string;
  monitor: string;
}

export interface CtiBargeInParams {
  monitorDeviceType: string;
  monitorDeviceName: string;
  monitoredDeviceType: string;
  monitoredDeviceName: string;
  type: string;
  tone: string;
  monitor: string;
}

export interface CtiStopBargeInParams {
  monitorDeviceType: string;
  monitorDeviceName: string;
  monitor: string;
  monitoredDeviceType?: string;
  monitoredDeviceName?: string;
  monitoredDeviceDn?: string;
  type?: string;
  tone?: string;
  callId?: string;
}

export interface CtiCommandResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: string;
}
