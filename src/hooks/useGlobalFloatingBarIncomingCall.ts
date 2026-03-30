import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

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
  incomingCallRef.current = incomingCall;

  useEffect(() => {
    if (!eventLog?.length || !userAddress) return;

    const latestEvent = eventLog.at(-1);
    if (!latestEvent) return;

    const eventData = latestEvent.parties?.[0];

    if (latestEvent.eventType === "INCOMING_CALL" && eventData?.calledAddress === userAddress) {
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
        setIncomingCall,
        setIncomingCallContext,
        setShowIncomingCallModal,
        setShowIncomingCallModalContext,
        incomingTimerRef
      );
      return;
    }

    if (
      latestEvent.eventType === "RINGING" &&
      eventData?.calledAddress === userAddress &&
      !showIncomingCallModal
    ) {
      const userDeviceInfo = dnsMap?.[userAddress];
      const userDevices = userDeviceInfo ? Object.values(userDeviceInfo.devices || {}) : [];
      const activeUserDevice = userDevices.find((device) => device.terminalState === "REGISTERED");

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
        setIncomingCall,
        setIncomingCallContext,
        setShowIncomingCallModal,
        setShowIncomingCallModalContext,
        incomingTimerRef
      );
      return;
    }

    const endTypes = ["DISCONNECTED", "DROPPED", "ENDED"];
    if (endTypes.includes(latestEvent.eventType ?? "") && eventData && incomingCallRef.current) {
      const cur = incomingCallRef.current;
      const sameCall =
        eventData.callId === cur.callId ||
        (eventData.callingAddress === cur.callingAddress && eventData.calledAddress === cur.calledAddress);
      if (sameCall) {
        closeIncomingSession(
          incomingTimerRef,
          setShowIncomingCallModal,
          setShowIncomingCallModalContext,
          setIncomingCall,
          setIncomingCallContext
        );
      }
    }
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
