import React from "react";
import type { LucideIcon } from "lucide-react";
import { User, AlertTriangle } from "lucide-react";

const labelMuted: React.CSSProperties = { fontSize: "13px", color: "#6b7280" };
const valueEmphasis: React.CSSProperties = { fontSize: "14px", color: "#1f2937", fontWeight: "500" };

export function SidebarLabeledField({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div>
      <span style={labelMuted}>{label}</span>
      <div style={valueEmphasis}>{children}</div>
    </div>
  );
}

export function SidebarContactRow({
  icon: Icon,
  children,
}: Readonly<{ icon: LucideIcon; children: React.ReactNode }>) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Icon size={16} color="#6b7280" />
      <span style={{ fontSize: "14px", color: "#6b7280" }}>{children}</span>
    </div>
  );
}

export const sidebarToolbarIconButtonStyle: React.CSSProperties = {
  padding: "6px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  backgroundColor: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function SidebarToolbarIconButton({
  icon: Icon,
  onClick,
  ariaLabel,
  backgroundColor = "white",
}: Readonly<{
  icon: LucideIcon;
  onClick?: () => void;
  ariaLabel?: string;
  backgroundColor?: string;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ ...sidebarToolbarIconButtonStyle, backgroundColor }}
    >
      <Icon size={16} color="#6b7280" />
    </button>
  );
}

const narrativeTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#1f2937",
  marginBottom: "2px",
};
const narrativeSubtitleStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#6b7280",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function SidebarNarrativeListRow({
  title,
  subtitle,
  trailing,
  variant,
}: Readonly<{
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  variant: "activity" | "risk";
}>) {
  const isRisk = variant === "risk";
  const defaultBg = isRisk ? "#fef2f2" : "#f9fafb";
  const hoverBg = isRisk ? "#fee2e2" : "#f3f4f6";
  const avatarBg = isRisk ? "#fecaca" : "#e0e7ff";
  const IconComponent = isRisk ? AlertTriangle : User;
  const iconColor = isRisk ? "#dc2626" : "#6366f1";
  const iconSize = 18;
  const baseButtonStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    padding: "12px",
    backgroundColor: defaultBg,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    width: "100%",
    textAlign: "left",
  };
  if (isRisk) {
    baseButtonStyle.borderLeft = "3px solid #ef4444";
  }

  return (
    <button
      type="button"
      style={baseButtonStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = defaultBg;
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          backgroundColor: avatarBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <IconComponent size={iconSize} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={narrativeTitleStyle}>{title}</div>
        <div style={narrativeSubtitleStyle}>{subtitle}</div>
      </div>
      {trailing ? (
        <div
          style={{
            fontSize: "12px",
            color: "#9ca3af",
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {trailing}
        </div>
      ) : null}
    </button>
  );
}
