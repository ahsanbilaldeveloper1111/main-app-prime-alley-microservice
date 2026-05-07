import React from "react";
import { Card, Col } from "react-bootstrap";

export function crmInsightsCx(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function CrmInsightsLoadingSpinner(props: Readonly<{ height: number | string }>) {
  const h = typeof props.height === "number" ? `${props.height}px` : props.height;
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: h }}>
      <div className="spinner-border spinner-border-sm">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export function CrmInsightsReportPanel(props: Readonly<{
  title: string;
  children: React.ReactNode;
  wrapStyle?: React.CSSProperties;
}>) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "8px",
        padding: "20px",
        border: "1px solid #e5e7eb",
        ...props.wrapStyle,
      }}
    >
      <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
        {props.title}
      </h6>
      {props.children}
    </div>
  );
}

type BootstrapColProps = React.ComponentProps<typeof Col>;

export function CrmInsightsResponsiveKpiSlot(props: Readonly<{
  desktopCol: BootstrapColProps;
  mobileCol: BootstrapColProps;
  renderContent: () => React.ReactNode;
}>) {
  const { desktopCol, mobileCol, renderContent } = props;
  const { className: dc, children: _ignoreD, ...dRest } = desktopCol;
  const { className: mc, children: _ignoreM, ...mRest } = mobileCol;
  return (
    <>
      <Col {...dRest} className={crmInsightsCx(dc, "d-none d-lg-block")}>{renderContent()}</Col>
      <Col {...mRest} className={crmInsightsCx(mc, "d-lg-none")}>{renderContent()}</Col>
    </>
  );
}

export type CrmInsightsKpiCardProps = Readonly<{
  iconColor: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  footer?: React.ReactNode;
}>;

export function CrmInsightsKpiCard({
  iconColor,
  icon,
  label,
  value,
  footer,
}: CrmInsightsKpiCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <div className="d-flex align-items-end justify-content-between mb-3">
          <div style={{ color: iconColor }}>{icon}</div>
          <div className="text-end">
            <p
              className="text-muted text-uppercase small mb-1"
              style={{ fontSize: "0.75rem", fontWeight: 500 }}
            >
              {label}
            </p>
          </div>
        </div>
        <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
          {value}
        </h2>
        <div
          className="d-flex align-items-center justify-content-end mt-2"
          style={footer === undefined ? { minHeight: "20px" } : undefined}
        >
          {footer}
        </div>
      </Card.Body>
    </Card>
  );
}
