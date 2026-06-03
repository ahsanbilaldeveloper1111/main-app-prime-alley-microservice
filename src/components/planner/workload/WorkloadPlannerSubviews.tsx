import React from "react";
import { Alert, Badge, Spinner, Table } from "react-bootstrap";
import type {
  WorkloadBoardColumn,
  WorkloadGridCell,
  WorkloadGridData,
  WorkloadGridMember,
  WorkloadSummaryData,
  WorkloadSummaryMember,
} from "@utils/tasks";
import {
  formatWorkloadGridDayHeader,
  formatWorkloadMemberLabel,
  formatWorkloadMinutes,
  formatWorkloadTaskEstimate,
  formatWorkloadPercent,
  isSameCalendarDay,
  workloadCellBandClass,
  workloadCellBarFillClass,
  workloadCellHasUnestimated,
  isWorkloadCellOverCapacity,
  workloadGridCellPercentLabel,
  workloadGridCellVisualVariant,
  workloadMemberAvatarColor,
  workloadCellKey,
  workloadLoadBandLabel,
  workloadMemberInitials,
  WORKLOAD_GRID_LEGEND_ITEMS,
  WORKLOAD_PRIORITY_LEGEND_ITEMS,
  workloadPriorityBdgTone,
  workloadPriorityLabel,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadBdgTone } from "@page-modules/planner/workload/workloadDomain";

const WORKLOAD_BOARD_STATUS_LEGEND = [
  { label: "On Track", color: "#22c55e" },
  { label: "At Risk", color: "#eab308" },
  { label: "Overdue", color: "#ef4444" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Done", color: "#38bdf8" },
  { label: "Unassigned", color: "#9ca3af" },
] as const;

type WorkloadBdgProps = Readonly<{
  tone: WorkloadBdgTone;
  children: React.ReactNode;
  className?: string;
}>;

export function WorkloadBdg({ tone, children, className }: WorkloadBdgProps) {
  const classes = ["workload-bdg", `workload-bdg--${tone}`, className].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}

export function WorkloadPriorityBadge({ priority }: Readonly<{ priority: unknown }>) {
  return (
    <WorkloadBdg tone={workloadPriorityBdgTone(priority)}>
      {workloadPriorityLabel(priority)}
    </WorkloadBdg>
  );
}

type WorkloadMemberIdentityProps = Readonly<{
  extensionNumber: string;
  hierarchyExtensions?: unknown[] | null;
  member?: Pick<WorkloadGridMember, "name" | "display_name" | "role"> | null;
  isOwner?: boolean;
  displayMode?: "stacked" | "inline";
}>;

export function WorkloadMemberIdentity({
  extensionNumber,
  hierarchyExtensions,
  member,
  isOwner,
  displayMode = "stacked",
}: WorkloadMemberIdentityProps) {
  const ext = extensionNumber.trim();
  const avatarColor = workloadMemberAvatarColor(ext);
  const initials = workloadMemberInitials(ext, hierarchyExtensions, member);

  if (displayMode === "inline") {
    const label = formatWorkloadMemberLabel(ext, hierarchyExtensions, member);
    return (
      <div className="workload-member-cell workload-member-cell--inline">
        <span className="workload-member-cell__avatar" style={{ backgroundColor: avatarColor }}>
          {initials}
        </span>
        <div className="workload-member-cell__inline-text">
          <span className="workload-member-cell__name">{label}</span>
          {isOwner ? (
            <Badge bg="secondary" className="workload-member-cell__badge ms-1">
              Owner
            </Badge>
          ) : null}
        </div>
      </div>
    );
  }

  const label = formatWorkloadMemberLabel(ext, hierarchyExtensions, member);
  const roleLabel = member?.role?.trim();

  return (
    <div className="workload-member-cell">
      <span className="workload-member-cell__avatar" style={{ backgroundColor: avatarColor }}>
        {initials}
      </span>
      <div className="workload-member-cell__text">
        <div className="workload-member-cell__name">{label}</div>
        {roleLabel ? <div className="workload-member-cell__role">{roleLabel}</div> : null}
        {isOwner ? (
          <Badge bg="secondary" className="workload-member-cell__badge">
            Owner
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

type WorkloadSummaryCardsProps = Readonly<{
  data: WorkloadSummaryData;
}>;

export function WorkloadSummaryCardsRow({ data }: WorkloadSummaryCardsProps) {
  return (
    <div className="workload-summary-row">
      <div className="workload-summary-card">
        <div className="workload-summary-card__value">{data.total_tasks_this_week}</div>
        <div className="workload-summary-card__label">Tasks this week</div>
      </div>
      <div className="workload-summary-card">
        <div className="workload-summary-card__value">{data.overloaded_members}</div>
        <div className="workload-summary-card__label">Overloaded members</div>
      </div>
      <div className="workload-summary-card">
        <div className="workload-summary-card__value">{data.unestimated_tasks}</div>
        <div className="workload-summary-card__label">Unestimated tasks</div>
      </div>
      <div className="workload-summary-card">
        <div className="workload-summary-card__value">{data.critical_priority_tasks}</div>
        <div className="workload-summary-card__label">Critical priority</div>
      </div>
    </div>
  );
}

export function WorkloadBoardLegendBar() {
  return (
    <div className="workload-board-toolbar">
      <div className="workload-board-toolbar__legend-group">
        <div className="workload-board-toolbar__legend">
          {WORKLOAD_GRID_LEGEND_ITEMS.slice(0, 3).map((item) => (
            <span key={item.id} className="workload-board-toolbar__legend-item" style={{ color: "#718096" }}>
              <span className="workload-board-toolbar__swatch" style={{ backgroundColor: item.swatch }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div className="workload-board-toolbar__legend-group">
        <div className="workload-board-toolbar__legend">
          <span className="workload-board-toolbar__legend-item" style={{ color: "#718096" }}>
            <span className="workload-board-toolbar__swatch" style={{ backgroundColor: "#ea580c" }} />
            <span>Has unestimated tasks</span>
          </span>
          <span className="workload-board-toolbar__legend-item" style={{ color: "#718096" }}>
            <i className="ti ti-building" style={{ fontSize: "11px", color: "#0f766e", marginRight: "4px" }} />
            <span>Org Tasks included</span>
          </span>
          <span className="workload-board-toolbar__legend-item" style={{ color: "#718096" }}>
            <span style={{ fontSize: "11px", marginRight: "4px", color: "#718096" }}>ⓘ</span>
            <span>Has personal todos</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function WorkloadLegendSwatch({ item }: Readonly<{ item: (typeof WORKLOAD_GRID_LEGEND_ITEMS)[number] }>) {
  return (
    <span className="workload-legend__swatch" style={{ background: item.swatch }} aria-hidden />
  );
}

export function WorkloadLegendRow({
  mainView,
  showWorkloadPerDay,
  onToggleWorkloadPerDay,
}: Readonly<{
  mainView: "grid" | "board";
  showWorkloadPerDay: boolean;
  onToggleWorkloadPerDay: () => void;
}>) {
  const hint =
    mainView === "grid"
      ? "Click any cell to see day detail"
      : "Drag cards to reassign · Use Move to reschedule";

  return (
    <div className="workload-legend workload-legend--toolbar">
      <div className="workload-legend__items">
        {WORKLOAD_GRID_LEGEND_ITEMS.map((item) => (
          <span key={item.id} className="workload-legend__item">
            <WorkloadLegendSwatch item={item} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="workload-legend__actions">
        <button
          type="button"
          className={`workload-legend__per-day-toggle ${showWorkloadPerDay ? "is-active" : ""}`}
          onClick={onToggleWorkloadPerDay}
        >
          {showWorkloadPerDay ? "Hide daily grid" : "Show workload per day"}
        </button>
        <span className="workload-legend__hint">{hint}</span>
      </div>
    </div>
  );
}

type WorkloadPeriodMembersPanelProps = Readonly<{
  members: WorkloadSummaryMember[];
  hierarchyExtensions?: unknown[] | null;
}>;

export function WorkloadPeriodMembersPanel({
  members,
  hierarchyExtensions,
}: WorkloadPeriodMembersPanelProps) {
  if (members.length === 0) {
    return <p className="small text-muted mb-3">No member workload data for this range.</p>;
  }
  return (
    <div className="workload-period-panel mb-3">
      {members.map((member) => {
        const band = member.load_band ?? "available";
        return (
          <div key={member.extension_number} className="workload-period-panel__row">
            <WorkloadMemberIdentity
              extensionNumber={member.extension_number}
              hierarchyExtensions={hierarchyExtensions}
              displayMode="inline"
            />
            <span className={`workload-period-panel__band workload-cell--${band.replace(/[^a-z0-9_-]/gi, "")}`}>
              {workloadLoadBandLabel(band)}
            </span>
            <span className="workload-period-panel__pct">
              {formatWorkloadPercent(member.load_percent ?? 0)}
            </span>
            <span className="workload-period-panel__meta text-muted">
              {member.task_count ?? 0} tasks
              {(member.unestimated_task_count ?? 0) > 0
                ? ` · ${member.unestimated_task_count} unestimated`
                : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type WorkloadGridCellButtonProps = Readonly<{
  cell: WorkloadGridCell | undefined;
  band: string;
  onSelect: () => void;
}>;

function WorkloadGridCellButton({ cell, band, onSelect }: WorkloadGridCellButtonProps) {
  const variant = workloadGridCellVisualVariant(cell);
  const estimatedMinutes = cell?.estimated_minutes ?? 0;
  const loadPercent = Math.max(0, cell?.load_percent ?? 0);
  const barPct = Math.min(100, loadPercent);
  const isOver = isWorkloadCellOverCapacity(loadPercent);
  const showUnestimatedDot =
    cell != null && variant !== "empty" && workloadCellHasUnestimated(cell);
  const barFillClass = workloadCellBarFillClass(band);
  const percentLabel = workloadGridCellPercentLabel(loadPercent, variant);

  return (
    <button
      type="button"
      className={`workload-cell-btn ${workloadCellBandClass(band)} workload-cell-btn--${variant}`}
      onClick={onSelect}
    >
      <span className={`workload-cell-card workload-cell-card--${variant}`}>
        {variant === "empty" ? (
          <span className="workload-cell-empty">—</span>
        ) : (
          <>
            <div className="workload-cell__top">
              <span
                className={`workload-cell__time workload-cell__time--${variant}`}
              >
                {formatWorkloadMinutes(estimatedMinutes)}
              </span>
              {showUnestimatedDot ? (
                <span
                  className="workload-unestimated-dot workload-cell__unest-dot--inline"
                  title={`${cell.unestimated_count} task${cell.unestimated_count === 1 ? "" : "s"} without estimate`}
                  aria-label={`${cell.unestimated_count} unestimated tasks`}
                />
              ) : null}
            </div>
            <div
              className={`workload-cell__pct workload-cell__pct--${variant} ${
                isOver ? "workload-cell__pct--over" : ""
              }`}
            >
              {percentLabel}
            </div>
            <div className="workload-cell__bar">
              <div
                className={`workload-cell__bar-fill ${barFillClass}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </>
        )}
      </span>
    </button>
  );
}

type WorkloadGridPanelProps = Readonly<{
  gridData: WorkloadGridData;
  cellMap: Map<string, WorkloadGridCell>;
  hierarchyExtensions?: unknown[] | null;
  onSelectCell: (extension: string, date: string) => void;
}>;

export function WorkloadGridPanel({
  gridData,
  cellMap,
  hierarchyExtensions,
  onSelectCell,
}: WorkloadGridPanelProps) {
  return (
    <div className="workload-grid-wrap">
      <Table bordered responsive className="workload-grid-table mb-0">
        <thead>
          <tr>
            <th className="workload-grid-table__people">Member</th>
            {gridData.days.map((d) => {
              const { weekday, dateLabel } = formatWorkloadGridDayHeader(d);
              return (
                <th
                  key={d}
                  className={`workload-grid-table__day ${
                    isSameCalendarDay(d) ? "workload-grid-table__day--today" : ""
                  }`}
                >
                  <span className="workload-grid-table__weekday">{weekday}</span>
                  <span className="workload-grid-table__date">{dateLabel}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {gridData.members.map((member) => (
            <tr key={member.extension_number}>
              <td className="workload-grid-table__people">
                <WorkloadMemberIdentity
                  extensionNumber={member.extension_number}
                  hierarchyExtensions={hierarchyExtensions}
                  member={member}
                  isOwner={member.is_owner}
                />
              </td>
              {gridData.days.map((day) => {
                const cell = cellMap.get(workloadCellKey(member.extension_number, day));
                const band = cell?.load_band ?? "available";
                const isToday = isSameCalendarDay(day);
                return (
                  <td
                    key={`${member.extension_number}-${day}`}
                    className={`workload-grid-table__slot ${isToday ? "workload-grid-table__slot--today" : ""}`}
                  >
                    <WorkloadGridCellButton
                      cell={cell}
                      band={band}
                      onSelect={() => onSelectCell(member.extension_number, day)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

type WorkloadPlannerAlertStackProps = Readonly<{
  sessionStatus: string;
  enabled: boolean;
  teamMemberOnly?: boolean;
  accessForbidden: boolean;
  summaryError: unknown;
  summaryHasError: boolean;
  gridError: unknown;
  gridHasError: boolean;
  boardError: unknown;
  boardHasError: boolean;
  mainView: "grid" | "board";
  workloadErrorMessage: (err: unknown) => string;
}>;

export function WorkloadPlannerAlertStack({
  sessionStatus,
  enabled,
  teamMemberOnly = false,
  accessForbidden,
  summaryError,
  summaryHasError,
  gridError,
  gridHasError,
  boardError,
  boardHasError,
  mainView,
  workloadErrorMessage,
}: WorkloadPlannerAlertStackProps) {
  return (
    <>
      {sessionStatus === "loading" ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : null}

      {!enabled && sessionStatus === "authenticated" && !teamMemberOnly ? (
        <Alert variant="warning">
          Your session does not include a phone or extension; workload APIs cannot be called.
        </Alert>
      ) : null}

      {teamMemberOnly ? (
        <Alert variant="info">
          Workload is a manager-only view (team owners). Use{" "}
          <a href="/planner/my-tasks">My Day</a> for your personal task plan.
        </Alert>
      ) : null}

      {accessForbidden ? (
        <Alert variant="danger">
          You do not have access to this workload view (403). It is restricted to team managers
          (owners) on the server.
        </Alert>
      ) : null}

      {summaryHasError && !accessForbidden ? (
        <Alert variant="danger">{workloadErrorMessage(summaryError)}</Alert>
      ) : null}

      {gridHasError && !accessForbidden && mainView === "grid" ? (
        <Alert variant="danger">{workloadErrorMessage(gridError)}</Alert>
      ) : null}

      {boardHasError && !accessForbidden && mainView === "board" ? (
        <Alert variant="danger">{workloadErrorMessage(boardError)}</Alert>
      ) : null}
    </>
  );
}

export function WorkloadBoardColumns({
  columns,
  hierarchyExtensions,
}: Readonly<{
  columns: WorkloadBoardColumn[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  return (
    <div className="workload-board">
      {columns.map((col) => {
        const barPct = Math.min(100, Math.max(0, col.load_percent));
        return (
          <div key={col.extension_number} className="workload-board__column">
            <div className="workload-board__column-head">
              <WorkloadMemberIdentity
                extensionNumber={col.extension_number}
                hierarchyExtensions={hierarchyExtensions}
                member={col}
                isOwner={col.is_owner}
              />
              <div className="small text-muted mb-1">
                {col.task_count} tasks · {formatWorkloadMinutes(col.estimated_minutes)} ·{" "}
                {formatWorkloadPercent(col.load_percent)}
              </div>
              <Badge bg="light" text="dark" className="mb-1 border small fw-normal">
                {workloadLoadBandLabel(col.load_band)}
              </Badge>
              <div className="workload-cell__bar">
                <div className="workload-cell__bar-fill" style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="workload-board__column-body">
              {col.tasks.map((task) => (
                <div key={task.id} className="workload-task-card">
                  <div className="workload-task-card__title">{task.title}</div>
                  <div className="small text-muted">
                    {task.due_date ?? "—"} · {formatWorkloadTaskEstimate(task)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
