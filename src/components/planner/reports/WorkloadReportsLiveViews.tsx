import React from "react";
import { Badge, Col, Row } from "react-bootstrap";
import type {
  LiveDashboardKpi,
  LiveMemberRow,
  LiveTaskDetailRow,
} from "@page-modules/planner/reports/teamLiveViewDomain";

export function ReportsLiveDashboardKpiRow({
  cards,
}: Readonly<{ cards: LiveDashboardKpi[] }>) {
  return (
    <div className="reports-kpi-grid reports-kpi-grid--live">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`reports-kpi-card reports-kpi-card--${card.accent === "in_progress" ? "in-progress" : card.accent}`}
        >
          <div className="reports-kpi-card__label">{card.label}</div>
          <div className="reports-kpi-card__value">{card.value}</div>
          {card.sub ? <div className="reports-kpi-card__sub">{card.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function ReportsLiveTaskByMember({
  rows,
}: Readonly<{ rows: LiveMemberRow[] }>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member data for this period.</p>;
  }
  return (
    <div className="reports-live-task-by-member">
      {rows.map((row) => (
        <div key={row.key} className="reports-live-task-by-member__row">
          <span
            className="reports-assignee-row__avatar"
            style={{ backgroundColor: row.avatarColor }}
            aria-hidden
          >
            {row.initials}
          </span>
          <div className="reports-live-task-by-member__meta">
            <div className="reports-live-task-by-member__name">{row.memberLabel}</div>
            <div className="reports-live-task-by-member__stats">{row.statsLine}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function resolveTaskBadgeBg(tone: LiveTaskDetailRow["badgeTone"]): string {
  if (tone === "danger") return "danger";
  if (tone === "success") return "success";
  return "primary";
}

export function ReportsLiveTaskDetailList({
  rows,
  emptyLabel,
}: Readonly<{ rows: LiveTaskDetailRow[]; emptyLabel: string }>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">{emptyLabel}</p>;
  }
  return (
    <div className="reports-live-task-detail-list">
      {rows.map((row) => (
        <div key={row.id} className="reports-live-task-detail-list__row">
          <div className="reports-live-task-detail-list__title">{row.title}</div>
          <div className="reports-live-task-detail-list__assignee">
            <span
              className="reports-assignee-row__avatar reports-assignee-row__avatar--sm"
              style={{ backgroundColor: row.assigneeAvatarColor }}
              aria-hidden
            >
              {row.assigneeInitials}
            </span>
            <span className="reports-live-task-detail-list__assignee-name">
              {row.assigneeLabel}
            </span>
            <Badge bg={resolveTaskBadgeBg(row.badgeTone)}>{row.badge}</Badge>
            <span className="reports-live-task-detail-list__time">{row.timeLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsTeamLivePanel({
  kpiCards,
  memberRows,
  overdueTasks,
  inProgressTasks,
}: Readonly<{
  kpiCards: LiveDashboardKpi[];
  memberRows: LiveMemberRow[];
  overdueTasks: LiveTaskDetailRow[];
  inProgressTasks: LiveTaskDetailRow[];
}>) {
  return (
    <>
      <ReportsLiveDashboardKpiRow cards={kpiCards} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Task by Member</h2>
            <p className="reports-panel__subtitle">Workload and completion per team member</p>
            <ReportsLiveTaskByMember rows={memberRows} />
          </div>
        </Col>
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">In Progress Tasks</h2>
            <p className="reports-panel__subtitle">Tasks currently being worked on</p>
            <ReportsLiveTaskDetailList
              rows={inProgressTasks}
              emptyLabel="No in-progress tasks for this period."
            />
          </div>
        </Col>
      </Row>

      <div className="reports-panel">
        <h2 className="reports-panel__title">Overdue Tasks</h2>
        <p className="reports-panel__subtitle">
          Tasks past their due date and not yet completed
        </p>
        <ReportsLiveTaskDetailList
          rows={overdueTasks}
          emptyLabel="No overdue tasks for this period."
        />
      </div>
    </>
  );
}
