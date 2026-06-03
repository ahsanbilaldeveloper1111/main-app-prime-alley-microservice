import React, { useEffect, useRef, useState } from "react";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
import type { ReportsDatePreset, ReportsProjectFilter } from "@page-modules/planner/reports/reportsDomain";
import type { PlannerProjectListItem } from "@page-modules/planner/reports/projectReportsDomain";

type WorkloadReportsFiltersCardProps = Readonly<{
  datePreset: ReportsDatePreset;
  onDatePresetChange: (preset: ReportsDatePreset) => void;
  customStart: string;
  onCustomStartChange: (value: string) => void;
  customEnd: string;
  onCustomEndChange: (value: string) => void;
  projectFilter: ReportsProjectFilter;
  onProjectFilterChange: (value: ReportsProjectFilter) => void;
  projectFilterOptions: PlannerProjectListItem[];
  memberFilter: string;
  onMemberFilterChange: (value: string) => void;
  memberExtensions: string[];
  hierarchyDataExtensions: unknown[] | null | undefined;
  staleDays: number;
  onStaleDaysChange: (value: number) => void;
  enabled: boolean;
  loadingOverview: boolean;
  onApply: () => void;
}>;

export function WorkloadReportsFiltersCard({
  datePreset,
  onDatePresetChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  projectFilter,
  onProjectFilterChange,
  projectFilterOptions,
  memberFilter,
  onMemberFilterChange,
  memberExtensions,
  hierarchyDataExtensions,
  staleDays,
  onStaleDaysChange,
  enabled,
  loadingOverview,
  onApply,
}: WorkloadReportsFiltersCardProps) {
  const [openPill, setOpenPill] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<"team" | "project">("team");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPill(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const togglePill = (id: string) => {
    setOpenPill((prev) => (prev === id ? null : id));
  };

  const DATE_PRESET_LABELS: Record<string, string> = {
    last_7: "Last 7 days",
    last_30: "Last 30 days",
    this_month: "This month",
    custom: "Custom range",
  };

  const selectedProjectLabel =
    projectFilter === "all"
      ? "All Projects"
      : projectFilterOptions.find((p) => p.id === projectFilter)?.name ?? "Project";

  return (
    <div className="reports-filter-bar" ref={barRef}>
      <div className="reports-filter-bar__inner">
        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${scopeFilter === "team" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => setScopeFilter("team")}
            disabled={!enabled}
          >
            <i className="ti ti-users reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>My Team</span>
          </button>
        </div>
        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${scopeFilter === "project" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => setScopeFilter("project")}
            disabled={!enabled}
          >
            <i className="ti ti-topology-star reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>By Project</span>
          </button>
        </div>
        <div className="reports-filter-bar__sep" aria-hidden="true" />

        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${datePreset !== "last_7" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("time")}
            disabled={!enabled}
          >
            <i className="ti ti-calendar reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>{DATE_PRESET_LABELS[datePreset]}</span>
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "time" ? (
            <div className="reports-filter-bar__dropdown">
              {(["last_7", "last_30", "this_month", "custom"] as ReportsDatePreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="reports-filter-bar__dropdown-item"
                  onClick={() => {
                    onDatePresetChange(p);
                    setOpenPill(null);
                  }}
                >
                  {DATE_PRESET_LABELS[p]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {datePreset === "custom" ? (
          <>
            <input
              type="date"
              className="reports-filter-bar__date-input"
              value={customStart}
              onChange={(e) => onCustomStartChange(e.target.value)}
              disabled={!enabled}
            />
            <span className="reports-filter-bar__date-sep">→</span>
            <input
              type="date"
              className="reports-filter-bar__date-input"
              value={customEnd}
              onChange={(e) => onCustomEndChange(e.target.value)}
              disabled={!enabled}
            />
          </>
        ) : null}

        <div className="reports-filter-bar__sep" aria-hidden="true" />

        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${projectFilter !== "all" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("project")}
            disabled={!enabled}
          >
            <i className="ti ti-folder reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>{selectedProjectLabel}</span>
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "project" ? (
            <div className="reports-filter-bar__dropdown">
              <button
                type="button"
                className="reports-filter-bar__dropdown-item"
                onClick={() => {
                  onProjectFilterChange("all");
                  setOpenPill(null);
                }}
              >
                All projects
              </button>
              {projectFilterOptions.map((p) => (
                <button
                  key={`${p.id}-${p.name}`}
                  type="button"
                  className="reports-filter-bar__dropdown-item"
                  onClick={() => {
                    onProjectFilterChange(p.id);
                    setOpenPill(null);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="reports-filter-bar__sep" aria-hidden="true" />

        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${memberFilter !== "all" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("member")}
            disabled={!enabled}
          >
            <i className="ti ti-users reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>{memberFilter === "all" ? "All Members" : memberFilter}</span>
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "member" ? (
            <div className="reports-filter-bar__dropdown">
              <button
                type="button"
                className="reports-filter-bar__dropdown-item"
                onClick={() => {
                  onMemberFilterChange("all");
                  setOpenPill(null);
                }}
              >
                All members
              </button>
              {memberExtensions.map((ext) => (
                <button
                  key={ext}
                  type="button"
                  className="reports-filter-bar__dropdown-item"
                  onClick={() => {
                    onMemberFilterChange(ext);
                    setOpenPill(null);
                  }}
                >
                  {formatWorkloadMemberLabel(ext, hierarchyDataExtensions)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="reports-filter-bar__sep" aria-hidden="true" />

        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className="reports-filter-bar__pill-btn"
            onClick={() => togglePill("stale")}
            disabled={!enabled}
          >
            <i className="ti ti-clock reports-filter-bar__pill-icon" aria-hidden="true" />
            <span>Stale: {staleDays}+ days</span>
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "stale" ? (
            <div className="reports-filter-bar__dropdown">
              {[3, 5, 7, 14].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="reports-filter-bar__dropdown-item"
                  onClick={() => {
                    onStaleDaysChange(value);
                    setOpenPill(null);
                  }}
                >
                  {value}+ days
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="reports-filter-bar__apply"
          disabled={!enabled || loadingOverview}
          onClick={onApply}
        >
          {loadingOverview ? "Loading…" : "Apply"}
        </button>
      </div>
    </div>
  );
}
