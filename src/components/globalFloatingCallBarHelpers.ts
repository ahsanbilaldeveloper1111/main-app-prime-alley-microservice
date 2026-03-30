import moment from "moment-timezone";
import { parseCallAnswerStartTimeUtc } from "@components/live-calls/utils/helpers";

/** Shape of entries in CTI `activeCalls` Map (floating bar). */
export type FloatingBarCtiCall = {
  id: string;
  number: string;
  startTime: Date;
  status: string;
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  callingDeviceType?: string;
  duration?: number;
};

export type FloatingBarCallStateEntry = {
  isMonitoring?: boolean;
  monitoring?: { monitorDn?: string };
  heldByAddress?: string;
  parties?: Array<{ callStatus?: string; callingAddress?: string; calledAddress?: string }>;
};

export type FloatingBarEventLogEntry = {
  isMonitoring?: boolean;
  monitoring?: { monitorDn?: string; monitoredDn?: string };
  parties?: Array<{ callingAddress?: string; calledAddress?: string }>;
};

function collectLetterMatches(text: string, re: RegExp): string[] {
  const letters: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    letters.push(m[0]);
  }
  return letters;
}

function initialsFromFirstAndLastName(firstName: string, lastName: string): string {
  const firstLetter = /[a-z]/i.exec(firstName)?.[0];
  const lastNameLetters = collectLetterMatches(lastName, /[a-z]/gi);
  const secondLetter = lastNameLetters.length >= 2 ? lastNameLetters[1] : null;
  if (firstLetter && secondLetter) {
    return (firstLetter + secondLetter).toUpperCase();
  }
  const lastFirstLetter = lastNameLetters[0];
  if (firstLetter && lastFirstLetter) {
    return (firstLetter + lastFirstLetter).toUpperCase();
  }
  return firstLetter ? firstLetter.toUpperCase() : "";
}

function initialsFromSingleWord(word: string): string {
  const letters = collectLetterMatches(word, /[a-z]/gi);
  if (letters.length >= 2) {
    return (letters[0] + letters[1]).toUpperCase();
  }
  if (letters.length === 1) {
    return letters[0].toUpperCase();
  }
  return "";
}

export function getInitialsFromNameForFloatingBar(name: string): string {
  if (!name) return "";

  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);

  if (words.length >= 2) {
    return initialsFromFirstAndLastName(words[0], words.at(-1) ?? "");
  }

  if (words.length === 1 && words[0]) {
    return initialsFromSingleWord(words[0]);
  }

  return "";
}

function isMonitoringCallForFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog: FloatingBarEventLogEntry[] | undefined
): boolean {
  if (!userAddress) return false;

  if (call.callId && callStateMap?.[call.callId]) {
    const callState = callStateMap[call.callId];
    if (callState.isMonitoring === true || callState.monitoring?.monitorDn === userAddress) {
      return true;
    }
  }

  if (eventLog?.length) {
    return eventLogImpliesMonitoringCall(call, userAddress, eventLog.slice(-50));
  }

  return false;
}

function eventLogImpliesMonitoringCall(
  call: FloatingBarCtiCall,
  userAddress: string,
  recent: FloatingBarEventLogEntry[]
): boolean {
  for (const evt of recent) {
    if (!evt.isMonitoring || !evt.monitoring || !evt.parties?.length) continue;
    const { monitorDn, monitoredDn } = evt.monitoring;
    if (monitorDn !== userAddress || !monitoredDn) continue;
    const callInvolvesSupervisor =
      call.callingAddress === userAddress || call.calledAddress === userAddress;
    const callInvolvesMonitoredAgent =
      call.callingAddress === monitoredDn || call.calledAddress === monitoredDn;
    if (callInvolvesSupervisor && callInvolvesMonitoredAgent) {
      return true;
    }
  }
  return false;
}

export function shouldIncludeCallOnFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog: FloatingBarEventLogEntry[] | undefined
): boolean {
  const involvesUser = !!(
    userAddress &&
    (call.callingAddress === userAddress || call.calledAddress === userAddress)
  );
  const hasValidStatus = ["connected", "ringing", "dialing", "onHold"].includes(call.status);
  if (!involvesUser || !hasValidStatus) return false;
  return !isMonitoringCallForFloatingBar(call, userAddress, callStateMap, eventLog);
}

export function compareFloatingBarCalls(a: FloatingBarCtiCall, b: FloatingBarCtiCall): number {
  if (a.status === "connected" && b.status !== "connected") return -1;
  if (b.status === "connected" && a.status !== "connected") return 1;
  if (a.status === "onHold" && !["connected"].includes(b.status)) return -1;
  if (b.status === "onHold" && !["connected"].includes(a.status)) return 1;
  return 0;
}

function applyFallbackConnectedDuration(call: FloatingBarCtiCall): void {
  if (call.status !== "connected" || !call.startTime) return;
  const startTime =
    call.startTime instanceof Date ? call.startTime : moment.utc(call.startTime).toDate();
  const now = new Date();
  call.duration = Math.max(0, Math.round((now.getTime() - startTime.getTime()) / 1000));
}

function applyPartyStatusesToCall(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>
): void {
  const hasConnectedParty = parties.some(
    (p) =>
      p.callStatus === "CONNECTED" ||
      p.callStatus === "ANSWERED" ||
      p.callStatus === "RETRIEVED"
  );
  const hasRingingParty = parties.some((p) => p.callStatus === "RINGING");

  if (hasConnectedParty && !hasRingingParty) {
    call.status = "connected";
  } else if (hasRingingParty && call.calledAddress === userAddress) {
    call.status = "ringing";
  }
}

function applyParsedDurationFromState(call: FloatingBarCtiCall, callState: FloatingBarCallStateEntry): void {
  if (call.status !== "connected") return;
  const startTime = parseCallAnswerStartTimeUtc(callState, call.startTime);
  if (!startTime) return;
  const now = new Date();
  call.duration = Math.max(0, Math.round((now.getTime() - startTime.getTime()) / 1000));
}

export function enrichFloatingBarCallFromCallState(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined
): void {
  const callId = call.callId;
  if (!callId || !callStateMap?.[callId]) {
    applyFallbackConnectedDuration(call);
    return;
  }

  const callState = callStateMap[callId];
  const parties = callState.parties;
  if (parties?.length) {
    applyPartyStatusesToCall(call, userAddress, parties);
  }

  applyParsedDurationFromState(call, callState);
}

export function pickFloatingBarCall(
  activeCalls: Map<string, FloatingBarCtiCall>,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog: FloatingBarEventLogEntry[] | undefined
): FloatingBarCtiCall | undefined {
  const list = Array.from(activeCalls.values())
    .filter((c) => shouldIncludeCallOnFloatingBar(c, userAddress, callStateMap, eventLog))
    .sort(compareFloatingBarCalls);
  const call = list[0];
  if (call) {
    enrichFloatingBarCallFromCallState(call, userAddress, callStateMap);
  }
  return call;
}
