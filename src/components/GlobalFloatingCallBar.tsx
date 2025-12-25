"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { useCti } from "../contexts/CtiContext";
import { usePermissions } from "../utils/permissionUtils";
import { toast } from "react-toastify";
import DeviceSelectionModal from "./DeviceSelectionModal";
import { useRouter } from "next/router";
import { useDialerModal } from "../contexts/DialerModalContext";
import moment from "moment-timezone";


type CallBarPosition = "bottom" | "top" | "left" | "right";

// Add styles for the floating call bar
const floatingBarStyles = `
  .global-floating-call-bar {
    animation: slideUp 0.3s ease-out;
    user-select: none;
    list-style: none;
  }
  
  .global-floating-call-bar * {
    list-style: none;
  }
  
  .global-floating-call-bar:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15) !important;
  }
  
  .global-floating-call-bar.dragging {
    cursor: grabbing !important;
    opacity: 0.9;
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
    formatDuration,
    makeCall,
    dialNumber, // Use dialNumber for simplified calls
    endCall,
    holdCall,
    resumeCall,
    transferCall,
    getCallingDeviceInfo,
    getAvailableExtensions,
  } = useCti();

  const { hasPermission } = usePermissions();
  const router = useRouter();
  const { isOpen: showDialerModal, closeDialer, openDialer } = useDialerModal();
  const [dialedNumber, setDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] =
    useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");
  const [extensionSearch, setExtensionSearch] = useState("");

  // Drag and position state
  const [position, setPosition] = useState<CallBarPosition>("bottom");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem("callBarPosition") as CallBarPosition;
    if (savedPosition && ["bottom", "top", "left", "right"].includes(savedPosition)) {
      setPosition(savedPosition);
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem("callBarPosition", position);
  }, [position]);

  // Helper function to get initials from phone number or name
  const getInitials = useCallback((number: string): string => {
    // Try to extract initials from number (e.g., "503-300-1940" -> "53" or use first 2 digits)
    const digits = number.replaceAll(/\D/g, "");
    if (digits.length >= 2) {
      return digits.slice(0, 2).toUpperCase();
    }
    // Fallback: use first two characters
    return number.slice(0, 2).toUpperCase().replaceAll(/\s/g, "");
  }, []);

  // Format phone number for display
  const formatPhoneNumber = useCallback((number: string): string => {
    // If it's an E.164 number (starts with +), return as-is
    if (number.startsWith("+")) {
      return number;
    }
    
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    const digits = number.replaceAll(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // For extensions or other formats, return as-is
    return number;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    if (!barRef.current) return;
    
    const rect = barRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle drag end and determine new position
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !barRef.current) return;
    
    const barRect = barRef.current.getBoundingClientRect();
    const windowWidth = globalThis.innerWidth;
    const windowHeight = globalThis.innerHeight;
    
    // Check if bar is completely outside viewport
    if (
      barRect.right < 0 ||
      barRect.left > windowWidth ||
      barRect.bottom < 0 ||
      barRect.top > windowHeight
    ) {
      setDragPosition(null);
      setIsDragging(false);
      setPosition("bottom");
      return;
    }
    
    // Calculate which edge is closest based on current bar position
    const centerX = barRect.left + barRect.width / 2;
    const centerY = barRect.top + barRect.height / 2;
    
    const distToTop = centerY;
    const distToBottom = windowHeight - centerY;
    const distToLeft = centerX;
    const distToRight = windowWidth - centerX;
    
    const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
    
    let newPosition: CallBarPosition = "bottom";
    if (minDist === distToTop) {
      newPosition = "top";
    } else if (minDist === distToBottom) {
      newPosition = "bottom";
    } else if (minDist === distToLeft) {
      newPosition = "left";
    } else if (minDist === distToRight) {
      newPosition = "right";
    }
    
    // Clear drag position and update position state - React will handle the styling
    setDragPosition(null);
    setIsDragging(false);
    setPosition(newPosition);
  }, [isDragging]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new position maintaining the offset from where drag started
      const newLeft = e.clientX - dragStart.x;
      const newTop = e.clientY - dragStart.y;
      
      // Get bar dimensions for constraints
      const barWidth = barRef.current?.getBoundingClientRect().width || 400;
      const barHeight = barRef.current?.getBoundingClientRect().height || 60;
      
      // Constrain to viewport with some padding
      const padding = 10;
      const maxLeft = globalThis.innerWidth - barWidth - padding;
      const maxTop = globalThis.innerHeight - barHeight - padding;
      
      const constrainedLeft = Math.max(padding, Math.min(newLeft, maxLeft));
      const constrainedTop = Math.max(padding, Math.min(newTop, maxTop));
      
      // Update drag position state - React will handle styling
      setDragPosition({ x: constrainedLeft, y: constrainedTop });
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

  // Get position styles based on current position or drag position
  const getPositionStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 1050,
      backgroundColor: "#fff", // White background
      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.15)",
      display: "flex",
      alignItems: "center",
      transition: isDragging ? "none" : "all 0.3s ease",
      cursor: isDragging ? "grabbing" : "default",
      border: "1px solid #e0e0e0",
      visibility: "visible",
      opacity: 1,
    };

    // If dragging, use drag position but preserve original layout
    if (isDragging && dragPosition) {
      const wasVertical = position === "left" || position === "right";
      
      baseStyles.left = `${dragPosition.x}px`;
      baseStyles.top = `${dragPosition.y}px`;
      baseStyles.right = "auto";
      baseStyles.bottom = "auto";
      baseStyles.transform = "none";
      
      // Preserve the original flex direction based on position before drag
      if (wasVertical) {
        baseStyles.flexDirection = "column";
        baseStyles.borderRadius = "20px";
        baseStyles.padding = "12px 10px";
        baseStyles.gap = "10px";
        baseStyles.minWidth = "70px";
        baseStyles.maxWidth = "85px";
      } else {
        baseStyles.flexDirection = "row";
        baseStyles.borderRadius = "24px";
        baseStyles.padding = "10px 16px";
        baseStyles.gap = "12px";
        baseStyles.minWidth = "320px";
        baseStyles.maxWidth = "450px";
        baseStyles.width = "auto";
      }
      
      return baseStyles;
    }

    // Otherwise, use position state
    const isVertical = position === "left" || position === "right";
    
    baseStyles.borderRadius = isVertical ? "20px" : "24px";
    baseStyles.padding = isVertical ? "12px 10px" : "10px 16px";
    baseStyles.gap = isVertical ? "10px" : "12px";

    if (isVertical) {
      baseStyles.flexDirection = "column";
      baseStyles.minWidth = "70px";
      baseStyles.maxWidth = "85px";
      if (position === "left") {
        baseStyles.left = "20px";
        baseStyles.top = "50%";
        baseStyles.transform = "translateY(-50%)";
        baseStyles.right = "auto";
        baseStyles.bottom = "auto";
      } else {
        baseStyles.right = "20px";
        baseStyles.top = "50%";
        baseStyles.transform = "translateY(-50%)";
        baseStyles.left = "auto";
        baseStyles.bottom = "auto";
      }
    } else {
      baseStyles.flexDirection = "row";
      baseStyles.minWidth = "320px";
      baseStyles.maxWidth = "450px";
      baseStyles.width = "auto";
      if (position === "bottom") {
        baseStyles.bottom = "20px";
        baseStyles.left = "50%";
        baseStyles.transform = "translateX(-50%)";
        baseStyles.top = "auto";
        baseStyles.right = "auto";
      } else {
        baseStyles.top = "20px";
        baseStyles.left = "50%";
        baseStyles.transform = "translateX(-50%)";
        baseStyles.bottom = "auto";
        baseStyles.right = "auto";
      }
    }

    return baseStyles;
  }, [position, isDragging, dragPosition]);

  // Get the first active call (for display) - prefer connected calls, include onHold
  // Filter to only show calls involving the current user's phone number
  const activeCall = React.useMemo(() => {
    const call = Array.from(activeCalls.values())
      .filter((call) => {
        // Only show calls where the user is involved (callingAddress or calledAddress matches userAddress)
        const involvesUser = userAddress && (
          call.callingAddress === userAddress || 
          call.calledAddress === userAddress
        );
        
        // Also filter by status
        const hasValidStatus = ["connected", "ringing", "dialing", "onHold"].includes(call.status);
        
        return involvesUser && hasValidStatus;
      })
      .sort((a, b) => {
        // Prioritize connected calls, then onHold, then ringing
        if (a.status === "connected" && b.status !== "connected") return -1;
        if (b.status === "connected" && a.status !== "connected") return 1;
        if (a.status === "onHold" && !["connected"].includes(b.status)) return -1;
        if (b.status === "onHold" && !["connected"].includes(a.status)) return 1;
        return 0;
      })[0];
      if(call)
      {
        call.duration = moment().diff(moment(call?.startTime).tz('utc', true), 'seconds');
      }
      return call;
  }, [activeCalls, userAddress]);

  // Don't show if CTI is not initialized or user doesn't have permission
  // Also check if we're on the dialer or live-calls page itself (to avoid duplicate UI)
  // Only show if there's an active call (dialer button is now in topbar)
  const hideOnPages = ["/cti/dialer", "/cti/live-calls"];
  if (
    !isInitialized ||
    !hasPermission("dial-call-cti") ||
    hideOnPages.includes(router.pathname)
  ) {
    return null;
  }


  const handleDial = async (numberToDial: string = dialedNumber) => {
    if (!numberToDial.trim()) {
      toast.error("Please enter a number to dial");
      return;
    }

    setIsDialing(true);
    try {
      // Use dialNumber - it handles device selection, number cleaning, and validation automatically
      const result = await dialNumber(numberToDial);

      if (result.success) {
        toast.success(`Calling ${numberToDial}...`);
        setDialedNumber("");
        closeDialer();
      } else {
        toast.error(result.error || "Failed to make call");
      }
    } catch (error) {
      toast.error("Failed to make call");
    } finally {
      setIsDialing(false);
    }
  };

  const handleDeviceSelect = (device: any) => {
    const callingDevice = {
      callingAddress: userAddress,
      callingDeviceType: device.deviceType,
      callingDeviceName: device.deviceName,
    };

    // Store the selected device info in localStorage for consistent use
    const callerInfo = {
      callingAddress: userAddress,
      callingDeviceName: device.deviceName,
      callingDeviceType: device.deviceType,
      selectedAt: new Date().toISOString(),
    };

    localStorage.setItem("cti_caller_info", JSON.stringify(callerInfo));

    setShowDeviceSelectionModal(false);
    setAvailableDevices([]);
    setPendingDialedNumber("");

    // Proceed with dialing using selected device
    setIsDialing(true);
    makeCall({
      callingAddress: callingDevice.callingAddress,
      calledAddress: pendingDialedNumber,
      callingDeviceType: callingDevice.callingDeviceType,
      callingDeviceName: callingDevice.callingDeviceName,
    })
      .then((result) => {
        if (result.success) {
          toast.success(`Calling ${pendingDialedNumber}...`);
          setDialedNumber("");
          closeDialer();
        } else {
          toast.error(result.error || "Failed to make call");
        }
      })
      .catch((error) => {
        toast.error("Failed to make call");
      })
      .finally(() => {
        setIsDialing(false);
      });
  };

  const handleEndCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error("Call ID not available");
      return;
    }

    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      console.log("ZEZE activeCall", activeCall, {
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType,
        callingDeviceName: activeCall.callingDeviceName,
      });
      const result = await endCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType!,
        callingDeviceName: activeCall.callingDeviceName!,
      });

      if (result.success) {
        toast.success("Call ended");
      } else {
        toast.error(result.error || "Failed to end call");
      }
    } catch (error) {
      toast.error("Failed to end call");
    }
  };

  const handleHoldCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error("Call ID not available");
      return;
    }

    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      const result = await holdCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType!,
        callingDeviceName: activeCall.callingDeviceName!,
      });

      if (result.success) {
        toast.success("Call put on hold");
      } else {
        toast.error(result.error || "Failed to hold call");
      }
    } catch (error) {
      toast.error("Failed to hold call");
    }
  };

  const handleResumeCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error("Call ID not available");
      return;
    }

    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      const result = await resumeCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!,
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType!,
        callingDeviceName: activeCall.callingDeviceName!,
      });

      if (result.success) {
        toast.success("Call resumed");
      } else {
        toast.error(result.error || "Failed to resume call");
      }
    } catch (error) {
      toast.error("Failed to resume call");
    }
  };

  const handleTransferCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error("Call ID not available");
      return;
    }

    if (!transferTarget.trim()) {
      toast.error("Please select a target extension");
      return;
    }

    const callingDevice = getCallingDeviceInfo();
    if (!callingDevice) {
      toast.error("No calling device information available");
      return;
    }

    // Check if target extension is available
    const targetCall = Array.from(activeCalls.values()).find(
      (c) =>
        c.number === transferTarget &&
        ["connected", "ringing", "dialing"].includes(c.status)
    );

    if (targetCall) {
      toast.error(`Extension ${transferTarget} is currently busy`);
      return;
    }

    try {
      const result = await transferCall({
        callId: activeCall.callId,
        transferAddress: activeCall.calledAddress || activeCall.number,
        targetAddress: transferTarget,
        mode: "BLIND",
        // transferInitiatorAddress, transferInitiatorDeviceType, transferInitiatorDeviceName
        // are optional and will be auto-filled by transferCall function
      });

      if (result.success) {
        toast.success(`Call transferred to ${transferTarget}`);
        setShowTransferModal(false);
        setTransferTarget("");
        setExtensionSearch("");
      } else {
        toast.error(result.error || "Failed to transfer call");
      }
    } catch (error) {
      toast.error("Failed to transfer call");
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

  const handleOpenFullDialer = () => {
    router.push("/cti/dialer");
  };

  const isVertical = position === "left" || position === "right";
  const initials = getInitials(activeCall?.number ?? "");
  const displayNumber = activeCall ? formatPhoneNumber(activeCall.number) : "";

  return (
    <>
      <style>{floatingBarStyles}</style>
      {/* Floating Call Bar */}
      {activeCall && (
        <div
          ref={barRef}
          className={`global-floating-call-bar ${isDragging ? "dragging" : ""}`}
          style={getPositionStyles()}
        >
          {/* Drag Handle - small area at edge */}
          <div
            ref={dragHandleRef}
            className="call-bar-drag-handle"
            onMouseDown={handleDragStart}
            style={{
              position: "absolute",
              ...(isVertical
                ? { top: "6px", left: "50%", transform: "translateX(-50%)", width: "40px", height: "4px" }
                : { left: "6px", top: "50%", transform: "translateY(-50%)", width: "4px", height: "40px" }),
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              borderRadius: "2px",
              cursor: "grab",
              zIndex: 10,
            }}
            title="Drag to reposition"
          />

          {/* Contact Info Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isVertical ? "8px" : "12px",
              flex: isVertical ? "none" : 1,
              flexDirection: isVertical ? "column" : "row",
              minWidth: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: isVertical ? "40px" : "44px",
                height: isVertical ? "40px" : "44px",
                borderRadius: "50%",
                backgroundColor: "#4FC3F8", // Light blue from app theme
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: isVertical ? "16px" : "18px",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            {/* Contact Details */}
            {!isVertical && (
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#333",
                    marginBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeCall.number || "Unknown"}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "2px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayNumber}
                </div>
                {/* Optional: Add contact label/group here if available */}
              </div>
            )}
          </div>

          {/* Call Status Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: isVertical ? "none" : 1,
              flexDirection: isVertical ? "column" : "row",
              gap: isVertical ? "6px" : "10px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {isVertical && (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#333",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {activeCall.number}
              </div>
            )}
            
            {/* Status Text */}
               
                <div
                  style={{
                    fontSize: isVertical ? "10px" : "13px",
                    color: "#333",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexDirection: isVertical ? "column" : "row",
                  }}
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: isVertical ? "14px" : "16px", color: "#666" }}
                  >
                    call
                  </i>
                  <span>{activeCall.duration ? formatDuration(activeCall.duration) : "00:00"}</span>
                </div>
            {activeCall.status === "onHold" && (
              <div
                style={{
                  fontSize: isVertical ? "10px" : "13px",
                  color: "#F4C22B",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: isVertical ? "14px" : "16px" }}
                >
                  pause_circle
                </i>
                <span>{isVertical ? "Hold" : "On Hold"}</span>
              </div>
            )}
            {activeCall.status === "ringing" && (
              <div
                className="call-status-ringing"
                style={{
                  fontSize: isVertical ? "10px" : "13px",
                  color: "#333",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: isVertical ? "14px" : "16px", color: "#666" }}
                >
                  phone_in_talk
                </i>
                <span>Ringing...</span>
              </div>
            )}
            {activeCall.status === "dialing" && (
              <div
                style={{
                  fontSize: isVertical ? "10px" : "13px",
                  color: "#333",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: isVertical ? "14px" : "16px", color: "#666" }}
                >
                  call_made
                </i>
                <span>Dialing...</span>
              </div>
            )}
          </div>

          {/* Call Control Buttons */}
          <div
            style={{
              display: "flex",
              gap: isVertical ? "6px" : "10px",
              alignItems: "center",
              flexDirection: isVertical ? "column" : "row",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Keypad Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                openDialer();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDialer();
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#333",
                cursor: "pointer",
                padding: isVertical ? "6px" : "6px 10px",
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                alignItems: "center",
                gap: "4px",
                borderRadius: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title="Keypad"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2px",
                  width: isVertical ? "18px" : "20px",
                  height: isVertical ? "18px" : "20px",
                }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={`keypad-dot-${i}`}
                    style={{
                      width: "3px",
                      height: "3px",
                      backgroundColor: "#666",
                      borderRadius: "1px",
                    }}
                  />
                ))}
              </div>
              {!isVertical && (
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#666" }}>Keypad</span>
              )}
            </button>

            {/* Additional Controls for Connected Calls */}
            {activeCall.status === "connected" && (
              <>
                <button
                  type="button"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHoldCall();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#F4C22B",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(244, 194, 43, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Hold Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: isVertical ? "18px" : "20px" }}
                  >
                    pause
                  </i>
                </button>
                <button
                  type="button"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransferModal(true);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#666",
                    cursor: "pointer",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  title="Transfer Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: isVertical ? "18px" : "20px" }}
                  >
                    call_made
                  </i>
                </button>
              </>
            )}

            {activeCall.status === "onHold" && (
              <button
                type="button"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleResumeCall();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2ecc71",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(46, 204, 113, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title="Resume Call"
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: isVertical ? "18px" : "20px" }}
                >
                  play_arrow
                </i>
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleEndCall();
              }}
              style={{
                background: "#F44236", // Red from app theme
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: isVertical ? "8px" : "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                width: isVertical ? "40px" : "40px",
                height: isVertical ? "40px" : "40px",
                transition: "background-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#DA190C";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#F44236";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title="End Call"
            >
              <i
                className="material-icons-two-tone"
                style={{ fontSize: isVertical ? "20px" : "22px", color: "#fff" }}
              >
                call_end
              </i>
            </button>
          </div>
        </div>
      )}
      {/* Quick Dialer Modal */}
      <Modal
        show={showDialerModal}
        onHide={() => {
          closeDialer();
          setDialedNumber("");
        }}
        centered
        size="sm"
        contentClassName="border-0 shadow-lg"
      >
        <Modal.Header 
          closeButton 
          className="border-0 pb-0"
          style={{ paddingBottom: "0.5rem" }}
        >
          <Modal.Title className="d-flex align-items-center" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                backgroundColor: "#4FC3F8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "12px",
              }}
            >
              <i className="material-icons-two-tone" style={{ fontSize: "24px", color: "#fff" }}>
                dialpad
              </i>
            </div>
            <span style={{ color: "#333" }}>Quick Dial</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "24px" }}>
          {/* Active Call Info - Show at top if exists */}
          {activeCall && (
            <div
              className="mb-3"
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: "12px",
                padding: "12px 16px",
                border: "1px solid #bae6fd",
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>
                  <i className="material-icons-two-tone me-1" style={{ fontSize: "16px", verticalAlign: "middle", color: "#4FC3F8" }}>
                    call
                  </i>
                  {activeCall.number}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {activeCall.status === "connected" && activeCall.duration !== undefined && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {formatDuration(activeCall.duration)}
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        activeCall.status === "connected"
                          ? "#2ecc71"
                          : activeCall.status === "ringing"
                          ? "#F4C22B"
                          : "#4FC3F8",
                      color: "#fff",
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "8px",
                      fontWeight: 600,
                    }}
                  >
                    {activeCall.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Number Input Section - Main focus */}
          <div className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter number or extension (e.g., 103 or +15551234567)"
              value={dialedNumber}
              onChange={(e) => {
                let value = e.target.value;
                
                // Allow + only at the beginning
                if (value.startsWith("+")) {
                  // Allow + followed by digits only
                  const afterPlus = value.slice(1).replaceAll(/\D/g, "");
                  value = "+" + afterPlus;
                  // E.164 format: + followed by up to 15 digits
                  if (afterPlus.length <= 15) {
                    setDialedNumber(value);
                  }
                } else {
                  // For extensions or numbers without +, allow digits only
                  const digitsOnly = value.replaceAll(/\D/g, "");
                  // Allow up to 15 digits for regular numbers, or shorter for extensions
                  if (digitsOnly.length <= 15) {
                    setDialedNumber(digitsOnly);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dialedNumber.trim()) {
                  handleDial();
                }
              }}
              autoFocus
              className="border-2"
              style={{
                fontSize: "24px",
                fontWeight: 600,
                textAlign: "center",
                color: "#333",
                padding: "16px",
                borderRadius: "12px",
                borderColor: dialedNumber ? "#4FC3F8" : "#e9ecef",
                backgroundColor: "#fff",
                transition: "all 0.2s",
              }}
            />
            {dialedNumber && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#666",
                  textAlign: "center",
                  marginTop: "8px",
                  fontWeight: 500,
                }}
              >
                {formatPhoneNumber(dialedNumber)}
              </div>
            )}
          </div>

          {/* Quick Extension Buttons - Compact grid */}
          {getAvailableExtensions && getAvailableExtensions().length > 0 && (
            <div className="mb-3">
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "10px",
                }}
              >
                Quick Dial
              </div>
              <div
                className="d-flex flex-wrap gap-2"
                style={{ maxHeight: "120px", overflowY: "auto", padding: "2px" }}
              >
                {getAvailableExtensions()
                  .slice(0, 10)
                  .map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => {
                        setDialedNumber(ext);
                      }}
                      style={{
                        flex: "0 0 calc(25% - 8px)",
                        minWidth: "60px",
                        height: "40px",
                        borderRadius: "10px",
                        border: "2px solid",
                        borderColor: dialedNumber === ext ? "#4FC3F8" : "#e9ecef",
                        backgroundColor: dialedNumber === ext ? "#4FC3F8" : "#fff",
                        color: dialedNumber === ext ? "#fff" : "#333",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        if (dialedNumber !== ext) {
                          e.currentTarget.style.borderColor = "#4FC3F8";
                          e.currentTarget.style.backgroundColor = "#f0f9ff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dialedNumber !== ext) {
                          e.currentTarget.style.borderColor = "#e9ecef";
                          e.currentTarget.style.backgroundColor = "#fff";
                        }
                      }}
                    >
                      {ext}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Bottom section */}
          <div className="d-flex gap-2" style={{ marginTop: "8px" }}>
            <Button
              variant="primary"
              onClick={() => handleDial()}
              disabled={!dialedNumber.trim() || isDialing}
              className="flex-fill"
              style={{
                height: "48px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                backgroundColor: "#4FC3F8",
                border: "none",
                boxShadow: "0 2px 8px rgba(79, 195, 248, 0.3)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#3db8e5";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(79, 195, 248, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#4FC3F8";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(79, 195, 248, 0.3)";
                }
              }}
            >
              {isDialing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Dialing...
                </>
              ) : (
                <>
                  <i className="material-icons-two-tone me-2" style={{ fontSize: "20px", verticalAlign: "middle" }}>
                    call
                  </i>
                  Call
                </>
              )}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={handleOpenFullDialer}
              style={{
                height: "48px",
                width: "48px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                border: "2px solid #e9ecef",
                color: "#666",
                backgroundColor: "#fff",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#4FC3F8";
                e.currentTarget.style.color = "#4FC3F8";
                e.currentTarget.style.backgroundColor = "#f0f9ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e9ecef";
                e.currentTarget.style.color = "#666";
                e.currentTarget.style.backgroundColor = "#fff";
              }}
              title="Open Full Dialer"
            >
              <i
                className="material-icons-two-tone"
                style={{ fontSize: "20px" }}
              >
                open_in_new
              </i>
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Device Selection Modal */}
      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={() => {
          setShowDeviceSelectionModal(false);
          setAvailableDevices([]);
          setPendingDialedNumber("");
        }}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={userAddress || ""}
      />

      {/* Transfer Call Modal */}
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
            <i className="material-icons-two-tone me-2">call_made</i>
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
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {getAvailableExtensionsForTransfer()
                .filter(
                  (ext) =>
                    extensionSearch === "" ||
                    ext.toLowerCase().includes(extensionSearch.toLowerCase())
                )
                .map((ext) => {
                  const extensionData = dnsMap?.[ext];
                  const deviceList = extensionData
                    ? Object.values(extensionData.devices || {})
                    : [];
                  const isOnline = deviceList.some(
                    (d: any) => d.terminalState === "REGISTERED"
                  );

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
                        <span className="fw-bold">{ext}</span>
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
            variant="secondary"
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
            disabled={!transferTarget}
          >
            Transfer
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GlobalFloatingCallBar;
