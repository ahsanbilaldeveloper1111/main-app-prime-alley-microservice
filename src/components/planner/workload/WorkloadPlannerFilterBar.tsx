import React, { useMemo } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { Inbox } from "lucide-react";
import type { AssigneeMatch, WorkloadRangePreset } from "@utils/tasks";
import type {
  WorkloadPriorityFilterValue,
  WorkloadProjectFilterValue,
} from "@page-modules/planner/workload/workloadDomain";
import {
  formatWorkloadMemberLabel,
  workloadProjectFilterSelectValue,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadProjectOption } from "./WorkloadPlannerChrome";

export type WorkloadPlannerFilterBarProps = Readonly<{
  range: WorkloadRangePreset;
  onRangeChange: (value: WorkloadRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  customRangeInvalid: boolean;
  assigneeMatch: AssigneeMatch;
  onAssigneeMatchChange: (value: AssigneeMatch) => void;
  projectFilter: WorkloadProjectFilterValue;
  onProjectFilterChange: (value: WorkloadProjectFilterValue) => void;
  projectOptions: WorkloadProjectOption[];
  memberFilter: string;
  onMemberFilterChange: (value: string) => void;
  memberExtensions: string[];
  hierarchyExtensions?: unknown[] | null;
  priorityFilter: WorkloadPriorityFilterValue;
  onPriorityFilterChange: (value: WorkloadPriorityFilterValue) => void;
  enabled: boolean;
  unassignedCount: number | undefined;
  onOpenUnassigned: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onApply: () => void;
  applyDisabled: boolean;
  isApplying: boolean;
}>;

export function WorkloadPlannerFilterBar({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  customRangeInvalid,
  assigneeMatch,
  onAssigneeMatchChange,
  projectFilter,
  onProjectFilterChange,
  projectOptions,
  memberFilter,
  onMemberFilterChange,
  memberExtensions,
  hierarchyExtensions,
  priorityFilter,
  onPriorityFilterChange,
  enabled,
  unassignedCount,
  onOpenUnassigned,
  onClearFilters,
  hasActiveFilters,
  onApply,
  applyDisabled,
  isApplying,
}: WorkloadPlannerFilterBarProps) {
  const projectSelectValue = workloadProjectFilterSelectValue(projectFilter);

  const memberOptions = useMemo(() => {
    const options = [{ value: "all", label: "All members" }];
    for (const ext of memberExtensions) {
      options.push({
        value: ext,
        label: formatWorkloadMemberLabel(ext, hierarchyExtensions),
      });
    }
    return options;
  }, [hierarchyExtensions, memberExtensions]);

  return (
    <Card className="workload-filters-card mb-3">
      <Card.Body className="workload-filters-card__body">
        <Row className="g-2 align-items-end workload-filters-card__row">
          <Col xs={12} sm={6} md="auto" className="workload-filters-card__field">
            <Form.Label className="small text-muted mb-1">Time period</Form.Label>
            <Form.Select
              size="sm"
              value={range}
              disabled={!enabled}
              onChange={(e) => onRangeChange(e.target.value as WorkloadRangePreset)}
            >
              <option value="this_week">This week</option>
              <option value="next_week">Next week</option>
              <option value="custom">Custom range</option>
            </Form.Select>
          </Col>

          {range === "custom" ? (
            <>
              <Col xs={6} sm={6} md="auto" className="workload-filters-card__field">
                <Form.Label className="small text-muted mb-1">Start</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customStart}
                  disabled={!enabled}
                  isInvalid={customRangeInvalid}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                />
              </Col>
              <Col xs={6} sm={6} md="auto" className="workload-filters-card__field">
                <Form.Label className="small text-muted mb-1">End</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customEnd}
                  disabled={!enabled}
                  isInvalid={customRangeInvalid}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                />
              </Col>
            </>
          ) : null}

          <Col xs={12} sm={6} md="auto" className="workload-filters-card__field">
            <Form.Label className="small text-muted mb-1">Project</Form.Label>
            <Form.Select
              size="sm"
              value={projectSelectValue}
              disabled={!enabled}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") onProjectFilterChange("all");
                else if (value === "none") onProjectFilterChange("none");
                else onProjectFilterChange(Number.parseInt(value, 10));
              }}
            >
              <option value="all">All projects</option>
              <option value="none">No project (org)</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md="auto" className="workload-filters-card__field">
            <Form.Label className="small text-muted mb-1">Member</Form.Label>
            <Form.Select
              size="sm"
              value={memberFilter}
              disabled={!enabled}
              onChange={(e) => onMemberFilterChange(e.target.value)}
            >
              {memberOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md="auto" className="workload-filters-card__field">
            <Form.Label className="small text-muted mb-1">Priority</Form.Label>
            <Form.Select
              size="sm"
              value={priorityFilter}
              disabled={!enabled}
              onChange={(e) =>
                onPriorityFilterChange(e.target.value as WorkloadPriorityFilterValue)
              }
            >
              <option value="all">All priority</option>
              <option value="critical">Critical only</option>
              <option value="high_plus">High+</option>
              <option value="medium_plus">Medium+</option>
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md="auto" className="workload-filters-card__field">
            <Form.Label className="small text-muted mb-1">Assignee match</Form.Label>
            <Form.Select
              size="sm"
              value={assigneeMatch}
              disabled={!enabled}
              onChange={(e) => onAssigneeMatchChange(e.target.value as AssigneeMatch)}
            >
              <option value="primary">Primary assignee</option>
              <option value="any">Any assignee</option>
            </Form.Select>
          </Col>

          <Col xs={12} md="auto" className="workload-filters-card__apply-col">
            <Form.Label
              className="small text-muted mb-1 workload-filters-card__apply-label"
              aria-hidden="true"
            >
              &nbsp;
            </Form.Label>
            <Button
              variant="dark"
              size="sm"
              className="workload-filters-card__apply-btn"
              disabled={applyDisabled}
              onClick={onApply}
            >
              {isApplying ? "Applying…" : "Apply"}
            </Button>
          </Col>

          <Col
            xs={12}
            md="auto"
            className="workload-filters-card__actions d-flex flex-wrap align-items-end gap-2 ms-md-auto"
          >
            {hasActiveFilters ? (
              <Button
                variant="link"
                size="sm"
                className="workload-filters-card__clear px-0"
                disabled={!enabled}
                onClick={onClearFilters}
              >
                Clear filters
              </Button>
            ) : null}
            <Button
              variant="outline-warning"
              size="sm"
              disabled={!enabled}
              onClick={onOpenUnassigned}
              className="workload-filters-card__unassigned"
            >
              <Inbox size={15} className="me-1" aria-hidden />
              Unassigned
              {unassignedCount != null && unassignedCount > 0 ? (
                <span className="badge bg-warning text-dark ms-1">{unassignedCount}</span>
              ) : null}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
