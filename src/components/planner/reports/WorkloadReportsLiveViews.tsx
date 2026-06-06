import React from "react";
import { Badge, Col, Row } from "react-bootstrap";
import type {
  LiveDashboardKpi,
  LiveMemberRow,
  LiveStaleTaskRow,
  LiveTaskDetailRow,
} from "@page-modules/planner/reports/teamLiveViewDomain";
import { ReportsEmptyState } from "./WorkloadReportsViews";

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
    return (
      <ReportsEmptyState
        icon="ti-users"
        title="No member activity"
        subtitle="No tasks assigned in this period"
      />
    );
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
            {row.projectLabel !== "—" ? (
              <div className="reports-live-task-by-member__stats">
                <i className="ti ti-folder" style={{ fontSize: "11px", marginRight: "4px" }} aria-hidden="true" />
                {row.projectLabel}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
              <span className="reports-list-badge reports-list-badge--default">
                {row.totalTasks} tasks
              </span>
              {row.inProgressTasks > 0 ? (
                <span className="reports-list-badge reports-list-badge--info">
                  {row.inProgressTasks} in progress
                </span>
              ) : null}
              {row.overdueTasks > 0 ? (
                <span className="reports-list-badge reports-list-badge--critical">
                  {row.overdueTasks} overdue
                </span>
              ) : null}
            </div>
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
  emptyState,
}: Readonly<{ rows: LiveTaskDetailRow[]; emptyState: React.ReactNode }>) {
  if (rows.length === 0) {
    return emptyState;
  }
  return (
    <div className="reports-live-task-detail-list">
      {rows.map((row) => (
        <div key={row.id} className="reports-live-task-detail-list__row">
          <div className="reports-live-task-detail-list__title">{row.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <span
              style={{
                backgroundColor: row.assigneeAvatarColor,
                width: "1.65rem",
                height: "1.65rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.62rem",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
              aria-hidden
            >
              {row.assigneeInitials}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <span className="reports-live-task-detail-list__assignee-name">{row.assigneeLabel}</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span className="reports-list-badge reports-list-badge--info" style={{ fontSize: "10px" }}>{row.projectLabel}</span>
                <span className="reports-live-task-detail-list__time">2 hours ago</span>
              </div>
            </div>
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
  staleTaskRows,
  staleDays,
  onStaleDaysChange,
  onApplyStale,
}: Readonly<{
  kpiCards: LiveDashboardKpi[];
  memberRows: LiveMemberRow[];
  overdueTasks: LiveTaskDetailRow[];
  inProgressTasks: LiveTaskDetailRow[];
  staleTaskRows: LiveStaleTaskRow[];
  staleDays: number;
  onStaleDaysChange: (days: number) => void;
  onApplyStale: () => void;
}>) {
  return (
    <>
      <ReportsLiveDashboardKpiRow cards={kpiCards} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Team Members</h2>
            <p className="reports-panel__subtitle">Who is working on what right now</p>
            <ReportsLiveTaskByMember rows={memberRows} />
          </div>
        </Col>
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">In Progress Tasks</h2>
            <p className="reports-panel__subtitle">Tasks currently being worked on</p>
            <ReportsLiveTaskDetailList
              rows={inProgressTasks}
              emptyState={
                <ReportsEmptyState
                  icon="ti-loader"
                  title="Nothing in progress"
                  subtitle="No tasks are currently being worked on"
                />
              }
            />
          </div>
        </Col>
      </Row>

      <div className="reports-panel mb-3">
        <div className="reports-panel__header-row">
          <div>
            <h2 className="reports-panel__title">Stuck Tasks</h2>
            <p className="reports-panel__subtitle">Tasks with no progress beyond threshold</p>
          </div>
          <div className="reports-stuck-threshold">
            <i className="ti ti-settings" style={{ fontSize: "12px" }} aria-hidden="true" />
            <span>Threshold:</span>
            <input
              type="number"
              className="reports-threshold-bar__input"
              value={staleDays}
              min={1}
              max={30}
              onChange={(e) => onStaleDaysChange(Number(e.target.value))}
            />
            <span>days</span>
            <button type="button" className="reports-threshold-bar__apply" onClick={onApplyStale}>
              Apply
            </button>
          </div>
        </div>
        {staleTaskRows.length === 0 ? (
          <ReportsEmptyState
            icon="ti-circle-check"
            title="All clear"
            subtitle="No tasks stuck beyond the threshold"
          />
        ) : (
          <div className="reports-live-stale-tasks">
            {staleTaskRows.map((row) => (
              <div key={row.id} className="reports-live-stale-tasks__row">
                <span
                  className="reports-live-stale-tasks__avatar"
                  style={{ width: 24, height: 24, borderRadius: "50%", background: row.avatarColor, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}
                  aria-hidden
                >
                  {row.initials}
                </span>
                <span
                  className="reports-live-stale-tasks__dot"
                  style={{ width: 8, height: 8, borderRadius: "50%", background: row.priorityDot, flexShrink: 0 }}
                  aria-hidden
                />
                <span className="reports-live-stale-tasks__title">{row.title}</span>
                <span className="reports-live-stale-tasks__time">{row.timeLabel}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reports-panel">
        <h2 className="reports-panel__title">Overdue Tasks</h2>
        <p className="reports-panel__subtitle">
          Tasks past their due date and not yet completed
        </p>
        <ReportsLiveTaskDetailList
          rows={overdueTasks}
          emptyState={
            <ReportsEmptyState
              icon="ti-calendar-check"
              title="No overdue tasks"
              subtitle="Everything is on track for this period"
            />
          }
        />
      </div>
    </>
  );
}
