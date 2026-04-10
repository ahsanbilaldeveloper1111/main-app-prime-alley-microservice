import { useEffect, useRef, type MutableRefObject, type Dispatch, type SetStateAction } from "react";
import {
  isDuplicateRingingEventForOpenModal,
  shouldCloseIncomingModalOnCallEndEvent,
} from "@utils/incomingCallMatching";

/** Ref object for incoming-call auto-dismiss timer (avoid React's MutableRefObject import for Sonar/deprecation). */
export type FloatingBarIncomingTimerRef = {
  current: ReturnType<typeof setTimeout> | null;
};

export type FloatingBarIncomingCallState = {
  callId: string;
  callingAddress: string;
  calledAddress: string;
  controllerAddress: string;
  controllerDeviceName: string;
  controllerDeviceType: string;
  startTime: Date;
};

type DnsMapShape = Record<
  string,
  { devices?: Record<string, { terminalState?: string; deviceName?: string; deviceType?: string }> } | undefined
>;

type EventParty = {
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  controllerAddress?: string;
  controllerDeviceName?: string;
  controllerDeviceType?: string;
};

type LogEvent = {
  eventType?: string;
  parties?: EventParty[];
};

export function clearFloatingBarIncomingTimer(timerRef: FloatingBarIncomingTimerRef) {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function clearIncomingTimerRef(timerRef: FloatingBarIncomingTimerRef) {
  clearFloatingBarIncomingTimer(timerRef);
}

function openIncomingSession(
  data: FloatingBarIncomingCallState,
  setIncomingCall: Dispatch<SetStateAction<FloatingBarIncomingCallState | null>>,
  setIncomingCallContext: (v: FloatingBarIncomingCallState | null) => void,
  setShowIncomingCallModal: Dispatch<SetStateAction<boolean>>,
  setShowIncomingCallModalContext: (v: boolean) => void,
  timerRef: FloatingBarIncomingTimerRef
) {
  clearIncomingTimerRef(timerRef);
  setIncomingCall(data);
  setIncomingCallContext(data);
  setShowIncomingCallModal(true);
  setShowIncomingCallModalContext(true);
  timerRef.current = setTimeout(() => {
    timerRef.current = null;
    setShowIncomingCallModal(false);
    setShowIncomingCallModalContext(false);
    setIncomingCall(null);
    setIncomingCallContext(null);
  }, 30000);
}

function closeIncomingSession(
  timerRef: FloatingBarIncomingTimerRef,
  setShowIncomingCallModal: Dispatch<SetStateAction<boolean>>,
  setShowIncomingCallModalContext: (v: boolean) => void,
  setIncomingCall: Dispatch<SetStateAction<FloatingBarIncomingCallState | null>>,
  setIncomingCallContext: (v: FloatingBarIncomingCallState | null) => void
) {
  clearIncomingTimerRef(timerRef);
  setShowIncomingCallModal(false);
  setShowIncomingCallModalContext(false);
  setIncomingCall(null);
  setIncomingCallContext(null);
}

/**
 * Incoming UI must not auto-close on DISCONNECTED/DROPPED: CTI often emits those for a ringing
 * transfer leg while the callee should still answer. Rely on reject, 30s timeout,
 * Layout answered-elsewhere, or true ENDED.
 */
const INCOMING_SESSION_AUTO_CLOSE_EVENT_TYPES = new Set(["ENDED"]);

function isRingingDuplicateForOpenModal(
  eventData: EventParty,
  cur: FloatingBarIncomingCallState | null,
  showIncomingCallModal: boolean
): boolean {
  if (!cur || !showIncomingCallModal) {
    return false;
  }
  return isDuplicateRingingEventForOpenModal(eventData, cur);
}

function getRegisteredDeviceForUser(
  dnsMap: DnsMapShape | undefined,
  userAddress: string
): { deviceName?: string; deviceType?: string } | undefined {
  const userDeviceInfo = dnsMap?.[userAddress];
  const userDevices = userDeviceInfo ? Object.values(userDeviceInfo.devices || {}) : [];
  return userDevices.find((device) => device.terminalState === "REGISTERED");
}

type IncomingDeps = {
  setIncomingCall: Dispatch<SetStateAction<FloatingBarIncomingCallState | null>>;
  setIncomingCallContext: (v: FloatingBarIncomingCallState | null) => void;
  setShowIncomingCallModal: Dispatch<SetStateAction<boolean>>;
  setShowIncomingCallModalContext: (v: boolean) => void;
  incomingTimerRef: FloatingBarIncomingTimerRef;
};

function handleIncomingCallEventBranch(args: {
  latestEvent: LogEvent;
  eventData: EventParty | undefined;
  userAddress: string;
  logTailIndex: number;
  lastIncomingOpenLogIndexRef: MutableRefObject<number>;
  deps: IncomingDeps;
}): boolean {
  const { latestEvent, eventData, userAddress, logTailIndex, lastIncomingOpenLogIndexRef, deps } = args;
  if (latestEvent.eventType !== "INCOMING_CALL" || eventData?.calledAddress !== userAddress) {
    return false;
  }
  if (logTailIndex <= lastIncomingOpenLogIndexRef.current) {
    return true;
  }
  openIncomingSession(
    {
      callId: eventData.callId || `incoming_${Date.now()}`,
      callingAddress: eventData.callingAddress ?? "",
      calledAddress: eventData.calledAddress ?? "",
      controllerAddress: eventData.controllerAddress || userAddress,
      controllerDeviceName: eventData.controllerDeviceName || "WebCTI",
      controllerDeviceType: eventData.controllerDeviceType || "SOFT_HARD",
      startTime: new Date(),
    },
    deps.setIncomingCall,
    deps.setIncomingCallContext,
    deps.setShowIncomingCallModal,
    deps.setShowIncomingCallModalContext,
    deps.incomingTimerRef
  );
  lastIncomingOpenLogIndexRef.current = logTailIndex;
  return true;
}

function handleRingingEventBranch(args: {
  latestEvent: LogEvent;
  eventData: EventParty | undefined;
  userAddress: string;
  logTailIndex: number;
  dnsMap: DnsMapShape | undefined;
  showIncomingCallModal: boolean;
  lastIncomingOpenLogIndexRef: MutableRefObject<number>;
  incomingCallRef: MutableRefObject<FloatingBarIncomingCallState | null>;
  deps: IncomingDeps;
}): boolean {
  const {
    latestEvent,
    eventData,
    userAddress,
    logTailIndex,
    dnsMap,
    showIncomingCallModal,
    lastIncomingOpenLogIndexRef,
    incomingCallRef,
    deps,
  } = args;
  if (latestEvent.eventType !== "RINGING" || eventData?.calledAddress !== userAddress) {
    return false;
  }
  if (logTailIndex <= lastIncomingOpenLogIndexRef.current) {
    return true;
  }
  if (isRingingDuplicateForOpenModal(eventData, incomingCallRef.current, showIncomingCallModal)) {
    lastIncomingOpenLogIndexRef.current = logTailIndex;
    return true;
  }
  const activeUserDevice = getRegisteredDeviceForUser(dnsMap, userAddress);
  openIncomingSession(
    {
      callId: eventData.callId || `incoming_${Date.now()}`,
      callingAddress: eventData.callingAddress ?? "",
      calledAddress: eventData.calledAddress ?? "",
      controllerAddress: userAddress,
      controllerDeviceName: activeUserDevice?.deviceName || "",
      controllerDeviceType: activeUserDevice?.deviceType || "",
      startTime: new Date(),
    },
    deps.setIncomingCall,
    deps.setIncomingCallContext,
    deps.setShowIncomingCallModal,
    deps.setShowIncomingCallModalContext,
    deps.incomingTimerRef
  );
  lastIncomingOpenLogIndexRef.current = logTailIndex;
  return true;
}

function handleCallEndEventBranch(args: {
  latestEvent: LogEvent;
  eventData: EventParty | undefined;
  incomingCallRef: MutableRefObject<FloatingBarIncomingCallState | null>;
  incomingTimerRef: FloatingBarIncomingTimerRef;
  setIncomingCall: Dispatch<SetStateAction<FloatingBarIncomingCallState | null>>;
  setIncomingCallContext: (v: FloatingBarIncomingCallState | null) => void;
  setShowIncomingCallModal: Dispatch<SetStateAction<boolean>>;
  setShowIncomingCallModalContext: (v: boolean) => void;
}): void {
  const { latestEvent, eventData, incomingCallRef, incomingTimerRef } = args;
  const cur = incomingCallRef.current;
  if (!eventData || !cur) {
    return;
  }
  if (!INCOMING_SESSION_AUTO_CLOSE_EVENT_TYPES.has(latestEvent.eventType ?? "")) {
    return;
  }
  if (!shouldCloseIncomingModalOnCallEndEvent(eventData, cur)) {
    return;
  }
  closeIncomingSession(
    incomingTimerRef,
    args.setShowIncomingCallModal,
    args.setShowIncomingCallModalContext,
    args.setIncomingCall,
    args.setIncomingCallContext
  );
}

/**
 * Syncs incoming-call modal state from CTI eventLog (timer kept in a ref to avoid effect dependency churn).
 */
export function useGlobalFloatingBarIncomingCall({
  eventLog,
  userAddress,
  dnsMap,
  showIncomingCallModal,
  incomingCall,
  setIncomingCall,
  setIncomingCallContext,
  setShowIncomingCallModal,
  setShowIncomingCallModalContext,
}: {
  eventLog: LogEvent[] | undefined;
  userAddress: string | null | undefined;
  dnsMap: DnsMapShape | undefined;
  showIncomingCallModal: boolean;
  incomingCall: FloatingBarIncomingCallState | null;
  setIncomingCall: Dispatch<SetStateAction<FloatingBarIncomingCallState | null>>;
  setIncomingCallContext: (v: FloatingBarIncomingCallState | null) => void;
  setShowIncomingCallModal: Dispatch<SetStateAction<boolean>>;
  setShowIncomingCallModalContext: (v: boolean) => void;
}) {
  const incomingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingCallRef = useRef<FloatingBarIncomingCallState | null>(null);
  /** Prevents reopening from the same stale eventLog tail after dismiss (effect re-runs when modal closes). */
  const lastIncomingOpenLogIndexRef = useRef(-1);
  incomingCallRef.current = incomingCall;

  useEffect(() => {
    if (!eventLog?.length || !userAddress) return;

    const logTailIndex = eventLog.length - 1;
    const latestEvent = eventLog.at(-1);
    if (!latestEvent) return;

    const eventData = latestEvent.parties?.[0];
    const incomingDeps: IncomingDeps = {
      setIncomingCall,
      setIncomingCallContext,
      setShowIncomingCallModal,
      setShowIncomingCallModalContext,
      incomingTimerRef,
    };

    if (
      handleIncomingCallEventBranch({
        latestEvent,
        eventData,
        userAddress,
        logTailIndex,
        lastIncomingOpenLogIndexRef,
        deps: incomingDeps,
      })
    ) {
      return;
    }
    if (
      handleRingingEventBranch({
        latestEvent,
        eventData,
        userAddress,
        logTailIndex,
        dnsMap,
        showIncomingCallModal,
        lastIncomingOpenLogIndexRef,
        incomingCallRef,
        deps: incomingDeps,
      })
    ) {
      return;
    }
    handleCallEndEventBranch({
      latestEvent,
      eventData,
      incomingCallRef,
      incomingTimerRef,
      setIncomingCall,
      setIncomingCallContext,
      setShowIncomingCallModal,
      setShowIncomingCallModalContext,
    });
  }, [
    eventLog,
    userAddress,
    dnsMap,
    showIncomingCallModal,
    setIncomingCall,
    setIncomingCallContext,
    setShowIncomingCallModal,
    setShowIncomingCallModalContext,
  ]);

  useEffect(
    () => () => {
      clearIncomingTimerRef(incomingTimerRef);
    },
    []
  );

  return incomingTimerRef;
}
