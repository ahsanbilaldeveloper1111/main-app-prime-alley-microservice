import React, { ReactNode, useMemo, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Footer from "@components/Footer";
import ApplicationCustomerSidebar, {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "./Moduler/AppCustomerSidebar";
import { useSession } from "next-auth/react";
import { useNotifications } from "../contexts/NotificationContext";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { useDialerModal } from "../contexts/DialerModalContext";
import NotificationsSidebar from "@components/Notificationssidebar";
import BreezeAssistantSidebar from "@components/BreezeAssistantSidebar";
import { getCurrentUserCompanyImage } from "@utils/company";
import { useAuth } from "../hooks/useAuth";

import {
  Bell,
  ChevronDown,
  MoreVertical, 
  Phone,
  Search,
  X,
  User,
  HelpCircle,
  Settings,
  ExternalLink,
  Sparkles,
  Plus,
  MonitorCheck,
    } from 'lucide-react';
import { useCti } from '@hooks/useCti';
import { useIncomingCall, type IncomingCallData } from '../contexts/IncomingCallContext';
import { usePermissions } from '../utils/permissionUtils';
import { getSearchableRoutes, canAccessRoute, getRequiredPermissions } from '../config/permissions';
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import DeviceSelectionModal from '../components/DeviceSelectionModal';
import GlobalFloatingCallBar from '../components/GlobalFloatingCallBar';
import CreateLeadModal from '@components/CreateLeadModal';
import { CreateCompanySidebar } from '@components/renderCreateCompany';
import { CreateTicketSidebar } from '@components/renderCreateTicketForm';
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import CreateTaskModal from '@components/CreatePlannerTaskSidebar';
import {
  hasReliableCtiCallId,
  isSameCtiCallForActiveLookup,
  resolveCallIdForAttendApi,
  shouldDismissIncomingModalForAnsweredElsewhere,
} from "../utils/incomingCallMatching";

interface LayoutProps {
  children: ReactNode;
}

const { PERMISSIONS } = HEADER_CONSTANTS;

/** Device row from CTI dnsMap (before dialer normalization). */
interface CtiDnsDevice {
  deviceName?: string;
  deviceType?: string;
  terminalState?: string;
}

/** Active call entry from CTI `activeCalls` map (see `CtiContext`). */
interface CtiActiveCallEntry {
  id: string;
  number: string;
  startTime: Date;
  status: string;
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  callingDeviceType?: string;
  duration?: number;
}

/** Normalized device list from `getAllUserDevices` (see `src/utils/dialer.ts`). */
interface CtiDialerDevice {
  deviceName: string;
  deviceType: string;
  terminalState: string;
  when: string;
  details: string;
}

interface SearchableRouteItem {
  path: string;
  label: string;
}

type DnsMapLike = Record<
	string,
	{ devices?: Record<string, CtiDnsDevice> }
> | null | undefined;

function findMatchingActiveCall(
  activeCalls: Map<string, CtiActiveCallEntry>,
  incomingCall: IncomingCallData,
): CtiActiveCallEntry | undefined {
  const calls = Array.from(activeCalls.values());
  return calls.find((call) => isSameCtiCallForActiveLookup(call, incomingCall));
}

function findAnsweredIncomingCall(
  activeCalls: Map<string, CtiActiveCallEntry>,
  incomingCall: IncomingCallData
): CtiActiveCallEntry | undefined {
  const calls = Array.from(activeCalls.values()) as CtiActiveCallEntry[];
  return calls.find((call) => {
    const sameCall =
      call.callId === incomingCall.callId ||
      (call.callingAddress === incomingCall.callingAddress &&
        call.calledAddress === incomingCall.calledAddress);
    const notRinging = call.status && call.status !== 'ringing';
    return Boolean(sameCall && notRinging);
  });
}

function getNotificationsOverflowLabel(totalUnreadCount: number): string {
  if (totalUnreadCount <= 0) {
    return 'Notifications';
  }

  const countLabel = totalUnreadCount > 99 ? '99+' : String(totalUnreadCount);
  return `Notifications (${countLabel})`;
}

function getUserDevicesFromDnsMap(
  dnsMap: DnsMapLike,
  userAddress: string | undefined | null,
): CtiDnsDevice[] {
  const userDeviceInfo = dnsMap?.[userAddress || ""];
  if (!userDeviceInfo?.devices) return [];
  return Object.values(userDeviceInfo.devices);
}

function pickControllerDevice(
  userDevices: CtiDnsDevice[],
  preferredDeviceName?: string | null,
): CtiDnsDevice | null {
  if (!userDevices.length) return null;
  if (preferredDeviceName) {
    const match = userDevices.find(
      (device) => device.deviceName === preferredDeviceName,
    );
    if (match) return match;
  }
  return (
    userDevices.find((device) => device.terminalState === "REGISTERED") ||
    userDevices[0] ||
    null
  );
}

const Layout = ({ children }: LayoutProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { logout } = useAuth();
	const { unreadCount } = useNotifications();
	const { isOpen: isDialerOpen, openDialer, closeDialer } = useDialerModal();
  const {
		isInitialized,
		userAddress,
		dnsMap,
		attendCall,
		endCall,
		getUserDataExtensions,
		activeCalls,
		callStateMap,
		makeCall,
		dialNumber,
		getAllUserDevices
	} = useCti();

	const { incomingCall, showIncomingCallModal, setIncomingCall, setShowIncomingCallModal } = useIncomingCall();
	const { hasPermission } = usePermissions();
	const [isDialing, setIsDialing] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showNotificationsSidebar, setShowNotificationsSidebar] = useState(false);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showIconsDropdown, setShowIconsDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const iconsDropdownRef = useRef<HTMLDivElement>(null);
	const dialerButtonRef = useRef<HTMLButtonElement>(null);
	const [dialerPosition, setDialerPosition] = useState({ top: 0, right: 0 });
	const [dialedNumber, setDialedNumber] = useState('');
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<CtiDialerDevice[]>([]);
	const [pendingDialedNumber, setPendingDialedNumber] = useState('');
	const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);
	const headerLogoUrlRef = useRef<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
	const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchableRoutes = useMemo<SearchableRouteItem[]>(() => getSearchableRoutes() as SearchableRouteItem[], []);
	const searchSuggestions = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		const userPerms = session?.user?.permissions;
		return searchableRoutes.filter(
      (r: SearchableRouteItem) =>
				(r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)) &&
				canAccessRoute(userPerms, r.path)
		).slice(0, 10);
	}, [searchQuery, searchableRoutes, session?.user?.permissions]);
	const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
	const [showCreateCompanySidebar, setShowCreateCompanySidebar] = useState(false);
  const [showCreateTicketSidebar, setShowCreateTicketSidebar] = useState(false);
  const [showCreateTaskSidebar, setShowCreateTaskSidebar] = useState(false);
  const [showBreezeAssistant, setShowBreezeAssistant] = useState(false);
  const [breezeMaximized, setBreezeMaximized] = useState(false);

  // Allow any page/component to open the global AI Assistant (Breeze) sidebar
  // by dispatching: window.dispatchEvent(new CustomEvent("breeze-assistant:open"))
  useEffect(() => {
    const w = globalThis.window;
    if (!w) return;
    const handler = () => {
      setShowBreezeAssistant(true);
      setBreezeMaximized(false);
    };
    w.addEventListener("breeze-assistant:open", handler as EventListener);
    return () => {
      w.removeEventListener("breeze-assistant:open", handler as EventListener);
    };
  }, []);

  // When session is invalid (e.g. server restarted and in-memory store was cleared), redirect to signin.
  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (
      router.pathname.startsWith("/auth/") ||
      router.pathname === "/access-denied"
    )
      return;
    const callbackUrl = encodeURIComponent(router.asPath);
    router.replace(
      `/auth/signin?reason=session_expired&callbackUrl=${callbackUrl}`,
    );
  }, [status, router.pathname, router.asPath]);

  // Permission check: session has permissions from store (not cookie). Redirect to access-denied if user lacks required perms for this route.
  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.user ||
      router.pathname === "/access-denied"
    )
      return;
    const pathname = router.asPath.split("?")[0] || router.pathname;
    const required = getRequiredPermissions(pathname).filter(Boolean);
    if (required.length === 0) return;
    const userPerms = session.user.permissions ?? [];
    if (!canAccessRoute(userPerms, pathname)) {
      router.replace("/access-denied");
    }
  }, [router.pathname, router.asPath, status, session?.user?.permissions]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserCompanyImage()
      .then((blob) => {
        if (cancelled) return;
        if (blob && blob.size > 0) {
          setHeaderLogoUrl("");
        } else {
          setHeaderLogoUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) setHeaderLogoUrl(null);
      });
    return () => {
      cancelled = true;
      const url = headerLogoUrlRef.current;
      if (url) {
        URL.revokeObjectURL(url);
        headerLogoUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowSearchSuggestions(false);
        setSearchQuery("");
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalUnreadCount = unreadCount;

  const [loggedInName, setLoggedInName] = useState("");
  const [loggedInCompanyName, setLoggedInCompanyName] = useState("");
  const [loggedInUserProfilePicture, setLoggedInUserProfilePicture] =
    useState("");

  useEffect(() => {
    if (status !== "loading" && session?.user) {
      setLoggedInName(session.user.name ?? "");
      setLoggedInCompanyName(session.user.company_name ?? "");
      setLoggedInUserProfilePicture(session.user.profile_picture ?? "");
    }
  }, [
    status,
    session?.user?.name,
    session?.user?.company_name,
    session?.user?.profile_picture,
  ]);

  const profileImageUrl = loggedInUserProfilePicture
    ? getStorageImageUrl(loggedInUserProfilePicture) || null
    : null;

  useEffect(() => {
    if (isDialerOpen && dialerButtonRef.current) {
      const buttonRect = dialerButtonRef.current.getBoundingClientRect();
      const popupWidth = Math.min(625, window.innerWidth - 40);
      const popupHeight = 400;
      const spacing = 10;

      let right = window.innerWidth - buttonRect.right;

      if (buttonRect.right - popupWidth < 20) {
        right = 20;
      }

      let top = buttonRect.bottom + spacing;

      if (top + popupHeight > window.innerHeight - 20) {
        top = buttonRect.top - popupHeight - spacing;
        if (top < 90) {
          top = 90;
        }
      }

      setDialerPosition({ top, right });
    }
  }, [isDialerOpen]);

  const formatPhoneNumber = (number: string): string => {
    if (number.startsWith("+")) {
      return number;
    }

    const digits = number.replaceAll(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return number;
  };

  const isDeviceRegistered = useMemo(() => {
    if (!userAddress || !dnsMap?.[userAddress]) {
      return false;
    }

    const userDevices = Object.values(dnsMap[userAddress]?.devices || {});
    if (userDevices.length === 0) {
      return false;
    }

    return userDevices.some(
      (device: CtiDnsDevice) => device.terminalState === "REGISTERED",
    );
  }, [userAddress, dnsMap]);

  const incomingCallUserData = useMemo(() => {
    if (!incomingCall?.callingAddress || !getUserDataExtensions) {
      return null;
    }

    try {
      const userDataExtensions = getUserDataExtensions() || {};
      const callNumber = incomingCall.callingAddress;
      const dnString = String(callNumber);
      const dnNumber = Number(callNumber);

      const data =
        userDataExtensions[callNumber] ||
        userDataExtensions[dnString] ||
        userDataExtensions[dnNumber] ||
        null;
      return data;
    } catch (error) {
      toast.error(
        `Failed to load incoming call data: ${getErrorMessage(error)}`,
        {
          toastId: "layout_incoming_call_data_failed",
        },
      );
      return null;
    }
  }, [incomingCall, getUserDataExtensions]);

  const incomingCallUserName = useMemo(() => {
    if (!incomingCallUserData) {
      return incomingCall?.callingAddress || "Unknown";
    }
    return (
      incomingCallUserData.name ||
      incomingCallUserData.user_name ||
      incomingCall?.callingAddress ||
      "Unknown"
    );
  }, [incomingCallUserData, incomingCall]);

  const incomingCallUserImageUrl = useMemo(() => {
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

  // Close incoming call popup when the call is answered/connected elsewhere (e.g. Jabber).
  // Do not treat `dialing` as answered — transfer/consult often passes through that state first.
  useEffect(() => {
    if (!showIncomingCallModal || !incomingCall) return;
    const calls = Array.from(activeCalls.values());
    const answeredMatch = calls.find((call) =>
      shouldDismissIncomingModalForAnsweredElsewhere(call, incomingCall),
    );
    if (answeredMatch) {
      setShowIncomingCallModal(false);
      setIncomingCall(null);
    }
  }, [
    showIncomingCallModal,
    incomingCall,
    activeCalls,
    setShowIncomingCallModal,
    setIncomingCall,
  ]);

  const closeIncomingCallModal = () => {
    setShowIncomingCallModal(false);
    setIncomingCall(null);
  };

  const handleAttendCall = async () => {
    if (!hasPermission("dial-call-cti")) {
      return;
    }

    if (!incomingCall) {
      return;
    }

    const { callId: attendCallId } = resolveCallIdForAttendApi(
      incomingCall,
      Array.from(activeCalls.values()),
      { callStateMap: callStateMap ?? undefined },
    );

    const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
    const preferredName = incomingCall.controllerDeviceName?.trim() || null;
    const activeDevice = pickControllerDevice(userDevices, preferredName);
    if (!activeDevice) {
      toast.error(
        "No CTI device available to answer. Check that your phone is registered.",
        {
          toastId: "layout_attend_no_device",
        },
      );
      return;
    }

    if (!hasReliableCtiCallId(attendCallId)) {
      toast.error(
        "Call id is not ready yet. Wait a moment and try again, or refresh if this persists.",
        { toastId: "layout_attend_no_call_id" },
      );
      return;
    }

    setIsDialing(true);
    try {
      const controllerAddress =
        incomingCall.controllerAddress?.trim() || userAddress || "";

      const result = await attendCall({
        callId: attendCallId,
        callingAddress: incomingCall.callingAddress,
        calledAddress: incomingCall.calledAddress,
        controllerAddress,
        controllerDeviceName: activeDevice.deviceName || "WebCTI",
        controllerDeviceType: activeDevice.deviceType || "SOFT_HARD",
      });

      if (result.success) {
        closeIncomingCallModal();
      } else {
        const errMsg =
          (result as { error?: string }).error ||
          "Could not answer the call. Please try again.";
        toast.error(errMsg, { toastId: "layout_attend_api_failed" });
      }
    } catch (error) {
      toast.error(`Failed to attend call: ${getErrorMessage(error)}`, {
        toastId: "layout_attend_call_failed",
      });
    } finally {
      setIsDialing(false);
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return closeIncomingCallModal();

    try {
      const matchingActiveCall = findMatchingActiveCall(
        activeCalls,
        incomingCall,
      );
      const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
      const rejectPreferred = incomingCall.controllerDeviceName?.trim() || null;
      const controllerDevice = pickControllerDevice(
        userDevices,
        rejectPreferred,
      );

      const { callId: rejectCallId } = resolveCallIdForAttendApi(
        incomingCall,
        Array.from(activeCalls.values()),
        { callStateMap: callStateMap ?? undefined },
      );

      if (!controllerDevice || !hasReliableCtiCallId(rejectCallId)) return;

      const rowForReject =
        Array.from(activeCalls.values()).find(
          (c) => c.callId === rejectCallId,
        ) ?? matchingActiveCall;
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
        toastId: "layout_reject_call_failed",
      });
    } finally {
      closeIncomingCallModal();
    }
  };

  const handleNumberClick = (num: string) => {
    setDialedNumber((prev) => prev + num);
  };

  const handleDial = async (numberToDial: string = dialedNumber) => {
    if (!numberToDial.trim()) {
      return;
    }

    const userDevices = getAllUserDevices();
    if (!userDevices) {
      return;
    }

    if (userDevices.length > 1) {
      setAvailableDevices(userDevices);
      setPendingDialedNumber(numberToDial);
      setShowDeviceSelectionModal(true);
      return;
    }

    setIsDialing(true);
    try {
      const result = await dialNumber(numberToDial);

      if (result.success) {
        setDialedNumber("");
        closeDialer();
      }
    } catch (error) {
      toast.error(`Failed to place call: ${getErrorMessage(error)}`, {
        toastId: "layout_dial_failed",
      });
    } finally {
      setIsDialing(false);
    }
  };

  const handleDeviceSelect = async (device: CtiDialerDevice) => {
    const callingDevice = {
      callingAddress: userAddress,
      callingDeviceType: device.deviceType,
      callingDeviceName: device.deviceName,
    };

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

    setIsDialing(true);
    try {
      const result = await makeCall({
        callingAddress: callingDevice.callingAddress,
        calledAddress: numberToDial,
        callingDeviceType: callingDevice.callingDeviceType,
        callingDeviceName: callingDevice.callingDeviceName,
      });

      if (result.success) {
        setDialedNumber("");
        closeDialer();
      }
    } catch (error) {
      toast.error(`Failed to place call: ${getErrorMessage(error)}`, {
        toastId: "layout_make_call_failed",
      });
    } finally {
      setIsDialing(false);
    }
  };

  const mainContentWidth = useMemo(() => {
    if (!showBreezeAssistant) return "100%";
    if (breezeMaximized) return "0%";
    return "calc(100% - 400px)";
  }, [showBreezeAssistant, breezeMaximized]);

  const dialpadButtons = [
    { num: "1" },
    { num: "2" },
    { num: "3" },
    { num: "4" },
    { num: "5" },
    { num: "6" },
    { num: "7" },
    { num: "8" },
    { num: "9" },
    { num: "*" },
    { num: "0" },
    { num: "#" },
  ];

  return (
    <>
      <style>{`
        .main-content-wrapper {
          transition: margin-left 0.3s ease-in-out;
        }
          .app-content-area {
          margin-left:65px;
          }
        
        /* CRM Prime-style top bar */
        .app-topbar-merged {
          background: #00385d !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          height: 48px !important;
          padding: 0 16px !important;
        }
        
        /* Search bar styling */
        .crm-prime-search-wrapper {
          position: relative;
          width: 100%;
          max-width: 525px;
          min-width: 220px;
          flex: 0 1 525px;
        }
        
        .crm-prime-search-input {
          width: 100%;
          height: 34px;
          padding: 6px 36px 6px 14px;
          background:rgb(2, 68, 112);
          border: 1px solid #958c8c;
          border-radius: 20px;
          color: #fff;
          font-size: 14px;
          transition: background 0.2s, border-color 0.2s;
        }

        .topbar-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-actions-inline {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-actions-overflow {
          display: none;
          position: relative;
        }

        .topbar-overflow-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 190px;
          background: #ffffff;
          border: 1px solid #dfe3e8;
          border-radius: 6px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.14);
          z-index: 1050;
          padding: 6px 0;
        }

        .topbar-overflow-item {
          width: 100%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: #1f2937;
          text-align: left;
        }

        .topbar-overflow-item:hover {
          background: #f5f8fa;
        }

        .topbar-overflow-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .crm-prime-assistant-label {
          font-size: 13px;
          font-weight: 100;
        }
        
        .crm-prime-search-input::placeholder {
          color: #fff;
        }
        
        .crm-prime-search-input:hover {
          background: rgb(1, 83, 138);
        }
        
        .crm-prime-search-input:focus {
          outline: none;
          background: rgb(1, 83, 138);
          border-color: #fff;
          color: #fff;
        }
        
        .crm-prime-search-icon {
          position: absolute;
          right: 14px !important;
          top: 50%;
          transform: translateY(-50%);
          color: #fff;
          pointer-events: none;
        }
        
        .crm-prime-create-btn {
			position: absolute;
			right: -37px;
			top: 2px;
			
			width: 30px;
			height: 30px;
			border: 1px solid #c7c7c7;
			border-radius: 50%;
			background: transparent;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #fff;
			cursor: pointer;
			transition: all 0.2s;
			padding: 0;
        }
        
        .crm-prime-create-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #fff;
          color: #fff;
        }
        
        .create-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: -180px;
          background: white;
          border: 1px solid #dfe3e8;
          border-radius: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1050;
          min-width: 180px;
        }
        
        .create-dropdown-item {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          color: #000000;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.1s;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }
        
        .create-dropdown-item:hover {
          background: #f5f8fa;
        }
        
        /* Top bar icons */
        .crm-prime-topbar-icon {
          background: transparent;
          border: none;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.15s;
          position: relative;
          padding: 0;
        }
        
        .crm-prime-topbar-icon:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .crm-prime-topbar-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .crm-prime-topbar-icon.has-badge::after {
          content: attr(data-badge);
			position: absolute;
			top: 0px;
			right: -1px;
			background: red;
			color: white;
			font-size: 10px;
			font-weight: 600;
			padding: 2px 4px;
			border-radius: 8px;
			min-width: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			line-height: 1;
			border: none !important;
        }
        
        /* User menu button */
        .crm-prime-user-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.15s;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .crm-prime-user-menu:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .crm-prime-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 12px;
          overflow: hidden;
        }
        
        .crm-prime-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .crm-prime-user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .crm-prime-user-name {
          font-size: 13px;
          font-weight: 100;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.2;
        }
        
        /* User dropdown menu - compact design */
        .user-dropdown-menu {
          position: absolute;
          top: 100%;
          right: -16px;
          margin-top: 4px;
          width: 290px;
          background: white;
          border: 1px solid #dfe3e8;
          border-radius: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1050;
          max-height: calc(100vh - 60px);
          overflow-y: auto;
        }
        
        .user-dropdown-header {
          padding: 16px 16px 12px;
          border-bottom: 1px solid #cccccc;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .user-dropdown-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e3f2fd;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .user-dropdown-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .user-dropdown-header-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .user-dropdown-name {
          font-size: 16px;
          font-weight: 600;
          color: #141414;
          line-height: 1.3;
        }
        
        .user-dropdown-email {
          font-size:14px !important;
            color:#141414;
            font-weight:100;
          line-height: 1.3;
        }
        
        .user-dropdown-link {
          color: #006162 !important;
font-size:14px;
font-weight:600;
          text-decoration: none;
          display: inline-block;
          margin-top: 4px;
          text-decoration: underline;
        }
        
        .user-dropdown-link:hover {
          color: #007a8f;
          border-bottom-color: #007a8f;
        }
        
        .user-dropdown-section {
          padding: 0 0 5px 0;
          border-bottom: 1px solid #cccccc;
        }
        
        .user-dropdown-section:last-child {
          border-bottom: none;
        }
        
        .user-dropdown-item {
          display: flex;
          align-items: center;
          /*gap: 8px;*/
          padding: 8px 16px;
          color: #000000;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.1s;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          line-height: 1.7;
		  font-weight: 600;
        }
        
        .user-dropdown-item:hover {
          background: #f5f8fa;
        }
        
        .user-dropdown-item-icon {
          width: 14px;
          height: 14px;
          color: #666666;
          flex-shrink: 0;
        }
        
        .user-dropdown-item-text {
          flex: 1;
        }
        
        .user-dropdown-item-badge {
         background: #00823a;
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-radius: 10px;
        }
        
        .user-dropdown-section-label {
          padding: 10px 16px 6px;
          font-size: 14px;
          font-weight: 600;
          color: #8a8a8a !important;
          text-transform: capitalize;
        }
        
        .user-dropdown-account-info {
          padding: 8px 16px;
        }
        
        .user-dropdown-account-name {
          font-size: 14px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 2px;
          line-height: 1.3;
        }
        
        .user-dropdown-account-id {
          font-size: 11px;
          color: #666666;
          line-height: 1.3;
        }
        
        .user-dropdown-credits {
          display: block;
          padding: 8px 16px;
        }
        .user-dropdown-credits-head {
         display: flex;
  flex-direction: column;   /* 👈 This makes content go to next line */
  align-items: flex-start;
        }
        
        .user-dropdown-credits-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .user-dropdown-credits-text {
          font-size: 13px;
          color: #33475b;
          font-weight: 500;
        }
        
        .user-dropdown-credits-count {
          font-size: 11px;
          color: #666666;
          margin-top: -3px;
        }
        
        .user-dropdown-view-only {
          /*display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f5f8fa;
          border: 1px solid #dfe3e8;
          border-radius: 3px;
          margin: 12px 16px;
          font-size: 12px;
          color: #33475b;
          font-weight: 500;*/

		  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 9px;
  background: transparent;
  border: none;
  border-radius: 3px;
  margin: 12px 16px;
  font-size: 10px;
  color: #000;
  font-weight: 700;
  width: anchor-size;
  text-align: center;
  padding: 5px 8px;
  border-radius: 10px;
  background: #ccc;
  width: 97px;

  border-radius: 15px;
        }
        
        .user-dropdown-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid #f0f3f5;
        }
        
        .user-dropdown-footer-link {
          color: #006162 !important;
			font-size: 12px;
			font-weight: 500;
			text-decoration: none;
			border-bottom: 1px solid #006162;
			cursor: pointer;
      border: none !important;
      border-bottom: 1px solid #006162 !important;
      background: transparent !important;
        }
        
        .user-dropdown-footer-link:hover {
          color: #007a8f;
          border-bottom-color: #007a8f;
        }
          @media (max-width: 1400px) {
          
          
          .crm-prime-search-wrapper {
            max-width: 320px;
          }
          
        }

        @media (max-width: 1200px) {
          .topbar-actions-inline {
            display: none;
          }

          .topbar-actions-overflow {
            display: block;
          }

          .crm-prime-assistant-label {
            display: none;
          }
        }
        
        @media (max-width: 991px) {
        .crm-prime-create-btn {
          display: none;
        }
          .app-topbar-merged { 
            /*left: 0 !important; 
            width: 100% !important; */
          }
          /*.app-content-area { 
            margin-left: 0 !important; 
          }*/
          
          .crm-prime-user-info {
            display: none;
          }

          .crm-prime-search-wrapper {
            width: 200px;
            min-width: 200px;
            max-width: 200px;
          }

          .topbar-actions-group {
            gap: 6px;
          }
        }

        @media (min-width: 992px) {
          .main-content-wrapper.sidebar-open {
            margin-left: 0 !important;
          }
          .main-content-wrapper.sidebar-closed {
            margin-left: 0 !important;
          }
        }
        
        @media (max-width: 991px) {
          .main-content-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

<div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f0f0f0' }}>



        {/* Top bar */}
        <nav
          className="navbar navbar-expand-lg app-topbar-merged"
          style={{
            position: "fixed",
            top: 0,
            left: isSidebarExpanded
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
            width: `calc(100% - ${isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED}px)`,
            zIndex: 999,
            transition: "left 0.3s ease-in-out, width 0.3s ease-in-out",
          }}
        >
          <div className="container-fluid p-0" style={{ height: "48px" }}>
            <div className="d-flex align-items-center h-100 w-100">
              {/* Search bar */}
              <div
                ref={searchWrapperRef}
                className="crm-prime-search-wrapper"
                style={{ position: "relative" }}
              >
                <Search
                  className="crm-prime-search-icon"
                  size={14}
                  style={{ right: "40px" }}
                />
                <input
                  type="text"
                  className="crm-prime-search-input"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                />
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div
                    className="create-dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      maxHeight: 320,
                      overflowY: "auto",
                      zIndex: 1050,
                    }}
                  >
                    {searchSuggestions.map((r: SearchableRouteItem) => (
                      <button
                        key={r.path}
                        type="button"
                        className="create-dropdown-item"
                        onClick={() => {
                          if (canAccessRoute(session?.user?.permissions, r.path)) {
                            router.push(r.path);
                            setSearchQuery("");
                            setShowSearchSuggestions(false);
                          }
                        }}
                      >
                        <span>{r.label}</span>
                        <span className="text-muted small ms-1">{r.path}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Create Button */}
              <div>
                  <button
                    type="button"
                    className="crm-prime-create-btn"
                    onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                    title="Create new"
                  >
                    <Plus size={14} />
                  </button>

                  {/* Create Dropdown */}
                  {showCreateDropdown && (
                    <>
                      <button
                        type="button"
                        aria-label="Close create menu"
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1040,
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "default",
                        }}
                        onClick={() => setShowCreateDropdown(false)}
                      />
                      <div className="create-dropdown-menu">
                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_CRM_LEADS,
                        ) && (
                          <button
                            type="button"
                            className="create-dropdown-item"
                            onClick={() => {
                              setShowCreateDropdown(false);
                              setShowCreateLeadModal(true);
                            }}
                          >
                            Lead
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_COMPANIES_CRM,
                        ) && (
                          <button
                            className="create-dropdown-item"
                            onClick={() => {
                              setShowCreateDropdown(false);
                              setShowCreateCompanySidebar(true);
                            }}
                          >
                            Company
                          </button>
                        )}

                        {session?.user?.permissions?.includes(
                          PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM,
                        ) && (
                          <button
                            type="button"
                            className="create-dropdown-item"
                            onClick={() => {
                              setShowCreateDropdown(false);
                              router.push("/crm/inbox");
                            }}
                          >
                            Inbox
                          </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.MANAGE_HELP_CENTER) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          setShowCreateTicketSidebar(true);
                        }}>
                        Ticket
                          </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER) && (
                        <button type="button" className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          setShowCreateTaskSidebar(true);
                        }}>
                        Task
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

            {/* Icons and user menu */}
            <div className="ms-auto d-flex align-items-center" style={{ gap: '10px' }}>
              <GlobalFloatingCallBar />

              <div className="topbar-actions-group">
                <div className="topbar-actions-inline">
                  {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
                    <button
                      type="button"
                      ref={dialerButtonRef}
                      className="crm-prime-topbar-icon"
                      disabled={!isInitialized}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInitialized) {
                          openDialer();
                        }
                      }}
                      title="Open Dialer"
                    >
                      <Phone size={14} />
                    </button>
                  )}

                  {session?.user?.permissions?.includes(PERMISSIONS.COMMUNICATIONS_SERVICES) && session?.user?.permissions?.includes(PERMISSIONS.VIEW_CTI) && (
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      onClick={() => {
                        router.push('/communications/wallboards-live');
                      }}
                      title="Wallboards (Live)"
                    >
                      <MonitorCheck size={14} />
                    </button>
                  )}

                    <button
                      type="button"
                      className={`crm-prime-topbar-icon ${totalUnreadCount > 0 ? 'has-badge' : ''}`}
                      data-badge={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      onClick={() => setShowNotificationsSidebar(true)}
                      title="Notifications"
                    >
                      <Bell size={14} />
                    </button>
                  

                  {session?.user?.permissions?.includes(PERMISSIONS.FOR_VIEW_HELP_CENTER_SERVICES) && (   
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      title="Help"
                      onClick={() => router.push('/help-center')}
                    >
                      <HelpCircle size={18} />
                    </button>
                    )}
                  

                  {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                    <button
                      type="button"
                      className="crm-prime-topbar-icon"
                      title="Settings"
                      onClick={() => router.push('/main-settings')}
                    >
                      <Settings size={18} />
                    </button>
                  )}
                </div>

                <div ref={iconsDropdownRef} className="topbar-actions-overflow">
                  <button
                    type="button"
                    className="crm-prime-topbar-icon"
                    onClick={() => setShowIconsDropdown((prev) => !prev)}
                    title="More actions"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {showIconsDropdown && (
                    <div className="topbar-overflow-menu">
                      {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          disabled={!isInitialized}
                          onClick={() => {
                            if (!isInitialized) return;
                            setShowIconsDropdown(false);
                            openDialer();
                          }}
                        >
                          <Phone size={16} />
                          <span>Dialer</span>
                        </button>
                      )}
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CTI) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            setShowIconsDropdown(false);
                            router.push('/communications/wallboards-live');
                          }}
                        >
                          <MonitorCheck size={16} />
                          <span>Wallboards</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_USER_NOTIFICATIONS) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            setShowIconsDropdown(false);
                            setShowNotificationsSidebar(true);
                          }}
                        >
                          <Bell size={16} />
                          <span>{getNotificationsOverflowLabel(totalUnreadCount)}</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_HELP_CENTER) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            setShowIconsDropdown(false);
                            router.push('/help-center');
                          }}
                        >
                          <HelpCircle size={16} />
                          <span>Help</span>
                        </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                        <button
                          type="button"
                          className="topbar-overflow-item"
                          onClick={() => {
                            setShowIconsDropdown(false);
                            router.push('/main-settings');
                          }}
                        >
                          <Settings size={16} />
                          <span>Settings</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div style={{ 
                width: '1px', 
                height: '28px', 
                background: 'rgba(255, 255, 255, 0.2)',
                margin: '0 4px'
              }} />

              {/* Assistant Icon */}
                {/* <button className="crm-prime-topbar-icon" title="AI Assistant" style={{ width: 'auto', padding: '0 12px', gap: '6px' }}> */}
                {session?.user?.permissions?.includes(PERMISSIONS.AI_ML_SERVICES) && (
              <button 
                type="button"
                className="crm-prime-topbar-icon" 
                title="AI Assistant" 
                style={{ width: 'auto', padding: '0 12px', gap: '6px' }}
                onClick={() => setShowBreezeAssistant(!showBreezeAssistant)}
              >
                <Sparkles size={18} />
                <span className="crm-prime-assistant-label">AI Assistant</span>
                  </button>
                )}

                {/* Divider */}
                <div
                  style={{
                    width: "1px",
                    height: "28px",
                    background: "rgba(255, 255, 255, 0.2)",
                    margin: "0 4px",
                  }}
                />

                {/* User Menu with Dropdown */}
                <div ref={userDropdownRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="crm-prime-user-menu"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="crm-prime-user-avatar">
                      {headerLogoUrl ? (
                        <img
                          src={headerLogoUrl}
                          alt={loggedInCompanyName || ""}
                        />
                      ) : (
                        loggedInCompanyName?.charAt(0)?.toUpperCase() || (
                          <User size={14} />
                        )
                      )}
                    </div>
                    <div className="crm-prime-user-info">
                      <div>
                        <div className="crm-prime-user-name">
                          {loggedInCompanyName || ""}
                        </div>
                      </div>
                      <ChevronDown
                        size={14}
                        style={{ color: "rgba(255, 255, 255, 0.6)" }}
                      />
                    </div>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="user-dropdown-menu">
                      {/* Header */}
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-avatar">
                          {profileImageUrl ? (
                            <img
                              src={profileImageUrl}
                              alt={loggedInName || ""}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "#006162",
                              }}
                            >
                              {loggedInName?.charAt(0)?.toUpperCase() || "H"}
                            </div>
                          )}
                        </div>

                        <div className="user-dropdown-header-text">
                          <div className="user-dropdown-name">
                            {loggedInName || ""}
                          </div>
                          <div className="user-dropdown-email">
                            {session?.user?.role || ""}
                          </div>
                          <a href="/profile" className="user-dropdown-link">
                            Profile & Preferences
                          </a>
                        </div>
                      </div>

                      {/* View Only Badge */}
                      {/* <div className="user-dropdown-view-only">
                        <Eye size={14} style={{ color: '#000000' }} />
                        <span>View Only</span>
                      </div> */}

                      {/* Request edit access */}
                      {/* <div className="user-dropdown-section">
                        <button className="user-dropdown-item">
                          <span className="user-dropdown-item-text">Request edit access</span>
                        </button>
                      </div> */}

                      {/* Theme */}
                      {/* <div className="user-dropdown-section">
                        <div className="user-dropdown-section-label">Theme</div>
                        <button className="user-dropdown-item">
                          <span className="user-dropdown-item-text">Switch to the classic theme</span>
                        </button>
                        <button className="user-dropdown-item">
                          <MessageCircle className="user-dropdown-item-icon" size={14} />
                          <span className="user-dropdown-item-text">Give theme feedback</span>
                        </button>
                      </div> */}

                      {/* Account */}
                      <div className="user-dropdown-section">
                        <div className="user-dropdown-section-label">
                          Account
                        </div>
                        <div className="user-dropdown-account-info">
                          <div className="user-dropdown-account-name">
                            {session?.user?.company_name}
                          </div>
                          <div className="user-dropdown-account-id">
                            {session?.user?.company_identifier}
                          </div>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="user-dropdown-section">
                        
                          {session?.user?.permissions?.includes(PERMISSIONS.TICKETS_SERVICES) && (
                            <button
                              type="button"
                              className="user-dropdown-item"
                              onClick={() => {
                                setShowUserDropdown(false);
                                router.push('/crm/tickets');
                              }}
                            >
                              {/* <Ticket className="user-dropdown-item-icon" size={14} /> */}
                              <span className="user-dropdown-item-text">Raise a ticket</span>
                            </button>
                          )}
                          
                          {session?.user?.permissions?.includes(PERMISSIONS.ACCOUNTS_SERVICES) && (
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/pricing')}>
                          {/* <CreditCard className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Pricing & Features</span>
                          <ExternalLink size={10} style={{ marginLeft: 'auto', color: '#666666' }} />
                            </button>
                          )}
                          
                          {session?.user?.permissions?.some((permission) =>
                            [
                              PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING,
                              PERMISSIONS.VIEW_BILLING_HISTORY_BILLING,
                              PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING,
                              PERMISSIONS.VIEW_INVOICES_BILLING,
                       
                              PERMISSIONS.VIEW_ORDER_INVOICES_BILLING
                            ].includes(permission as any)
                          ) && (
                     
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/billing/account-billing')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Account & Billing</span>
                        </button>
                        )}

                          
                        {session?.user?.permissions?.includes(PERMISSIONS.WORK_PLANNER_SERVICES) && (
                        <button type="button" className="user-dropdown-item" onClick={() => router.push('/planner/tasks')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Tasks</span>
                        </button>
                        )}

                  {   session?.user?.permissions?.includes(PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER) && (   <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => router.push("/planner/calendar")}
                        >
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">
                            Calendar
                          </span>
                        </button>)}

                        {session?.user?.permissions?.includes(PERMISSIONS.ACCOUNTS_SERVICES) && (
                        <button
                          type="button"
                          className="user-dropdown-item user-dropdown-credits-head"
                        >
                          <div className="d-flex align-items-center justify-content-between w-100 gap-2">
                            <span className="user-dropdown-item-text">Prime Credits</span>
                            <span className="user-dropdown-item-badge">New</span>
                          </div>
                          <div className="user-dropdown-credits-count">0 of 0 credits available</div>
                        </button>
                        )}
                        {session?.user?.permissions?.includes(PERMISSIONS.PRODUCT_UPDATES_SERVICES) && (
                          <button type="button" className="user-dropdown-item">
                          {/* <Briefcase className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">
                            Product Updates
                          </span>
                        </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.GENERAL_SERVICES) && (
                          <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => router.push("/main-settings")}
                        >
                            {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                            <span className="user-dropdown-item-text">
                            Settings
                          </span>
                          </button>
                        )}
                      </div>

                      {/* Footer with Sign out and Privacy */}
                      <div className="user-dropdown-footer">
                        <button
                          type="button"
                          className="user-dropdown-footer-link"
                          onClick={() => {
                            setShowUserDropdown(false);
                            logout();
                          }}
                        >
                          Sign out
                        </button>
                        <button
                          type="button"
                          className="user-dropdown-footer-link"
                          onClick={() => router.push('/privacy-policy')}
                        >
                          Privacy policy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Incoming call (attend/reject): primary UI for the transfer recipient / callee while the offer
            is pending. Transfer initiator keeps GlobalFloatingCallBar on their consult leg instead. */}
        {showIncomingCallModal && incomingCall && (
          <div
            className="bg-white rounded shadow"
            style={{
              position: "fixed",
              top: "60px",
              right: "20px",
              zIndex: 1050,
              maxWidth: "400px",
              width: "auto",
              padding: "1rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: "48px", height: "48px", minWidth: "48px" }}>
                <img
                  src={incomingCallUserImageUrl}
                  alt={incomingCallUserName}
                  className="rounded-circle"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = UserDummyImage.src;
                  }}
                />
              </div>
              <div className="flex-grow-1">
                <h6
                  className="mb-1"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  {incomingCallUserName}
                </h6>
                <div style={{ fontSize: "13px", color: "#6c757d" }}>
                  {formatPhoneNumber(incomingCall?.callingAddress ?? "")}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#22c55e",
                    marginTop: "4px",
                  }}
                >
                  Incoming call...
                </div>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectCall}
                  className="btn btn-sm btn-outline-danger rounded-circle"
                  style={{ width: "36px", height: "36px", padding: 0 }}
                >
                  <X size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleAttendCall}
                  disabled={isDialing}
                  className="btn btn-sm btn-success rounded-circle"
                  style={{ width: "36px", height: "36px", padding: 0 }}
                >
                  <Phone size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dialer Popup */}
        {isDialerOpen && (
          <>
            <button
              type="button"
              aria-label="Close dialer"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1040,
                backgroundColor: "transparent",
                border: "none",
                padding: 0,
                cursor: "default",
              }}
              onClick={() => {
                closeDialer();
                setDialedNumber("");
              }}
            />
            <div
              className="bg-white rounded shadow"
              style={{
                position: "fixed",
                top: `${dialerPosition.top}px`,
                right: `${dialerPosition.right}px`,
                zIndex: 1050,
                width: "calc(100vw - 40px)",
                maxWidth: "320px",
                padding: "1rem",
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6
                  className="mb-0"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                >
                  Dialer
                </h6>
                <span
                  className={`badge ${isDeviceRegistered ? "bg-success" : "bg-danger"}`}
                  style={{ fontSize: "11px" }}
                >
                  {isDeviceRegistered ? "Online" : "Offline"}
                </span>
              </div>

              <div className="mb-3">
                <input
                  type="text"
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
                  disabled={!isDeviceRegistered}
                  placeholder="Enter number"
                  className="form-control"
                  autoFocus
                />
              </div>

              <div className="mb-3">
                <div className="row g-2">
                  {dialpadButtons.map((btn) => (
                    <div key={btn.num} className="col-4">
                      <button
                        type="button"
                        onClick={() => handleNumberClick(btn.num)}
                        className="btn btn-outline-secondary w-100"
                        disabled={!isDeviceRegistered}
                        style={{
                          height: "48px",
                          fontSize: "18px",
                          fontWeight: 600,
                        }}
                      >
                        {btn.num}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDial()}
                disabled={
                  !dialedNumber.trim() || isDialing || !isDeviceRegistered
                }
                className="btn btn-primary w-100"
              >
                {isDialing ? "Dialing..." : "Call"}
              </button>
            </div>
          </>
        )}

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

        <div
          className="d-flex flex-grow-1 app-content-area"
          style={{
            position: "relative",
            marginTop: "48px",
            marginLeft: isSidebarExpanded
              ? SIDEBAR_WIDTH_EXPANDED
              : SIDEBAR_WIDTH_COLLAPSED,
            transition: "margin-left 0.3s ease-in-out",
          }}
        >
          <ApplicationCustomerSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isSidebarExpanded={isSidebarExpanded}
            setSidebarExpanded={setIsSidebarExpanded}
          />

          {/* <div className="flex-grow-1 p-3 main-content-wrapper" style={{ 
				overflowY: 'auto',
				// width: showBreezeAssistant ? 'calc(100% - 400px)' : '100%',
        width: showBreezeAssistant && !breezeMaximized ? 'calc(100% - 400px)' : '100%',
				transition: 'width 0.3s ease-in-out',
        display: showBreezeAssistant && breezeMaximized ? 'none' : 'block',
				}}>
				<div className="pc-content">
					{children}
				</div>
			</div> */}

          <div
            className="flex-grow-1 p-3 main-content-wrapper"
            style={{
              overflowY: "auto",
              width: mainContentWidth,
              overflow: breezeMaximized ? "hidden" : "auto",
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div className="pc-content">{children}</div>
          </div>

          {/* Breeze AI Assistant Sidebar */}
          {showBreezeAssistant && (
            <BreezeAssistantSidebar
              isOpen={showBreezeAssistant}
              onClose={() => {
                setShowBreezeAssistant(false);
                setBreezeMaximized(false);
              }}
              isMaximized={breezeMaximized}
              onMaximizeChange={(v) => setBreezeMaximized(v)}
              width={breezeMaximized ? "100%" : "400px"}
            />
          )}
        </div>

        <Footer />
      </div>

    	{/* Notifications Sidebar */}
		<NotificationsSidebar
			isOpen={showNotificationsSidebar}
			onClose={() => setShowNotificationsSidebar(false)}
		/>

		{/* Create Lead Sidebar (from header Create dropdown) */}
		<CreateLeadModal
			show={showCreateLeadModal}
			onHide={() => setShowCreateLeadModal(false)}
			onSuccess={() => setShowCreateLeadModal(false)}
		/>

		{/* Create Company Sidebar (from header Create dropdown) */}
		{showCreateCompanySidebar && (
			<CreateCompanySidebar
				onClose={() => setShowCreateCompanySidebar(false)}
			/>
		)}

    {showCreateTicketSidebar && (
      <CreateTicketSidebar
        onClose={() => setShowCreateTicketSidebar(false)}
        onSuccess={() => setShowCreateTicketSidebar(false)}
      />
    )}

    <CreateTaskModal
      isOpen={showCreateTaskSidebar}
      onClose={() => setShowCreateTaskSidebar(false)}
      onCreate={() => setShowCreateTaskSidebar(false)}
    />
		</>
	);
};

export default Layout;
