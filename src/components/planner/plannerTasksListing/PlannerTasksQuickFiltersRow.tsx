import React, { RefObject } from "react";
import moment from "moment";
import { PRIORITY_OPTIONS } from "./plannerTasksListingDomain";
import "./plannerTasksListing.scss";

export type PlannerTasksFilterFormState = Readonly<{
  task_type: { value: string; label: string } | null;
  priority: { value: string; label: string } | null;
  assigned_to: string | null;
  due_date_from: string;
  due_date_to: string;
  project: string;
  assignee: string[];
  status: string;
}>;

export type PlannerTaskFilterPill = Readonly<{
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}>;

type Option = Readonly<{ value: string; label: string }>;

function nextAssigneeListAfterToggle(
  prev: PlannerTasksFilterFormState,
  optionValue: string,
  isCurrentlySelected: boolean,
): PlannerTasksFilterFormState {
  let nextAssignees: string[];
  if (isCurrentlySelected) {
    const index = prev.assignee.indexOf(optionValue);
    nextAssignees =
      index === -1
        ? prev.assignee
        : [...prev.assignee.slice(0, index), ...prev.assignee.slice(index + 1)];
  } else {
    nextAssignees = [...prev.assignee, optionValue];
  }
  return { ...prev, assignee: nextAssignees };
}

function assigneeQuickOptionUpdater(
  optionValue: string,
  isCurrentlySelected: boolean,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => nextAssigneeListAfterToggle(prev, optionValue, isCurrentlySelected);
}

function quickFilterStatusUpdater(
  value: string,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, status: value });
}

function quickFilterTaskTypeUpdater(
  option: Option,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({
    ...prev,
    task_type: { value: option.value, label: option.label },
  });
}

function quickFilterPriorityUpdater(
  option: Option,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({
    ...prev,
    priority: { value: option.value, label: option.label },
  });
}

function quickFilterProjectUpdater(
  value: string,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, project: value });
}

function clearAssigneesUpdater(): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, assignee: [] });
}

function clearTaskTypeQuickFilterUpdater(): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, task_type: null });
}

function clearPriorityQuickFilterUpdater(): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, priority: null });
}

function dueDateTodayUpdater(today: string): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, due_date_from: today, due_date_to: today });
}

function dueDateRangeUpdater(
  from: string,
  to: string,
): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, due_date_from: from, due_date_to: to });
}

function clearDueDatesUpdater(): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, due_date_from: "", due_date_to: "" });
}

function dueDateFromFieldUpdater(value: string): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, due_date_from: value });
}

function dueDateToFieldUpdater(value: string): React.SetStateAction<PlannerTasksFilterFormState> {
  return (prev) => ({ ...prev, due_date_to: value });
}

function QuickOptionButton({
  selected,
  onClick,
  children,
}: Readonly<{
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      className={`ptl-quick-option ${selected ? "ptl-quick-option--selected" : "ptl-quick-option--transparent"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export type PlannerTasksQuickFiltersRowProps = {
  quickFilterRef: RefObject<HTMLDivElement | null>;
  filterPills: readonly PlannerTaskFilterPill[];
  openQuickFilter: string | null;
  fForm: PlannerTasksFilterFormState;
  setFForm: React.Dispatch<React.SetStateAction<PlannerTasksFilterFormState>>;
  setOpenQuickFilter: React.Dispatch<React.SetStateAction<string | null>>;
  projectOptions: readonly Option[];
  assigneeOptions: readonly Option[];
  taskTypeFilterOptions: readonly Option[];
  statusFilterOptions: readonly Option[];
  applyCurrentFilters: () => void;
  resetCurrentFilters: () => void;
};

export function PlannerTasksQuickFiltersRow({
  quickFilterRef,
  filterPills,
  openQuickFilter,
  fForm,
  setFForm,
  setOpenQuickFilter,
  projectOptions,
  assigneeOptions,
  taskTypeFilterOptions,
  statusFilterOptions,
  applyCurrentFilters,
  resetCurrentFilters,
}: Readonly<PlannerTasksQuickFiltersRowProps>) {
  return (
    <div className="ptl-filter-row">
      <div className="gt-filter-pills" ref={quickFilterRef}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {filterPills.map((pill) => (
            <div key={pill.id} className="ptl-quick-pill-wrap">
              <button type="button" className="gt-filter-pill" onClick={pill.onClick}>
                {pill.icon ? <span className="me-1">{pill.icon}</span> : null}
                <span>{pill.label}</span>
              </button>
              {pill.id === "project" && openQuickFilter === "project" ? (
                <div className="ptl-quick-dropdown">
                  {projectOptions.map((option) => (
                    <QuickOptionButton
                      key={option.value}
                      selected={option.value === fForm.project}
                      onClick={() => {
                        setFForm(quickFilterProjectUpdater(option.value));
                        setOpenQuickFilter(null);
                      }}
                    >
                      {option.label}
                    </QuickOptionButton>
                  ))}
                </div>
              ) : null}
              {pill.id === "assigned_to" && openQuickFilter === "assigned_to" ? (
                <div className="ptl-quick-dropdown">
                  <QuickOptionButton
                    selected={fForm.assignee.length === 0}
                    onClick={() => {
                      setFForm(clearAssigneesUpdater());
                      setOpenQuickFilter(null);
                    }}
                  >
                    All assignees
                  </QuickOptionButton>
                  {assigneeOptions.map((option) => {
                    const selected = fForm.assignee.includes(option.value);
                    return (
                      <QuickOptionButton
                        key={option.value}
                        selected={selected}
                        onClick={() => {
                          setFForm(assigneeQuickOptionUpdater(option.value, selected));
                          setOpenQuickFilter(null);
                        }}
                      >
                        {option.label}
                      </QuickOptionButton>
                    );
                  })}
                </div>
              ) : null}
              {pill.id === "task_type" && openQuickFilter === "task_type" ? (
                <div className="ptl-quick-dropdown">
                  <QuickOptionButton
                    selected={!fForm.task_type}
                    onClick={() => {
                      setFForm(clearTaskTypeQuickFilterUpdater());
                      setOpenQuickFilter(null);
                    }}
                  >
                    All task types
                  </QuickOptionButton>
                  {taskTypeFilterOptions.map((option) => {
                    const selected = fForm.task_type?.value === option.value;
                    return (
                      <QuickOptionButton
                        key={option.value}
                        selected={selected}
                        onClick={() => {
                          setFForm(quickFilterTaskTypeUpdater(option));
                          setOpenQuickFilter(null);
                        }}
                      >
                        {option.label}
                      </QuickOptionButton>
                    );
                  })}
                </div>
              ) : null}
              {pill.id === "status" && openQuickFilter === "status" ? (
                <div className="ptl-quick-dropdown">
                  {statusFilterOptions.map((option) => (
                    <QuickOptionButton
                      key={option.value}
                      selected={option.value === fForm.status}
                      onClick={() => {
                        setFForm(quickFilterStatusUpdater(option.value));
                        setOpenQuickFilter(null);
                      }}
                    >
                      {option.label}
                    </QuickOptionButton>
                  ))}
                </div>
              ) : null}
              {pill.id === "priority" && openQuickFilter === "priority" ? (
                <div className="ptl-quick-dropdown">
                  <QuickOptionButton
                    selected={!fForm.priority}
                    onClick={() => {
                      setFForm(clearPriorityQuickFilterUpdater());
                      setOpenQuickFilter(null);
                    }}
                  >
                    All priorities
                  </QuickOptionButton>
                  {PRIORITY_OPTIONS.map((option) => {
                    const selected = fForm.priority?.value === option.value;
                    return (
                      <QuickOptionButton
                        key={option.value}
                        selected={selected}
                        onClick={() => {
                          setFForm(quickFilterPriorityUpdater(option));
                          setOpenQuickFilter(null);
                        }}
                      >
                        {option.label}
                      </QuickOptionButton>
                    );
                  })}
                </div>
              ) : null}
              {pill.id === "due_date" && openQuickFilter === "due_date" ? (
                <div className="ptl-quick-dropdown ptl-quick-dropdown--static">
                  <QuickOptionButton
                    selected={false}
                    onClick={() => {
                      const today = moment().format("YYYY-MM-DD");
                      setFForm(dueDateTodayUpdater(today));
                      setOpenQuickFilter(null);
                    }}
                  >
                    Due today
                  </QuickOptionButton>
                  <QuickOptionButton
                    selected={false}
                    onClick={() => {
                      const from = moment().format("YYYY-MM-DD");
                      const to = moment().add(7, "days").format("YYYY-MM-DD");
                      setFForm(dueDateRangeUpdater(from, to));
                      setOpenQuickFilter(null);
                    }}
                  >
                    Next 7 days
                  </QuickOptionButton>
                  <QuickOptionButton
                    selected={false}
                    onClick={() => {
                      setFForm(clearDueDatesUpdater());
                      setOpenQuickFilter(null);
                    }}
                  >
                    Clear due date
                  </QuickOptionButton>
                  <div className="ptl-quick-divider" />
                  <div className="ptl-quick-date-fields">
                    <label htmlFor="quick-due-date-from" className="ptl-quick-label">
                      Due date from
                    </label>
                    <input
                      id="quick-due-date-from"
                      type="date"
                      className="ptl-quick-date-input"
                      value={fForm.due_date_from || ""}
                      onChange={(e) =>
                        setFForm(dueDateFromFieldUpdater(e.target.value || ""))
                      }
                    />
                    <label htmlFor="quick-due-date-to" className="ptl-quick-label">
                      Due date to
                    </label>
                    <input
                      id="quick-due-date-to"
                      type="date"
                      className="ptl-quick-date-input"
                      value={fForm.due_date_to || ""}
                      onChange={(e) =>
                        setFForm(dueDateToFieldUpdater(e.target.value || ""))
                      }
                    />
                  </div>
                </div>
              ) : null}
              {pill.id === "queue" && openQuickFilter === "queue" ? (
                <div className="ptl-quick-dropdown ptl-quick-dropdown--static ptl-queue-placeholder">
                  Queue quick filters are not configured yet.
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="ptl-filter-actions">
        <button type="button" className="ptl-filled-btn" onClick={applyCurrentFilters}>
          Apply filters
        </button>
        <button type="button" className="ptl-filled-btn" onClick={resetCurrentFilters}>
          Reset filters
        </button>
      </div>
    </div>
  );
}
