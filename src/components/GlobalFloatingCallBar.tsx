"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { useCti } from "../contexts/CtiContext";
import { usePermissions } from "../utils/permissionUtils";
import { toast } from "react-toastify";
import DeviceSelectionModal from "./DeviceSelectionModal";
import { useRouter } from "next/router";
import { useDialerModal } from "../contexts/DialerModalContext";
import { useIncomingCall } from "../contexts/IncomingCallContext";
import moment from "moment-timezone";
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";


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
    eventLog,
    formatDuration,
    makeCall,
    dialNumber, // Use dialNumber for simplified calls
    endCall,
    holdCall,
    resumeCall,
    transferCall,
    attendCall,
    getCallingDeviceInfo,
    getAllUserDevices,
    getAvailableExtensions,
    getUserDataExtensions,
  } = useCti();

  const { hasPermission } = usePermissions();
  const router = useRouter();
  const { isOpen: showDialerModal, closeDialer, openDialer } = useDialerModal();
  const { showIncomingCallModal: showIncomingCallModalFromContext, setIncomingCall: setIncomingCallContext, setShowIncomingCallModal: setShowIncomingCallModalContext } = useIncomingCall();
  const [dialedNumber, setDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] =
    useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
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
  const [incomingCallTimer, setIncomingCallTimer] = useState<NodeJS.Timeout | null>(null);

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

  // Helper function to get initials from user name (first letter of first name, second letter of last name)
  const getInitialsFromName = useCallback((name: string): string => {
    if (!name) return "";
    
    // Split by spaces and filter out empty strings
    const words = name.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length >= 2) {
      // Has first and last name
      const firstName = words[0];
      const lastName = words[words.length - 1];
      
      // Get first letter of first name
      const firstLetter = firstName.match(/[a-z]/i)?.[0];
      
      // Get second letter of last name (index 1)
      const lastNameLetters = lastName.match(/[a-z]/gi) || [];
      const secondLetter = lastNameLetters.length >= 2 ? lastNameLetters[1] : null;
      
      if (firstLetter && secondLetter) {
        return (firstLetter + secondLetter).toUpperCase();
      }
      
      // Fallback: if second letter not available, use first letter of last name
      const lastFirstLetter = lastNameLetters[0];
      if (firstLetter && lastFirstLetter) {
        return (firstLetter + lastFirstLetter).toUpperCase();
      }
      
      // If only first letter available
      if (firstLetter) {
        return firstLetter.toUpperCase();
      }
    }
    
    // If only one word, use first two letters
    if (words.length === 1 && words[0]) {
      const letters = words[0].match(/[a-z]/gi) || [];
      if (letters.length >= 2) {
        return (letters[0] + letters[1]).toUpperCase();
      } else if (letters.length === 1) {
        return letters[0].toUpperCase();
      }
    }
    
    return "";
  }, []);

  // Helper function to get initials from phone number or name
  const getInitials = useCallback((input: string): string => {
    if (!input) return "";
    
    // If it looks like a name (contains letters), extract initials from name
    if (/[a-z]/i.test(input)) {
      return getInitialsFromName(input);
    }
    
    // If it's a phone number, try to extract initials from number
    const digits = input.replaceAll(/\D/g, "");
    if (digits.length >= 2) {
      return digits.slice(0, 2).toUpperCase();
    }
    // Fallback: use first two characters
    return input.slice(0, 2).toUpperCase().replaceAll(/\s/g, "");
  }, [getInitialsFromName]);

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
      backgroundColor: "#fff",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      display: "flex",
      alignItems: "center",
      transition: isDragging ? "none" : "all 0.3s ease",
      cursor: isDragging ? "grabbing" : "default",
      border: "none",
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
        baseStyles.borderRadius = "1.5rem";
        baseStyles.padding = "1rem 0.75rem";
        baseStyles.gap = "0.75rem";
        baseStyles.minWidth = "70px";
        baseStyles.maxWidth = "85px";
      } else {
        baseStyles.flexDirection = "row";
        baseStyles.borderRadius = "1.5rem";
        baseStyles.padding = "1.25rem";
        baseStyles.gap = "1rem";
        baseStyles.minWidth = "320px";
        baseStyles.maxWidth = "625px";
        baseStyles.width = "auto";
      }
      
      return baseStyles;
    }

    // Otherwise, use position state
    const isVertical = position === "left" || position === "right";
    
    baseStyles.borderRadius = "1.5rem";
    baseStyles.padding = isVertical ? "1rem 0.75rem" : "1.25rem";
    baseStyles.gap = isVertical ? "0.75rem" : "1rem";

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
      //baseStyles.maxWidth = "450px";
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

  // Helper function to get controller device info based on call and user role
  const getControllerDeviceInfo = useCallback((call: typeof activeCall) => {
    if (!call || !userAddress || !dnsMap) {
      return null;
    }

    // Determine if user is caller or called party
    const isCaller = call.callingAddress === userAddress;
    const isCalled = call.calledAddress === userAddress;

    if (!isCaller && !isCalled) {
      return null;
    }

    // Get device information for the user from dnsMap
    const userDeviceInfo = dnsMap[userAddress];
    if (!userDeviceInfo || !userDeviceInfo.devices) {
      return null;
    }

    const userDevices = Object.values(userDeviceInfo.devices);
    if (userDevices.length === 0) {
      return null;
    }

    let activeDevice: any = null;

    // If user is the caller, try to match the device name from the call
    if (isCaller && call.callingDeviceName) {
      activeDevice = userDevices.find((device: any) => 
        device.deviceName === call.callingDeviceName
      );
    }

    // If device not found by name match, or user is called party, use registered device or first available
    if (!activeDevice) {
      activeDevice = userDevices.find((device: any) => device.terminalState === 'REGISTERED') || userDevices[0];
    }

    return {
      // Controller fields for the user's device
      controllerAddress: userAddress,
      controllerDeviceName: activeDevice.deviceName || 'WebCTI',
      controllerDeviceType: activeDevice.deviceType || 'SOFT_HARD',
    };
  }, [userAddress, dnsMap]);

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

  // Get user extension data for the active call number
  const activeCallUserData = React.useMemo(() => {
    if (!activeCall || !activeCall.number || !getUserDataExtensions) {
      return null;
    }
    
    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const callNumber = activeCall.number;
      const dnString = String(callNumber);
      const dnNumber = Number(callNumber);
      
      // Try different DN formats to match the key
      const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
      
      return data;
    } catch (error) {
      console.error(`[GlobalFloatingCallBar] Error getting extension data for ${activeCall.number}:`, error);
      return null;
    }
  }, [activeCall, getUserDataExtensions]);

  // Get user name from extension data
  const activeCallUserName = React.useMemo(() => {
    if (!activeCallUserData) {
      return activeCall?.number || "Unknown";
    }
    return activeCallUserData.name || activeCallUserData.user_name || activeCall?.number || "Unknown";
  }, [activeCallUserData, activeCall]);

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
  const incomingCallUserData = React.useMemo(() => {
    if (!incomingCall || !incomingCall.callingAddress || !getUserDataExtensions) {
      return null;
    }
    
    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const callNumber = incomingCall.callingAddress;
      const dnString = String(callNumber);
      const dnNumber = Number(callNumber);
      
      // Try different DN formats to match the key
      const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
      
      return data;
    } catch (error) {
      console.error(`[GlobalFloatingCallBar] Error getting extension data for incoming call ${incomingCall.callingAddress}:`, error);
      return null;
    }
  }, [incomingCall, getUserDataExtensions]);

  // Get incoming call user name
  const incomingCallUserName = React.useMemo(() => {
    if (!incomingCallUserData) {
      return incomingCall?.callingAddress || "Unknown";
    }
    return incomingCallUserData.name || incomingCallUserData.user_name || incomingCall?.callingAddress || "Unknown";
  }, [incomingCallUserData, incomingCall]);

  // Get incoming call user image URL
  const incomingCallUserImageUrl = React.useMemo(() => {
    if (!incomingCallUserData) {
      return UserDummyImage.src;
    }
    
    const imagePath = incomingCallUserData?.image_path;
    if (imagePath) {
      const url = getStorageImageUrl(imagePath);
      return url || UserDummyImage.src;
    }
    return UserDummyImage.src;
  }, [incomingCallUserData]);

  // Handle incoming call events
  useEffect(() => {
    if (!eventLog || eventLog.length === 0 || !userAddress) return;

    const latestEvent = eventLog[eventLog.length - 1];
    
    // Handle INCOMING_CALL event
    if (latestEvent.eventType === 'INCOMING_CALL' && latestEvent.parties) {
      const eventData = latestEvent.parties[0];
      
      // Check if this is an incoming call to our user address
      if (eventData.calledAddress === userAddress) {
        // Clear any existing timer
        if (incomingCallTimer) {
          clearTimeout(incomingCallTimer);
        }
        
        // Show incoming call modal with attend/reject options
        const incomingCallData = {
          callId: eventData.callId || `incoming_${Date.now()}`,
          callingAddress: eventData.callingAddress,
          calledAddress: eventData.calledAddress,
          controllerAddress: eventData.controllerAddress || userAddress,
          controllerDeviceName: eventData.controllerDeviceName || 'WebCTI',
          controllerDeviceType: eventData.controllerDeviceType || 'SOFT_HARD',
          startTime: new Date()
        };
        setIncomingCall(incomingCallData);
        setIncomingCallContext(incomingCallData);
        setShowIncomingCallModal(true);
        setShowIncomingCallModalContext(true);
        
        // Set auto-dismiss timer (30 seconds)
        const timer = setTimeout(() => {
          setShowIncomingCallModal(false);
          setShowIncomingCallModalContext(false);
          setIncomingCall(null);
          setIncomingCallContext(null);
         // toast.info('Incoming call timed out');
        }, 30000);
        setIncomingCallTimer(timer);
      }
    }
    
    // Handle RINGING event for incoming calls
    if (latestEvent.eventType === 'RINGING' && latestEvent.parties) {
      const eventData = latestEvent.parties[0];
      
      // Check if this is an incoming call to our user address
      if (eventData.calledAddress === userAddress && !showIncomingCallModal) {
        // Clear any existing timer
        if (incomingCallTimer) {
          clearTimeout(incomingCallTimer);
        }
        
        // Get device information for user from dnsMap
        const userDeviceInfo = dnsMap[userAddress];
        const userDevices = userDeviceInfo ? Object.values(userDeviceInfo.devices || {}) : [];
        const activeUserDevice = userDevices.find((device: any) => device.terminalState === 'REGISTERED');
        
        // Show incoming call modal with attend/reject options
        const incomingCallData = {
          callId: eventData.callId || `incoming_${Date.now()}`,
          callingAddress: eventData.callingAddress,
          calledAddress: eventData.calledAddress,
          controllerAddress: userAddress,
          controllerDeviceName: activeUserDevice?.deviceName || '',
          controllerDeviceType: activeUserDevice?.deviceType || '',
          startTime: new Date()
        };
        setIncomingCall(incomingCallData);
        setIncomingCallContext(incomingCallData);
        setShowIncomingCallModal(true);
        setShowIncomingCallModalContext(true);
        
        // Set auto-dismiss timer (30 seconds)
        const timer = setTimeout(() => {
          setShowIncomingCallModal(false);
          setShowIncomingCallModalContext(false);
          setIncomingCall(null);
          setIncomingCallContext(null);
         // toast.info('Incoming call timed out');
        }, 30000);
        setIncomingCallTimer(timer);
      }
    }
    
    // Handle call termination events for incoming calls
    if (['DISCONNECTED', 'DROPPED', 'ENDED'].includes(latestEvent.eventType) && latestEvent.parties && incomingCall) {
      const eventData = latestEvent.parties[0];
      if (eventData.callId === incomingCall.callId || 
          (eventData.callingAddress === incomingCall.callingAddress && eventData.calledAddress === incomingCall.calledAddress)) {
        // Clear the timer
        if (incomingCallTimer) {
          clearTimeout(incomingCallTimer);
          setIncomingCallTimer(null);
        }
        
        // Close the incoming call modal
        setShowIncomingCallModal(false);
        setShowIncomingCallModalContext(false);
        setIncomingCall(null);
        setIncomingCallContext(null);
        
        //toast.info('Incoming call ended by caller');
      }
    }
  }, [eventLog, userAddress, dnsMap, showIncomingCallModal, incomingCall, incomingCallTimer]);

  // Cleanup incoming call timer on unmount
  useEffect(() => {
    return () => {
      if (incomingCallTimer) {
        clearTimeout(incomingCallTimer);
      }
    };
  }, [incomingCallTimer]);

  // Don't show floating bar if CTI is not initialized or user doesn't have permission
  // Also check if we're on the dialer or live-calls page itself (to avoid duplicate UI)
  // Only show if there's an active call (dialer button is now in topbar)
  const hideOnPages = ["/cti/dialer", "/cti/live-calls"];
  const shouldShowFloatingBar = isInitialized && 
    hasPermission("dial-call-cti") && 
    !hideOnPages.includes(router.pathname);
  
  // Don't render dialer modal if CTI is not initialized or user doesn't have permission
  const shouldShowDialerModal = isInitialized && hasPermission("dial-call-cti");

  const handleDial = async (numberToDial: string = dialedNumber) => {
    if (!numberToDial.trim()) {
      toast.error("Please enter a number to dial");
      return;
    }

    // Check if user has multiple devices
    const userDevices = getAllUserDevices();
    if (!userDevices) {
      toast.error("No calling device information available");
      return;
    }

    console.log("User devices found:", userDevices.length, userDevices);

    // If user has multiple devices, show device selection modal
    if (userDevices.length > 1) {
      console.log("Multiple devices detected, showing device selection modal");
      setAvailableDevices(userDevices);
      setPendingDialedNumber(numberToDial);
      setShowDeviceSelectionModal(true);
      return;
    }

    // If only one device, proceed with dialing using dialNumber
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

  const handleDeviceSelect = async (device: any) => {
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
    
    const numberToDial = pendingDialedNumber;
    setPendingDialedNumber("");

    // Proceed with dialing using selected device
    setIsDialing(true);
    try {
      const result = await makeCall({
        callingAddress: callingDevice.callingAddress,
        calledAddress: numberToDial,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName,
      });

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

  const handleEndCall = async () => {
    if (!activeCall || !activeCall.callId) {
      toast.error("Call ID not available");
      return;
    }

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      const result = await endCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!, // Keep original calling address
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || 'SOFT_HARD', // From active call
        callingDeviceName: activeCall.callingDeviceName || 'WebCTI', // From active call
        // Add controller fields from user's device
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as any);

      if (result.success) {
       // toast.success("Call ended");
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

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      const result = await holdCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!, // Keep original calling address
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || 'SOFT_HARD', // From active call
        callingDeviceName: activeCall.callingDeviceName || 'WebCTI', // From active call
        // Add controller fields from user's device
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as any);

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

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
      toast.error("No calling device information available");
      return;
    }

    try {
      const result = await resumeCall({
        callId: activeCall.callId,
        callingAddress: activeCall.callingAddress!, // Keep original calling address
        calledAddress: activeCall.calledAddress || activeCall.number,
        callingDeviceType: activeCall.callingDeviceType || 'SOFT_HARD', // From active call
        callingDeviceName: activeCall.callingDeviceName || 'WebCTI', // From active call
        // Add controller fields from user's device
        controllerAddress: controllerDevice.controllerAddress,
        controllerDeviceName: controllerDevice.controllerDeviceName,
        controllerDeviceType: controllerDevice.controllerDeviceType,
      } as any);

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

    const controllerDevice = getControllerDeviceInfo(activeCall);
    if (!controllerDevice) {
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
        transferInitiatorAddress: controllerDevice.controllerAddress,
        transferInitiatorDeviceType: controllerDevice.controllerDeviceType,
        transferInitiatorDeviceName: controllerDevice.controllerDeviceName,
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

  const handleAttendCall = async () => {
    // Check permission for attending calls
    if (!hasPermission("dial-call-cti")) {
      toast.error("You do not have permission to answer calls");
      return;
    }

    if (!incomingCall) {
      toast.error("No incoming call to attend");
      return;
    }

    // Get controller device info from dnsMap for the user
    const userDeviceInfo = dnsMap[userAddress];
    if (!userDeviceInfo || !userDeviceInfo.devices) {
      toast.error("No device information available");
      return;
    }

    const userDevices = Object.values(userDeviceInfo.devices);
    if (userDevices.length === 0) {
      toast.error("No devices available");
      return;
    }

    // Try to match device name from incomingCall if available
    let activeDevice: any = null;
    if (incomingCall.controllerDeviceName) {
      activeDevice = userDevices.find((device: any) => 
        device.deviceName === incomingCall.controllerDeviceName
      );
    }

    // If device not found by name match, use registered device or first available device
    if (!activeDevice) {
      activeDevice = userDevices.find((device: any) => device.terminalState === 'REGISTERED') || userDevices[0];
    }

    // Clear the timer
    if (incomingCallTimer) {
      clearTimeout(incomingCallTimer);
      setIncomingCallTimer(null);
    }

    setIsDialing(true);
    try {
      // Call the attendCall API with the required payload
      const result = await attendCall({
        callId: incomingCall.callId,
        callingAddress: incomingCall.callingAddress,
        calledAddress: incomingCall.calledAddress,
        controllerAddress: userAddress,
        controllerDeviceName: activeDevice.deviceName || 'WebCTI',
        controllerDeviceType: activeDevice.deviceType || 'SOFT_HARD'
      });

      if (result.success) {
        // Close the incoming call modal
        setShowIncomingCallModal(false);
        setShowIncomingCallModalContext(false);
        setIncomingCall(null);
        setIncomingCallContext(null);
        
       // toast.success("Call attended successfully");
      } else {
        toast.error(result.error || "Failed to attend call");
      }
    } catch (error) {
      toast.error("Failed to attend call");
    } finally {
      setIsDialing(false);
    }
  };

  const handleRejectCall = () => {
    // Clear the timer
    if (incomingCallTimer) {
      clearTimeout(incomingCallTimer);
      setIncomingCallTimer(null);
    }
    
    // Close the incoming call modal without attending
    setShowIncomingCallModal(false);
    setShowIncomingCallModalContext(false);
    setIncomingCall(null);
    setIncomingCallContext(null);
    toast.info("Call rejected");
  };

  const isVertical = position === "left" || position === "right";
  
  // Get initials: if user_name is available, use first letter of first name and second letter of last name
  // Otherwise use extension number
  const initials = React.useMemo(() => {
    if (activeCallUserData && (activeCallUserData.name || activeCallUserData.user_name)) {
      const userName = activeCallUserData.name || activeCallUserData.user_name;
      return getInitialsFromName(userName);
    }
    // If no user_name, use extension number
    return activeCall?.number ? activeCall.number.slice(0, 2) : "";
  }, [activeCallUserData, activeCall, getInitialsFromName]);

  // Get call initiator number (the person who initiated the call)
  const callInitiatorNumber = React.useMemo(() => {
    if (!activeCall || !userAddress) return "";
    
    // If current user is the receiver (calledAddress), initiator is callingAddress
    // If current user is the caller (callingAddress), initiator is also callingAddress (themselves)
    if (activeCall.calledAddress === userAddress) {
      // User is receiver, so initiator is the caller
      return activeCall.callingAddress || activeCall.number || "";
    } else if (activeCall.callingAddress === userAddress) {
      // User is caller, so initiator is themselves
      return activeCall.callingAddress || activeCall.number || "";
    }
    
    // Fallback
    return activeCall.number || "";
  }, [activeCall, userAddress]);

  const displayNumber = callInitiatorNumber ? formatPhoneNumber(callInitiatorNumber) : "";

  // Don't render anything if CTI is not initialized or user doesn't have permission
  if (!isInitialized || !hasPermission("dial-call-cti")) {
    return null;
  }

  return (
    <>
      <style>{floatingBarStyles}</style>
      {/* Floating Call Bar - Hide when incoming call modal is open */}
      {shouldShowFloatingBar && activeCall && !showIncomingCallModalFromContext && (
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
              gap: isVertical ? "0.75rem" : "1rem",
              flex: isVertical ? "none" : 1,
              flexDirection: isVertical ? "column" : "row",
              minWidth: 0,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Avatar */}
            <div
              className="position-relative"
              style={{
                width: isVertical ? "3rem" : "5rem",
                height: isVertical ? "3rem" : "5rem",
                minWidth: isVertical ? "3rem" : "5rem",
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
            {!isVertical && (
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "1.5rem",
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
                    fontSize: "1rem",
                    color: "#94a3b8",
                    marginBottom: "0.25rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayNumber}
                </div>
                {/* Optional: Add contact label/group here if available */}

                {/* Status Text */}
            {activeCall.status === "connected" && (
              <div
                style={{
                  fontSize: isVertical ? "0.875rem" : "0.875rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <span className="text-success" style={{ fontWeight: "500" }}>Connected</span>
                <span style={{ color: "#94a3b8" }}>{activeCall.duration ? formatDuration(activeCall.duration) : "00:00"}</span>
              </div>
            )}

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
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "#334155",
                  textAlign: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {activeCallUserName}
                
              </div>
            )}
            
            
            {activeCall.status === "onHold" && (
              <div
                style={{
                  fontSize: isVertical ? "0.875rem" : "0.875rem",
                  color: "#F4C22B",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: isVertical ? "1rem" : "1rem" }}
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
                  fontSize: isVertical ? "0.875rem" : "0.875rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: isVertical ? "column" : "row",
                }}
              >
                <span className="text-success" style={{ fontWeight: "500" }}>Incoming call</span>
                <span className="bg-success rounded-circle" style={{ width: "0.375rem", height: "0.375rem" }}></span>
                <span style={{ color: "#94a3b8" }}>Ringing...</span>
              </div>
            )}
            {activeCall.status === "dialing" && (
              <div
                style={{
                  fontSize: isVertical ? "0.875rem" : "0.875rem",
                  color: "#334155",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexDirection: isVertical ? "column" : "row",
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
              gap: isVertical ? "0.5rem" : "0.5rem",
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
              className="btn rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: isVertical ? "3rem" : "3rem",
                height: isVertical ? "3rem" : "3rem",
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
              title="Keypad"
            >
              <i
                className="material-icons-two-tone"
                style={{ fontSize: "1.25rem", color: "#475569" }}
              >
                dialpad
              </i>
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
                  title="Hold Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1.25rem", color: "#475569" }}
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
                title="Resume Call"
              >
                <i
                  className="material-icons-two-tone"
                  style={{ fontSize: "1.25rem", color: "#475569" }}
                >
                  play_arrow
                </i>
              </button>
            )}

            {/* Accept/Reject buttons for incoming ringing calls */}
            {activeCall.status === "ringing" && activeCall.calledAddress === userAddress && (
              <>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Find the incoming call and attend it
                    if (incomingCall) {
                      handleAttendCall();
                    } else {
                      // If no incomingCall state, try to attend using activeCall data
                      const controllerDevice = getControllerDeviceInfo(activeCall);
                      if (controllerDevice && activeCall.callId) {
                        setIsDialing(true);
                        attendCall({
                          callId: activeCall.callId,
                          callingAddress: activeCall.callingAddress || '',
                          calledAddress: activeCall.calledAddress || activeCall.number,
                          controllerAddress: controllerDevice.controllerAddress,
                          controllerDeviceName: controllerDevice.controllerDeviceName,
                          controllerDeviceType: controllerDevice.controllerDeviceType,
                        })
                          .then((result) => {
                            if (result.success) {
                              toast.success("Call answered");
                            } else {
                              toast.error(result.error || "Failed to answer call");
                            }
                          })
                          .catch(() => {
                            toast.error("Failed to answer call");
                          })
                          .finally(() => {
                            setIsDialing(false);
                          });
                      }
                    }
                  }}
                  className="btn rounded-pill d-flex align-items-center gap-2"
                  style={{
                    padding: "0.625rem 1.75rem",
                    fontWeight: 500,
                    fontSize: "1rem",
                    color: "white",
                    backgroundColor: "#22c55e",
                    border: "none",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#16a34a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.backgroundColor = "#22c55e";
                    }
                  }}
                  title="Answer Call"
                  disabled={isDialing}
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1rem", color: "#fff" }}
                  >
                    call
                  </i>
                  Answer
                </button>
                <button
                  type="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectCall();
                    // Also end the call if it exists in activeCalls
                    if (activeCall && activeCall.callId) {
                      const controllerDevice = getControllerDeviceInfo(activeCall);
                      if (controllerDevice) {
                        endCall({
                          callId: activeCall.callId,
                          callingAddress: activeCall.callingAddress!, // Keep original calling address
                          calledAddress: activeCall.calledAddress || activeCall.number,
                          callingDeviceType: activeCall.callingDeviceType || 'SOFT_HARD', // From active call
                          callingDeviceName: activeCall.callingDeviceName || 'WebCTI', // From active call
                          // Add controller fields from user's device
                          controllerAddress: controllerDevice.controllerAddress,
                          controllerDeviceName: controllerDevice.controllerDeviceName,
                          controllerDeviceType: controllerDevice.controllerDeviceType,
                        } as any).catch(() => {
                          // Silently fail if call already ended
                        });
                      }
                    }
                  }}
                  className="btn rounded-pill d-flex align-items-center gap-2"
                  style={{
                    padding: "0.625rem 1.75rem",
                    backgroundColor: "white",
                    border: "2px solid #f87171",
                    color: "#ef4444",
                    fontWeight: 500,
                    fontSize: "1rem",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                  title="Reject Call"
                >
                  <i
                    className="material-icons-two-tone"
                    style={{ fontSize: "1rem", color: "#ef4444" }}
                  >
                    call_end
                  </i>
                  Decline
                </button>
              </>
            )}

            {/* End Call Button */}
            <button
              type="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                handleEndCall();
              }}
              className="btn btn-danger rounded-1 d-flex align-items-center gap-1"
              style={{
                padding: "0.625rem 1rem",
                fontWeight: 500,
                color:"#fff",
                fontSize: "1rem",
                boxShadow: "0 4px 6px -1px rgba(239,68,68,0.3)",
                marginLeft: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 8px -1px rgba(239,68,68,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(239,68,68,0.3)";
              }}
              title="End Call"
            >
              <i
                className="material-icons-two-tone"
                style={{ fontSize: "1rem", color: "#fff",backgroundColor:"#fff" }}
              >
                call_end
              </i>
              End Call
            </button>
          </div>
        </div>
      )}
      {/* Quick Dialer Modal - Always render if user has permission */}
      {/* {shouldShowDialerModal && (
      <Modal
        show={showDialerModal}
        onHide={() => {
          closeDialer();
          setDialedNumber("");
        }}
        centered
        size="sm"
        contentClassName="border-0 shadow-lg rounded-3"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
      >
        <Modal.Header
          closeButton
          className="border-0"
          style={{
            background: "linear-gradient(to right, #475569, #334155)",
            color: "white",
            padding: "1.25rem 1.5rem",
            borderRadius: "0.75rem 0.75rem 0 0",
          }}
        >
          <Modal.Title
            className="d-flex align-items-center justify-content-between w-100"
            style={{ fontSize: "1.25rem", fontWeight: 600, color: "white", margin: 0 }}
          >
            <span>Quick Dial</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{userAddress || ""}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "1.5rem" }}>
          {activeCall && (
            <div
              className="mb-3"
              style={{
                backgroundColor: "#f0f9ff",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                border: "1px solid #bae6fd",
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ fontSize: "0.875rem", color: "#334155", fontWeight: 500 }}>
                  <i className="material-icons-two-tone me-1" style={{ fontSize: "1rem", verticalAlign: "middle", color: "#4FC3F8" }}>
                    call
                  </i>
                  {activeCallUserName}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {activeCall.status === "connected" && activeCall.duration !== undefined && (
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      {formatDuration(activeCall.duration)}
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        activeCall.status === "connected"
                          ? "#22c55e"
                          : activeCall.status === "ringing"
                          ? "#F4C22B"
                          : "#4FC3F8",
                      color: "#fff",
                      fontSize: "0.625rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.5rem",
                      fontWeight: 600,
                    }}
                  >
                    {activeCall.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <Form.Control
              type="text"
              placeholder="Search name or type number"
              value={dialedNumber}
              onChange={(e) => {
                let value = e.target.value;
                
                if (value.startsWith("+")) {
                  const afterPlus = value.slice(1).replaceAll(/\D/g, "");
                  value = "+" + afterPlus;
                  if (afterPlus.length <= 15) {
                    setDialedNumber(value);
                  }
                } else {
                  const digitsOnly = value.replaceAll(/\D/g, "");
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
              style={{
                fontSize: "1rem",
                fontWeight: 500,
                color: "#334155",
                padding: "0.875rem 1rem",
                paddingLeft: "3rem",
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                transition: "all 0.2s",
              }}
            />
            {dialedNumber && (
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  marginTop: "0.5rem",
                  fontWeight: 500,
                }}
              >
                {formatPhoneNumber(dialedNumber)}
              </div>
            )}
          </div>

          {getAvailableExtensions && getAvailableExtensions().length > 0 && (
            <div className="mb-3">
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "0.75rem",
                }}
              >
                Quick Dial
              </div>
              <div
                className="row g-3"
                style={{ maxHeight: "200px", overflowY: "auto", padding: "0" }}
              >
                {getAvailableExtensions()
                  .slice(0, 12)
                  .map((ext) => (
                    <div key={ext} className="col-4">
                      <button
                        type="button"
                        onClick={() => {
                          setDialedNumber(ext);
                        }}
                        className="btn w-100"
                        style={{
                          height: "4rem",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.75rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          color: "#475569",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8fafc";
                        }}
                      >
                        {ext}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div style={{ padding: "0 0 0 0" }}>
            <button
              onClick={() => handleDial()}
              disabled={!dialedNumber.trim() || isDialing}
              className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-3 rounded-4"
              style={{
                padding: "1rem",
                fontSize: "1.125rem",
                fontWeight: 600,
                backgroundColor: "#22c55e",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#16a34a";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = "#22c55e";
                }
              }}
            >
              {isDialing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Dialing...
                </>
              ) : (
                <>
                  <i className="material-icons-two-tone" style={{ fontSize: "1.5rem", color: "#fff" }}>
                    call
                  </i>
                  Call
                </>
              )}
            </button>
          </div>
        </Modal.Body>
      </Modal>
      )} */}

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

      {/* Incoming Call Modal - Moved to Layouts/index.tsx */}
      {/* {showIncomingCallModal && incomingCall && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1060,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            className="bg-white rounded-4 shadow"
            style={{
              width: "100%",
              maxWidth: "625px",
              padding: "1.25rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              {/* Left - Avatar and Info */}
              {/* <div className="d-flex align-items-center gap-3">
                <div
                  className="position-relative"
                  style={{
                    width: "5rem",
                    height: "5rem",
                    minWidth: "5rem",
                  }}
                >
                  {incomingCallUserImageUrl && incomingCallUserImageUrl !== UserDummyImage.src ? (
                    <img
                      src={incomingCallUserImageUrl}
                      alt={incomingCallUserName}
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
                      alt={incomingCallUserName}
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
                <div>
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "600",
                      color: "#334155",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {incomingCallUserName}
                  </h3>
                  <div
                    style={{
                      fontSize: "1rem",
                      color: "#94a3b8",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {formatPhoneNumber(incomingCall.callingAddress)}
                  </div>
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ fontSize: "0.875rem" }}
                  >
                    <span className="text-success" style={{ fontWeight: "500" }}>
                      Incoming call
                    </span>
                    <span
                      className="bg-success rounded-circle"
                      style={{ width: "0.375rem", height: "0.375rem" }}
                    ></span>
                    <span style={{ color: "#94a3b8" }}>Ringing...</span>
                  </div>
                </div>
              </div> */}

              {/* Right - Controls */}
              {/* <div className="d-flex flex-column gap-3">
                {/* Bottom Row - Decline and Answer Buttons */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    onClick={handleRejectCall}
                    disabled={isDialing}
                    className="btn rounded-pill d-flex align-items-center gap-2"
                    style={{
                      padding: "0.625rem 1.75rem",
                      backgroundColor: "white",
                      border: "2px solid #f87171",
                      color: "#ef4444",
                      fontWeight: "500",
                      fontSize: "1rem",
                      cursor: isDialing ? "not-allowed" : "pointer",
                      opacity: isDialing ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDialing)
                        e.currentTarget.style.backgroundColor = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                      if (!isDialing)
                        e.currentTarget.style.backgroundColor = "white";
                    }}
                  >
                    <i
                      className="material-icons-two-tone"
                      style={{ fontSize: "1rem", color: "#ef4444" }}
                    >
                      call_end
                    </i>
                    Decline
                  </button>
                  <button
                    onClick={handleAttendCall}
                    disabled={isDialing || !hasPermission("dial-call-cti")}
                    className="btn rounded-pill d-flex align-items-center gap-2"
                    style={{
                      padding: "0.625rem 1.75rem",
                      fontWeight: "500",
                      fontSize: "1rem",
                      color: "white",
                      backgroundColor: "#22c55e",
                      border: "none",
                      cursor: isDialing ? "not-allowed" : "pointer",
                      opacity: isDialing ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isDialing && !e.currentTarget.disabled)
                        e.currentTarget.style.backgroundColor = "#16a34a";
                    }}
                    onMouseLeave={(e) => {
                      if (!isDialing && !e.currentTarget.disabled)
                        e.currentTarget.style.backgroundColor = "#22c55e";
                    }}
                  >
                    <i
                      className="material-icons-two-tone"
                      style={{ fontSize: "1rem", color: "#fff" }}
                    >
                      call
                    </i>
                    {isDialing ? "Answering..." : "Answer"}
                  </button>
                </div>
              {/* </div> */}
            {/* </div>
          </div>
        </div>
      )} */}
    </>
  );
};

export default GlobalFloatingCallBar;
