import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { TIME_PERIODS } from "./constants";

export interface CompanyOption {
  id: string;
  identifier?: string;
  name: string;
}

export interface AnalyticsFiltersProps {
  isAdmin: boolean;
  companyFilter: string;
  timePeriod: string;
  companies: CompanyOption[];
  onCompanyChange: (value: string) => void;
  onTimePeriodChange: (value: string) => void;
}

const AnalyticsFilters = ({
  isAdmin,
  companyFilter,
  timePeriod,
  companies,
  onCompanyChange,
  onTimePeriodChange,
}: AnalyticsFiltersProps) => (
  <Row className="mb-3">
    <Col md={12}>
      <div className="page-header-title style-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h2 className="mb-0">Analytics</h2>
        <div className="d-flex align-items-center gap-2">
          {isAdmin && (
            <Form.Group className="mb-0">
              <Form.Select
                style={{ width: "200px" }}
                value={companyFilter}
                onChange={(e) => onCompanyChange(e.target.value)}
              >
                <option value="">All companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-0">
            <Form.Select
              style={{ width: "160px" }}
              value={timePeriod}
              onChange={(e) => onTimePeriodChange(e.target.value)}
            >
              {TIME_PERIODS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </div>
      </div>
    </Col>
  </Row>
);

export default AnalyticsFilters;
