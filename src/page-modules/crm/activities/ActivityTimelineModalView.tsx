import React, { useMemo } from "react";
import { Modal, Button, Badge, Spinner } from "react-bootstrap";
import {
  X,
  Users,
  Target,
  ShoppingBag,
  Clock,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import type {
  HistoryChainRecord,
  CrmDataItem,
} from "@utils/crm";
import { stripTrailingParenthetical } from "@utils/displayName";
import {
  computeAgentInitials,
  getActivityStageLabel,
  getActivityTimelineIconData,
} from "./activityHelpers";

interface ActivityRecordLike {
  id?: number;
  record_id?: string | number;
  customer?: string;
  agent?: string;
  type?: string;
}

interface ExtensionLike {
  id?: unknown;
  extension?: unknown;
  display_name?: string;
  name?: string;
}

interface StageDescriptor {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const STAGE_DESCRIPTORS: readonly StageDescriptor[] = [
  { name: "Prospect", icon: <Users size={20} />, color: "#9c27b0" },
  { name: "Lead", icon: <Target size={20} />, color: "#2196f3" },
  { name: "Deal", icon: <TrendingUp size={20} />, color: "#ff9800" },
  { name: "Order", icon: <ShoppingBag size={20} />, color: "#4caf50" },
];

const HEADER_WRAPPER_STYLE: React.CSSProperties = {
  background: "#fff",
  color: "black",
  padding: "24px 32px",
  position: "relative",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  borderBottom: "1px solid #ccc",
};

const HEADER_CLOSE_BTN_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "black",
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const HEADER_AVATAR_STYLE: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "16px",
  background: "#8b5cf6",
  backdropFilter: "blur(10px)",
  border: "2px solid rgba(255,255,255,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "700",
  flexShrink: 0,
  color: "#fff",
};

const MODAL_BODY_STYLE: React.CSSProperties = {
  padding: 0,
  maxHeight: "calc(90vh - 200px)",
  overflowY: "auto",
};

const CONTENT_GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  minHeight: "500px",
};

const LEFT_PANEL_STYLE: React.CSSProperties = {
  padding: "32px",
  borderRight: "1px solid #e5e7eb",
};

const RIGHT_PANEL_STYLE: React.CSSProperties = {
  padding: "32px 24px",
  background: "#fafbfc",
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const SECTION_DIVIDER_STYLE: React.CSSProperties = {
  width: "4px",
  height: "18px",
  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  borderRadius: "2px",
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const PROGRESS_TRACK_STYLE: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "10%",
  right: "10%",
  height: "4px",
  backgroundColor: "#e3e8ef",
  borderRadius: "4px",
  transform: "translateY(-50%)",
  zIndex: 0,
};

const TIMELINE_LINE_STYLE: React.CSSProperties = {
  position: "absolute",
  left: "30px",
  top: "0",
  bottom: "20px",
  width: "3px",
  background: "linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%)",
  borderRadius: "3px",
  opacity: 0.2,
};

const INFO_CARD_STYLE: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
};

const INFO_LABEL_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 500,
};

const INFO_VALUE_STYLE: React.CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: 600,
};

const INFO_VALUE_SMALL_STYLE: React.CSSProperties = {
  fontSize: "13px",
  color: "#1f2937",
  fontWeight: 500,
};

const INFO_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "14px",
};

const STAGE_CONTAINER_STYLE: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "40px 20px",
  position: "relative",
};

const TIMELINE_CONTAINER_STYLE: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

const SPINNER_BLOCK_STYLE: React.CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
};

function StageProgressCircle({
  stage,
  isCompleted,
  isCurrent,
}: {
  readonly stage: StageDescriptor;
  readonly isCompleted: boolean;
  readonly isCurrent: boolean;
}) {
  const size = isCurrent ? "56px" : "48px";
  const background = isCompleted || isCurrent ? stage.color : "#fff";
  const borderColor = isCompleted ? stage.color : "#dee2e6";
  const border = isCurrent
    ? `3px solid ${stage.color}`
    : `2px solid ${borderColor}`;
  const fgColor = isCompleted || isCurrent ? "#fff" : "#6c757d";
  const labelColor = isCompleted || isCurrent ? stage.color : "#6c757d";
  const boxShadow = (() => {
    if (isCurrent) return `0 8px 24px ${stage.color}40`;
    if (isCompleted) return `0 4px 12px ${stage.color}30`;
    return "none";
  })();
  const transform = isCurrent ? "scale(1.1)" : "scale(1)";
  const icon = isCompleted ? <CheckCircle size={isCurrent ? 24 : 20} /> : stage.icon;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
          background,
          border,
          color: fgColor,
          boxShadow,
          transition: "all 0.3s ease",
          transform,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: isCurrent ? "0.9rem" : "0.8rem",
          fontWeight: isCurrent ? 700 : 600,
          color: labelColor,
          transition: "all 0.3s ease",
        }}
      >
        {stage.name}
      </div>
      {isCurrent && (
        <div
          style={{
            marginTop: "8px",
            padding: "4px 8px",
            borderRadius: "6px",
            backgroundColor: `${stage.color}15`,
            color: stage.color,
            fontSize: "0.7rem",
            fontWeight: 600,
          }}
        >
          Current
        </div>
      )}
    </div>
  );
}

function StageProgressSection({
  currentStageIndex,
  loadingHistory,
}: {
  readonly currentStageIndex: number;
  readonly loadingHistory: boolean;
}) {
  const filledWidth =
    currentStageIndex > 0 ? `${(currentStageIndex / 3) * 80}%` : "0%";

  if (loadingHistory) {
    return (
      <div style={SPINNER_BLOCK_STYLE}>
        <Spinner
          animation="border"
          variant="primary"
          size="sm"
          style={{ marginBottom: "12px" }}
        />
        <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>
          Loading stages...
        </p>
      </div>
    );
  }

  return (
    <div style={STAGE_CONTAINER_STYLE}>
      <div style={PROGRESS_TRACK_STYLE} />
      <div
        className="timeline-progress-bar"
        style={{
          position: "absolute",
          top: "50%",
          left: "10%",
          width: filledWidth,
          height: "4px",
          background: "linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)",
          borderRadius: "4px",
          transform: "translateY(-50%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {STAGE_DESCRIPTORS.map((stage, idx) => (
          <StageProgressCircle
            key={stage.name}
            stage={stage}
            isCompleted={idx < currentStageIndex}
            isCurrent={idx === currentStageIndex}
          />
        ))}
      </div>
    </div>
  );
}

function resolveUserName(
  extension: string | null,
  extensions: readonly ExtensionLike[],
): string {
  if (!extension) return "System";
  const match = extensions.find(
    (ext) => ext?.id == extension || ext?.extension == extension,
  );
  return match?.display_name || match?.name || extension;
}

function formatTimelineDateParts(rawDate: string): {
  dateStr: string;
  timeStr: string;
} {
  const dateObj = new Date(rawDate);
  const dateStr = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { dateStr, timeStr };
}

function ActivityTimelineEntry({
  record,
  isLast,
  extensions,
  recordKey,
}: {
  readonly record: HistoryChainRecord;
  readonly isLast: boolean;
  readonly extensions: readonly ExtensionLike[];
  readonly recordKey: string;
}) {
  const { dateStr, timeStr } = formatTimelineDateParts(record.created_at);
  const userExtension =
    record.user_extension_done_by || record.user_extension;
  const rawUserName = resolveUserName(userExtension, extensions);
  const cleanUserName = stripTrailingParenthetical(String(rawUserName));
  const iconData = getActivityTimelineIconData(record.event, record.action);
  const description =
    record.description || record.action_display || "Activity recorded";
  const timestampLabel = record.created_at_human || dateStr;

  return (
    <div
      key={recordKey}
      style={{
        position: "relative",
        marginBottom: isLast ? "0" : "24px",
      }}
    >
      <div
        style={{
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          left: "-56px",
          top: "0",
          background: iconData.bg,
          border: "4px solid #fff",
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          color: "#fff",
        }}
      >
        {iconData.icon}
      </div>
      <div
        style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderLeft: `3px solid ${iconData.bg}`,
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "8px",
          }}
        >
          <div
            style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937" }}
          >
            {description}
          </div>
          <Badge
            bg="light"
            text="dark"
            style={{
              marginLeft: "8px",
              fontSize: "11px",
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
            }}
          >
            {timestampLabel}
          </Badge>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          <Users size={14} />
          <span>{cleanUserName}</span>
          <span>•</span>
          <Clock size={14} />
          <span>{timeStr}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityTimelineSection({
  loadingHistory,
  historyChain,
  extensions,
}: {
  readonly loadingHistory: boolean;
  readonly historyChain: readonly HistoryChainRecord[];
  readonly extensions: readonly ExtensionLike[];
}) {
  if (loadingHistory) {
    return (
      <div style={SPINNER_BLOCK_STYLE}>
        <Spinner
          animation="border"
          variant="primary"
          size="sm"
          style={{ marginBottom: "12px" }}
        />
        <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>
          Loading activity timeline...
        </p>
      </div>
    );
  }

  if (historyChain.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          background: "#f9fafb",
          border: "2px dashed #d1d5db",
          borderRadius: "12px",
        }}
      >
        <Clock size={40} style={{ marginBottom: "12px", opacity: 0.5 }} />
        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          No activity history available
        </div>
      </div>
    );
  }

  return (
    <div style={TIMELINE_CONTAINER_STYLE}>
      <div style={{ position: "relative", paddingLeft: "56px" }}>
        <div style={TIMELINE_LINE_STYLE} />
        {historyChain.map((record, index) => (
          <ActivityTimelineEntry
            key={`${record.id}-${record.created_at}`}
            recordKey={`${record.id}-${record.created_at}`}
            record={record}
            isLast={index === historyChain.length - 1}
            extensions={extensions}
          />
        ))}
      </div>
    </div>
  );
}

function CustomerInfoSection({
  loadingCrmData,
  crmData,
  fallbackCustomer,
}: {
  readonly loadingCrmData: boolean;
  readonly crmData: CrmDataItem | null;
  readonly fallbackCustomer: string | undefined;
}) {
  return (
    <div>
      <h6 style={SECTION_HEADER_STYLE}>Customer Information</h6>
      <div style={INFO_CARD_STYLE}>
        {loadingCrmData ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={INFO_ROW_STYLE}>
              <span style={INFO_LABEL_STYLE}>Name</span>
              <span style={INFO_VALUE_STYLE}>
                {crmData?.name || fallbackCustomer || "N/A"}
              </span>
            </div>
            <div style={INFO_ROW_STYLE}>
              <span style={INFO_LABEL_STYLE}>Phone</span>
              <span style={INFO_VALUE_SMALL_STYLE}>
                {crmData?.phone || "N/A"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentInfoSection({
  agentName,
}: {
  readonly agentName: string | undefined;
}) {
  const initials = computeAgentInitials(agentName);
  return (
    <div>
      <h6 style={SECTION_HEADER_STYLE}>Agent Information</h6>
      <div style={INFO_CARD_STYLE}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#1f2937",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {agentName || "N/A"}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Assigned Agent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StageSummarySection({
  currentStageIndex,
  historyChainLength,
}: {
  readonly currentStageIndex: number;
  readonly historyChainLength: number;
}) {
  return (
    <div>
      <h6 style={SECTION_HEADER_STYLE}>Stage Summary</h6>
      <div style={INFO_CARD_STYLE}>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={INFO_ROW_STYLE}>
            <span style={INFO_LABEL_STYLE}>Current Stage</span>
            <Badge
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
                backgroundColor: "#8b5cf6",
              }}
            >
              {getActivityStageLabel(currentStageIndex)}
            </Badge>
          </div>
          <div style={INFO_ROW_STYLE}>
            <span style={INFO_LABEL_STYLE}>Progress</span>
            <span style={INFO_VALUE_STYLE}>{currentStageIndex + 1} / 4</span>
          </div>
          <div style={INFO_ROW_STYLE}>
            <span style={INFO_LABEL_STYLE}>Activities</span>
            <span style={INFO_VALUE_STYLE}>{historyChainLength}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityTimelineModalHeader({
  customer,
  agent,
  currentStageIndex,
  onClose,
}: {
  readonly customer: string | undefined;
  readonly agent: string | undefined;
  readonly currentStageIndex: number;
  readonly onClose: () => void;
}) {
  const initial = customer ? customer.charAt(0).toUpperCase() : "A";
  return (
    <div style={HEADER_WRAPPER_STYLE}>
      <button
        type="button"
        onClick={onClose}
        style={HEADER_CLOSE_BTN_STYLE}
        aria-label="Close activity timeline"
      >
        <X size={18} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={HEADER_AVATAR_STYLE}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "26px",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {customer}
          </h2>
          <div
            style={{
              marginTop: "6px",
              opacity: 0.95,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              color: "#000",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Users size={14} />
              Assigned to {agent}
            </span>
            <span>•</span>
            <span>{getActivityStageLabel(currentStageIndex)} Stage</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActivityTimelineModalViewProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly record: ActivityRecordLike | null;
  readonly currentStageIndex: number;
  readonly loadingHistory: boolean;
  readonly loadingCrmData: boolean;
  readonly historyChain: readonly HistoryChainRecord[];
  readonly crmData: CrmDataItem | null;
  readonly extensions: readonly ExtensionLike[];
}

export function ActivityTimelineModalView({
  show,
  onClose,
  record,
  currentStageIndex,
  loadingHistory,
  loadingCrmData,
  historyChain,
  crmData,
  extensions,
}: ActivityTimelineModalViewProps) {
  const safeHistoryChain = useMemo(() => historyChain ?? [], [historyChain]);
  if (!record) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="xl"
      centered
      className="activity-timeline-modal"
    >
      <ActivityTimelineModalHeader
        customer={record.customer}
        agent={record.agent}
        currentStageIndex={currentStageIndex}
        onClose={onClose}
      />
      <Modal.Body style={MODAL_BODY_STYLE}>
        <div style={CONTENT_GRID_STYLE}>
          <div style={LEFT_PANEL_STYLE}>
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h5 style={SECTION_TITLE_STYLE}>
                  <div style={SECTION_DIVIDER_STYLE} />
                  Stage Progress
                </h5>
                <Badge
                  bg="primary"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: "#8b5cf6",
                  }}
                >
                  {getActivityStageLabel(currentStageIndex)}
                </Badge>
              </div>
              <StageProgressSection
                currentStageIndex={currentStageIndex}
                loadingHistory={loadingHistory}
              />
            </div>
            <div style={{ marginBottom: "28px" }}>
              <h5
                style={{
                  ...SECTION_TITLE_STYLE,
                  marginBottom: "16px",
                }}
              >
                <div style={SECTION_DIVIDER_STYLE} />
                Activity Timeline
                {!loadingHistory && safeHistoryChain.length > 0 && (
                  <Badge
                    bg="secondary"
                    style={{
                      marginLeft: "8px",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    {safeHistoryChain.length}
                  </Badge>
                )}
              </h5>
              <ActivityTimelineSection
                loadingHistory={loadingHistory}
                historyChain={safeHistoryChain}
                extensions={extensions}
              />
            </div>
          </div>
          <div style={RIGHT_PANEL_STYLE}>
            <CustomerInfoSection
              loadingCrmData={loadingCrmData}
              crmData={crmData}
              fallbackCustomer={record.customer}
            />
            <AgentInfoSection agentName={record.agent} />
            <StageSummarySection
              currentStageIndex={currentStageIndex}
              historyChainLength={safeHistoryChain.length}
            />
          </div>
        </div>
      </Modal.Body>
      <div
        style={{
          padding: "20px 32px",
          borderTop: "1px solid #e5e7eb",
          background: "white",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button
          variant="outline-secondary"
          onClick={onClose}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            border: "2px solid #e5e7eb",
            transition: "all 0.2s ease",
          }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}
