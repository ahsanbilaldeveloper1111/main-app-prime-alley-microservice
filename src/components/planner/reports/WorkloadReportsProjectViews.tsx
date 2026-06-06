import React, { useState } from "react";
import ReactDOM from "react-dom";
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
import { ReportsEmptyState } from "./WorkloadReportsViews";

type ReportsViewTabsProps = Readonly<{
  activeView: ReportsMainView;
  onChange: (view: ReportsMainView) => void;
}>;

export function ReportsViewTabs({ activeView, onChange }: ReportsViewTabsProps) {
  const tabs: { id: ReportsMainView; label: string }[] = [
    { id: "team", label: "Team Overview" },
    { id: "project", label: "Project View" },
    { id: "historical", label: "Historical Trends" },
  ];

  return (
    <div className="reports-tabs-row">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`reports-tabs-row__tab${activeView === tab.id ? " reports-tabs-row__tab--active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      <button type="button" className="reports-tabs-row__action">
        <i className="ti ti-plus" style={{ fontSize: "13px" }} aria-hidden="true" />
        Add view
      </button>
      <button type="button" className="reports-tabs-row__action reports-tabs-row__action--primary">
        All Views
      </button>
    </div>
  );
}

type ReportsTeamSubTabsProps = Readonly<{
  activeSubView: ReportsTeamSubView;
  onChange: (view: ReportsTeamSubView) => void;
}>;

export function ReportsTeamSubTabs({ activeSubView, onChange }: ReportsTeamSubTabsProps) {
  return (
    <div className="reports-team-sub-tabs-wrap">
      <button
        type="button"
        className={`reports-sub-tab-btn${activeSubView === "live" ? " reports-sub-tab-btn--active" : ""}`}
        onClick={() => onChange("live")}
      >
        Live View
      </button>
      <button
        type="button"
        className={`reports-sub-tab-btn${activeSubView === "board" ? " reports-sub-tab-btn--active" : ""}`}
        onClick={() => onChange("board")}
      >
        Report View
      </button>
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
  if (progress >= 75) return "success";
  if (progress >= 50) return "warning";
  return "delay";
}

export function ReportsProjectDetailList({
  rows,
}: Readonly<{ rows: ProjectReportRow[] }>) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        icon="ti-topology-star"
        title="No projects found"
        subtitle="No project activity in this period"
      />
    );
  }

  const displayedRows = rows.slice(0, 10);

  return (
    <>
      <div className="reports-project-list">
        {displayedRows.map((row) => {
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
      <div style={{ padding: "10px 16px", borderTop: "1px solid #eaf0f6", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{ background: "none", border: "none", color: "#0066CC", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "Lexend Deca, sans-serif" }}
        >
          View All ({rows.length} projects)
        </button>
      </div>
      {showAll ? ReactDOM.createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowAll(false)}>
          <div style={{ background: "#fff", borderRadius: "8px", width: "min(680px, 90vw)", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#141414", fontFamily: "Lexend Deca, sans-serif" }}>Project Health</div>
                <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px", fontFamily: "Lexend Deca, sans-serif" }}>{rows.length} projects</div>
              </div>
              <button type="button" onClick={() => setShowAll(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#718096", fontSize: "18px" }}>×</button>
            </div>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid #eaf0f6" }}>
              <input
                type="text"
                placeholder="Search project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "6px 10px", fontSize: "12px", border: "1px solid #eaf0f6", borderRadius: "4px", fontFamily: "Lexend Deca, sans-serif", outline: "none", color: "#141414", background: "#f5f8fa" }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {rows
                .filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((row, idx) => {
                  const tone = projectProgressTone(row.progressPercent);
                  const healthClass = row.health === "at_risk" ? "reports-project-row__health--risk" : "reports-project-row__health--ok";
                  return (
                    <div key={row.id} style={{ padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ fontSize: "11px", color: "#9ca3af", minWidth: "20px", fontFamily: "Lexend Deca, sans-serif" }}>{idx + 1}</span>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: row.color, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif", flex: 1 }}>{row.name}</span>
                        <span className={`reports-project-row__health ${healthClass}`}>{row.healthLabel}</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", minWidth: "2.5rem", textAlign: "right", fontFamily: "Lexend Deca, sans-serif" }}>{row.progressPercent}%</span>
                      </div>
                      <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", marginLeft: "28px" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, row.progressPercent))}%`, background: tone === "success" ? "#16a34a" : tone === "warning" ? "#f59e0b" : "#ef4444", borderRadius: "999px" }} />
                      </div>
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

export function ReportsTasksByProject({
  segments,
}: Readonly<{ segments: ProjectTaskCountSegment[] }>) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (segments.length === 0 || total <= 0) {
    return (
      <ReportsEmptyState
        icon="ti-chart-bar"
        title="No project data"
        subtitle="No tasks found across projects for this period"
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
            <div>
              <div className="reports-overdue-project-row__project">{entry.projectName}</div>
              <div className="reports-overdue-project-row__task">{entry.count} {entry.count === 1 ? "task" : "tasks"} overdue</div>
            </div>
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

