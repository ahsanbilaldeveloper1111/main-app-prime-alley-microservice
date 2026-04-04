import React from "react";
import { Row, Col, Form, Alert, Button } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import { FiFilter, FiDatabase, FiUsers } from "react-icons/fi";
import PageSummaryGrid from "@components/PageSummaryGrid";

export interface CrmListDataAssignmentFormContentProps {
  entityLabel: string;
  assignmentFilters: {
    selectedTags: readonly any[];
    selectedCampaigns: readonly any[];
  };
  setAssignmentFilters: React.Dispatch<
    React.SetStateAction<{
      selectedTags: readonly any[];
      selectedCampaigns: readonly any[];
    }>
  >;
  availableTags: Array<{ value: string; label: string; id: number }>;
  availableCampaigns: Array<{ value: string; label: string; id: number }>;
  assignmentCounts: { total: number; assigned: number; unassigned: number };
  assignmentCampaign: readonly any[];
  setAssignmentCampaign: React.Dispatch<React.SetStateAction<readonly any[]>>;
  totalEntriesToAssign: number;
  setTotalEntriesToAssign: React.Dispatch<React.SetStateAction<number>>;
  assignmentDistribution: "equal" | "custom";
  setAssignmentDistribution: React.Dispatch<
    React.SetStateAction<"equal" | "custom">
  >;
  customDistribution: Record<string, number>;
  setCustomDistribution: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
}

const CREATABLE_SELECT_STYLES = {
  control: (base: any) => ({
    ...base,
    borderColor: "#ced4da",
    boxShadow: "none",
    fontSize: "14px",
  }),
};

export function CrmListDataAssignmentFormContent({
  entityLabel,
  assignmentFilters,
  setAssignmentFilters,
  availableTags,
  availableCampaigns,
  assignmentCounts,
  assignmentCampaign,
  setAssignmentCampaign,
  totalEntriesToAssign,
  setTotalEntriesToAssign,
  assignmentDistribution,
  setAssignmentDistribution,
  customDistribution,
  setCustomDistribution,
}: CrmListDataAssignmentFormContentProps) {
  const totalAllocated = Object.values(customDistribution).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <>
      {/* Step 1: Filter */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <FiFilter className="me-2 text-primary" />
          <h6 className="mb-0">Step 1: Filter Your {entityLabel}</h6>
        </div>
        <p className="text-muted small mb-3">
          Choose which {entityLabel.toLowerCase()} to assign by filtering by
          tags and campaigns.
        </p>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Tags</Form.Label>
              <CreatableSelect
                isMulti
                value={assignmentFilters.selectedTags}
                onChange={(selected) =>
                  setAssignmentFilters((prev) => ({
                    ...prev,
                    selectedTags: selected || [],
                  }))
                }
                options={availableTags}
                placeholder={`Select tags to filter ${entityLabel.toLowerCase()}...`}
                styles={CREATABLE_SELECT_STYLES}
              />
              <Form.Text className="text-muted">
                Only {entityLabel.toLowerCase()} with these tags will be
                considered for assignment.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Filter by Campaigns</Form.Label>
              <CreatableSelect
                isMulti
                value={assignmentFilters.selectedCampaigns}
                onChange={(selected) =>
                  setAssignmentFilters((prev) => ({
                    ...prev,
                    selectedCampaigns: selected || [],
                  }))
                }
                options={availableCampaigns}
                placeholder={`Select campaigns to filter ${entityLabel.toLowerCase()}...`}
                styles={CREATABLE_SELECT_STYLES}
              />
              <Form.Text className="text-muted">
                Only {entityLabel.toLowerCase()} from these campaigns will be
                considered for assignment.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Step 2: Review */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <FiDatabase className="me-2 text-info" />
          <h6 className="mb-0">
            Step 2: Review Available {entityLabel}
          </h6>
        </div>
        <p className="text-muted small mb-3">
          Based on your filters, here&apos;s what&apos;s available for
          assignment.
        </p>
        <Row>
          <Col md={12} className="text-left">
            <PageSummaryGrid
              gridColumns={3}
              cardHeading="h5"
              gridTextAlign="center"
              cards={[
                {
                  id: "total-entries",
                  title: `Total ${entityLabel}`,
                  value: assignmentCounts?.total || 0,
                  description: "Matching your filters",
                },
                {
                  id: "assigned-entries",
                  title: `Assigned ${entityLabel}`,
                  value: assignmentCounts?.assigned || 0,
                  description: "In use by team members",
                },
                {
                  id: "available-entries",
                  title: `Available ${entityLabel}`,
                  value: assignmentCounts?.unassigned || 0,
                  description: "Ready for assignment",
                },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Step 3: Configure */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <FiUsers className="me-2 text-success" />
          <h6 className="mb-0">Step 3: Configure Assignment</h6>
        </div>
        <p className="text-muted small mb-3">
          You have{" "}
          <strong>{assignmentCounts.unassigned.toLocaleString()}</strong>{" "}
          {entityLabel.toLowerCase()} ready for assignment out of{" "}
          <strong>{assignmentCounts.total.toLocaleString()}</strong> total
          matching {entityLabel.toLowerCase()}.
        </p>

        <Form.Group className="mb-3">
          <Form.Label>Target Campaigns *</Form.Label>
          <CreatableSelect
            isMulti
            value={assignmentCampaign}
            onChange={(selected) => setAssignmentCampaign(selected || [])}
            options={availableCampaigns}
            placeholder={`Choose which campaigns to assign ${entityLabel.toLowerCase()} to...`}
            styles={CREATABLE_SELECT_STYLES}
          />
          <Form.Text className="text-muted">
            <strong>Smart Distribution:</strong> {entityLabel} will be
            automatically distributed among users in the selected campaigns
            based on their workload and availability.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Assignment Quantity</Form.Label>
          <Form.Control
            type="number"
            min="0"
            max={assignmentCounts.unassigned}
            value={totalEntriesToAssign}
            onChange={(e) =>
              setTotalEntriesToAssign(Number.parseInt(e.target.value, 10) || 0)
            }
            placeholder={`How many ${entityLabel.toLowerCase()} to assign?`}
          />
          <Form.Text className="text-muted">
            <strong>Maximum:</strong>{" "}
            {assignmentCounts.unassigned.toLocaleString()}{" "}
            {entityLabel.toLowerCase()} available. Start with a smaller batch to
            test the assignment process.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Distribution Strategy</Form.Label>
          <div>
            <Form.Check
              type="radio"
              id="equal-distribution"
              name="assignmentDistribution"
              label="Auto-balance across campaigns"
              value="equal"
              checked={assignmentDistribution === "equal"}
              onChange={() => setAssignmentDistribution("equal")}
              className="mb-2"
            />
            <Form.Check
              type="radio"
              id="custom-distribution"
              name="assignmentDistribution"
              label="Custom allocation per campaign"
              value="custom"
              checked={assignmentDistribution === "custom"}
              onChange={() => setAssignmentDistribution("custom")}
            />
          </div>
          <Form.Text className="text-muted">
            <strong>Auto-balance:</strong> {entityLabel} are distributed evenly.{" "}
            <strong>Custom:</strong> You specify exactly how many{" "}
            {entityLabel.toLowerCase()} each campaign gets.
          </Form.Text>
        </Form.Group>

        {assignmentDistribution === "custom" &&
          assignmentCampaign.length > 0 && (
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0">Custom Distribution</Form.Label>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    const equalDist = Math.floor(
                      totalEntriesToAssign / assignmentCampaign.length,
                    );
                    const remainder =
                      totalEntriesToAssign % assignmentCampaign.length;
                    const newDist: Record<string, number> = {};
                    Array.from(assignmentCampaign).forEach(
                      (campaign: any, index: number) => {
                        newDist[campaign.value] =
                          equalDist + (index < remainder ? 1 : 0);
                      },
                    );
                    setCustomDistribution(newDist);
                  }}
                >
                  Auto-fill Equal
                </Button>
              </div>
              <div className="border rounded p-3 bg-light">
                <p className="small text-muted mb-3">
                  Total to assign: <strong>{totalEntriesToAssign}</strong> |
                  Allocated: <strong>{totalAllocated}</strong> | Remaining:{" "}
                  <strong>{totalEntriesToAssign - totalAllocated}</strong>
                </p>
                {Array.from(assignmentCampaign).map((campaign: any) => (
                  <div key={campaign.value} className="mb-2">
                    <Row>
                      <Col md={6}>
                        <Form.Label className="small mb-0">
                          {campaign.label}
                        </Form.Label>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="number"
                          min="0"
                          max={totalEntriesToAssign}
                          value={customDistribution[campaign.value] || 0}
                          onChange={(e) =>
                            setCustomDistribution((prev) => ({
                              ...prev,
                              [campaign.value]:
                                Number.parseInt(e.target.value, 10) || 0,
                            }))
                          }
                          size="sm"
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Form.Group>
          )}

        <Alert variant="info" className="mt-3">
          <strong>Assignment Info:</strong> {entityLabel} will be automatically
          assigned to users within the selected campaigns based on their campaign
          user extensions. The system will distribute {entityLabel.toLowerCase()}{" "}
          equally among users in each campaign.
        </Alert>
      </div>
    </>
  );
}
