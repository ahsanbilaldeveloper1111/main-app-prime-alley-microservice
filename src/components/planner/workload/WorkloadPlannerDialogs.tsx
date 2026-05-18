import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Offcanvas,
  Row,
  Spinner,
} from "react-bootstrap";
import { AlertTriangle, BarChart3, Clock } from "lucide-react";
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
  isWorkloadOrganizationTask,
  isWorkloadTaskUnestimated,
  workloadDayCapacityMinutes,
  workloadMemberBaseName,
  workloadMemberInitials,
  workloadPriorityLabel,
  workloadPriorityTone,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";

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
  onMarkDone: (taskId: number) => void;
  markDoneTaskId: number | null;
  onSaveEstimate: (taskId: number, minutes: number) => void;
  estimateSavingTaskId: number | null;
  formatError: (err: unknown) => string;
  hierarchyExtensions?: unknown[] | null;
}>;

type WorkloadDayTaskCardProps = Readonly<{
  task: WorkloadTaskCard;
  onReassign: (task: WorkloadTaskCard) => void;
  onReschedule: (task: WorkloadTaskCard) => void;
  onMarkDone: (taskId: number) => void;
  isMarkingDone: boolean;
  onSaveEstimate: (taskId: number, minutes: number) => void;
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
  onMarkDone: (taskId: number) => void;
}>) {
  if (task.is_completed) return null;
  return (
    <Button
      size="sm"
      variant="outline-success"
      disabled={isMarkingDone}
      onClick={() => onMarkDone(task.id)}
    >
      {isMarkingDone ? "Saving…" : "Mark done"}
    </Button>
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
  const unestimated = isWorkloadTaskUnestimated(task);
  const priorityTone = workloadPriorityTone(task.priority);
  const showOrgBadge = isWorkloadOrganizationTask(task);
  const projectLabel = workloadTaskProjectLabel(task);
  const dueDateLabel = task.due_date?.slice(0, 10) ?? null;

  const handleSaveEstimate = () => {
    const minutes = Number.parseInt(estimateDraft.trim(), 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    onSaveEstimate(task.id, minutes);
    setEstimateDraft("");
  };

  return (
    <div className="workload-day-task-card">
      <div className="workload-day-task-card__title-row">
        <div className="workload-day-task-card__title">{task.title}</div>
        {showOrgBadge ? (
          <Badge bg="light" text="dark" className="workload-day-task-card__org border">
            Org
          </Badge>
        ) : null}
      </div>

      <div className="workload-day-task-card__tags">
        <span className={`workload-priority-badge workload-priority-badge--${priorityTone}`}>
          {workloadPriorityLabel(task.priority)}
        </span>
        {task.status_name ? (
          <span
            className="workload-day-task-card__tag"
            style={
              task.status_color
                ? { backgroundColor: task.status_color, color: "#fff" }
                : undefined
            }
          >
            {task.status_name}
          </span>
        ) : null}
        <span className="workload-day-task-card__tag">{projectLabel}</span>
        {dueDateLabel ? (
          <span
            className={`workload-day-task-card__tag ${
              task.is_overdue ? "workload-day-task-card__tag--overdue" : ""
            }`}
          >
            {dueDateLabel}
          </span>
        ) : null}
        {unestimated ? (
          <span className="workload-day-task-card__tag workload-day-task-card__tag--warn">
            <AlertTriangle size={12} aria-hidden />
            No estimate
          </span>
        ) : (
          <span className="workload-day-task-card__tag">
            <Clock size={12} aria-hidden />
            {formatWorkloadMinutes(task.estimated_duration_minutes ?? 0)}
          </span>
        )}
      </div>

      {unestimated ? (
        <div className="workload-day-estimate-form">
          <span className="workload-day-estimate-form__label">Add time estimate:</span>
          <div className="workload-day-estimate-form__row">
            <Form.Control
              size="sm"
              type="number"
              min={1}
              placeholder="mins"
              value={estimateDraft}
              onChange={(e) => setEstimateDraft(e.target.value)}
              disabled={isSavingEstimate}
            />
            <Button
              size="sm"
              variant="warning"
              disabled={isSavingEstimate || estimateDraft.trim() === ""}
              onClick={handleSaveEstimate}
            >
              {isSavingEstimate ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="workload-day-task-card__actions">
        <Button size="sm" variant="outline-secondary" onClick={() => onReassign(task)}>
          Reassign
        </Button>
        <Button size="sm" variant="outline-secondary" onClick={() => onReschedule(task)}>
          Reschedule
        </Button>
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
      <Offcanvas.Header closeButton className="workload-day-offcanvas__header border-0 pb-0">
        {selected ? (
          <div className="workload-day-offcanvas__identity">
            <div className="workload-day-offcanvas__avatar">
              {workloadMemberInitials(selectedExt, hierarchyExtensions, selected.member)}
            </div>
            <div>
              <div className="workload-day-offcanvas__name-row">
                <BarChart3 size={16} className="text-primary" aria-hidden />
                <span className="workload-day-offcanvas__name">
                  {selectedMemberName} — {formatWorkloadDayDetailDate(selected.date)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <Offcanvas.Title>Day detail</Offcanvas.Title>
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
            <Row className="g-2 mb-3 workload-day-stats">
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__value workload-day-stat__value--accent">
                    {formatWorkloadMinutes(estMinutes)}
                  </div>
                  <div className="workload-day-stat__label">Est. load</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__value">
                    {formatWorkloadMinutes(capacityMinutes)}
                  </div>
                  <div className="workload-day-stat__label">Capacity</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__value workload-day-stat__value--accent">
                    {formatWorkloadPercent(usedPercent)}
                  </div>
                  <div className="workload-day-stat__label">Used</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div
                    className={`workload-day-stat__value ${
                      unestimatedCount > 0 ? "workload-day-stat__value--warn" : "workload-day-stat__value--accent"
                    }`}
                  >
                    {unestimatedCount}
                  </div>
                  <div className="workload-day-stat__label">Unestimated</div>
                </div>
              </Col>
            </Row>

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
  onConfirm: () => void;
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
  return (
    <Modal show={Boolean(task)} onHide={onClose} centered className="workload-reassign-modal">
      <Modal.Header closeButton>
        <Modal.Title>Reassign task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {task ? (
          <>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted mb-1">Task</Form.Label>
              <Form.Control plaintext readOnly value={task.title} className="fw-semibold px-0" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Select user</Form.Label>
              <Form.Select
                value={targetExtension}
                onChange={(e) => onTargetChange(e.target.value)}
              >
                <option value="">Select member…</option>
                {memberExtensions.map((ext) => (
                  <option key={ext} value={ext}>
                    {formatWorkloadMemberLabel(ext, hierarchyExtensions)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
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
        <Button variant="primary" disabled={!targetExtension || isSaving} onClick={onConfirm}>
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
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted mb-1">Current</Form.Label>
              <Form.Control plaintext readOnly value={currentLabel} className="px-0" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-muted mb-1">Task</Form.Label>
              <Form.Control plaintext readOnly value={task.title} className="fw-semibold px-0" />
            </Form.Group>
            <Form.Group>
              <Form.Label>New due date</Form.Label>
              <Form.Control
                type="date"
                value={rescheduleDate}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </Form.Group>
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
          {overloadSecondStep ? "Reschedule anyway" : "Reschedule"}
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
