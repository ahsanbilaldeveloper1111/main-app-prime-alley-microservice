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

const DATE_PRESET_LABELS: Record<ReportsDatePreset, string> = {
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  this_month: "This month",
  custom: "Custom range",
};

const DATE_PRESETS: ReportsDatePreset[] = ["last_7", "last_30", "this_month", "custom"];

export function WorkloadReportsFiltersCard({
  datePreset,
  onDatePresetChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  projectFilter: _projectFilter,
  onProjectFilterChange,
  projectFilterOptions,
  memberFilter: _memberFilter,
  onMemberFilterChange,
  memberExtensions,
  hierarchyDataExtensions,
  staleDays: _staleDays,
  onStaleDaysChange: _onStaleDaysChange,
  enabled,
  loadingOverview,
  onApply,
}: WorkloadReportsFiltersCardProps) {
  const [openPill, setOpenPill] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
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

  const hasActiveFilters =
    selectedProjects.length > 0 || selectedMembers.length > 0 || datePreset !== "last_7";

  const handleApply = () => {
    if (selectedProjects.length > 0) {
      onProjectFilterChange(selectedProjects[0]);
    } else {
      onProjectFilterChange("all");
    }
    if (selectedMembers.length > 0) {
      onMemberFilterChange(selectedMembers[0]);
    } else {
      onMemberFilterChange("all");
    }
    onApply();
  };

  const handleClearAll = () => {
    setSelectedProjects([]);
    setSelectedMembers([]);
    setProjectSearch("");
    setMemberSearch("");
    onDatePresetChange("last_7");
    onProjectFilterChange("all");
    onMemberFilterChange("all");
  };

  const filteredProjects = projectFilterOptions.filter((p) =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const filteredMembers = memberExtensions.filter((ext) =>
    formatWorkloadMemberLabel(ext, hierarchyDataExtensions)
      .toLowerCase()
      .includes(memberSearch.toLowerCase()),
  );

  return (
    <div className="reports-filter-bar" ref={barRef}>
      <div className="reports-filter-bar__inner">

        {/* Time period pill */}
        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${datePreset !== "last_7" ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("time")}
            disabled={!enabled}
          >
            <span className="reports-filter-bar__pill-label">Time period</span>
            <span className="reports-filter-bar__pill-sep">:</span>
            <span className="reports-filter-bar__pill-value">{DATE_PRESET_LABELS[datePreset]}</span>
            {datePreset !== "last_7" ? (
              <button
                type="button"
                className="reports-filter-bar__pill-x"
                onClick={(e) => {
                  e.stopPropagation();
                  onDatePresetChange("last_7");
                  setOpenPill(null);
                }}
              >
                ×
              </button>
            ) : null}
            <i className="ti ti-chevron-down reports-filter-bar__caret" aria-hidden="true" />
          </button>
          {openPill === "time" ? (
            <div className="reports-filter-bar__dropdown">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`reports-filter-bar__dropdown-item${p === datePreset ? " reports-filter-bar__dropdown-item--selected" : ""}`}
                  onClick={() => {
                    onDatePresetChange(p);
                    setOpenPill(null);
                  }}
                >
                  {datePreset === p ? (
                    <i
                      className="ti ti-check"
                      style={{ fontSize: "11px", marginRight: "6px", color: "#0066CC" }}
                      aria-hidden="true"
                    />
                  ) : (
                    <span style={{ width: "17px", display: "inline-block" }} />
                  )}
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

        <span className="reports-filter-bar__divider">|</span>

        {/* Project pill - multi select */}
        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${selectedProjects.length > 0 ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("project")}
            disabled={!enabled}
          >
            <span className="reports-filter-bar__pill-label">Project</span>
            {selectedProjects.length > 0 ? (
              <>
                <span className="reports-filter-bar__pill-sep">:</span>
                <span className="reports-filter-bar__pill-value">
                  {selectedProjects.length === 1
                    ? projectFilterOptions.find((p) => p.id === selectedProjects[0])?.name ?? "1 selected"
                    : `${selectedProjects.length} selected`}
                </span>
                <button
                  type="button"
                  className="reports-filter-bar__pill-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProjects([]);
                    onProjectFilterChange("all");
                  }}
                >
                  ×
                </button>
              </>
            ) : null}
            <i className="ti ti-chevron-down reports-filter-bar__caret" aria-hidden="true" />
          </button>
          {openPill === "project" ? (
            <div className="reports-filter-bar__dropdown reports-filter-bar__dropdown--wide">
              <div className="reports-filter-bar__search-wrap">
                <i className="ti ti-search reports-filter-bar__search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="reports-filter-bar__search-input"
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="reports-filter-bar__dropdown-list">
                {filteredProjects.map((p) => (
                  <button
                    key={`${p.id}-${p.name}`}
                    type="button"
                    className={`reports-filter-bar__dropdown-item reports-filter-bar__dropdown-item--check${selectedProjects.includes(p.id) ? " reports-filter-bar__dropdown-item--selected" : ""}`}
                    onClick={() => {
                      setSelectedProjects((prev) =>
                        prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                      );
                    }}
                  >
                    <span
                      className={`reports-filter-bar__checkbox${selectedProjects.includes(p.id) ? " reports-filter-bar__checkbox--checked" : ""}`}
                    >
                      {selectedProjects.includes(p.id) ? (
                        <i className="ti ti-check" style={{ fontSize: "10px" }} aria-hidden="true" />
                      ) : null}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <span className="reports-filter-bar__divider">|</span>

        {/* Member pill - multi select */}
        <div className="reports-filter-bar__pill-wrap">
          <button
            type="button"
            className={`reports-filter-bar__pill-btn${selectedMembers.length > 0 ? " reports-filter-bar__pill-btn--active" : ""}`}
            onClick={() => togglePill("member")}
            disabled={!enabled}
          >
            <span className="reports-filter-bar__pill-label">Member</span>
            {selectedMembers.length > 0 ? (
              <>
                <span className="reports-filter-bar__pill-sep">:</span>
                <span className="reports-filter-bar__pill-value">
                  {selectedMembers.length === 1
                    ? formatWorkloadMemberLabel(selectedMembers[0], hierarchyDataExtensions)
                    : `${selectedMembers.length} selected`}
                </span>
                <button
                  type="button"
                  className="reports-filter-bar__pill-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMembers([]);
                    onMemberFilterChange("all");
                  }}
                >
                  ×
                </button>
              </>
            ) : null}
            <i className="ti ti-chevron-down reports-filter-bar__caret" aria-hidden="true" />
          </button>
          {openPill === "member" ? (
            <div className="reports-filter-bar__dropdown reports-filter-bar__dropdown--wide">
              <div className="reports-filter-bar__search-wrap">
                <i className="ti ti-search reports-filter-bar__search-icon" aria-hidden="true" />
                <input
                  type="text"
                  className="reports-filter-bar__search-input"
                  placeholder="Search members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="reports-filter-bar__dropdown-list">
                {filteredMembers.map((ext) => (
                  <button
                    key={ext}
                    type="button"
                    className={`reports-filter-bar__dropdown-item reports-filter-bar__dropdown-item--check${selectedMembers.includes(ext) ? " reports-filter-bar__dropdown-item--selected" : ""}`}
                    onClick={() => {
                      setSelectedMembers((prev) =>
                        prev.includes(ext) ? prev.filter((e) => e !== ext) : [...prev, ext],
                      );
                    }}
                  >
                    <span
                      className={`reports-filter-bar__checkbox${selectedMembers.includes(ext) ? " reports-filter-bar__checkbox--checked" : ""}`}
                    >
                      {selectedMembers.includes(ext) ? (
                        <i className="ti ti-check" style={{ fontSize: "10px" }} aria-hidden="true" />
                      ) : null}
                    </span>
                    {formatWorkloadMemberLabel(ext, hierarchyDataExtensions)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <button type="button" className="reports-filter-bar__clear-all" onClick={handleClearAll}>
            Clear all
          </button>
        ) : null}

        <button
          type="button"
          className="reports-filter-bar__apply"
          disabled={!enabled || loadingOverview}
          onClick={handleApply}
        >
          {loadingOverview ? "Loading…" : "Apply"}
        </button>

      </div>
    </div>
  );
}
