import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  HistoricalChartPoint,
  HistoricalMemberTrendRow,
  HistoricalTaskFilter,
  MemberWeekCell,
  ProjectBreakdownBarSegment,
} from "@page-modules/planner/reports/historicalReportsDomain";
import { extractMemberTrendWeekHeaders } from "@page-modules/planner/reports/historicalReportsDomain";
import { ReportsEmptyState } from "./WorkloadReportsViews";

type ReportsMetricTrendChartProps = Readonly<{
  title: string;
  subtitle: string;
  points: HistoricalChartPoint[];
  valueSuffix?: string;
  percentAxis?: boolean;
}>;

function resolveOverdueBarColor(value: number): string {
  if (value <= 3) return "#22c55e";
  if (value <= 6) return "#f59e0b";
  return "#ef4444";
}

export function ReportsOverdueTrendChart({
  title,
  subtitle,
  points,
}: Readonly<{
  title: string;
  subtitle: string;
  points: HistoricalChartPoint[];
}>) {
  const hasValues = points.some((p) => p.value > 0);
  return (
    <div className="reports-panel reports-panel--chart">
      <h2 className="reports-panel__title">{title}</h2>
      <p className="reports-panel__subtitle">{subtitle}</p>
      {points.length === 0 ? (
        <ReportsEmptyState
          icon="ti-calendar-check"
          title="No overdue data"
          subtitle="No overdue tasks recorded in this period"
        />
      ) : (
        <div className="reports-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} domain={[0, "auto"]} />
              <Tooltip formatter={(value: number) => `${value} overdue`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {points.map((point, index) => (
                  <Cell
                    key={point.label}
                    fill={resolveOverdueBarColor(point.value)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {!hasValues && points.length > 0 ? (
        <p className="small text-muted mt-2 mb-0">
          No overdue tasks recorded in these weeks.
        </p>
      ) : null}
    </div>
  );
}

export function ReportsMetricTrendChart({
  title,
  subtitle,
  points,
  valueSuffix = "",
  percentAxis = false,
}: ReportsMetricTrendChartProps) {
  const hasValues = points.some((p) => p.value > 0);
  return (
    <div className="reports-panel reports-panel--chart">
      <h2 className="reports-panel__title">{title}</h2>
      <p className="reports-panel__subtitle">{subtitle}</p>
      {points.length === 0 ? (
        <ReportsEmptyState
          icon="ti-trending-up"
          title="No trend data"
          subtitle="Try adjusting the date range to see completion trends"
        />
      ) : (
        <div className="reports-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                width={percentAxis ? 36 : 32}
                domain={percentAxis ? [0, 100] : [0, "auto"]}
                tickFormatter={percentAxis ? (v) => `${v}%` : undefined}
              />
              <Tooltip
                formatter={(value: number) =>
                  percentAxis ? `${value}%` : `${value}${valueSuffix}`
                }
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {points.map((point, index) => (
                  <Cell
                    key={point.label}
                    fill={index === points.length - 1 ? "#0066CC" : "#bfdbfe"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {!hasValues && points.length > 0 ? (
        <p className="small text-muted mt-2 mb-0">
          Showing baseline for the selected range. Task activity may be zero in this period.
        </p>
      ) : null}
    </div>
  );
}

function MemberWeekPercentCell({ cell }: Readonly<{ cell: MemberWeekCell | undefined }>) {
  if (!cell) {
    return <span className="text-muted">—</span>;
  }
  return (
    <span className={`reports-member-week-pct reports-member-week-pct--${cell.tone}`}>
      {cell.display}
    </span>
  );
}

function memberTrendDirectionArrow(
  direction: HistoricalMemberTrendRow["trend"]["direction"],
): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "";
}

function MemberTrendDeltaCell({ trend }: Readonly<{ trend: HistoricalMemberTrendRow["trend"] }>) {
  const arrow = memberTrendDirectionArrow(trend.direction);
  return (
    <span
      className={`reports-member-trend-delta reports-member-trend-delta--${trend.direction}`}
    >
      {arrow ? `${arrow} ` : null}
      {trend.label}
    </span>
  );
}

export function ReportsProjectBreakdownBar({
  segments,
}: Readonly<{ segments: ProjectBreakdownBarSegment[] }>) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (segments.length === 0 || total <= 0) {
    return (
      <ReportsEmptyState
        icon="ti-topology-star"
        title="No project data"
        subtitle="No project activity found for this period"
      />
    );
  }
  return (
    <>
      <div className="reports-project-breakdown-bar" aria-hidden>
        {segments.map((segment) => (
          <span
            key={segment.name}
            className="reports-project-breakdown-bar__segment"
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color,
            }}
            title={`${segment.name}: ${segment.value}`}
          />
        ))}
      </div>
      <ul className="reports-project-breakdown-bar__legend">
        {segments.map((segment) => (
          <li key={segment.name}>
            <span
              className="reports-project-breakdown-bar__dot"
              style={{ backgroundColor: segment.color }}
            />
            <span>{segment.name}</span>
            <span className="reports-project-breakdown-bar__count">{segment.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ReportsHistoricalMemberTrendTable({
  rows,
  weekHeaders,
}: Readonly<{ rows: HistoricalMemberTrendRow[]; weekHeaders: string[] }>) {
  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        icon="ti-users"
        title="No member trends"
        subtitle="No member activity recorded in the last 4 weeks"
      />
    );
  }
  const headers =
    weekHeaders.length > 0 ? weekHeaders : extractMemberTrendWeekHeaders(rows);
  return (
    <div className="table-responsive">
      <table className="table reports-member-trend-table mb-0">
        <thead>
          <tr>
            <th>Member</th>
            {headers.map((header) => (
              <th key={header} className="text-center">
                {header}
              </th>
            ))}
            <th className="text-center">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <div className="reports-member-trend-table__member">
                  <span
                    className="reports-assignee-row__avatar"
                    style={{ backgroundColor: row.avatarColor }}
                    aria-hidden
                  >
                    {row.initials}
                  </span>
                  <span className="reports-member-trend-table__name">{row.displayName}</span>
                </div>
              </td>
              {headers.map((header) => (
                <td key={`${row.key}-${header}`} className="text-center">
                  <MemberWeekPercentCell
                    cell={row.weekCells.find((cell) => cell.label === header)}
                  />
                </td>
              ))}
              <td className="text-center">
                <MemberTrendDeltaCell trend={row.trend} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type HistoricalFilterProps = Readonly<{
  filter: HistoricalTaskFilter;
  onChange: (filter: HistoricalTaskFilter) => void;
}>;

export function ReportsHistoricalTaskFilters({ filter, onChange }: HistoricalFilterProps) {
  return (
    <div className="reports-historical-filters">
      <Form.Check
        type="checkbox"
        id="reports-filter-all"
        label="All Tasks"
        checked={filter === "all"}
        onChange={() => onChange("all")}
      />
      <Form.Check
        type="checkbox"
        id="reports-filter-completed"
        label="Completed"
        checked={filter === "completed"}
        onChange={() => onChange("completed")}
      />
      <Form.Check
        type="checkbox"
        id="reports-filter-in-progress"
        label="In Progress"
        checked={filter === "in_progress"}
        onChange={() => onChange("in_progress")}
      />
    </div>
  );
}

export function ReportsHistoricalTrendsPanel({
  completionPoints,
  overduePoints,
  completionChartSubtitle,
  overdueChartSubtitle,
  memberTrendRows,
  memberTrendWeekHeaders,
  taskFilter,
  onTaskFilterChange,
}: Readonly<{
  completionPoints: HistoricalChartPoint[];
  overduePoints: HistoricalChartPoint[];
  completionChartSubtitle: string;
  overdueChartSubtitle: string;
  memberTrendRows: HistoricalMemberTrendRow[];
  memberTrendWeekHeaders: string[];
  taskFilter: HistoricalTaskFilter;
  onTaskFilterChange: (filter: HistoricalTaskFilter) => void;
}>) {
  return (
    <>
      <ReportsHistoricalTaskFilters filter={taskFilter} onChange={onTaskFilterChange} />

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <ReportsMetricTrendChart
            title="Completion Rate Trend"
            subtitle={completionChartSubtitle}
            points={completionPoints}
            percentAxis
          />
        </Col>
        <Col lg={6}>
          <ReportsOverdueTrendChart
            title="Overdue Trend"
            subtitle={overdueChartSubtitle}
            points={overduePoints}
          />
        </Col>
      </Row>

      <div className="reports-panel">
        <h2 className="reports-panel__title">Member Trend</h2>
        <p className="reports-panel__subtitle">
          Individual completion rate — {completionChartSubtitle.toLowerCase()}
        </p>
        <ReportsHistoricalMemberTrendTable
          rows={memberTrendRows}
          weekHeaders={memberTrendWeekHeaders}
        />
      </div>
    </>
  );
}
