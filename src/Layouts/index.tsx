import React, { ReactNode, useMemo, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Footer from "@components/Footer";
import ApplicationCustomerSidebar, {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "./Moduler/AppCustomerSidebar";
import { useSession } from "next-auth/react";
import { useDialerModal } from "../contexts/DialerModalContext";
import NotificationsSidebar from "@components/Notificationssidebar";
import BreezeAssistantSidebar from "@components/BreezeAssistantSidebar";
import { useCti } from "@hooks/useCti";
import { canAccessRoute, getRequiredPermissions } from '../config/permissions';
import DeviceSelectionModal from "../components/DeviceSelectionModal";
import CreateLeadModal from '@components/CreateLeadModal';
import { CreateCompanySidebar } from '@components/renderCreateCompany';
import { CreateTicketSidebar } from '@components/renderCreateTicketForm';
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import CreateTaskModal from '@components/CreatePlannerTaskSidebar';
import {
  LayoutDialerPopup,
  LayoutGlobalStyles,
  LayoutTopBar,
  type CtiDialerDevice,
  type CtiDnsDevice,
} from "./components";
import { useAppDispatch, useAppSelector } from "../toolkit/hooks";
import {
  openBreezeAssistant,
  setBreezeMaximized,
  setDialedNumber,
  setShowBreezeAssistant,
  setShowCreateCompanySidebar,
  setShowCreateLeadModal,
  setShowCreateTaskSidebar,
  setShowCreateTicketSidebar,
  setShowNotificationsSidebar,
} from "../toolkit/layoutUi/slice";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: session, status } = useSession();
	const { isOpen: isDialerOpen, closeDialer } = useDialerModal();

  const isSidebarExpanded = useAppSelector((s) => s.layoutUi.isSidebarExpanded);
  const dialerPosition = useAppSelector((s) => s.layoutUi.dialerPosition);
  const dialedNumber = useAppSelector((s) => s.layoutUi.dialedNumber);
  const showBreezeAssistant = useAppSelector((s) => s.layoutUi.showBreezeAssistant);
  const breezeMaximized = useAppSelector((s) => s.layoutUi.breezeMaximized);
  const showNotificationsSidebar = useAppSelector(
    (s) => s.layoutUi.showNotificationsSidebar,
  );
  const showCreateLeadModal = useAppSelector((s) => s.layoutUi.showCreateLeadModal);
  const showCreateCompanySidebar = useAppSelector(
    (s) => s.layoutUi.showCreateCompanySidebar,
  );
  const showCreateTicketSidebar = useAppSelector(
    (s) => s.layoutUi.showCreateTicketSidebar,
  );
  const showCreateTaskSidebar = useAppSelector(
    (s) => s.layoutUi.showCreateTaskSidebar,
  );

  const {
		userAddress,
		dnsMap,
		makeCall,
		dialNumber,
		getAllUserDevices
	} = useCti();

	const [isDialing, setIsDialing] = useState(false);
	const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
	const [availableDevices, setAvailableDevices] = useState<CtiDialerDevice[]>([]);
	const [pendingDialedNumber, setPendingDialedNumber] = useState('');

  // Allow any page/component to open the global AI Assistant (Breeze) sidebar
  // by dispatching: window.dispatchEvent(new CustomEvent("breeze-assistant:open"))
  useEffect(() => {
    const w = globalThis.window;
    if (!w) return;
    const handler = () => {
      dispatch(openBreezeAssistant());
    };
    w.addEventListener("breeze-assistant:open", handler as EventListener);
    return () => {
      w.removeEventListener("breeze-assistant:open", handler as EventListener);
    };
  }, [dispatch]);

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
        dispatch(setDialedNumber(""));
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
        dispatch(setDialedNumber(""));
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

  return (
    <>
      <LayoutGlobalStyles />

<div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f0f0f0' }}>



        <LayoutTopBar />

        {/* Dialer Popup */}
        {isDialerOpen && (
          <LayoutDialerPopup
            dialerPosition={dialerPosition}
            isDeviceRegistered={isDeviceRegistered}
            isDialing={isDialing}
            onDismiss={() => {
              closeDialer();
              dispatch(setDialedNumber(""));
            }}
            onDial={handleDial}
          />
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
          <ApplicationCustomerSidebar />

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
                dispatch(setShowBreezeAssistant(false));
                dispatch(setBreezeMaximized(false));
              }}
              isMaximized={breezeMaximized}
              onMaximizeChange={(v) => dispatch(setBreezeMaximized(v))}
              width={breezeMaximized ? "100%" : "400px"}
            />
          )}
        </div>

        <Footer />
      </div>

    	{/* Notifications Sidebar */}
		<NotificationsSidebar
			isOpen={showNotificationsSidebar}
			onClose={() => dispatch(setShowNotificationsSidebar(false))}
		/>

		{/* Create Lead Sidebar (from header Create dropdown) */}
		<CreateLeadModal
			show={showCreateLeadModal}
			onHide={() => dispatch(setShowCreateLeadModal(false))}
			onSuccess={() => dispatch(setShowCreateLeadModal(false))}
		/>

		{/* Create Company Sidebar (from header Create dropdown) */}
		{showCreateCompanySidebar && (
			<CreateCompanySidebar
				onClose={() => dispatch(setShowCreateCompanySidebar(false))}
			/>
		)}

    {showCreateTicketSidebar && (
      <CreateTicketSidebar
        onClose={() => dispatch(setShowCreateTicketSidebar(false))}
        onSuccess={() => dispatch(setShowCreateTicketSidebar(false))}
      />
    )}

    <CreateTaskModal
      isOpen={showCreateTaskSidebar}
      onClose={() => dispatch(setShowCreateTaskSidebar(false))}
      onCreate={() => dispatch(setShowCreateTaskSidebar(false))}
    />
		</>
	);
};

export default Layout;
