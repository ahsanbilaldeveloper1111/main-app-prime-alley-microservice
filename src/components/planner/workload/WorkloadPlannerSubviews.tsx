import React from "react";
import { Alert, Badge, Col, Row, Spinner, Table } from "react-bootstrap";
import type {
  WorkloadBoardColumn,
  WorkloadGridCell,
  WorkloadGridData,
  WorkloadSummaryData,
} from "@utils/tasks";
import {
  formatWorkloadDayHeader,
  formatWorkloadMinutes,
  formatWorkloadPercent,
  isSameCalendarDay,
  memberInitials,
  workloadCellBandClass,
  workloadCellKey,
  workloadLoadBandLabel,
  WORKLOAD_LOAD_BANDS,
} from "@page-modules/planner/workload/workloadDomain";

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

type WorkloadSummaryCardsProps = Readonly<{ data: WorkloadSummaryData }>;

export function WorkloadSummaryCardsRow({ data }: WorkloadSummaryCardsProps) {
  return (
    <Row className="g-3 mb-3">
      <Col xs={6} lg={3}>
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Total tasks in range</div>
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
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Under-allocated cells</div>
          <div className="workload-summary-card__value workload-summary-card__value--warning">
            {data.under_allocated_cells}
          </div>
        </div>
      </Col>
      <Col xs={6} lg={3}>
        <div className="workload-summary-card">
          <div className="workload-summary-card__label">Over-allocated cells</div>
          <div className="workload-summary-card__value workload-summary-card__value--danger">
            {data.over_allocated_cells}
          </div>
        </div>
      </Col>
    </Row>
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

type WorkloadGridPanelProps = Readonly<{
  gridData: WorkloadGridData;
  cellMap: Map<string, WorkloadGridCell>;
  onSelectCell: (extension: string, date: string) => void;
}>;

export function WorkloadGridPanel({ gridData, cellMap, onSelectCell }: WorkloadGridPanelProps) {
  return (
    <div className="workload-grid-wrap">
      <Table bordered responsive className="workload-grid-table mb-0">
        <thead>
          <tr>
            <th>Members</th>
            {gridData.days.map((d) => (
              <th
                key={d}
                className={isSameCalendarDay(d) ? "workload-grid-table__day--today" : undefined}
              >
                {formatWorkloadDayHeader(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gridData.members.map((member) => (
            <tr key={member.extension_number}>
              <td>
                <div className="workload-member-cell">
                  <div className="workload-member-cell__avatar">
                    {memberInitials(member.extension_number)}
                  </div>
                  <div>
                    <div className="workload-member-cell__ext">{member.extension_number}</div>
                    {member.is_owner ? (
                      <Badge bg="secondary" className="workload-member-cell__badge">
                        Owner
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </td>
              {gridData.days.map((day) => {
                const cell = cellMap.get(workloadCellKey(member.extension_number, day));
                const band = cell?.load_band ?? "available";
                const barPct = Math.min(100, Math.max(0, cell?.load_percent ?? 0));
                const showUnestLine =
                  cell &&
                  cell.task_count > 0 &&
                  (cell.has_unestimated || band === "incomplete_data");
                return (
                  <td key={`${member.extension_number}-${day}`} className="p-0 align-middle">
                    <button
                      type="button"
                      className={`workload-cell-btn ${workloadCellBandClass(band)}`}
                      onClick={() => onSelectCell(member.extension_number, day)}
                    >
                      {cell ? (
                        <>
                          <div className="workload-cell__time">
                            {showUnestLine
                              ? `${formatWorkloadMinutes(cell.estimated_minutes)} + ${cell.unestimated_count} unest.`
                              : formatWorkloadMinutes(cell.estimated_minutes)}
                          </div>
                          <div className="workload-cell__meta">
                            {cell.task_count} task{cell.task_count === 1 ? "" : "s"} ·{" "}
                            {formatWorkloadPercent(cell.load_percent)}
                          </div>
                          <div className="workload-cell__bar">
                            <div className="workload-cell__bar-fill" style={{ width: `${barPct}%` }} />
                          </div>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </button>
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

export function WorkloadBoardColumns({ columns }: Readonly<{ columns: WorkloadBoardColumn[] }>) {
  return (
    <div className="workload-board">
      {columns.map((col) => {
        const barPct = Math.min(100, Math.max(0, col.load_percent));
        return (
          <div key={col.extension_number} className="workload-board__column">
            <div className="workload-board__column-head">
              <div className="d-flex align-items-center gap-2 mb-1">
                <div className="workload-member-cell__avatar">{memberInitials(col.extension_number)}</div>
                <strong>{col.extension_number}</strong>
              </div>
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
                    {task.due_date ?? "—"} · {formatWorkloadMinutes(task.estimated_duration_minutes ?? 0)}
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
