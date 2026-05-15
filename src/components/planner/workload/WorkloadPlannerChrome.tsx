import React from "react";
import { Badge, Button, Card, Col, Form, Nav, Row } from "react-bootstrap";
import { Download, LayoutGrid, ListTodo, RefreshCw } from "lucide-react";
import type { AssigneeMatch, WorkloadRangePreset } from "@utils/tasks";

type MainView = "grid" | "board";

type WorkloadPlannerPageHeaderProps = Readonly<{
  onExportCsv: () => void;
  onRefresh: () => void;
  onOpenUnassigned: () => void;
  enabled: boolean;
  unassignedCount: number | undefined;
}>;

export function WorkloadPlannerPageHeader({
  onExportCsv,
  onRefresh,
  onOpenUnassigned,
  enabled,
  unassignedCount,
}: WorkloadPlannerPageHeaderProps) {
  return (
    <div className="workload-page__header">
      <div>
        <h1 className="workload-page__title">Workload</h1>
        <p className="text-muted small mb-0">
          Team capacity for the selected week. Owner-only visibility follows server rules.
        </p>
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <Button variant="outline-secondary" size="sm" onClick={onExportCsv}>
          <Download size={16} className="me-1" />
          Export CSV
        </Button>
        <Button variant="outline-primary" size="sm" onClick={onRefresh} disabled={!enabled}>
          <RefreshCw size={16} className="me-1" />
          Refresh
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onOpenUnassigned}>
          <ListTodo size={16} className="me-1" />
          Unassigned
          {unassignedCount != null && unassignedCount > 0 ? (
            <Badge bg="danger" className="ms-1">
              {unassignedCount}
            </Badge>
          ) : null}
        </Button>
      </div>
    </div>
  );
}

type WorkloadPlannerFiltersCardProps = Readonly<{
  range: WorkloadRangePreset;
  onRangeChange: (value: WorkloadRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  customRangeInvalid: boolean;
  assigneeMatch: AssigneeMatch;
  onAssigneeMatchChange: (value: AssigneeMatch) => void;
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  enabled: boolean;
}>;

export function WorkloadPlannerFiltersCard({
  range,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  customRangeInvalid,
  assigneeMatch,
  onAssigneeMatchChange,
  mainView,
  onMainViewChange,
  enabled,
}: WorkloadPlannerFiltersCardProps) {
  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body className="py-2">
        <Row className="g-2 align-items-end">
          <Col xs={12} md="auto">
            <Form.Label className="small text-muted mb-1">Date range</Form.Label>
            <Form.Select
              size="sm"
              value={range}
              onChange={(e) => onRangeChange(e.target.value as WorkloadRangePreset)}
              disabled={!enabled}
            >
              <option value="this_week">This week</option>
              <option value="next_week">Next week</option>
              <option value="custom">Custom range</option>
            </Form.Select>
          </Col>
          {range === "custom" ? (
            <>
              <Col xs={6} md="auto">
                <Form.Label className="small text-muted mb-1">From</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customStart}
                  onChange={(e) => onCustomStartChange(e.target.value)}
                  disabled={!enabled}
                  isInvalid={customRangeInvalid}
                />
              </Col>
              <Col xs={6} md="auto">
                <Form.Label className="small text-muted mb-1">To</Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={customEnd}
                  onChange={(e) => onCustomEndChange(e.target.value)}
                  disabled={!enabled}
                  isInvalid={customRangeInvalid}
                />
              </Col>
            </>
          ) : null}
          <Col xs={12} md="auto">
            <Form.Label className="small text-muted mb-1">Assignee match</Form.Label>
            <Form.Select
              size="sm"
              value={assigneeMatch}
              onChange={(e) => onAssigneeMatchChange(e.target.value as AssigneeMatch)}
              disabled={!enabled}
            >
              <option value="primary">Primary assignee</option>
              <option value="any">Any assignee</option>
            </Form.Select>
          </Col>
          <Col xs={12} md className="d-flex align-items-end justify-content-md-end pt-2 pt-md-0">
            <Nav variant="pills" className="gap-1">
              <Nav.Item>
                <Nav.Link
                  active={mainView === "grid"}
                  onClick={() => onMainViewChange("grid")}
                  className="d-flex align-items-center py-1 px-2 small"
                >
                  <LayoutGrid size={16} className="me-1" />
                  Grid
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={mainView === "board"}
                  onClick={() => onMainViewChange("board")}
                  className="d-flex align-items-center py-1 px-2 small"
                >
                  <ListTodo size={16} className="me-1" />
                  Board
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}
