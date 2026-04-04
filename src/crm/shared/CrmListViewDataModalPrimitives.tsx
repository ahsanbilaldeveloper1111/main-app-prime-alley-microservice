import React from "react";

export const CRM_LIST_VIEW_MODAL_INFO_CARD_BASE_STYLE: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  padding: "20px",
  borderRadius: "12px",
  transition: "all 0.3s ease",
};

export const crmListViewModalCardHoverLift = {
  onMouseOver: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow = "0 8px 16px rgba(102, 126, 234, 0.15)";
  },
  onMouseOut: (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  },
};

export function CrmListViewModalIconBox({
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

export function CrmListViewModalSectionLabel({
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

export function CrmListViewModalFieldValue({
  children,
}: {
  children: React.ReactNode;
}) {
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

export const CRM_LIST_VIEW_MODAL_SECTION_HEADING_STYLE: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: 700,
  color: "#1f2937",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

export function CrmListViewModalSectionDot({ gradient }: { gradient: string }) {
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

export const CRM_LIST_VIEW_MODAL_SECTION_BOX_STYLE: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "20px",
};

export function CrmListViewModalContentSection({
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
      <h5 style={CRM_LIST_VIEW_MODAL_SECTION_HEADING_STYLE}>
        <CrmListViewModalSectionDot gradient={gradient} />
        {title}
        {badge}
      </h5>
      <div style={{ ...CRM_LIST_VIEW_MODAL_SECTION_BOX_STYLE, ...boxStyle }}>
        {children}
      </div>
    </div>
  );
}

export function CrmListViewModalDetailRow({
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

export const CRM_LIST_VIEW_MODAL_RECORDING_TH_STYLE: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export const CRM_LIST_VIEW_MODAL_PANEL_HEADING_STYLE: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "14px",
};

export const CRM_LIST_VIEW_MODAL_QUICK_ACTION_BUTTON_STYLE: React.CSSProperties =
  {
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

export const crmListViewModalQuickActionHover = {
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

export function CrmListViewModalIconButton({
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
      type="button"
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
