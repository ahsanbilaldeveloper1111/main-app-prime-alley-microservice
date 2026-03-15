import React, { ReactNode, useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationCustomerSidebar, { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from './Moduler/AppCustomerSidebar';
import { useSession } from "next-auth/react";
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import { HEADER_CONSTANTS} from "@constants/headerConstants";
import { useDialerModal } from '../contexts/DialerModalContext';
import NotificationsSidebar from '@components/Notificationssidebar';
import BreezeAssistantSidebar from '@components/BreezeAssistantSidebar';
import { getCurrentUserCompanyImage } from "@utils/company";
import { useAuth } from '../hooks/useAuth';

import { 
	Bell, ChevronLeft, ChevronRight,ChevronDown,
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
import {Button} from 'react-bootstrap';
import { useCti } from '@hooks/useCti';
import { useIncomingCall } from '../contexts/IncomingCallContext';
import { usePermissions } from '../utils/permissionUtils';
import { getSearchableRoutes, canAccessRoute, getRequiredPermissions } from '../config/permissions';
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import DeviceSelectionModal from '../components/DeviceSelectionModal';
import GlobalFloatingCallBar from '../components/GlobalFloatingCallBar';
import CreateLeadModal from '@components/CreateLeadModal';
import { CreateCompanySidebar, CompanyFormPayload } from '@components/renderCreateCompany';
import { createCompany } from '@utils/crm';

interface LayoutProps {
	children: ReactNode;
}

const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

function findMatchingActiveCall(activeCalls: Map<any, any>, incomingCall: any) {
	const calls = Array.from(activeCalls.values());
	return calls.find((call: any) =>
		call.callId === incomingCall.callId ||
		(call.callingAddress === incomingCall.callingAddress && call.calledAddress === incomingCall.calledAddress)
	);
}

function getUserDevicesFromDnsMap(dnsMap: any, userAddress: string | undefined | null): any[] {
	const userDeviceInfo = dnsMap?.[userAddress || ''];
	if (!userDeviceInfo?.devices) return [];
	return Object.values(userDeviceInfo.devices);
}

function pickControllerDevice(userDevices: any[], preferredDeviceName?: string | null): any {
	if (!userDevices.length) return null;
	if (preferredDeviceName) {
		const match = userDevices.find((device: any) => device.deviceName === preferredDeviceName);
		if (match) return match;
	}
	return userDevices.find((device: any) => device.terminalState === 'REGISTERED') || userDevices[0] || null;
}

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();
	const { data: session, status } = useSession();
  const { logout } = useAuth();
	const { notifications, unreadCount } = useNotifications();
	const { isOpen: isDialerOpen, openDialer, closeDialer } = useDialerModal();
  const { 
		isInitialized, 
		userAddress, 
		dnsMap, 
		attendCall, 
		endCall,
		getUserDataExtensions,
		activeCalls,
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
	const dialerButtonRef = useRef<HTMLButtonElement>(null);
	const [dialerPosition, setDialerPosition] = useState({ top: 0, right: 0 });
	const [dialedNumber, setDialedNumber] = useState('');
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<any[]>([]);
	const [pendingDialedNumber, setPendingDialedNumber] = useState('');
	const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);
	const headerLogoUrlRef = useRef<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
	const searchWrapperRef = useRef<HTMLDivElement>(null);
	const searchableRoutes = useMemo(() => getSearchableRoutes(), []);
	const searchSuggestions = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return [];
		const userPerms = session?.user?.permissions;
		return searchableRoutes.filter(
			(r) =>
				(r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)) &&
				canAccessRoute(userPerms, r.path)
		).slice(0, 10);
	}, [searchQuery, searchableRoutes, session?.user?.permissions]);
	const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
	const [showCreateCompanySidebar, setShowCreateCompanySidebar] = useState(false);
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
      w.removeEventListener(
        "breeze-assistant:open",
        handler as EventListener,
      );
    };
  }, []);

  // When session is invalid (e.g. server restarted and in-memory store was cleared), redirect to signin.
  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (router.pathname.startsWith('/auth/') || router.pathname === '/access-denied') return;
    const callbackUrl = encodeURIComponent(router.asPath);
    router.replace(`/auth/signin?reason=session_expired&callbackUrl=${callbackUrl}`);
  }, [status, router.pathname, router.asPath]);

  // Permission check: session has permissions from store (not cookie). Redirect to access-denied if user lacks required perms for this route.
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user || router.pathname === '/access-denied') return;
    const pathname = router.asPath.split('?')[0] || router.pathname;
    const required = getRequiredPermissions(pathname).filter(Boolean);
    if (required.length === 0) return;
    const userPerms = session.user.permissions ?? [];
    if (!canAccessRoute(userPerms, pathname)) {
      router.replace('/access-denied');
    }
  }, [router.pathname, router.asPath, status, session?.user?.permissions]);

	useEffect(() => {
		let cancelled = false;
		getCurrentUserCompanyImage()
			.then((blob) => {
				if (cancelled) return;
				if (blob && blob.size > 0) {
					setHeaderLogoUrl('');
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
			if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
				setShowSearchSuggestions(false);
				setSearchQuery('');
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const formatTimeAgo = (date: Date) => {
		try {
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 1) return 'Just now';
			if (diffMins < 60) return `${diffMins} min ago`;
			if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
			if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
			return date.toLocaleDateString();
		} catch {
			return 'Just now';
		}
	};

	const getDummyNotifications = (): NotificationItem[] => {
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60000);
		const oneHourAgo = new Date(now.getTime() - 60 * 60000);
		const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60000);

		return [
			{
				id: 'dummy-1',
				title: 'New deal created',
				body: "A new deal has been added to your pipeline.",
				description: "A new deal has been added to your pipeline.",
				module: 'CRM',
				timestamp: twoMinutesAgo,
				read: false,
				icon: undefined,
			},
			{
				id: 'dummy-2',
				title: 'Meeting reminder',
				body: "You have a meeting in 30 minutes.",
				description: "You have a meeting in 30 minutes.",
				timestamp: oneHourAgo,
				read: false,
			},
			{
				id: 'dummy-3',
				title: 'Task completed',
				body: 'Your task has been marked as complete.',
				description: 'Your task has been marked as complete.',
				timestamp: twelveHoursAgo,
				read: true,
			},
		];
	};

	const groupNotificationsByDate = () => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const allNotifications = [...notifications, ...getDummyNotifications()];

		const groups: { [key: string]: NotificationItem[] } = {
			today: [],
			yesterday: [],
			older: []
		};

		allNotifications.forEach(notification => {
			const notifDate = new Date(notification.timestamp);
			if (notifDate >= today) {
				groups.today.push(notification);
			} else if (notifDate >= yesterday) {
				groups.yesterday.push(notification);
			} else {
				groups.older.push(notification);
			}
		});

		return groups;
	};

	const totalUnreadCount = unreadCount;

  const [loggedInName, setLoggedInName] = useState('');
  const [loggedInCompanyName, setLoggedInCompanyName] = useState('');
  
	const [loggedInUserRole, setLoggedInUserRole] = useState('');
	const [loggedInUserUsername, setLoggedInUserUsername] = useState('');
	const [loggedInUserProfilePicture, setLoggedInUserProfilePicture] = useState('');

	useEffect(() => {
		if (status !== "loading" && session?.user) {
		  if (typeof window !== "undefined") {
		    setLoggedInName(session.user.name ?? '');
		    setLoggedInCompanyName(session.user.company_name ?? '');
		    setLoggedInUserUsername(session.user.username ?? '');
		    setLoggedInUserRole(session.user.role ?? '');
		    setLoggedInUserProfilePicture(session.user.profile_picture ?? '');
		  }
		}
	}, [
	  status,
	  session?.user?.name,
	  session?.user?.company_name,
	  session?.user?.username,
	  session?.user?.role,
	  session?.user?.profile_picture,
	]);

	const profileImageUrl = loggedInUserProfilePicture 
		? (getStorageImageUrl(loggedInUserProfilePicture) || null)
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

	const activeCall = useMemo(() => {
		const call = Array.from(activeCalls.values())
			.filter((call) => {
				const involvesUser = userAddress && (
					call.callingAddress === userAddress || 
					call.calledAddress === userAddress
				);
				
				const hasValidStatus = ["connected", "ringing", "dialing", "onHold"].includes(call.status);
				
				return involvesUser && hasValidStatus;
			})
			.sort((a, b) => {
				const priority = { connected: 3, ringing: 2, dialing: 1, onHold: 0 };
				return (priority[b.status as keyof typeof priority] || 0) - (priority[a.status as keyof typeof priority] || 0);
			})[0];
		
		return call || null;
	}, [activeCalls, userAddress]);

	const activeCallUserData = useMemo(() => {
		if (!activeCall || !activeCall.number || !getUserDataExtensions) {
			return null;
		}
		
		try {
			const userDataExtensions = getUserDataExtensions() || {};
			const callNumber = activeCall.number;
			const dnString = String(callNumber);
			const dnNumber = Number(callNumber);
			
			const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
			
			return data;
		} catch (error) {
			console.error(`[Layout] Error getting extension data for ${activeCall.number}:`, error);
			return null;
		}
	}, [activeCall, getUserDataExtensions]);

	const activeCallUserName = useMemo(() => {
		if (!activeCallUserData) {
			return activeCall?.number || "Unknown";
		}
		return activeCallUserData.name || activeCallUserData.user_name || activeCall?.number || "Unknown";
	}, [activeCallUserData, activeCall]);

	const isDeviceRegistered = useMemo(() => {
		if (!userAddress || !dnsMap || !dnsMap[userAddress]) {
			return false;
		}
		
		const userDevices = Object.values(dnsMap[userAddress].devices || {});
		if (userDevices.length === 0) {
			return false;
		}
		
		return userDevices.some((device: any) => device.terminalState === 'REGISTERED');
	}, [userAddress, dnsMap]);

	const incomingCallUserData = useMemo(() => {
		if (!incomingCall || !incomingCall.callingAddress || !getUserDataExtensions) {
			return null;
		}
		
		try {
			const userDataExtensions = getUserDataExtensions() || {};
			const callNumber = incomingCall.callingAddress;
			const dnString = String(callNumber);
			const dnNumber = Number(callNumber);
			
			const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
			return data;
		} catch (error) {
			console.error(`[Layout] Error getting extension data for incoming call ${incomingCall.callingAddress}:`, error);
			return null;
		}
	}, [incomingCall, getUserDataExtensions]);

	const incomingCallUserName = useMemo(() => {
		if (!incomingCallUserData) {
			return incomingCall?.callingAddress || "Unknown";
		}
		return incomingCallUserData.name || incomingCallUserData.user_name || incomingCall?.callingAddress || "Unknown";
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

	// Close incoming call popup when the call is answered/connected (e.g. from Jabber or another device)
	useEffect(() => {
		if (!showIncomingCallModal || !incomingCall) return;
		const calls = Array.from(activeCalls.values());
		const answeredMatch = calls.find((call: any) => {
			const sameCall = call.callId === incomingCall.callId ||
				(call.callingAddress === incomingCall.callingAddress && call.calledAddress === incomingCall.calledAddress);
			const notRinging = call.status && call.status !== "ringing";
			return sameCall && notRinging;
		});
		if (answeredMatch) {
			setShowIncomingCallModal(false);
			setIncomingCall(null);
		}
	}, [showIncomingCallModal, incomingCall, activeCalls, setShowIncomingCallModal, setIncomingCall]);

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

		const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
		const activeDevice = pickControllerDevice(userDevices, incomingCall.controllerDeviceName);
		if (!activeDevice) return;

		setIsDialing(true);
		try {
			const result = await attendCall({
				callId: incomingCall.callId,
				callingAddress: incomingCall.callingAddress,
				calledAddress: incomingCall.calledAddress,
				controllerAddress: userAddress || '',
				controllerDeviceName: activeDevice.deviceName || 'WebCTI',
				controllerDeviceType: activeDevice.deviceType || 'SOFT_HARD'
			});

			if (result.success) {
				closeIncomingCallModal();
			}
		} catch (error) {
			// Silent
		} finally {
			setIsDialing(false);
		}
	};

	const handleRejectCall = async () => {
		if (!incomingCall) return closeIncomingCallModal();

		try {
			const matchingActiveCall = findMatchingActiveCall(activeCalls, incomingCall);
			const userDevices = getUserDevicesFromDnsMap(dnsMap, userAddress);
			const controllerDevice = pickControllerDevice(userDevices, incomingCall.controllerDeviceName);

			if (!controllerDevice || !incomingCall.callId) return;

			const callingDeviceName = matchingActiveCall?.callingDeviceName || '';
			const callingDeviceType = matchingActiveCall?.callingDeviceType || '';

			await endCall({
				callId: incomingCall.callId,
				callingAddress: incomingCall.callingAddress,
				calledAddress: incomingCall.calledAddress,
				callingDeviceType,
				callingDeviceName,
				controllerAddress: userAddress || '',
				controllerDeviceName: controllerDevice.deviceName || '',
				controllerDeviceType: controllerDevice.deviceType || ''
			} as any).catch(() => {});
		} catch (error) {
			console.error("Unable to reject call");
		} finally {
			closeIncomingCallModal();
		}
	};

	const handleNumberClick = (num: string) => {
		setDialedNumber(prev => prev + num);
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
			// Silent
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
			// Silent
		} finally {
			setIsDialing(false);
		}
	};

	const dialpadButtons = [
		{ num: '1' },
		{ num: '2' },
		{ num: '3' },
		{ num: '4' },
		{ num: '5' },
		{ num: '6' },
		{ num: '7' },
		{ num: '8' },
		{ num: '9' },
		{ num: '*' },
		{ num: '0' },
		{ num: '#' }
	];

	return (
		<>
		<style>{`
        .main-content-wrapper {
          transition: margin-left 0.3s ease-in-out;
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
        }
        
        .user-dropdown-footer-link:hover {
          color: #007a8f;
          border-bottom-color: #007a8f;
        }
        
        @media (max-width: 991px) {
          .app-topbar-merged { 
            left: 0 !important; 
            width: 100% !important; 
          }
          .app-content-area { 
            margin-left: 0 !important; 
          }
          .crm-prime-search-wrapper {
            max-width: 220px;
          }
          .crm-prime-user-info {
            display: none;
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

 {/* Sidebar Toggle Button (mobile) */}
 <Button
          variant="primary"
          className="position-fixed d-lg-none"
          style={{
            top: '80px',
            left: sidebarOpen ? '270px' : '10px',
            zIndex: 1100,
            width: '40px',
            height: '40px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'left 0.3s ease-in-out'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>

        {/* Top bar */}
        <nav
          className="navbar navbar-expand-lg app-topbar-merged"
          style={{
            position: 'fixed',
            top: 0,
            left: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
            width: `calc(100% - ${isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED}px)`,
            zIndex: 999,
            transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
          }}
        >
        <div className="container-fluid p-0" style={{ height: '48px' }}>
          <div className="d-flex align-items-center h-100 w-100">
            {/* Search bar */}
            <div ref={searchWrapperRef} className="crm-prime-search-wrapper" style={{ position: 'relative' }}>
              <Search className="crm-prime-search-icon" size={14} style={{ right: '40px' }} />
              <input
                type="text"
                className="crm-prime-search-input"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => searchQuery.trim() && setShowSearchSuggestions(true)}
                style={{ paddingRight: '68px' }}
              />
              {showSearchSuggestions && searchQuery.trim() && searchSuggestions.length > 0 && (
                <div
                  className="create-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
                >
                  {searchSuggestions.map((r) => (
                    <button
                      key={r.path}
                      type="button"
                      className="create-dropdown-item"
                      onClick={() => {
                        if (canAccessRoute(session?.user?.permissions, r.path)) {
                          router.push(r.path);
                          setSearchQuery('');
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
              {/* Create Button */}
                <div >
                
                <button
                  className="crm-prime-create-btn"
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  title="Create new"
                >
                  <Plus size={14} />
                    </button>
                
                
                {/* Create Dropdown */}
                {showCreateDropdown && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1040,
                      }}
                      onClick={() => setShowCreateDropdown(false)}
                    />
                      <div className="create-dropdown-menu">
                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CRM_LEADS) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          setShowCreateLeadModal(true);
                        }}>
                        Lead
                      </button>
                      )}

                      {session?.user?.permissions?.includes(PERMISSIONS.VIEW_COMPANIES_CRM) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          setShowCreateCompanySidebar(true);
                        }}>
                        Company
                          </button>
                        )}

                        {session?.user?.permissions?.includes(PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          router.push('/crm/inbox');
                        }}>
                        Inbox
                      </button>
                      )}

                        {session?.user?.permissions?.includes(PERMISSIONS.MANAGE_HELP_CENTER) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false);
                          router.push('/help-center/my-tickets/new');
                        }}>
                        Ticket
                          </button>
                      )}

                        {session?.user?.permissions?.includes(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER) && (
                        <button className="create-dropdown-item" onClick={() => {
                          setShowCreateDropdown(false); /* Add Task handler */
                          router.push('/planner/tasks');
                        }}>
                        Task
                          </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Icons and user menu */}
            <div className="ms-auto d-flex align-items-center" style={{ gap: '10px' }}>
              <GlobalFloatingCallBar />

              {/* Dialer Button */}
              {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
                <button
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

                {/* Dialer Button */}
              {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CTI) && (
                <button
                  className="crm-prime-topbar-icon"
                  onClick={(e) => {
                    router.push('/communications/wallboards-live');
                  }}
                  title="Wallboards (Live)"
                >
                  <MonitorCheck size={14} />
                </button>
              )}

              
{/* Notifications - opens sidebar */}
{session?.user?.permissions?.includes(PERMISSIONS.VIEW_USER_NOTIFICATIONS) && (
<button
                className={`crm-prime-topbar-icon ${totalUnreadCount > 0 ? 'has-badge' : ''}`}
                data-badge={totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                onClick={() => setShowNotificationsSidebar(true)}
                title="Notifications"
              >
                <Bell size={14} />
                  </button>
              )}
 {/* Help Icon */}

 {session?.user?.permissions?.includes(PERMISSIONS.VIEW_HELP_CENTER) && (
                <button className="crm-prime-topbar-icon" title="Help"
                onClick={() => router.push('/help-center')}
                >
                <HelpCircle size={18} />
                  </button>
              )}

                {/* Settings Icon */}
              {session?.user?.permissions?.includes(PERMISSIONS.VIEW_SETTINGS) && (
                <button className="crm-prime-topbar-icon" title="Settings"
                onClick={() => router.push('/main-settings')}
                >
                <Settings size={18} />
                  </button>
              )}
              {/* Divider */}
              <div style={{ 
                width: '1px', 
                height: '28px', 
                background: 'rgba(255, 255, 255, 0.2)',
                margin: '0 4px'
              }} />

              {/* Assistant Icon */}
                {/* <button className="crm-prime-topbar-icon" title="AI Assistant" style={{ width: 'auto', padding: '0 12px', gap: '6px' }}> */}
                {session?.user?.permissions?.includes(PERMISSIONS.LIVE_CHAT_USERS) && (
              <button 
                className="crm-prime-topbar-icon" 
                title="AI Assistant" 
                style={{ width: 'auto', padding: '0 12px', gap: '6px' }}
                onClick={() => setShowBreezeAssistant(!showBreezeAssistant)}
              >
                <Sparkles size={18} />
                <span style={{ fontSize: '13px', fontWeight: 100 }}>AI Assistant</span>
                  </button>
              )}

              {/* Divider */}
              <div style={{ 
                width: '1px', 
                height: '28px', 
                background: 'rgba(255, 255, 255, 0.2)',
                margin: '0 4px'
              }} />

             

            

              {/* User Menu with Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  className="crm-prime-user-menu"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="crm-prime-user-avatar">
                    {headerLogoUrl ? (
                      <img src={headerLogoUrl} alt={loggedInCompanyName || ''} />
                    ) : (
                      loggedInCompanyName?.charAt(0)?.toUpperCase() || <User size={14} />
                    )}
                  </div>
                  <div className="crm-prime-user-info">
                    <div>
                      <div className="crm-prime-user-name">{loggedInCompanyName || ''}</div>
                    </div>
                    <ChevronDown size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1040,
                      }}
                      onClick={() => setShowUserDropdown(false)}
                    />
                    
                    <div className="user-dropdown-menu">
                      {/* Header */}
                      <div className="user-dropdown-header">
                        <div className="user-dropdown-avatar">
                          {profileImageUrl ? (
                            <img src={profileImageUrl} alt={loggedInName || ''} />
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: 600,
                              color: '#006162'
                            }}>
                              {loggedInName?.charAt(0)?.toUpperCase() || 'H'}
                            </div>
                          )}
                          </div>
                          
                        <div className="user-dropdown-header-text">
                          <div className="user-dropdown-name">
                            {loggedInName || ''}
                          </div>
                          <div className="user-dropdown-email">
                            {session?.user?.role || ''}
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
                        <div className="user-dropdown-section-label">Account</div>
                        <div className="user-dropdown-account-info">
                          <div className="user-dropdown-account-name">{session?.user?.company_name}</div>
                          <div className="user-dropdown-account-id">{session?.user?.company_identifier}</div>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="user-dropdown-section">
                        
                          {session?.user?.permissions?.includes('tickets-tickets') && (
                            <button className="user-dropdown-item" onClick={() => router.push('/crm/tickets')}>
                              {/* <Ticket className="user-dropdown-item-icon" size={14} /> */}
                              <span className="user-dropdown-item-text">Raise a ticket</span>
                            </button>
                          )}
                          
                          
                        <button className="user-dropdown-item">
                          {/* <CreditCard className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Pricing & Features</span>
                          <ExternalLink size={10} style={{ marginLeft: 'auto', color: '#666666' }} />
                          </button>
                          
                          {session?.user?.permissions?.includes(PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING) && (
                        <button className="user-dropdown-item" onClick={() => router.push('/billing/account-billing')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Account & Billing</span>
                        </button>
                        )}

                          
{session?.user?.permissions?.includes(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER) && (
                        <button className="user-dropdown-item" onClick={() => router.push('/planner/tasks')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Tasks</span>
                        </button>
                        )}

<button className="user-dropdown-item" onClick={() => router.push('/planner/calendar')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Calendar</span>
                        </button>




                          
                        <button className="user-dropdown-item user-dropdown-credits-head">
                         
                            <span className="user-dropdown-item-text">CRM Prime Credits</span>
                            
                          
                          <div className="user-dropdown-credits-count">1500 of 1500 credits available</div>
                        </button>
                        <button className="user-dropdown-item">
                          {/* <Briefcase className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Product Updates</span>
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => router.push('/main-settings')}>
                          {/* <FileText className="user-dropdown-item-icon" size={14} /> */}
                          <span className="user-dropdown-item-text">Settings</span>
                        </button>
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
                          onClick={() => router.push('/main-settings/privacy-consent')}
                        >
                          Privacy policy
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

			{/* Incoming Call Modal */}
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
							<h6 className="mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
								{incomingCallUserName}
							</h6>
							<div style={{ fontSize: '13px', color: '#6c757d' }}>
								{formatPhoneNumber(incomingCall.callingAddress)}
							</div>
							<div style={{ fontSize: '12px', color: '#22c55e', marginTop: '4px' }}>
								Incoming call...
							</div>
						</div>
						<div className="d-flex gap-2">
							<button
								onClick={handleRejectCall}
								className="btn btn-sm btn-outline-danger rounded-circle"
								style={{ width: '36px', height: '36px', padding: 0 }}
							>
								<X size={18} />
							</button>
							<button
								onClick={handleAttendCall}
								disabled={isDialing}
								className="btn btn-sm btn-success rounded-circle"
								style={{ width: '36px', height: '36px', padding: 0 }}
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
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 1040,
							backgroundColor: 'transparent'
						}}
						onClick={() => {
							closeDialer();
							setDialedNumber("");
						}}
					/>
					<div
						className="bg-white rounded shadow"
						style={{
							position: 'fixed',
							top: `${dialerPosition.top}px`,
							right: `${dialerPosition.right}px`,
							zIndex: 1050,
							width: 'calc(100vw - 40px)',
							maxWidth: '320px',
							padding: '1rem',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="d-flex align-items-center justify-content-between mb-3">
							<h6 className="mb-0" style={{ fontSize: '14px', fontWeight: 600 }}>Dialer</h6>
							<span className={`badge ${isDeviceRegistered ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '11px' }}>
								{isDeviceRegistered ? 'Online' : 'Offline'}
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
											onClick={() => handleNumberClick(btn.num)}
											className="btn btn-outline-secondary w-100"
											disabled={!isDeviceRegistered}
											style={{ height: '48px', fontSize: '18px', fontWeight: 600 }}
										>
											{btn.num}
										</button>
									</div>
								))}
							</div>
						</div>

						<button
							onClick={() => handleDial()}
							disabled={!dialedNumber.trim() || isDialing || !isDeviceRegistered}
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
            position: 'relative',
            marginTop: '48px',
            marginLeft: isSidebarExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
            transition: 'margin-left 0.3s ease-in-out',
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
    overflowY: 'auto',
    width: showBreezeAssistant
      ? breezeMaximized
        ? '0%'          // ← collapse to 0 when maximized
        : 'calc(100% - 400px)'
      : '100%',
    overflow: breezeMaximized ? 'hidden' : 'auto',
    transition: 'width 0.3s ease-in-out'
  }}
>
  <div className="pc-content">
    {children}
  </div>
</div>
      

			{/* Breeze AI Assistant Sidebar */}
			{showBreezeAssistant && (
				// <BreezeAssistantSidebar
				// 	isOpen={showBreezeAssistant}
				// 	onClose={() => setShowBreezeAssistant(false)}
				// 	onMaximize={() => {
				// 		console.log('Maximize Breeze Assistant');
				// 	}}
				// 	width="400px"
				// 	onSendMessage={async (message: string) => {
				// 		await new Promise(resolve => setTimeout(resolve, 1000));
				// 		return "I'm here to help! This is a demo response. You can customize the message handling by implementing the onSendMessage callback.";
				// 	}}
				// />
<BreezeAssistantSidebar
       isOpen={showBreezeAssistant}
       onClose={() => { setShowBreezeAssistant(false); setBreezeMaximized(false); }}
       isMaximized={breezeMaximized}
       onMaximizeChange={(v) => setBreezeMaximized(v)}
       width={breezeMaximized ? '100%' : '400px'}
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
				onSave={async (data: CompanyFormPayload) => {
					await createCompany(data);
					setShowCreateCompanySidebar(false);
				}}
			/>
		)}
		</>
	);
};

export default Layout;
