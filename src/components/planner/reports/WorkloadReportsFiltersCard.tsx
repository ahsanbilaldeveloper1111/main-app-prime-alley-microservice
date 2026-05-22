import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
import type { ReportsDatePreset, ReportsProjectFilter } from "@page-modules/planner/reports/reportsDomain";
import type { PlannerProjectListItem } from "@page-modules/planner/reports/projectReportsDomain";

type WorkloadReportsFiltersCardProps = Readonly<{
  datePreset: ReportsDatePreset;
  onDatePresetChange: (preset: ReportsDatePreset) => void;
  customStart: string;
  onCustomStartChange: (value: string) => void;
  customEnd: string;
  onCustomEndChange: (value: string) => void;
  projectFilter: ReportsProjectFilter;
  onProjectFilterChange: (value: ReportsProjectFilter) => void;
  projectFilterOptions: PlannerProjectListItem[];
  memberFilter: string;
  onMemberFilterChange: (value: string) => void;
  memberExtensions: string[];
  hierarchyDataExtensions: unknown[] | null | undefined;
  staleDays: number;
  onStaleDaysChange: (value: number) => void;
  enabled: boolean;
  loadingOverview: boolean;
  onApply: () => void;
}>;

export function WorkloadReportsFiltersCard({
  datePreset,
  onDatePresetChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  projectFilter,
  onProjectFilterChange,
  projectFilterOptions,
  memberFilter,
  onMemberFilterChange,
  memberExtensions,
  hierarchyDataExtensions,
  staleDays,
  onStaleDaysChange,
  enabled,
  loadingOverview,
  onApply,
}: WorkloadReportsFiltersCardProps) {
  return (
    <Card className="workload-reports-filters">
      <Card.Body className="workload-reports-filters__body">
        <Row className="g-2 align-items-end workload-reports-filters__row">
          <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
            <Form.Label className="small text-muted mb-1">Time period</Form.Label>
            <Form.Select
              size="sm"
              value={datePreset}
              onChange={(e) => onDatePresetChange(e.target.value as ReportsDatePreset)}
            >
              <option value="last_7">Last 7 days</option>
              <option value="last_30">Last 30 days</option>
              <option value="this_month">This month</option>
              <option value="custom">Custom range</option>
            </Form.Select>
          </Col>
          {datePreset === "custom" ? (
            <>
              <Col xs={6} sm={6} md="auto" className="workload-reports-filters__field">
                <Form.Label className="small text-muted mb-1">Start</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                />
              </Col>
              <Col xs={6} sm={6} md="auto" className="workload-reports-filters__field">
                <Form.Label className="small text-muted mb-1">End</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                />
              </Col>
            </>
          ) : null}
          <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
            <Form.Label className="small text-muted mb-1">Project</Form.Label>
            <Form.Select
              size="sm"
              value={projectFilter === "all" ? "all" : String(projectFilter)}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "all") {
                  onProjectFilterChange("all");
                  return;
                }
                const parsed = Number(v);
                onProjectFilterChange(Number.isFinite(parsed) ? parsed : "all");
              }}
            >
              <option value="all">All projects</option>
              {projectFilterOptions.map((p) => (
                <option key={`${p.id}-${p.name}`} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
            <Form.Label className="small text-muted mb-1">Member</Form.Label>
            <Form.Select
              size="sm"
              value={memberFilter}
              onChange={(e) => onMemberFilterChange(e.target.value)}
            >
              <option value="all">All members</option>
              {memberExtensions.map((ext) => (
                <option key={ext} value={ext}>
                  {formatWorkloadMemberLabel(ext, hierarchyDataExtensions)}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
            <Form.Label className="small text-muted mb-1">Stale (days)</Form.Label>
            <Form.Select
              size="sm"
              value={String(staleDays)}
              onChange={(e) => onStaleDaysChange(Number(e.target.value))}
            >
              <option value="3">3+ days</option>
              <option value="5">5+ days</option>
              <option value="7">7+ days</option>
              <option value="14">14+ days</option>
            </Form.Select>
          </Col>
          <Col xs={12} md="auto" className="workload-reports-filters__apply-col">
            <Form.Label
              className="small text-muted mb-1 workload-reports-filters__apply-label"
              aria-hidden="true"
            >
              &nbsp;
            </Form.Label>
            <Button
              variant="dark"
              size="sm"
              className="workload-reports-filters__apply-btn"
              disabled={!enabled || loadingOverview}
              onClick={onApply}
            >
              Apply
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
