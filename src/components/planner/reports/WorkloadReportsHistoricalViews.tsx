import React from "react";
import { Col, Form, Row } from "react-bootstrap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

type ReportsMetricTrendChartProps = Readonly<{
  title: string;
  subtitle: string;
  points: HistoricalChartPoint[];
  valueSuffix?: string;
  percentAxis?: boolean;
}>;

const OVERDUE_WEEK_BAR_COLORS = ["#eab308", "#ef4444", "#8b5cf6", "#22c55e"] as const;

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
        <p className="small text-muted mb-0">No overdue trend data for this period.</p>
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
                    fill={OVERDUE_WEEK_BAR_COLORS[index % OVERDUE_WEEK_BAR_COLORS.length]}
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
        <p className="small text-muted mb-0">No trend data for this period.</p>
      ) : (
        <div className="reports-trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis
                allowDecimals={percentAxis}
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
    return <p className="small text-muted mb-0">No project data for this period.</p>;
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
    return <p className="small text-muted mb-0">No member trend data for this period.</p>;
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
