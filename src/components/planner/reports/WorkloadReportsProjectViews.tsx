import React, { useState } from "react";
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
import {
  ReportsModalIndex,
  ReportsModalShell,
  ReportsViewAllFooter,
} from "./ReportsListModal";

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

function projectProgressBarColor(tone: string): string {
  if (tone === "success") return "#16a34a";
  if (tone === "warning") return "#f59e0b";
  return "#ef4444";
}

function resolveProjectHealthClass(health: ProjectReportRow["health"]): string {
  return health === "at_risk" ? "reports-project-row__health--risk" : "reports-project-row__health--ok";
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
          const healthClass = resolveProjectHealthClass(row.health);
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
      <ReportsViewAllFooter
        count={rows.length}
        label="projects"
        onClick={() => setShowAll(true)}
      />
      {showAll ? (
        <ReportsModalShell
          ariaLabel="Project Health"
          onClose={() => setShowAll(false)}
          dialogClassName="reports-modal-dialog--all-tasks"
          title="Project Health"
          subtitle={`${rows.length} projects`}
          searchPlaceholder="Search project..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        >
          {rows
            .filter((row) => row.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((row, idx) => {
              const tone = projectProgressTone(row.progressPercent);
              const healthClass = resolveProjectHealthClass(row.health);
              const progressBarColor = projectProgressBarColor(tone);

              return (
                <div key={row.id} className="reports-modal-list-row reports-modal-list-row--project">
                  <div className="reports-modal-project-row__head">
                    <ReportsModalIndex index={idx} />
                    <span
                      className="reports-modal-project-row__dot"
                      style={{ backgroundColor: row.color }}
                      aria-hidden
                    />
                    <span className="reports-project-row__name">{row.name}</span>
                    <span className={`reports-project-row__health ${healthClass}`}>
                      {row.healthLabel}
                    </span>
                    <span className="reports-project-row__pct">{row.progressPercent}%</span>
                  </div>
                  <div className="reports-modal-project-row__bar">
                    <div
                      className="reports-modal-project-row__bar-fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, row.progressPercent))}%`,
                        background: progressBarColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </ReportsModalShell>
      ) : null}
    </>
  );
}

export function ReportsTasksByProject({
  segments,
}: Readonly<{ segments: ProjectTaskCountSegment[] }>) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const maxValue = sorted[0]?.value ?? 1;
  const displayed = sorted.slice(0, 8);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "4px 16px" }}>
        {displayed.map((segment) => (
          <div key={segment.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#141414", fontFamily: "Lexend Deca, sans-serif", width: "35%", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {segment.name}
            </div>
            <div style={{ flex: 1, height: "5px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.round((segment.value / maxValue) * 100)}%`,
                backgroundColor: segment.color,
                borderRadius: "999px",
                minWidth: "4px",
              }} />
            </div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", fontFamily: "Lexend Deca, sans-serif", minWidth: "2rem", textAlign: "right" }}>
              {segment.value}
            </div>
          </div>
        ))}
      </div>
      <ReportsViewAllFooter
        count={segments.length}
        label="projects"
        variant="inset"
        onClick={() => setShowAll(true)}
      />
      {showAll ? (
        <ReportsModalShell
          ariaLabel="Tasks by Project"
          onClose={() => setShowAll(false)}
          dialogClassName="reports-modal-dialog--members"
          title="Tasks by Project"
          subtitle={`${segments.length} projects`}
          searchPlaceholder="Search project..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          bodyClassName="reports-modal-body reports-modal-body--padded"
        >
          <div className="reports-modal-segment-list">
            {sorted
              .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((segment, idx) => (
                <div key={segment.name} className="reports-modal-segment-row">
                  <ReportsModalIndex index={idx} />
                  <div className="reports-modal-segment-row__name">{segment.name}</div>
                  <div className="reports-modal-segment-row__track">
                    <div
                      className="reports-modal-segment-row__fill"
                      style={{
                        width: `${Math.round((segment.value / maxValue) * 100)}%`,
                        backgroundColor: segment.color,
                      }}
                    />
                  </div>
                  <div className="reports-modal-segment-row__value">{segment.value}</div>
                </div>
              ))}
          </div>
        </ReportsModalShell>
      ) : null}
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

