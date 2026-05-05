"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import { getErrorMessage } from "@utils/errors";
import { usePermissions } from "@utils/permissionUtils";
import type { IncomingCallData } from "../contexts/IncomingCallContext";
import {
  hasReliableCtiCallId,
  resolveCallIdForAttendApi,
  shouldDismissIncomingModalForAnsweredElsewhere,
  type ResolveCallIdForAttendApiOptions,
} from "@utils/incomingCallMatching";
import {
  findMatchingActiveCall,
  getUserDevicesFromDnsMap,
  pickControllerDevice,
} from "@layout/components/layoutCtiHelpers";
import type { CtiActiveCallEntry, DnsMapLike } from "@layout/components/layoutTypes";

export type UseGlobalFloatingBarIncomingSessionParams = {
  incomingCall: IncomingCallData | null;
  showIncomingCallModal: boolean;
  onCloseIncomingSession: () => void;
  userAddress: string | null | undefined;
  dnsMap: DnsMapLike;
  activeCalls: Map<string, CtiActiveCallEntry>;
  callStateMap: Record<string, unknown> | undefined;
  attendCall: (params: Record<string, unknown>) => Promise<{ success: boolean; error?: unknown }>;
  endCall: (params: Record<string, unknown>) => Promise<{ success: boolean; error?: unknown }>;
  getUserDataExtensions: (() => Record<string, Record<string, unknown>>) | undefined;
};

export function useGlobalFloatingBarIncomingSession({
  incomingCall,
  showIncomingCallModal,
  onCloseIncomingSession,
  userAddress,
  dnsMap,
  activeCalls,
  callStateMap,
  attendCall,
  endCall,
  getUserDataExtensions,
}: UseGlobalFloatingBarIncomingSessionParams) {
  const { hasPermission } = usePermissions();
  const [isDialing, setIsDialing] = useState(false);

  const incomingCallUserData = useMemo(() => {
    if (!incomingCall?.callingAddress || !getUserDataExtensions) {
      return null;
    }
    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const callNumber = incomingCall.callingAddress;
      const dnString = String(callNumber);
      const dnNumber = Number(callNumber);
      return (
        userDataExtensions[callNumber] ||
        userDataExtensions[dnString] ||
        userDataExtensions[dnNumber] ||
        null
      );
    } catch (error) {
      toast.error(`Failed to load incoming call data: ${getErrorMessage(error)}`, {
        toastId: "floating_bar_incoming_call_data_failed",
      });
      return null;
    }
  }, [incomingCall, getUserDataExtensions]);

  const incomingCallUserName = useMemo(() => {
    if (!incomingCallUserData) {
      return incomingCall?.callingAddress || "Unknown";
    }
    const row = incomingCallUserData as { name?: string; user_name?: string };
    return (
      row.name ||
      row.user_name ||
      incomingCall?.callingAddress ||
      "Unknown"
    );
  }, [incomingCallUserData, incomingCall]);

  const incomingCallUserImageUrl = useMemo(() => {
    if (!incomingCallUserData) {
      return UserDummyImage.src;
    }
    const row = incomingCallUserData as { image_path?: string };
    const imagePath = row.image_path;
    if (imagePath) {
      const url = getStorageImageUrl(imagePath);
      return url || UserDummyImage.src;
    }
    return UserDummyImage.src;
  }, [incomingCallUserData]);

  useEffect(() => {
    if (!showIncomingCallModal || !incomingCall) {
      return;
    }
    const calls = Array.from(activeCalls.values());
    const answeredMatch = calls.find((call) =>
      shouldDismissIncomingModalForAnsweredElsewhere(call, incomingCall),
    );
    if (answeredMatch) {
      onCloseIncomingSession();
    }
  }, [showIncomingCallModal, incomingCall, activeCalls, onCloseIncomingSession]);

  const handleAttendCall = useCallback(async () => {
    if (!hasPermission("dial-call-cti")) {
      return;
    }
    if (!incomingCall) {
      return;
    }

    const { callId: attendCallId } = resolveCallIdForAttendApi(incomingCall, Array.from(activeCalls.values()), {
      callStateMap: callStateMap as ResolveCallIdForAttendApiOptions["callStateMap"],
    });

    const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
    const preferredName = incomingCall.controllerDeviceName?.trim() || null;
    const activeDevice = pickControllerDevice(userDevices, preferredName);
    if (!activeDevice) {
      toast.error("No CTI device available to answer. Check that your phone is registered.", {
        toastId: "floating_bar_attend_no_device",
      });
      return;
    }

    if (!hasReliableCtiCallId(attendCallId)) {
      toast.error("Call id is not ready yet. Wait a moment and try again, or refresh if this persists.", {
        toastId: "floating_bar_attend_no_call_id",
      });
      return;
    }

    setIsDialing(true);
    try {
      const controllerAddress = incomingCall.controllerAddress?.trim() || userAddress || "";

      const result = await attendCall({
        callId: attendCallId,
        callingAddress: incomingCall.callingAddress,
        calledAddress: incomingCall.calledAddress,
        controllerAddress,
        controllerDeviceName: activeDevice.deviceName || "WebCTI",
        controllerDeviceType: activeDevice.deviceType || "SOFT_HARD",
      });

      if (result.success) {
        onCloseIncomingSession();
      } else {
        const errMsg =
          (typeof result.error === "string" ? result.error : undefined) ||
          "Could not answer the call. Please try again.";
        toast.error(errMsg, { toastId: "floating_bar_attend_api_failed" });
      }
    } catch (error) {
      toast.error(`Failed to attend call: ${getErrorMessage(error)}`, {
        toastId: "floating_bar_attend_call_failed",
      });
    } finally {
      setIsDialing(false);
    }
  }, [
    hasPermission,
    incomingCall,
    activeCalls,
    callStateMap,
    dnsMap,
    userAddress,
    attendCall,
    onCloseIncomingSession,
  ]);

  const handleRejectCall = useCallback(async () => {
    if (!incomingCall) {
      onCloseIncomingSession();
      return;
    }

    try {
      const matchingActiveCall = findMatchingActiveCall(activeCalls, incomingCall);
      const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
      const rejectPreferred = incomingCall.controllerDeviceName?.trim() || null;
      const controllerDevice = pickControllerDevice(userDevices, rejectPreferred);

      const { callId: rejectCallId } = resolveCallIdForAttendApi(incomingCall, Array.from(activeCalls.values()), {
        callStateMap: callStateMap as ResolveCallIdForAttendApiOptions["callStateMap"],
      });

      if (!controllerDevice || !hasReliableCtiCallId(rejectCallId)) {
        onCloseIncomingSession();
        return;
      }

      const rowForReject =
        Array.from(activeCalls.values()).find((c) => c.callId === rejectCallId) ?? matchingActiveCall;
      const callingDeviceName = rowForReject?.callingDeviceName || "";
      const callingDeviceType = rowForReject?.callingDeviceType || "";

      await endCall({
        callId: rejectCallId,
        callingAddress: incomingCall.callingAddress,
        calledAddress: incomingCall.calledAddress,
        callingDeviceType,
        callingDeviceName,
        controllerAddress: userAddress || "",
        controllerDeviceName: controllerDevice.deviceName || "",
        controllerDeviceType: controllerDevice.deviceType || "",
      });
    } catch (error) {
      toast.error(`Unable to reject call: ${getErrorMessage(error)}`, {
        toastId: "floating_bar_reject_call_failed",
      });
    } finally {
      onCloseIncomingSession();
    }
  }, [incomingCall, activeCalls, dnsMap, userAddress, callStateMap, endCall, onCloseIncomingSession]);

  return {
    incomingCallUserName,
    incomingCallUserImageUrl,
    isDialing,
    handleAttendCall,
    handleRejectCall,
  };
}
