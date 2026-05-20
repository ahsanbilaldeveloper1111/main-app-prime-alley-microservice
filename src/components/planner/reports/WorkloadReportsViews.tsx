import React from "react";
import { Alert, Badge, Col, Row, Spinner, Table } from "react-bootstrap";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  priorityBadgeClass,
  resolveSummaryMetric,
  statusRowPercent,
} from "@page-modules/planner/reports/reportsDomain";
import {
  formatWorkloadMemberLabel,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";

type KpiCardProps = Readonly<{
  label: string;
  value: string | number;
  sub: string;
  delta?: string | null;
  accent?: "default" | "completed" | "overdue" | "pending";
}>;

export function ReportsKpiCard({ label, value, sub, delta, accent = "default" }: KpiCardProps) {
  const accentClass =
    accent === "completed"
      ? "reports-kpi-card--completed"
      : accent === "overdue"
        ? "reports-kpi-card--overdue"
        : accent === "pending"
          ? "reports-kpi-card--pending"
          : "";
  const deltaClass =
    delta?.startsWith("↑") || delta?.includes("up")
      ? "reports-kpi-card__delta--up"
      : delta?.startsWith("↓") || delta?.includes("down")
        ? "reports-kpi-card__delta--down"
        : "";
  return (
    <div className={`reports-kpi-card ${accentClass}`.trim()}>
      <div className="reports-kpi-card__label">{label}</div>
      <div className="reports-kpi-card__value">{value}</div>
      <div className="reports-kpi-card__sub">{sub}</div>
      {delta ? (
        <div className={`reports-kpi-card__delta ${deltaClass}`.trim()}>{delta}</div>
      ) : null}
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
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No assignee data.</p>;
  }
  return (
    <div>
      {rows.map((row) => {
        const ext = row.extension_number ?? "";
        const label = ext
          ? formatWorkloadMemberLabel(ext, hierarchyExtensions, row)
          : row.display_name ?? row.name ?? "Unknown";
        const count =
          row.completed_tasks ?? row.done_count ?? row.total_tasks ?? row.task_count ?? 0;
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
              {task.days_in_progress != null
                ? `${task.days_in_progress} days in progress`
                : "Stale"}
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
          const label = ext
            ? formatWorkloadMemberLabel(ext, hierarchyExtensions, row)
            : row.display_name ?? row.name ?? "—";
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
}: Readonly<{ points: TaskReportsTrendPoint[] }>) {
  if (points.length === 0) {
    return <p className="small text-muted mb-0">No trend data for this period.</p>;
  }
  const data = points.map((p) => ({
    date: p.date,
    label: formatReportsDateLabel(p.date),
    tasks: p.count ?? p.total_tasks ?? p.tasks ?? 0,
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
            dataKey="tasks"
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
