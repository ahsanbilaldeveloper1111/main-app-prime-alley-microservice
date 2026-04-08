import React, { ReactElement, ReactNode } from "react";
import { Form } from "react-bootstrap";

const previewGrayLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const previewGrayValueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: 500,
  wordBreak: "break-word",
};

/** Muted label + value pair used across lead preview grids (reduces JSX duplication). */
export function CrmLeadPreviewGrayField({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <div>
      <div style={previewGrayLabelStyle}>{label}</div>
      <div style={previewGrayValueStyle}>{children}</div>
    </div>
  );
}

const quickStatHoverHandlers = {
  onMouseOver: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 8px 16px rgba(37, 99, 235, 0.15)";
  },
  onMouseOut: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  },
};

const quickStatShellStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "20px",
  borderRadius: "12px",
  transition: "all 0.3s ease",
};

export function CrmLeadQuickStatHoverShell({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div style={quickStatShellStyle} {...quickStatHoverHandlers}>
      {children}
    </div>
  );
}

type ExtensionLike = { id?: unknown; extension?: unknown; display_name?: string; name?: string };

/** Single lookup for assigned-user labels (removes duplicate find/display_name/name chains). */
export function resolveCrmExtensionDisplayName(
  extensions: ReadonlyArray<ExtensionLike> | undefined,
  userExtension: unknown,
  fallback = "Not assigned",
): string {
  const ext = extensions?.find(
    (e) => e?.id == userExtension || e?.extension == userExtension,
  );
  const rawExtLabel =
    ext?.display_name ||
    ext?.name ||
    (typeof userExtension === "string" ||
    typeof userExtension === "number" ||
    typeof userExtension === "boolean" ||
    typeof userExtension === "bigint"
      ? String(userExtension)
      : "");
  return rawExtLabel || fallback;
}

const SECTION_TITLE_BAR_BASE: React.CSSProperties = {
  width: "4px",
  height: "18px",
  borderRadius: "2px",
};

const SECTION_TITLE_ACCENT: Record<"default" | "danger", string> = {
  default: "linear-gradient(135deg, #2563eb 0%, #0284c7 100%)",
  danger: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
};

const SECTION_TITLE_HEADING_STYLE: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

/** Section heading with gradient accent bar (lead detail modal). */
export function CrmLeadViewSectionTitle({
  children,
  accent = "default",
}: Readonly<{
  children: ReactNode;
  accent?: keyof typeof SECTION_TITLE_ACCENT;
}>) {
  return (
    <h5 style={SECTION_TITLE_HEADING_STYLE}>
      <div
        style={{
          ...SECTION_TITLE_BAR_BASE,
          background: SECTION_TITLE_ACCENT[accent],
        }}
      />
      {children}
    </h5>
  );
}

const TAB_ACTIVE = { bg: "#2563eb" as const, fg: "#ffffff" as const };
const TAB_INACTIVE = { bg: "#ffffff" as const, fg: "#2563eb" as const };

/** Two-state tab control for lead detail modal (removes duplicated button+style blocks). */
export function CrmLeadViewDetailTabButton({
  active,
  onClick,
  icon,
  label,
}: Readonly<{
  active: boolean;
  onClick: () => void;
  icon: ReactElement;
  label: string;
}>) {
  const colors = active ? TAB_ACTIVE : TAB_INACTIVE;
  return (
    <button
      type="button"
      className={`lead-detail-filter-button ${active ? "active" : ""}`}
      onClick={onClick}
      style={{
        backgroundColor: colors.bg,
        borderColor: "#2563eb",
        color: colors.fg,
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const QUICK_STAT_ICON_WRAP: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const QUICK_STAT_LABEL_BASE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: "4px",
};

const QUICK_STAT_VALUE: React.CSSProperties = {
  fontSize: "15px",
  color: "#1f2937",
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** Assigned / potential / stage row inside the lead view quick-stats grid. */
export function CrmLeadViewQuickStatCard({
  accentColor,
  labelColor,
  label,
  icon,
  children,
}: Readonly<{
  accentColor: string;
  /** When set, label uses this color (icon wrap still uses accentColor). */
  labelColor?: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}>) {
  const labelTint = labelColor ?? accentColor;
  return (
    <CrmLeadQuickStatHoverShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            ...QUICK_STAT_ICON_WRAP,
            background: accentColor,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...QUICK_STAT_LABEL_BASE,
              color: labelTint,
            }}
          >
            {label}
          </div>
          <div style={QUICK_STAT_VALUE}>{children}</div>
        </div>
      </div>
    </CrmLeadQuickStatHoverShell>
  );
}

export function crmMeetingOutcomeToBadgeBg(
  outcome: string | null | undefined,
): "success" | "info" | "danger" | "warning" | "secondary" {
  switch (outcome) {
    case "Completed - Successful":
      return "success";
    case "Completed - Needs Follow-up":
      return "info";
    case "Cancelled":
      return "danger";
    case "Rescheduled":
      return "warning";
    default:
      return "secondary";
  }
}

export function crmMeetingTimelineDotFill(outcome: string | undefined): string {
  if (outcome === "Completed - Successful") return "#10b981";
  if (outcome === "Cancelled") return "#dc3545";
  return "#2563eb";
}

export type CrmLeadCampaignCustomField = {
  field_key: string;
  field_name: string;
  field_type: string;
  required?: boolean;
  dropdown_options?: string[];
};

/** Renders the appropriate control for one campaign custom field in the lead edit flow. */
export function CrmLeadEditCampaignFieldControl({
  field,
  values,
  onFieldChange,
}: Readonly<{
  field: CrmLeadCampaignCustomField;
  values: Record<string, unknown> | undefined;
  onFieldChange: (fieldKey: string, value: string) => void;
}>) {
  const raw = values?.[field.field_key];
  const value =
    raw === undefined || raw === null
      ? ""
      : typeof raw === "string" ||
          typeof raw === "number" ||
          typeof raw === "boolean" ||
          typeof raw === "bigint"
        ? String(raw)
        : "";
  const placeholder = `Enter ${field.field_name.toLowerCase()}`;

  switch (field.field_type) {
    case "string":
      return (
        <Form.Control
          type="text"
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          placeholder={placeholder}
          required={field.required}
        />
      );
    case "email":
      return (
        <Form.Control
          type="email"
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          placeholder={placeholder}
          required={field.required}
        />
      );
    case "text":
      return (
        <Form.Control
          as="textarea"
          rows={3}
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          placeholder={placeholder}
          required={field.required}
        />
      );
    case "integer":
      return (
        <Form.Control
          type="number"
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          placeholder={placeholder}
          required={field.required}
        />
      );
    case "date":
      return (
        <Form.Control
          type="date"
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          required={field.required}
        />
      );
    case "dropdown":
      return (
        <Form.Select
          value={value}
          onChange={(e) => onFieldChange(field.field_key, e.target.value)}
          required={field.required}
        >
          <option value="">Select {field.field_name}</option>
          {field.dropdown_options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      );
    default:
      return null;
  }
}
