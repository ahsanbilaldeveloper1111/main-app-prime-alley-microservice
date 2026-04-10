"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import { useCti } from "../contexts/CtiContext";
import { getRemotePartyDnForTransfer } from "../utils/dialer";
import { usePermissions } from "../utils/permissionUtils";
import { useIncomingCall } from "../contexts/IncomingCallContext";
import {
  getFloatingBarControllerDeviceInfo,
  type FloatingBarControllerDevice,
  type FloatingBarCtiCall,
} from "./globalFloatingCallBarHelpers";
import {
  useGlobalFloatingCallBarDerived,
  type UseGlobalFloatingCallBarDerivedParams,
} from "../hooks/useGlobalFloatingCallBarDerived";
import {
  FloatingBarActiveCallSection,
  FloatingBarTransferModal,
  type FloatingBarTransferModalProps,
  isExtensionBusyOnCalls,
} from "./GlobalFloatingCallBarPanels";
import {
  clearFloatingBarIncomingTimer,
  useGlobalFloatingBarIncomingCall,
} from "../hooks/useGlobalFloatingBarIncomingCall";

type FloatingBarCtiResult = { success: boolean; error?: unknown };

function buildFloatingBarPositionStyles(
  barPosition: { x: number; y: number } | null,
  isDragging: boolean,
  dragPosition: { x: number; y: number } | null,
): CSSProperties {
  const baseStyles: CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    backgroundColor: "#fff",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    transition: isDragging ? "none" : "all 0.3s ease",
    cursor: isDragging ? "grabbing" : "grab",
    border: "none",
    visibility: "visible",
    opacity: 1,
    borderRadius: "1.5rem",
    padding: "0.5rem 1rem",
    gap: "1rem",
    minWidth: "320px",
    maxWidth: "625px",
    width: "auto",
  };

  const anchored: CSSProperties = {
    ...baseStyles,
    right: "auto",
    bottom: "auto",
    transform: "none",
  };

  if (isDragging && dragPosition) {
    return { ...anchored, left: `${dragPosition.x}px`, top: `${dragPosition.y}px` };
  }
  if (barPosition) {
    return { ...anchored, left: `${barPosition.x}px`, top: `${barPosition.y}px` };
  }
  return {
    ...baseStyles,
    top: "15px",
    right: "15rem",
    left: "auto",
    bottom: "auto",
    transform: "none",
  };
}

async function runFloatingBarCtiOperation(
  setBusy: (v: boolean) => void,
  operation: () => Promise<FloatingBarCtiResult>,
  logLabel: string,
): Promise<void> {
  setBusy(true);
  try {
    const result = await operation();
    if (!result.success) {
      console.error(`[GlobalFloatingCallBar] ${logLabel} failed:`, result.error);
    }
  } catch (error) {
    console.error(`[GlobalFloatingCallBar] ${logLabel} error:`, error);
  } finally {
    setBusy(false);
  }
}

function buildFloatingBarSignedCallPayload(
  activeCall: FloatingBarCtiCall,
  controller: FloatingBarControllerDevice,
) {
  return {
    callId: activeCall.callId!,
    callingAddress: activeCall.callingAddress!,
    calledAddress: activeCall.calledAddress || activeCall.number,
    callingDeviceType: activeCall.callingDeviceType || "SOFT_HARD",
    callingDeviceName: activeCall.callingDeviceName || "WebCTI",
    controllerAddress: controller.controllerAddress,
    controllerDeviceName: controller.controllerDeviceName,
    controllerDeviceType: controller.controllerDeviceType,
  };
}


// Add styles for the floating call bar
const floatingBarStyles = `
  .global-floating-call-bar {
    animation: slideUp 0.3s ease-out;
    user-select: none;
    list-style: none;
    /* Position is controlled by inline styles from sectionStyle so drag-snap is respected */
    box-shadow:0px 2px 5px #c7c0c0 !important;
  }
  .global-floating-call-bar * {
    list-style: none;
  }
  
  .global-floating-call-bar:hover {
    // box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15) !important;
  }
  
  .global-floating-call-bar.dragging {
    cursor: grabbing !important;
    opacity: 0.9;
    /* Allow inline/CSS variable position to take effect during drag */
    top: var(--bar-drag-top, 15px) !important;
    left: var(--bar-drag-left, auto) !important;
    right: var(--bar-drag-right, 15rem) !important;
    width: auto !important;
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .global-floating-call-bar .call-status-ringing {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .call-bar-drag-handle {
    cursor: grab;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  
  .call-bar-drag-handle:hover {
    opacity: 1;
  }
  
  .call-bar-drag-handle:active {
    cursor: grabbing;
  }
`;

const GlobalFloatingCallBar: React.FC = () => {
  const {
    isInitialized,
    userAddress,
    activeCalls,
    dnsMap,
    callStateMap,
    eventLog,
    formatDuration,
    endCall,
    holdCall,
    resumeCall,
    transferCall,
    getAvailableExtensions,
    getUserDataExtensions,
  } = useCti();

  const { hasPermission } = usePermissions();
  const {
    showIncomingCallModal: showIncomingCallModalFromContext,
    incomingCall: incomingCallFromContext,
    setIncomingCall: setIncomingCallContext,
    setShowIncomingCallModal: setShowIncomingCallModalContext,
  } = useIncomingCall();
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [isHoldingCall, setIsHoldingCall] = useState(false);
  const [isResumingCall, setIsResumingCall] = useState(false);
  const [isTransferringCall, setIsTransferringCall] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [extensionSearch, setExtensionSearch] = useState("");
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callingAddress: string;
    calledAddress: string;
    controllerAddress: string;
    controllerDeviceName: string;
    controllerDeviceType: string;
    startTime: Date;
  } | null>(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);

  const incomingTimerRef = useGlobalFloatingBarIncomingCall({
    eventLog,
    userAddress,
    dnsMap,
    showIncomingCallModal,
    incomingCall,
    setIncomingCall,
    setIncomingCallContext,
    setShowIncomingCallModal,
    setShowIncomingCallModalContext,
  });

  // Layout / IncomingCallContext may clear the modal (e.g. auto-close when answered elsewhere)
  // without touching this component's local duplicate state — keep them aligned so the bar
  // does not reappear with stale inbound controls.
  useEffect(() => {
    if (showIncomingCallModalFromContext) {
      return;
    }
    setShowIncomingCallModal(false);
    setIncomingCall(null);
    clearFloatingBarIncomingTimer(incomingTimerRef);
  }, [showIncomingCallModalFromContext, incomingTimerRef]);

  // Drag and position state – free (x,y) position; null = use default top-right
  const [barPosition, setBarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastDragPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Load saved position from localStorage (free x,y or legacy edge key)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("callBarPosition");
      if (!saved) return;
      const parsed = JSON.parse(saved) as { x?: number; y?: number } | string;
      if (parsed && typeof parsed === "object" && typeof parsed.x === "number" && typeof parsed.y === "number") {
        setBarPosition({ x: parsed.x, y: parsed.y });
      }
    } catch {
      // ignore invalid JSON or legacy "top"/"bottom" etc.
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    if (barPosition) {
      localStorage.setItem("callBarPosition", JSON.stringify(barPosition));
    }
  }, [barPosition]);

  // Keep ref in sync for use inside global mouseup (avoids stale closure)
  isDraggingRef.current = isDragging;

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return;

    const rect = barRef.current.getBoundingClientRect();
    // Use stored position when available to avoid jump when switching from right:15rem to left/top
    const initial = barPosition
      ? { x: barPosition.x, y: barPosition.y }
      : { x: Math.round(rect.left), y: Math.round(rect.top) };
    isDraggingRef.current = true;
    lastDragPositionRef.current = initial;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - initial.x,
      y: e.clientY - initial.y,
    });
    setDragPosition(initial);
    e.preventDefault();
    e.stopPropagation();
  }, [barPosition]);

  // Handle drag end – use last displayed drag position to avoid jump (getBoundingClientRect can differ)
  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current || !barRef.current) return;
    isDraggingRef.current = false;

    const barRect = barRef.current.getBoundingClientRect();
    setDragPosition(null);
    setIsDragging(false);
    const saved = lastDragPositionRef.current ?? { x: barRect.left, y: barRect.top };
    lastDragPositionRef.current = null;
    setBarPosition(saved);
  }, []);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newLeft = e.clientX - dragStart.x;
      const newTop = e.clientY - dragStart.y;
      const pos = { x: newLeft, y: newTop };
      lastDragPositionRef.current = pos;
      setDragPosition(pos);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    globalThis.addEventListener("mousemove", handleMouseMove);
    globalThis.addEventListener("mouseup", handleMouseUp);
    globalThis.addEventListener("mouseleave", handleMouseUp); // Handle mouse leaving window

    return () => {
      globalThis.removeEventListener("mousemove", handleMouseMove);
      globalThis.removeEventListener("mouseup", handleMouseUp);
      globalThis.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDragging, dragStart, handleDragEnd]);

  const sectionStyle = useMemo((): CSSProperties => {
    const base = buildFloatingBarPositionStyles(barPosition, isDragging, dragPosition);
    if (isDragging && dragPosition) {
      return {
        ...base,
        "--bar-drag-left": `${dragPosition.x}px`,
        "--bar-drag-top": `${dragPosition.y}px`,
        "--bar-drag-right": "auto",
      } as CSSProperties;
    }
    return base;
  }, [barPosition, isDragging, dragPosition]);

  const {
    activeCall,
    canCurrentUserResumeCall,
    connectedElapsedDisplay,
    otherPartyNumber,
    activeCallUserName,
    activeCallUserImageUrl,
  } = useGlobalFloatingCallBarDerived({
    activeCalls: activeCalls as Map<string, FloatingBarCtiCall>,
    userAddress,
    callStateMap: callStateMap as UseGlobalFloatingCallBarDerivedParams["callStateMap"],
    eventLog: eventLog as UseGlobalFloatingCallBarDerivedParams["eventLog"],
    dnsMap,
    formatDuration,
    getUserDataExtensions,
  });

  const shouldShowFloatingBar =
    isInitialized && hasPermission("dial-call-cti");

  const floatingBarVisible =
    shouldShowFloatingBar &&
    Boolean(activeCall) &&
    !showIncomingCallModalFromContext &&
    !incomingCallFromContext;

  const closeTransferModal = useCallback(() => {
    setShowTransferModal(false);
    setTransferTarget("");
    setExtensionSearch("");
  }, []);

  const transferCandidates = useMemo(
    () =>
      getAvailableExtensions().filter(
        (ext) =>
          !isExtensionBusyOnCalls(ext, activeCalls as Map<string, FloatingBarCtiCall>),
      ),
    [getAvailableExtensions, activeCalls],
  );

  const handleEndCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddress, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsEndingCall,
      () => endCall(payload as Parameters<typeof endCall>[0]),
      "endCall",
    );
  };

  const handleHoldCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddress, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsHoldingCall,
      () => holdCall(payload as Parameters<typeof holdCall>[0]),
      "holdCall",
    );
  };

  const handleResumeCall = async () => {
    if (!activeCall?.callId) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddress, dnsMap);
    if (!controllerDevice) {
      return;
    }
    const payload = buildFloatingBarSignedCallPayload(activeCall, controllerDevice);
    await runFloatingBarCtiOperation(
      setIsResumingCall,
      () => resumeCall(payload as Parameters<typeof resumeCall>[0]),
      "resumeCall",
    );
  };

  const handleTransferCall = async () => {
    if (!activeCall?.callId || !transferTarget.trim()) {
      return;
    }
    const controllerDevice = getFloatingBarControllerDeviceInfo(activeCall, userAddress, dnsMap);
    if (!controllerDevice) {
      return;
    }
    if (isExtensionBusyOnCalls(transferTarget, activeCalls as Map<string, FloatingBarCtiCall>)) {
      return;
    }

    setIsTransferringCall(true);
    try {
      const transferAddress =
        getRemotePartyDnForTransfer(userAddress, activeCall.callingAddress, activeCall.calledAddress) ||
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

  // Don't render anything if CTI is not initialized or user doesn't have permission
  if (!isInitialized || !hasPermission("dial-call-cti")) {
    return null;
  }

  return (
    <>
      <style>{floatingBarStyles}</style>
      {/* Bar: transfer initiator / connected party. Hidden for transfer recipient while attend/reject
          session exists or their leg is an inbound offer (see isInboundAwaitingUserAnswerForFloatingBar). */}
      {floatingBarVisible && activeCall ? (
        <>
          <FloatingBarActiveCallSection
            barRef={barRef}
            isDragging={isDragging}
            dragPosition={dragPosition}
            sectionStyle={sectionStyle}
            onDragStart={handleDragStart}
            activeCall={activeCall}
            activeCallUserImageUrl={activeCallUserImageUrl}
            activeCallUserName={activeCallUserName}
            otherPartyNumber={otherPartyNumber}
            connectedElapsedDisplay={connectedElapsedDisplay}
            canCurrentUserResumeCall={canCurrentUserResumeCall}
            canTransferCall={hasPermission("transfer-call-cti")}
            isHoldingCall={isHoldingCall}
            isResumingCall={isResumingCall}
            isEndingCall={isEndingCall}
            onHoldCall={handleHoldCall}
            onResumeCall={handleResumeCall}
            onEndCall={handleEndCall}
            onOpenTransferModal={() => setShowTransferModal(true)}
          />
          <FloatingBarTransferModal
            show={showTransferModal}
            onHide={closeTransferModal}
            extensionSearch={extensionSearch}
            onExtensionSearchChange={setExtensionSearch}
            transferTarget={transferTarget}
            onTransferTargetChange={setTransferTarget}
            transferCandidates={transferCandidates}
            dnsMap={dnsMap}
            getUserDataExtensions={
              getUserDataExtensions as FloatingBarTransferModalProps["getUserDataExtensions"]
            }
            onTransfer={handleTransferCall}
            isTransferring={isTransferringCall}
          />
        </>
      ) : null}
    </>
  );
};

export default GlobalFloatingCallBar;
