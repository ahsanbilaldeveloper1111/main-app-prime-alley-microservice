import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { getRemotePartyDnForTransfer } from "@utils/dialer";
import { getErrorMessage } from "@utils/errors";
import {
  getFloatingBarControllerDeviceInfo,
  type FloatingBarCallStateEntry,
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
  /** Full CTI call state (party rows, monitoring) for transfer + floating-bar device resolution. */
  callStateMap?: Record<string, FloatingBarCallStateEntry> | null;
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
  callStateMap,
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
    const controllerDevice = getFloatingBarControllerDeviceInfo(
      activeCall,
      userAddr,
      dnsMap,
      callStateMap ?? undefined,
    );
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
    const controllerDevice = getFloatingBarControllerDeviceInfo(
      activeCall,
      userAddr,
      dnsMap,
      callStateMap ?? undefined,
    );
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
    const controllerDevice = getFloatingBarControllerDeviceInfo(
      activeCall,
      userAddr,
      dnsMap,
      callStateMap ?? undefined,
    );
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
    const controllerDevice = getFloatingBarControllerDeviceInfo(
      activeCall,
      userAddr,
      dnsMap,
      callStateMap ?? undefined,
    );
    if (!controllerDevice) {
      toast.error(
        "Cannot transfer: no registered CTI device for your extension. Check phone registration.",
        { toastId: "floating_bar_transfer_no_device" },
      );
      return;
    }
    if (isExtensionBusyOnCalls(transferTarget, activeCalls)) {
      return;
    }

    setIsTransferringCall(true);
    try {
      const transferAddress =
        getRemotePartyDnForTransfer(
          userAddr,
          activeCall.callingAddress,
          activeCall.calledAddress,
          callStateMap ?? undefined,
          activeCall.callId,
        ) ||
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
        const errMsg =
          (typeof result.error === "string" ? result.error : undefined) ||
          "Transfer failed. Please try again.";
        toast.error(errMsg, { toastId: "floating_bar_transfer_failed" });
        console.error("[GlobalFloatingCallBar] transferCall failed:", result.error);
      }
    } catch (error) {
      toast.error(`Transfer failed: ${getErrorMessage(error)}`, {
        toastId: "floating_bar_transfer_error",
      });
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
