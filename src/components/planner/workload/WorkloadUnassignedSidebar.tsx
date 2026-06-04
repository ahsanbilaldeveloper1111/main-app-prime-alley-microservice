import React from "react";
import { Alert, Button, Form, Offcanvas, Spinner } from "react-bootstrap";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import type { WorkloadTaskCard, WorkloadUnassignedData } from "@utils/tasks";
import {
  formatWorkloadMemberAssignOption,
  formatWorkloadMinutes,
  formatWorkloadShortDueDate,
  formatWorkloadTaskEstimate,
  isWorkloadOrganizationTask,
  isWorkloadTaskUnestimated,
  workloadTaskProjectLabel,
} from "@page-modules/planner/workload/workloadDomain";
import { WorkloadBdg, WorkloadPriorityBadge } from "./WorkloadPlannerSubviews";

type UnassignedQuerySlice = Readonly<{
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: WorkloadUnassignedData | undefined;
}>;

type WorkloadUnassignedTaskRowProps = Readonly<{
  task: WorkloadTaskCard;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  assignTarget: string;
  onAssignTargetChange: (value: string) => void;
  onAssign: () => void;
  isAssigning: boolean;
}>;

function WorkloadUnassignedTaskRow({
  task,
  memberExtensions,
  hierarchyExtensions,
  assignTarget,
  onAssignTargetChange,
  onAssign,
  isAssigning,
}: WorkloadUnassignedTaskRowProps) {
  const unestimated = isWorkloadTaskUnestimated(task);
  const isOrg = isWorkloadOrganizationTask(task);
  const projectLabel = workloadTaskProjectLabel(task);

  return (
    <div className="workload-unassigned-task">
      <p className="workload-unassigned-task__title">
        {task.title}
        {isOrg ? (
          <WorkloadBdg tone="green" className="ms-2">
            <i className="ti ti-building" style={{ fontSize: "10px" }} aria-hidden />
            Org
          </WorkloadBdg>
        ) : null}
        {unestimated ? (
          <span
            className="workload-unestimated-dot ms-1"
            title="No estimate"
            aria-label="No estimate"
          />
        ) : null}
      </p>
      <div className="workload-unassigned-task__tags">
        <WorkloadPriorityBadge priority={task.priority} />
        {!isOrg && projectLabel && projectLabel !== "—" && projectLabel !== "Personal" ? (
          <WorkloadBdg tone="gray">{projectLabel}</WorkloadBdg>
        ) : null}
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
        {task.due_date ? (
          <WorkloadBdg tone="gray">
            <Calendar size={10} aria-hidden />
            {formatWorkloadShortDueDate(task.due_date)}
          </WorkloadBdg>
        ) : (
          <WorkloadBdg tone="gray">
            <Calendar size={10} aria-hidden />
            No due date
          </WorkloadBdg>
        )}
      </div>
      <div className="workload-unassigned-task__assign">
        <Form.Select
          size="sm"
          value={assignTarget}
          onChange={(e) => onAssignTargetChange(e.target.value)}
          disabled={isAssigning}
          aria-label={`Assign ${task.title}`}
        >
          <option value="">Assign to…</option>
          {memberExtensions.map((ext) => (
            <option key={ext} value={ext}>
              {formatWorkloadMemberAssignOption(ext, hierarchyExtensions)}
            </option>
          ))}
        </Form.Select>
        <Button
          size="sm"
          variant="primary"
          disabled={isAssigning || !assignTarget}
          onClick={onAssign}
        >
          Assign
        </Button>
      </div>
    </div>
  );
}

export type WorkloadUnassignedSidebarProps = Readonly<{
  show: boolean;
  onClose: () => void;
  unassignedQuery: UnassignedQuerySlice;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  assignTargets: Record<number, string>;
  setAssignTargets: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onRequestAssign: (task: WorkloadTaskCard, toExtension: string) => void;
  assignPending?: boolean;
  formatError: (err: unknown) => string;
}>;

export function WorkloadUnassignedSidebar({
  show,
  onClose,
  unassignedQuery,
  memberExtensions,
  hierarchyExtensions,
  assignTargets,
  setAssignTargets,
  onRequestAssign,
  assignPending = false,
  formatError,
}: WorkloadUnassignedSidebarProps) {
  const count = unassignedQuery.data?.count ?? unassignedQuery.data?.tasks.length ?? 0;
  const subtitle =
    count === 1 ? "1 task needs assignment" : `${count} tasks need assignment`;

  return (
    <Offcanvas
      show={show}
      onHide={onClose}
      placement="end"
      className="workload-unassigned-offcanvas"
    >
      <Offcanvas.Header closeButton className="workload-unassigned-offcanvas__header">
        <div className="workload-unassigned-offcanvas__title-block">
          <div className="workload-unassigned-offcanvas__title-row">
            <i className="ti ti-inbox workload-unassigned-offcanvas__title-icon" aria-hidden />
            <span className="workload-unassigned-offcanvas__title-text">Unassigned Tasks</span>
          </div>
          <p className="workload-unassigned-offcanvas__subtitle">
            {unassignedQuery.isPending ? "Loading…" : subtitle}
          </p>
        </div>
      </Offcanvas.Header>
      <Offcanvas.Body className="workload-unassigned-offcanvas__body pt-2">
        {unassignedQuery.isPending ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : null}
        {unassignedQuery.isError ? (
          <Alert variant="danger">{formatError(unassignedQuery.error)}</Alert>
        ) : null}
        {!unassignedQuery.isPending && !unassignedQuery.isError && count === 0 ? (
          <p className="text-muted small text-center py-4 mb-0">No unassigned tasks.</p>
        ) : null}
        {unassignedQuery.data?.tasks.map((task) => (
          <WorkloadUnassignedTaskRow
            key={task.id}
            task={task}
            memberExtensions={memberExtensions}
            hierarchyExtensions={hierarchyExtensions}
            assignTarget={assignTargets[task.id] ?? ""}
            onAssignTargetChange={(value) =>
              setAssignTargets((prev) => ({ ...prev, [task.id]: value }))
            }
            onAssign={() => {
              const toExtension = assignTargets[task.id] ?? "";
              if (!toExtension) return;
              onRequestAssign(task, toExtension);
            }}
            isAssigning={assignPending}
          />
        ))}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
