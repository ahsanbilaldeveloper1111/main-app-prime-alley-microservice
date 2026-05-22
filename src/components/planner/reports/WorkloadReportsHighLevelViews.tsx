import React from "react";
import { Col, Row } from "react-bootstrap";
import type { HighLevelKpiCard, HighLevelListItem } from "@page-modules/planner/reports/teamOverviewReportsDomain";

function resolveKpiAccentClass(accent: HighLevelKpiCard["accent"]): string {
  if (accent === "completed") return "reports-kpi-card--completed";
  if (accent === "overdue") return "reports-kpi-card--overdue";
  if (accent === "pending") return "reports-kpi-card--pending";
  return "";
}

function resolveListBadgeClass(tone: HighLevelListItem["badgeTone"]): string {
  if (tone === "critical") return "reports-list-badge--critical";
  if (tone === "warning") return "reports-list-badge--warning";
  if (tone === "success") return "reports-list-badge--success";
  if (tone === "info") return "reports-list-badge--info";
  return "reports-list-badge--default";
}

export function ReportsHighLevelKpiRow({ cards }: Readonly<{ cards: HighLevelKpiCard[] }>) {
  return (
    <div className="reports-kpi-grid">
      {cards.map((card) => (
        <div key={card.label} className={`reports-kpi-card ${resolveKpiAccentClass(card.accent)}`.trim()}>
          <div className="reports-kpi-card__label">{card.label}</div>
          <div className="reports-kpi-card__value">{card.value}</div>
          <div className="reports-kpi-card__sub">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function ReportsHighLevelList({
  items,
  emptyLabel,
}: Readonly<{ items: HighLevelListItem[]; emptyLabel: string }>) {
  if (items.length === 0) {
    return <p className="small text-muted mb-0">{emptyLabel}</p>;
  }
  return (
    <div className="reports-high-level-list">
      {items.map((item) => (
        <div key={item.id} className="reports-high-level-list__row">
          <span
            className="reports-high-level-list__avatar"
            style={{ backgroundColor: item.avatarColor }}
            aria-hidden
          >
            {item.initials}
          </span>
          <div className="reports-high-level-list__meta">
            <div className="reports-high-level-list__title">{item.title}</div>
            <div className="reports-high-level-list__subtitle">{item.subtitle}</div>
          </div>
          <span className={`reports-list-badge ${resolveListBadgeClass(item.badgeTone)}`}>
            {item.badge}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReportsHighLevelStatusPanel({
  kpiCards,
  recentReports,
  activeIssues,
  recentActivity,
}: Readonly<{
  kpiCards: HighLevelKpiCard[];
  recentReports: HighLevelListItem[];
  activeIssues: HighLevelListItem[];
  recentActivity: HighLevelListItem[];
}>) {
  return (
    <>
      <ReportsHighLevelKpiRow cards={kpiCards} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Recent reports</h2>
            <p className="reports-panel__subtitle">Pending tasks with assignee and project</p>
            <ReportsHighLevelList items={recentReports} emptyLabel="No pending tasks." />
          </div>
        </Col>
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Active issues</h2>
            <p className="reports-panel__subtitle">Overdue and stale in-progress work</p>
            <ReportsHighLevelList items={activeIssues} emptyLabel="No active issues." />
          </div>
        </Col>
      </Row>

      <div className="reports-panel">
        <h2 className="reports-panel__title">Recent activity</h2>
        <p className="reports-panel__subtitle">Latest updates across projects</p>
        <ReportsHighLevelList items={recentActivity} emptyLabel="No recent activity." />
      </div>
    </>
  );
}

