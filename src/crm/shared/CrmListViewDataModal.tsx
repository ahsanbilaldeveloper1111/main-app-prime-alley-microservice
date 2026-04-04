import React from "react";
import { Modal, Badge, Spinner, Button } from "react-bootstrap";
import {
  Phone as PhoneIcon,
  Mail,
  User,
  History,
  Calendar,
  Target,
  Download,
  X,
  Clock as ClockIcon,
} from "lucide-react";
import { FiPlay } from "react-icons/fi";
import moment from "moment";
import {
  formatDuration,
  formatDateTimeToLocal,
  GlobalDateFormat,
  GlobalTimeFormat,
} from "@utils/Helper";
import CircularProgressCircle from "@components/CircularProgressCircle";
import type { CrmDataItem } from "@utils/crm";

export interface CrmListViewDataModalProps {
  show: boolean;
  onHide: () => void;
  selectedDataItem: CrmDataItem | null;
  extensions: any[];
  availableCampaigns: Array<{ value: string; label: string; id: number }>;
  callRecordings?: any[];
  callRecordingsLoading?: boolean;
  callRecordingsTotal?: number;
  downloadingRecordings?: Set<string>;
  downloadProgress?: Record<string, number>;
  onPlayCallRecording?: (recording: any) => void;
  onDownloadCallRecording?: (recording: any) => void;
}

const EMPTY_SET = new Set<string>();
const EMPTY_PROGRESS: Record<string, number> = {};
const noop = () => {};

export function CrmListViewDataModal({
  show,
  onHide,
  selectedDataItem,
  extensions,
  availableCampaigns,
  callRecordings = [],
  callRecordingsLoading = false,
  callRecordingsTotal = 0,
  downloadingRecordings = EMPTY_SET,
  downloadProgress = EMPTY_PROGRESS,
  onPlayCallRecording = noop,
  onDownloadCallRecording = noop,
}: CrmListViewDataModalProps) {
  if (!selectedDataItem) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="prospect-view-modal"
    >
      {/* Modern Header */}
      <div
        style={{
          background: "#fff",
          color: "black",
          padding: "24px 32px",
          position: "relative",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid #ccc",
        }}
      >
        <button
          onClick={onHide}
          style={{
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
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.15)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#2563eb",
              backdropFilter: "blur(10px)",
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "700",
              flexShrink: 0,
              color: "#fff",
            }}
          >
            {selectedDataItem.name
              ? selectedDataItem.name.charAt(0).toUpperCase()
              : "P"}
          </div>
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
              {selectedDataItem.name ||
                `Prospect #${selectedDataItem.id}`}
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
                <PhoneIcon size={14} />
                {selectedDataItem.phone || "No phone"}
              </span>
              <span>&bull;</span>
              <span>
                Added{" "}
                {selectedDataItem.created_at
                  ? moment(selectedDataItem.created_at).format("MMM DD, YYYY")
                  : "N/A"}
              </span>
              {selectedDataItem.is_viewed && (
                <>
                  <span>&bull;</span>
                  <Badge
                    bg="light"
                    text="dark"
                    style={{
                      background: "rgba(255,255,255,0.25)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "white",
                      fontWeight: 500,
                    }}
                  >
                    Viewed
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal.Body
        style={{
          padding: 0,
          maxHeight: "calc(90vh - 200px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            minHeight: "500px",
          }}
        >
          {/* Left Panel */}
          <div style={{ padding: "32px", borderRight: "1px solid #e5e7eb" }}>
            <QuickInfoCards
              selectedDataItem={selectedDataItem}
              extensions={extensions}
              availableCampaigns={availableCampaigns}
            />
            <ContactDetailsSection selectedDataItem={selectedDataItem} />
            {selectedDataItem?.note && (
              <CallNotesSection note={selectedDataItem.note} />
            )}
            {selectedDataItem.data &&
              Object.keys(selectedDataItem.data).length > 0 && (
                <CustomDataFieldsSection data={selectedDataItem.data} />
              )}
            <CallRecordingsSection
              callRecordings={callRecordings}
              callRecordingsLoading={callRecordingsLoading}
              callRecordingsTotal={callRecordingsTotal}
              downloadingRecordings={downloadingRecordings}
              downloadProgress={downloadProgress}
              onPlayCallRecording={onPlayCallRecording}
              onDownloadCallRecording={onDownloadCallRecording}
            />
          </div>

          {/* Right Panel */}
          <RightPanel
            selectedDataItem={selectedDataItem}
            callRecordings={callRecordings}
          />
        </div>
      </Modal.Body>

      {/* Footer */}
      <div
        style={{
          padding: "20px 32px",
          borderTop: "1px solid #e5e7eb",
          background: "white",
          borderBottomLeftRadius: "12px",
          borderBottomRightRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "13px", color: "#6b7280" }}>
          Prospect ID: <strong>#{selectedDataItem.id}</strong>
        </div>
        <Button
          variant="outline-secondary"
          onClick={onHide}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            border: "2px solid #e5e7eb",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "#2563eb";
            e.currentTarget.style.color = "#2563eb";
            e.currentTarget.style.background = "#eff6ff";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#6c757d";
            e.currentTarget.style.background = "white";
          }}
        >
          Close
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- Sub-components ---------- */

const INFO_CARD_BASE_STYLE: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "20px",
  borderRadius: "12px",
  transition: "all 0.3s ease",
};

const hoverLift = {
  onMouseOver: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.15)";
  },
  onMouseOut: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  },
};

function QuickInfoCards({
  selectedDataItem,
  extensions,
  availableCampaigns,
}: {
  selectedDataItem: CrmDataItem;
  extensions: any[];
  availableCampaigns: Array<{ value: string; label: string; id: number }>;
}) {
  const agentLabel = selectedDataItem.user_extension
    ? extensions.find(
        (ext: any) =>
          ext.id.toString() === selectedDataItem.user_extension?.toString(),
      )?.display_name || selectedDataItem.user_extension
    : "Unassigned";

  const campaignLabel =
    availableCampaigns.find(
      (c) => c.value === selectedDataItem.campaign_id?.toString(),
    )?.label || "No Campaign";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "16px",
        marginBottom: "28px",
      }}
    >
      <div style={INFO_CARD_BASE_STYLE} {...hoverLift}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconBox color="#2563eb">
            <User size={20} style={{ color: "white" }} />
          </IconBox>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel color="#2563eb">Assigned Agent</SectionLabel>
            <FieldValue>{agentLabel}</FieldValue>
          </div>
        </div>
      </div>

      <div
        style={{ ...INFO_CARD_BASE_STYLE, border: "1px solid #f093fb30" }}
        {...hoverLift}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <IconBox color="#0284c7">
            <Target size={20} style={{ color: "white" }} />
          </IconBox>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel color="#f5576c">Campaign</SectionLabel>
            <FieldValue>{campaignLabel}</FieldValue>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconBox({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 700,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        marginBottom: "4px",
      }}
    >
      {children}
    </div>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "15px",
        color: "#1f2937",
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

const SECTION_HEADING_STYLE: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

function SectionDot({ gradient }: { gradient: string }) {
  return (
    <div
      style={{
        width: "4px",
        height: "18px",
        background: gradient,
        borderRadius: "2px",
      }}
    />
  );
}

const SECTION_BOX_STYLE: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

function ContentSection({
  title,
  gradient = "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
  marginBottom = "28px",
  boxStyle,
  badge,
  children,
}: {
  title: string;
  gradient?: string;
  marginBottom?: string;
  boxStyle?: React.CSSProperties;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom }}>
      <h5 style={SECTION_HEADING_STYLE}>
        <SectionDot gradient={gradient} />
        {title}
        {badge}
      </h5>
      <div style={{ ...SECTION_BOX_STYLE, ...boxStyle }}>{children}</div>
    </div>
  );
}

function ContactDetailsSection({
  selectedDataItem,
}: {
  selectedDataItem: CrmDataItem;
}) {
  return (
    <ContentSection
      title="Contact Details"
      gradient="linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "140px 1fr",
          gap: "16px",
        }}
      >
        <DetailRow
          icon={<PhoneIcon size={16} style={{ color: "#2563eb" }} />}
          label="Phone"
          value={selectedDataItem.phone || "N/A"}
        />
        <DetailRow
          icon={<Calendar size={16} style={{ color: "#2563eb" }} />}
          label="Created"
          value={
            selectedDataItem.created_at
              ? moment(selectedDataItem.created_at).format(
                  "MMMM DD, YYYY [at] hh:mm A",
                )
              : "N/A"
          }
        />
      </div>
    </ContentSection>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </div>
      <div style={{ color: "#1f2937", fontSize: "15px", fontWeight: 500 }}>
        {value}
      </div>
    </>
  );
}

function CallNotesSection({ note }: { note: string }) {
  return (
    <ContentSection
      title="Call Notes"
      boxStyle={{
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        padding: "16px 20px",
        fontSize: "14px",
        color: "#78350f",
        lineHeight: "1.6",
      }}
    >
      {note}
    </ContentSection>
  );
}

function CustomDataFieldsSection({ data }: { data: Record<string, any> }) {
  return (
    <ContentSection title="Additional Information">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px 24px",
          }}
        >
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                {key
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#1f2937",
                  fontWeight: 500,
                  wordBreak: "break-word",
                }}
              >
                {value !== null && value !== undefined
                  ? typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)
                  : "N/A"}
              </div>
            </div>
          ))}
        </div>
    </ContentSection>
  );
}

const RECORDING_TH_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

function CallRecordingsSection({
  callRecordings,
  callRecordingsLoading,
  callRecordingsTotal,
  downloadingRecordings,
  downloadProgress,
  onPlayCallRecording,
  onDownloadCallRecording,
}: {
  callRecordings: any[];
  callRecordingsLoading: boolean;
  callRecordingsTotal: number;
  downloadingRecordings: Set<string>;
  downloadProgress: Record<string, number>;
  onPlayCallRecording: (recording: any) => void;
  onDownloadCallRecording: (recording: any) => void;
}) {
  const badge = (
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
      {callRecordingsTotal > 0 ? callRecordingsTotal : callRecordings.length}
    </Badge>
  );

  return (
    <ContentSection
      title="Call Recordings"
      marginBottom="20px"
      badge={badge}
      boxStyle={{ padding: 0, background: "transparent", border: "none" }}
    >
      {callRecordingsLoading ? (
        <div
          style={{
            padding: "48px 20px",
            background: "#f9fafb",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <Spinner
            animation="border"
            variant="primary"
            size="sm"
            style={{ marginBottom: "12px" }}
          />
          <p className="mb-0" style={{ color: "#6b7280", fontSize: "14px" }}>
            Loading recordings...
          </p>
        </div>
      ) : callRecordings.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            background: "#f9fafb",
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <History
            size={40}
            style={{ color: "#9ca3af", marginBottom: "12px" }}
          />
          <p
            className="mb-0"
            style={{ color: "#6b7280", fontSize: "14px", fontWeight: 500 }}
          >
            No call recordings found
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <th style={RECORDING_TH_STYLE}>Date &amp; Time</th>
                  <th style={RECORDING_TH_STYLE}>Extension</th>
                  <th style={RECORDING_TH_STYLE}>Direction</th>
                  <th style={RECORDING_TH_STYLE}>Duration</th>
                  <th
                    style={{
                      ...RECORDING_TH_STYLE,
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {callRecordings.map((recording: any, index: number) => (
                  <RecordingRow
                    key={recording.Id || index}
                    recording={recording}
                    isDownloading={downloadingRecordings.has(recording.Id)}
                    progress={downloadProgress[recording.Id] || 0}
                    onPlay={onPlayCallRecording}
                    onDownload={onDownloadCallRecording}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ContentSection>
  );
}

function RecordingRow({
  recording,
  isDownloading,
  progress,
  onPlay,
  onDownload,
}: {
  recording: any;
  isDownloading: boolean;
  progress: number;
  onPlay: (r: any) => void;
  onDownload: (r: any) => void;
}) {
  const duration =
    parseInt(recording.Duration?.toString() || "0") / 10000000 || 0;
  const isOutgoing = recording.Direction === "CALL_OUTGOING";

  return (
    <tr
      style={{
        borderBottom: "1px solid #f3f4f6",
        transition: "background 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "#f9fafb";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "white";
      }}
    >
      <td style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: "13px", color: "#1f2937", fontWeight: 500 }}>
          {formatDateTimeToLocal(recording.DateTime, GlobalDateFormat)}
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
          {formatDateTimeToLocal(
            recording.DateTime,
            GlobalTimeFormat,
            "YYYY-MM-DD HH:mm:ss.SSSSSSS",
          )}
        </div>
      </td>
      <td
        style={{
          padding: "14px 16px",
          fontSize: "13px",
          color: "#1f2937",
          fontWeight: 500,
        }}
      >
        {recording.AgentExtension || "N/A"}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            background: isOutgoing ? "#dbeafe" : "#d1fae5",
            color: isOutgoing ? "#1e40af" : "#065f46",
          }}
        >
          {isOutgoing ? "Outgoing" : "Incoming"}
        </span>
      </td>
      <td
        style={{
          padding: "14px 16px",
          fontSize: "13px",
          color: "#1f2937",
          fontWeight: 500,
        }}
      >
        {formatDuration(duration)}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton title="Play Recording" onClick={() => onPlay(recording)}>
            <FiPlay size={16} />
          </IconButton>
          {isDownloading ? (
            <CircularProgressCircle
              progress={progress}
              size="small"
              color="#28a745"
              backgroundColor="#e9ecef"
              textColor="#495057"
              showPercentage={false}
              className="circular-progress-inline"
            />
          ) : (
            <IconButton
              title="Download Recording"
              onClick={() => onDownload(recording)}
            >
              <Download size={16} />
            </IconButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      style={{
        background: "transparent",
        border: "none",
        color: "#2563eb",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "6px",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title={title}
      onClick={onClick}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "#ede9fe";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function RightPanel({
  selectedDataItem,
  callRecordings,
}: {
  selectedDataItem: CrmDataItem;
  callRecordings: any[];
}) {
  return (
    <div
      style={{
        padding: "32px 24px",
        background: "#fafbfc",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <QuickActionsPanel />

      <StatusOverviewPanel
        selectedDataItem={selectedDataItem}
        callRecordingsCount={callRecordings.length}
      />

      <ActivityTimelinePanel callRecordings={callRecordings} />
    </div>
  );
}

const PANEL_HEADING_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "14px",
};

const QUICK_ACTION_BUTTON_STYLE: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "12px 16px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#1f2937",
};

const quickActionHover = {
  onMouseOver: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = "#2563eb";
    e.currentTarget.style.background = "#eff6ff";
    e.currentTarget.style.transform = "translateX(4px)";
  },
  onMouseOut: (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = "#e5e7eb";
    e.currentTarget.style.background = "white";
    e.currentTarget.style.transform = "translateX(0)";
  },
};

function QuickActionsPanel() {
  return (
    <div>
      <h6 style={PANEL_HEADING_STYLE}>Quick Actions</h6>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button style={QUICK_ACTION_BUTTON_STYLE} {...quickActionHover}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PhoneIcon size={16} style={{ color: "white" }} />
          </div>
          Call Prospect
        </button>

        <button style={QUICK_ACTION_BUTTON_STYLE} {...quickActionHover}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background:
                "linear-gradient(135deg, #2563eb 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Mail size={16} style={{ color: "white" }} />
          </div>
          Send Message
        </button>
      </div>
    </div>
  );
}

function StatusOverviewPanel({
  selectedDataItem,
  callRecordingsCount,
}: {
  selectedDataItem: CrmDataItem;
  callRecordingsCount: number;
}) {
  return (
    <div>
      <h6 style={PANEL_HEADING_STYLE}>Status Overview</h6>
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <StatusRow label="Status">
            <Badge
              bg={selectedDataItem.is_viewed ? "success" : "primary"}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              {selectedDataItem.is_viewed ? "Viewed" : "New"}
            </Badge>
          </StatusRow>

          <StatusRow label="Total Calls">
            <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
              {callRecordingsCount}
            </span>
          </StatusRow>

          {selectedDataItem.scheduled_call_at && (
            <div
              style={{
                marginTop: "8px",
                paddingTop: "14px",
                borderTop: "1px solid #f3f4f6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <Calendar size={14} style={{ color: "#2563eb" }} />
                <span
                  style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}
                >
                  Scheduled Call
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#1f2937",
                  fontWeight: 500,
                  marginLeft: "22px",
                }}
              >
                {moment(selectedDataItem.scheduled_call_at).format(
                  "MMM DD, YYYY [at] hh:mm A",
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function ActivityTimelinePanel({
  callRecordings,
}: {
  callRecordings: any[];
}) {
  return (
    <div style={{ flex: 1 }}>
      <h6 style={PANEL_HEADING_STYLE}>Recent Activity</h6>
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "16px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {callRecordings.length > 0 ? (
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "7px",
                top: "8px",
                bottom: "8px",
                width: "2px",
                background: "#e5e7eb",
              }}
            />
            {callRecordings.slice(0, 5).map((recording: any, index: number) => {
              const isOutgoing = recording.Direction === "CALL_OUTGOING";
              return (
                <div
                  key={recording.Id || index}
                  style={{
                    position: "relative",
                    paddingLeft: "28px",
                    paddingBottom:
                      index < Math.min(callRecordings.length, 5) - 1
                        ? "16px"
                        : "0",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "0",
                      top: "4px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: isOutgoing ? "#2563eb" : "#10b981",
                      border: "3px solid white",
                      boxShadow: "0 0 0 1px #e5e7eb",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#1f2937",
                        fontWeight: 600,
                        marginBottom: "4px",
                      }}
                    >
                      {isOutgoing ? "Outgoing Call" : "Incoming Call"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                      {moment(recording.DateTime).format("MMM DD, hh:mm A")}
                    </div>
                  </div>
                </div>
              );
            })}
            {callRecordings.length > 5 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <span
                  style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600 }}
                >
                  +{callRecordings.length - 5} more activities
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#9ca3af",
            }}
          >
            <ClockIcon
              size={32}
              style={{ marginBottom: "8px", opacity: 0.5 }}
            />
            <div style={{ fontSize: "13px" }}>No activity yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
