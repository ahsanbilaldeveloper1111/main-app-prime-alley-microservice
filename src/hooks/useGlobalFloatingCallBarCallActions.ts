import { useCallback, useMemo, useState } from "react";
import { getRemotePartyDnForTransfer } from "@utils/dialer";
import {
  getFloatingBarControllerDeviceInfo,
  type FloatingBarCtiCall,
} from "@components/globalFloatingCallBarHelpers";
import {
  buildFloatingBarSignedCallPayload,
  runFloatingBarCtiOperation,
} from "@components/globalFloatingCallBarCtiPayload";
import { isExtensionBusyOnCalls } from "@components/GlobalFloatingCallBarPanels";

export type FloatingBarCtiActionResult = { success: boolean; error?: unknown };

export type UseGlobalFloatingCallBarCallActionsParams = {
  activeCall: FloatingBarCtiCall | undefined;
  userAddress: string | null | undefined;
  dnsMap: Record<string, unknown> | undefined;
  activeCalls: Map<string, FloatingBarCtiCall>;
  getAvailableExtensions: () => string[];
  endCall: (params: Record<string, unknown>) => Promise<FloatingBarCtiActionResult>;
  holdCall: (params: Record<string, unknown>) => Promise<FloatingBarCtiActionResult>;
  resumeCall: (params: Record<string, unknown>) => Promise<FloatingBarCtiActionResult>;
  transferCall: (params: {
    callId: string;
    transferAddress: string;
    targetAddress: string;
    mode: string;
    transferInitiatorAddress: string;
    transferInitiatorDeviceType: string;
    transferInitiatorDeviceName: string;
  }) => Promise<FloatingBarCtiActionResult>;
};

export function useGlobalFloatingCallBarCallActions({
  activeCall,
  userAddress,
  dnsMap,
  activeCalls,
  getAvailableExtensions,
  endCall,
  holdCall,
  resumeCall,
  transferCall,
}: UseGlobalFloatingCallBarCallActionsParams) {
  const userAddr = userAddress ?? undefined;
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [isHoldingCall, setIsHoldingCall] = useState(false);
  const [isResumingCall, setIsResumingCall] = useState(false);
  const [isTransferringCall, setIsTransferringCall] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [extensionSearch, setExtensionSearch] = useState("");

  const closeTransferModal = useCallback(() => {
    setShowTransferModal(false);
    setTransferTarget("");
    setExtensionSearch("");
  }, []);

  const transferCandidates = useMemo(
    () =>
      getAvailableExtensions().filter(
        (ext) => !isExtensionBusyOnCalls(ext, activeCalls),
      ),
    [getAvailableExtensions, activeCalls],
  );

  const handleEndCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddr, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsEndingCall,
      () => endCall(payload),
      "endCall",
    );
  };

  const handleHoldCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddr, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsHoldingCall,
      () => holdCall(payload),
      "holdCall",
    );
  };

  const handleResumeCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddr, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsResumingCall,
      () => resumeCall(payload),
      "resumeCall",
    );
  };

  const handleTransferCall = async () => {
    if (!activeCall?.callId || !transferTarget.trim()) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddr, dnsMap);
    if (!controllerDevice) {
      return;
    }
    if (isExtensionBusyOnCalls(transferTarget, activeCalls)) {
      return;
    }

    setIsTransferringCall(true);
    try {
      const transferAddress =
        getRemotePartyDnForTransfer(userAddr, activeCall.callingAddress, activeCall.calledAddress) ||
        activeCall.calledAddress ||
        activeCall.number;
      const result = await transferCall({
        callId: activeCall.callId,
        transferAddress,
        targetAddress: transferTarget,
        mode: "CONSULT",
        transferInitiatorAddress: controllerDevice.controllerAddress,
        transferInitiatorDeviceType: controllerDevice.controllerDeviceType,
        transferInitiatorDeviceName: controllerDevice.controllerDeviceName,
      });

      if (result.success) {
        closeTransferModal();
      } else {
        console.error("[GlobalFloatingCallBar] transferCall failed:", result.error);
      }
    } catch (error) {
      console.error("[GlobalFloatingCallBar] transferCall error:", error);
    } finally {
      setIsTransferringCall(false);
    }
  };

  return {
    isEndingCall,
    isHoldingCall,
    isResumingCall,
    isTransferringCall,
    showTransferModal,
    setShowTransferModal,
    transferTarget,
    setTransferTarget,
    extensionSearch,
    setExtensionSearch,
    closeTransferModal,
    transferCandidates,
    handleEndCall,
    handleHoldCall,
    handleResumeCall,
    handleTransferCall,
  };
}
