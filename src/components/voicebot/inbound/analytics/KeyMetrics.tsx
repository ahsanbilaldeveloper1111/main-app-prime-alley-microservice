import React from "react";
import { Row, Col } from "react-bootstrap";

export interface KeyMetricsProps {
  totalCalls: number;
  successRate: string;
  avgDuration: string;
  totalCost: string;
  completedCount: number;
  transferRate: string;
  failedCount: number;
  costPerCall: string;
}

const KeyMetrics = ({
  totalCalls,
  successRate,
  avgDuration,
  totalCost,
  completedCount,
  transferRate,
  failedCount,
  costPerCall,
}: KeyMetricsProps) => (
  <>
    <h5 className="mb-3">Key Metrics</h5>
    <Row className="mb-4">
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Total Calls</div>
          <div className="h5 mb-0 fw-bold">{totalCalls}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Success Rate</div>
          <div className="h5 mb-0 fw-bold">{successRate}%</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Avg Duration</div>
          <div className="h5 mb-0 fw-bold">{avgDuration}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Total Cost</div>
          <div className="h5 mb-0 fw-bold">${totalCost}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Completed Calls</div>
          <div className="h5 mb-0 fw-bold">{completedCount}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Transfer Rate</div>
          <div className="h5 mb-0 fw-bold">{transferRate}%</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Failed Calls</div>
          <div className="h5 mb-0 fw-bold">{failedCount}</div>
        </div>
      </Col>
      <Col md={6} lg={3} className="mb-3">
        <div className="p-3 rounded border bg-light">
          <div className="small text-muted">Cost/Call</div>
          <div className="h5 mb-0 fw-bold">${costPerCall}</div>
        </div>
      </Col>
    </Row>
  </>
);

export default KeyMetrics;
