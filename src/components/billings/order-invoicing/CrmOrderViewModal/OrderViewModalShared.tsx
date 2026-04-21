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

