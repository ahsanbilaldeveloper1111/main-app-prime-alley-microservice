/**
 * Shared CRM Detail Page Layout – common UI and logic for CRM detail pages.
 */
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  MoreHorizontal,
  Calendar,
  ClipboardList,
  Copy,
  RefreshCw,
  AlertCircle,
  Handshake,
} from "lucide-react";
import CrmActivitiesPanel, {
  type CrmActivitiesPanelRef,
} from "@components/CrmActivitiesPanel";
import CrmIntelligenceTab from "@components/CrmIntelligenceTab";
import CrmAssociatedCompaniesCard from "@components/CrmAssociatedCompaniesCard";
import CrmProfileSection from "@components/CrmProfileSection";
import CrmRecordSummarySection from "@components/CrmRecordSummarySection";
import { useCrmActivityModals } from "@hooks/useCrmActivityModals";
import { useCti } from "@hooks/useCti";
import DeviceSelectionModal from "@components/DeviceSelectionModal";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import SuccessfulModal from "@pages/partial/SuccessfulModal";
import { toast } from "react-toastify";
import {
  sidebarContainerStyle,
  sidebarCardStyle,
  sectionHeaderRowStyle,
  chevronTitleRowStyle,
  ghostActionButtonStyle,
  dropdownMenuItemStyle,
  quickActionCircleButtonBaseStyle,
} from "@components/CrmDetailSharedStyles";

export interface KeyInfoField {
  label: string;
  value: string;
  copyable?: boolean;
}

export interface ProfileField {
  label: string;
  value: string;
  link?: boolean;
}

export interface CrmDetailPageLayoutConfig {
  recordType: "lead" | "prospect" | "deal" | "order" | "company";
  recordId: number;
  recordName: string;
  recordEmail: string;
  recordPhone: string;
  record: unknown;
  recordLoading: boolean;
  recordError: string | null;
  hasRecord: boolean;
  breadcrumbLabel: string;
  listPath: string;
  loadingMessage: string;
  errorNoRecordMessage: string;
  keyInfoFields: KeyInfoField[];
  profileFields: ProfileField[];
  profileSectionTitle?: string;
  summary: string | null;
  summaryMetaLabel?: string;
  onRefreshSummary: () => Promise<void>;
  company: unknown;
  relatedCompany: string;
  exporting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onExport: () => void;
  deleteItemName?: string;
  deleteItemType: "lead" | "prospect" | "deal" | "order" | "company";
  successTitle: string;
  successDescription: string;
  onDeleteSuccess: () => Promise<void>;
  avatarDisplayName: string;
  avatarSubtitle: string;
  primaryEmail: string;
  headerSecondaryText?: string;
  activitiesRecord: { data: unknown; audit_trail?: unknown } | null;
  renderRightSidebarExtra?: (ctx: {
    collapsedSections: Set<string>;
    toggleSection: (id: string) => void;
  }) => ReactNode;
  associatedCompany: {
    companyName: string | null;
    primaryPhone: string | null;
    phones?: Array<{ number: string; type: string | null }>;
    companyId: string | number | null;
  };
  showAssociatedCompanyCard?: boolean;
  renderRightSidebarPrimary?: (ctx: {
    collapsedSections: Set<string>;
    toggleSection: (id: string) => void;
  }) => ReactNode;
  rightSidebarSections?: Array<{
    id: string;
    render: (ctx: {
      collapsedSections: Set<string>;
      toggleSection: (id: string) => void;
    }) => ReactNode;
  }>;
  renderEditModal?: () => ReactNode;
  onWhatsAppChatClick?: (chat: { id: number }) => void;
  tabs?: Array<{ id: string; label: string }>;
  renderCustomTabContent?: (
    tabId: string,
    ctx: { collapsedSections: Set<string>; toggleSection: (id: string) => void }
  ) => ReactNode | undefined;
  renderFooterModals?: () => ReactNode;
}

const SCROLL_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #f7fafc; }
  ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
  .sidebar-scrollbar::-webkit-scrollbar { width: 8px; }
  .sidebar-scrollbar::-webkit-scrollbar-track { background: #f7fafc; }
  .sidebar-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 4px; }
  .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
`;

export function CrmDetailPageLayout({
  config,
  canSendWhatsApp,
}: {
  config: CrmDetailPageLayoutConfig;
  canSendWhatsApp: boolean;
}) {
  type DeviceSelectionDevice = {
    deviceType: string;
    deviceName: string;
    terminalState: string;
    when: string;
    details: string;
  };

  const router = useRouter();
  const [activeTab, setActiveTab] = useState("about");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [tasksRefetch, setTasksRefetch] = useState<(() => void) | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<DeviceSelectionDevice[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
  const [isDialing, setIsDialing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreActivitiesRef = useRef<HTMLDivElement>(null);
  const activitiesPanelRef = useRef<CrmActivitiesPanelRef>(null);

  const {
    dialNumber: ctiDialNumber,
    getAllUserDevices,
    makeCall,
    userAddress: ctiUserAddress,
  } = useCti();

  const phoneList = useMemo(() => {
    const phone = config.recordPhone;
    if (!phone || typeof phone !== "string") return [];
    return phone
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [config.recordPhone]);
  const hasPhone = phoneList.length > 0;
  const numberToCall = hasPhone ? phoneList[0] : "";

  const activityModals = useCrmActivityModals({
    recordType: config.recordType,
    recordId: config.recordId,
    recordName: config.recordName,
    recordEmail: config.recordEmail,
    recordPhone: config.recordPhone,
    onTaskCreated: () => tasksRefetch?.(),
    onNoteCreated: () => activitiesPanelRef.current?.refetchNotes?.(),
    onEmailSent: () => activitiesPanelRef.current?.refetchEmails?.(),
    onMeetingScheduled: () => activitiesPanelRef.current?.refetchMeetings?.(),
  });

  const handleCall = useCallback(
    async (phoneNumber: string) => {
      const numberToDial = (phoneNumber || "").trim();
      if (!numberToDial) {
        toast.error("No phone number available to call");
        return;
      }
      const userDevices = getAllUserDevices?.();
      const normalizedDevices: DeviceSelectionDevice[] = Array.isArray(userDevices)
        ? userDevices.map((device: unknown) => {
            const safeDevice = (device as Record<string, unknown>) ?? {};
            return {
              deviceType: String(safeDevice.deviceType ?? ""),
              deviceName: String(safeDevice.deviceName ?? ""),
              terminalState: String(safeDevice.terminalState ?? ""),
              when: String(safeDevice.when ?? ""),
              details: String(safeDevice.details ?? ""),
            };
          })
        : [];
      if (normalizedDevices.length > 1) {
        setAvailableDevices(normalizedDevices);
        setPendingDialedNumber(numberToDial);
        setShowDeviceSelectionModal(true);
        return;
      }
      setIsDialing(true);
      try {
        const result = await ctiDialNumber(numberToDial);
        if (result?.error) toast.error(result.error);
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [ctiDialNumber, getAllUserDevices]
  );

  const handleDeviceSelect = useCallback(
    async (device: DeviceSelectionDevice) => {
      const numberToDial = pendingDialedNumber;
      setShowDeviceSelectionModal(false);
      setAvailableDevices([]);
      setPendingDialedNumber("");
      localStorage.setItem(
        "cti_caller_info",
        JSON.stringify({
          callingAddress: ctiUserAddress,
          callingDeviceName: device.deviceName,
          callingDeviceType: device.deviceType,
          selectedAt: new Date().toISOString(),
        })
      );
      setIsDialing(true);
      try {
        const result = await makeCall({
          callingAddress: ctiUserAddress ?? "",
          calledAddress: numberToDial,
          callingDeviceType: device.deviceType,
          callingDeviceName: device.deviceName,
        });
        if (result?.error) toast.error(result.error);
      } catch {
        toast.error("Failed to make call");
      } finally {
        setIsDialing(false);
      }
    },
    [pendingDialedNumber, ctiUserAddress, makeCall]
  );

  const handleCallClick = useCallback(() => {
    if (hasPhone) handleCall(numberToCall);
    else toast.error("No phone number available");
  }, [hasPhone, numberToCall, handleCall]);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);

  const tabs = config.tabs ?? [
    { id: "about", label: "About" },
    { id: "activities", label: "Activities" },
    { id: "intelligence", label: "Intelligence" },
  ];
  const validTabIds = new Set(tabs.map((tab) => tab.id));
  useEffect(() => {
    if (!router.isReady) return;
    const section = router.query.section;
    const tabId =
      typeof section === "string" ? section.toLowerCase().trim() : null;
    if (tabId && validTabIds.has(tabId)) setActiveTab(tabId);
  }, [router.isReady, router.query.section]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setShowActionsDropdown(false);
      if (
        moreActivitiesRef.current &&
        !moreActivitiesRef.current.contains(event.target as Node)
      )
        setShowMoreActivities(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenDelete = useCallback(() => {
    config.onDelete();
    setShowDeleteModal(true);
  }, [config]);

  const confirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await config.onDeleteSuccess();
      setShowDeleteModal(false);
      setShowSuccessfulModal(true);
      router.push(config.listPath);
    } catch {
      toast.error(`Failed to delete ${config.deleteItemType}`);
    } finally {
      setIsDeleting(false);
    }
  }, [config, router]);

  const quickActions = [
    { icon: ClipboardList, label: "Note", disabled: false, onClick: activityModals.openNote },
    { icon: Mail, label: "Email", disabled: false, onClick: activityModals.openEmail },
    {
      icon: Phone,
      label: "Call",
      disabled: !hasPhone || isDialing,
      onClick: handleCallClick,
    },
    { icon: ClipboardList, label: "Task", disabled: false, onClick: activityModals.openTask },
    { icon: Calendar, label: "Meeting", disabled: false, onClick: activityModals.openMeeting },
  ];

  const moreActions = [
    { label: "SMS", onClick: activityModals.openSms },
    { label: "WhatsApp", onClick: activityModals.openWhatsApp },
  ];

  const sidebarCtx = { collapsedSections, toggleSection };
  const activeTabCustomContent = config.renderCustomTabContent?.(activeTab, sidebarCtx);
  const rightSidebarContent = config.rightSidebarSections?.length
    ? config.rightSidebarSections.map((section) => (
        <React.Fragment key={section.id}>{section.render(sidebarCtx)}</React.Fragment>
      ))
    : (
        <>
          {config.renderRightSidebarPrimary ? (
            config.renderRightSidebarPrimary(sidebarCtx)
          ) : config.showAssociatedCompanyCard !== false ? (
            <CrmAssociatedCompaniesCard
              sectionId="companies"
              collapsedSections={collapsedSections}
              toggleSection={toggleSection}
              companyName={config.associatedCompany.companyName}
              primaryPhone={config.associatedCompany.primaryPhone}
              phones={config.associatedCompany.phones}
              companyId={config.associatedCompany.companyId}
            />
          ) : null}
          {config.renderRightSidebarExtra?.(sidebarCtx)}
        </>
      );

  if (config.recordLoading) {
    return (
      <Layout>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <RefreshCw
            size={32}
            style={{ color: "#006162", animation: "spin 1s linear infinite" }}
          />
          <p style={{ fontSize: "14px", color: "#718096" }}>
            {config.loadingMessage}
          </p>
        </div>
      </Layout>
    );
  }

  if (config.recordError || !config.hasRecord) {
    return (
      <Layout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
            flexDirection: "column",
            gap: "12px",
            padding: "24px",
          }}
        >
          <AlertCircle size={48} style={{ color: "#e53e3e" }} />
          <p style={{ fontSize: "16px", color: "#141414", fontWeight: 500 }}>
            {config.recordError || config.errorNoRecordMessage}
          </p>
          <button
            onClick={() => router.push(config.listPath)}
            style={{
              padding: "8px 16px",
              backgroundColor: "#006162",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Back to {config.breadcrumbLabel.toLowerCase()}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <style>{SCROLL_STYLES}</style>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <div
          className="sidebar-scrollbar"
          style={{
            width: "385px",
            marginRight: "10px",
            ...sidebarContainerStyle,
          }}
        >
          <div style={{ padding: "10px 0px", marginBottom: "12px", ...sidebarCardStyle }}>
            <div
              style={{
                ...sectionHeaderRowStyle,
                paddingBottom: "10px",
                borderBottom: "1px solid #cccccc",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              <button
                onClick={() => globalThis.history.back()}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "500",
                }}
              >
                <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
                {config.breadcrumbLabel}
              </button>

              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                  style={{ padding: "6px 14px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px", ...ghostActionButtonStyle }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f8fa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Actions <ChevronDown size={14} />
                </button>
                {showActionsDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "4px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      minWidth: "180px",
                      zIndex: 1000,
                      overflow: "hidden",
                    }}
                  >
                    {["Edit", "Delete", "Export"].map((action) => (
                      <button
                        key={action}
                        disabled={action === "Export" && config.exporting}
                        onClick={() => {
                          setShowActionsDropdown(false);
                          if (action === "Edit") config.onEdit();
                          else if (action === "Delete") {
                            config.onDelete();
                            handleOpenDelete();
                          } else if (action === "Export") config.onExport();
                        }}
                        style={dropdownMenuItemStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f7fafc"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        {action === "Export" && config.exporting ? "Exporting..." : action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ paddingTop: "16px", paddingBottom: 0, paddingLeft: "24px", paddingRight: "24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                {config.recordType === "deal" ? (
                  <div
                    className="crmLeftSidebarAvatarCircle"
                    style={{
                      width: "40px",
                      height: "37px",
                      borderRadius: "26px",
                      background: "#e3f2fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#141414",
                      flexShrink: 0,
                    }}
                  >
                    <Handshake size={20} />
                  </div>
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "37px",
                      borderRadius: "26px",
                      background: "#efe7f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "400",
                      color: "#141414",
                      flexShrink: 0,
                    }}
                  >
                    {config.avatarDisplayName
                      ? (config.avatarDisplayName.match(/\b\w/g) ?? []).slice(0, 2).join("").toUpperCase()
                      : "—"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "22px", fontWeight: "500", color: "#141414", margin: "0 0 4px 0", lineHeight: "1.3" }}>
                    {config.avatarDisplayName ?? "—"}
                  </h2>
                  <p style={{ fontSize: "14px", color: "#718096", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                    {config.avatarSubtitle ?? "—"}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {config.headerSecondaryText ? (
                      <span style={{ fontSize: "14px", color: "#718096" }}>
                        {config.headerSecondaryText}
                      </span>
                    ) : config.primaryEmail ? (
                      <>
                        <a
                          href={`mailto:${config.primaryEmail}`}
                          style={{ fontSize: "14px", color: "#006162", textDecoration: "none", fontWeight: "500" }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                        >
                          {config.primaryEmail}
                        </a>
                        <button
                          onClick={() => copyToClipboard(config.primaryEmail)}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "4px",
                            cursor: "pointer",
                            color: "#718096",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Copy email"
                        >
                          <Copy size={14} />
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: "14px", color: "#718096" }}>—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "17px", paddingTop: "6px", paddingBottom: "4px", paddingLeft: "24px", paddingRight: "24px" }}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div key={action.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={action.disabled}
                      onClick={action.onClick}
                      style={{
                        ...quickActionCircleButtonBaseStyle,
                        cursor: action.disabled ? "not-allowed" : "pointer",
                      }}
                    >
                      <Icon size={20} />
                    </button>
                    <span style={{ fontSize: "12px", color: "#141414", fontWeight: "300" }}>{action.label}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative" }} ref={moreActivitiesRef}>
                <button onClick={() => setShowMoreActivities(!showMoreActivities)} style={{ ...quickActionCircleButtonBaseStyle, cursor: "pointer" }}>
                  <MoreHorizontal size={20} />
                </button>
                <span style={{ fontSize: "12px", color: "#141414", fontWeight: "300" }}>More</span>
                {showMoreActivities && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "4px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      minWidth: "150px",
                      zIndex: 1000,
                    }}
                  >
                    {moreActions.map(({ label, onClick }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => { setShowMoreActivities(false); onClick(); }}
                        style={dropdownMenuItemStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f7fafc"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderRadius: "5px", marginBottom: "12px", overflow: "hidden", ...sidebarCardStyle }}>
            <div
              style={{
                ...sectionHeaderRowStyle,
                padding: "14px 20px",
                cursor: "pointer",
                backgroundColor: "#ffffff",
                borderBottom: collapsedSections.has("key-info") ? "none" : "1px solid #cccccc",
              }}
              onClick={() => toggleSection("key-info")}
            >
              <div style={chevronTitleRowStyle}>
                <ChevronDown
                  size={18}
                  style={{
                    color: "#141414",
                    transform: collapsedSections.has("key-info") ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#141414", margin: 0 }}>Key information</h3>
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#141414",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "3px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f8fa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                Actions
              </button>
            </div>
            {!collapsedSections.has("key-info") && (
              <div style={{ padding: "20px", maxHeight: "480px", overflowY: "auto" }}>
                {config.keyInfoFields.map((field) => (
                  <div key={field.label} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "400", color: "#666", marginBottom: "4px" }}>{field.label}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <div style={{ fontSize: "14px", color: "#141414", fontWeight: "400", flex: 1 }}>{field.value}</div>
                      {field.copyable && field.value !== "--" && (
                        <button
                          onClick={() => copyToClipboard(field.value ?? "")}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "4px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "3px",
                          }}
                          title="Copy"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f8fa"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "transparent",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            marginLeft: "6px",
            marginRight: "6px",
            borderTop: "1px solid #cccccc",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
              backgroundColor: "#f5f8fa",
              position: "sticky",
              top: 0,
              zIndex: 10,
              gap: 0,
              borderLeft: "1px solid #cccccc",
              borderRight: "1px solid #cccccc",
              borderRadius: "10px 10px 0 0",
            }}
          >
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 20px",
                  backgroundColor: activeTab === tab.id ? "#ffffff" : "#f5f5f5",
                  border: "none",
                  borderRight: index < tabs.length - 1 ? "1px solid #cbd5e0" : "none",
                  borderBottom: activeTab === tab.id ? "1px solid #ffffff" : "1px solid #cbd5e0",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.id ? "600" : "400",
                  color: "#141414",
                  transition: "all 0.2s",
                  textAlign: "center",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = "#eaf0f6"; }}
                onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = "#f5f8fa"; }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "14px 0", flex: 1 }}>
            {activeTabCustomContent !== undefined ? (
              activeTabCustomContent
            ) : activeTab === "about" ? (
              <>
                <CrmRecordSummarySection
                  isCollapsed={collapsedSections.has("breeze")}
                  onToggle={() => toggleSection("breeze")}
                  summary={config.summary}
                  metaLabel={config.summaryMetaLabel}
                  onRefreshClick={config.onRefreshSummary}
                />
                <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", marginBottom: "20px" }}>
                  <CrmProfileSection
                    title={config.profileSectionTitle ?? "Contact profile"}
                    fields={config.profileFields}
                  />
                </div>
              </>
            ) : activeTab === "activities" ? (
              <CrmActivitiesPanel
                ref={activitiesPanelRef}
                recordType={config.recordType}
                recordId={config.recordId}
                record={config.activitiesRecord as Parameters<typeof CrmActivitiesPanel>[0]["record"]}
                recordLoading={config.recordLoading}
                recordName={config.recordName}
                canSendWhatsApp={canSendWhatsApp}
                onTasksRefetchReady={(fn) => setTasksRefetch(() => fn)}
                onWhatsAppChatClick={config.onWhatsAppChatClick}
                {...activityModals.crmActivitiesPanelProps}
              />
            ) : activeTab === "intelligence" ? (
              <CrmIntelligenceTab company={config.company} relatedCompany={config.relatedCompany} />
            ) : null}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: isRightSidebarCollapsed ? "0px" : "385px",
            marginLeft: isRightSidebarCollapsed ? "0px" : "10px",
            flexShrink: 0,
            transition: "width 0.3s ease, margin-left 0.3s ease",
          }}
        >
          <button
            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            style={{
              position: "fixed",
              top: "100px",
              right: isRightSidebarCollapsed ? "10px" : "calc(395px)",
              zIndex: 101,
              backgroundColor: "#ffffff",
              border: "1px solid #8a8a8a",
              borderRadius: "30px",
              padding: "3px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f8fa"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ffffff"; }}
            title={isRightSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isRightSidebarCollapsed ? (
              <ChevronLeft size={20} style={{ color: "#141414" }} />
            ) : (
              <ChevronRight size={20} style={{ color: "#141414" }} />
            )}
          </button>

          {!isRightSidebarCollapsed && (
            <div
              className="sidebar-scrollbar"
              style={{
                width: "100%",
                backgroundColor: "#f0f0f0",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflowY: "auto",
                padding: 0,
                borderRadius: "10px",
              }}
            >
              <div style={{ paddingTop: 0, paddingBottom: 0 }}>
                {rightSidebarContent}
              </div>
            </div>
          )}
        </div>
      </div>

      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={() => {
          setShowDeviceSelectionModal(false);
          setAvailableDevices([]);
          setPendingDialedNumber("");
        }}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={ctiUserAddress ?? ""}
        userAddress={ctiUserAddress}
      />

      {activityModals.modals}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={config.deleteItemName}
        itemType={config.deleteItemType}
        loading={isDeleting}
      />

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={() => setShowSuccessfulModal(false)}
        title={config.successTitle}
        description={config.successDescription}
      />

      {config.renderEditModal?.()}
      {config.renderFooterModals?.()}
    </>
  );
}
