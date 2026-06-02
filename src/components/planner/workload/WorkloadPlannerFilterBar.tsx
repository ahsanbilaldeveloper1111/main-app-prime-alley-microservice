import React, { useMemo, useRef, useState } from "react";
import { Inbox } from "lucide-react";
import type { AssigneeMatch, WorkloadRangePreset } from "@utils/tasks";
import type {
  WorkloadPriorityFilterValue,
  WorkloadProjectFilterValue,
} from "@page-modules/planner/workload/workloadDomain";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadProjectOption } from "./WorkloadPlannerChrome";

function resolveRangePillLabel(range: WorkloadRangePreset): string {
  if (range === "this_week") return "This week";
  if (range === "next_week") return "Next week";
  return "Custom range";
}

function resolveProjectFilterPillLabel(
  projectFilter: WorkloadProjectFilterValue,
  projectOptions: WorkloadProjectOption[],
): string {
  if (projectFilter === "all") return "All projects";
  if (projectFilter === "none") return "No project (org)";
  return projectOptions.find((p) => p.id === projectFilter)?.name ?? "Project";
}

function resolvePriorityFilterPillLabel(
  priorityFilter: WorkloadPriorityFilterValue,
): string {
  if (priorityFilter === "all") return "All priority";
  if (priorityFilter === "critical") return "Critical only";
  if (priorityFilter === "high_plus") return "High+";
  return "Medium+";
}

function FilterPillClearButton({
  ariaLabel,
  onClear,
}: Readonly<{
  ariaLabel: string;
  onClear: () => void;
}>) {
  return (
    <button
      type="button"
      className="workload-filter-bar__pill-x"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
    >
      ×
    </button>
  );
}

function useFilterDropdown() {
  const [openId, setOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (ref.current && !ref.current.contains(target)) {
        setOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));
  const close = () => setOpenId(null);
  return { openId, toggle, close, ref };
}

export type WorkloadPlannerFilterBarProps = Readonly<{
  range: WorkloadRangePreset;
  onRangeChange: (value: WorkloadRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  customRangeInvalid: boolean;
  assigneeMatch: AssigneeMatch;
  onAssigneeMatchChange: (value: AssigneeMatch) => void;
  projectFilter: WorkloadProjectFilterValue;
  onProjectFilterChange: (value: WorkloadProjectFilterValue) => void;
  projectOptions: WorkloadProjectOption[];
  memberFilter: string;
  onMemberFilterChange: (value: string) => void;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  priorityFilter: WorkloadPriorityFilterValue;
  onPriorityFilterChange: (value: WorkloadPriorityFilterValue) => void;
  enabled: boolean;
  unassignedCount: number | undefined;
  onOpenUnassigned: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onApply: () => void;
  applyDisabled: boolean;
  isApplying: boolean;
}>;

export function WorkloadPlannerFilterBar({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  customRangeInvalid,
  assigneeMatch,
  onAssigneeMatchChange,
  projectFilter,
  onProjectFilterChange,
  projectOptions,
  memberFilter,
  onMemberFilterChange,
  memberExtensions,
  hierarchyExtensions,
  priorityFilter,
  onPriorityFilterChange,
  enabled,
  unassignedCount,
  onOpenUnassigned,
  onClearFilters,
  hasActiveFilters,
  onApply,
  applyDisabled,
  isApplying,
}: WorkloadPlannerFilterBarProps) {
  const memberOptions = useMemo(() => {
    const options = [{ value: "all", label: "All members" }];
    for (const ext of memberExtensions) {
      options.push({
        value: ext,
        label: formatWorkloadMemberLabel(ext, hierarchyExtensions),
      });
    }
    return options;
  }, [hierarchyExtensions, memberExtensions]);
  const { openId, toggle, close, ref } = useFilterDropdown();

  return (
    <div className="workload-filter-bar" ref={ref}>
      <div className="workload-filter-bar__inner">

        <div className="workload-filter-bar__pill-wrap">
          <button
            type="button"
            className={`workload-filter-bar__pill-btn${range === "this_week" ? "" : " workload-filter-bar__pill-btn--active"}`}
            disabled={!enabled}
            onClick={() => toggle("range")}
          >
            {resolveRangePillLabel(range)}
            {range === "this_week" ? (
              <span className="workload-filter-bar__caret">▾</span>
            ) : (
              <FilterPillClearButton
                ariaLabel="Clear range filter"
                onClear={() => {
                  onRangeChange("this_week");
                  close();
                }}
              />
            )}
          </button>
          {openId === "range" && (
            <div className="workload-filter-bar__dropdown">
              {([
                { value: "this_week", label: "This week" },
                { value: "next_week", label: "Next week" },
                { value: "custom", label: "Custom range" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${range === opt.value ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onRangeChange(opt.value); close(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {range === "custom" && (
          <>
            <input
              type="date"
              className={`workload-filter-bar__date-input${customRangeInvalid ? " workload-filter-bar__date-input--invalid" : ""}`}
              value={customStart}
              disabled={!enabled}
              onChange={(e) => onCustomStartChange(e.target.value)}
            />
            <span className="workload-filter-bar__date-sep">—</span>
            <input
              type="date"
              className={`workload-filter-bar__date-input${customRangeInvalid ? " workload-filter-bar__date-input--invalid" : ""}`}
              value={customEnd}
              disabled={!enabled}
              onChange={(e) => onCustomEndChange(e.target.value)}
            />
          </>
        )}

        <div className="workload-filter-bar__pill-wrap">
          <button
            type="button"
            className={`workload-filter-bar__pill-btn${projectFilter === "all" ? "" : " workload-filter-bar__pill-btn--active"}`}
            disabled={!enabled}
            onClick={() => toggle("project")}
          >
            {resolveProjectFilterPillLabel(projectFilter, projectOptions)}
            {projectFilter === "all" ? (
              <span className="workload-filter-bar__caret">▾</span>
            ) : (
              <FilterPillClearButton
                ariaLabel="Clear project filter"
                onClear={() => {
                  onProjectFilterChange("all");
                  close();
                }}
              />
            )}
          </button>
          {openId === "project" && (
            <div className="workload-filter-bar__dropdown">
              {([
                { value: "all", label: "All projects" },
                { value: "none", label: "No project (org)" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${projectFilter === opt.value ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onProjectFilterChange(opt.value); close(); }}
                >
                  {opt.label}
                </button>
              ))}
              {projectOptions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${projectFilter === p.id ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onProjectFilterChange(p.id); close(); }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="workload-filter-bar__pill-wrap">
          <button
            type="button"
            className={`workload-filter-bar__pill-btn${memberFilter === "all" ? "" : " workload-filter-bar__pill-btn--active"}`}
            disabled={!enabled}
            onClick={() => toggle("member")}
          >
            {memberOptions.find((o) => o.value === memberFilter)?.label ?? "All members"}
            {memberFilter === "all" ? (
              <span className="workload-filter-bar__caret">▾</span>
            ) : (
              <FilterPillClearButton
                ariaLabel="Clear member filter"
                onClear={() => {
                  onMemberFilterChange("all");
                  close();
                }}
              />
            )}
          </button>
          {openId === "member" && (
            <div className="workload-filter-bar__dropdown">
              {memberOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${memberFilter === opt.value ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onMemberFilterChange(opt.value); close(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="workload-filter-bar__pill-wrap">
          <button
            type="button"
            className={`workload-filter-bar__pill-btn${priorityFilter === "all" ? "" : " workload-filter-bar__pill-btn--active"}`}
            disabled={!enabled}
            onClick={() => toggle("priority")}
          >
            {resolvePriorityFilterPillLabel(priorityFilter)}
            {priorityFilter === "all" ? (
              <span className="workload-filter-bar__caret">▾</span>
            ) : (
              <FilterPillClearButton
                ariaLabel="Clear priority filter"
                onClear={() => {
                  onPriorityFilterChange("all");
                  close();
                }}
              />
            )}
          </button>
          {openId === "priority" && (
            <div className="workload-filter-bar__dropdown">
              {([
                { value: "all", label: "All priority" },
                { value: "critical", label: "Critical only" },
                { value: "high_plus", label: "High+" },
                { value: "medium_plus", label: "Medium+" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${priorityFilter === opt.value ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onPriorityFilterChange(opt.value); close(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="workload-filter-bar__pill-wrap">
          <button
            type="button"
            className={`workload-filter-bar__pill-btn${assigneeMatch === "primary" ? "" : " workload-filter-bar__pill-btn--active"}`}
            disabled={!enabled}
            onClick={() => toggle("assignee")}
          >
            {assigneeMatch === "primary" ? "Primary assignee" : "Any assignee"}
            {assigneeMatch === "primary" ? (
              <span className="workload-filter-bar__caret">▾</span>
            ) : (
              <FilterPillClearButton
                ariaLabel="Clear assignee filter"
                onClear={() => {
                  onAssigneeMatchChange("primary");
                  close();
                }}
              />
            )}
          </button>
          {openId === "assignee" && (
            <div className="workload-filter-bar__dropdown">
              {([
                { value: "primary", label: "Primary assignee" },
                { value: "any", label: "Any assignee" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`workload-filter-bar__dropdown-item${assigneeMatch === opt.value ? " workload-filter-bar__dropdown-item--active" : ""}`}
                  onClick={() => { onAssigneeMatchChange(opt.value); close(); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="workload-filter-bar__sep" aria-hidden="true" />

        <button
          type="button"
          className="workload-filter-bar__apply"
          disabled={applyDisabled}
          onClick={onApply}
        >
          {isApplying ? "Applying…" : "Apply"}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="workload-filter-bar__clear"
            disabled={!enabled}
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        )}

        <button
          type="button"
          className="workload-filter-bar__unassigned"
          disabled={!enabled}
          onClick={onOpenUnassigned}
        >
          <Inbox size={15} aria-hidden />
          Unassigned
          {unassignedCount != null && unassignedCount > 0 && (
            <span className="workload-filter-bar__badge">{unassignedCount}</span>
          )}
        </button>

      </div>
    </div>
  );
}
