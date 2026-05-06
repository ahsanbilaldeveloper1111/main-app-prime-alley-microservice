import React from "react";
import { Row, Col } from "react-bootstrap";
import {
  formatDueTimeForDetail,
  formatFrequencyLabel,
  formatPlannerDetailDateLong,
  formatPlannerDetailDateTime,
  formatRepeatOnForDetail,
  pickTaskScalar,
  recurringIntervalSuffix,
  plannerDetailScalarString,
} from "@components/planner/plannerTaskDetail/plannerTaskDetailDomain";
import "./plannerTaskDetail.scss";

export type PlannerTaskRecurringSchedulePanelProps = Readonly<{
  taskRecord: Record<string, unknown>;
  endDateDisplay: string | null;
  lastRunAt: string | undefined;
  nextRunAt: string | undefined;
}>;

export function PlannerTaskRecurringSchedulePanel({
  taskRecord,
  endDateDisplay,
  lastRunAt,
  nextRunAt,
}: PlannerTaskRecurringSchedulePanelProps) {
  const pick = (key: string) => pickTaskScalar(taskRecord, key);
  const freq = pick("frequency");
  const intervalRaw = pick("repeat_interval");
  const intervalStr = plannerDetailScalarString(intervalRaw);
  const intervalMain = intervalStr === "" ? "—" : intervalStr;
  const suffix = typeof freq === "string" ? recurringIntervalSuffix(freq) : "";

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Recurring schedule</div>
      <Row className="g-3">
        <Col xs={6} md={4}>
          <div className="small text-muted">Frequency</div>
          <div className="ptd-recurring-value">{formatFrequencyLabel(freq)}</div>
        </Col>
        <Col xs={6} md={4}>
          <div className="small text-muted">Repeat every</div>
          <div className="ptd-recurring-value">
            {intervalMain}
            {suffix ? <span className="text-muted small ms-1">{suffix}</span> : null}
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="small text-muted">Repeat on / day</div>
          <div className="ptd-recurring-value">{formatRepeatOnForDetail(freq, pick("repeat_on"))}</div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Scheduled time</div>
          <div className="ptd-recurring-value">{formatDueTimeForDetail(pick("due_time"))}</div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Schedule ends</div>
          <div className="ptd-recurring-value">{formatPlannerDetailDateLong(endDateDisplay)}</div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Last run at</div>
          <div className="ptd-recurring-value">{formatPlannerDetailDateTime(lastRunAt)}</div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Next run at</div>
          <div className="ptd-recurring-value">{formatPlannerDetailDateTime(nextRunAt)}</div>
        </Col>
      </Row>
    </div>
  );
}
