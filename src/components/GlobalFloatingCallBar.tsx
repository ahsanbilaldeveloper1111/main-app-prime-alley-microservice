"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { useCti } from "../contexts/CtiContext";
import { getRemotePartyDnForTransfer } from "../utils/dialer";
import { usePermissions } from "../utils/permissionUtils";
import { useIncomingCall } from "../contexts/IncomingCallContext";
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import { parseCallAnswerStartTimeUtc } from "@components/live-calls/utils/helpers";
import {
  pickFloatingBarCall,
  type FloatingBarCallStateEntry,
  type FloatingBarCtiCall,
  type FloatingBarEventLogEntry,
} from "./globalFloatingCallBarHelpers";
import {
  clearFloatingBarIncomingTimer,
  useGlobalFloatingBarIncomingCall,
} from "../hooks/useGlobalFloatingBarIncomingCall";


// Add styles for the floating call bar
const floatingBarStyles = `
  .global-floating-call-bar {
    animation: slideUp 0.3s ease-out;
    user-select: none;
    list-style: none;
    /* Position is controlled by inline styles from getPositionStyles() so drag-snap is respected */
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

  // Get position styles – free (x,y) when set or dragging, else default top-right
  const getPositionStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
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

    if (isDragging && dragPosition) {
      baseStyles.left = `${dragPosition.x}px`;
      baseStyles.top = `${dragPosition.y}px`;
      baseStyles.right = "auto";
      baseStyles.bottom = "auto";
      baseStyles.transform = "none";
      return baseStyles;
    }

    if (barPosition) {
      baseStyles.left = `${barPosition.x}px`;
      baseStyles.top = `${barPosition.y}px`;
      baseStyles.right = "auto";
      baseStyles.bottom = "auto";
      baseStyles.transform = "none";
      return baseStyles;
    }

    // Default: top-right (no saved position)
    baseStyles.top = "15px";
    baseStyles.right = "15rem";
    baseStyles.left = "auto";
    baseStyles.bottom = "auto";
    baseStyles.transform = "none";
    return baseStyles;
  }, [barPosition, isDragging, dragPosition]);

  const getControllerDeviceInfo = useCallback((call: FloatingBarCtiCall | null | undefined) => {
    if (!call || !userAddress || !dnsMap) {
      return null;
    }

    const isCaller = call.callingAddress === userAddress;
    const isCalled = call.calledAddress === userAddress;

    if (!isCaller && !isCalled) {
      return null;
    }

    const devices = dnsMap[userAddress]?.devices;
    if (!devices) {
      return null;
    }

    const userDevices = Object.values(devices);
    if (userDevices.length === 0) {
      return null;
    }

    let activeDevice =
      isCaller && call.callingDeviceName
        ? userDevices.find((device) => device.deviceName === call.callingDeviceName)
        : undefined;

    if (!activeDevice) {
      activeDevice =
        userDevices.find((device) => device.terminalState === "REGISTERED") || userDevices[0];
    }

    return {
      controllerAddress: userAddress,
      controllerDeviceName: activeDevice.deviceName || "WebCTI",
      controllerDeviceType: activeDevice.deviceType || "SOFT_HARD",
    };
  }, [userAddress, dnsMap]);

  const activeCall = useMemo(
    () =>
      pickFloatingBarCall(
        activeCalls as Map<string, FloatingBarCtiCall>,
        userAddress,
        callStateMap as Record<string, FloatingBarCallStateEntry> | undefined,
        eventLog as FloatingBarEventLogEntry[] | undefined
      ),
    [activeCalls, userAddress, callStateMap, eventLog]
  );

  // Only the party who put the call on hold can resume (not the held party). If our party is ON_HOLD we were held by the other side -> hide Resume. Caller who put on hold can resume.
  const canCurrentUserResumeCall = React.useMemo(() => {
    if (!activeCall?.callId || activeCall.status !== "onHold" || !userAddress) {
      return false;
    }
    const callId = activeCall.callId;
    const callState = callStateMap?.[callId];
    if (!callState) return false;
    const heldByAddress = callState.heldByAddress;
    if (heldByAddress !== undefined) {
      return userAddress === heldByAddress;
    }
    const parties: NonNullable<FloatingBarCallStateEntry["parties"]> = callState.parties ?? [];
    const ourParty = parties.find(
      (p) => p.callingAddress === userAddress || p.calledAddress === userAddress
    );
    if (ourParty) {
      if (ourParty.callStatus === "ON_HOLD") {
        return ourParty.callingAddress === userAddress;
      }
      return true;
    }
    return false;
  }, [activeCall, userAddress, callStateMap]);

  // Real-time duration update for active calls
  const [currentDuration, setCurrentDuration] = React.useState<number | null>(null);
  
  React.useEffect(() => {
    if (activeCall?.status !== "connected") {
      setCurrentDuration(null);
      return;
    }

    // Calculate initial duration
    const calculateDuration = () => {
      const callId = activeCall.callId;
      if (!callId || !callStateMap?.[callId]) {
        return activeCall.duration || 0;
      }

      const callState = callStateMap[callId];
      const startTime = parseCallAnswerStartTimeUtc(callState, activeCall.startTime);
      if (startTime) {
        const now = new Date();
        return Math.max(0, Math.round((now.getTime() - startTime.getTime()) / 1000));
      }
      
      return activeCall.duration || 0;
    };

    // Set initial duration
    setCurrentDuration(calculateDuration());

    // Update every second
    const interval = setInterval(() => {
      setCurrentDuration(calculateDuration());
    }, 1000);

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

  // Determine the other party's number (the person we're talking to, not ourselves)
  const otherPartyNumber = React.useMemo(() => {
    if (!activeCall || !userAddress) {
      return activeCall?.number || null;
    }
    
    // If user is the calling party, show the called party's number
    if (activeCall.callingAddress === userAddress && activeCall.calledAddress) {
      return activeCall.calledAddress;
    }
    
    // If user is the called party, show the calling party's number
    if (activeCall.calledAddress === userAddress && activeCall.callingAddress) {
      return activeCall.callingAddress;
    }
    
    // Fallback to number field
    return activeCall.number || null;
  }, [activeCall, userAddress]);

  // Get user extension data for the other party's number
  const activeCallUserData = React.useMemo(() => {
    if (!activeCall || !otherPartyNumber || !getUserDataExtensions) {
      return null;
    }
    
    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const callNumber = otherPartyNumber;
      const dnString = String(callNumber);
      const dnNumber = Number(callNumber);
      
      // Try different DN formats to match the key
      const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
      
      return data;
    } catch (error) {
      console.error(`[GlobalFloatingCallBar] Error getting extension data for ${otherPartyNumber}:`, error);
      return null;
    }
  }, [activeCall, otherPartyNumber, getUserDataExtensions]);

  // Get user name from extension data
  const activeCallUserName = React.useMemo(() => {
    if (!activeCallUserData) {
      return otherPartyNumber || "Unknown";
    }
    return activeCallUserData.name || activeCallUserData.user_name || otherPartyNumber || "Unknown";
  }, [activeCallUserData, otherPartyNumber]);

  // Get user image URL
  const activeCallUserImageUrl = React.useMemo(() => {
    if (!activeCallUserData) {
      return UserDummyImage.src;
    }
    
    const imagePath = activeCallUserData?.image_path;
    if (imagePath) {
      const url = getStorageImageUrl(imagePath);
      return url || UserDummyImage.src;
    }
    return UserDummyImage.src;
  }, [activeCallUserData]);

  // Get incoming call user extension data
  const shouldShowFloatingBar =
    isInitialized && hasPermission("dial-call-cti");

  const handleEndCall = async () => {
    if (!activeCall?.callId) {
      return;
    }

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      return;
    }

    setIsEndingCall(true);
    try {
      const result = await endCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || "SOFT_HARD",
        callingDeviceName: activeCall.callingDeviceName || "WebCTI",
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as Parameters<typeof endCall>[0]);

      if (!result.success) {
        console.error("[GlobalFloatingCallBar] endCall failed:", result.error);
      }
    } catch (error) {
      console.error("[GlobalFloatingCallBar] endCall error:", error);
    } finally {
      setIsEndingCall(false);
    }
  };

  const handleHoldCall = async () => {
    if (!activeCall?.callId) {
      return;
    }

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      return;
    }

    setIsHoldingCall(true);
    try {
      const result = await holdCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || "SOFT_HARD",
        callingDeviceName: activeCall.callingDeviceName || "WebCTI",
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as Parameters<typeof holdCall>[0]);

      if (!result.success) {
        console.error("[GlobalFloatingCallBar] holdCall failed:", result.error);
      }
    } catch (error) {
      console.error("[GlobalFloatingCallBar] holdCall error:", error);
    } finally {
      setIsHoldingCall(false);
    }
  };

  const handleResumeCall = async () => {
    if (!activeCall?.callId) {
      return;
    }

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      return;
    }

    setIsResumingCall(true);
    try {
      const result = await resumeCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || "SOFT_HARD",
        callingDeviceName: activeCall.callingDeviceName || "WebCTI",
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as Parameters<typeof resumeCall>[0]);

      if (!result.success) {
        console.error("[GlobalFloatingCallBar] resumeCall failed:", result.error);
      }
    } catch (error) {
      console.error("[GlobalFloatingCallBar] resumeCall error:", error);
    } finally {
      setIsResumingCall(false);
    }
  };

  const handleTransferCall = async () => {
    if (!activeCall?.callId || !transferTarget.trim()) {
      return;
    }

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      return;
    }

    const targetCall = Array.from(activeCalls.values()).find(
      (c) =>
        c.number === transferTarget &&
        ["connected", "ringing", "dialing"].includes(c.status)
    );

    if (targetCall) {
      return;
    }

    setIsTransferringCall(true);
    try {
      const transferAddress =
        getRemotePartyDnForTransfer(userAddress, activeCall.callingAddress, activeCall.calledAddress) ||
        activeCall.calledAddress ||
        activeCall.number
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
        setShowTransferModal(false);
        setTransferTarget("");
        setExtensionSearch("");
      } else {
        console.error("[GlobalFloatingCallBar] transferCall failed:", result.error);
      }
    } catch (error) {
      console.error("[GlobalFloatingCallBar] transferCall error:", error);
    } finally {
      setIsTransferringCall(false);
    }
  };

  const getAvailableExtensionsForTransfer = () => {
    return getAvailableExtensions().filter((ext) => {
      // Filter out extensions that are currently in calls
      const isInCall = Array.from(activeCalls.values()).some(
        (call) =>
          call.number === ext &&
          ["connected", "ringing", "dialing"].includes(call.status)
      );
      return !isInCall;
    });
  };

  // Don't render anything if CTI is not initialized or user doesn't have permission
  if (!isInitialized || !hasPermission("dial-call-cti")) {
    return null;
  }

  return (
    <>
      <style>{floatingBarStyles}</style>
      {/* Floating Call Bar - Hide when incoming call modal is open */}
      {shouldShowFloatingBar && activeCall && !showIncomingCallModalFromContext && (
        <>
        <section aria-label="Active call">
        <div
          ref={barRef}
          className={`global-floating-call-bar ${isDragging ? "dragging" : ""}`}
          style={{
            ...getPositionStyles(),
            ...(isDragging && dragPosition
              ? {
                  "--bar-drag-left": `${dragPosition.x}px`,
                  "--bar-drag-top": `${dragPosition.y}px`,
                  "--bar-drag-right": "auto",
                }
              : {}),
          }}
        >
          <button
            type="button"
            className="call-bar-drag-handle btn btn-link p-0 me-1 border-0 d-flex align-items-center justify-content-center"
            aria-label="Drag to move call bar"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleDragStart(e);
            }}
            style={{ minWidth: "1.5rem", minHeight: "2.5rem", color: "#64748b" }}
          >
            <i className="material-icons-two-tone" style={{ fontSize: "1.25rem" }}>
              drag_indicator
            </i>
          </button>
          {/* Contact Info Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flex: 1,
              flexDirection: "row",
              minWidth: 0,
              top:"0",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Avatar */}
            <div
              className="position-relative"
              style={{
                width: "3rem",
                height: "3rem",
                minWidth: "3rem",
                flexShrink: 0,
              }}
            >
              {activeCallUserImageUrl && activeCallUserImageUrl !== UserDummyImage.src ? (
                <img
                  src={activeCallUserImageUrl}
                  alt={activeCallUserName}
                  className="rounded-circle"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = UserDummyImage.src;
                  }}
                />
              ) : (
                <img
                  src={UserDummyImage.src}
                  alt={activeCallUserName}
                  className="rounded-circle"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    border: "2px solid #e5e7eb",
                  }}
                />
              )}
            </div>

            {/* Contact Details */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeCallUserName}
                </h3>
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#94a3b8",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {otherPartyNumber}
                </div>
                {/* Optional: Add contact label/group here if available */}

                {/* Status Text */}
            {activeCall.status === "connected" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: "row",
                }}
              >
                <span className="text-success" style={{ fontWeight: "500" }}>Connected</span>
                <span style={{ color: "#94a3b8" }}>{connectedElapsedDisplay}</span>
              </div>
            )}

              </div>
          </div>

          {/* Call Status Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              flexDirection: "row",
              gap: "10px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {activeCall.status === "ringing" && (
              <div
                className="call-status-ringing"
                style={{
                  fontSize: "0.75rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: "row",
                }}
              >
                <span className="text-success" style={{ fontWeight: "500" }}>Outgoing call</span>
                <span className="bg-success rounded-circle" style={{ width: "0.375rem", height: "0.375rem" }}></span>
                <span style={{ color: "#94a3b8" }}>Ringing...</span>
              </div>
            )}
            {activeCall.status === "dialing" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: "row",
                }}
              >
                <span style={{ color: "#94a3b8" }}>Dialing...</span>
              </div>
            )}
          </div>

          {/* Call Control Buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              flexDirection: "row",
              position: "relative",
              zIndex: 1,
            }}
          >
{activeCall.status === "onHold" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#F4C22B",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: "row",
                }}
              >
                <span>On Hold</span>
              </div>
            )}

            {/* Additional Controls for Connected Calls */}
            {activeCall.status === "connected" && (
              <>

              
                <button
                  type="button"
                  tabIndex={0}
                  disabled={isHoldingCall}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHoldCall();
                  }}
                  className="btn rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#475569",
                    cursor: isHoldingCall ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isHoldingCall) e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  title="Hold Call"
                >
                  {isHoldingCall ? (
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: "1.25rem", height: "1.25rem", borderWidth: "2px", color: "#475569" }} />
                  ) : (
                    <i
                      className="material-icons-two-tone"
                      style={{ fontSize: "1.25rem", color: "#475569" }}
                    >
                      pause
                    </i>
                  )}
                </button>
                {hasPermission("transfer-call-cti") && (
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransferModal(true);
                  }}
                  className="btn rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e2e8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  title="Transfer Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1.25rem", color: "#475569" }}
                  >
                    call_made
                  </i>
                </button>
                )}
              </>
            )}

            {activeCall.status === "onHold" && canCurrentUserResumeCall && (
              <button
                type="button"
                tabIndex={0}
                disabled={isResumingCall}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResumeCall();
                }}
                className="btn rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "3rem",
                  height: "3rem",
                  backgroundColor: "#f1f5f9",
                  border: "none",
                  color: "#475569",
                  cursor: isResumingCall ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isResumingCall) e.currentTarget.style.backgroundColor = "#e2e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                }}
                title="Resume Call"
              >
                {isResumingCall ? (
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: "1.25rem", height: "1.25rem", borderWidth: "2px", color: "#475569" }} />
                ) : (
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1.25rem", color: "#475569" }}
                  >
                    play_arrow
                  </i>
                )}
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              tabIndex={0}
              disabled={isEndingCall}
              onClick={(e) => {
                e.stopPropagation();
                handleEndCall();
              }}
              className="btn btn-danger btn-sm rounded-1 d-flex align-items-center gap-1"
              onMouseEnter={(e) => {
                if (!isEndingCall) e.currentTarget.style.boxShadow = "0 6px 8px -1px rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(239,68,68,0.3)";
              }}
              title="End Call"
            >
              {isEndingCall ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} />
                  {" "}
                  Ending...
                </>
              ) : (
                <>
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1rem", color: "#fff", backgroundColor: "#fff" }}
                  >
                    call_end
                  </i>{" "}
                  End Call
                </>
              )}
            </button>
          </div>
        </div>
        </section>

        {/* Transfer Call Modal - shown with call bar */}
        <Modal
          show={showTransferModal}
          onHide={() => {
            setShowTransferModal(false);
            setTransferTarget("");
            setExtensionSearch("");
          }}
          centered
          size="sm"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="material-icons-two-tone me-2">call_made</i>{" "}
              Transfer Call
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                Select Target Extension
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Search extensions..."
                value={extensionSearch}
                onChange={(e) => setExtensionSearch(e.target.value)}
                className="mb-2"
              />
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {getAvailableExtensionsForTransfer()
                  .filter(
                    (ext) =>
                      extensionSearch === "" ||
                      ext.toLowerCase().includes(extensionSearch.toLowerCase())
                  )
                  .filter((ext) =>
                    Object.values(dnsMap?.[ext]?.devices || {}).some(
                      (d: any) => d.terminalState === "REGISTERED"
                    )
                  )
                  .sort((extA, extB) => {
                    const isOnline = (e: string) =>
                      Object.values(dnsMap?.[e]?.devices || {}).some(
                        (d: any) => d.terminalState === "REGISTERED"
                      );
                    const aOnline = isOnline(extA);
                    const bOnline = isOnline(extB);
                    if (aOnline && !bOnline) return -1;
                    if (!aOnline && bOnline) return 1;
                    return 0;
                  })
                  .map((ext) => {
                    const extensionData = dnsMap?.[ext];
                    const deviceList = extensionData
                      ? Object.values(extensionData.devices || {})
                      : [];
                    const isOnline = deviceList.some(
                      (d: any) => d.terminalState === "REGISTERED"
                    );
                    const userDataExtensions = getUserDataExtensions?.() || {};
                    const dnString = String(ext);
                    const dnNumber = Number(ext);
                    const userData = userDataExtensions[ext] || userDataExtensions[dnString] || userDataExtensions[dnNumber];
                    const name = userData?.name || userData?.user_name;
                    const displayName = name ? `${name} (${ext})` : ext;

                    return (
                      <Button
                        key={ext}
                        variant={
                          transferTarget === ext ? "primary" : "outline-primary"
                        }
                        size="sm"
                        className="w-100 mb-2"
                        onClick={() => setTransferTarget(ext)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold">{displayName}</span>
                          <small
                            className={isOnline ? "text-success" : "text-muted"}
                          >
                            {isOnline ? "ONLINE" : "OFFLINE"}
                          </small>
                        </div>
                      </Button>
                    );
                  })}
              </div>
              {getAvailableExtensionsForTransfer().length === 0 && (
                <div className="alert alert-warning py-2">
                  <i className="material-icons-two-tone me-2">warning</i>
                  <small>No available extensions for transfer</small>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="default"
              onClick={() => {
                setShowTransferModal(false);
                setTransferTarget("");
                setExtensionSearch("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleTransferCall}
              disabled={!transferTarget || isTransferringCall}
            >
              {isTransferringCall ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" style={{ width: "1rem", height: "1rem", borderWidth: "2px" }} />
                  {" "}
                  Transferring...
                </>
              ) : (
                "Transfer"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
        </>
      )}
    </>
  );
};

export default GlobalFloatingCallBar;
