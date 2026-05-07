import React from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import type { CampaignData, StageData } from "@utils/crm";

export type CrmInsightsFiltersBarProps = {
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  selectedOwner: string;
  onOwnerChange: (v: string) => void;
  selectedCampaign: number | null;
  onCampaignChange: (v: number | null) => void;
  selectedStage: number | null;
  onStageChange: (v: number | null) => void;
  users: Record<string, unknown>[];
  campaigns: CampaignData[];
  stages: StageData[];
  onApply: () => void;
  onReset: () => void;
  loading: boolean;
  dealLoading: boolean;
  orderLoading: boolean;
};

export function CrmInsightsFiltersBar({
  selectedDateRange,
  onDateRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedOwner,
  onOwnerChange,
  selectedCampaign,
  onCampaignChange,
  selectedStage,
  onStageChange,
  users,
  campaigns,
  stages,
  onApply,
  onReset,
  loading,
  dealLoading,
  orderLoading,
}: CrmInsightsFiltersBarProps) {
  return (
    <div style={{ padding: "24px 32px 0", background: "#f8f9fa" }}>
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={2}>
              <Form.Label className="small fw-bold mb-2">Date Range</Form.Label>
              <Form.Select
                size="sm"
                style={{ fontSize: "0.875rem" }}
                value={selectedDateRange}
                onChange={(e) => onDateRangeChange(e.target.value)}
              >
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </Form.Select>
            </Col>
            {selectedDateRange === "custom" && (
              <>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">From Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    style={{ fontSize: "0.875rem" }}
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                  />
                </Col>
                <Col md={2}>
                  <Form.Label className="small fw-bold mb-2">To Date</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    style={{ fontSize: "0.875rem" }}
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                  />
                </Col>
              </>
            )}
            <Col md={selectedDateRange === "custom" ? 2 : 3}>
              <Form.Label className="small fw-bold mb-2">Owner</Form.Label>
              <Form.Select
                size="sm"
                style={{ fontSize: "0.875rem" }}
                value={selectedOwner}
                onChange={(e) => onOwnerChange(e.target.value)}
              >
                <option value="">All Owners</option>
                {users.map((user) => {
                  const userId = user.id ?? user.extension ?? user;
                  const userLabel =
                    (user.display_name as string | undefined) ||
                    (user.name as string | undefined) ||
                    String(userId);
                  return (
                    <option key={String(userId)} value={String(userId)}>
                      {userLabel}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
            <Col md={selectedDateRange === "custom" ? 2 : 3}>
              <Form.Label className="small fw-bold mb-2">Campaign</Form.Label>
              <Form.Select
                size="sm"
                style={{ fontSize: "0.875rem" }}
                value={selectedCampaign || ""}
                onChange={(e) =>
                  onCampaignChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)
                }
              >
                <option value="">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={selectedDateRange === "custom" ? 2 : 3}>
              <Form.Label className="small fw-bold mb-2">Stage</Form.Label>
              <Form.Select
                size="sm"
                style={{ fontSize: "0.875rem" }}
                value={selectedStage || ""}
                onChange={(e) =>
                  onStageChange(e.target.value ? Number.parseInt(e.target.value, 10) : null)
                }
              >
                <option value="">All Stages</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id.toString()}>
                    {stage.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={selectedDateRange === "custom" ? 2 : 3}>
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-grow-1"
                  onClick={onApply}
                  disabled={loading || dealLoading || orderLoading}
                >
                  Apply
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={onReset}>
                  Reset
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}
