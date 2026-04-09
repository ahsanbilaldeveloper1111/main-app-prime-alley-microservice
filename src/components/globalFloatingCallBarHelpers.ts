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

export type FloatingBarCallStateParty = {
  callStatus?: string;
  callingAddress?: string;
  calledAddress?: string;
};

export type FloatingBarCallStateEntry = {
  isMonitoring?: boolean;
  monitoring?: { monitorDn?: string };
  heldByAddress?: string;
  parties?: Array<FloatingBarCallStateParty>;
};

/** Matches CTI `dnsMap` keys = registered extension DNs (external PSTN is usually absent). */
export type FloatingBarDnsMap = Record<string, unknown>;

function normalizeAddressForComparison(address?: string): string {
  if (!address) return "";
  const digitsOnly = address.replaceAll(/\D/g, "");
  if (!digitsOnly) return "";
  return digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
}

function addressesEquivalent(
  a: string | undefined,
  b: string | undefined,
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const na = normalizeAddressForComparison(a);
  const nb = normalizeAddressForComparison(b);
  return na !== "" && na === nb;
}

function isDnRegisteredOnFloatingBar(
  dnsMap: FloatingBarDnsMap | undefined,
  address: string | undefined,
): boolean {
  if (!address || !dnsMap) return false;
  if (Object.hasOwn(dnsMap, address)) return true;
  const norm = normalizeAddressForComparison(address);
  if (!norm) return false;
  return Object.keys(dnsMap).some(
    (k) => normalizeAddressForComparison(k) === norm,
  );
}

/**
 * Whether the signed-in user should see Resume on the floating bar for a held call.
 * Uses `heldByAddress` when it still matches an active party; otherwise infers from the user's leg
 * and which endpoint is an internal DN (fixes callee/transfer-recipient hold and stale heldBy after transfer).
 */
function inferResumeAllowedFromDnsForParty(
  userAddress: string,
  ourParty: FloatingBarCallStateParty,
  dnsMap: FloatingBarDnsMap | undefined,
): boolean {
  const callerKnown = isDnRegisteredOnFloatingBar(
    dnsMap,
    ourParty.callingAddress,
  );
  const calleeKnown = isDnRegisteredOnFloatingBar(
    dnsMap,
    ourParty.calledAddress,
  );
  if (callerKnown !== calleeKnown) {
    return callerKnown
      ? addressesEquivalent(userAddress, ourParty.callingAddress)
      : addressesEquivalent(userAddress, ourParty.calledAddress);
  }
  return (
    addressesEquivalent(userAddress, ourParty.callingAddress) ||
    addressesEquivalent(userAddress, ourParty.calledAddress)
  );
}

export function canUserResumeHoldOnFloatingBar(
  userAddress: string | undefined,
  callState: FloatingBarCallStateEntry | undefined,
  dnsMap: FloatingBarDnsMap | undefined,
): boolean {
  if (!userAddress || !callState) {
    return false;
  }

  const parties = callState.parties ?? [];
  const ourParty = parties.find(
    (p) =>
      addressesEquivalent(p.callingAddress, userAddress) ||
      addressesEquivalent(p.calledAddress, userAddress),
  );
  if (!ourParty) {
    return false;
  }

  const heldByAddress = callState.heldByAddress;
  const heldByNonEmpty =
    typeof heldByAddress === "string" && heldByAddress.length > 0;
  const heldByOnCall =
    heldByNonEmpty &&
    parties.some(
      (p) =>
        addressesEquivalent(p.callingAddress, heldByAddress) ||
        addressesEquivalent(p.calledAddress, heldByAddress),
    );

  if (heldByNonEmpty && heldByOnCall) {
    if (addressesEquivalent(userAddress, heldByAddress)) {
      return true;
    }
    const status = (ourParty.callStatus ?? "").toUpperCase();
    if (status === "ON_HOLD" || status === "HELD") {
      return inferResumeAllowedFromDnsForParty(userAddress, ourParty, dnsMap);
    }
    return false;
  }

  const status = (ourParty.callStatus ?? "").toUpperCase();
  if (status === "ON_HOLD" || status === "HELD") {
    return inferResumeAllowedFromDnsForParty(userAddress, ourParty, dnsMap);
  }

  return true;
}

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

function initialsFromFirstAndLastName(
  firstName: string,
  lastName: string,
): string {
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

  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

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
  eventLog: FloatingBarEventLogEntry[] | undefined,
): boolean {
  if (!userAddress) return false;

  if (call.callId && callStateMap?.[call.callId]) {
    const callState = callStateMap[call.callId];
    if (
      callState.isMonitoring === true ||
      callState.monitoring?.monitorDn === userAddress
    ) {
      return true;
    }
  }

  if (eventLog?.length) {
    return eventLogImpliesMonitoringCall(
      call,
      userAddress,
      eventLog.slice(-50),
    );
  }

  return false;
}

function eventLogImpliesMonitoringCall(
  call: FloatingBarCtiCall,
  userAddress: string,
  recent: FloatingBarEventLogEntry[],
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

function isPartyStatusRingingForCallee(
  party: FloatingBarCallStateParty,
  userAddress: string,
): boolean {
  if (party.calledAddress !== userAddress) {
    return false;
  }
  const raw = party.callStatus ?? "";
  const s = raw.toUpperCase();
  return s === "RINGING" || s === "ALERTING" || s === "PROCEEDING";
}

/**
 * Transfer UX (two roles):
 * - **Transfer initiator** (still on the consult / connecting leg as caller): keep seeing the
 *   floating bar — `isInboundAwaitingUserAnswerForFloatingBar` is false for them because they are
 *   not `calledAddress` on the inbound offer to the transfer target.
 * - **Transfer recipient** (`calledAddress` = this user, party still RINGING/ALERTING/PROCEEDING):
 *   must use attend/reject only — exclude this call from the floating bar so it does not replace
 *   the incoming dialog.
 *
 * Uses per-party state when available so consult/transfer aggregate "connected" state does not
 * show the bar to the recipient before they answer.
 */
export function isInboundAwaitingUserAnswerForFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
): boolean {
  if (!userAddress || call.calledAddress !== userAddress) {
    return false;
  }
  const parties = call.callId
    ? callStateMap?.[call.callId]?.parties
    : undefined;
  if (parties?.length) {
    return parties.some((p) => isPartyStatusRingingForCallee(p, userAddress));
  }
  return call.status === "ringing" || call.status === "dialing";
}

/** Eligible calls for the floating bar for this signed-in extension (monitoring calls excluded). */
export function shouldIncludeCallOnFloatingBar(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog: FloatingBarEventLogEntry[] | undefined,
): boolean {
  if (
    isInboundAwaitingUserAnswerForFloatingBar(call, userAddress, callStateMap)
  ) {
    return false;
  }
  const involvesUser = !!(
    userAddress &&
    (call.callingAddress === userAddress || call.calledAddress === userAddress)
  );
  const hasValidStatus = ["connected", "ringing", "dialing", "onHold"].includes(
    call.status,
  );
  if (!involvesUser || !hasValidStatus) return false;
  return !isMonitoringCallForFloatingBar(
    call,
    userAddress,
    callStateMap,
    eventLog,
  );
}

export function compareFloatingBarCalls(
  a: FloatingBarCtiCall,
  b: FloatingBarCtiCall,
): number {
  if (a.status === "connected" && b.status !== "connected") return -1;
  if (b.status === "connected" && a.status !== "connected") return 1;
  if (a.status === "onHold" && !["connected"].includes(b.status)) return -1;
  if (b.status === "onHold" && !["connected"].includes(a.status)) return 1;
  return 0;
}

function applyFallbackConnectedDuration(call: FloatingBarCtiCall): void {
  if (call.status !== "connected" || !call.startTime) return;
  const startTime =
    call.startTime instanceof Date
      ? call.startTime
      : moment.utc(call.startTime).toDate();
  const now = new Date();
  call.duration = Math.max(
    0,
    Math.round((now.getTime() - startTime.getTime()) / 1000),
  );
}

function hasEquivalentConnectedParty(
  ringingParties: NonNullable<FloatingBarCallStateEntry["parties"]>,
  connectedParties: NonNullable<FloatingBarCallStateEntry["parties"]>,
): boolean {
  return ringingParties.some((ringingParty) => {
    const ringingCaller = normalizeAddressForComparison(
      ringingParty.callingAddress,
    );
    const ringingCallee = normalizeAddressForComparison(
      ringingParty.calledAddress,
    );
    return connectedParties.some((connectedParty) => {
      const connectedCaller = normalizeAddressForComparison(
        connectedParty.callingAddress,
      );
      const connectedCallee = normalizeAddressForComparison(
        connectedParty.calledAddress,
      );
      return (
        ringingCaller === connectedCaller && ringingCallee === connectedCallee
      );
    });
  });
}

function applyPartyStatusesToCall(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  parties: NonNullable<FloatingBarCallStateEntry["parties"]>,
): void {
  const connectedParties = parties.filter(
    (p) =>
      p.callStatus === "CONNECTED" ||
      p.callStatus === "ANSWERED" ||
      p.callStatus === "RETRIEVED",
  );
  const ringingParties = parties.filter((p) => p.callStatus === "RINGING");
  const hasConnectedParty = connectedParties.length > 0;
  const hasRingingParty = ringingParties.length > 0;
  const hasEquivalentConnectedAndRinging =
    hasConnectedParty &&
    hasRingingParty &&
    hasEquivalentConnectedParty(ringingParties, connectedParties);

  if (
    hasConnectedParty &&
    (!hasRingingParty || hasEquivalentConnectedAndRinging)
  ) {
    call.status = "connected";
  } else if (hasRingingParty && call.calledAddress === userAddress) {
    call.status = "ringing";
  }
}

function applyParsedDurationFromState(
  call: FloatingBarCtiCall,
  callState: FloatingBarCallStateEntry,
): void {
  if (call.status !== "connected") return;
  const startTime = parseCallAnswerStartTimeUtc(callState, call.startTime);
  if (!startTime) return;
  const now = new Date();
  call.duration = Math.max(
    0,
    Math.round((now.getTime() - startTime.getTime()) / 1000),
  );
}

export function enrichFloatingBarCallFromCallState(
  call: FloatingBarCtiCall,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
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

/** Resolved controller device for CTI actions from the floating bar (same leg as WebCTI user). */
export type FloatingBarControllerDevice = {
  controllerAddress: string;
  controllerDeviceName: string;
  controllerDeviceType: string;
};

type FloatingBarDnsDeviceLike = {
  deviceName?: string;
  deviceType?: string;
  terminalState?: string;
};

function readUserDevicesFromDnsMap(
  dnsMap: FloatingBarDnsMap | undefined,
  userAddress: string,
): FloatingBarDnsDeviceLike[] {
  if (!dnsMap) {
    return [];
  }
  const bucket = dnsMap[userAddress];
  if (!bucket || typeof bucket !== "object" || !("devices" in bucket)) {
    return [];
  }
  const devicesObj = (bucket as { devices?: Record<string, unknown> }).devices;
  if (!devicesObj || typeof devicesObj !== "object") {
    return [];
  }
  return Object.values(devicesObj).flatMap((d): FloatingBarDnsDeviceLike[] => {
    if (!d || typeof d !== "object") {
      return [];
    }
    const o = d as Record<string, unknown>;
    return [
      {
        deviceName: typeof o.deviceName === "string" ? o.deviceName : undefined,
        deviceType: typeof o.deviceType === "string" ? o.deviceType : undefined,
        terminalState:
          typeof o.terminalState === "string" ? o.terminalState : undefined,
      },
    ];
  });
}

export function getFloatingBarControllerDeviceInfo(
  call: FloatingBarCtiCall | null | undefined,
  userAddress: string | undefined,
  dnsMap: FloatingBarDnsMap | undefined,
): FloatingBarControllerDevice | null {
  if (!call || !userAddress || !dnsMap) {
    return null;
  }

  const isCaller = call.callingAddress === userAddress;
  const isCalled = call.calledAddress === userAddress;

  if (!isCaller && !isCalled) {
    return null;
  }

  const userDevices = readUserDevicesFromDnsMap(dnsMap, userAddress);
  if (userDevices.length === 0) {
    return null;
  }

  let activeDevice =
    isCaller && call.callingDeviceName
      ? userDevices.find(
          (device) => device.deviceName === call.callingDeviceName,
        )
      : undefined;

  activeDevice ??=
    userDevices.find((device) => device.terminalState === "REGISTERED") ||
    userDevices[0];

  return {
    controllerAddress: userAddress,
    controllerDeviceName: activeDevice.deviceName || "WebCTI",
    controllerDeviceType: activeDevice.deviceType || "SOFT_HARD",
  };
}

/** Live elapsed seconds for a connected floating-bar call (falls back to `call.duration`). */
export function computeFloatingBarConnectedElapsedSeconds(
  activeCall: FloatingBarCtiCall,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
): number {
  const callId = activeCall.callId;
  if (!callId || !callStateMap?.[callId]) {
    return activeCall.duration ?? 0;
  }

  const callState = callStateMap[callId];
  const startTime = parseCallAnswerStartTimeUtc(
    callState,
    activeCall.startTime,
  );
  if (startTime) {
    const now = new Date();
    return Math.max(
      0,
      Math.round((now.getTime() - startTime.getTime()) / 1000),
    );
  }

  return activeCall.duration ?? 0;
}

export function pickFloatingBarCall(
  activeCalls: Map<string, FloatingBarCtiCall>,
  userAddress: string | null | undefined,
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined,
  eventLog: FloatingBarEventLogEntry[] | undefined,
): FloatingBarCtiCall | undefined {
  const all = Array.from(activeCalls.values());
  const list = all
    .filter((c) =>
      shouldIncludeCallOnFloatingBar(c, userAddress, callStateMap, eventLog),
    )
    .sort(compareFloatingBarCalls);
  const call = list[0];
  if (call) {
    enrichFloatingBarCallFromCallState(call, userAddress, callStateMap);
  }
  return call;
}
