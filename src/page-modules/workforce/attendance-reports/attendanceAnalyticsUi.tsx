import React from "react";
import { Card } from "react-bootstrap";

export function AttendanceAnalyticsStatCard(
  props: Readonly<{
    title: string;
    value: string;
    icon: React.ReactNode;
    accent: string;
  }>,
) {
  const { title, value, icon, accent } = props;
  return (
    <Card className="attendance-analytics-stat-card h-100 border-0 shadow-sm">
      <Card.Body className="d-flex flex-column gap-2">
        <div
          className="attendance-analytics-stat-card__icon d-inline-flex align-items-center justify-content-center rounded-3"
          style={{
            width: 40,
            height: 40,
            backgroundColor: `${accent}18`,
            color: accent,
          }}
          aria-hidden
        >
          {icon}
        </div>
        <div className="text-muted small text-uppercase fw-semibold">{title}</div>
        <div className="fs-4 fw-semibold text-dark lh-sm">{value}</div>
      </Card.Body>
    </Card>
  );
}

export function AttendanceAnalyticsChartCard(
  props: Readonly<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    fillHeight?: boolean;
    className?: string;
  }>,
) {
  const { title, subtitle, children, fillHeight = true, className } = props;
  const cardClassName = [
    "attendance-analytics-chart-card",
    "border-0",
    "shadow-sm",
    fillHeight ? "h-100" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Card className={cardClassName}>
      <Card.Body className="attendance-analytics-chart-card__body">
        <h5 className="mb-2 fw-semibold">{title}</h5>
        {subtitle ? <p className="text-muted small mb-3">{subtitle}</p> : null}
        {children}
      </Card.Body>
    </Card>
  );
}

export function AttendanceAnalyticsChartEmpty({ message }: Readonly<{ message: string }>) {
  return (
    <div className="attendance-analytics-chart-empty d-flex justify-content-center align-items-center text-muted small">
      {message}
    </div>
  );
}
