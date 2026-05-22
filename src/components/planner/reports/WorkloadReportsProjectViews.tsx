import React from "react";
import { Nav } from "react-bootstrap";
import {
  formatProjectHealthStatsLine,
  type OverdueByProjectEntry,
  type OverdueByProjectRow,
  type ProjectReportRow,
  type ProjectReportSummary,
  type ProjectTaskCountSegment,
  type ProjectViewKpiSubtexts,
  type ReportsMainView,
  type ReportsTeamSubView,
} from "@page-modules/planner/reports/projectReportsDomain";

type ReportsViewTabsProps = Readonly<{
  activeView: ReportsMainView;
  onChange: (view: ReportsMainView) => void;
}>;

export function ReportsViewTabs({ activeView, onChange }: ReportsViewTabsProps) {
  return (
    <Nav variant="tabs" className="reports-view-tabs mb-3">
      <Nav.Item>
        <Nav.Link
          active={activeView === "team"}
          onClick={() => onChange("team")}
          className={activeView === "team" ? "active" : ""}
        >
          Team Overview
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          active={activeView === "project"}
          onClick={() => onChange("project")}
          className={activeView === "project" ? "active" : ""}
        >
          Project View
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          active={activeView === "historical"}
          onClick={() => onChange("historical")}
          className={activeView === "historical" ? "active" : ""}
        >
          Historical Trends
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

type ReportsTeamSubTabsProps = Readonly<{
  activeSubView: ReportsTeamSubView;
  onChange: (view: ReportsTeamSubView) => void;
}>;

export function ReportsTeamSubTabs({ activeSubView, onChange }: ReportsTeamSubTabsProps) {
  return (
    <div className="reports-team-sub-tabs-wrap mb-3">
      <Nav variant="pills" className="reports-team-sub-tabs gap-1">
        <Nav.Item>
          <Nav.Link
            active={activeSubView === "live"}
            onClick={() => onChange("live")}
            className="reports-team-sub-tabs__link"
          >
            Live View
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            active={activeSubView === "board"}
            onClick={() => onChange("board")}
            className="reports-team-sub-tabs__link"
          >
            Board
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
}

type ProjectKpiAccent = "total" | "on-track" | "at-risk" | "overdue";

function ProjectKpiCard({
  label,
  value,
  sub,
  accent,
}: Readonly<{
  label: string;
  value: number;
  sub: string;
  accent: ProjectKpiAccent;
}>) {
  return (
    <div className={`reports-kpi-card reports-kpi-card--project-${accent}`}>
      <div className="reports-kpi-card__label">{label}</div>
      <div className="reports-kpi-card__value">{value}</div>
      <div className="reports-kpi-card__sub">{sub}</div>
    </div>
  );
}

export function ReportsProjectKpiRow({
  summary,
  subtexts,
}: Readonly<{ summary: ProjectReportSummary; subtexts: ProjectViewKpiSubtexts }>) {
  return (
    <div className="reports-kpi-grid reports-kpi-grid--project-summary">
      <ProjectKpiCard
        label="Total Projects"
        value={summary.total}
        sub={subtexts.totalProjects}
        accent="total"
      />
      <ProjectKpiCard
        label="On Track"
        value={summary.onTrack}
        sub={subtexts.onTrack}
        accent="on-track"
      />
      <ProjectKpiCard
        label="At Risk"
        value={summary.atRisk}
        sub={subtexts.atRisk}
        accent="at-risk"
      />
      <ProjectKpiCard
        label="Total Overdue"
        value={summary.totalOverdue}
        sub={subtexts.totalOverdue}
        accent="overdue"
      />
    </div>
  );
}

function projectProgressTone(progress: number): string {
  if (progress >= 100) return "success";
  if (progress >= 70) return "primary";
  return "warning";
}

export function ReportsProjectDetailList({
  rows,
}: Readonly<{ rows: ProjectReportRow[] }>) {
  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No projects in this period.</p>;
  }
  return (
    <div className="reports-project-list">
      {rows.map((row) => {
        const tone = projectProgressTone(row.progressPercent);
        const healthClass =
          row.health === "at_risk" ? "reports-project-row__health--risk" : "reports-project-row__health--ok";
        return (
          <div key={row.id} className="reports-project-row">
            <div className="reports-project-row__head">
              <span
                className="reports-project-row__dot"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <div className="reports-project-row__title-block">
                <span className="reports-project-row__name">{row.name}</span>
                <span className="reports-project-row__stats">
                  {formatProjectHealthStatsLine(row)}
                </span>
              </div>
              <span className={`reports-project-row__health ${healthClass}`}>{row.healthLabel}</span>
              <span className="reports-project-row__pct">{row.progressPercent}%</span>
            </div>
            <div className="reports-project-row__bar reports-project-row__bar--dual">
              <div
                className={`reports-project-row__bar-fill reports-project-row__bar-fill--${tone}`}
                style={{ width: `${Math.min(100, Math.max(0, row.progressPercent))}%` }}
              />
              <div
                className="reports-project-row__bar-fill reports-project-row__bar-fill--delay"
                style={{
                  width: `${Math.min(100, Math.max(0, row.delayPercent))}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsTasksByProject({
  segments,
}: Readonly<{ segments: ProjectTaskCountSegment[] }>) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (segments.length === 0 || total <= 0) {
    return <p className="small text-muted mb-0">No task counts by project for this period.</p>;
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
            title={`${segment.name}: ${segment.value} tasks`}
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
            <span className="reports-project-breakdown-bar__count">
              {segment.value} {segment.value === 1 ? "task" : "tasks"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function ReportsOverdueByProject({
  rows,
  grouped = false,
  groupedCounts,
  entries,
}: Readonly<{
  rows?: OverdueByProjectRow[];
  grouped?: boolean;
  groupedCounts?: ReadonlyArray<{ projectName: string; count: number }>;
  entries?: OverdueByProjectEntry[];
}>) {
  if (entries && entries.length > 0) {
    return (
      <div>
        {entries.map((entry) => (
          <div key={entry.projectName} className="reports-overdue-project-row">
            <div className="reports-overdue-project-row__project">{entry.projectName}</div>
            <span
              className={`reports-overdue-project-row__badge reports-overdue-project-row__badge--${entry.tone}`}
            >
              {entry.count} overdue
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (grouped && groupedCounts && groupedCounts.length > 0) {
    return (
      <div>
        {groupedCounts.map((entry) => (
          <div key={entry.projectName} className="reports-overdue-project-row">
            <div className="reports-overdue-project-row__project">{entry.projectName}</div>
            <span className="reports-overdue-project-row__badge reports-overdue-project-row__badge--warning">
              {entry.count} overdue
            </span>
          </div>
        ))}
      </div>
    );
  }

  const taskRows = rows ?? [];

  if (taskRows.length === 0) {
    return <p className="small text-muted mb-0">No overdue tasks by project.</p>;
  }

  if (grouped) {
    const counts = new Map<string, number>();
    for (const row of taskRows) {
      counts.set(row.projectName, (counts.get(row.projectName) ?? 0) + 1);
    }
    return (
      <div>
        {Array.from(counts.entries()).map(([projectName, count]) => (
          <div key={projectName} className="reports-overdue-project-row">
            <div className="reports-overdue-project-row__project">{projectName}</div>
            <span className="reports-overdue-project-row__badge">
              {count} overdue
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {taskRows.map((row) => (
        <div key={`${row.projectName}-${row.taskId}`} className="reports-overdue-project-row">
          <div>
            <div className="reports-overdue-project-row__project">{row.projectName}</div>
            <div className="reports-overdue-project-row__task">{row.taskTitle}</div>
          </div>
          <span className="reports-overdue-project-row__badge">Overdue</span>
        </div>
      ))}
    </div>
  );
}

