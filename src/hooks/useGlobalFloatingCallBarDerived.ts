import { useEffect, useMemo, useState } from "react";
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import {
  canUserResumeHoldOnFloatingBar,
  computeFloatingBarConnectedElapsedSeconds,
  pickFloatingBarCall,
  type FloatingBarCallStateEntry,
  type FloatingBarCtiCall,
  type FloatingBarDnsMap,
  type FloatingBarEventLogEntry,
} from "@components/globalFloatingCallBarHelpers";

type UserDataExtensionsGetter = (() => Record<string, Record<string, unknown>>) | undefined;

export type UseGlobalFloatingCallBarDerivedParams = {
  activeCalls: Map<string, FloatingBarCtiCall>;
  userAddress: string | null | undefined;
  callStateMap: Record<string, FloatingBarCallStateEntry> | undefined;
  eventLog: FloatingBarEventLogEntry[] | undefined;
  dnsMap: FloatingBarDnsMap | undefined;
  formatDuration: (seconds: number) => string;
  getUserDataExtensions: UserDataExtensionsGetter;
};

export function useGlobalFloatingCallBarDerived({
  activeCalls,
  userAddress,
  callStateMap,
  eventLog,
  dnsMap,
  formatDuration,
  getUserDataExtensions,
}: UseGlobalFloatingCallBarDerivedParams) {
  const activeCall = useMemo(
    () =>
      pickFloatingBarCall(
        activeCalls,
        userAddress,
        callStateMap,
        eventLog,
      ),
    [activeCalls, userAddress, callStateMap, eventLog],
  );

  const canCurrentUserResumeCall = useMemo(() => {
    if (!activeCall?.callId || activeCall.status !== "onHold" || !userAddress) {
      return false;
    }
    const callState = callStateMap?.[activeCall.callId];
    return canUserResumeHoldOnFloatingBar(userAddress, callState, dnsMap);
  }, [activeCall, userAddress, callStateMap, dnsMap]);

  const [currentDuration, setCurrentDuration] = useState<number | null>(null);

  useEffect(() => {
    if (activeCall?.status !== "connected") {
      setCurrentDuration(null);
      return;
    }

    const tick = () =>
      setCurrentDuration(
        computeFloatingBarConnectedElapsedSeconds(activeCall, callStateMap),
      );
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeCall, callStateMap]);

  const connectedElapsedDisplay = useMemo(() => {
    if (activeCall?.status !== "connected") {
      return "";
    }
    if (currentDuration !== null) {
      return formatDuration(currentDuration);
    }
    if (activeCall.duration != null) {
      return formatDuration(activeCall.duration);
    }
    return formatDuration(0);
  }, [activeCall, currentDuration, formatDuration]);

  const otherPartyNumber = useMemo(() => {
    if (!activeCall || !userAddress) {
      return activeCall?.number ?? null;
    }
    if (activeCall.callingAddress === userAddress && activeCall.calledAddress) {
      return activeCall.calledAddress;
    }
    if (activeCall.calledAddress === userAddress && activeCall.callingAddress) {
      return activeCall.callingAddress;
    }
    return activeCall.number || null;
  }, [activeCall, userAddress]);

  const activeCallUserData = useMemo(() => {
    if (!activeCall || !otherPartyNumber || !getUserDataExtensions) {
      return null;
    }
    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const dnString = String(otherPartyNumber);
      const dnNumber = Number(otherPartyNumber);
      return (
        userDataExtensions[otherPartyNumber] ||
        userDataExtensions[dnString] ||
        userDataExtensions[dnNumber] ||
        null
      );
    } catch (error) {
      console.error(
        `[GlobalFloatingCallBar] Error getting extension data for ${otherPartyNumber}:`,
        error,
      );
      return null;
    }
  }, [activeCall, otherPartyNumber, getUserDataExtensions]);

  const activeCallUserName = useMemo(() => {
    if (!activeCallUserData) {
      return otherPartyNumber || "Unknown";
    }
    const row = activeCallUserData as { name?: string; user_name?: string };
    return row.name || row.user_name || otherPartyNumber || "Unknown";
  }, [activeCallUserData, otherPartyNumber]);

  const activeCallUserImageUrl = useMemo(() => {
    if (!activeCallUserData) {
      return UserDummyImage.src;
    }
    const row = activeCallUserData as { image_path?: string };
    if (!row.image_path) {
      return UserDummyImage.src;
    }
    const url = getStorageImageUrl(row.image_path);
    return url || UserDummyImage.src;
  }, [activeCallUserData]);

  return {
    activeCall,
    canCurrentUserResumeCall,
    connectedElapsedDisplay,
    otherPartyNumber,
    activeCallUserName,
    activeCallUserImageUrl,
  };
}
