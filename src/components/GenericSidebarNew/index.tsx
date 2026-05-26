import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronRight,
  LucideIcon,
  Mail,
  Phone,
  MoreHorizontal,
  Calendar,
  MessageSquare,
  ClipboardList,
  ExternalLink,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Sparkles,
  Maximize2,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Plus,
  Clock,
  MessageCircle,
  Search,
  FileText,
  Play,
} from "lucide-react";
import WhatsAppMessageModal from "@components/WhatsAppMessageModalNew";
import LogSmsModal from "@components/LogSms";
import { Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import { sendEmail, sendSms, sendWhatsApp } from "@utils/communication";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import {
  createMeeting,
  createCrmNote,
  getCrmNotes,
  createTask,
  getAllCrmDataById,
  getLead,
  getDeal,
  getOrder,
  getHistoryChain,
  type CrmNoteItem,
  type CrmDataItem,
  type LeadData,
  type DealData,
  type OrderData,
  type HistoryChainRecord,
} from "@utils/crm";
import {
  RECORD_TYPES,
  ModuleSlug,
  convertLocalMeetingToUtc,
  formatMeetingDateTimeLocal,
} from "@utils/Helper";
import {
  buildFollowUpTaskFields,
  followUpTaskFieldsToApiPayload,
  resolveFollowUpDueDateYmd,
  buildIn3BusinessDaysLabel,
} from "@utils/crmFollowUpTaskDue";
import { buildCrmAuditLinesForEntry } from "@utils/crmAuditTrail";
import { ListCallLogs } from "@utils/calls";
import { useCti } from "@hooks/useCti";
import {
  useCrmActivityModals,
  type UseCrmActivityModalsParams,
} from "@hooks/useCrmActivityModals";
import DeviceSelectionModal from "@components/DeviceSelectionModal";
import EmailModal from "@components/EmailModal";
import MeetingModal from "@components/MeetingModal";
import Select from "react-select";
import { GetHierarchyData } from "@utils/users";
import { getCrmSessionUserContext } from "@crm/shared/crmSessionUserContext";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SidebarField {
  label: string;
  value: any;
  icon?: LucideIcon;
  type?:
    | "text"
    | "date"
    | "datetime"
    | "badge"
    | "tags"
    | "link"
    | "email"
    | "phone"
    /** Hex/CSS color string — renders a swatch (no raw hex text). */
    | "color";
  badgeVariant?: string;
  show?: boolean;
  hasDetails?: boolean;
  onDetailsClick?: () => void;
  copyable?: boolean;
  externalLink?: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: {
    value: string | number;
    variant?: string;
    icon?: LucideIcon;
  };
  fields?: SidebarField[];
  emptyState?: {
    icon?: LucideIcon;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  customContent?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  isLoading?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  count?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

interface RecentActivitiesSectionProps {
  recentActivitiesState: any;
  recordType: string | null | undefined;
  recordId: number | string | null | undefined;
  section: SidebarSection;
  EmptyIcon?: LucideIcon;
  humanizeDataKey: (key: string) => string;
  resolveUserLabel?: (user: any) => string;
  router: any;
  getAuditTrailFromRecord?: (data: any, type?: any) => any[];
  createResolveFieldVal?: (...args: any[]) => any;
  buildAuditLinesForEntry?: (
    entry: any,
    resolveFieldVal: (fieldKey: string) => any,
    humanizeDataKey: (key: string) => string,
  ) => string;
}

const RecentActivitiesSection = ({
  recentActivitiesState,
  recordType,
  recordId,
  section,
  EmptyIcon,
  humanizeDataKey,
  resolveUserLabel,
  router,
  getAuditTrailFromRecord,
  createResolveFieldVal,
  buildAuditLinesForEntry,
}: RecentActivitiesSectionProps) => {
  if (recentActivitiesState.loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          color: "#141414",
        }}
      >
        <RefreshCw
          size={16}
          className="spin"
          style={{ marginRight: "8px" }}
        />
        Loading...
      </div>
    );
  }

  if (!recentActivitiesState.data) {
    return null;
  }

  const handleEmptyActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    section.emptyState?.action?.onClick();
  };

  const handleViewMoreClick = () => {
    if (recordId == null) {
      return;
    }

    router.push(recentActivitiesState.detailPath(Number(recordId)));
  };

  const safeGetAuditTrailFromRecord =
    getAuditTrailFromRecord ?? (() => [] as any[]);
  const safeCreateResolveFieldVal =
    createResolveFieldVal ?? (() => () => undefined);

  const auditTrail = safeGetAuditTrailFromRecord(
    recentActivitiesState.data,
    recordType ?? undefined,
  );
  const resolveFieldVal = safeCreateResolveFieldVal(
    recordType ?? undefined,
    recentActivitiesState.data,
    resolveUserLabel,
  );

  if (auditTrail.length === 0) {
    return (
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        {EmptyIcon && (
          <EmptyIcon
            size={40}
            style={{ color: "#cbd5e0", marginBottom: "12px" }}
          />
        )}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          {section.emptyState?.message ?? "No recent activities."}
        </p>
        {section.emptyState?.action && (
          <button
            onClick={handleEmptyActionClick}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#0066CC",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {section.emptyState.action.label}
          </button>
        )}
      </div>
    );
  }

  const isActivityRecordType = recordType === "activity";
  const displayTrail = isActivityRecordType
    ? auditTrail
    : auditTrail.slice(0, 5);
  const hasMore = !isActivityRecordType && auditTrail.length > 5;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0",
        minWidth: 0,
      }}
    >
      <div
        style={{
          maxHeight: "280px",
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "0",
          minWidth: 0,
          ...( { scrollbarWidth: "thin", scrollbarColor: "#c8c8c8 transparent" } as any),
        }}
      >
        {displayTrail.map((entry: any, index: number) => {
          console.log("entry", entry);
          const timestamp = entry.created_at
            ? new Date(entry.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—";
          const description = buildAuditLinesForEntry
            ? buildAuditLinesForEntry(entry, resolveFieldVal, humanizeDataKey)
            : "";
            const userName =
              (entry.user_extension &&
                resolveUserLabel?.(entry.user_extension)) ||
              entry.user_extension ||
              "";
            const timestampWithUser = userName
              ? `${timestamp} by ${userName}`
              : timestamp;
          return (
            <div
              key={entry.id ?? index}
              style={{
                padding: "10px 12px",
                marginBottom: index < displayTrail.length - 1 ? "8px" : 0,
                minWidth: 0,
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                backgroundColor: "#ffffff",
              }}
            >
              <p
                style={{ fontSize: "13px", color: "#141414", margin: "0 0 4px 0", fontWeight: "500" }}
                dangerouslySetInnerHTML={{ __html: description }}
              />
              <span style={{ fontSize: "11px", color: "#718096" }}>
                {timestampWithUser}
              </span>
            </div>
          );
        })}
      </div>
      {recordId != null && hasMore && (
        <button
          onClick={handleViewMoreClick}
          style={{
            marginTop: "8px",
            padding: "8px 16px",
            backgroundColor: "#0066CC",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            width: "100%",
          }}
        >
          View more
        </button>
      )}
    </div>
  );
};

function renderCallsSection(options: {
  section: any;
  sidebarCallRecordingsLoading: boolean;
  sidebarCallRecordings: any[];
  recordType: string | null | undefined;
  recordId: string | number | null | undefined;
  router: any;
  EmptyIcon: React.ComponentType<any> | null | undefined;
  onPlayCallRecording?: (recording: any) => void;
}) {
  const {
    section,
    sidebarCallRecordingsLoading,
    sidebarCallRecordings,
    recordType,
    recordId,
    router,
    EmptyIcon,
    onPlayCallRecording,
  } = options;
  if (sidebarCallRecordingsLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          color: "#141414",
        }}
      >
        <RefreshCw
          size={16}
          className="spin"
          style={{ marginRight: "8px" }}
        />
        Loading...
      </div>
    );
  }

  if (sidebarCallRecordings.length > 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            ...( {
              scrollbarWidth: "thin",
              scrollbarColor: "#c8c8c8 transparent",
            } as any),
          }}
        >
          {sidebarCallRecordings
            .slice(0, 5)
            .map((rec: any, index: number) => {
              const dateStr =
                rec.DateTime ??
                rec.start_time ??
                rec.created_at ??
                "";
              let timestamp = "—";
              if (dateStr) {
                if (dateStr.length > 10) {
                  timestamp = new Date(
                    dateStr,
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                } else {
                  timestamp = dateStr;
                }
              }
              const dir =
                rec.Direction ??
                rec.direction ??
                rec.CallDirection ??
                "";
              const direction =
                dir.includes("INBOUND") ||
                dir === "Inbound" ||
                dir === "CALL_INCOMING"
                  ? "Incoming"
                  : "Outgoing";
              const rawDuration =
                rec.Duration ??
                rec.duration ??
                rec.CallDuration ??
                0;
              const durationSec =
                Number.parseInt(String(rawDuration), 10) / 10000000 ||
                0;
              const roundedSec =
                Math.round(durationSec * 10) / 10;
              let durationStr = "";
              if (durationSec >= 60) {
                durationStr = `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, "0")}`;
              } else if (roundedSec > 0) {
                durationStr = `${roundedSec}s`;
              }
              return (
                <div
                  key={rec.Id ?? rec.id ?? index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#1f2937",
                      }}
                    >
                      {timestamp}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginTop: "2px",
                      }}
                    >
                      {durationStr ? `${durationStr} · ` : ""}
                      {direction}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                  >
                    {onPlayCallRecording && (rec.Id ?? rec.id) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayCallRecording(rec);
                        }}
                        title="Play recording"
                        aria-label="Play call recording"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "28px",
                          height: "28px",
                          padding: 0,
                          borderRadius: "50%",
                          border: "1px solid #cfe8ef",
                          background: "#e6f7fb",
                          color: "#0091ae",
                          cursor: "pointer",
                        }}
                      >
                        <Play size={14} />
                      </button>
                    )}
                    <Phone
                      size={16}
                      style={{ color: "#718096" }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
        {recordType === "prospect" &&
          recordId != null &&
          sidebarCallRecordings.length > 5 && (
            <button
              onClick={() =>
                router.push(
                  `/crm/detailspage?type=prospect&id=${recordId}&section=activities`,
                )
              }
              style={{
                marginTop: "8px",
                padding: "8px 16px",
                backgroundColor: "#0066CC",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                width: "100%",
              }}
            >
              View more
            </button>
          )}
      </div>
    );
  }

  if (section.emptyState) {
    const es: NonNullable<SidebarSection["emptyState"]> = section.emptyState;
    return (
      <div
        style={{ padding: "24px 16px", textAlign: "center" }}
      >
        {EmptyIcon && (
          <EmptyIcon
            size={40}
            style={{ color: "#cbd5e0", marginBottom: "12px" }}
          />
        )}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          {es.message}
        </p>
        {es.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              es.action?.onClick();
            }}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#0066CC",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {es.action.label}
          </button>
        )}
      </div>
    );
  }

  return null;
}

function renderGenericSectionContent(
  section: SidebarSection,
  EmptyIcon: React.ComponentType<any> | null | undefined,
  renderField: (field: SidebarField, index: number) => React.ReactNode,
) {
  if (section.emptyState) {
    const es = section.emptyState;
    return (
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        {EmptyIcon && (
          <EmptyIcon
            size={40}
            style={{ color: "#cbd5e0", marginBottom: "12px" }}
          />
        )}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          {es.message}
        </p>
        {es.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              es.action?.onClick();
            }}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              backgroundColor: "#0066CC",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            {es.action.label}
          </button>
        )}
      </div>
    );
  }

  if (section.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          color: "#141414",
        }}
      >
        <RefreshCw
          size={16}
          className="spin"
          style={{ marginRight: "8px" }}
        />
        Loading...
      </div>
    );
  }

  if (section.customContent) {
    return section.customContent;
  }

  if (section.fields && section.fields.length > 0) {
    if (section.id === "about-prospect") {
      return (
        <div
          style={{
            maxHeight: "280px",
            overflowY: "auto",
            overflowX: "hidden",
            ...( {
              scrollbarWidth: "thin",
              scrollbarColor: "#c8c8c8 transparent",
            } as any),
          }}
        >
          {section.fields.map((field: SidebarField, index: number) =>
            renderField(field, index),
          )}
        </div>
      );
    }

    return (
      <div>
        {section.fields.map((field: SidebarField, index: number) =>
          renderField(field, index),
        )}
      </div>
    );
  }

  if (section.emptyState) {
    const es: NonNullable<SidebarSection["emptyState"]> = section.emptyState;
    return (
      <div
        style={{
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        {EmptyIcon && (
          <EmptyIcon
            size={48}
            style={{ color: "#cbd5e0", marginBottom: "16px" }}
          />
        )}
        <p
          style={{
            fontSize: "14px",
            color: "#718096",
            margin: es.action ? "0 0 20px 0" : 0,
            lineHeight: "1.6",
          }}
        >
          {es.message}
        </p>
        {es.action && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              es.action?.onClick();
            }}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0066CC",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#007a8c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0091ae";
            }}
          >
            {es.action?.label}
          </button>
        )}
      </div>
    );
  }

  return null;
}

/** CRM summary from API (lead, prospect, deal, order, etc.) */
export interface CrmSummary {
  id: number;
  summary: string;
}

/** Internal display shape for record summary (content + optional callbacks; callbacks unused when using crmSummary from API). */
interface RecordSummaryDisplay {
  content: string;
  timestamp: string;
  onRefresh?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  onCopy?: () => void;
  onAskQuestion?: () => void;
}

type CrmEntityType = "prospect" | "lead" | "deal" | "order";

type SidebarRecordType = CrmEntityType | "company" | "activity";

export interface GenericSidebarProps {
  isOpen: boolean;
  onClose?: () => void;

  // Header Information
  title: string;
  subtitle?: string;
  company?: string;
  avatar?: {
    initials?: string;
    name: string;
    gradient?: string;
    imageUrl?: string;
  };

  // Contact Information
  email?: string;
  phone?: string;

  record?: {
    id: number;
    type: RECORD_TYPES;
  };

  // Quick Actions
  quickActions?: QuickAction[];
  onQuickActionClick?: (actionId: string) => void;

  /** CRM summary from API - same field from prospect, lead, deal, order. When set, Record summary section is shown; "No summary available" if summary is empty. */
  crmSummary?: CrmSummary | null;

  // Sections
  sections?: SidebarSection[];

  // Additional Props
  width?: string;
  /**
   * When true, the panel fills its parent (e.g. a flex row beside a table) without the
   * fixed global header offset (`marginTop: 43px` / `calc(100vh - 43px)` heights).
   */
  dockInParent?: boolean;
  /** When true, the fixed title strip (h2 + close) is hidden; close moves beside Actions when `onClose` is set. */
  hideTopHeadingBar?: boolean;
  recordLink?: {
    label: string;
    onClick: () => void;
  };
  actionsDropdown?: {
    label: string;
    items: Array<
      | { label: string; onClick: () => void }
      | {
          label: string;
          subItems: Array<{ label: string; value: string }>;
          onSubItemSelect: (value: string) => void;
        }
    >;
  };
  permissionMessage?: string;

  // Context payload for integrations
  contextPayload?: Record<string, unknown>;

  recordType?: SidebarRecordType;
  recordId?: number;
  /** When recordType is "activity", the underlying entity type for fetching history chain (e.g. "lead", "deal"). */
  activityEntityType?: CrmEntityType;

  /** Resolve user extension/id to display name (e.g. for Owner / contact_owner). When provided, prospect sidebar uses it for the Owner field. */
  resolveUserLabel?: (extensionOrId: string) => string;

  onNoteCreate?: (
    note: string,
    createTask: boolean,
    taskDueDate?: string,
  ) => void;

  // Email modal callbacks
  onEmailSend?: (emailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    attachments?: File[];
  }) => void;

  // Sender info for email
  senderEmail?: string;
  senderName?: string;

  // Task modal callbacks
  onTaskCreate?: (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
  }) => void;

  onCall?: (phoneNumber: string) => void;
  callerNumber?: string;

  // Meeting modal callbacks
  onMeetingSchedule?: (meetingData: {
    title: string;
    hostEmail: string;
    startDate: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    location: string;
    reminders: string[];
    summary: string;
  }) => void;
  /** Lead (ticket) ID for CRM meeting association */
  leadId?: number;
  /** Deal ID for CRM meeting association */
  dealId?: number;
  /** Current user extension for meeting participants (required by CRM meetings API) */
  userExtension?: string;

  // WhatsApp message modal callback
  onWhatsAppLog?: (whatsappData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createTask: boolean;
    taskDueDate?: string;
    attachments: File[];
  }) => void;

  // SMS message modal callback
  onSmsLog?: (smsData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
    attachments: File[];
  }) => void;

  // Call recording playback
  onPlayCallRecording?: (recording: any) => void;

  // "Log a ___" actions — opens a modal that writes a single audit-log entry
  // to the record's history (it does NOT actually send anything; that's the
  // job of the existing send dialogs wired via `useCrmActivityModals`).
  onLogCall?: () => void;
  onLogEmail?: () => void;
  onLogSms?: () => void;
  onLogWhatsApp?: () => void;
  onLogMeeting?: () => void;
  sidebarMarginTop?: string | number;
}

// ============================================================================
// CALL MODAL COMPONENT
// ============================================================================

export interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  phoneNumbers: string[];
  company?: string;
  callerNumber?: string;
  onCall: (phoneNumber: string) => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  isOpen,
  onClose,
  contactName,
  phoneNumbers,
  company,
  callerNumber,
  onCall,
}) => {
  if (!isOpen) return null;

  const handleCall = (phoneNumber: string) => {
    onCall(phoneNumber);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: "auto 15vh auto auto",
        top: "275px",
        width: "340px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#141414",
            margin: 0,
          }}
        >
          {contactName}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f8fa";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Close"
        >
          <X size={18} style={{ color: "#141414" }} />
        </button>
      </div>

      {/* Content - one button per phone number */}
      <div style={{ padding: "16px" }}>
        {phoneNumbers.map((phoneNumber, idx) => (
          <button
            key={`call-${idx}-${phoneNumber}`}
            onClick={() => handleCall(phoneNumber)}
            style={{
              width: "100%",
              padding: "10px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "5px",
              fontSize: "14px",
              color: "#141414",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
            }}
          >
            <Phone size={16} style={{ color: "#718096" }} />
            <div>
              <span style={{ fontWeight: "500" }}>Call {phoneNumber}</span>
              {phoneNumbers.length > 1 && (
                <span
                  style={{
                    color: "#718096",
                    fontSize: "13px",
                    marginLeft: "4px",
                  }}
                >
                  (Phone {idx + 1})
                </span>
              )}
            </div>
          </button>
        ))}

        {/* Company Name */}
        {company && (
          <div style={{ marginBottom: "12px" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#141414",
                margin: 0,
              }}
            >
              {company}
            </p>
          </div>
        )}

        {/* Call From Section */}
        {callerNumber && (
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <button
              style={{
                width: "100%",
                padding: "8px 0",
                backgroundColor: "transparent",
                border: "none",
                fontSize: "13px",
                color: "#141414",
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Call from: {callerNumber}</span>
              <ChevronRight size={16} style={{ color: "#718096" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// NOTES MODAL COMPONENT
// ============================================================================

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  onSave: (note: string, createTask: boolean, taskDueDate?: string, attachments?: File[]) => void;
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  recordName,
  onSave,
}) => {
  const [noteText, setNoteText] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save draft simulation
  useEffect(() => {
    if (noteText.trim()) {
      const timer = setTimeout(() => {
        setIsDraftSaved(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [noteText]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(
      noteText,
      createTask,
      createTask ? buildIn3BusinessDaysLabel() : undefined,
      attachments.length > 0 ? attachments : undefined,
    );
    setNoteText("");
    setCreateTask(false);
    setIsDraftSaved(false);
    setIsMaximized(false);
    setAttachments([]);
    onClose();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Text formatting functions with toggle support
  const toggleFormatting = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    if (selectedText) {
      // Check if text is already formatted
      const beforeText = noteText.substring(
        Math.max(0, start - prefix.length),
        start,
      );
      const afterText = noteText.substring(end, end + suffix.length);

      if (beforeText === prefix && afterText === suffix) {
        // Remove formatting
        const newText =
          noteText.substring(0, start - prefix.length) +
          selectedText +
          noteText.substring(end + suffix.length);
        setNoteText(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start - prefix.length,
            end - prefix.length,
          );
        }, 0);
      } else {
        // Add formatting
        const newText =
          noteText.substring(0, start) +
          prefix +
          selectedText +
          suffix +
          noteText.substring(end);
        setNoteText(newText);

        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length,
          );
        }, 0);
      }
    } else {
      // No selection, insert at cursor with placeholder
      const placeholder = "text";
      const newText =
        noteText.substring(0, start) +
        prefix +
        placeholder +
        suffix +
        noteText.substring(end);
      setNoteText(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + placeholder.length,
        );
      }, 0);
    }
  };

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      noteText.substring(0, start) + text + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleBold = () => {
    toggleFormatting("**");
  };

  const handleItalic = () => {
    toggleFormatting("*");
  };

  const handleUnderline = () => {
    toggleFormatting("__");
  };

  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    const linkText = selectedText || "link text";
    const linkUrl = "https://";
    const markdown = `[${linkText}](${linkUrl})`;

    const newText =
      noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + linkText.length + 3;
      textarea.setSelectionRange(urlStart, urlStart + linkUrl.length);
    }, 0);
  };

  const handleList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lines = noteText.substring(0, start).split("\n");
    const lastLine = lines.at(-1) ?? "";
    const isAtLineStart = lastLine.trim() === "";

    if (isAtLineStart) {
      insertText("- ");
    } else {
      insertText("\n- ");
    }
  };

  const handleCode = () => {
    toggleFormatting("`");
  };

  const handleImage = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteText.substring(start, end);

    const altText = selectedText || "image description";
    const imageUrl = "https://";
    const markdown = `![${altText}](${imageUrl})`;

    const newText =
      noteText.substring(0, start) + markdown + noteText.substring(end);
    setNoteText(newText);

    setTimeout(() => {
      textarea.focus();
      const urlStart = start + altText.length + 4;
      textarea.setSelectionRange(urlStart, urlStart + imageUrl.length);
    }, 0);
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "u":
          e.preventDefault();
          handleUnderline();
          break;
        case "k":
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: isMaximized ? "60px 20px 20px 20px" : "auto 15vh 0.5vh auto",
        height: isMaximized ? "auto" : "512px",
        width: isMaximized ? "auto" : "min(650px, calc(100vw - 120px))",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "slideInUp 0.3s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
          </button>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Note
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={handleMaximize}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Record Label */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{ fontSize: "13px", color: "#141414", fontWeight: "400" }}
          >
            For
          </span>
          <span
            style={{
              padding: "4px 12px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e0",
              borderRadius: "16px",
              fontSize: "13px",
              color: "#141414",
              fontWeight: "500",
            }}
          >
            {recordName}
          </span>
        </div>
      </div>

      {/* Note Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "20px", flex: 1 }}>
          <textarea
            ref={textareaRef}
            placeholder="Start typing to leave a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              height: isMaximized ? "400px" : "120px",
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#141414",
              fontFamily: "inherit",
              resize: "none",
              lineHeight: "1.5",
            }}
          />
        </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <button
            onClick={handleBold}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Bold (Ctrl+B)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Bold size={16} />
          </button>
          <button
            onClick={handleItalic}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Italic (Ctrl+I)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Italic size={16} />
          </button>
          <button
            onClick={handleUnderline}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Underline (Ctrl+U)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Underline size={16} />
          </button>
          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "#cbd5e0",
              margin: "0 4px",
            }}
          />
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px 10px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: "500",
              gap: "4px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            More
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleLink}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Link (Ctrl+K)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Link size={16} />
          </button>
          <button
            onClick={handleImage}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Insert Image"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Image size={16} aria-label="Insert Image" />
          </button>
          <button
            onClick={handleCode}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Code"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={handleList}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Bullet List"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <List size={16} />
          </button>
          <button
            onClick={handleAttachment}
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="Attach File"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "6px",
              cursor: "pointer",
              color: "#141414",
              display: "flex",
              alignItems: "center",
              borderRadius: "3px",
            }}
            title="More options"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f5f8fa")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Attachments ({attachments.length})
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "#f5f8fa",
                    borderRadius: "4px",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flex: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Paperclip size={14} style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </span>
                    <span
                      style={{ color: "#666", fontSize: "12px", flexShrink: 0 }}
                    >
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "4px",
                      cursor: "pointer",
                      color: "#718096",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Remove"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#f44336")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#718096")
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated Records */}
        <div
          style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}
        >
          <button
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#141414",
            }}
          >
            Associated with 1 record
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Task Creation Option */}
        <div style={{ padding: "16px 20px" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#141414",
            }}
          >
            <input
              type="checkbox"
              checked={createTask}
              onChange={(e) => setCreateTask(e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer",
              }}
            />
            <span>
              Create a <strong>To-do</strong> task to follow up{" "}
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#141414",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                {buildIn3BusinessDaysLabel()}
              </button>
              <ChevronDown size={14} style={{ marginLeft: "4px" }} />
            </span>
          </label>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isDraftSaved && (
            <>
              <span
                style={{
                  fontSize: "13px",
                  color: "#0c9960",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="#0c9960"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Draft saved
              </span>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: "#cbd5e0",
                }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!noteText.trim()}
          style={{
            padding: "8px 20px",
            backgroundColor: noteText.trim() ? "#141414" : "#cbd5e0",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: noteText.trim() ? "pointer" : "not-allowed",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = "#ff6347";
            }
          }}
          onMouseLeave={(e) => {
            if (noteText.trim()) {
              e.currentTarget.style.backgroundColor = "#141414";
            }
          }}
        >
          Create note
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MORE ACTIONS MODAL COMPONENT
// Add this after CallModal component
// ============================================================================

interface MoreActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onActionSelect: (actionId: string) => void;
}

const MoreActionsModal: React.FC<MoreActionsModalProps> = ({
  isOpen,
  onClose,
  position,
  onActionSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "note",
      icon: FileText,
      label: "Notes",
      hasSubmenu: false,
    },
    {
      id: "task",
      icon: ClipboardList,
      label: "Task",
      hasSubmenu: false,
    },
    {
      id: "log-call",
      icon: Phone,
      label: "Log a call",
      hasSubmenu: false,
    },
    {
      id: "log-whatsapp",
      icon: MessageCircle,
      label: "Log a WhatsApp",
      hasSubmenu: false,
    },
    {
      id: "log-sms",
      icon: MessageSquare,
      label: "Log a SMS",
      hasSubmenu: false,
    },
    {
      id: "log-meeting",
      icon: Calendar,
      label: "Log a Meeting",
      hasSubmenu: false,
    },
    {
      id: "log-email",
      icon: Mail,
      label: "Log a Email",
      hasSubmenu: false,
    },
  ];

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleActionClick = (actionId: string) => {
    onActionSelect(actionId);
    onClose();
  };

  const highlightText = (text: string, highlight?: string) => {
    if (!highlight) return text;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={`${part}-${index}`} style={{ color: "#0073b1" }}>
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        right: "0px",
        width: "280px",
        backgroundColor: "#ffffff",
        border: "1px solid #cbd5e0",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
        zIndex: 1001,
        overflow: "hidden",
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              border: "1px solid #cbd5e0",
              borderRadius: "20px",
              fontSize: "14px",
              color: "#141414",
              outline: "none",
              backgroundColor: "#ffffff",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#0091ae";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e0";
            }}
          />
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#718096",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Actions List */}
      <div
        style={{
          maxHeight: "320px",
          overflowY: "auto",
        }}
      >
        {filteredActions.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#718096",
              fontSize: "14px",
            }}
          >
            No actions found
          </div>
        ) : (
          filteredActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  <ActionIcon
                    size={18}
                    style={{ color: "#718096", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#141414",
                      fontWeight: "400",
                    }}
                  >
                    {highlightText(action.label, (action as { highlighted?: string }).highlighted)}
                  </span>
                </div>
                {action.hasSubmenu && (
                  <ChevronRight size={16} style={{ color: "#718096" }} />
                )}
              </button>
            );
          })
        )}
      </div>

    </div>
  );
};

// ============================================================================
// URL INPUT MODAL (for link/image URL entry - same style as app modals)
// ============================================================================

interface UrlInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultValue: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
}

const UrlInputModal: React.FC<UrlInputModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultValue,
  placeholder = "https://",
  submitLabel = "Insert",
  onSubmit,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const url = (value || "").trim() || defaultValue;
    onSubmit(url);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "400px",
        backgroundColor: "#ffffff",
        zIndex: 1002,
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#141414",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            color: "#718096",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f8fa";
            e.currentTarget.style.color = "#141414";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#718096";
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: "20px" }}>
        <input
          ref={inputRef}
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #cbd5e0",
            borderRadius: "6px",
            fontSize: "14px",
            color: "#141414",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#0091ae";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#cbd5e0";
          }}
        />
      </div>
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#141414",
            border: "1px solid #cbd5e0",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f7fafc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0066CC",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#007a8c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0091ae";
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// TASK MODAL COMPONENT
// ============================================================================

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTo?: string;
  assignedToName?: string;
  onSave: (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
  }) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  assignedTo = "",
  assignedToName = "Unassigned",
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [activityDate, setActivityDate] = useState(
    buildIn3BusinessDaysLabel(),
  );
  const [activityTime, setActivityTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [reminder, setReminder] = useState("No reminder");
  const [repeat, setRepeat] = useState(false);
  const [taskType, setTaskType] = useState("To-do");
  const [priority, setPriority] = useState("None");
  const [queue, setQueue] = useState("None");
  const [notes, setNotes] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [showTaskTypeDropdown, setShowTaskTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showQueueDropdown, setShowQueueDropdown] = useState(false);
  const [showMoreFormattingDropdown, setShowMoreFormattingDropdown] =
    useState(false);
  const [activityAssignedExtensions, setActivityAssignedExtensions] = useState<
    any[]
  >([]);
  const [selectedUserExtension, setSelectedUserExtension] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [customDate, setCustomDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [customTime, setCustomTime] = useState(() =>
    new Date().toTimeString().slice(0, 5),
  );
  const [urlModalType, setUrlModalType] = useState<"link" | "image" | null>(
    null,
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const moreFormattingRef = useRef<HTMLDivElement>(null);
  const taskPropertiesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const anyOpen =
      showTaskTypeDropdown || showPriorityDropdown || showQueueDropdown;
    if (!anyOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        taskPropertiesRef.current &&
        !taskPropertiesRef.current.contains(e.target as Node)
      ) {
        setShowTaskTypeDropdown(false);
        setShowPriorityDropdown(false);
        setShowQueueDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTaskTypeDropdown, showPriorityDropdown, showQueueDropdown]);

  useEffect(() => {
    const fetchExtensions = async () => {
      try {
        const hierarchyData = await GetHierarchyData(
          ModuleSlug.CRM_DATA_MANAGEMENT,
        );
        const exts = hierarchyData?.extensions || [];
        setActivityAssignedExtensions(exts);
        if (assignedTo && exts.length > 0) {
          const id = assignedTo.split(",")[0]?.trim() || "";
          const ext = exts.find(
            (e: any) =>
              e.id?.toString() === id || e.extension?.toString() === id,
          );
          if (ext)
            setSelectedUserExtension({
              value: ext.id?.toString() || ext.extension?.toString() || "",
              label:
                ext.display_name ||
                ext.name ||
                `Extension ${ext.id || ext.extension}`,
            });
        }
      } catch (error) {
        console.error("Failed to fetch activity assigned extensions:", error);
      }
    };
    if (isOpen) fetchExtensions();
  }, [isOpen, assignedTo]);

  useEffect(() => {
    if (!showMoreFormattingDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moreFormattingRef.current &&
        !moreFormattingRef.current.contains(e.target as Node)
      ) {
        setShowMoreFormattingDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreFormattingDropdown]);

  // Sync contentEditable content to state when modal opens (e.g. initial or after reset)
  useEffect(() => {
    if (isOpen && notesRef.current) {
      notesRef.current.innerHTML = notes || "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const syncNotesFromEditor = () => {
    if (notesRef.current) setNotes(notesRef.current.innerHTML || "");
  };

  type InlineFormat = "bold" | "italic" | "underline";

  const applyInlineFormat = (type: InlineFormat) => {
    const el = notesRef.current;
    if (!el) return;

    el.focus();

    const selection = globalThis.getSelection?.();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Ensure the selection is within the notes editor
    if (!el.contains(range.commonAncestorContainer)) return;
    if (range.collapsed) return;

    try {
      let tagName: string;
      if (type === "bold") {
        tagName = "strong";
      } else if (type === "italic") {
        tagName = "em";
      } else {
        tagName = "u";
      }

      const wrapper = document.createElement(tagName);
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      selection.addRange(newRange);

      syncNotesFromEditor();
    } catch (error) {
      console.error("Failed to apply inline format:", error);
    }
  };

  const handleBold = () => applyInlineFormat("bold");

  const handleItalic = () => applyInlineFormat("italic");

  const handleUnderline = () => applyInlineFormat("underline");

  const insertLinkAtSelection = (url: string) => {
    const el = notesRef.current;
    if (!el) return;

    const selection = globalThis.getSelection?.();
    if (!selection) return;

    let range = savedRangeRef.current;

    if (!range) {
      if (selection.rangeCount === 0) return;
      const candidate = selection.getRangeAt(0);
      if (
        !el.contains(candidate.commonAncestorContainer) ||
        candidate.collapsed
      ) {
        return;
      }
      range = candidate;
    }

    if (!el.contains(range.commonAncestorContainer) || range.collapsed) return;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    anchor.appendChild(range.extractContents());
    range.insertNode(anchor);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(anchor);
    selection.addRange(newRange);

    savedRangeRef.current = null;
    syncNotesFromEditor();
  };

  const insertImageAtSelection = (url: string) => {
    const el = notesRef.current;
    if (!el) return;

    const selection = globalThis.getSelection?.();
    if (!selection) return;

    let range: Range;

    if (selection.rangeCount > 0) {
      const candidate = selection.getRangeAt(0);
      if (el.contains(candidate.commonAncestorContainer)) {
        range = candidate;
      } else {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
      }
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }

    const img = document.createElement("img");
    img.src = url;
    img.alt = "";

    range.insertNode(img);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(img);
    newRange.collapse(true);
    selection.addRange(newRange);

    syncNotesFromEditor();
  };

  const handleLink = () => {
    const el = notesRef.current;
    if (!el) return;

    const selection = globalThis.getSelection?.();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        el.contains(range.commonAncestorContainer) &&
        !range.collapsed
      ) {
        savedRangeRef.current = range.cloneRange();
      } else {
        savedRangeRef.current = null;
      }
    } else {
      savedRangeRef.current = null;
    }

    el.focus();
    setUrlModalType("link");
  };

  // Keyboard shortcuts handler (Ctrl/Cmd+B, I, U, K)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!notesRef.current) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "u":
          e.preventDefault();
          handleUnderline();
          break;
        case "k":
          e.preventDefault();
          handleLink();
          break;
      }
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    const dateToSend = activityDate === "Custom..." ? customDate : activityDate;
    const timeToSend = activityDate === "Custom..." ? customTime : activityTime;
    const followUp = buildFollowUpTaskFields(
      true,
      activityDate,
      customDate,
      timeToSend,
    );

    onSave({
      title,
      activityDate: dateToSend,
      activityTime: timeToSend,
      reminder,
      repeat,
      taskType,
      priority,
      queue,
      assignedTo: selectedUserExtension?.value ?? "",
      notes,
      ...followUp,
    });

    // Reset form
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    setTitle("");
    setActivityDate(buildIn3BusinessDaysLabel());
    setActivityTime(timeStr);
    setCustomDate(today);
    setCustomTime(timeStr);
    setReminder("No reminder");
    setRepeat(false);
    setTaskType("To-do");
    setPriority("None");
    setQueue("None");
    setSelectedUserExtension(null);
    setNotes("");
    setIsMaximized(false);
    onClose();
  };

  const taskModalSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: "36px",
      fontSize: "14px",
      fontWeight: "600",
      borderColor: state.isFocused ? "#0091ae" : "#e2e8f0",
      borderRadius: "6px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 145, 174, 0.2)" : "none",
      "&:hover": { borderColor: state.isFocused ? "#0091ae" : "#cbd5e0" },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: "#718096",
      fontWeight: "400",
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: "#141414",
      fontWeight: "600",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: "#33475b",
      color: "white",
      fontSize: "13px",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: "white",
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: "white",
      "&:hover": { backgroundColor: "#1e3a5f" },
    }),
    menu: (provided: any) => ({ ...provided, fontSize: "14px" }),
  };

  const taskPropertyFieldStyle = {
    padding: "8px 12px",
    minHeight: "36px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as const;

  const taskTypes = [
    "To-do",
    "Call",
    "Email",
    "Meeting",
    "Task",
    "SMS",
    "WhatsApp",
  ];
  const priorities = ["None", "Low", "Medium", "High"];
  const queues = ["None", "Sales Queue", "Support Queue", "Marketing Queue"];
  const dateOptions = [
    "Today",
    "Tomorrow",
    buildIn3BusinessDaysLabel(),
    "In 1 week",
    "In 2 weeks",
    "In 1 month",
    "Custom...",
  ];
  const reminderOptions = [
    "No reminder",
    "At time of task",
    "5 minutes before",
    "15 minutes before",
    "30 minutes before",
    "1 hour before",
    "1 day before",
  ];

  return (
    <>
      <UrlInputModal
        isOpen={urlModalType === "link"}
        onClose={() => setUrlModalType(null)}
        title="Enter URL"
        defaultValue="https://"
        placeholder="https://"
        submitLabel="Insert link"
        onSubmit={(url) => {
          notesRef.current?.focus();
          insertLinkAtSelection(url);
          setUrlModalType(null);
        }}
      />
      <UrlInputModal
        isOpen={urlModalType === "image"}
        onClose={() => setUrlModalType(null)}
        title="Enter image URL"
        defaultValue="https://"
        placeholder="https://"
        submitLabel="Insert image"
        onSubmit={(url) => {
          notesRef.current?.focus();
          insertImageAtSelection(url);
          setUrlModalType(null);
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: isMaximized ? "60px 20px 20px 20px" : "auto 15vh 7.5vh auto",
          height: isMaximized ? "auto" : "650px",
          width: isMaximized ? "auto" : "min(650px, calc(100vw - 120px))",
          backgroundColor: "#ffffff",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
          borderRadius: "8px",
          border: "1px solid #cbd5e0",
          overflow: "hidden",
          animation: "slideInUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: "#141414",
                padding: "4px",
              }}
            >
              <ChevronDown size={20} style={{ transform: "rotate(90deg)" }} />
            </button>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
              }}
            >
              Task
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Task Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor: "#ffffff",
            padding: "20px",
          }}
        >
          {/* Task Title Input */}
          <div style={{ marginBottom: "20px" }}>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your task"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: "#141414",
                padding: "12px 16px",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Activity Date and Reminder Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Activity Date */}
            <div style={{ position: "relative" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "#141414",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Activity date
              </span>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                      setShowTimePicker(false);
                    }}
                    style={{
                      padding: "8px 2px",
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {activityDate === "Custom..." ? customDate : activityDate}
                  </button>
                  {/* Date Picker Dropdown */}
                  {showDatePicker && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "100%",
                        marginTop: "4px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "5px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        minWidth: "200px",
                        zIndex: 1001,
                        overflow: "hidden",
                      }}
                    >
                      {dateOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            if (option === "Custom...") {
                              setActivityDate("Custom...");
                              setActivityTime(customTime);
                              setShowDatePicker(false);
                            } else {
                              setActivityDate(option);
                              setShowDatePicker(false);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            backgroundColor: "transparent",
                            border: "none",
                            textAlign: "left",
                            fontSize: "14px",
                            color: "#33475b",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f7fafc";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTimePicker(true);
                      setShowDatePicker(false);
                    }}
                    style={{
                      padding: "8px 2px",
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: "300",
                    }}
                  >
                    <Clock size={16} />
                    {activityDate === "Custom..." ? customTime : activityTime}
                  </button>
                  {/* Time Picker Dropdown - opens when clicking the clock/time button */}
                  {showTimePicker && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "100%",
                        marginTop: "4px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "5px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        padding: "12px",
                        zIndex: 1001,
                      }}
                    >
                      <input
                        type="time"
                        value={
                          activityDate === "Custom..."
                            ? customTime
                            : activityTime
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setActivityTime(v);
                          if (activityDate === "Custom...") {
                            setCustomTime(v);
                          }
                          setShowTimePicker(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "5px",
                          fontSize: "14px",
                          color: "#141414",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom date input when Custom is selected; time is set via the time button picker above */}
              {activityDate === "Custom..." && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    marginTop: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "5px",
                      fontSize: "14px",
                      color: "#141414",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Send Reminder */}
            <div>
              <p
                style={{
                  fontSize: "13px",
                  color: "#141414",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Send reminder
              </p>
              <button
                onClick={() => setShowReminderPicker(!showReminderPicker)}
                style={{
                  width: "100%",
                  padding: "8px 3px",
                  backgroundColor: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {reminder}
              </button>

              {/* Reminder Picker Dropdown */}
              {showReminderPicker && (
                <div
                  style={{
                    position: "absolute",
                    marginTop: "4px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    minWidth: "200px",
                    zIndex: 1001,
                    overflow: "hidden",
                  }}
                >
                  {reminderOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setReminder(option);
                        setShowReminderPicker(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#33475b",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Set to Repeat Checkbox */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#141414",
              }}
            >
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              <span>Set to repeat</span>
            </label>
          </div>

          {/* Task Properties Grid */}
          <div
            ref={taskPropertiesRef}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              marginBottom: "20px",
              paddingBottom: "20px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            {/* Task Type */}
            <div style={{ position: "relative" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#718096",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Task Type
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowTaskTypeDropdown(!showTaskTypeDropdown);
                  setShowPriorityDropdown(false);
                  setShowQueueDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: "100%",
                  textAlign: "left",
                  font: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#141414",
                  }}
                >
                  {taskType}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#718096",
                    flexShrink: 0,
                    transform: showTaskTypeDropdown ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {showTaskTypeDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                    minWidth: "150px",
                    zIndex: 1001,
                    overflow: "hidden",
                  }}
                >
                  {taskTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTaskType(type);
                        setShowTaskTypeDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#33475b",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority */}
            <div style={{ position: "relative" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#718096",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Priority
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPriorityDropdown(!showPriorityDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowQueueDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: "100%",
                  textAlign: "left",
                  font: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#141414",
                  }}
                >
                  {priority}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#718096",
                    flexShrink: 0,
                    transform: showPriorityDropdown ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {showPriorityDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                    minWidth: "150px",
                    zIndex: 1001,
                    overflow: "hidden",
                  }}
                >
                  {priorities.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPriority(p);
                        setShowPriorityDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#33475b",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Queue */}
            <div style={{ position: "relative" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "#718096",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Queue
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowQueueDropdown(!showQueueDropdown);
                  setShowTaskTypeDropdown(false);
                  setShowPriorityDropdown(false);
                }}
                style={{
                  ...taskPropertyFieldStyle,
                  width: "100%",
                  textAlign: "left",
                  font: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#141414",
                  }}
                >
                  {queue}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    color: "#718096",
                    flexShrink: 0,
                    transform: showQueueDropdown ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {showQueueDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                    minWidth: "180px",
                    zIndex: 1001,
                    overflow: "hidden",
                  }}
                >
                  {queues.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQueue(q);
                        setShowQueueDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#33475b",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Assigned To */}
            <div style={{ position: "relative" }}>
              <label
                htmlFor="activity-assigned-select"
                style={{
                  fontSize: "13px",
                  color: "#718096",
                  fontWeight: "400",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Activity assigned to
              </label>
              <Select
                inputId="activity-assigned-select"
                options={activityAssignedExtensions.map((ext: any) => ({
                  value: ext.id?.toString() || ext.extension?.toString() || "",
                  label:
                    ext.display_name ||
                    ext.name ||
                    `Extension ${ext.id || ext.extension}`,
                }))}
                value={selectedUserExtension}
                onChange={(selected) =>
                  setSelectedUserExtension(selected || null)
                }
                placeholder="Select user"
                styles={taskModalSelectStyles}
              />
            </div>
          </div>

          {/* Notes Section - contentEditable for rich text (bold, italic, underline) */}
          <div style={{ marginBottom: "20px" }}>
            <style>{`.notes-content-editable:empty::before { content: attr(data-placeholder); color: #a0aec0; }`}</style>
            <div
              ref={notesRef}
              contentEditable
              suppressContentEditableWarning
              aria-label="Notes"
              onInput={syncNotesFromEditor}
              onKeyDown={handleKeyDown}
              data-placeholder="Notes..."
              style={{
                width: "100%",
                minHeight: isMaximized ? "300px" : "75px",
                border: "none",
                outline: "none",
                fontSize: "14px",
                color: "#141414",
                fontFamily: "inherit",
                lineHeight: "1.6",
                padding: "0",
              }}
              className="notes-content-editable"
            />
          </div>

        {/* Formatting Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "12px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
              }}
              title="Bold"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleBold}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              B
            </button>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
                fontStyle: "italic",
              }}
              title="Italic"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleItalic}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              I
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "underline",
              }}
              title="Underline"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              U
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: "500",
                gap: "4px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              More
              <ChevronDown size={14} />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="Link"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Link size={16} />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="Image"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Image size={16} aria-label="Insert Image" />
            </button>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
              }}
              title="List"
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <List size={16} />
            </button>
          </div>
          {/* Associated with 1 record - temporarily hidden */}
          <div style={{ display: "none" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                padding: "6px 10px",
                cursor: "pointer",
                color: "#141414",
                display: "flex",
                alignItems: "center",
                borderRadius: "3px",
                fontSize: "13px",
                fontWeight: "500",
                gap: "4px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#f5f8fa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Associated with 1 record
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor: "#ffffff",
          }}
        >
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              padding: "8px 24px",
              backgroundColor: title.trim() ? "#cbd5e0" : "#e2e8f0",
              color: "#141414",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: title.trim() ? "pointer" : "not-allowed",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (title.trim()) {
                e.currentTarget.style.backgroundColor = "#b8c5d0";
              }
            }}
            onMouseLeave={(e) => {
              if (title.trim()) {
                e.currentTarget.style.backgroundColor = "#cbd5e0";
              }
            }}
          >
            Create
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// LEGACY MEETING/SCHEDULE MODAL (kept for reference, no longer used)
// ============================================================================

interface LegacyMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostEmail?: string;
  hostName?: string;
  /** Single email, comma-separated string, or array of emails */
  attendeeEmail?: string | string[];
  attendeeName?: string;
  onSchedule: (meetingData: any) => void | Promise<void>;
}

const normalizeAttendeeEmails = (v?: string | string[]): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((e) => e.trim()).filter(Boolean);
  return v
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
};

const LegacyMeetingModal: React.FC<LegacyMeetingModalProps> = ({
  isOpen,
  onClose,
  hostEmail = "user@example.com",
  hostName = "Your Name",
  attendeeEmail,
  attendeeName,
  onSchedule,
}) => {
  const initialAttendees = normalizeAttendeeEmails(attendeeEmail);
  // State management
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [title, setTitle] = useState("");
  const selectedHost = hostEmail;
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState("01:00");
  const [endTime, setEndTime] = useState("01:30");
  const [attendees, setAttendees] = useState<string[]>(initialAttendees);
  const attendeeCount = initialAttendees.length > 0 ? initialAttendees.length : 2;
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [reminders, setReminders] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [hideWeekends, setHideWeekends] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("Asia/Almaty");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const timezoneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const next = normalizeAttendeeEmails(attendeeEmail);
      if (next.length > 0) setAttendees(next);
      if (titleInputRef.current) titleInputRef.current.focus();
    }
  }, [isOpen, attendeeEmail]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
      if (
        timezoneDropdownRef.current &&
        !timezoneDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // 5 days for weekdays

    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
    };
    return `${startOfWeek.toLocaleDateString("en-US", options)} - ${endOfWeek.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === startDate.getDate() &&
      date.getMonth() === startDate.getMonth() &&
      date.getFullYear() === startDate.getFullYear()
    );
  };

  const formatDateForDateInput = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = `${date.getMonth() + 1}`.padStart(2, "0");
    const dd = `${date.getDate()}`.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDateInputToLocalDate = (value: string) => {
    // value format: YYYY-MM-DD
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };

  const setStartDateAndSyncWeek = (date: Date) => {
    const next = new Date(date);
    setStartDate(next);
    setCurrentMonth(next);
  };

  /** Get the date for a calendar column (dayIndex) in the visible week */
  const getDateForColumn = (dayIndex: number) => {
    const dayDate = new Date(currentMonth);
    const startOfWeek = new Date(dayDate);
    startOfWeek.setDate(
      dayDate.getDate() - dayDate.getDay() + (hideWeekends ? 1 : 0),
    );
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + dayIndex);
    return d;
  };

  const openStartDatePicker = () => {
    const el = startDateInputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    }
    else el.click();
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentMonth(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentMonth);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentMonth(newDate);
  };

  const handleSchedule = async () => {
    if (!title.trim()) {
      alert("Please enter a meeting title");
      return;
    }
    setScheduleLoading(true);
    try {
      await onSchedule({
        title,
        hostType: "user",
        hostEmail: selectedHost,
        // Pass a date-only string to avoid timezone shifting (e.g. UTC+ offsets -> previous day in ISO UTC).
        startDate: formatDateForDateInput(startDate),
        startTime,
        endTime,
        attendees,
        location,
        reminders,
        description,
        internalNote,
      });
      setTitle("");
      setStartDate(new Date());
      setStartTime("01:00");
      setEndTime("01:30");
      setAttendees([]);
      setLocation("");
      setReminders([]);
      setDescription("");
      setInternalNote("");
      onClose();
    } finally {
      setScheduleLoading(false);
    }
  };

  const weekDays = hideWeekends
    ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const timeSlots = Array.from({ length: 24 }, (_, hour) => [
    `${hour.toString().padStart(2, "0")}:00`,
    `${hour.toString().padStart(2, "0")}:30`,
  ]).flat();

  const locations = [
    "Conference Room A",
    "Conference Room B",
    "Video Call",
    "Phone Call",
    "Client Office",
    "Custom Location",
  ];

  const meetingTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Almaty",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Australia/Melbourne",
  ];

  const getTimezoneLabel = (tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "longOffset",
      });
      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find((p) => p.type === "timeZoneName");
      const offset = offsetPart?.value ?? "";
      const city = tz.split("/").pop()?.replaceAll("_", " ") ?? tz;
      return offset ? `${offset} ${city}` : tz;
    } catch {
      return tz;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        height: isMaximized ? "auto" : "750px",
        width: isMaximized ? "auto" : "1320px",
        backgroundColor: "#ffffff",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        borderRadius: "8px",
        border: "1px solid #cbd5e0",
        overflow: "hidden",
        opacity: 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              color: "#141414",
              padding: "4px",
            }}
          >
            <ChevronDown size={20} />
          </button>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
            }}
          >
            Schedule
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "#141414",
            }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel - Form */}
        <div
          style={{
            width: "480px",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            {/* Host Section */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "12px",
                }}
              >
                Host
              </p>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowHostDropdown(!showHostDropdown)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    color: "#141414",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {hostName} &lt;{selectedHost}&gt;
                  </span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="meeting-title-input"
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Title
              </label>
              <input
                ref={titleInputRef}
                id="meeting-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=""
                style={{
                  width: "100%",
                  border: "1px solid #cccccc",
                  outline: "none",
                  fontSize: "14px",
                  color: "#141414",
                  padding: "10px 12px",
                  borderRadius: "4px",
                }}
              />
            </div>

            {/* Date and Time */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Start date
                  </p>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <button
                      type="button"
                      onClick={openStartDatePicker}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "none",
                        background: "transparent",
                        color: "inherit",
                        padding: 0,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <Calendar size={16} style={{ color: "#718096" }} />
                      <span>
                        {startDate.toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </button>
                    <input
                      aria-label="Start date"
                      ref={startDateInputRef}
                      type="date"
                      value={formatDateForDateInput(startDate)}
                      onChange={(e) => {
                        const parsed = parseDateInputToLocalDate(e.target.value);
                        if (parsed) setStartDateAndSyncWeek(parsed);
                      }}
                      style={{
                        position: "absolute",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="meeting-start-time"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    Start time
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} style={{ color: "#718096" }} />
                    <select
                      id="meeting-start-time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#141414",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="meeting-end-time"
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#141414",
                      display: "block",
                      marginBottom: "8px",
                    }}
                  >
                    End time
                  </label>
                  <div
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e0",
                      borderRadius: "4px",
                      fontSize: "14px",
                      color: "#141414",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Clock size={16} style={{ color: "#718096" }} />
                    <select
                      id="meeting-end-time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#141414",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Attendees
              </p>
              <button
                onClick={() => setShowAttendeesDropdown(!showAttendeesDropdown)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: "#141414",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{attendeeCount} attendees</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Location */}
            <div
              style={{ marginBottom: "24px", position: "relative" }}
              ref={locationDropdownRef}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Location
              </p>
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  color: location ? "#141414" : "#718096",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{location || "Select location"}</span>
                <ChevronDown size={16} />
              </button>

              {showLocationDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "5px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1001,
                    overflow: "hidden",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocation(loc);
                        setShowLocationDropdown(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#141414",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled reminder emails */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Scheduled reminder emails
              </p>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0091ae",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "0",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                <Plus size={16} />
                Add reminder
              </button>
            </div>

            {/* Attendee description */}
            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="meeting-description"
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#141414",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Attendee description
              </label>
              <textarea
                id="meeting-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Send a description to your attendees..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  padding: "10px 12px",
                  fontSize: "14px",
                  color: "#141414",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </div>

            {/* Associated with */}
            <div style={{ marginBottom: "24px" }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#141414",
                }}
              >
                Associated with 1 record
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Add internal note */}
            <div>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#0091ae",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "0",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                <Plus size={16} />
                Add internal note
              </button>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "12px",
              backgroundColor: "#ffffff",
            }}
          >
            <button
              onClick={handleSchedule}
              disabled={!title.trim() || scheduleLoading}
              style={{
                padding: "10px 24px",
                backgroundColor:
                  title.trim() && !scheduleLoading ? "#cbd5e0" : "#e2e8f0",
                color: "#141414",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor:
                  title.trim() && !scheduleLoading ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => {
                if (title.trim() && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = "#b8c5d0";
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim() && !scheduleLoading) {
                  e.currentTarget.style.backgroundColor = "#cbd5e0";
                }
              }}
            >
              {scheduleLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                    style={{
                      width: "14px",
                      height: "14px",
                      borderWidth: "2px",
                    }}
                  />
                  <span>Scheduling...</span>
                </>
              ) : (
                "Schedule meeting"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={scheduleLoading}
              style={{
                padding: "10px 24px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #cbd5e0",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f7fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#fafafa",
          }}
        >
          {/* Calendar Header */}
          {/* <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setStartDate(new Date())}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#141414',
                    cursor: 'pointer',
                  }}
                >
                  Today
                </button>
                
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#141414',
                }}>
                  <input
                    type="checkbox"
                    checked={hideWeekends}
                    onChange={(e) => setHideWeekends(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                  Hide weekends
                </label>
              </div>
  
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#141414',
                }}>
                  {formatDateRange(currentMonth)}
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handlePrevWeek}
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e0',
                      borderRadius: '4px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#141414',
                    }}
                  >
                    <ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e0',
                      borderRadius: '4px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#141414',
                    }}
                  >
                    <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                  </button>
                </div>
              </div>
  
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#141414',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  UTC +05:00 Almaty, Aqtau, Aqtobe, Ashgabat
                  <ChevronDown size={14} />
                </button>
              </div>
            </div> */}

          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              backgroundColor: "#ffffff",
            }}
          >
            {/* First Row - Today Button, Date Range with Arrows */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              {/* Left - Today Button */}
              <button
                onClick={() => setStartDateAndSyncWeek(new Date())}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#141414",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f7fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                Today
              </button>

              {/* Center - Date Range with Navigation Arrows */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <button
                  onClick={handlePrevWeek}
                  style={{
                    background: "transparent",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#141414",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ChevronDown
                    size={16}
                    style={{ transform: "rotate(90deg)" }}
                  />
                </button>

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#141414",
                    minWidth: "240px",
                    textAlign: "center",
                  }}
                >
                  {formatDateRange(currentMonth)}
                </div>

                <button
                  onClick={handleNextWeek}
                  style={{
                    background: "transparent",
                    border: "1px solid #cbd5e0",
                    borderRadius: "4px",
                    padding: "6px 8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#141414",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <ChevronDown
                    size={16}
                    style={{ transform: "rotate(-90deg)" }}
                  />
                </button>
              </div>

              {/* Right - Empty space for alignment */}
              <div style={{ width: "80px" }}></div>
            </div>

            {/* Second Row - Hide Weekends and Timezone */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Left - Hide Weekends Checkbox */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#141414",
                  fontWeight: "400",
                }}
              >
                <input
                  type="checkbox"
                  checked={hideWeekends}
                  onChange={(e) => setHideWeekends(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: "#141414",
                  }}
                />
                <span>Hide weekends</span>
              </label>

              {/* Right - Timezone Selector */}
              <div
                style={{ position: "relative" }}
                ref={timezoneDropdownRef}
              >
                <button
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "#141414",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "background-color 0.2s",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {getTimezoneLabel(selectedTimezone)}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showTimezoneDropdown ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>
                {showTimezoneDropdown && (
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
                      zIndex: 1001,
                      overflow: "hidden",
                      maxHeight: "280px",
                      overflowY: "auto",
                      minWidth: "240px",
                      ...( { scrollbarWidth: "thin", scrollbarColor: "#c8c8c8 transparent" } as any),
                    }}
                  >
                    {meetingTimezones.map((tz) => (
                      <button
                        key={tz}
                        type="button"
                        onClick={() => {
                          setSelectedTimezone(tz);
                          setShowTimezoneDropdown(false);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          backgroundColor:
                            selectedTimezone === tz ? "#f7fafc" : "transparent",
                          border: "none",
                          textAlign: "left",
                          fontSize: "14px",
                          color: "#141414",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            selectedTimezone === tz ? "#f7fafc" : "transparent";
                        }}
                      >
                        {getTimezoneLabel(tz)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
            {/* Week Days Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: hideWeekends
                  ? "80px repeat(5, 1fr)"
                  : "80px repeat(7, 1fr)",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div
                style={{ padding: "12px", borderRight: "1px solid #e2e8f0" }}
              ></div>
              {weekDays.map((day, index) => {
                const dayDate = new Date(currentMonth);
                const startOfWeek = new Date(dayDate);
                startOfWeek.setDate(
                  dayDate.getDate() - dayDate.getDay() + (hideWeekends ? 1 : 0),
                );
              const currentDayDate = new Date(startOfWeek);
              currentDayDate.setDate(startOfWeek.getDate() + index);
            
              const isCurrentDay = isToday(currentDayDate);
              const isSelectedDay = isSelected(currentDayDate);
              let dateCircleBackgroundColor = "transparent";
              if (isCurrentDay) {
                dateCircleBackgroundColor = "#ff3842";
              } else if (isSelectedDay) {
                dateCircleBackgroundColor = "#141414";
              }

              return (
                  <button
                    type="button"
                    key={day}
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      borderRight:
                        index < weekDays.length - 1
                          ? "1px solid #e2e8f0"
                          : "none",
                      backgroundColor: "#ffffff",
                      cursor: "pointer",
                      border: "none",
                      width: "100%",
                    }}
                    onClick={() => setStartDateAndSyncWeek(currentDayDate)}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#718096",
                        marginBottom: "4px",
                      }}
                    >
                      {day}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: isCurrentDay ? "600" : "400",
                        color:
                          isCurrentDay || isSelectedDay ? "#ffffff" : "#141414",
                        backgroundColor: dateCircleBackgroundColor,
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                      }}
                    >
                      {currentDayDate.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            <div style={{ position: "relative" }}>
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: hideWeekends
                      ? "80px repeat(5, 1fr)"
                      : "80px repeat(7, 1fr)",
                    borderBottom: "1px solid #e2e8f0",
                    minHeight: "60px",
                  }}
                >
                  {/* Time Label */}
                  <div
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#718096",
                      borderRight: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      position: "sticky",
                      left: 0,
                    }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>

                  {/* Day Cells */}
                  {weekDays.map((_, dayIndex) => (
                    <button
                      type="button"
                      key={weekDays[dayIndex]}
                      style={{
                        borderRight:
                          dayIndex < weekDays.length - 1
                            ? "1px solid #e2e8f0"
                            : "none",
                        backgroundColor: "#fafafa",
                        cursor: "pointer",
                        position: "relative",
                        border: "none",
                        width: "100%",
                        minHeight: "60px",
                      }}
                      onClick={() => {
                        const cellDate = getDateForColumn(dayIndex);
                        setStartDateAndSyncWeek(cellDate);
                        setStartTime(
                          `${hour.toString().padStart(2, "0")}:00`,
                        );
                        setEndTime(`${hour.toString().padStart(2, "0")}:30`);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f0f4f8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                    >
                      {/* Sample Event on Wednesday at 18:00 */}
                      {dayIndex === 2 && hour === 18 && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: "-60px",
                            backgroundColor: "#e3f2fd",
                            border: "1px solid #2196f3",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "#141414",
                            fontWeight: "500",
                            overflow: "hidden",
                          }}
                        >
                          Prime alley x Hub...
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};    

// ============================================================================
// HELPERS (module scope — no component state dependencies)
// ============================================================================

const isCrmEntityType = (value: string): value is CrmEntityType =>
  value === "prospect" ||
  value === "lead" ||
  value === "deal" ||
  value === "order";

const normalizeActivityEntityType = (entityType: string): CrmEntityType => {
  return isCrmEntityType(entityType) ? entityType : "order";
};

const buildActivitiesBaseUrl = (
  type: CrmEntityType | "activity" | "company",
  id: number | string,
  entityTypeOverride?: CrmEntityType,
): string | null => {
  const effectiveType =
    type === "activity"
      ? normalizeActivityEntityType(entityTypeOverride ?? "lead")
      : normalizeActivityEntityType(type);
  const effectiveId = type === "activity" ? Number(id) : id;

  if (type === "activity" && Number.isNaN(effectiveId)) return null;

  return `/crm/detailspage?type=${effectiveType}&id=${effectiveId}&section=activities`;
};

type RecentActivitiesState = {
  loading: boolean;
  data: Record<string, unknown> | null;
  detailPath: (id: number) => string;
};

const getRecentActivitiesState = ({
  recordType,
  prospectLoading,
  prospectData,
  leadLoading,
  leadData,
  dealLoading,
  dealData,
  orderLoading,
  orderData,
  activityHistoryChainLoading,
  activityHistoryChain,
  activityEntityType,
}: {
  recordType?: CrmEntityType | "activity" | "company";
  prospectLoading: boolean;
  prospectData: unknown;
  leadLoading: boolean;
  leadData: unknown;
  dealLoading: boolean;
  dealData: unknown;
  orderLoading: boolean;
  orderData: unknown;
  activityHistoryChainLoading: boolean;
  activityHistoryChain: HistoryChainRecord[] | null;
  activityEntityType?: CrmEntityType;
}): RecentActivitiesState | null => {
  if (!recordType) return null;

  const states: Record<string, RecentActivitiesState> = {
    prospect: {
      loading: prospectLoading,
      data: prospectData as Record<string, unknown> | null,
      detailPath: (id: number) =>
        `/crm/detailspage?type=prospect&id=${id}&section=activities`,
    },
    lead: {
      loading: leadLoading,
      data: leadData as Record<string, unknown> | null,
      detailPath: (id: number) =>
        `/crm/detailspage?type=lead&id=${id}&section=activities`,
    },
    deal: {
      loading: dealLoading,
      data: dealData as Record<string, unknown> | null,
      detailPath: (id: number) =>
        `/crm/detailspage?type=deal&id=${id}&section=activities`,
    },
    order: {
      loading: orderLoading,
      data: orderData as Record<string, unknown> | null,
      detailPath: (id: number) =>
        `/crm/detailspage?type=order&id=${id}&section=activities`,
    },
    activity: {
      loading: activityHistoryChainLoading,
      data:
        activityHistoryChain == null
          ? null
          : { audit_trail: activityHistoryChain },
      detailPath: (id: number) =>
        `/crm/detailspage?type=${normalizeActivityEntityType(activityEntityType ?? "lead")}&id=${id}&section=activities`,
    },
  };

  return states[recordType] ?? null;
};

type SidebarRecordDataState = {
  prospectData: CrmDataItem | null;
  prospectLoading: boolean;
  leadData: LeadData | null;
  leadLoading: boolean;
  dealData: DealData | null;
  dealLoading: boolean;
  orderData: OrderData | null;
  orderLoading: boolean;
  activityHistoryChain: HistoryChainRecord[] | null;
  activityHistoryChainLoading: boolean;
};

const useSidebarRecordData = ({
  isOpen,
  recordType,
  recordId,
  activityEntityType,
}: {
  isOpen: boolean;
  recordType?: SidebarRecordType;
  recordId?: number | string;
  activityEntityType?: CrmEntityType;
}): SidebarRecordDataState => {
  const [prospectData, setProspectData] = useState<CrmDataItem | null>(null);
  const [prospectLoading, setProspectLoading] = useState(false);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [dealLoading, setDealLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [activityHistoryChain, setActivityHistoryChain] = useState<
    HistoryChainRecord[] | null
  >(null);
  const [activityHistoryChainLoading, setActivityHistoryChainLoading] =
    useState(false);

  useEffect(() => {
    if (!isOpen || recordType !== "prospect" || recordId == null) {
      setProspectData(null);
      return;
    }
    const id = Number(recordId);
    if (Number.isNaN(id)) {
      setProspectData(null);
      return;
    }
    setProspectLoading(true);
    getAllCrmDataById(id)
      .then((data) => {
        setProspectData(data);
      })
      .catch(() => {
        setProspectData(null);
      })
      .finally(() => {
        setProspectLoading(false);
      });
  }, [isOpen, recordType, recordId]);

  useEffect(() => {
    if (!isOpen || recordType !== "lead" || recordId == null) {
      setLeadData(null);
      return;
    }
    const id = Number(recordId);
    if (Number.isNaN(id)) {
      setLeadData(null);
      return;
    }
    setLeadLoading(true);
    getLead(id)
      .then((data) => {
        setLeadData(data);
      })
      .catch(() => {
        setLeadData(null);
      })
      .finally(() => {
        setLeadLoading(false);
      });
  }, [isOpen, recordType, recordId]);

  useEffect(() => {
    if (!isOpen || recordType !== "deal" || recordId == null) {
      setDealData(null);
      return;
    }
    const id = Number(recordId);
    if (Number.isNaN(id)) {
      setDealData(null);
      return;
    }
    setDealLoading(true);
    getDeal(id)
      .then((data) => setDealData(data))
      .catch(() => setDealData(null))
      .finally(() => setDealLoading(false));
  }, [isOpen, recordType, recordId]);

  useEffect(() => {
    if (!isOpen || recordType !== "order" || recordId == null) {
      setOrderData(null);
      return;
    }
    const id = Number(recordId);
    if (Number.isNaN(id)) {
      setOrderData(null);
      return;
    }
    setOrderLoading(true);
    getOrder(id)
      .then((data) => setOrderData(data))
      .catch(() => setOrderData(null))
      .finally(() => setOrderLoading(false));
  }, [isOpen, recordType, recordId]);

  useEffect(() => {
    if (
      !isOpen ||
      recordType !== "activity" ||
      recordId == null ||
      !activityEntityType
    ) {
      setActivityHistoryChain(null);
      return;
    }
    const id = Number(recordId);
    if (Number.isNaN(id)) {
      setActivityHistoryChain(null);
      return;
    }
    setActivityHistoryChainLoading(true);
    getHistoryChain(activityEntityType, id)
      .then((data) => setActivityHistoryChain(data ?? null))
      .catch(() => setActivityHistoryChain(null))
      .finally(() => setActivityHistoryChainLoading(false));
  }, [isOpen, recordType, recordId, activityEntityType]);

  return {
    prospectData,
    prospectLoading,
    leadData,
    leadLoading,
    dealData,
    dealLoading,
    orderData,
    orderLoading,
    activityHistoryChain,
    activityHistoryChainLoading,
  };
};

const useSidebarNotes = ({
  isOpen,
  recordType,
  recordId,
}: {
  isOpen: boolean;
  recordType?: SidebarRecordType;
  recordId?: number;
}) => {
  const [sidebarNotesList, setSidebarNotesList] = useState<CrmNoteItem[]>([]);
  const [sidebarNotesLoading, setSidebarNotesLoading] = useState(false);

  const refreshSidebarNotes = useCallback(async () => {
    if (
      !isOpen ||
      !recordType ||
      recordType === "activity" ||
      recordType === "company" ||
      recordId == null ||
      Number.isNaN(Number(recordId))
    ) {
      return;
    }

    setSidebarNotesLoading(true);
    try {
      const res = await getCrmNotes(recordType, Number(recordId));
      setSidebarNotesList(res?.data ?? []);
    } catch {
      setSidebarNotesList([]);
    } finally {
      setSidebarNotesLoading(false);
    }
  }, [isOpen, recordId, recordType]);

  useEffect(() => {
    refreshSidebarNotes().catch(() => {
      // refreshSidebarNotes handles its own failure state
    });
  }, [refreshSidebarNotes]);

  return {
    sidebarNotesList,
    sidebarNotesLoading,
    refreshSidebarNotes,
  };
};

const useSidebarCallRecordings = ({
  isOpen,
  phone,
}: {
  isOpen: boolean;
  phone?: string;
}) => {
  const [sidebarCallRecordings, setSidebarCallRecordings] = useState<any[]>([]);
  const [sidebarCallRecordingsLoading, setSidebarCallRecordingsLoading] =
    useState(false);
  const callRecordingsFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      callRecordingsFetchKeyRef.current = null;
      return;
    }

    const normalizedPhone = (phone || "").trim().replaceAll(/\s/g, "");
    if (!normalizedPhone) {
      setSidebarCallRecordings([]);
      return;
    }

    const fetchKey = `${normalizedPhone}`;
    if (callRecordingsFetchKeyRef.current === fetchKey) return;

    callRecordingsFetchKeyRef.current = fetchKey;
    setSidebarCallRecordingsLoading(true);
    ListCallLogs(
      {
        page: 1,
        perPage: 20,
        search: "",
        filters: { remote_party_number: [String(normalizedPhone)] },
        reportType: "recordings",
        moduleSlug: ModuleSlug.CALL_RECORDINGS,
      },
      "call-logs/recordings",
    )
      .then((response: any) => {
        const data = response ?? {};
        setSidebarCallRecordings(
          Array.isArray(data.dataList) ? data.dataList : [],
        );
      })
      .catch(() => setSidebarCallRecordings([]))
      .finally(() => setSidebarCallRecordingsLoading(false));
  }, [isOpen, phone]);

  return {
    sidebarCallRecordings,
    sidebarCallRecordingsLoading,
  };
};

function buildEmailContextPayload(
  contextPayload?: Record<string, unknown>,
): { lead?: unknown; deal?: unknown; order?: unknown } | undefined {
  if (!contextPayload || typeof contextPayload !== "object") return undefined;
  return {
    lead: contextPayload.lead,
    deal: contextPayload.deal,
    order: contextPayload.order,
  };
}

function toActivityRecordTypeForModals(
  recordType?: SidebarRecordType,
): CrmEntityType | undefined {
  if (
    recordType === "prospect" ||
    recordType === "lead" ||
    recordType === "deal" ||
    recordType === "order"
  ) {
    return recordType;
  }
  return undefined;
}

function toActivityRecordIdForModals(recordId?: number): number | undefined {
  if (recordId == null) return undefined;
  const parsed = Number(recordId);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function splitCommaSeparated(value: unknown): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildActivityModalsParamsFromSidebar(args: {
  activityRecordType: CrmEntityType | undefined;
  activityRecordId: number | undefined;
  title: string;
  emailList: string[];
  phoneList: string[];
  refreshSidebarNotes: () => Promise<unknown>;
}): UseCrmActivityModalsParams {
  const {
    activityRecordType,
    activityRecordId,
    title,
    emailList,
    phoneList,
    refreshSidebarNotes,
  } = args;

  if (activityRecordType && activityRecordId != null) {
    return {
      recordType: activityRecordType,
      recordId: activityRecordId,
      recordName: title,
      recordEmail: emailList[0] ?? "",
      recordPhone: phoneList[0] ?? "",
      onNoteCreated: () => {
        refreshSidebarNotes().catch(() => {
          // refreshSidebarNotes handles its own failure state
        });
      },
    };
  }

  return {
    recordType: "prospect",
    recordId: 0,
    recordName: "",
    recordEmail: "",
    recordPhone: "",
    onNoteCreated: () => {},
  };
}

type CtiDialResult = { success?: boolean; error?: string } | undefined;

interface UseCtiCallHandlersArgs {
  ctiDialNumber: (numberToDial: string) => Promise<CtiDialResult>;
  getAllUserDevices?: () => any[] | null;
  makeCall: (params: {
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  }) => Promise<CtiDialResult>;
  ctiUserAddress?: string;
  onCall?: (phoneNumber: string) => void;
  setShowCallModal: React.Dispatch<React.SetStateAction<boolean>>;
}

function handleCtiCallResult(result: CtiDialResult, onSuccess: () => void): void {
  if (result?.success) {
    onSuccess();
    return;
  }
  if (result?.error) toast.error(result.error);
}

async function invokeCtiDialWithToast(
  dialFn: () => Promise<CtiDialResult>,
  onSuccess: () => void,
): Promise<void> {
  try {
    handleCtiCallResult(await dialFn(), onSuccess);
  } catch {
    toast.error("Failed to make call");
  }
}

function useCtiCallHandlers({
  ctiDialNumber,
  getAllUserDevices,
  makeCall,
  ctiUserAddress,
  onCall,
  setShowCallModal,
}: UseCtiCallHandlersArgs) {
  const [showDeviceSelectionModal, setShowDeviceSelectionModal] =
    useState(false);
  const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  const [pendingDialedNumber, setPendingDialedNumber] = useState("");
  const resetDeviceSelection = useCallback(() => {
    setShowDeviceSelectionModal(false);
    setAvailableDevices([]);
    setPendingDialedNumber("");
  }, []);

  const completeSuccessfulDial = useCallback(
    (dialedNumber: string) => {
      setShowCallModal(false);
      onCall?.(dialedNumber);
    },
    [onCall, setShowCallModal],
  );

  const handleCall = useCallback(
    async (phoneNumber: string) => {
      const numberToDial = (phoneNumber || "").trim();
      if (!numberToDial) {
        toast.error("No phone number available to call");
        return;
      }

      const userDevices = getAllUserDevices?.();
      if (userDevices && userDevices.length > 1) {
        setAvailableDevices(userDevices);
        setPendingDialedNumber(numberToDial);
        setShowDeviceSelectionModal(true);
        setShowCallModal(false);
        return;
      }

      await invokeCtiDialWithToast(
        () => ctiDialNumber(numberToDial),
        () => completeSuccessfulDial(numberToDial),
      );
    },
    [
      ctiDialNumber,
      completeSuccessfulDial,
      getAllUserDevices,
      setShowCallModal,
    ],
  );

  const handleDeviceSelect = useCallback(
    async (device: { deviceType: string; deviceName: string }) => {
      const numberToDial = pendingDialedNumber;
      resetDeviceSelection();

      const callerInfo = {
        callingAddress: ctiUserAddress,
        callingDeviceName: device.deviceName,
        callingDeviceType: device.deviceType,
        selectedAt: new Date().toISOString(),
      };
      localStorage.setItem("cti_caller_info", JSON.stringify(callerInfo));

      await invokeCtiDialWithToast(
        () =>
          makeCall({
            callingAddress: ctiUserAddress ?? "",
            calledAddress: numberToDial,
            callingDeviceType: device.deviceType,
            callingDeviceName: device.deviceName,
          }),
        () => completeSuccessfulDial(numberToDial),
      );
    },
    [
      pendingDialedNumber,
      resetDeviceSelection,
      ctiUserAddress,
      makeCall,
      completeSuccessfulDial,
    ],
  );

  return {
    showDeviceSelectionModal,
    availableDevices,
    resetDeviceSelection,
    handleCall,
    handleDeviceSelect,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const GenericSidebar: React.FC<GenericSidebarProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  company,
  avatar,
  email,
  phone,
  quickActions,
  onQuickActionClick,
  crmSummary,
  sections = [],
  width = "470px",
  dockInParent = false,
  hideTopHeadingBar = false,
  recordLink,
  actionsDropdown,
  permissionMessage,
  contextPayload,
  recordType,
  recordId,
  activityEntityType,
  resolveUserLabel,
  onNoteCreate,
  onEmailSend,
  senderEmail,
  senderName,
  onTaskCreate,
  onCall,
  callerNumber,
  onMeetingSchedule,
  leadId,
  dealId,
  userExtension,
  record,
  onWhatsAppLog,
  onSmsLog,
  onPlayCallRecording,
  onLogCall,
  onLogEmail,
  onLogSms,
  onLogWhatsApp,
  onLogMeeting,
  sidebarMarginTop = 0,
}) => {
  const router = useRouter();
  const emailContextPayload = buildEmailContextPayload(contextPayload);
  const { data: session } = useSession();
  const {
    dialNumber: ctiDialNumber,
    getAllUserDevices,
    makeCall,
    userAddress: ctiUserAddress,
  } = useCti();
  const { extension, tenantId } = getCrmSessionUserContext(session, {
    tenantMissingFallback: "empty",
  });

  const {
    prospectData,
    prospectLoading,
    leadData,
    leadLoading,
    dealData,
    dealLoading,
    orderData,
    orderLoading,
    activityHistoryChain,
    activityHistoryChainLoading,
  } = useSidebarRecordData({
    isOpen,
    recordType,
    recordId,
    activityEntityType,
  });

  // Record summary from API crm_summary.
  // Always show the section; when summary is missing/empty, the UI will display a fallback message.
  const recordSummary: RecordSummaryDisplay = {
    content: (crmSummary?.summary ?? "").trim(),
    timestamp: crmSummary ? `Generated ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : "",
    onRefresh: () => {
      globalThis.window?.dispatchEvent(new CustomEvent("breeze-summary:refresh"));
    },
    onCopy: () => {
      void copyToClipboard(crmSummary?.summary ?? "");
    },
    onAskQuestion: () => {
      globalThis.window?.dispatchEvent(
        new CustomEvent("breeze-assistant:open"),
      );
    },
  };

  // Parse comma-separated email/phone into arrays for multiple contact support
  const emailList = useMemo(() => splitCommaSeparated(email), [email]);
  const phoneList = useMemo(() => splitCommaSeparated(phone), [phone]);
  const hasEmail = emailList.length > 0;
  const hasPhone = phoneList.length > 0;

  // Shared CRM activity modals (same as detail pages) – used when we have a concrete CRM record
  const activityRecordTypeForModals =
    toActivityRecordTypeForModals(recordType);
  const activityRecordIdForModals = toActivityRecordIdForModals(recordId);

  const {
    sidebarNotesList,
    sidebarNotesLoading,
    refreshSidebarNotes,
  } = useSidebarNotes({
    isOpen,
    recordType,
    recordId,
  });
  const {
    sidebarCallRecordings,
    sidebarCallRecordingsLoading,
  } = useSidebarCallRecordings({
    isOpen,
    phone,
  });

  const activityModalsParams = buildActivityModalsParamsFromSidebar({
    activityRecordType: activityRecordTypeForModals,
    activityRecordId: activityRecordIdForModals,
    title,
    emailList,
    phoneList,
    refreshSidebarNotes,
  });

  const activityModals = useCrmActivityModals(activityModalsParams);

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(),
  );
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [openActionsSubMenuIndex, setOpenActionsSubMenuIndex] = useState<
    number | null
  >(null);
  const [actionsSubMenuSearch, setActionsSubMenuSearch] = useState("");
  const [showSectionActions, setShowSectionActions] = useState<string | null>(
    null,
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const {
    showDeviceSelectionModal,
    availableDevices,
    resetDeviceSelection,
    handleCall,
    handleDeviceSelect,
  } = useCtiCallHandlers({
    ctiDialNumber,
    getAllUserDevices,
    makeCall,
    ctiUserAddress,
    onCall,
    setShowCallModal,
  });
  const [moreModalPosition, setMoreModalPosition] = useState({
    top: 0,
    left: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const actionsDropdownMenuPortalRef = useRef<HTMLDivElement>(null);
  const [actionsMenuFixedStyle, setActionsMenuFixedStyle] =
    useState<React.CSSProperties | null>(null);
  const sectionDropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>(
    {},
  );
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize collapsed sections based on defaultExpanded
  // Only reset when record context changes (not on every async sections update),
  // so user toggles are preserved while viewing the same record.
  useEffect(() => {
    if (!isOpen) return;

    const collapsed = new Set<string>();
    if (sections?.length) {
      sections.forEach((section) => {
        if (section.collapsible && section.defaultExpanded === false) {
          collapsed.add(section.id);
        }
      });
    }
    setCollapsedSections(collapsed);
  }, [isOpen, recordType, recordId]);

  const syncActionsMenuPosition = useCallback(() => {
    const btn = actionsDropdownButtonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setActionsMenuFixedStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.right,
      transform: "translateX(-100%)",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "5px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      minWidth: "180px",
      zIndex: 10050,
      overflow: "hidden",
    });
  }, []);

  useLayoutEffect(() => {
    if (!showActionsDropdown) {
      setActionsMenuFixedStyle(null);
      return;
    }
    syncActionsMenuPosition();
    window.addEventListener("resize", syncActionsMenuPosition);
    window.addEventListener("scroll", syncActionsMenuPosition, true);
    return () => {
      window.removeEventListener("resize", syncActionsMenuPosition);
      window.removeEventListener("scroll", syncActionsMenuPosition, true);
    };
  }, [showActionsDropdown, syncActionsMenuPosition]);

  // Close dropdown when clicking outside (menu is portaled, so check both refs)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (showActionsDropdown) {
        const inTrigger = dropdownRef.current?.contains(targetNode);
        const inMenu =
          actionsDropdownMenuPortalRef.current?.contains(targetNode);
        if (!inTrigger && !inMenu) {
          setShowActionsDropdown(false);
          setOpenActionsSubMenuIndex(null);
          setActionsSubMenuSearch("");
        }
      }

      const entries = Object.entries(sectionDropdownRefs.current);
      for (const [key, ref] of entries) {
        if (ref && !ref.contains(targetNode)) {
          setShowSectionActions((prev) => (prev === key ? null : prev));
          break;
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionsDropdown]);

  const dockedOuterStyle = useMemo<React.CSSProperties>(
    () =>
      dockInParent
        ? {
            width,
            backgroundColor: "#ffffff",
            border: "1px solid #cccccc",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            alignSelf: "stretch",
            height: "100%",
            maxHeight: "100%",
            overflow: "hidden",
            animation: "slideInRight 0.3s ease-out",
            flexShrink: 0,
            marginTop: 0,
            position: "relative",
          }
        : {
            width,
            backgroundColor: "#ffffff",
            border: "1px solid #cccccc",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "100%",
            overflow: "hidden",
            animation: "slideInRight 0.3s ease-out",
            flexShrink: 0,
            marginTop: sidebarMarginTop,
            position: "relative",
          },
    [dockInParent, width],
  );

  /** Column under the title bar: fixed contact/actions row + scrollable body (dropdowns are not clipped). */
  const dockedBodyColumnStyle = useMemo<React.CSSProperties>(
    () => ({
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }),
    [],
  );

  const dockedScrollBodyStyle = useMemo<React.CSSProperties>(
    () =>
      dockInParent
        ? {
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #cccccc",
            borderRadius: "0 0 10px 10px",
          }
        : {
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            backgroundColor: "#ffffff",
            maxHeight: "100%",
            borderBottom: "1px solid #cccccc",
            borderRadius: "0 0 10px 10px",
          },
    [dockInParent],
  );

  if (!isOpen) return null;

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string | number) => {
    const value = String(text ?? "");
    if (!value) {
      toast.error("Nothing to copy");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        toast.error("Clipboard API is not available in this browser.");
        return;
      }
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard", err);
      toast.error("Failed to copy. Please try again.");
    }
  };

  const handleNoteClick = () => {
    if (activityModals) {
      activityModals.openNote();
      return;
    }
    setShowNotesModal(true);
  };

  const handleNoteClose = () => {
    setShowNotesModal(false);
  };

  const handleNoteSave = async (note: string, createTask: boolean, taskDueDate?: string, attachments?: File[]) => {
    const text = note.trim();
    if (!text) return;
    const crmRecordType =
      recordType === "activity" ? activityEntityType : recordType;
    if (crmRecordType && recordId != null) {
      try {
        await createCrmNote({
          record_type: crmRecordType,
          record_id: Number(recordId),
          text,
          ...(attachments?.length ? { attachments } : {}),
        });
        setShowNotesModal(false);
        toast.success("Note created successfully");
        onNoteCreate?.(note, createTask, taskDueDate);
        // Refresh sidebar notes list
        refreshSidebarNotes().catch(() => {
          // refreshSidebarNotes handles its own failure state
        });
      } catch {
        // createCrmNote already shows toast on error
      }
      return;
    }
    onNoteCreate?.(note, createTask, taskDueDate);
  };

  const handleEmailClick = () => {
    if (activityModals) {
      activityModals.openEmail();
      return;
    }
    setShowEmailModal(true);
  };

  const handleEmailClose = () => {
    setShowEmailModal(false);
  };

  const handleEmailSend = async (
    emailData: {
      to: string[];
      cc: string[];
      bcc: string[];
      subject: string;
      body: string;
      createFollowUpTask: boolean;
      followUpTaskDueDate: string | null;
      followUpTaskDueTime: string | null;
      attachments?: File[];
    },
    record?: {
      id: number;
      type: RECORD_TYPES;
    },
  ) => {
    if (!emailData.to?.length) return;
    try {
      await sendEmail({
        to: emailData.to,
        cc: emailData.cc?.length ? emailData.cc : undefined,
        bcc: emailData.bcc?.length ? emailData.bcc : undefined,
        subject: emailData.subject,
        content: emailData.body,
        record_id: record?.id,
        record_type: record?.type,
        ...(emailData.attachments?.length
          ? { attachmentFiles: emailData.attachments }
          : {}),
        ...followUpTaskFieldsToApiPayload({
          createFollowUpTask: emailData.createFollowUpTask,
          followUpTaskDueDate: emailData.followUpTaskDueDate,
          followUpTaskDueTime: emailData.followUpTaskDueTime,
        }),
      });
      onEmailSend?.(emailData);
    } catch (err: unknown) {
      let message = "Failed to send email";
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      } else if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: { message?: string } } })
          .response;
        if (typeof res?.data?.message === "string") message = res.data.message;
      }
      toast.error(message);
      throw err;
    }
  };

  const handleTaskClick = () => {
    if (activityModals) {
      activityModals.openTask();
      return;
    }
    setShowTaskModal(true);
  };

  const handleTaskClose = () => {
    setShowTaskModal(false);
  };

  const handleTaskSave = async (taskData: {
    title: string;
    activityDate: string;
    activityTime: string;
    reminder: string;
    repeat: boolean;
    taskType: string;
    priority: string;
    queue: string;
    assignedTo: string;
    notes: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
  }) => {
    if (recordType && recordId != null && !Number.isNaN(Number(recordId))) {
      const due_date =
        taskData.followUpTaskDueDate ??
        resolveFollowUpDueDateYmd(taskData.activityDate, "");
      const timeSlice =
        taskData.followUpTaskDueTime ??
        (taskData.activityTime?.length >= 5
          ? taskData.activityTime.slice(0, 5)
          : undefined);
      let urgency: "high" | "med" | "low";
      if (taskData.priority === "High") {
        urgency = "high";
      } else if (taskData.priority === "Medium") {
        urgency = "med";
      } else {
        urgency = "low";
      }
      try {
        await createTask({
          name: taskData.title.trim() || "Task",
          user_extension: extension,
          assigned_to: taskData.assignedTo || undefined,
          created_by: extension,
          urgency,
          due_date,
          time: timeSlice,
          status: "pending",
          notes: taskData.notes?.trim()
            ? [{ note: taskData.notes.trim() }]
            : undefined,
          record_type: recordType as CrmEntityType,
          record_id: Number(recordId),
          ...followUpTaskFieldsToApiPayload({
            createFollowUpTask: taskData.createFollowUpTask,
            followUpTaskDueDate: taskData.followUpTaskDueDate,
            followUpTaskDueTime: taskData.followUpTaskDueTime,
          }),
        });
        setShowTaskModal(false);
        onTaskCreate?.(taskData);
      } catch {
        // createTask shows toast on error
      }
      return;
    }
    onTaskCreate?.(taskData);
  };
  const handleCallClick = () => {
    if (hasPhone) {
      setShowCallModal(true);
    } else {
      alert("No phone number available");
    }
  };

  const handleCallClose = () => {
    setShowCallModal(false);
  };

  /** Initiate call via CTI (same flow as Layout handleDial): device selection if multiple devices, else dialNumber */

  const handleMeetingClick = () => {
    if (activityModals) {
      activityModals.openMeeting();
      return;
    }
    setShowMeetingModal(true);
  };

  const handleMeetingClose = () => {
    setShowMeetingModal(false);
  };

  const handleMeetingSchedule = async (
    meetingData: {
      title: string;
      hostEmail: string;
      startDate: string;
      startTime: string;
      endTime: string;
      attendees: string[];
      location: string;
      reminders: string[];
      summary: string;
    },
    record?: {
      id: number;
      type: RECORD_TYPES;
    },
  ) => {
    if (record?.id == null || record?.type == null) {
      toast.error(
        "No record linked. Schedule the meeting from a prospect, lead, deal, or order.",
      );
      return;
    }
    const localDate = meetingData.startDate.slice(0, 10);
    const localStartTime =
      meetingData.startTime.length === 5
        ? meetingData.startTime
        : meetingData.startTime.slice(0, 5);
    const localEndTime =
      meetingData.endTime.length === 5
        ? meetingData.endTime
        : meetingData.endTime.slice(0, 5);
    const startUtc = convertLocalMeetingToUtc(localDate, localStartTime);
    const endUtc = convertLocalMeetingToUtc(localDate, localEndTime);
    const meeting_date = startUtc.utcDate;
    const meeting_time = startUtc.utcTime;
    const extensions = userExtension
      ? [userExtension].map((e) => String(e).slice(0, 15))
      : [meetingData.hostEmail?.slice(0, 15) || "0"];
    if (extensions.length === 0 || !extensions[0]) {
      toast.error("Extension is required to create a meeting.");
      return;
    }
    const start_date_time =
      startUtc.utcIso || `${meeting_date}T${meeting_time}:00Z`;
    const end_date_time =
      endUtc.utcIso || `${endUtc.utcDate}T${endUtc.utcTime}:00Z`;
    const recordType = record.type as CrmEntityType;
    try {
      await createMeeting({
        name: meetingData.title.trim(),
        meeting_type: "Video",
        meeting_date,
        meeting_time,
        record_type: recordType,
        record_id: record.id,
        extensions,
        ...(tenantId && { tenant_id: tenantId }),
        ...(userExtension && { extension_user: userExtension }),
        start_date_time,
        end_date_time,
        ...(meetingData.attendees?.length > 0 && {
          emails: meetingData.attendees,
          attendees: meetingData.attendees,
        }),
        ...(meetingData.reminders?.length > 0 && {
          reminders: meetingData.reminders,
        }),
        ...(meetingData.summary?.trim()
          ? { summary: meetingData.summary.trim().slice(0, 255) }
          : {}),
      });
      onMeetingSchedule?.(meetingData);
    } catch (err: unknown) {
      throw err;
    }
  };

  const handleWhatsAppClick = () => {
    if (activityModals) {
      activityModals.openWhatsApp();
      return;
    }
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppClose = () => {
    setShowWhatsAppModal(false);
  };

  const handleWhatsAppLog = async (whatsappData: {
    content_sid: string;
    content_variables: Record<string, string>;
  }) => {
    const rawNumber =
      phoneList?.[0] ||
      (typeof phone === "string" ? phone.trim() : "") ||
      "";
      const number = rawNumber.replaceAll(" ", "");
      if (!number) {
      toast.error("No phone number available for this record.");
      return;
    }
    try {
      await sendWhatsApp({
        number,
        content_sid: whatsappData.content_sid,
        content_variables:
          Object.keys(whatsappData.content_variables ?? {}).length > 0
            ? whatsappData.content_variables
            : undefined,
      });
      setShowWhatsAppModal(false);
      router.push(`/crm/inbox?phone=${encodeURIComponent(number)}`);
    } catch {
      // sendWhatsApp shows toast on error
    }
  };

  const handleSmsClick = () => {
    if (activityModals) {
      activityModals.openSms();
      return;
    }
    setShowSmsModal(true);
  };

  const handleSmsClose = () => {
    setShowSmsModal(false);
  };

  const handleSmsLog = async (smsData: {
    message: string;
    contacts: Array<{ id: string; name: string; email?: string }>;
    activityDate: string;
    createFollowUpTask: boolean;
    followUpTaskDueDate: string | null;
    followUpTaskDueTime: string | null;
    attachments: File[];
  }) => {
    const rawTo =
      phoneList?.[0] ||
      (typeof phone === "string" ? phone.trim() : "") ||
      "";
    const to = rawTo.replaceAll(" ", "");
    const body = smsData.message?.trim() || "";
    if (!to || !body) {
      if (!to) toast.error("No phone number available for this record.");
      if (!body) toast.error("Please enter a message.");
      return;
    }
    try {
      await sendSms({
        to,
        message: body,
        tenant_id: tenantId || "default",
        extension,
        ...(recordType && { record_type: recordType }),
        ...(recordId != null && { record_id: Number(recordId) }),
        ...followUpTaskFieldsToApiPayload({
          createFollowUpTask: smsData.createFollowUpTask,
          followUpTaskDueDate: smsData.followUpTaskDueDate,
          followUpTaskDueTime: smsData.followUpTaskDueTime,
        }),
      });
      setShowSmsModal(false);
      if (onSmsLog) onSmsLog(smsData);
    } catch {
      // sendSms already shows toast on error
    }
  };

  const handleMoreClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMoreModalPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowMoreModal(true);
  };

  const handleMoreClose = () => {
    setShowMoreModal(false);
  };

  const goToRecordDetailActivity = (activityType?: string) => {
    if (!recordType || recordId == null) return;

    const baseUrl = buildActivitiesBaseUrl(
      recordType,
      recordId,
      activityEntityType,
    );

    if (!baseUrl) return;

    let url = baseUrl;
    if (typeof activityType === "string" && activityType.trim()) {
      const separator = baseUrl.includes("?") ? "&" : "?";
      url = `${baseUrl}${separator}activityType=${encodeURIComponent(
        activityType,
      )}`;
    }

    router.push(url);
  };

  const handleMoreActionSelect = (actionId: string) => {
    if (actionId === "note") { handleNoteClick(); return; }
    if (actionId === "task") { handleTaskClick(); return; }

    // "Log a ___" actions: open the dedicated log-activity modal when the
    // host page provides the corresponding handler. Otherwise, fall back to
    // the legacy behaviour of navigating to the record detail activity tab
    // so existing pages keep working until they wire up the new modals.
    const logHandlerByAction: Record<string, (() => void) | undefined> = {
      "log-call": onLogCall,
      "log-email": onLogEmail,
      "log-sms": onLogSms,
      "log-whatsapp": onLogWhatsApp,
      "log-meeting": onLogMeeting,
    };
    const logHandler = logHandlerByAction[actionId];
    if (logHandler) {
      logHandler();
      return;
    }

    const activityTypeMap: Record<string, string> = {
      "log-call": "calls",
      "log-whatsapp": "whatsapp",
      "log-sms": "sms",
      "log-meeting": "meetings",
      "log-email": "emails",
    };
    const activityType = activityTypeMap[actionId];
    if (activityType) goToRecordDetailActivity(activityType);
  };

  // Process quick actions to override note and email actions if provided
  const processedQuickActions = quickActions
    ? quickActions.map((action) => {
        if (action.id === "note") {
          return {
            ...action,
            onClick: () => {
              handleNoteClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "email") {
          return {
            ...action,
            onClick: () => {
              handleEmailClick();
              action.onClick?.(); // Call the original onClick if provided
            },
            disabled: !hasEmail,
          };
        }
        if (action.id === "task") {
          return {
            ...action,
            onClick: () => {
              handleTaskClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "call") {
          return {
            ...action,
            onClick: () => {
              handleCallClick();
              action.onClick?.(); // Call the original onClick if provided
            },
            disabled: !hasPhone,
          };
        }
        if (action.id === "meeting") {
          return {
            ...action,
            onClick: () => {
              handleMeetingClick();
              action.onClick?.(); // Call the original onClick if provided
            },
          };
        }
        if (action.id === "whatsapp") {
          return {
            ...action,
            onClick: () => {
              handleWhatsAppClick();
              action.onClick?.();
            },
          };
        }
        if (action.id === "sms") {
          return {
            ...action,
            onClick: () => {
              handleSmsClick();
              action.onClick?.();
            },
          };
        }
        if (action.id === "more") {
          return {
            ...action,
            onClick: (e?: React.MouseEvent<HTMLButtonElement>) => {
              if (e) handleMoreClick(e);
              action.onClick?.();
            },
          };
        }
        return action;
      })
    : [
        {
          id: "call",
          label: "Call",
          icon: Phone,
          onClick: handleCallClick,
          disabled: !hasPhone,
        },
        {
          id: "whatsapp",
          label: "WhatsApp",
          icon: MessageCircle,
          onClick: handleWhatsAppClick,
          disabled: false,
        },
        {
          id: "sms",
          label: "SMS",
          icon: MessageSquare,
          onClick: handleSmsClick,
          disabled: false,
        },
        {
          id: "meeting",
          label: "Meeting",
          icon: Calendar,
          onClick: handleMeetingClick,
          disabled: false,
        },
        {
          id: "email",
          label: "Email",
          icon: Mail,
          onClick: handleEmailClick,
          disabled: !hasEmail,
        },
        {
          id: "more",
          label: "More",
          icon: MoreHorizontal,
          onClick: handleMoreClick,
          disabled: false,
        },
      ];

  // Humanize data key for display (e.g. "contact_owner" -> "Contact Owner")
  const humanizeDataKey = (key: string) =>
    key.replaceAll("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());

  // --- Recent Activities (audit trail) shared helpers ---
  type AuditTrailEntry = {
    id?: number;
    event?: string;
    description?: string | null;
    created_at?: string;
    changes?: Record<string, { old?: unknown; new?: unknown }>;
    user_extension?: string;
  };

  const getAuditTrailFromRecord = (
    rawData: Record<string, unknown> | null | undefined,
    rType: string | undefined,
  ): AuditTrailEntry[] => {
    if (!rawData) return [];
    const fromTop = rawData.audit_trail ?? rawData.audit_trails ?? undefined;
    const fromData =
      (rawData.data as Record<string, unknown> | undefined)?.audit_trail ??
      (rawData.data as Record<string, unknown> | undefined)?.audit_trails;
    const raw = fromTop ?? fromData;
    return Array.isArray(raw) ? (raw as AuditTrailEntry[]) : [];
  };

  const createResolveFieldVal = (
    rType: string | undefined,
    rawData: Record<string, unknown> | undefined,
    resolveUser: ((id: string) => string) | undefined,
  ): ((field: string, val: unknown) => string) => {
    const fmt = (v: unknown): string => {
      if (v == null) return "—";
      if (typeof v === "string") return v;
      if (
        typeof v === "number" ||
        typeof v === "boolean" ||
        typeof v === "bigint"
      ) {
        return String(v);
      }
      if (typeof v === "object") return JSON.stringify(v);
      if (typeof v === "symbol") return v.toString();
      if (typeof v === "function") return v.name || "[function]";
      return "—";
    };
    const record = (rawData?.data as Record<string, unknown>) ?? rawData ?? {};
    const campaign = record.campaign as
      | { id?: number; name?: string }
      | undefined;

    const USER_FIELDS = new Set([
      "assigned_to",
      "contact_owner",
      "user_extension",
    ]);
    const DATETIME_FIELDS = new Set([
      "start_date_time",
      "end_date_time",
      "meeting_start",
      "meeting_end",
    ]);
    const LOCALE_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    const formatUserField = (val: unknown): string => {
      const id =
        typeof val === "string" || typeof val === "number" ? String(val) : "";
      return resolveUser ? resolveUser(id) : fmt(val);
    };

    const formatCampaignField = (val: unknown): string | null => {
      if (
        campaign?.name &&
        val != null &&
        Number(val) === Number(campaign?.id)
      ) {
        return campaign.name;
      }
      return null;
    };

    const formatLocaleDateTime = (
      val: unknown,
      toIso?: (raw: string) => string,
    ): string => {
      if (typeof val !== "string" && typeof val !== "number") return fmt(val);
      try {
        const raw = String(val);
        const iso = toIso ? toIso(raw) : raw;
        return new Date(iso).toLocaleString("en-US", LOCALE_DATETIME_OPTS);
      } catch {
        return fmt(val);
      }
    };

    const ensureTzSuffix = (raw: string): string => {
      const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
      return hasTz ? raw : `${raw}Z`;
    };

    const formatMeetingDate = (val: unknown): string => {
      if (typeof val !== "string" && typeof val !== "number") return fmt(val);
      const dateStr = String(val).slice(0, 10);
      const timeStr = String(
        (record.meeting_time as string | undefined) ?? "00:00",
      ).slice(0, 5);
      return formatMeetingDateTimeLocal(dateStr, timeStr) || fmt(val);
    };

    const formatMeetingTime = (val: unknown): string => {
      if (typeof val !== "string" && typeof val !== "number") return fmt(val);
      const dateStr = String(
        (record.meeting_date as string | undefined) ?? "",
      ).slice(0, 10);
      const timeStr = String(val).slice(0, 5);
      if (!dateStr) return fmt(val);
      return formatMeetingDateTimeLocal(dateStr, timeStr) || fmt(val);
    };

    return (field: string, val: unknown): string => {
      if (USER_FIELDS.has(field) && resolveUser) return formatUserField(val);
      if (field === "campaign_id") {
        const name = formatCampaignField(val);
        if (name !== null) return name;
      }
      if (field === "scheduled_call_at" && val) return formatLocaleDateTime(val);
      if (DATETIME_FIELDS.has(field) && val) {
        return formatLocaleDateTime(val, ensureTzSuffix);
      }
      if (field === "meeting_date" && val) return formatMeetingDate(val);
      if (field === "meeting_time" && val) return formatMeetingTime(val);
      return fmt(val);
    };
  };

  const recentActivitiesState = getRecentActivitiesState({
    recordType,
    prospectLoading,
    prospectData,
    leadLoading,
    leadData,
    dealLoading,
    dealData,
    orderLoading,
    orderData,
    activityHistoryChainLoading,
    activityHistoryChain,
    activityEntityType,
  });

  const enhanceNotesSection = (section: any): any => {
    const updatedSection = {
      ...section,
      count: sidebarNotesList.length,
    };

    if (section.emptyState?.action) {
      return {
        ...updatedSection,
        emptyState: {
          ...section.emptyState,
          action: {
            ...section.emptyState.action,
            onClick: () => {
              handleNoteClick();
              section.emptyState?.action?.onClick?.();
            },
          },
        },
      };
    }

    return updatedSection;
  };

  const buildProspectAboutFields = (
    data: any,
    nestedData: any,
  ): SidebarField[] => {
    const formatDateTime = (value?: string) =>
      value
        ? new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }) +
          " " +
          new Date(value).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : undefined;

    const fields: SidebarField[] = [];

    if (data.name) {
      fields.push({
        label: "Name",
        value: data.name,
      });
    }

    if (nestedData.email) {
      fields.push({
        label: "Email",
        value: nestedData.email,
        type: "email",
        copyable: true,
      });
    }

    if (data.phone) {
      fields.push({
        label: "Phone",
        value: data.phone,
        type: "phone",
        copyable: true,
      });
    }

    if (data.scheduled_call_at) {
      const formatted = formatDateTime(data.scheduled_call_at);
      if (formatted) {
        fields.push({
          label: "Scheduled Call At",
          value: formatted,
          type: "datetime",
        });
      }
    }

    if (data.campaign?.name) {
      fields.push({
        label: "Campaign Name",
        value: data.campaign.name,
      });
    }

    if (data.company?.name) {
      fields.push({
        label: "Company Name",
        value: data.company.name,
      });
    }

    if (data.company_domain) {
      fields.push({
        label: "Company Domain",
        value: data.company_domain,
      });
    }

    if (Array.isArray(data.tags) && data.tags.length > 0) {
      fields.push({
        label: "Tags",
        value: data.tags.map((t: any) => t.name),
        type: "tags",
      });
    }

    const excludedKeys = new Set([
      "email",
      "assigned_to",
      "uploaded_by",
      "contact_owner",
    ]);

    Object.entries(nestedData).forEach(([key, value]) => {
      if (excludedKeys.has(key)) return;
      if (value === null || value === undefined || value === "") return;

      const label = key
        .replaceAll("_", " ")
        .replaceAll(/\b\w/g, (c) => c.toUpperCase());

      if (Array.isArray(value)) {
        if (value.length === 0) return;

        fields.push({
          label,
          value,
          type: "tags",
        });
      } else {
        let displayValue: string;
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          typeof value === "bigint"
        ) {
          displayValue = String(value);
        } else if (value && typeof value === "object") {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = "";
        }

        fields.push({
          label,
          value: displayValue,
        });
      }
    });

    return fields;
  };

  const enhanceAboutProspectSection = (section: any): any => {
    if (recordType !== "prospect" || !prospectData) {
      return { ...section };
    }

    const prospect = prospectData as any;
    const data = prospect.data ?? {};
    const nestedData = data.data ?? {};

    const fields = buildProspectAboutFields(data, nestedData);

    return {
      ...section,
      fields,
      isLoading: prospectLoading,
    };
  };

  // Process sections to override note-related actions and enrich "About this prospect" when we have API data
  const processedSections = sections.map((section) => {
    if (section.id === "notes") {
      return enhanceNotesSection(section);
    }

    if (section.id === "about-prospect") {
      return enhanceAboutProspectSection(section);
    }

    return section;
  });

  const isHtmlString = (value: unknown) => {
    if (typeof value !== "string") return false;
    // Basic check for HTML tags in the string
    return /<\/?[a-z][\s\S]*>/i.test(value);
  };

  const renderField = (field: SidebarField, index: number) => {
    if (field.show === false) return null;

    if (
      field.type === "tags" &&
      Array.isArray(field.value) &&
      field.value.length > 0
    ) {
      return (
        <div key={index} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            {field.label}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {field.value.map((tag: any, idx: number) => (
              <span
                key={typeof tag === "string" ? tag : (tag.name ?? idx)}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#eaf0f6",
                  color: "#141414",
                  borderRadius: "3px",
                  fontSize: "13px",
                  fontWeight: "400",
                }}
              >
                {typeof tag === "string" ? tag : tag.name}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === "badge") {
      return (
        <div key={index} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "#666",
              marginBottom: "8px",
            }}
          >
            {field.label}
          </div>
          <Badge
            bg={field.badgeVariant || "primary"}
            style={{
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "3px",
              fontWeight: "500",
            }}
          >
            {field.value}
          </Badge>
        </div>
      );
    }

    if (field.type === "color") {
      const raw = field.value;
      const hex =
        typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "#4680FF";
      return (
        <div key={index} style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: "400",
              color: "#666",
              marginBottom: "4px",
            }}
          >
            {field.label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                title={hex}
                aria-label={`Color ${hex}`}
                style={{
                  display: "inline-block",
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: hex,
                  border: "1px solid rgba(0,0,0,0.12)",
                  flexShrink: 0,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                flexShrink: 0,
              }}
            >
              {field.copyable ? (
                <button
                  type="button"
                  onClick={() => copyToClipboard(hex)}
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
                  title="Copy color"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f8fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Copy size={14} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    const isHtmlContent = isHtmlString(field.value);

    return (
      <div key={index} style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "400",
            color: "#666",
            marginBottom: "4px",
          }}
        >
          {field.label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
        {isHtmlContent ? (
          <div
            style={{
              fontSize: "14px",
              color: "#141414",
              fontWeight: "400",
              flex: 1,
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html: (field.value as string) || "--",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "14px",
              color: "#141414",
              fontWeight: "400",
              flex: 1,
              wordBreak: "break-word",
            }}
          >
            {field.value || "--"}
          </div>
        )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            {field.copyable && field.value && (
              <button
                onClick={() => copyToClipboard(field.value)}
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Copy size={14} />
              </button>
            )}
            {field.externalLink && (
              <a
                href={field.externalLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px",
                  cursor: "pointer",
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "3px",
                  textDecoration: "none",
                }}
                title="Open in new tab"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <ExternalLink size={14} />
              </a>
            )}
            {field.hasDetails && (
              <button
                onClick={field.onDetailsClick}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "2px 6px",
                  cursor: "pointer",
                  color: "#0091ae",
                  fontSize: "13px",
                  fontWeight: "400",
                  borderRadius: "3px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Details
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const EmptyIcon = section.emptyState?.icon;
    const isCollapsed = collapsedSections.has(section.id);
    const showActions = showSectionActions === section.id;
    let primaryContent: React.ReactNode | null = null;

    return (
      <div
        key={section.id}
        style={{
          backgroundColor: "#ffffff",
          overflow: "hidden",
          borderTop: "1px solid #d1d5db",
        }}
      >
        {/* Section Header */}
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            cursor: section.collapsible ? "pointer" : "default",
            backgroundColor: "#ffffff",
            borderBottom: isCollapsed ? "none" : "1px solid #eaf0f6",
            width: "100%",
            border: "none",
            outline: "none",
          }}
          role={section.collapsible ? "button" : undefined}
          tabIndex={section.collapsible ? 0 : undefined}
          onClick={() => section.collapsible && toggleSection(section.id)}
          onKeyDown={(e) => {
            if (!section.collapsible) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSection(section.id);
            }
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
            }}
          >
            {section.collapsible && (
              <ChevronDown
                size={18}
                style={{
                  color: "#141414",
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            )}
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#141414",
                margin: 0,
                lineHeight: "1.2",
              }}
            >
              {section.title}
            </h3>
            {section.count !== undefined && (
              <span
                style={{
                  fontSize: "13px",
                  color: "#7c98b6",
                  fontWeight: "400",
                }}
              >
                ({section.count})
              </span>
            )}
            {section.badge && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  backgroundColor:
                    section.badge.variant === "danger" ? "#ffe8ec" : "#e3f2fd",
                  borderRadius: "12px",
                }}
              >
                {section.badge.icon && (
                  <section.badge.icon
                    size={12}
                    style={{
                      color:
                        section.badge.variant === "danger"
                          ? "#f44336"
                          : "#2196f3",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color:
                      section.badge.variant === "danger"
                        ? "#f44336"
                        : "#2196f3",
                    textTransform: "uppercase",
                  }}
                >
                  {section.badge.value}
                </span>
              </div>
            )}
          </div>

          {/* Section Actions Dropdown */}
          {(section.actions?.length ?? 0) > 0 && (
            <div
              style={{ position: "relative" }}
              ref={(el) => {
                sectionDropdownRefs.current[section.id] = el;
            }}
          >
              <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSectionActions(showActions ? null : section.id);
              }}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px",
                  cursor: "pointer",
                  color: "#141414",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "3px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f8fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Actions
                <ChevronDown size={14} style={{ marginLeft: "4px" }} />
              </button>

              {showActions && (
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
                  {(section.actions ?? []).map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        action.onClick();
                        setShowSectionActions(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        backgroundColor: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontSize: "14px",
                        color: "#141414",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </button>

        {/* Section Content */}
        {!isCollapsed && (
          <div style={{ padding: "12px 16px" }}>
            {section.id === "notes" ? (
              (() => {
                if (sidebarNotesLoading) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px",
                        color: "#141414",
                      }}
                    >
                      <RefreshCw
                        size={16}
                        className="spin"
                        style={{ marginRight: "8px" }}
                      />
                      Loading...
                    </div>
                  );
                }

                if (sidebarNotesList.length > 0) {
                  return (
                    <div>
                      {sidebarNotesList.map((note) => {
                        const updatedAt = new Date(
                          note.updated_at,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return (
                          <div
                            key={note.id}
                            style={{
                              backgroundColor: "#fff",
                              border: "1px solid #eaf0f6",
                              borderRadius: "5px",
                              padding: "12px 16px",
                              marginBottom: "10px",
                            }}
                          >
                            {note.text?.includes("<") &&
                            note.text?.includes(">") ? (
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#141414",
                                  margin: "0 0 8px 0",
                                  lineHeight: "1.6",
                                }}
                                dangerouslySetInnerHTML={{ __html: note.text }}
                              />
                            ) : (
                              <p
                                style={{
                                  fontSize: "14px",
                                  color: "#141414",
                                  margin: "0 0 8px 0",
                                  lineHeight: "1.6",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {note.text}
                              </p>
                            )}
                            <span
                              style={{ fontSize: "12px", color: "#718096" }}
                            >
                              {updatedAt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (section.emptyState) {
                  return (
                    <div
                      style={{ padding: "24px 16px", textAlign: "center" }}
                    >
                      {EmptyIcon && (
                        <EmptyIcon
                          size={40}
                          style={{ color: "#cbd5e0", marginBottom: "12px" }}
                        />
                      )}
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#718096",
                          margin: 0,
                          lineHeight: "1.6",
                        }}
                      >
                        {section.emptyState.message}
                      </p>
                      {section.emptyState.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            section.emptyState?.action?.onClick();
                          }}
                          style={{
                            marginTop: "12px",
                            padding: "8px 16px",
                            backgroundColor: "#0066CC",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                          }}
                        >
                          {section.emptyState.action.label}
                        </button>
                      )}
                    </div>
                  );
                }

                return null;
              })()
            ) : (() => {
                if (section.id === "recent-activities" && recentActivitiesState) {
                  return (
                    <RecentActivitiesSection
                      recentActivitiesState={recentActivitiesState}
                      recordType={recordType}
                      recordId={recordId}
                      section={section}
                      EmptyIcon={EmptyIcon}
                      humanizeDataKey={humanizeDataKey}
                      resolveUserLabel={resolveUserLabel}
                      router={router}
                      getAuditTrailFromRecord={getAuditTrailFromRecord}
                      createResolveFieldVal={createResolveFieldVal}
                      buildAuditLinesForEntry={buildCrmAuditLinesForEntry}
                    />
                  );
                }

                if (section.id === "calls" || section.id === "call-recordings") {
                  return renderCallsSection({
                    section,
                    sidebarCallRecordingsLoading,
                    sidebarCallRecordings,
                    recordType,
                    recordId,
                    router,
                    EmptyIcon,
                    onPlayCallRecording,
                  });
                }

                return renderGenericSectionContent(
                  section,
                  EmptyIcon,
                  renderField,
                );
              })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from { 
              transform: translateX(20px);
              opacity: 0;
            }
            to { 
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideInUp {
            from { 
              transform: translateY(20px);
              opacity: 0;
            }
            to { 
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .spin {
            animation: spin 1s linear infinite;
          }
          
          .sidebar-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-track {
            background: #f7fafc;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }

          .quick-action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 7px 8px;
            background: #ffffff;
            border: 1px solid #8a8a8a;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 32px;
            height: 32px;
            position: relative;
          }

          .quick-action-btn:not(.disabled):hover {
            background-color: #f7fafc;
            border-color: #cbd5e0;
            transform: translateY(-2px);
          }

          .quick-action-btn.disabled {
            background-color: rgb(245, 245, 245);
            border-color: rgb(230, 230, 230);
            color: rgb(138, 138, 138);
            cursor: not-allowed;
          }

          .quick-action-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
          }

          .quick-action-label {
            font-size: 12px;
            color: #141414;
            font-weight: '500';
            white-space: nowrap;
            text-align: center;
          }

          .contact-info-link {
            color: '#0091ae';
            text-decoration: none;
            font-size: 14px;
            font-weight: 400;
          }

          .contact-info-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      {/* Notes / Email / Task / Meeting / SMS / WhatsApp modals */}
      {activityModals ? (
        <>{activityModals.modals}</>
      ) : (
        <>
          {/* Notes Modal - Rendered as floating window */}
          <NotesModal
            isOpen={showNotesModal}
            onClose={handleNoteClose}
            recordName={title}
            onSave={handleNoteSave}
          />

          {/* Email Modal - Rendered as floating window */}
          <EmailModal
            isOpen={showEmailModal}
            onClose={handleEmailClose}
            recipientEmail={emailList[0]}
            recipientName={title}
            senderEmail={senderEmail}
            senderName={senderName}
            contextPayload={emailContextPayload}
            onSend={(emailData) => handleEmailSend(emailData, record)}
          />

          {/* Task Modal - Rendered as floating window */}
          <TaskModal
            isOpen={showTaskModal}
            onClose={handleTaskClose}
            assignedTo={title}
            assignedToName={title}
            onSave={handleTaskSave}
          />
        </>
      )}

      {/* Call Modal - Rendered as floating dropdown */}
      <CallModal
        isOpen={showCallModal}
        onClose={handleCallClose}
        contactName={title}
        phoneNumbers={phoneList}
        company={company}
        callerNumber={callerNumber}
        onCall={handleCall}
      />

      <DeviceSelectionModal
        show={showDeviceSelectionModal}
        onHide={resetDeviceSelection}
        devices={availableDevices}
        onSelectDevice={handleDeviceSelect}
        extensionNumber={ctiUserAddress ?? ""}
        userAddress={ctiUserAddress}
      />

      {/* Meeting Modal - Rendered as floating window (shared component, same as prospects) */}
      {(() => {
        let attendeeEmail = "";
        if (Array.isArray(emailList)) {
          attendeeEmail = emailList[0];
        } else if (typeof emailList === "string") {
          attendeeEmail = emailList;
        }

        return activityModals ? null : (
          <MeetingModal
            isOpen={showMeetingModal}
            onClose={handleMeetingClose}
            hostEmail={session?.user?.email ?? ""}
            hostName={session?.user?.name ?? ""}
            attendeeEmail={attendeeEmail}
            attendeeName={title}
            recordType={record?.type}
            recordId={record?.id}
            onSchedule={(meetingData) =>
              handleMeetingSchedule(meetingData, record)
            }
          />
        );
      })()}

      {/* More Actions Modal */}
      <MoreActionsModal
        isOpen={showMoreModal}
        onClose={handleMoreClose}
        position={moreModalPosition}
        onActionSelect={handleMoreActionSelect}
      />

      <div
        className="generic-sidebar-new-container"
        style={dockedOuterStyle}
      >
        <div style={dockedBodyColumnStyle}>
          <div
            className="sidebar-scrollbar"
            style={{ ...dockedScrollBodyStyle, position: "relative", zIndex: 1 }}
          >
        {!hideTopHeadingBar && (
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#141414",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: "13px",
                      color: "#718096",
                      fontWeight: 400,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#718096",
                    transition: "all 0.2s",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#2d3748";
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#718096";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}
          {/* Contact & Actions Section */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "10px 16px",
              borderTop: "1px solid #d1d5db",
            }}
          >
            {/* Record Link and Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                borderBottom: "1px solid #d1d5db",
                marginBottom: "0px",
                marginLeft: "-24px",
                marginRight: "-24px",
                paddingLeft: "24px",
                paddingRight: "24px",
              }}
            >
              {recordLink && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    recordLink.onClick();
                  }}
                  style={{
                    fontSize: "14px",
                    color: "#006162",
                    textDecoration: "underline",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#007a8c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#0091ae";
                  }}
                >
                  {recordLink.label}
                </a>
              )}

              {(actionsDropdown || (hideTopHeadingBar && onClose)) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginLeft: "auto",
                }}
              >
              {actionsDropdown && (
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button
                    ref={actionsDropdownButtonRef}
                    onClick={() => {
                      const next = !showActionsDropdown;
                      setShowActionsDropdown(next);
                      if (next) {
                        setOpenActionsSubMenuIndex(null);
                        setActionsSubMenuSearch("");
                      }
                    }}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "transparent",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#141414",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {actionsDropdown.label}
                    <ChevronDown size={14} />
                  </button>

                  {showActionsDropdown &&
                    typeof document !== "undefined" &&
                    actionsMenuFixedStyle &&
                    createPortal(
                      <div
                        ref={actionsDropdownMenuPortalRef}
                        style={actionsMenuFixedStyle}
                      >
                      {actionsDropdown.items.map((item, index) => {
                        const hasSubItems =
                          "subItems" in item && !!item.subItems?.length;
                        const isSubMenuOpen = openActionsSubMenuIndex === index;
                        const searchLower =
                          actionsSubMenuSearch.trim().toLowerCase();
                        type ActionsSubItem = { label: string; value: string };
                        let filteredSubItems: ActionsSubItem[] = [];
                        if (hasSubItems) {
                          const subItems = (
                            item as { subItems: ActionsSubItem[] }
                          ).subItems;
                          if (isSubMenuOpen && searchLower) {
                            filteredSubItems = subItems.filter((sub) =>
                              sub.label.toLowerCase().includes(searchLower),
                            );
                          } else {
                            filteredSubItems = subItems;
                          }
                        }
                        return (
                          <div key={item.label} style={{ position: "relative" }}>
                            <button
                              onClick={() => {
                                if (hasSubItems) {
                                  setOpenActionsSubMenuIndex((prev) =>
                                    prev === index ? null : index,
                                  );
                                  if (openActionsSubMenuIndex !== index)
                                    setActionsSubMenuSearch("");
                                } else {
                                  if ("onClick" in item) item.onClick();
                                  setShowActionsDropdown(false);
                                  setOpenActionsSubMenuIndex(null);
                                }
                              }}
                              style={{
                                width: "100%",
                                padding: "10px 16px",
                                backgroundColor:
                                  isSubMenuOpen ? "#f7fafc" : "transparent",
                                border: "none",
                                textAlign: "left",
                                fontSize: "14px",
                                color: "#141414",
                                cursor: "pointer",
                                transition: "background-color 0.2s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={(e) => {
                                if (!hasSubItems)
                                  e.currentTarget.style.backgroundColor =
                                    "#f7fafc";
                              }}
                              onMouseLeave={(e) => {
                                if (!hasSubItems)
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                              }}
                            >
                              {item.label}
                              {hasSubItems && (
                                <ChevronDown
                                  size={14}
                                  style={{
                                    transform: isSubMenuOpen
                                      ? "rotate(180deg)"
                                      : "none",
                                  }}
                                />
                              )}
                            </button>
                            {hasSubItems && isSubMenuOpen && (
                              <div
                                style={{
                                  backgroundColor: "#f8fafc",
                                  borderTop: "1px solid #e2e8f0",
                                  maxHeight: "280px",
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <input
                                  type="text"
                                  placeholder="Search owner..."
                                  value={actionsSubMenuSearch}
                                  onChange={(e) =>
                                    setActionsSubMenuSearch(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    margin: "8px",
                                    padding: "6px 10px",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    outline: "none",
                                  }}
                                />
                                <div
                                  style={{
                                    maxHeight: "220px",
                                    overflowY: "auto",
                                  }}
                                >
                                  {filteredSubItems.length === 0 ? (
                                    <div
                                      style={{
                                        padding: "12px 16px 12px 24px",
                                        fontSize: "14px",
                                        color: "#64748b",
                                      }}
                                    >
                                      No matching owner
                                    </div>
                                  ) : (
                                    filteredSubItems.map((sub) => (
                                      <button
                                        key={`${sub.value}-${sub.label}`}
                                        onClick={() => {
                                          item.onSubItemSelect(sub.value);
                                          setShowActionsDropdown(false);
                                          setOpenActionsSubMenuIndex(null);
                                          setActionsSubMenuSearch("");
                                        }}
                                        style={{
                                          width: "100%",
                                          padding: "8px 16px 8px 24px",
                                          backgroundColor: "transparent",
                                          border: "none",
                                          textAlign: "left",
                                          fontSize: "14px",
                                          color: "#141414",
                                          cursor: "pointer",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor =
                                            "#e2e8f0";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor =
                                            "transparent";
                                        }}
                                      >
                                        {sub.label}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>,
                      document.body,
                    )}
                </div>
              )}
              {hideTopHeadingBar && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#718096",
                    transition: "all 0.2s",
                    borderRadius: "4px",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#2d3748";
                    e.currentTarget.style.backgroundColor = "#f7fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#718096";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
              </div>
              )}
            </div>

            {/* Permission Message */}
            {permissionMessage && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "5px",
                  fontSize: "13px",
                  color: "#92400e",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                {permissionMessage}
              </div>
            )}

            {/* Avatar and Name Section */}
            <div style={{ marginBottom: "8px", paddingTop: "12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                {avatar && (
                  <div
                    style={{
                      width: "40px",
                      height: "37px",
                      borderRadius: "26px",
                      background: avatar.gradient || "#efe7f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "400",
                      color: "#ffffff",
                      flexShrink: 0,
                      backgroundImage: avatar.imageUrl
                        ? `url(${avatar.imageUrl})`
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!avatar.imageUrl &&
                      (avatar.initials ||
                        avatar.name.substring(0, 2).toUpperCase())}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h1
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#141414",
                      margin: "0 0 4px 0",
                      lineHeight: "1.3",
                    }}
                  >
                    {title}
                  </h1>
                </div>
              </div>

              {/* Emails - multiple records */}
              {emailList.length > 0 &&
                emailList.map((em, idx) => (
                  <div
                    key={`email-${idx}-${em}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <a
                      href={`mailto:${em}`}
                      style={{
                        fontSize: "14px",
                        color: "#0091ae",
                        textDecoration: "none",
                        fontWeight: "400",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      {em}
                    </a>
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => copyToClipboard(em)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          color: "#718096",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                        }}
                        title="Copy email"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <a
                        href={`mailto:${em}`}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: "4px",
                          cursor: "pointer",
                          color: "#718096",
                          display: "flex",
                          alignItems: "center",
                          borderRadius: "3px",
                          textDecoration: "none",
                        }}
                        title="Send email"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f7fafc";
                          e.currentTarget.style.color = "#2d3748";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#718096";
                        }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}

              {/* Phones - multiple records */}
              {phoneList.length > 0 &&
                phoneList.map((ph, idx) => (
                  <div
                    key={`phone-${idx}-${ph}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#141414",
                          fontWeight: "400",
                          marginBottom: "1px",
                        }}
                      >
                        {phoneList.length > 1
                          ? `Phone ${idx + 1}`
                          : "Phone Number"}
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#141414",
                          fontWeight: "400",
                        }}
                      >
                        {ph}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(ph)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px",
                        cursor: "pointer",
                        color: "#718096",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "3px",
                      }}
                      title="Copy phone"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f7fafc";
                        e.currentTarget.style.color = "#2d3748";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#718096";
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              {phoneList.length > 0 && <div style={{ marginBottom: "16px" }} />}
            </div>

            {/* Quick Actions */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                paddingTop: "5px",
                flexWrap: "wrap",
              }}
            >
              {processedQuickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <div key={action.id} className="quick-action-wrapper">
                    <button
                      ref={action.id === "more" ? moreButtonRef : undefined}
                      onClick={(e) => {
                        if (!action.disabled) {
                          action.onClick(e);
                          onQuickActionClick?.(action.id);
                        }
                      }}
                      className={`quick-action-btn ${action.disabled ? "disabled" : ""}`}
                      title={action.label}
                      disabled={action.disabled}
                    >
                      <ActionIcon
                        size={16}
                        color={action.disabled ? "#cbd5e0" : "#718096"}
                      />
                    </button>
                    <span className="quick-action-label">{action.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Record summary (from API crm_summary) */}
          {recordSummary && (
            <div
              style={{
                backgroundColor: "#ffffff",
                overflow: "hidden",
                borderTop: "1px solid #d1d5db",
              }}
            >
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  cursor: "pointer",
                  backgroundColor: "#ffffff",
                  width: "100%",
                  border: "none",
                  outline: "none",
                }}
                tabIndex={0}
                onClick={() => toggleSection("breeze-summary")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleSection("breeze-summary");
                  }
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <ChevronDown
                    size={18}
                    style={{
                      color: "#141414",
                      transform: collapsedSections.has("breeze-summary")
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#141414",
                      margin: 0,
                      lineHeight: "1.2",
                    }}
                  >
                    Record summary
                  </h3>
                  <div
                    style={{
                      padding: "3px 10px",
                      background:
                        "linear-gradient(114deg, rgb(255, 56, 66) 0%, rgb(210, 6, 136) 100%)",
                      color: "white",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "600",
                      textTransform: "uppercase",
                    }}
                  >
                    AI
                  </div>
                </div>
              </button>

              {!collapsedSections.has("breeze-summary") && (
                <div
                  style={{
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #ff9fcc",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                  {(recordSummary.timestamp || recordSummary.onRefresh) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#718096",
                        marginBottom: "8px",
                      }}
                    >
                      {recordSummary.timestamp && (
                        <span>{recordSummary.timestamp}</span>
                      )}
                      {recordSummary.onRefresh && (
                        <button
                          onClick={recordSummary.onRefresh}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "2px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Refresh"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: "14px",
                      color: recordSummary.content ? "#141414" : "#718096",
                      lineHeight: "1.6",
                      marginBottom: "16px",
                      border: "none",
                      padding: recordSummary.content ? "8px 0" : "0",
                      borderRadius: "5px",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      minWidth: 0,
                    }}
                  >
                    {recordSummary.content || "No summary available."}
                  </div>

                  {recordSummary.content && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          paddingTop: "8px",
                          borderTop: "1px solid #fee",
                        }}
                      >
                        <button
                          onClick={() => recordSummary.onThumbsUp?.()}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "3px",
                          }}
                          title="Good summary"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f7fafc";
                            e.currentTarget.style.color = "#2d3748";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#718096";
                          }}
                        >
                          <ThumbsUp size={16} />
                        </button>
                        <button
                          onClick={() => recordSummary.onThumbsDown?.()}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "3px",
                          }}
                          title="Bad summary"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f7fafc";
                            e.currentTarget.style.color = "#2d3748";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#718096";
                          }}
                        >
                          <ThumbsDown size={16} />
                        </button>
                        <button
                          onClick={() => recordSummary.onCopy?.()}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "6px",
                            cursor: "pointer",
                            color: "#141414",
                            display: "flex",
                            alignItems: "center",
                            borderRadius: "3px",
                          }}
                          title="Copy"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f7fafc";
                            e.currentTarget.style.color = "#2d3748";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#718096";
                          }}
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => recordSummary.onAskQuestion?.()}
                        style={{
                          marginTop: "8px",
                          width: "36%",
                          padding: "6px 0",
                          backgroundColor: "transparent",
                          border: "1px solid #d20688",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "500",
                          color: "#d20688",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fff5f7";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <Sparkles size={16} />
                        Ask a question
                      </button>
                    </>
                  )}
                  </div>
              </div>
              )}
            </div>
          )}

          {/* Sections */}
          {processedSections.map((section) => renderSection(section))}
        </div>
        </div>
      </div>

      {/* WhatsApp / SMS Modals (fallback when shared CRM activity modals are not available) */}
      {!activityModals && (
        <>
          {/* WhatsApp Message Modal */}
          <WhatsAppMessageModal
            isOpen={showWhatsAppModal}
            onClose={handleWhatsAppClose}
            associatedRecords={title ? [title] : []}
            onSave={handleWhatsAppLog}
          />

          {/* SMS Message Modal */}
          <LogSmsModal
            isOpen={showSmsModal}
            onClose={handleSmsClose}
            associatedRecords={title ? [title] : []}
            onSave={handleSmsLog}
          />
        </>
      )}
    </>
  );
};

export default GenericSidebar;
