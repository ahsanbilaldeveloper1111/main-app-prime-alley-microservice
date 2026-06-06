import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, Search } from "lucide-react";
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

type MultiSelectOption<T extends string | number> = Readonly<{
  key: string;
  id: T;
  label: string;
}>;

type FilterMultiSelectDropdownProps<T extends string | number> = Readonly<{
  options: MultiSelectOption<T>[];
  selectedIds: T[];
  onToggle: (id: T) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}>;

const DATE_PRESET_LABELS: Record<ReportsDatePreset, string> = {
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  this_month: "This month",
  custom: "Custom range",
};

const DATE_PRESETS: ReportsDatePreset[] = ["last_7", "last_30", "this_month", "custom"];

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

function resolveProjectFilterValue(selectedProjects: number[]): ReportsProjectFilter {
  return selectedProjects.length > 0 ? selectedProjects[0] : "all";
}

function resolveMemberFilterValue(selectedMembers: string[]): string {
  return selectedMembers.length > 0 ? selectedMembers[0] : "all";
}

function FilterMultiSelectDropdown<T extends string | number>({
  options,
  selectedIds,
  onToggle,
  search,
  onSearchChange,
  searchPlaceholder,
}: FilterMultiSelectDropdownProps<T>) {
  return (
    <div className="reports-filter-bar__dropdown reports-filter-bar__dropdown--wide">
      <div className="reports-filter-bar__search-wrap">
        <Search size={13} className="reports-filter-bar__search-icon" aria-hidden />
        <input
          type="text"
          className="reports-filter-bar__search-input"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
      </div>
      <div className="reports-filter-bar__dropdown-list">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);
          return (
            <button
              key={option.key}
              type="button"
              className={`reports-filter-bar__dropdown-item reports-filter-bar__dropdown-item--check${isSelected ? " reports-filter-bar__dropdown-item--selected" : ""}`}
              onClick={() => onToggle(option.id)}
            >
              <span
                className={`reports-filter-bar__checkbox${isSelected ? " reports-filter-bar__checkbox--checked" : ""}`}
              >
                {isSelected ? <Check size={10} aria-hidden /> : null}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type TimePeriodFilterSectionProps = Readonly<{
  enabled: boolean;
  pendingDatePreset: ReportsDatePreset;
  openPill: string | null;
  onTogglePill: (id: string) => void;
  onPresetChange: (preset: ReportsDatePreset) => void;
  onClosePill: () => void;
  customStart: string;
  onCustomStartChange: (value: string) => void;
  customEnd: string;
  onCustomEndChange: (value: string) => void;
}>;

function TimePeriodFilterSection({
  enabled,
  pendingDatePreset,
  openPill,
  onTogglePill,
  onPresetChange,
  onClosePill,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
}: TimePeriodFilterSectionProps) {
  const isDefaultPreset = pendingDatePreset === "last_7";

  const handleClearPreset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPresetChange("last_7");
    onClosePill();
  };

  return (
    <>
      <div className="reports-filter-bar__pill-wrap">
        <button
          type="button"
          className={`reports-filter-bar__pill-btn${isDefaultPreset ? "" : " reports-filter-bar__pill-btn--active"}`}
          onClick={() => onTogglePill("time")}
          disabled={!enabled}
        >
          <span className="reports-filter-bar__pill-label">Time period</span>
          <span className="reports-filter-bar__pill-sep">:</span>
          <span className="reports-filter-bar__pill-value">{DATE_PRESET_LABELS[pendingDatePreset]}</span>
          {isDefaultPreset ? null : (
            <button type="button" className="reports-filter-bar__pill-x" onClick={handleClearPreset}>
              ×
            </button>
          )}
          <span className="reports-filter-bar__caret">▾</span>
        </button>
        {openPill === "time" ? (
          <div className="reports-filter-bar__dropdown">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`reports-filter-bar__dropdown-item${preset === pendingDatePreset ? " reports-filter-bar__dropdown-item--selected" : ""}`}
                onClick={() => {
                  onPresetChange(preset);
                  onClosePill();
                }}
              >
                {pendingDatePreset === preset ? (
                  <Check size={11} style={{ marginRight: "6px", color: "#0066CC" }} aria-hidden />
                ) : (
                  <span style={{ width: "17px", display: "inline-block" }} />
                )}
                {DATE_PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {pendingDatePreset === "custom" ? (
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
    </>
  );
}

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
  const [pendingDatePreset, setPendingDatePreset] = useState(datePreset);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPendingDatePreset(datePreset);
  }, [datePreset]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target;
      if (barRef.current && target instanceof Node && !barRef.current.contains(target)) {
        setOpenPill(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const togglePill = (id: string) => {
    setOpenPill((prev) => (prev === id ? null : id));
  };

  const closePill = useCallback(() => {
    setOpenPill(null);
  }, []);

  const toggleProject = useCallback((projectId: number) => {
    setSelectedProjects((prev) => toggleInArray(prev, projectId));
  }, []);

  const toggleMember = useCallback((memberExt: string) => {
    setSelectedMembers((prev) => toggleInArray(prev, memberExt));
  }, []);

  const hasActiveFilters =
    selectedProjects.length > 0 || selectedMembers.length > 0 || pendingDatePreset !== "last_7";

  const handleApply = () => {
    onDatePresetChange(pendingDatePreset);
    onProjectFilterChange(resolveProjectFilterValue(selectedProjects));
    onMemberFilterChange(resolveMemberFilterValue(selectedMembers));
    onApply();
  };

  const handleClearAll = () => {
    setSelectedProjects([]);
    setSelectedMembers([]);
    setProjectSearch("");
    setMemberSearch("");
    setPendingDatePreset("last_7");
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

  const projectOptions: MultiSelectOption<number>[] = filteredProjects.map((p) => ({
    key: `${p.id}-${p.name}`,
    id: p.id,
    label: p.name,
  }));

  const memberOptions: MultiSelectOption<string>[] = filteredMembers.map((ext) => ({
    key: ext,
    id: ext,
    label: formatWorkloadMemberLabel(ext, hierarchyDataExtensions),
  }));

  const projectPillValue =
    selectedProjects.length === 1
      ? projectFilterOptions.find((p) => p.id === selectedProjects[0])?.name ?? "1 selected"
      : `${selectedProjects.length} selected`;

  const memberPillValue =
    selectedMembers.length === 1
      ? formatWorkloadMemberLabel(selectedMembers[0], hierarchyDataExtensions)
      : `${selectedMembers.length} selected`;

  return (
    <div className="reports-filter-bar" ref={barRef}>
      <div className="reports-filter-bar__inner">
        <TimePeriodFilterSection
          enabled={enabled}
          pendingDatePreset={pendingDatePreset}
          openPill={openPill}
          onTogglePill={togglePill}
          onPresetChange={setPendingDatePreset}
          onClosePill={closePill}
          customStart={customStart}
          onCustomStartChange={onCustomStartChange}
          customEnd={customEnd}
          onCustomEndChange={onCustomEndChange}
        />

        <span className="reports-filter-bar__divider">|</span>

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
                <span className="reports-filter-bar__pill-value">{projectPillValue}</span>
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
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "project" ? (
            <FilterMultiSelectDropdown
              options={projectOptions}
              selectedIds={selectedProjects}
              onToggle={toggleProject}
              search={projectSearch}
              onSearchChange={setProjectSearch}
              searchPlaceholder="Search projects..."
            />
          ) : null}
        </div>

        <span className="reports-filter-bar__divider">|</span>

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
                <span className="reports-filter-bar__pill-value">{memberPillValue}</span>
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
            <span className="reports-filter-bar__caret">▾</span>
          </button>
          {openPill === "member" ? (
            <FilterMultiSelectDropdown
              options={memberOptions}
              selectedIds={selectedMembers}
              onToggle={toggleMember}
              search={memberSearch}
              onSearchChange={setMemberSearch}
              searchPlaceholder="Search members..."
            />
          ) : null}
        </div>

        <button
          type="button"
          className="reports-filter-bar__apply"
          disabled={!enabled || loadingOverview}
          onClick={handleApply}
        >
          {loadingOverview ? "Loading…" : "Apply filters"}
        </button>

        {hasActiveFilters ? (
          <button type="button" className="reports-filter-bar__clear-all" onClick={handleClearAll}>
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
