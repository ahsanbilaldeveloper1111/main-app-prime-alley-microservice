import React from "react";
import { Badge } from "react-bootstrap";

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#1f2937",
  fontWeight: 500,
  wordBreak: "break-word",
};

export function OrderViewSection(props: {
  readonly title: string;
  readonly children: React.ReactNode;
  readonly badgeCount?: number;
}): React.ReactElement {
  const { title, children, badgeCount } = props;
  return (
    <div style={{ marginBottom: "28px" }}>
      <h5
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#1f2937",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "18px",
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "2px",
          }}
        />
        {title}
        {typeof badgeCount === "number" ? (
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
            {badgeCount}
          </Badge>
        ) : null}
      </h5>
      {children}
    </div>
  );
}

export function OrderViewCard(props: {
  readonly children: React.ReactNode;
  readonly tone?: "default" | "warning";
}): React.ReactElement {
  const { children, tone = "default" } = props;
  if (tone === "warning") {
    return (
      <div
        style={{
          background: "#fffbeb",
          border: "1px solid #fcd34d",
          borderRadius: "12px",
          padding: "16px 20px",
          fontSize: "14px",
          color: "#78350f",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      {children}
    </div>
  );
}

export function OrderViewGrid(props: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px 24px",
      }}
    >
      {props.children}
    </div>
  );
}

export function OrderViewField(props: {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly fullWidth?: boolean;
}): React.ReactElement {
  const { label, value, fullWidth = false } = props;
  return (
    <div style={fullWidth ? { gridColumn: "1 / -1" } : undefined}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  );
}

const quickInfoCardShell: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "20px",
  borderRadius: "12px",
  transition: "all 0.3s ease",
};

export function OrderViewQuickInfoCard(props: {
  readonly iconBackground: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly labelColor?: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  const labelColor = props.labelColor ?? "#6b7280";
  return (
    <div style={quickInfoCardShell} className="order-view-quick-info-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: props.iconBackground,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {props.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: labelColor,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: "4px",
            }}
          >
            {props.label}
          </div>
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
            {props.value}
          </div>
        </div>
      </div>
    </div>
  );
}

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px 1fr",
  gap: "16px",
};

export function OrderViewDetailGrid(props: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <div style={detailGridStyle}>{props.children}</div>;
}

export function OrderViewDetailRow(props: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
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
        {props.icon}
        {props.label}
      </div>
      <div
        style={{
          color: "#1f2937",
          fontSize: "15px",
          fontWeight: 500,
        }}
      >
        {props.value}
      </div>
    </>
  );
}

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "14px",
};

const sidebarCardShell: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "16px",
};

export function OrderViewSidebarTitle(props: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <h6 style={sidebarTitleStyle}>{props.children}</h6>;
}

export function OrderViewSidebarCard(props: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <div style={sidebarCardShell}>{props.children}</div>;
}

const sidebarRowLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  fontWeight: 500,
};

export function OrderViewSidebarRow(props: {
  readonly label: string;
  readonly right: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={sidebarRowLabel}>{props.label}</span>
      <div style={{ minWidth: 0, textAlign: "right" }}>{props.right}</div>
    </div>
  );
}

export function OrderViewSidebarValueText(props: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 600 }}>
      {props.children}
    </span>
  );
}

export function OrderViewSummaryField(props: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#6b7280",
          fontWeight: 600,
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {props.label}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "#1f2937",
          fontWeight: 500,
        }}
      >
        {props.value}
      </div>
    </div>
  );
}

export function OrderViewStageBadge(props: {
  readonly stage?: { color?: string; name?: string } | null;
  readonly variant?: "panel" | "field";
  readonly fallbackLabel?: string;
}): React.ReactElement {
  const { stage, variant = "panel", fallbackLabel = "N/A" } = props;
  const base: React.CSSProperties = {
    backgroundColor: stage?.color || "#6c757d",
    fontWeight: 600,
  };
  const variantStyle: React.CSSProperties =
    variant === "field"
      ? {
          ...base,
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "12px",
        }
      : {
          ...base,
          fontSize: "11px",
          padding: "4px 10px",
          borderRadius: "6px",
        };
  return (
    <Badge style={variantStyle}>{stage?.name || fallbackLabel}</Badge>
  );
}

