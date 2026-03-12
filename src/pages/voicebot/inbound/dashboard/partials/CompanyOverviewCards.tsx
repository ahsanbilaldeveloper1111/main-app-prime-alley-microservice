import React from "react";
import { Row, Col } from "react-bootstrap";

export interface CompanyOverviewCardsProps {
  isAdmin: boolean;
  loading: boolean;
  totalCompanies: number;
  publishedBots: number;
  successRate: string;
  avgDuration: string;
  activeBots: number;
  totalCalls: number;
  transferRate: string;
  totalCostFormatted: string;
}

const CompanyOverviewCards = ({
  isAdmin,
  loading,
  totalCompanies,
  publishedBots,
  successRate,
  avgDuration,
  activeBots,
  totalCalls,
  transferRate,
  totalCostFormatted,
}: CompanyOverviewCardsProps) => (
  <>
    <h5 className="mb-3">Company Overview</h5>
    <Row className="mb-4">
      {isAdmin && (
        <Col md={6} lg={3} className="mb-3">
          <div className="p-3 rounded border bg-light">
            <div className="small text-muted">Total Companies</div>
            <div className="h5 mb-0 fw-bold">{loading ? "—" : totalCompanies}</div>
          </div>
        </Col>
      )}
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Published Bots</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : publishedBots}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Success Rate</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : `${successRate}%`}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Avg Duration</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : avgDuration}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Active Bots</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : activeBots}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Total Calls</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : totalCalls}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Transfer Rate</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : `${transferRate}%`}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Total Cost</div>
          <div className="h5 mb-0 fw-bold">{loading ? "—" : totalCostFormatted}</div>
        </div>
      </Col>
    </Row>
  </>
);

export default CompanyOverviewCards;
