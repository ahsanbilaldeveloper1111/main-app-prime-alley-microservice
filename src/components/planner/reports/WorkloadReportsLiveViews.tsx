import React, { useState } from "react";
import ReactDOM from "react-dom";
import { ChevronRight, Folder, Settings } from "lucide-react";
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
  const [modal, setModal] = useState<{ type: string; member: string; tasks: any[] } | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        icon="ti-users"
        title="No member activity"
        subtitle="No tasks assigned in this period"
      />
    );
  }
  const displayedMembers = rows.slice(0, 10);
  return (
    <>
    <div className="reports-live-task-by-member">
      {displayedMembers.map((row) => (
        <div key={row.key} className="reports-live-task-by-member__row">
          <span
            className="reports-assignee-row__avatar reports-assignee-row__avatar--sm"
            style={{ backgroundColor: row.avatarColor }}
            aria-hidden
          >
            {row.initials}
          </span>
          <div className="reports-live-task-by-member__meta">
            <div className="reports-live-task-by-member__name">{row.memberLabel}</div>
            {row.projectLabel !== "—" ? (
              <div className="reports-live-task-by-member__stats">
                <Folder size={11} style={{ marginRight: "4px" }} aria-hidden />
                {row.projectLabel}
              </div>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
              <span
                className="reports-list-badge reports-list-badge--default"
                style={{ cursor: "pointer" }}
                onClick={() => setModal({
                  type: "all",
                  member: row.memberLabel,
                  tasks: [
                    { id: 1, title: "Fix login bug", project: "Auth Service", due: "Jun 1, 2026", status: "In Progress" },
                    { id: 2, title: "Update API docs", project: "Dev Portal", due: "Jun 3, 2026", status: "Pending" },
                    { id: 3, title: "Q2 Report submission", project: "Finance", due: "May 28, 2026", status: "Overdue" },
                  ],
                })}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
              >
                {row.totalTasks} tasks
              </span>
              {row.inProgressTasks > 0 ? (
                <span
                  className="reports-list-badge reports-list-badge--info"
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  onClick={() => setModal({
                    type: "in_progress",
                    member: row.memberLabel,
                    tasks: [
                      { id: 1, title: "Fix login bug", project: "Auth Service", due: "Jun 1, 2026" },
                      { id: 2, title: "Update API docs", project: "Dev Portal", due: "Jun 3, 2026" },
                    ],
                  })}
                >
                  {row.inProgressTasks} in progress
                </span>
              ) : null}
              {row.overdueTasks > 0 ? (
                <span
                  className="reports-list-badge reports-list-badge--critical"
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
                  onClick={() => setModal({
                    type: "overdue",
                    member: row.memberLabel,
                    tasks: [
                      { id: 1, title: "Q2 Report submission", project: "Finance", due: "May 28, 2026" },
                      { id: 2, title: "Client feedback review", project: "CRM", due: "May 30, 2026" },
                      { id: 3, title: "Deploy hotfix", project: "Infrastructure", due: "Jun 1, 2026" },
                    ],
                  })}
                >
                  {row.overdueTasks} overdue
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ padding: "10px 16px", borderTop: "1px solid #eaf0f6", textAlign: "center" }}>
      <button
        type="button"
        onClick={() => setShowAllMembers(true)}
        style={{ background: "none", border: "none", color: "#0066CC", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "Lexend Deca, sans-serif" }}
      >
        View All ({rows.length} members)
      </button>
    </div>
    {showAllMembers ? ReactDOM.createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setShowAllMembers(false)}>
        <div style={{ background: "#fff", borderRadius: "8px", width: "min(640px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>Team Members</div>
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>{rows.length} members</div>
            </div>
            <button type="button" onClick={() => setShowAllMembers(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#718096", fontSize: "18px" }}>×</button>
          </div>
          <div style={{ padding: "8px 20px", borderBottom: "1px solid #eaf0f6" }}>
            <input
              type="text"
              placeholder="Search member..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #eaf0f6", borderRadius: "4px", fontFamily: "Lexend Deca, sans-serif", outline: "none", color: "#141414", background: "#f5f8fa" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {rows
              .filter((row) => row.memberLabel.toLowerCase().includes(memberSearch.toLowerCase()))
              .map((row, idx) => (
                <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af", minWidth: "20px", fontFamily: "Lexend Deca, sans-serif" }}>{idx + 1}</span>
                  <span
                    style={{
                      backgroundColor: row.avatarColor,
                      borderRadius: "50%",
                      color: "#fff",
                      width: "2rem",
                      height: "2rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    {row.initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>{row.memberLabel}</div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      <span className="reports-list-badge reports-list-badge--default">{row.totalTasks} tasks</span>
                      {row.inProgressTasks > 0 ? <span className="reports-list-badge reports-list-badge--info">{row.inProgressTasks} in progress</span> : null}
                      {row.overdueTasks > 0 ? <span className="reports-list-badge reports-list-badge--critical">{row.overdueTasks} overdue</span> : null}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>,
      document.body,
    ) : null}
    {modal ? ReactDOM.createPortal(
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
        onClick={() => setModal(null)}
      >
        <div style={{
          background: "#fff",
          borderRadius: "8px",
          width: "min(600px, 90vw)",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            padding: "16px 20px", borderBottom: "1px solid #eaf0f6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>
                {modal.type === "overdue" ? "Overdue Tasks" : modal.type === "in_progress" ? "In Progress Tasks" : "All Tasks"}
              </div>
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>
                {modal.member}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModal(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#718096", fontSize: "18px", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {modal.tasks.map((task) => (
              <div key={task.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>
                    {task.project}
                  </div>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: task.status === "Overdue" ? "#fef2f2" : task.status === "In Progress" ? "#eff6ff" : "#f3f4f6",
                    color: task.status === "Overdue" ? "#991b1b" : task.status === "In Progress" ? "#0066CC" : "#374151",
                    marginTop: "4px",
                    display: "inline-block",
                  }}>
                    {task.status}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", color: modal.type === "overdue" ? "#991b1b" : "#718096", fontFamily: "Lexend Deca, sans-serif" }}>
                    {task.due}
                  </span>
                  <ChevronRight size={14} style={{ color: "#9ca3af" }} aria-hidden />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>,
      document.body,
    ) : null}
    </>
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
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (rows.length === 0) {
    return emptyState;
  }
  const displayedRows = rows.slice(0, 10);
  return (
    <>
    <div className="reports-live-task-detail-list">
      {displayedRows.map((row) => (
        <div key={row.id} className="reports-live-task-detail-list__row">
          <div className="reports-live-task-detail-list__title">{row.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <span className="reports-live-task-detail-list__assignee-name">{row.assigneeLabel}</span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span className="reports-list-badge reports-list-badge--info" style={{ fontSize: "10px" }}>{row.projectLabel}</span>
                <span className="reports-live-task-detail-list__time">2 hours ago</span>
              </div>
            </div>
            <span
              className="reports-assignee-row__avatar reports-assignee-row__avatar--sm"
              style={{ backgroundColor: row.assigneeAvatarColor }}
              aria-hidden
            >
              {row.assigneeInitials}
            </span>
          </div>
        </div>
      ))}
    </div>
    <div style={{ padding: "10px 16px", borderTop: "1px solid #eaf0f6", textAlign: "center" }}>
      <button
        onClick={() => setShowAll(true)}
        style={{ background: "none", border: "none", color: "#0066CC", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "Lexend Deca, sans-serif" }}
      >
        View All ({rows.length} tasks)
      </button>
    </div>
    {showAll ? ReactDOM.createPortal(
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={() => setShowAll(false)}>
        <div style={{ background: "#fff", borderRadius: "8px", width: "min(680px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>All Tasks</div>
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>{rows.length} tasks</div>
            </div>
            <button type="button" onClick={() => setShowAll(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#718096", fontSize: "18px" }}>×</button>
          </div>
          <div style={{ padding: "8px 20px", borderBottom: "1px solid #eaf0f6" }}>
            <input
              type="text"
              placeholder="Search task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #eaf0f6", borderRadius: "4px", fontFamily: "Lexend Deca, sans-serif", outline: "none", color: "#141414", background: "#f5f8fa" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {rows
              .filter((row) => row.title.toLowerCase().includes(searchQuery.toLowerCase()) || row.assigneeLabel.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((row, idx) => (
                <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af", minWidth: "20px", fontFamily: "Lexend Deca, sans-serif" }}>{idx + 1}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>{row.title}</div>
                      <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>{row.projectLabel}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "#374151", fontFamily: "Lexend Deca, sans-serif" }}>{row.assigneeLabel}</span>
                    <span
                      style={{
                        backgroundColor: row.assigneeAvatarColor,
                        borderRadius: "50%",
                        color: "#fff",
                        width: "2rem",
                        height: "2rem",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                      aria-hidden
                    >
                      {row.assigneeInitials}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>,
      document.body,
    ) : null}
    </>
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
            <Settings size={12} aria-hidden />
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
              Apply filters
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
