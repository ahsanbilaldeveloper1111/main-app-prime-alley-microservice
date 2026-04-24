import React, { useState } from "react";
import { Row, Col, Form, Button, Collapse, OverlayTrigger, Tooltip as BsTooltip } from "react-bootstrap";
import { ChevronDown, CircleHelp, Filter } from "lucide-react";
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

const INBOUND_COMPANY_FILTER_TIP =
  "Narrows stats, charts, and bot tables to the selected organization.";

const INBOUND_TIME_FILTER_TIP =
  "Sets the date range for key metrics, status and duration charts, call volume, and bot performance below.";

function InboundFilterHint({ id, text }: Readonly<{ id: string; text: string }>) {
  return (
    <OverlayTrigger placement="top" overlay={<BsTooltip id={`inbound-flt-tip-${id}`}>{text}</BsTooltip>}>
      <button
        type="button"
        className="btn btn-link p-0 ms-1 text-muted align-baseline shadow-none border-0 d-inline-flex"
        aria-label="More information"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
      </button>
    </OverlayTrigger>
  );
}

function labelWithHint(id: string, labelText: string, tooltip: string): React.ReactNode {
  return (
    <span className="d-inline-flex align-items-center">
      <span className="small text-muted">{labelText}</span>
      <InboundFilterHint id={id} text={tooltip} />
    </span>
  );
}

function AnalyticsFilters({
  isAdmin,
  companyFilter,
  timePeriod,
  companies,
  onCompanyChange,
  onTimePeriodChange,
}: Readonly<AnalyticsFiltersProps>) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Row className="mb-3">
      <Col md={12} className="d-flex flex-column align-items-start">
        <div className="d-flex align-items-center gap-2 flex-wrap w-100">
          <h2 className="mb-0">Analytics</h2>
          <Button
            variant="outline-secondary"
            size="sm"
            type="button"
            className="d-inline-flex align-items-center gap-1"
            aria-expanded={filtersOpen}
            aria-controls="inbound-analytics-filters"
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter size={16} strokeWidth={1.75} aria-hidden />
            Filters
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="text-muted"
              style={{
                transform: filtersOpen ? "rotate(180deg)" : undefined,
                transition: "transform 0.15s ease",
              }}
            />
          </Button>
        </div>
        <Collapse in={filtersOpen}>
          <div id="inbound-analytics-filters" className="w-100 pt-2">
            <div className="d-flex flex-wrap align-items-end gap-3">
              {isAdmin && (
                <Form.Group className="mb-0">
                  <Form.Label htmlFor="inbound-analytics-company" className="d-flex align-items-center mb-1 small text-muted">
                    {labelWithHint("company", "Company", INBOUND_COMPANY_FILTER_TIP)}
                  </Form.Label>
                  <Form.Select
                    id="inbound-analytics-company"
                    style={{ width: "200px" }}
                    value={companyFilter}
                    onChange={(e) => onCompanyChange(e.target.value)}
                  >
                    <option value="">All companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.identifier ?? c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              <Form.Group className="mb-0">
                <Form.Label htmlFor="inbound-analytics-time" className="d-flex align-items-center mb-1 small text-muted">
                  {labelWithHint("time", "Time period", INBOUND_TIME_FILTER_TIP)}
                </Form.Label>
                <Form.Select
                  id="inbound-analytics-time"
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
        </Collapse>
      </Col>
    </Row>
  );
}

export default AnalyticsFilters;
