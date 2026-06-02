import React, { useState } from "react";
import {
  Alert,
  Button,
  Form,
  Modal,
  Offcanvas,
  Spinner,
} from "react-bootstrap";
import { AlertTriangle, Clock } from "lucide-react";
import type {
  WorkloadDayData,
  WorkloadGridCell,
  WorkloadGridMember,
  WorkloadTaskCard,
} from "@utils/tasks";
import {
  formatWorkloadDayDetailDate,
  formatWorkloadDayTotalSummary,
  formatWorkloadMemberLabel,
  formatWorkloadMinutes,
  formatWorkloadPercent,
  formatWorkloadShortDueDate,
  isWorkloadOrganizationTask,
  formatWorkloadTaskEstimate,
  isWorkloadTaskUnestimated,
  workloadDayCapacityMinutes,
  workloadMemberBaseName,
  workloadMemberInitials,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";
import { WorkloadBdg, WorkloadPriorityBadge } from "./WorkloadPlannerSubviews";

type DayQuerySlice = Readonly<{
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: WorkloadDayData | undefined;
}>;

type WorkloadDayOffcanvasProps = Readonly<{
  selected: {
    extension: string;
    date: string;
    member?: Pick<WorkloadGridMember, "name" | "display_name">;
    cell?: WorkloadGridCell;
  } | null;
  onClose: () => void;
  dayQuery: DayQuerySlice;
  onReassign: (task: WorkloadTaskCard) => void;
  onReschedule: (task: WorkloadTaskCard) => void;
  onMarkDone: (task: WorkloadTaskCard) => void;
  markDoneTaskId: number | null;
  onSaveEstimate: (task: WorkloadTaskCard, minutes: number) => void;
  estimateSavingTaskId: number | null;
  formatError: (err: unknown) => string;
  hierarchyExtensions?: unknown[] | null;
}>;

type WorkloadDayTaskCardProps = Readonly<{
  task: WorkloadTaskCard;
  onReassign: (task: WorkloadTaskCard) => void;
  onReschedule: (task: WorkloadTaskCard) => void;
  onMarkDone: (task: WorkloadTaskCard) => void;
  isMarkingDone: boolean;
  onSaveEstimate: (task: WorkloadTaskCard, minutes: number) => void;
  isSavingEstimate: boolean;
}>;

function resolveRescheduleCurrentLabel(
  currentDate: string | undefined,
  task: WorkloadTaskCard | null,
): string {
  if (currentDate) return formatWorkloadDayDetailDate(currentDate);
  const dueSlice = task?.due_date?.slice(0, 10);
  if (dueSlice) return formatWorkloadDayDetailDate(dueSlice);
  return "—";
}

function WorkloadDayTaskMarkDoneButton({
  task,
  isMarkingDone,
  onMarkDone,
}: Readonly<{
  task: WorkloadTaskCard;
  isMarkingDone: boolean;
  onMarkDone: (task: WorkloadTaskCard) => void;
}>) {
  if (task.is_completed) return null;
  return (
    <button
      type="button"
      className="workload-day-action-btn workload-day-action-btn--success"
      disabled={isMarkingDone}
      onClick={() => onMarkDone(task)}
    >
      {isMarkingDone ? "Saving…" : "Mark done"}
    </button>
  );
}

function WorkloadDayTaskCard({
  task,
  onReassign,
  onReschedule,
  onMarkDone,
  isMarkingDone,
  onSaveEstimate,
  isSavingEstimate,
}: WorkloadDayTaskCardProps) {
  const [estimateDraft, setEstimateDraft] = useState("");
  const [estimateHoursDraft, setEstimateHoursDraft] = useState("");
  const unestimated = isWorkloadTaskUnestimated(task);
  const showOrgBadge = isWorkloadOrganizationTask(task);
  const projectLabel = workloadTaskProjectLabel(task);
  const dueDateLabel = task.due_date ? formatWorkloadShortDueDate(task.due_date) : null;

  const handleSaveEstimate = () => {
    const totalMinutes = (Number(estimateHoursDraft || 0) * 60) + Number(estimateDraft || 0);
    if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return;
    onSaveEstimate(task, totalMinutes);
    setEstimateDraft("");
    setEstimateHoursDraft("");
  };

  return (
    <div className="workload-day-task-card">
      <div className="workload-day-task-card__title-row">
        <div className="workload-day-task-card__title-wrap">
          <div className="workload-day-task-card__title">{task.title}</div>
          {unestimated ? (
            <span
              className="workload-unestimated-dot"
              title="No estimate"
              aria-label="No estimate"
            />
          ) : null}
        </div>
        {showOrgBadge ? (
          <WorkloadBdg tone="green">
            <i className="ti ti-building" style={{ fontSize: "10px" }} aria-hidden />
            Org
          </WorkloadBdg>
        ) : null}
      </div>

      <div className="workload-day-task-card__tags">
        <WorkloadPriorityBadge priority={task.priority} />
        {task.status_name ? (
          <WorkloadBdg tone="gray">{task.status_name}</WorkloadBdg>
        ) : null}
        {!showOrgBadge && projectLabel && projectLabel !== "—" && projectLabel !== "Personal" ? (
          <WorkloadBdg tone="gray">{projectLabel}</WorkloadBdg>
        ) : null}
        {dueDateLabel ? (
          <WorkloadBdg tone={task.is_overdue ? "red" : "gray"}>
            {dueDateLabel}
          </WorkloadBdg>
        ) : (
          <WorkloadBdg tone="gray">No due date</WorkloadBdg>
        )}
        {unestimated ? (
          <WorkloadBdg tone="orange">
            <AlertTriangle size={10} aria-hidden />
            No est.
          </WorkloadBdg>
        ) : (
          <WorkloadBdg tone="gray">
            <Clock size={10} aria-hidden />
            {formatWorkloadTaskEstimate(task)}
          </WorkloadBdg>
        )}
      </div>

      {unestimated ? (
        <div className="workload-day-estimate-form">
          <span className="workload-day-estimate-form__label">Add time estimate:</span>
          <div className="workload-day-estimate-form__row">
            <input
              type="number"
              min={0}
              className="workload-day-estimate-form__input"
              placeholder="hrs"
              value={estimateHoursDraft}
              onChange={(e) => setEstimateHoursDraft(e.target.value)}
              disabled={isSavingEstimate}
            />
            <span className="workload-day-estimate-form__unit">h</span>
            <input
              type="number"
              min={0}
              max={59}
              className="workload-day-estimate-form__input"
              placeholder="mins"
              value={estimateDraft}
              onChange={(e) => setEstimateDraft(e.target.value)}
              disabled={isSavingEstimate}
            />
            <span className="workload-day-estimate-form__unit">m</span>
            <button
              type="button"
              className="workload-day-estimate-form__save-btn"
              disabled={isSavingEstimate || (estimateDraft.trim() === "" && estimateHoursDraft.trim() === "")}
              onClick={handleSaveEstimate}
            >
              {isSavingEstimate ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="workload-day-task-card__actions">
        <button type="button" className="workload-day-action-btn" onClick={() => onReassign(task)}>
          Reassign
        </button>
        <button type="button" className="workload-day-action-btn" onClick={() => onReschedule(task)}>
          Reschedule
        </button>
        <WorkloadDayTaskMarkDoneButton
          task={task}
          isMarkingDone={isMarkingDone}
          onMarkDone={onMarkDone}
        />
      </div>
    </div>
  );
}

export function WorkloadDayOffcanvas({
  selected,
  onClose,
  dayQuery,
  onReassign,
  onReschedule,
  onMarkDone,
  markDoneTaskId,
  onSaveEstimate,
  estimateSavingTaskId,
  formatError,
  hierarchyExtensions,
}: WorkloadDayOffcanvasProps) {
  const selectedMemberName = selected
    ? workloadMemberBaseName(
        selected.extension,
        hierarchyExtensions,
        selected.member,
      )
    : "";
  const selectedExt = selected?.extension.trim() ?? "";

  const summary = dayQuery.data?.summary;
  const cell = selected?.cell;
  const estMinutes = summary?.estimated_minutes ?? cell?.estimated_minutes ?? 0;
  const capacityMinutes = workloadDayCapacityMinutes(cell?.effective_capacity_minutes);
  const usedPercent =
    cell?.load_percent ??
    (capacityMinutes > 0 ? Math.round((estMinutes / capacityMinutes) * 1000) / 10 : 0);
  const unestimatedCount = summary?.unestimated_task_count ?? cell?.unestimated_count ?? 0;
  const taskCount = summary?.task_count ?? cell?.task_count ?? dayQuery.data?.tasks.length ?? 0;

  return (
    <Offcanvas
      show={Boolean(selected)}
      onHide={onClose}
      placement="end"
      className="workload-day-offcanvas"
    >
      <Offcanvas.Header closeButton className="workload-day-offcanvas__header">
        {selected ? (
          <div className="workload-day-offcanvas__identity">
            <div className="workload-day-offcanvas__avatar">
              {workloadMemberInitials(selectedExt, hierarchyExtensions, selected.member)}
            </div>
            <div>
              <div className="workload-day-offcanvas__name-row">
                <span className="workload-day-offcanvas__name">
                  {selectedMemberName} — {formatWorkloadDayDetailDate(selected.date)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <span className="workload-day-offcanvas__name">Day detail</span>
        )}
      </Offcanvas.Header>
      <Offcanvas.Body className="workload-day-offcanvas__body pt-2">
        {dayQuery.isPending ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : null}
        {dayQuery.isError ? <Alert variant="danger">{formatError(dayQuery.error)}</Alert> : null}
        {selected && dayQuery.data ? (
          <>
            <div className="workload-day-stats-grid">
              <div className="workload-day-stat">
                <div className="workload-day-stat__value workload-day-stat__value--accent">
                  {formatWorkloadMinutes(estMinutes)}
                </div>
                <div className="workload-day-stat__label">Est. load</div>
              </div>
              <div className="workload-day-stat">
                <div className="workload-day-stat__value">
                  {formatWorkloadMinutes(capacityMinutes)}
                </div>
                <div className="workload-day-stat__label">Capacity</div>
              </div>
              <div className="workload-day-stat">
                <div className="workload-day-stat__value workload-day-stat__value--accent">
                  {formatWorkloadPercent(usedPercent)}
                </div>
                <div className="workload-day-stat__label">Used</div>
              </div>
              <div className="workload-day-stat">
                <div className={`workload-day-stat__value ${unestimatedCount > 0 ? "workload-day-stat__value--warn" : "workload-day-stat__value--accent"}`}>
                  {unestimatedCount}
                </div>
                <div className="workload-day-stat__label">Unestimated</div>
              </div>
            </div>

            <p className="workload-day-total-summary small text-muted mb-2">
              {formatWorkloadDayTotalSummary(estMinutes, unestimatedCount)}
            </p>

            <div className="workload-day-tasks__heading">
              {taskCount} task{taskCount === 1 ? "" : "s"}
            </div>

            {dayQuery.data.tasks.length === 0 ? (
              <p className="workload-day-tasks__empty">No tasks this day</p>
            ) : (
              dayQuery.data.tasks.map((task) => (
                <WorkloadDayTaskCard
                  key={task.id}
                  task={task}
                  onReassign={onReassign}
                  onReschedule={onReschedule}
                  onMarkDone={onMarkDone}
                  isMarkingDone={markDoneTaskId === task.id}
                  onSaveEstimate={onSaveEstimate}
                  isSavingEstimate={estimateSavingTaskId === task.id}
                />
              ))
            )}
          </>
        ) : null}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

type WorkloadReassignModalProps = Readonly<{
  task: WorkloadTaskCard | null;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  targetExtension: string;
  onTargetChange: (value: string) => void;
  overloadConfirm: boolean;
  memberName: string;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (dueDate?: string | null, estimateMinutes?: number | null) => void;
}>;

export function WorkloadReassignModal({
  task,
  memberExtensions,
  hierarchyExtensions,
  targetExtension,
  onTargetChange,
  overloadConfirm,
  memberName,
  isSaving,
  onClose,
  onConfirm,
}: WorkloadReassignModalProps) {
  const [dueDateDraft, setDueDateDraft] = React.useState("");
  const [estimateHours, setEstimateHours] = React.useState("");
  const [estimateMins, setEstimateMins] = React.useState("");

  return (
    <Modal show={Boolean(task)} onHide={onClose} centered className="workload-reassign-modal">
      <Modal.Header closeButton>
        <Modal.Title>Reassign task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {task ? (
          <>
            <div className="workload-reassign-modal__summary">
              <div className="workload-reassign-modal__row">
                <span className="workload-reassign-modal__label">Task</span>
                <span className="workload-reassign-modal__value">{task.title}</span>
              </div>
              <div className="workload-reassign-modal__row">
                <span className="workload-reassign-modal__label">Priority</span>
                <span className="workload-reassign-modal__value">
                  <WorkloadPriorityBadge priority={task.priority} />
                </span>
              </div>
              {task.due_date ? (
                <div className="workload-reassign-modal__row">
                  <span className="workload-reassign-modal__label">Due date</span>
                  <span className="workload-reassign-modal__value">
                    {formatWorkloadShortDueDate(task.due_date)}
                  </span>
                </div>
              ) : null}
              <div className={`workload-reassign-modal__row${isWorkloadTaskUnestimated(task) ? " workload-reassign-modal__row--due" : ""}`}>
                <span className="workload-reassign-modal__label">Estimate</span>
                {isWorkloadTaskUnestimated(task) ? (
                  <div className="workload-reassign-modal__due-wrap">
                    <div className="workload-reassign-modal__estimate-inputs">
                      <input
                        type="number"
                        min={0}
                        className="workload-reassign-modal__date-input"
                        placeholder="hrs"
                        value={estimateHours}
                        onChange={(e) => setEstimateHours(e.target.value)}
                        style={{ maxWidth: "70px" }}
                      />
                      <span className="workload-reassign-modal__due-hint">h</span>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        className="workload-reassign-modal__date-input"
                        placeholder="mins"
                        value={estimateMins}
                        onChange={(e) => setEstimateMins(e.target.value)}
                        style={{ maxWidth: "70px" }}
                      />
                      <span className="workload-reassign-modal__due-hint">m</span>
                    </div>
                    <span className="workload-reassign-modal__due-hint">
                      Optional — helps calculate capacity load
                    </span>
                  </div>
                ) : (
                  <span className="workload-reassign-modal__value">
                    {formatWorkloadTaskEstimate(task)}
                  </span>
                )}
              </div>
              {!task.due_date ? (
                <div className="workload-reassign-modal__row workload-reassign-modal__row--due">
                  <span className="workload-reassign-modal__label">Due date</span>
                  <div className="workload-reassign-modal__due-wrap">
                    <input
                      type="date"
                      className="workload-reassign-modal__date-input"
                      value={dueDateDraft}
                      onChange={(e) => setDueDateDraft(e.target.value)}
                    />
                    <span className="workload-reassign-modal__due-hint">
                      Optional — helps show task in grid
                    </span>
                  </div>
                </div>
              ) : null}
              <div className="workload-reassign-modal__row workload-reassign-modal__row--due">
                <span className="workload-reassign-modal__label">Assign to</span>
                <div className="workload-reassign-modal__due-wrap">
                  <select
                    className="workload-reassign-modal__date-input"
                    style={{ maxWidth: "220px", paddingRight: "28px" }}
                    value={targetExtension}
                    onChange={(e) => onTargetChange(e.target.value)}
                  >
                    <option value="">Select member…</option>
                    {memberExtensions.map((ext) => (
                      <option key={ext} value={ext}>
                        {formatWorkloadMemberLabel(ext, hierarchyExtensions)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {overloadConfirm ? (
              <Alert variant="warning" className="small mt-3 mb-0">
                {memberName || "This member"} is already overloaded for that day. Assign anyway?
              </Alert>
            ) : null}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!targetExtension || isSaving} onClick={() => {
          const totalMinutes = (Number(estimateHours || 0) * 60) + Number(estimateMins || 0);
          onConfirm(dueDateDraft || null, totalMinutes > 0 ? totalMinutes : null);
        }}>
          {overloadConfirm ? "Assign anyway" : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

type WorkloadRescheduleModalProps = Readonly<{
  task: WorkloadTaskCard | null;
  currentDate?: string;
  onClose: () => void;
  rescheduleDate: string;
  onDateChange: (value: string) => void;
  overloadSecondStep: boolean;
  isSaving: boolean;
  onSubmit: () => void;
}>;

export function WorkloadRescheduleModal({
  task,
  currentDate,
  onClose,
  rescheduleDate,
  onDateChange,
  overloadSecondStep,
  isSaving,
  onSubmit,
}: WorkloadRescheduleModalProps) {
  const currentLabel = resolveRescheduleCurrentLabel(currentDate, task);

  return (
    <Modal show={Boolean(task)} onHide={onClose} centered className="workload-reschedule-modal">
      <Modal.Header closeButton>
        <Modal.Title>Reschedule task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {task ? (
          <>
            <div className="workload-reassign-modal__summary">
              <div className="workload-reassign-modal__row">
                <span className="workload-reassign-modal__label">Task</span>
                <span className="workload-reassign-modal__value">{task.title}</span>
              </div>
              <div className="workload-reassign-modal__row">
                <span className="workload-reassign-modal__label">Priority</span>
                <span className="workload-reassign-modal__value">
                  <WorkloadPriorityBadge priority={task.priority} />
                </span>
              </div>
              <div className="workload-reassign-modal__row">
                <span className="workload-reassign-modal__label">Current date</span>
                <span className="workload-reassign-modal__value">{currentLabel}</span>
              </div>
              <div className="workload-reassign-modal__row workload-reassign-modal__row--due">
                <span className="workload-reassign-modal__label">New date</span>
                <div className="workload-reassign-modal__due-wrap">
                  <input
                    type="date"
                    className="workload-reassign-modal__date-input"
                    value={rescheduleDate}
                    onChange={(e) => onDateChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {overloadSecondStep ? (
              <Alert variant="warning" className="small mt-3 mb-0">
                This change may overload capacity for that day. Confirm to apply anyway.
              </Alert>
            ) : null}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={!rescheduleDate || isSaving} onClick={onSubmit}>
          {isSaving ? "Saving…" : overloadSecondStep ? "Reschedule anyway" : "Reschedule"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export type WorkloadBoardDragConfirmPayload = Readonly<{
  taskTitle: string;
  memberName: string;
  dateLabel: string;
  overloadWarning: boolean;
}>;

type WorkloadBoardDragConfirmModalProps = Readonly<{
  payload: WorkloadBoardDragConfirmPayload | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>;

export function WorkloadBoardDragConfirmModal({
  payload,
  isSaving,
  onClose,
  onConfirm,
}: WorkloadBoardDragConfirmModalProps) {
  return (
    <Modal show={Boolean(payload)} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm move</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {payload ? (
          <>
            <p className="mb-2">
              Assign <strong>{payload.taskTitle}</strong> to <strong>{payload.memberName}</strong>
              {payload.dateLabel ? (
                <>
                  {" "}
                  — due <strong>{payload.dateLabel}</strong>
                </>
              ) : null}
              ?
            </p>
            {payload.overloadWarning ? (
              <Alert variant="warning" className="small mb-0">
                This member may be overloaded on that day. Proceed anyway?
              </Alert>
            ) : null}
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={isSaving} onClick={onConfirm}>
          {payload?.overloadWarning ? "Confirm anyway" : "Confirm"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
