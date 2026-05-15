import React from "react";
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
import type { WorkloadDayData, WorkloadTaskCard, WorkloadUnassignedData } from "@utils/tasks";
import {
  formatWorkloadDayHeader,
  formatWorkloadMinutes,
  workloadPriorityLabel,
} from "@page-modules/planner/workload/workloadDomain";

type DayQuerySlice = Readonly<{
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: WorkloadDayData | undefined;
}>;

type UnassignedQuerySlice = Readonly<{
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: WorkloadUnassignedData | undefined;
}>;

type AppRouterLike = Readonly<{ push: (path: string) => void }>;

type WorkloadDayOffcanvasProps = Readonly<{
  selected: { extension: string; date: string } | null;
  onClose: () => void;
  dayQuery: DayQuerySlice;
  router: AppRouterLike;
  onReschedule: (task: WorkloadTaskCard) => void;
  formatError: (err: unknown) => string;
}>;

export function WorkloadDayOffcanvas({
  selected,
  onClose,
  dayQuery,
  router,
  onReschedule,
  formatError,
}: WorkloadDayOffcanvasProps) {
  return (
    <Offcanvas show={Boolean(selected)} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {selected ? (
            <>
              Day detail · {selected.extension}
              <div className="small text-muted fw-normal">
                {formatWorkloadDayHeader(selected.date)}
              </div>
            </>
          ) : (
            "Day detail"
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {dayQuery.isPending ? <Spinner animation="border" size="sm" /> : null}
        {dayQuery.isError ? <Alert variant="danger">{formatError(dayQuery.error)}</Alert> : null}
        {dayQuery.data ? (
          <>
            <Row className="g-2 mb-3">
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__label">Estimated</div>
                  <div className="workload-day-stat__value">
                    {formatWorkloadMinutes(dayQuery.data.summary.estimated_minutes)}
                  </div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__label">Tasks</div>
                  <div className="workload-day-stat__value">{dayQuery.data.summary.task_count}</div>
                </div>
              </Col>
              <Col xs={6}>
                <div className="workload-day-stat">
                  <div className="workload-day-stat__label">Unestimated</div>
                  <div className="workload-day-stat__value">
                    {dayQuery.data.summary.unestimated_task_count}
                  </div>
                </div>
              </Col>
            </Row>
            <h6 className="mb-2">Tasks</h6>
            {dayQuery.data.tasks.length === 0 ? (
              <p className="text-muted small">No tasks on this day.</p>
            ) : (
              dayQuery.data.tasks.map((task) => (
                <div key={task.id} className="workload-task-card mb-2">
                  <div className="workload-task-card__title">{task.title}</div>
                  <div className="d-flex flex-wrap gap-1 mb-1">
                    {task.status_name ? (
                      <Badge
                        style={
                          task.status_color
                            ? { backgroundColor: task.status_color, color: "#fff" }
                            : undefined
                        }
                      >
                        {task.status_name}
                      </Badge>
                    ) : null}
                    <Badge bg="light" text="dark" className="border">
                      {workloadPriorityLabel(task.priority)}
                    </Badge>
                    {task.is_overdue ? <Badge bg="danger">Overdue</Badge> : null}
                  </div>
                  <div className="small text-muted mb-2">
                    {task.task_id}
                    {task.project_name ? ` · ${task.project_name}` : ""} ·{" "}
                    {formatWorkloadMinutes(task.estimated_duration_minutes ?? 0)}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => router.push(`/planner/tasks/${task.id}`)}
                    >
                      Open
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => onReschedule(task)}>
                      Reschedule
                    </Button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : null}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

type WorkloadUnassignedOffcanvasProps = Readonly<{
  show: boolean;
  onClose: () => void;
  unassignedQuery: UnassignedQuerySlice;
  memberExtensions: string[];
  assignTargets: Record<number, string>;
  setAssignTargets: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  assignMutation: Readonly<{
    isPending: boolean;
    mutate: (vars: { taskId: number; toExtension: string }) => void;
  }>;
  formatError: (err: unknown) => string;
}>;

export function WorkloadUnassignedOffcanvas({
  show,
  onClose,
  unassignedQuery,
  memberExtensions,
  assignTargets,
  setAssignTargets,
  assignMutation,
  formatError,
}: WorkloadUnassignedOffcanvasProps) {
  return (
    <Offcanvas show={show} onHide={onClose} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Unassigned tasks</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {unassignedQuery.isPending ? <Spinner animation="border" size="sm" /> : null}
        {unassignedQuery.isError ? (
          <Alert variant="danger">{formatError(unassignedQuery.error)}</Alert>
        ) : null}
        {unassignedQuery.data?.tasks.length === 0 ? (
          <p className="text-muted small mb-0">No unassigned tasks.</p>
        ) : null}
        {unassignedQuery.data?.tasks.map((task) => (
          <div key={task.id} className="workload-task-card">
            <div className="workload-task-card__title">{task.title}</div>
            <div className="small text-muted mb-2">
              {task.task_id}
              {task.due_date ? ` · due ${task.due_date}` : ""}
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Form.Select
                size="sm"
                className="flex-grow-1"
                style={{ minWidth: "8rem" }}
                value={assignTargets[task.id] ?? memberExtensions[0] ?? ""}
                onChange={(e) =>
                  setAssignTargets((prev) => ({ ...prev, [task.id]: e.target.value }))
                }
              >
                <option value="">Select member…</option>
                {memberExtensions.map((ext) => (
                  <option key={ext} value={ext}>
                    {ext}
                  </option>
                ))}
              </Form.Select>
              <Button
                size="sm"
                variant="primary"
                disabled={assignMutation.isPending}
                onClick={() =>
                  assignMutation.mutate({
                    taskId: task.id,
                    toExtension: assignTargets[task.id] ?? memberExtensions[0] ?? "",
                  })
                }
              >
                Assign
              </Button>
            </div>
          </div>
        ))}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

type WorkloadRescheduleModalProps = Readonly<{
  task: WorkloadTaskCard | null;
  onClose: () => void;
  rescheduleDate: string;
  onDateChange: (value: string) => void;
  overloadSecondStep: boolean;
  isSaving: boolean;
  onSubmit: () => void;
}>;

export function WorkloadRescheduleModal({
  task,
  onClose,
  rescheduleDate,
  onDateChange,
  overloadSecondStep,
  isSaving,
  onSubmit,
}: WorkloadRescheduleModalProps) {
  return (
    <Modal show={Boolean(task)} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Reschedule task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {task ? (
          <>
            <p className="small mb-2">
              <strong>{task.title}</strong>
            </p>
            <Form.Group className="mb-2">
              <Form.Label>New due date</Form.Label>
              <Form.Control type="date" value={rescheduleDate} onChange={(e) => onDateChange(e.target.value)} />
            </Form.Group>
            {overloadSecondStep ? (
              <Alert variant="warning" className="small mb-0">
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
          {overloadSecondStep ? "Confirm anyway" : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
