import React, { ReactNode, useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Footer from '@components/Footer';
import ApplicationSidebar from './Moduler/AppSidebar';

import ApplicationCustomerSidebar from './Moduler/AppCustomerSidebar';

import { useSession } from "next-auth/react";
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import { HEADER_CONSTANTS} from "@constants/headerConstants";
import ProfileSidebar from '@components/profile-sidebar';
import { useDialerModal } from '../contexts/DialerModalContext';

import CompanyLogo2 from "@assets/images/Prime3.png";
import { 
	Bell, ChevronLeft, ChevronRight, Users,
  Link,
  Phone,
  Search,
  X,
  PhoneCall,
  User
    } from 'lucide-react';
import { Badge, Button, Dropdown } from 'react-bootstrap';
import { useCti } from '@hooks/useCti';
import { useIncomingCall } from '../contexts/IncomingCallContext';
import { usePermissions } from '../utils/permissionUtils';
import { toast } from 'react-toastify';
import UserDummyImage from "@assets/images/user-dummy.jpg";
import { getStorageImageUrl } from "@utils/imageUtils";
import DeviceSelectionModal from '../components/DeviceSelectionModal';
import GlobalFloatingCallBar from '../components/GlobalFloatingCallBar';

interface LayoutProps {
	children: ReactNode;
}

const { MENU_LABELS, ICONS, PERMISSIONS, MENU_COLORS,BASE_URL } = HEADER_CONSTANTS;

const Layout = ({ children }: LayoutProps) => {

	const router = useRouter();
	const { data: session, status } = useSession();
	const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
	const { isOpen: isDialerOpen, openDialer, closeDialer } = useDialerModal();
  const { 
		isInitialized, 
		userAddress, 
		dnsMap, 
		attendCall, 
		endCall,
		getUserDataExtensions,
		activeCalls,
		formatDuration,
		makeCall,
		dialNumber,
		getAllUserDevices,
		getAvailableExtensions
	} = useCti();
	const { incomingCall, showIncomingCallModal, setIncomingCall, setShowIncomingCallModal } = useIncomingCall();
	const { hasPermission } = usePermissions();
	const [isDialing, setIsDialing] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
	const dialerButtonRef = useRef<HTMLButtonElement>(null);
	const [dialerPosition, setDialerPosition] = useState({ top: 0, right: 0 });
	const [dialedNumber, setDialedNumber] = useState('');
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<any[]>([]);
	const [pendingDialedNumber, setPendingDialedNumber] = useState('');

	// Format time ago helper
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

	// Create dummy notifications for testing
	const getDummyNotifications = (): NotificationItem[] => {
		const now = new Date();
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60000);
		const oneHourAgo = new Date(now.getTime() - 60 * 60000);
		const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60000);
		const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
		const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60000);

		return [
			{
				id: 'dummy-1',
				title: 'Keefe Bond added new tags to 💪 Design system',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				module: 'web design',
				timestamp: twoMinutesAgo,
				read: false,
				icon: undefined,
			},
			{
				id: 'dummy-2',
				title: 'Message',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: oneHourAgo,
				read: false,
			},
			{
				id: 'dummy-3',
				title: 'Challenge invitation',
				body: '<strong>Jonny aber</strong> invites to join the challenge',
				description: '<strong>Jonny aber</strong> invites to join the challenge',
				timestamp: twelveHoursAgo,
				read: false,
			},
			{
				id: 'dummy-4',
				title: 'Forms',
				body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: yesterday,
				read: true,
			},
			{
				id: 'dummy-5',
				title: 'Keefe Bond added new tags to 💪 Design system',
				body: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				module: 'Dashboard',
				timestamp: yesterday,
				read: true,
			},
			{
				id: 'dummy-6',
				title: 'Security',
				body: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
				timestamp: twoDaysAgo,
				read: true,
			},
		];
	};

	// Group notifications by date
	const groupNotificationsByDate = () => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Merge real notifications with dummy notifications
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

	// Calculate total unread count including dummy notifications
	const totalUnreadCount = unreadCount + getDummyNotifications().filter(n => !n.read).length;

	const [loggedInName, setLoggedInName] = useState('');
	const [loggedInUserRole, setLoggedInUserRole] = useState('');
	const [loggedInUserUsername, setLoggedInUserUsername] = useState('');
	const [loggedInUserProfilePicture, setLoggedInUserProfilePicture] = useState('');

  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

	useEffect(() => {
		if (status !=="loading" && session) {
		  if (typeof window !== "undefined") {
		    setLoggedInName(session.user.name || '');
		    setLoggedInUserUsername(session.user.username || '');
		    setLoggedInUserRole(session.user.role || '');
		    setLoggedInUserProfilePicture(session.user?.profile_picture || '');
		  }
		}
	    }, [ status, session]);

	// Get profile image URL, only if valid (not null, undefined, or empty string)
	const profileImageUrl = loggedInUserProfilePicture 
		? (getStorageImageUrl(loggedInUserProfilePicture) || null)
		: null;

	// Calculate dialer popup position when it opens
	useEffect(() => {
		if (isDialerOpen && dialerButtonRef.current) {
			const buttonRect = dialerButtonRef.current.getBoundingClientRect();
			const popupWidth = Math.min(625, window.innerWidth - 40); // maxWidth with margin
			const popupHeight = 400; // estimated height
			const spacing = 10;
			
			// Calculate right position (distance from right edge)
			let right = window.innerWidth - buttonRect.right;
			
			// If popup would go off-screen to the left, align it to the right edge with margin
			if (buttonRect.right - popupWidth < 20) {
				right = 20; // 20px from right edge
			}
			
			// Calculate top position
			let top = buttonRect.bottom + spacing;
			
			// If popup would go off-screen to the bottom, position it above the button
			if (top + popupHeight > window.innerHeight - 20) {
				top = buttonRect.top - popupHeight - spacing;
				// If still off-screen, position at top with margin
				if (top < 90) {
					top = 90; // Below header
				}
			}
			
			setDialerPosition({ top, right });
		}
	}, [isDialerOpen]);

	// Format phone number for display
	const formatPhoneNumber = (number: string): string => {
		// If it's an E.164 number (starts with +), return as-is
		if (number.startsWith("+")) {
			return number;
		}
		
		// Format as (XXX) XXX-XXXX if it's a 10-digit number
		const digits = number.replaceAll(/\D/g, "");
		if (digits.length === 10) {
			return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
		}
		return number;
	};

	// Get active call
	const activeCall = useMemo(() => {
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
				// Prioritize connected calls, then ringing, then dialing
				const priority = { connected: 3, ringing: 2, dialing: 1, onHold: 0 };
				return (priority[b.status as keyof typeof priority] || 0) - (priority[a.status as keyof typeof priority] || 0);
			})[0];
		
		return call || null;
	}, [activeCalls, userAddress]);

	// Get user extension data for the active call number
	const activeCallUserData = useMemo(() => {
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
			console.error(`[Layout] Error getting extension data for ${activeCall.number}:`, error);
			return null;
		}
	}, [activeCall, getUserDataExtensions]);

	// Get user name from extension data
	const activeCallUserName = useMemo(() => {
		if (!activeCallUserData) {
			return activeCall?.number || "Unknown";
		}
		return activeCallUserData.name || activeCallUserData.user_name || activeCall?.number || "Unknown";
	}, [activeCallUserData, activeCall]);

	// Check if user device is registered/online
	const isDeviceRegistered = useMemo(() => {
		if (!userAddress || !dnsMap || !dnsMap[userAddress]) {
			return false;
		}
		
		const userDevices = Object.values(dnsMap[userAddress].devices || {});
		if (userDevices.length === 0) {
			return false;
		}
		
		// Check if any device is registered
		return userDevices.some((device: any) => device.terminalState === 'REGISTERED');
	}, [userAddress, dnsMap]);

	// Get incoming call user data
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

	// Get incoming call user name
	const incomingCallUserName = useMemo(() => {
		if (!incomingCallUserData) {
			return incomingCall?.callingAddress || "Unknown";
		}
		return incomingCallUserData.name || incomingCallUserData.user_name || incomingCall?.callingAddress || "Unknown";
	}, [incomingCallUserData, incomingCall]);

	// Get incoming call user image URL
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

	// Get called address user data (the extension receiving the call)
	const calledAddressUserData = useMemo(() => {
		if (!incomingCall || !incomingCall.calledAddress || !getUserDataExtensions) {
			return null;
		}
		
		try {
			const userDataExtensions = getUserDataExtensions() || {};
			const callNumber = incomingCall.calledAddress;
			const dnString = String(callNumber);
			const dnNumber = Number(callNumber);
			
			const data = userDataExtensions[callNumber] || userDataExtensions[dnString] || userDataExtensions[dnNumber] || null;
			return data;
		} catch (error) {
			console.error(`[Layout] Error getting extension data for called address ${incomingCall.calledAddress}:`, error);
			return null;
		}
	}, [incomingCall, getUserDataExtensions]);

	// Get called address user name
	const calledAddressUserName = useMemo(() => {
		if (!calledAddressUserData) {
			return incomingCall?.calledAddress || "Unknown";
		}
		return calledAddressUserData.name || calledAddressUserData.user_name || incomingCall?.calledAddress || "Unknown";
	}, [calledAddressUserData, incomingCall]);

	// Handle attend call
	const handleAttendCall = async () => {
		if (!hasPermission("dial-call-cti")) {
			//toast.error("You do not have permission to answer calls");
			return;
		}

		if (!incomingCall) {
			//toast.error("No incoming call to attend");
			return;
		}

		const userDeviceInfo = dnsMap?.[userAddress || ''];
		if (!userDeviceInfo || !userDeviceInfo.devices) {
			//toast.error("No device information available");
			return;
		}

		const userDevices = Object.values(userDeviceInfo.devices);
		if (userDevices.length === 0) {
			//toast.error("No devices available");
			return;
		}

		let activeDevice: any = null;
		if (incomingCall.controllerDeviceName) {
			activeDevice = userDevices.find((device: any) => 
				device.deviceName === incomingCall.controllerDeviceName
			);
		}

		if (!activeDevice) {
			activeDevice = userDevices.find((device: any) => device.terminalState === 'REGISTERED') || userDevices[0];
		}

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
				setShowIncomingCallModal(false);
				setIncomingCall(null);
				//toast.success("Call attended successfully");
			} else {
				//toast.error(result.error || "Failed to attend call");
			}
		} catch (error) {
			//toast.error("Failed to attend call");
		} finally {
			setIsDialing(false);
		}
	};

	// Handle reject call
	const handleRejectCall = async () => {
		if (!incomingCall) {
			setShowIncomingCallModal(false);
			setIncomingCall(null);
			return;
		}

		try {
			// Check if there's an active call with matching callId (like GlobalFloatingCallBar does)
			const matchingActiveCall = Array.from(activeCalls.values()).find((call: any) => 
				call.callId === incomingCall.callId ||
				(call.callingAddress === incomingCall.callingAddress && call.calledAddress === incomingCall.calledAddress)
			);

			// Get device information for rejecting the call
			const userDeviceInfo = dnsMap?.[userAddress || ''];
			if (userDeviceInfo && userDeviceInfo.devices) {
				const userDevices = Object.values(userDeviceInfo.devices);
				if (userDevices.length > 0) {
					// Find controller device first
					let controllerDevice: any = null;
					if (incomingCall.controllerDeviceName) {
						controllerDevice = userDevices.find((device: any) => 
							device.deviceName === incomingCall.controllerDeviceName
						);
					}

					if (!controllerDevice) {
						controllerDevice = userDevices.find((device: any) => device.terminalState === 'REGISTERED') || userDevices[0];
					}

					// Get calling device info from active call (if available) or use default
					// This matches GlobalFloatingCallBar which uses activeCall.callingDeviceName
					const callingDeviceName = matchingActiveCall?.callingDeviceName || '';
					const callingDeviceType = matchingActiveCall?.callingDeviceType || '';

					// Reject the call through CTI - match GlobalFloatingCallBar format exactly
					if (controllerDevice && incomingCall.callId) {
						await endCall({
							callId: incomingCall.callId,
							callingAddress: incomingCall.callingAddress,
							calledAddress: incomingCall.calledAddress,
							callingDeviceType: callingDeviceType,
							callingDeviceName: callingDeviceName,
							controllerAddress: userAddress || '',
							controllerDeviceName: controllerDevice.deviceName || '',
							controllerDeviceType: controllerDevice.deviceType || ''
						} as any).catch(() => {
							// Silently fail if call already ended or rejected
						});
					}
				}
			}
		} catch (error) {
			console.error("Unable to reject call");
		} finally {
			// Close the modal and clear the incoming call state
			setShowIncomingCallModal(false);
			setIncomingCall(null);
			//toast.info("Call rejected");
		}
	};

	// Dialer handlers
	const handleNumberClick = (num: string) => {
		setDialedNumber(prev => prev + num);
	};

	const handleDial = async (numberToDial: string = dialedNumber) => {
		if (!numberToDial.trim()) {
			//toast.error("Please enter a number to dial");
			return;
		}

		// Check if user has multiple devices
		const userDevices = getAllUserDevices();
		if (!userDevices) {
			//toast.error("No calling device information available");
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
				//toast.success(`Calling ${numberToDial}...`);
				setDialedNumber("");
				closeDialer();
			} else {
				//toast.error(result.error || "Failed to make call");
			}
		} catch (error) {
			//toast.error("Failed to make call");
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
				//toast.success(`Calling ${numberToDial}...`);
				setDialedNumber("");
				closeDialer();
			} else {
				//toast.error(result.error || "Failed to make call");
			}
		} catch (error) {
			//toast.error("Failed to make call");
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
	    .header-logo{
		width: 180px;
		height: auto;
	    }

        @media (min-width: 992px) {
          .main-content-wrapper.sidebar-open {
            margin-left: 280px !important;
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

<div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>

 {/* Sidebar Toggle Button - Fixed Position */}
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

        {/* Top Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="link" 
              className="text-dark d-none d-lg-block p-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginLeft: '-10px' }}
            >
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </Button>
            <a className="navbar-brand fw-bold text-primary mb-0" href="#">
			<img src={CompanyLogo2.src} alt="logo" className="img-fluid header-logo" /></a>
          </div>

          
          

          

          {/* <GlobalFloatingCallBar /> */}


	    

          <div className="ms-auto d-flex align-items-center gap-5">




            <div className="d-flex align-items-center justify-content-end">
              <GlobalFloatingCallBar />

              {/* Call Button - Opens Dialer Modal */}
            {session?.user?.permissions?.includes(PERMISSIONS.DIAL_CALL_CTI) && (
              <Button 
                ref={dialerButtonRef}
                variant="link" 
                size="sm" 
                className="text-dark position-relative pointer-cursor" 
                style={{ cursor: 'pointer', padding: '0.5rem',marginRight: '10px' }}
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
                <i className="material-icons-two-tone" style={{ 
                  cursor: 'pointer', 
                  fontSize: '1.5rem', 
                  backgroundColor: '#1976d2', 
                  pointerEvents: 'none',
                  
                }}>dialpad</i>  
              </Button>
            )}


{session?.user?.permissions?.includes(PERMISSIONS.VIEW_USER_NOTIFICATIONS) && (
            <Dropdown 
              show={showNotificationDropdown} 
              onToggle={(isOpen) => setShowNotificationDropdown(isOpen)}
              align="end"
            >
              <Dropdown.Toggle 
                as={Button} 
                variant="link" 
                size="sm" 
                className="text-dark position-relative pc-head-link dropdown-toggle arrow-none me-0"
                style={{ border: 'none', padding: '0.5rem' }}
              >
                <Bell size={20} />
                {totalUnreadCount > 0 && (
                  <Badge 
                    bg="success" 
                    pill 
                    className="position-absolute pc-h-badge" 
                    style={{ 
                      top: '0', 
                      right: '0', 
                      fontSize: '0.65rem',
                     // transform: 'translate(25%, -25%)',
                      minWidth: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px'
                    }}
                  >
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-notification pc-h-dropdown" style={{ width: '350px', maxWidth: '90vw', overflowX: 'hidden' }}>
                <div className="dropdown-header d-flex align-items-center justify-content-between p-3 border-bottom">
                  <h5 className="m-0">Notifications</h5>
                  <ul className="list-inline ms-auto mb-0">
                    <li className="list-inline-item">
                      <Button 
                        variant="link" 
                        className="avtar avtar-s btn-link-hover-primary p-0"
                        style={{ minWidth: 'auto', padding: '0.25rem' }}
                      >
                        <Link size={18} />
                      </Button>
                    </li>
                  </ul>
                </div>

                <div 
                  className="dropdown-body text-wrap header-notification-scroll position-relative p-0" 
                  style={{ maxHeight: 'calc(100vh - 235px)', overflowY: 'auto', overflowX: 'hidden' }}
                >
                  {(() => {
                        const grouped = groupNotificationsByDate();
                        const allNotifications = [
                          ...grouped.today,
                          ...grouped.yesterday,
                          ...grouped.older
                        ].slice(0, 10); // Show max 10 notifications

                        if (allNotifications.length === 0) {
                          return (
                            <div className="p-4 text-center text-muted">
                              <p className="mb-0">No notifications</p>
                            </div>
                          );
                        }

                        return (
                          <ul className="list-group list-group-flush" style={{ overflowX: 'hidden' }}>
                            {allNotifications.map((notification, index) => {
                          const showDateLabel = index === 0 || 
                            (index > 0 && grouped.today.includes(notification) && !grouped.today.includes(allNotifications[index - 1])) ||
                            (index > 0 && grouped.yesterday.includes(notification) && !grouped.yesterday.includes(allNotifications[index - 1]));

                          const dateLabel = grouped.today.includes(notification) ? 'Today' :
                                           grouped.yesterday.includes(notification) ? 'Yesterday' : null;

                          return (
                            <li 
                              key={notification.id} 
                              className={`list-group-item ${notification.read ? '' : 'bg-light'}`}
                              style={{ overflowX: 'hidden', wordWrap: 'break-word' }}
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  if (notification.read === false && !notification.id.startsWith('dummy-')) {
                                    markAsRead(notification.id);
                                  }
                                  if (notification.url) {
                                    router.push(notification.url);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    if (notification.read === false && !notification.id.startsWith('dummy-')) {
                                      markAsRead(notification.id);
                                    }
                                    if (notification.url) {
                                      router.push(notification.url);
                                    }
                                  }
                                }}
                              >
                                {showDateLabel && dateLabel && (
                                  <p className="text-span text-muted mb-2 fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    {dateLabel}
                                  </p>
                                )}
                                <div className="d-flex">
                                <div className="flex-shrink-0">
                                  {notification.icon ? (
                                    <img 
                                      src={notification.icon} 
                                      alt="notification" 
                                      className="user-avtar avtar avtar-s rounded-circle"
                                      style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className={`avtar avtar-s bg-light-${notification.module ? 'primary' : 'info'}`}>
                                      <Bell size={18} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow-1 ms-3" style={{ minWidth: 0, overflow: 'hidden' }}>
                                  <div className="d-flex">
                                    <div className="flex-grow-1 me-3 position-relative" style={{ minWidth: 0 }}>
                                      <h6 className="mb-0 text-truncate" style={{ fontSize: '0.875rem' }}>
                                        {notification.title}
                                      </h6>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className="text-sm text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                        {formatTimeAgo(notification.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="position-relative mt-1 mb-2" style={{ fontSize: '0.8125rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                                    <span className="d-block" style={{ wordBreak: 'break-word' }}>
                                      {notification.description || notification.body}
                                    </span>
                                  </p>
                                  {notification.module && (
                                    <span className="badge bg-light-primary border border-primary me-1 mt-1" style={{ fontSize: '0.7rem' }}>
                                      {notification.module}
                                    </span>
                                  )}
                                </div>
                                </div>
                              </div>
                            </li>
                            );
                          })}
                          </ul>
                        );
                      })()}
                </div>

                <div className="dropdown-footer p-3 border-top">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="d-grid">
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => {
                            // Archive all functionality can be added here
                            markAllAsRead();
                          }}
                        >
                          Archive all
                        </Button>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-grid">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>
            )}

            <div 
              className="d-flex align-items-center gap-2" 
              onClick={() => setShowProfileSidebar(!showProfileSidebar)}
              style={{ cursor: 'pointer' }}
            >
              <div className="bg-primary bg-opacity-10 rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={loggedInName || ''} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <Users size={20} className="text-primary" />
                )}
              </div>
              <div className="d-none d-md-block">
                <small className="d-block fw-semibold">{loggedInName}</small>
                <small className="text-muted">
                  {loggedInUserRole ? (
                      <span>{loggedInUserRole}</span>
                    ) : (
                      <span>{loggedInUserUsername}</span>
                    )}
                </small>
              </div>
              
            </div>
            </div>




        
          </div>
        </div>
      </nav>

			{/* Incoming Call Modal - Fixed Position Overlay */}
			{showIncomingCallModal && incomingCall && (
				<div
					className="bg-white rounded-4 shadow"
					style={{
						position: "fixed",
						top: "90px",
						right: "20px",
						zIndex: 1050,
						maxWidth: "650px",
						width: "auto",
						padding: "1rem 1.25rem",
						boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
					}}
				>
					<div className="d-flex align-items-center justify-content-between">
						{/* Left - Avatar and Info */}
						<div className="d-flex align-items-center gap-3">
							<div
								className="position-relative"
								style={{
									width: "4rem",
									height: "4rem",
									minWidth: "4rem",
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
										fontSize: "1rem",
										fontWeight: "600",
										color: "#334155",
										marginBottom: "0.25rem",
									}}
								>
									{calledAddressUserName}
								</h3>
								{/* <div
									style={{
										fontSize: "0.875rem",
										color: "#64748b",
										marginBottom: "0.25rem",
									}}
								>
									{formatPhoneNumber(incomingCall.calledAddress)}
								</div> */}
								<div
									style={{
										fontSize: "1rem",
										color: "#94a3b8",
										marginBottom: "0.25rem",
									}}
								>
									{incomingCallUserName}
								</div>
								{/* <div
									style={{
										fontSize: "0.875rem",
										color: "#64748b",
										marginBottom: "0rem",
									}}
								>
									{formatPhoneNumber(incomingCall.callingAddress)}
								</div> */}
								
								<div
									className="d-flex align-items-center gap-2"
									style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}
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
						</div>

						{/* Right - Controls */}
						<div className="d-flex flex-column gap-3">
							{/* Bottom Row - Decline and Answer Buttons */}
							<div className="d-flex align-items-center gap-2">
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleRejectCall();
									}}
									disabled={false}
									className="btn rounded-pill d-flex align-items-center gap-2"
									style={{
										padding: "0.33rem 1em",
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
										padding: "0.33rem 1em",
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
						</div>
					</div>
				</div>
			)}

			{/* Dialer Popup - Positioned near dialer icon */}
			{isDialerOpen && (
				<>
					{/* Overlay to close on click outside */}
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
					{/* Dialer Popup */}
					<div
						className="bg-white rounded-4 shadow"
						style={{
							position: 'fixed',
							top: `${dialerPosition.top}px`,
							right: `${dialerPosition.right}px`,
							zIndex: 1050,
							width: 'calc(100vw - 40px)',
							maxWidth: '22rem',
							padding: '1.25rem',
							boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Header */}
						<div className="d-flex align-items-center justify-content-between mb-3">
							<div>
								{/* <User 
									size={20}
									
								/>
								<span>
									{loggedInName}
								</span> */}
							</div>
							<div>
							{isDeviceRegistered ? (
								<span className="badge" style={{ 
									padding: '0.375rem 1rem', 
									fontSize: '0.875rem', 
									fontWeight: '500', 
									borderRadius: '50rem', 
									backgroundColor: '#22c55e',
									color: '#fff'
								}}>
									Online
								</span>
							) : (
								<span className="badge" style={{ 
									padding: '0.375rem 1rem', 
									fontSize: '0.875rem', 
									fontWeight: '500', 
									borderRadius: '50rem', 
									backgroundColor: '#ef4444',
									color: '#fff'
								}}>
									Offline
								</span>
							)}
							</div>
						</div>

						{/* Active Call Info - Show at top if exists */}
						{/* {activeCall && (
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
						)} */}

						{/* Number Input Section */}
						<div className="mb-3">
							<div className="position-relative">
								<Search className="position-absolute" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={20} />
								<input
									type="text"
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
                  disabled={ !isDeviceRegistered}
									placeholder="Search name or type number"
									className="form-control"
									autoFocus
									style={{
										paddingLeft: '3rem',
										paddingRight: '1rem',
										paddingTop: '0.875rem',
										paddingBottom: '0.875rem',
										backgroundColor: '#f8fafc',
										border: '1px solid #e2e8f0',
										borderRadius: '0.75rem',
										fontSize: '1rem',
										fontWeight: 500,
										color: '#334155'
									}}
								/>
							</div>
							{/* {dialedNumber && (
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
							)} */}
						</div>

						{/* Quick Extension Buttons - Compact grid */}
						{/* {getAvailableExtensions && getAvailableExtensions().length > 0 && (
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
									className="row g-2"
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
														height: "3.5rem",
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
						)} */}

						{/* Dialpad Grid */}
						<div className="mb-3">
							<div className="row g-2">
								{dialpadButtons.map((btn) => (
									<div key={btn.num} className="col-4">
										<button
											onClick={() => handleNumberClick(btn.num)}
											className="btn w-100"
                      disabled={ !isDeviceRegistered}
											style={{
												height: '3.5rem',
												backgroundColor: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '0.75rem',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'center',
												justifyContent: 'center',
												transition: 'all 0.2s'
											}}
											onMouseEnter={(e) => {
												e.currentTarget.style.backgroundColor = '#f1f5f9';
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.backgroundColor = '#f8fafc';
											}}
										>
											<span style={{ fontSize: '1.5rem', fontWeight: '600', color: '#475569' }}>{btn.num}</span>
										</button>
									</div>
								))}
							</div>
						</div>

						{/* Call Button */}
						<button
							onClick={() => handleDial()}
							disabled={!dialedNumber.trim() || isDialing || !isDeviceRegistered}
							className="btn w-100 d-flex align-items-center justify-content-center gap-3 rounded-4"
							style={{
								padding: "1rem",
								fontSize: "1.125rem",
								fontWeight: 600,
								background: "linear-gradient(135deg, #2374d4, #4facfe)",
								border: "none",
								color: "white",
								cursor: (!dialedNumber.trim() || isDialing || !isDeviceRegistered) ? "not-allowed" : "pointer",
								opacity: (!dialedNumber.trim() || isDialing || !isDeviceRegistered) ? 0.6 : 1
							}}
							onMouseEnter={(e) => {
								if (!e.currentTarget.disabled && isDeviceRegistered) {
									e.currentTarget.style.background = "linear-gradient(135deg, rgb(15 83 164), rgb(79, 172, 254))";
								}
							}}
							onMouseLeave={(e) => {
								if (!e.currentTarget.disabled && isDeviceRegistered) {
									e.currentTarget.style.background = "linear-gradient(135deg, #2374d4, #4facfe)";
								}
							}}
							title={!isDeviceRegistered ? "Device is not registered. Please register your device to make calls." : ""}
						>
							{isDialing ? (
								<>
									<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
									Dialing...
								</>
							) : (
								<>
									<i className="material-icons-two-tone" style={{ fontSize: "1.5rem", color: "#fff" ,backgroundColor: '#fff'}}>
										call
									</i>
									Call
								</>
							)}
						</button>
					</div>
				</>
			)}

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
		
		<div className="d-flex flex-grow-1" style={{ position: 'relative', marginTop:'85px' }}>

          
            <ApplicationCustomerSidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
         

				<div className={`flex-grow-1 p-4 main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ 
				overflowY: 'auto',
				width: '100%'
				}}>
				<div className={"pc-content "}>
					{children}
				</div>
			</div>

			
		</div>
		
				{/* Profile Sidebar */}
        <ProfileSidebar 
        isOpen={showProfileSidebar} 
        onClose={() => setShowProfileSidebar(false)} 
      />


		<Footer />
		</div>
				
		</>
	);
};

export default Layout;

