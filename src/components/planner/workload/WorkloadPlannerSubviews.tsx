import React from "react";
import { Alert, Badge, Col, Row, Spinner, Table } from "react-bootstrap";
import type {
  WorkloadBoardColumn,
  WorkloadGridCell,
  WorkloadGridData,
  WorkloadGridMember,
  WorkloadSummaryData,
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
  workloadGridCellPercentLabel,
  workloadGridCellVisualVariant,
  workloadMemberAvatarColor,
  workloadCellKey,
  workloadLoadBandLabel,
  workloadMemberInitials,
  WORKLOAD_LOAD_BANDS,
} from "@page-modules/planner/workload/workloadDomain";

const WORKLOAD_BOARD_LEGEND = [
  { label: "On Track", color: "#22c55e" },
  { label: "At Risk", color: "#eab308" },
  { label: "Overdue", color: "#ef4444" },
  { label: "In Progress", color: "#3b82f6" },
  { label: "Done", color: "#38bdf8" },
  { label: "Unassigned", color: "#9ca3af" },
] as const;

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

function legendSwatchColor(band: string): string {
  switch (band) {
    case "available":
      return "#9aa0a6";
    case "incomplete_data":
      return "#f59e0b";
    case "comfortable":
      return "#22c55e";
    case "near_full":
      return "#f97316";
    case "overloaded":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

type WorkloadSummaryCardsProps = Readonly<{
  data: WorkloadSummaryData;
  unassignedCount?: number;
  completedCount?: number;
  onUnassignedClick?: () => void;
}>;

export function WorkloadSummaryCardsRow({
  data,
  unassignedCount = 0,
  completedCount = 0,
  onUnassignedClick,
}: WorkloadSummaryCardsProps) {
  return (
    <Row className="g-3 mb-3 workload-summary-row">
      <Col xs={6} lg={3}>
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Total workload</div>
          <div className="workload-summary-card__value">{data.total_tasks_in_range}</div>
        </div>
      </Col>
      <Col xs={6} lg={3}>
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Overdue tasks</div>
          <div className="workload-summary-card__value workload-summary-card__value--danger">
            {data.overdue_tasks}
          </div>
        </div>
      </Col>
      <Col xs={6} lg={3}>
        <button
          type="button"
          className="workload-summary-card workload-summary-card--action"
          onClick={onUnassignedClick}
          disabled={!onUnassignedClick}
        >
          <div className="workload-summary-card__label">Unassigned tasks</div>
          <div className="workload-summary-card__value workload-summary-card__value--warning">
            {unassignedCount}
          </div>
        </button>
      </Col>
      <Col xs={6} lg={3}>
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Completed tasks</div>
          <div className="workload-summary-card__value workload-summary-card__value--success">
            {completedCount}
          </div>
        </div>
      </Col>
    </Row>
  );
}

export function WorkloadBoardLegendBar() {
  return (
    <div className="workload-board-toolbar mb-3">
      <div className="workload-board-toolbar__legend">
        {WORKLOAD_BOARD_LEGEND.map((item) => (
          <span key={item.label} className="workload-board-toolbar__legend-item">
            <span
              className="workload-board-toolbar__swatch"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function WorkloadLegendRow() {
  return (
    <div className="workload-legend mb-2">
      <span className="text-muted me-2">Legend:</span>
      {WORKLOAD_LOAD_BANDS.map((band) => (
        <span key={band} className="workload-legend__item">
          <span className="workload-legend__swatch" style={{ background: legendSwatchColor(band) }} />
          {workloadLoadBandLabel(band)}
        </span>
      ))}
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
  const barPct = Math.min(100, Math.max(0, cell?.load_percent ?? 0));
  const showUnestimatedDot =
    cell != null && variant !== "empty" && workloadCellHasUnestimated(cell);
  const barFillClass = workloadCellBarFillClass(band);
  const percentLabel = workloadGridCellPercentLabel(barPct, variant);

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
            <div className={`workload-cell__pct workload-cell__pct--${variant}`}>
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
            <th className="workload-grid-table__people">PEOPLE</th>
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

      {!enabled && sessionStatus === "authenticated" ? (
        <Alert variant="warning">
          Your session does not include a phone or extension; workload APIs cannot be called.
        </Alert>
      ) : null}

      {accessForbidden ? (
        <Alert variant="danger">
          You do not have access to this workload view (403). This area is restricted to team owners
          on the server.
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
