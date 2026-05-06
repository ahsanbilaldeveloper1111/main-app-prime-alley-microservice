import React from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { Calendar } from "lucide-react";
import {
  formatPlannerDetailDateLong,
  formatPriorityLabel,
  getPriorityVariant,
  getStatusVariant,
  taskTypeBadgeLabel,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import type { PlannerTaskDetailViewModel } from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import "./plannerTaskDetail.scss";

export type PlannerTaskDetailSummaryGridProps = Readonly<{
  viewModel: PlannerTaskDetailViewModel;
}>;

export function PlannerTaskDetailSummaryGrid({ viewModel }: PlannerTaskDetailSummaryGridProps) {
  const {
    statusName,
    priorityVal,
    detailTaskKind,
    endDateDisplay,
    startDateDisplay,
    dueTimeDetailLabel,
  } = viewModel;

  return (
    <Row className="g-2 mb-3">
      <Col xs={6} md={4}>
        <div className="p-3 bg-light rounded border">
          <div className="small text-muted text-uppercase fw-semibold mb-1">Status</div>
          <Badge bg={getStatusVariant(statusName)} className="px-3 py-2 w-100">
            {statusName}
          </Badge>
        </div>
      </Col>
      <Col xs={6} md={4}>
        <div className="p-3 bg-light rounded border">
          <div className="small text-muted text-uppercase fw-semibold mb-1">Priority</div>
          <Badge bg={getPriorityVariant(priorityVal)} className="px-3 py-2 w-100">
            {formatPriorityLabel(priorityVal)}
          </Badge>
        </div>
      </Col>
      <Col xs={6} md={4}>
        <div className="p-3 bg-light rounded border">
          <div className="small text-muted text-uppercase fw-semibold mb-1">Type</div>
          <Badge bg="secondary" className="px-3 py-2 w-100 text-capitalize">
            {taskTypeBadgeLabel(detailTaskKind)}
          </Badge>
        </div>
      </Col>
      <Col xs={6} md={4}>
        <div className="p-3 bg-light rounded border">
          <div className="small text-muted text-uppercase fw-semibold mb-1">Due Date</div>
          <div className="ptd-due-row">
            <Calendar size={16} className="me-2 text-muted" />
            {formatPlannerDetailDateLong(endDateDisplay)}
            {dueTimeDetailLabel !== "—" && (
              <span className="ms-1 small text-muted">({dueTimeDetailLabel})</span>
            )}
          </div>
        </div>
      </Col>
      {startDateDisplay ? (
        <Col xs={12} md={4}>
          <div className="p-3 bg-light rounded border">
            <div className="small text-muted text-uppercase fw-semibold mb-1">Start date</div>
            <div className="ptd-due-row">
              <Calendar size={16} className="me-2 text-muted" />
              {formatPlannerDetailDateLong(startDateDisplay)}
            </div>
          </div>
        </Col>
      ) : null}
    </Row>
  );
}
