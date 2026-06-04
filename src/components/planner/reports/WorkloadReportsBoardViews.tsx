import React from "react";
import { Col, Row } from "react-bootstrap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  TaskReportsTrendPoint,
} from "@utils/taskReports";
import {
  formatReportsDateLabel,
  formatReportsMemberLabel,
  resolveInProgressCount,
  resolveSummaryMetric,
} from "@page-modules/planner/reports/reportsDomain";
import {
  workloadMemberAvatarColor,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";
import { ReportsKpiCard, ReportsMemberWiseTasks } from "./WorkloadReportsViews";

function resolveCompletionRate(summary: TaskReportsSummary): number {
  if (summary.completion_rate != null && Number.isFinite(summary.completion_rate)) {
    return Math.round(summary.completion_rate);
  }
  const total = resolveSummaryMetric(summary, "total_tasks");
  const done = resolveSummaryMetric(summary, "completed_tasks");
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

export function ReportsBoardDashboardKpiRow({
  summary,
  statusRows,
}: Readonly<{
  summary: TaskReportsSummary;
  statusRows: TaskReportsStatusRow[];
}>) {
  const total = resolveSummaryMetric(summary, "total_tasks");
  const rate = resolveCompletionRate(summary);
  const inProgress = resolveInProgressCount(summary, statusRows);
  const pending = resolveSummaryMetric(summary, "pending_tasks");

  return (
    <div className="reports-kpi-grid">
      <ReportsKpiCard
        label="Total Active Tasks"
        value={total}
        sub="Incomplete tasks in system"
        accent="default"
      />
      <ReportsKpiCard
        label="Completion Rate"
        value={rate > 0 ? `${rate}%` : "—"}
        sub="Tasks completed on time"
        accent="completed"
      />
      <ReportsKpiCard
        label="Overdue Tasks"
        value={resolveSummaryMetric(summary, "overdue_tasks")}
        sub="Past due and not completed"
        accent="overdue"
      />
      <ReportsKpiCard
        label="Stuck Tasks"
        value={inProgress}
        sub="In progress beyond threshold"
        accent="pending"
      />
    </div>
  );
}

function resolveDonutStatusColor(statusName: string): string {
  const status = statusName.toLowerCase();
  if (status.includes("complete") || status.includes("done")) return "#22c55e";
  if (status.includes("progress")) return "#0066CC";
  if (status.includes("pending")) return "#ef4444";
  if (status.includes("todo") || status.includes("to_do")) return "#94a3b8";
  return "#94a3b8";
}

function normalizeDonutLabel(statusName: string): string {
  const status = statusName.toLowerCase();
  if (status.includes("complete") || status.includes("done")) return "Done";
  if (status.includes("progress")) return "In Progress";
  if (status.includes("pending")) return "Pending";
  if (status.includes("todo") || status.includes("to_do")) return "To Do";
  return statusName;
}

export function ReportsTaskDistributionDonut({
  rows,
  centerValue,
  centerLabel = "Total",
}: Readonly<{
  rows: TaskReportsStatusRow[];
  centerValue?: string | number;
  centerLabel?: string;
}>) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (rows.length === 0 || total <= 0) {
    return <p className="small text-muted mb-0">No status data for this period.</p>;
  }
  const data = rows.map((row) => ({
    name: normalizeDonutLabel(row.status_name),
    value: row.count,
    color: resolveDonutStatusColor(row.status_name),
  }));
  const centerDisplay = centerValue ?? total;

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
          <div className="reports-status-donut__center-value">{centerDisplay}</div>
          <div className="reports-status-donut__center-label">{centerLabel}</div>
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

export function ReportsBoardMemberActivity({
  rows,
  hierarchyExtensions,
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member activity for this period.</p>;
  }
  const maxTotal = Math.max(
    ...rows.map((row) => row.total_tasks ?? row.task_count ?? 0),
    1,
  );

  return (
    <div className="reports-board-member-activity">
      {rows.map((row) => {
        const ext = row.extension_number ?? "";
        const label = formatReportsMemberLabel(row, hierarchyExtensions);
        const total = row.total_tasks ?? row.task_count ?? 0;
        const widthPct = Math.round((total / maxTotal) * 100);
        return (
          <div key={ext || label} className="reports-board-member-activity__row">
            <span
              className="reports-assignee-row__avatar"
              style={{ backgroundColor: workloadMemberAvatarColor(ext) }}
              aria-hidden
            >
              {workloadMemberInitials(ext, hierarchyExtensions, row)}
            </span>
            <div className="reports-board-member-activity__meta">
              <div className="reports-board-member-activity__name">{label}</div>
              <div className="reports-board-member-activity__bar" aria-hidden>
                <span
                  className="reports-board-member-activity__bar-fill"
                  style={{ width: `${Math.max(4, widthPct)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsWeeklyTrendChart({
  points,
}: Readonly<{ points: TaskReportsTrendPoint[] }>) {
  if (points.length === 0) {
    return <p className="small text-muted mb-0">No trend data for this period.</p>;
  }
  const data = points.map((point) => ({
    label: formatReportsDateLabel(point.date),
    tasks: point.count ?? point.total_tasks ?? point.tasks ?? 0,
  }));

  return (
    <div className="reports-weekly-trend-chart">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip />
          <Bar dataKey="tasks" fill="#0066CC" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportsTeamBoardPanel({
  summary,
  statusRows,
  memberRows,
  trends,
  hierarchyExtensions,
}: Readonly<{
  summary: TaskReportsSummary;
  statusRows: TaskReportsStatusRow[];
  memberRows: TaskReportsAssigneeRow[];
  trends: TaskReportsTrendPoint[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  return (
    <>
      <ReportsBoardDashboardKpiRow summary={summary} statusRows={statusRows} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Member Performance</h2>
            <p className="reports-panel__subtitle">Completion rate per member this period</p>
            <ReportsMemberWiseTasks
              rows={memberRows}
              hierarchyExtensions={hierarchyExtensions}
            />
          </div>
        </Col>
        <Col lg={6}>
          <div className="reports-panel">
            <h2 className="reports-panel__title">Task Distribution</h2>
            <p className="reports-panel__subtitle">Tasks by status</p>
            <ReportsTaskDistributionDonut rows={statusRows} />
          </div>
        </Col>
      </Row>

      <div className="reports-panel">
        <h2 className="reports-panel__title">Weekly Delivery</h2>
        <p className="reports-panel__subtitle">Tasks completed per day this week</p>
        <ReportsWeeklyTrendChart points={trends} />
      </div>
    </>
  );
}
