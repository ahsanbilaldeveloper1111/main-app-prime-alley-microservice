import React, { useState } from "react";
import { ChevronRight, Folder, Settings } from "lucide-react";
import { Col, Row } from "react-bootstrap";
import type {
  LiveDashboardKpi,
  LiveMemberRow,
  LiveStaleTaskRow,
  LiveTaskDetailRow,
} from "@page-modules/planner/reports/teamLiveViewDomain";
import { ReportsEmptyState } from "./WorkloadReportsViews";
import {
  ReportsModalAvatar,
  ReportsModalIndex,
  ReportsModalShell,
  ReportsViewAllFooter,
} from "./ReportsListModal";

type MemberTaskModalState = Readonly<{
  type: string;
  member: string;
  tasks: Array<{
    id: number;
    title: string;
    project: string;
    due: string;
    status?: string;
  }>;
}>;

type TaskBadgeButtonProps = Readonly<{
  badgeClassName: string;
  label: string;
  onClick: () => void;
}>;

function resolveMemberTaskModalTitle(type: string): string {
  if (type === "overdue") return "Overdue Tasks";
  if (type === "in_progress") return "In Progress Tasks";
  return "All Tasks";
}

function resolveTaskStatusStyle(status: string | undefined): Readonly<{ background: string; color: string }> {
  if (status === "Overdue") return { background: "#fef2f2", color: "#991b1b" };
  if (status === "In Progress") return { background: "#eff6ff", color: "#0066CC" };
  return { background: "#f3f4f6", color: "#374151" };
}

function resolveModalTaskDueColor(modalType: string): string {
  return modalType === "overdue" ? "#991b1b" : "#718096";
}

function TaskBadgeButton({ badgeClassName, label, onClick }: TaskBadgeButtonProps) {
  return (
    <button
      type="button"
      className={`reports-list-badge ${badgeClassName} reports-list-badge-btn`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const LIVE_KPI_BLUE_SHADES = [
  "reports-kpi-card--shade-indigo",
  "reports-kpi-card--shade-light",
  "reports-kpi-card--shade-sky",
  "reports-kpi-card--shade-medium",
] as const;

function resolveLiveKpiCardClass(accent: string, index: number): string {
  if (accent === "in_progress") return "reports-kpi-card--in-progress";
  if (accent === "overdue") return "reports-kpi-card--overdue";
  if (accent === "completed") return "reports-kpi-card--completed";
  if (accent === "pending") return "reports-kpi-card--pending";
  return LIVE_KPI_BLUE_SHADES[index % LIVE_KPI_BLUE_SHADES.length];
}

export function ReportsLiveDashboardKpiRow({
  cards,
}: Readonly<{ cards: LiveDashboardKpi[] }>) {
  return (
    <div className="reports-kpi-grid reports-kpi-grid--live">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className={`reports-kpi-card ${resolveLiveKpiCardClass(card.accent, index)}`}
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
  const [modal, setModal] = useState<MemberTaskModalState | null>(null);
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

  const openMemberTaskModal = (
    type: string,
    member: string,
    tasks: MemberTaskModalState["tasks"],
  ) => {
    setModal({ type, member, tasks });
  };

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
              {row.projectLabel === "—" ? null : (
                <div className="reports-live-task-by-member__stats">
                  <Folder size={11} style={{ marginRight: "4px" }} aria-hidden />
                  {row.projectLabel}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                <TaskBadgeButton
                  badgeClassName="reports-list-badge--default"
                  label={`${row.totalTasks} tasks`}
                  onClick={() =>
                    openMemberTaskModal("all", row.memberLabel, [
                      { id: 1, title: "Fix login bug", project: "Auth Service", due: "Jun 1, 2026", status: "In Progress" },
                      { id: 2, title: "Update API docs", project: "Dev Portal", due: "Jun 3, 2026", status: "Pending" },
                      { id: 3, title: "Q2 Report submission", project: "Finance", due: "May 28, 2026", status: "Overdue" },
                    ])
                  }
                />
                {row.inProgressTasks > 0 ? (
                  <TaskBadgeButton
                    badgeClassName="reports-list-badge--info"
                    label={`${row.inProgressTasks} in progress`}
                    onClick={() =>
                      openMemberTaskModal("in_progress", row.memberLabel, [
                        { id: 1, title: "Fix login bug", project: "Auth Service", due: "Jun 1, 2026" },
                        { id: 2, title: "Update API docs", project: "Dev Portal", due: "Jun 3, 2026" },
                      ])
                    }
                  />
                ) : null}
                {row.overdueTasks > 0 ? (
                  <TaskBadgeButton
                    badgeClassName="reports-list-badge--critical"
                    label={`${row.overdueTasks} overdue`}
                    onClick={() =>
                      openMemberTaskModal("overdue", row.memberLabel, [
                        { id: 1, title: "Q2 Report submission", project: "Finance", due: "May 28, 2026" },
                        { id: 2, title: "Client feedback review", project: "CRM", due: "May 30, 2026" },
                        { id: 3, title: "Deploy hotfix", project: "Infrastructure", due: "Jun 1, 2026" },
                      ])
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
      <ReportsViewAllFooter
        count={rows.length}
        label="members"
        onClick={() => setShowAllMembers(true)}
      />
      {showAllMembers ? (
        <ReportsModalShell
          ariaLabel="Team Members"
          onClose={() => setShowAllMembers(false)}
          dialogClassName="reports-modal-dialog--members"
          title="Team Members"
          subtitle={`${rows.length} members`}
          searchPlaceholder="Search member..."
          searchQuery={memberSearch}
          onSearchChange={setMemberSearch}
        >
          {rows
            .filter((row) => row.memberLabel.toLowerCase().includes(memberSearch.toLowerCase()))
            .map((row, idx) => (
              <div key={row.key} className="reports-modal-list-row reports-modal-list-row--indexed">
                <ReportsModalIndex index={idx} />
                <ReportsModalAvatar
                  backgroundColor={row.avatarColor}
                  initials={row.initials}
                />
                <div className="reports-modal-member-row__content">
                  <div className="reports-modal-member-row__name">{row.memberLabel}</div>
                  <div className="reports-modal-member-row__badges">
                    <span className="reports-list-badge reports-list-badge--default">{row.totalTasks} tasks</span>
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
        </ReportsModalShell>
      ) : null}
      {modal ? (
        <ReportsModalShell
          ariaLabel={resolveMemberTaskModalTitle(modal.type)}
          onClose={() => setModal(null)}
          dialogClassName="reports-modal-dialog--tasks"
          title={resolveMemberTaskModalTitle(modal.type)}
          subtitle={modal.member}
        >
          {modal.tasks.map((task) => {
            const statusStyle = resolveTaskStatusStyle(task.status);
            const dueColor = resolveModalTaskDueColor(modal.type);

            return (
              <div key={task.id} className="reports-modal-list-row reports-modal-task-row">
                <div>
                  <div className="reports-modal-task-row__title">{task.title}</div>
                  <div className="reports-modal-task-row__meta">{task.project}</div>
                  {task.status ? (
                    <span
                      className="reports-modal-task-row__status"
                      style={{
                        background: statusStyle.background,
                        color: statusStyle.color,
                      }}
                    >
                      {task.status}
                    </span>
                  ) : null}
                </div>
                <div className="reports-modal-task-row__due-wrap">
                  <span className="reports-modal-task-row__due" style={{ color: dueColor }}>
                    {task.due}
                  </span>
                  <ChevronRight size={14} style={{ color: "#9ca3af" }} aria-hidden />
                </div>
              </div>
            );
          })}
        </ReportsModalShell>
      ) : null}
    </>
  );
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
      <ReportsViewAllFooter
        count={rows.length}
        label="tasks"
        onClick={() => setShowAll(true)}
      />
      {showAll ? (
        <ReportsModalShell
          ariaLabel="All Tasks"
          onClose={() => setShowAll(false)}
          dialogClassName="reports-modal-dialog--all-tasks"
          title="All Tasks"
          subtitle={`${rows.length} tasks`}
          searchPlaceholder="Search task..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          {rows
            .filter(
              (row) =>
                row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.assigneeLabel.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((row, idx) => (
              <div
                key={row.id}
                className="reports-modal-list-row reports-modal-list-row--split"
              >
                <div className="reports-modal-task-detail-row__main">
                  <ReportsModalIndex index={idx} />
                  <div style={{ minWidth: 0 }}>
                    <div className="reports-modal-member-row__name">{row.title}</div>
                    <div className="reports-modal-task-row__meta">{row.projectLabel}</div>
                  </div>
                </div>
                <div className="reports-modal-task-detail-row__assignee">
                  <span className="reports-modal-task-detail-row__assignee-label">
                    {row.assigneeLabel}
                  </span>
                  <ReportsModalAvatar
                    backgroundColor={row.assigneeAvatarColor}
                    initials={row.assigneeInitials}
                  />
                </div>
              </div>
            ))}
        </ReportsModalShell>
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
