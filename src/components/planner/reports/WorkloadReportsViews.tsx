import React, { useState } from "react";
import ReactDOM from "react-dom";
import { Alert, Badge, Spinner, Table } from "react-bootstrap";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  TaskReportsAssigneeRow,
  TaskReportsStatusRow,
  TaskReportsSummary,
  TaskReportsTaskRow,
  TaskReportsTrendPoint,
} from "@utils/taskReports";
import {
  formatReportsDateLabel,
  formatReportsDelta,
  formatReportsHours,
  formatReportsMemberLabel,
  priorityBadgeClass,
  resolveAverageTimeLabel,
  resolveInProgressCount,
  resolveSummaryMetric,
  resolveTaskAssigneeDisplay,
  statusRowPercent,
} from "@page-modules/planner/reports/reportsDomain";
import {
  workloadMemberAvatarColor,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";

export function ReportsEmptyState({
  icon,
  title,
  subtitle,
}: Readonly<{
  icon: string;
  title: string;
  subtitle: string;
}>) {
  return (
    <div className="reports-empty-state">
      <div className="reports-empty-state__icon">
        <i className={`ti ${icon}`} aria-hidden="true" />
      </div>
      <div className="reports-empty-state__title">{title}</div>
      <div className="reports-empty-state__subtitle">{subtitle}</div>
    </div>
  );
}

type KpiCardProps = Readonly<{
  label: string;
  value: string | number;
  sub: string;
  delta?: string | null;
  accent?: "default" | "completed" | "overdue" | "pending" | "in_progress";
}>;

function resolveKpiAccentClass(accent: KpiCardProps["accent"]): string {
  if (accent === "completed") return "reports-kpi-card--completed";
  if (accent === "overdue") return "reports-kpi-card--overdue";
  if (accent === "pending") return "reports-kpi-card--pending";
  if (accent === "in_progress") return "reports-kpi-card--in-progress";
  return "";
}

function resolveKpiDeltaClass(delta: string | null | undefined): string {
  if (!delta) return "";
  if (delta.startsWith("↑") || delta.includes("up")) return "reports-kpi-card__delta--up";
  if (delta.startsWith("↓") || delta.includes("down")) return "reports-kpi-card__delta--down";
  return "";
}

export function ReportsKpiCard({ label, value, sub, delta, accent = "default" }: KpiCardProps) {
  const accentClass = resolveKpiAccentClass(accent);
  const deltaClass = resolveKpiDeltaClass(delta);
  return (
    <div className={`reports-kpi-card ${accentClass}`.trim()}>
      <div className="reports-kpi-card__label">
        <span className="reports-kpi-card__dot" aria-hidden="true" />
        {label}
      </div>
      <div className="reports-kpi-card__value">{value}</div>
      <div className="reports-kpi-card__sub">{sub}</div>
      {delta ? (
        <div className={`reports-kpi-card__delta ${deltaClass}`.trim()}>{delta}</div>
      ) : null}
    </div>
  );
}

export function ReportsTeamLiveKpiRow({
  summary,
  statusRows,
}: Readonly<{ summary: TaskReportsSummary; statusRows: TaskReportsStatusRow[] }>) {
  const vs = summary.vs_previous_period ?? {};
  const total = resolveSummaryMetric(summary, "total_tasks");
  const completed = resolveSummaryMetric(summary, "completed_tasks");
  const overdue = resolveSummaryMetric(summary, "overdue_tasks");
  const inProgress = resolveInProgressCount(summary, statusRows);

  return (
    <div className="reports-kpi-grid">
      <ReportsKpiCard
        label="Total Tasks"
        value={total}
        sub="vs previous period"
        delta={formatReportsDelta(vs.total_tasks)}
      />
      <ReportsKpiCard
        label="Completed"
        value={completed}
        sub="vs previous period"
        delta={formatReportsDelta(vs.completed_tasks)}
        accent="completed"
      />
      <ReportsKpiCard
        label="Overdue"
        value={overdue}
        sub="vs previous period"
        delta={formatReportsDelta(vs.overdue_tasks)}
        accent="overdue"
      />
      <ReportsKpiCard
        label="In Progress"
        value={inProgress}
        sub="Currently active work"
        delta={formatReportsDelta(vs.pending_tasks)}
        accent="in_progress"
      />
    </div>
  );
}

export function ReportsTeamBoardKpiRow({
  summary,
}: Readonly<{ summary: TaskReportsSummary }>) {
  const vs = summary.vs_previous_period ?? {};
  const total = resolveSummaryMetric(summary, "total_tasks");
  const completed = resolveSummaryMetric(summary, "completed_tasks");
  const pending = resolveSummaryMetric(summary, "pending_tasks");
  const avgTime = resolveAverageTimeLabel(summary);

  return (
    <div className="reports-kpi-grid">
      <ReportsKpiCard
        label="Total Tasks"
        value={total}
        sub="vs previous period"
        delta={formatReportsDelta(vs.total_tasks)}
      />
      <ReportsKpiCard
        label="Completed Tasks"
        value={completed}
        sub="vs previous period"
        delta={formatReportsDelta(vs.completed_tasks)}
        accent="completed"
      />
      <ReportsKpiCard
        label="Pending Tasks"
        value={pending}
        sub="vs previous period"
        delta={formatReportsDelta(vs.pending_tasks)}
        accent="pending"
      />
      <ReportsKpiCard
        label="Avg. Time"
        value={avgTime}
        sub="Per completed task"
        accent="in_progress"
      />
    </div>
  );
}

export function ReportsKpiRow({
  summary,
}: Readonly<{ summary: TaskReportsSummary }>) {
  const vs = summary.vs_previous_period ?? {};
  const total = resolveSummaryMetric(summary, "total_tasks");
  const completed = resolveSummaryMetric(summary, "completed_tasks");
  const overdue = resolveSummaryMetric(summary, "overdue_tasks");
  const pending = resolveSummaryMetric(summary, "pending_tasks");
  const hours = summary.total_hours;
  const rate =
    summary.completion_rate ??
    (total > 0 ? Math.round((completed / total) * 100) : 0);

  return (
    <div className="reports-kpi-grid">
      <ReportsKpiCard
        label="Total Tasks"
        value={total}
        sub="Tasks in the selected period"
        delta={formatReportsDelta(vs.total_tasks)}
      />
      <ReportsKpiCard
        label="Completed"
        value={completed}
        sub={`${rate}% completion rate`}
        delta={formatReportsDelta(vs.completed_tasks)}
        accent="completed"
      />
      <ReportsKpiCard
        label="Overdue"
        value={overdue}
        sub="Tasks past their due date"
        delta={formatReportsDelta(vs.overdue_tasks)}
        accent="overdue"
      />
      <ReportsKpiCard
        label="Pending"
        value={pending}
        sub={
          hours != null && hours > 0
            ? `${formatReportsHours(hours)} estimated`
            : "Tasks waiting to start"
        }
        delta={formatReportsDelta(vs.pending_tasks)}
        accent="pending"
      />
    </div>
  );
}

function statusIconStyle(color: string | null | undefined): React.CSSProperties {
  const bg = color?.trim() || "#6366f1";
  return { backgroundColor: bg };
}

export function ReportsStatusBreakdown({
  rows,
}: Readonly<{ rows: TaskReportsStatusRow[] }>) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No status data for this period.</p>;
  }
  return (
    <div>
      {rows.map((row) => {
        const pct = statusRowPercent(row, total);
        const initial = row.status_name.trim().charAt(0).toUpperCase() || "?";
        return (
          <div key={`${row.status_id ?? row.status_name}`} className="reports-status-row">
            <span
              className="reports-status-row__icon"
              style={statusIconStyle(row.status_color)}
              aria-hidden
            >
              {initial}
            </span>
            <div className="reports-status-row__meta">
              <div className="reports-status-row__name">{row.status_name}</div>
              <div className="reports-status-row__count">{row.count} tasks</div>
            </div>
            <div className="reports-status-row__bar">
              <div
                className="reports-status-row__bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  backgroundColor: row.status_color?.trim() || "#6366f1",
                }}
              />
            </div>
            <div className="reports-status-row__pct">{pct.toFixed(1)}%</div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsAssigneeList({
  rows,
  hierarchyExtensions,
  countField = "total",
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
  countField?: "total" | "completed";
}>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No assignee data.</p>;
  }
  return (
    <div>
      {rows.map((row) => {
        const ext = row.extension_number ?? "";
        const label = formatReportsMemberLabel(row, hierarchyExtensions);
        const count =
          countField === "completed"
            ? (row.completed_tasks ?? row.done_count ?? 0)
            : (row.total_tasks ?? row.task_count ?? row.completed_tasks ?? row.done_count ?? 0);
        const suffix = count === 1 ? "task" : "tasks";
        return (
          <div key={ext || label} className="reports-assignee-row">
            <span className="reports-assignee-row__avatar" aria-hidden>
              {workloadMemberInitials(ext, hierarchyExtensions, row)}
            </span>
            <span className="reports-assignee-row__name">{label}</span>
            <span className="reports-assignee-row__count">
              {count} {suffix}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReportsTaskList({
  tasks,
  emptyLabel,
}: Readonly<{ tasks: TaskReportsTaskRow[]; emptyLabel: string }>) {
  if (tasks.length === 0) {
    return <p className="small text-muted mb-0">{emptyLabel}</p>;
  }
  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id} className="reports-task-row">
          <div>
            <div className="reports-task-row__title">{task.title}</div>
            <div className="reports-task-row__meta">
              {[task.project_name, task.due_date?.slice(0, 10)]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="reports-task-row__tags">
            {task.priority ? (
              <span className={`reports-priority ${priorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
            ) : null}
            {task.status_name ? (
              <span
                className="reports-status-tag"
                style={
                  task.status_color
                    ? { borderColor: task.status_color, color: task.status_color }
                    : undefined
                }
              >
                {task.status_name}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function resolveStatusBadgeVariant(
  statusName: string | null | undefined,
): string {
  const status = (statusName ?? "").toLowerCase();
  if (status.includes("done") || status.includes("complete")) return "success";
  if (status.includes("progress")) return "primary";
  if (status.includes("overdue")) return "danger";
  return "secondary";
}

export function ReportsPendingTasksTable({
  tasks,
  hierarchyExtensions,
}: Readonly<{
  tasks: TaskReportsTaskRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  if (tasks.length === 0) {
    return <p className="small text-muted mb-0">No data found</p>;
  }
  return (
    <Table responsive className="reports-pending-table mb-0">
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Project</th>
          <th>Assignee</th>
          <th>Due Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td className="fw-semibold">{task.title}</td>
            <td>{task.project_name?.trim() || "—"}</td>
            <td>{resolveTaskAssigneeDisplay(task, hierarchyExtensions)}</td>
            <td>{task.due_date ? formatReportsDateLabel(task.due_date.slice(0, 10)) : "—"}</td>
            <td>
              {task.status_name ? (
                <Badge bg={resolveStatusBadgeVariant(task.status_name)}>
                  {task.status_name}
                </Badge>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

type MemberWiseSegment = Readonly<{ key: string; value: number; color: string }>;

function buildMemberWiseSegments(row: TaskReportsAssigneeRow): MemberWiseSegment[] {
  const done = row.done_count ?? row.completed_tasks ?? 0;
  const inProgress = row.in_progress_count ?? 0;
  const pending = row.todo_count ?? 0;
  const overdue = row.overdue_count ?? 0;
  return [
    { key: "done", value: done, color: "#22c55e" },
    { key: "in_progress", value: inProgress, color: "#3b82f6" },
    { key: "pending", value: pending, color: "#f59e0b" },
    { key: "overdue", value: overdue, color: "#ef4444" },
  ].filter((segment) => segment.value > 0);
}

export function ReportsMemberWiseTasks({
  rows,
  hierarchyExtensions,
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member data for this period.</p>;
  }
  return (
    <div className="reports-member-wise-list">
      {rows.map((row) => {
        const ext = row.extension_number ?? "";
        const label = formatReportsMemberLabel(row, hierarchyExtensions);
        const segments = buildMemberWiseSegments(row);
        const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
        return (
          <div key={ext || label} className="reports-member-wise-row">
            <span
              className="reports-assignee-row__avatar"
              style={{ backgroundColor: workloadMemberAvatarColor(ext) }}
              aria-hidden
            >
              {workloadMemberInitials(ext, hierarchyExtensions, row)}
            </span>
            <div className="reports-member-wise-row__meta">
              <div className="reports-member-wise-row__name">{label}</div>
              <div className="reports-member-wise-bar" aria-hidden>
                {segments.map((segment) => (
                  <span
                    key={segment.key}
                    className="reports-member-wise-bar__segment"
                    style={{
                      width: `${(segment.value / total) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="reports-member-wise-row__total">{total}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsMemberPerformanceBars({
  rows,
  hierarchyExtensions,
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  const [sortOrder, setSortOrder] = useState<"worst" | "best">("worst");
  const [showAll, setShowAll] = useState(false);
  const [modalSortOrder, setModalSortOrder] = useState<"worst" | "best">("worst");
  const [searchQuery, setSearchQuery] = useState("");

  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member data for this period.</p>;
  }
  const sortedRows = [...rows].sort((a, b) => {
    const totalA = (a.total_tasks ?? a.task_count ?? 0);
    const totalB = (b.total_tasks ?? b.task_count ?? 0);
    const doneA = a.done_count ?? a.completed_tasks ?? 0;
    const doneB = b.done_count ?? b.completed_tasks ?? 0;
    const pctA = totalA > 0 ? Math.round((doneA / totalA) * 100) : 0;
    const pctB = totalB > 0 ? Math.round((doneB / totalB) * 100) : 0;
    return sortOrder === "worst" ? pctA - pctB : pctB - pctA;
  });
  const displayedRows = sortedRows.slice(0, 10);
  const modalRows = [...sortedRows]
    .sort((a, b) => {
      const totalA = (a.total_tasks ?? a.task_count ?? 0);
      const totalB = (b.total_tasks ?? b.task_count ?? 0);
      const doneA = a.done_count ?? a.completed_tasks ?? 0;
      const doneB = b.done_count ?? b.completed_tasks ?? 0;
      const pctA = totalA > 0 ? Math.round((doneA / totalA) * 100) : 0;
      const pctB = totalB > 0 ? Math.round((doneB / totalB) * 100) : 0;
      return modalSortOrder === "worst" ? pctA - pctB : pctB - pctA;
    })
    .filter((row) => {
      const label = formatReportsMemberLabel(row, hierarchyExtensions);
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });
  return (
    <>
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
      <div style={{ display: "flex", border: "1px solid #eaf0f6", borderRadius: "4px", overflow: "hidden" }}>
        <button
          style={{
            padding: "4px 10px", fontSize: "11px", border: "none", cursor: "pointer",
            fontFamily: "Lexend Deca, sans-serif", fontWeight: 500,
            background: sortOrder === "worst" ? "#0066CC" : "#fff",
            color: sortOrder === "worst" ? "#fff" : "#374151",
          }}
          onClick={() => setSortOrder("worst")}
        >
          ↑ Ascending
        </button>
        <button
          style={{
            padding: "4px 10px", fontSize: "11px", border: "none", cursor: "pointer",
            fontFamily: "Lexend Deca, sans-serif", fontWeight: 500,
            background: sortOrder === "best" ? "#0066CC" : "#fff",
            color: sortOrder === "best" ? "#fff" : "#374151",
            borderLeft: "1px solid #eaf0f6",
          }}
          onClick={() => setSortOrder("best")}
        >
          ↓ Descending
        </button>
      </div>
    </div>
    <div className="reports-member-perf-list">
      {displayedRows.map((row) => {
        const ext = row.extension_number ?? "";
        const label = formatReportsMemberLabel(row, hierarchyExtensions);
        const done = row.done_count ?? row.completed_tasks ?? 0;
        const total = row.total_tasks ?? row.task_count ?? 1;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const barColor = pct === 0
          ? "#9ca3af"
          : pct >= 75
            ? "#16a34a"
            : pct >= 50
              ? "#f59e0b"
              : "#ef4444";
        return (
          <div key={ext || label} className="reports-member-perf-row">
            <span
              className="reports-assignee-row__avatar"
              style={{ backgroundColor: workloadMemberAvatarColor(ext) }}
              aria-hidden
            >
              {workloadMemberInitials(ext, hierarchyExtensions, row)}
            </span>
            <div className="reports-member-perf-row__meta">
              <div className="reports-member-perf-row__name">{label}</div>
              <div className="reports-member-perf-row__sub">{done}/{total} tasks complete</div>
              <div className="reports-member-perf-bar">
                <div
                  className="reports-member-perf-bar__fill"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
            <span className="reports-member-perf-row__pct" style={{ color: barColor }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
    <div style={{ padding: "10px 16px", borderTop: "1px solid #eaf0f6", textAlign: "center" }}>
      <button
        onClick={() => setShowAll(true)}
        style={{ background: "none", border: "none", color: "#0066CC", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "Lexend Deca, sans-serif" }}
      >
        View All ({sortedRows.length} members)
      </button>
    </div>
    {showAll ? ReactDOM.createPortal(
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }} onClick={() => setShowAll(false)}>
        <div style={{
          background: "#fff", borderRadius: "8px",
          width: "min(640px, 90vw)", maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>Member Performance</div>
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>All {sortedRows.length} members</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ display: "flex", border: "1px solid #eaf0f6", borderRadius: "4px", overflow: "hidden" }}>
                <button type="button" style={{ padding: "4px 10px", fontSize: "11px", border: "none", cursor: "pointer", fontFamily: "Lexend Deca, sans-serif", fontWeight: 500, background: modalSortOrder === "worst" ? "#0066CC" : "#fff", color: modalSortOrder === "worst" ? "#fff" : "#374151" }} onClick={() => setModalSortOrder("worst")}>↑ Ascending</button>
                <button type="button" style={{ padding: "4px 10px", fontSize: "11px", border: "none", cursor: "pointer", fontFamily: "Lexend Deca, sans-serif", fontWeight: 500, background: modalSortOrder === "best" ? "#0066CC" : "#fff", color: modalSortOrder === "best" ? "#fff" : "#374151", borderLeft: "1px solid #eaf0f6" }} onClick={() => setModalSortOrder("best")}>↓ Descending</button>
              </div>
              <button type="button" onClick={() => setShowAll(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#718096", fontSize: "18px" }}>×</button>
            </div>
          </div>
          <div style={{ padding: "8px 20px", borderBottom: "1px solid #eaf0f6" }}>
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "6px 10px", fontSize: "12px",
                border: "1px solid #eaf0f6", borderRadius: "4px",
                fontFamily: "Lexend Deca, sans-serif", outline: "none",
                color: "#141414", background: "#f5f8fa",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
            {modalRows.map((row, idx) => {
              const ext = row.extension_number?.trim() ?? "";
              const label = formatReportsMemberLabel(row, hierarchyExtensions);
              const total = row.total_tasks ?? row.task_count ?? 0;
              const done = row.done_count ?? row.completed_tasks ?? 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const barColor = pct === 0 ? "#9ca3af" : pct >= 75 ? "#16a34a" : pct >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={ext || label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af", minWidth: "20px", fontFamily: "Lexend Deca, sans-serif" }}>{idx + 1}</span>
                  <span
                    style={{
                      backgroundColor: workloadMemberAvatarColor(ext),
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
                    {workloadMemberInitials(ext, hierarchyExtensions, row)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif", marginBottom: "4px" }}>{label}</div>
                    <div style={{ height: "5px", background: "#eaf0f6", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: barColor, borderRadius: "3px", minWidth: pct > 0 ? "2px" : "0" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: barColor, minWidth: "2.5rem", textAlign: "right", fontFamily: "Lexend Deca, sans-serif" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>,
      document.body,
    ) : null}
    </>
  );
}

const STATUS_DONUT_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

export function ReportsStatusDonutChart({
  rows,
}: Readonly<{ rows: TaskReportsStatusRow[] }>) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length === 0 || total <= 0) {
    return <p className="small text-muted mb-0">No status data for this period.</p>;
  }
  const data = rows.map((row, index) => ({
    name: row.status_name,
    value: row.count,
    color: row.status_color?.trim() || STATUS_DONUT_COLORS[index % STATUS_DONUT_COLORS.length],
  }));

  return (
    <div className="reports-status-donut">
      <div className="reports-status-donut__chart">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="reports-status-donut__center">
          <div className="reports-status-donut__center-value">{total}</div>
          <div className="reports-status-donut__center-label">Total</div>
        </div>
      </div>
      <ul className="reports-status-donut__legend">
        {data.map((entry) => (
          <li key={entry.name}>
            <span className="reports-status-donut__dot" style={{ backgroundColor: entry.color }} />
            <span>{entry.name}</span>
            <span className="reports-status-donut__legend-count">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsPendingTasks({
  tasks,
}: Readonly<{ tasks: TaskReportsTaskRow[] }>) {
  return (
    <ReportsTaskList tasks={tasks} emptyLabel="No pending tasks in this period." />
  );
}

export function ReportsTransferTasks({
  tasks,
}: Readonly<{ tasks: TaskReportsTaskRow[] }>) {
  if (tasks.length === 0) {
    return <p className="small text-muted mb-0">No transferred tasks.</p>;
  }
  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id} className="reports-task-row">
          <div>
            <div className="reports-task-row__title">{task.title}</div>
            <div className="reports-task-row__meta">
              {task.transferred_at
                ? formatReportsDateLabel(task.transferred_at.slice(0, 10))
                : "Transferred"}
              {task.from_extension && task.to_extension
                ? ` · ${task.from_extension} → ${task.to_extension}`
                : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsStaleTasks({
  tasks,
  staleDays,
}: Readonly<{ tasks: TaskReportsTaskRow[]; staleDays: number }>) {
  if (tasks.length === 0) {
    return (
      <p className="small text-muted mb-0">
        No tasks in progress for {staleDays}+ days without updates.
      </p>
    );
  }
  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id} className="reports-task-row">
          <div>
            <div className="reports-task-row__title">{task.title}</div>
            <div className="reports-task-row__meta">
              {task.days_in_progress == null
                ? "Stale"
                : `${task.days_in_progress} days in progress`}
              {task.last_updated_at
                ? ` · updated ${formatReportsDateLabel(task.last_updated_at.slice(0, 10))}`
                : ""}
            </div>
          </div>
          <div className="reports-task-row__tags">
            {task.status_name ? (
              <Badge bg="warning" text="dark">
                {task.status_name}
              </Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function CountPill({
  value,
  tone,
}: Readonly<{ value: number; tone: "todo" | "progress" | "done" | "overdue" }>) {
  return <span className={`reports-count-pill reports-count-pill--${tone}`}>{value}</span>;
}

export function ReportsMemberTable({
  rows,
  hierarchyExtensions,
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member activity in this period.</p>;
  }
  return (
    <Table responsive className="reports-member-table mb-0">
      <thead>
        <tr>
          <th>Member</th>
          <th className="text-center">Total</th>
          <th className="text-center">To Do</th>
          <th className="text-center">In Progress</th>
          <th className="text-center">Done</th>
          <th className="text-center">Overdue</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const ext = row.extension_number ?? "";
          const label = formatReportsMemberLabel(row, hierarchyExtensions);
          return (
            <tr key={ext || label}>
              <td>
                <div className="reports-member-table__name">
                  <span className="reports-assignee-row__avatar" aria-hidden>
                    {workloadMemberInitials(ext, hierarchyExtensions, row)}
                  </span>
                  {label}
                </div>
              </td>
              <td className="text-center fw-semibold">
                {row.total_tasks ?? row.task_count ?? 0}
              </td>
              <td className="text-center">
                <CountPill value={row.todo_count ?? 0} tone="todo" />
              </td>
              <td className="text-center">
                <CountPill value={row.in_progress_count ?? 0} tone="progress" />
              </td>
              <td className="text-center">
                <CountPill value={row.done_count ?? row.completed_tasks ?? 0} tone="done" />
              </td>
              <td className="text-center">
                <CountPill value={row.overdue_count ?? 0} tone="overdue" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export function ReportsTrendChart({
  points,
  series = "volume",
}: Readonly<{
  points: TaskReportsTrendPoint[];
  series?: "volume" | "completed";
}>) {
  if (points.length === 0) {
    return <p className="small text-muted mb-0">No trend data for this period.</p>;
  }
  const data = points.map((p) => ({
    date: p.date,
    label: formatReportsDateLabel(p.date),
    value:
      series === "completed"
        ? (p.completed_count ?? p.count ?? 0)
        : (p.count ?? p.total_tasks ?? p.tasks ?? 0),
  }));
  return (
    <div className="reports-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3, fill: "#2563eb" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportsLoadingBlock() {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" />
      <p className="small text-muted mt-2 mb-0">Loading report data…</p>
    </div>
  );
}

export function ReportsErrorBlock({ message }: Readonly<{ message: string }>) {
  return <Alert variant="danger">{message}</Alert>;
}
