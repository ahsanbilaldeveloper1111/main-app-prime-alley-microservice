import React from "react";
import { Row, Col, Card } from "react-bootstrap";
import {
  DollarSign,
  Handshake,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import type {
  DealConversionReport,
  DealFunnelReport,
  DealLostReasonReport,
  DealStageDurationReport,
  DealValueReport,
} from "@utils/crm";
import {
  CRM_INSIGHTS_FUNNEL_STAGE_COLORS,
  CRM_INSIGHTS_LOST_REASON_COLORS,
  formatAedTotalCompact,
} from "./crmInsightsDomain";

export type CrmInsightsDealsSectionProps = {
  dealLoading: boolean;
  dealValue: DealValueReport | null;
  dealConversion: DealConversionReport | null;
  dealFunnel: DealFunnelReport[];
  dealStageDuration: DealStageDurationReport[];
  dealLostReasons: DealLostReasonReport[];
  getUserDisplayName: (extension: string | number) => string;
};

function AedTotalCompactHeading({ dealValue }: { dealValue: DealValueReport | null }) {
  const aed =
    dealValue?.by_currency?.find((c) => c.currency === "AED")?.total_value || 0;
  return <>{formatAedTotalCompact(aed)}</>;
}

export function CrmInsightsDealsSection({
  dealLoading,
  dealValue,
  dealConversion,
  dealFunnel,
  dealStageDuration,
  dealLostReasons,
  getUserDisplayName,
}: CrmInsightsDealsSectionProps) {
  const funnelColors = CRM_INSIGHTS_FUNNEL_STAGE_COLORS;
  const lostColors = CRM_INSIGHTS_LOST_REASON_COLORS;

  return (
    <div style={{ padding: "0 32px 24px", background: "#f8f9fa" }}>
      <div style={{ marginBottom: "24px" }}>
        <h6 className="mb-3" style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
          Deal Overview
        </h6>
        <Row className="g-3">
          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "25%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#10b981" }}>
                    <DollarSign size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      TOTAL VALUE (AED)
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  <AedTotalCompactHeading dealValue={dealValue} />
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#10b981" }}>
                    <DollarSign size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      TOTAL VALUE (AED)
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  <AedTotalCompactHeading dealValue={dealValue} />
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "25%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#4F46E5" }}>
                    <Handshake size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      TOTAL DEALS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.total_deals || 0}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#4F46E5" }}>
                    <Handshake size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      TOTAL DEALS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.total_deals || 0}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "25%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#f59e0b" }}>
                    <ShoppingBag size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      CONVERTED TO ORDERS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.converted_to_orders || 0}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#f59e0b" }}>
                    <ShoppingBag size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      CONVERTED TO ORDERS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.converted_to_orders || 0}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "25%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#8b5cf6" }}>
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      CONVERSION RATE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.conversion_rate?.toFixed(1) || "0.0"}%
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2">
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {dealConversion?.converted_to_orders || 0} of {dealConversion?.total_deals || 0}{" "}
                    deals
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#8b5cf6" }}>
                    <TrendingUp size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      CONVERSION RATE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {dealConversion?.conversion_rate?.toFixed(1) || "0.0"}%
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2">
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {dealConversion?.converted_to_orders || 0} of {dealConversion?.total_deals || 0}{" "}
                    deals
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Deal Funnel Report
            </h6>
            {dealLoading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "340px" }}
              >
                <div className="spinner-border spinner-border-sm">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : dealFunnel.length > 0 ? (
              <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
                  <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ border: "none", padding: "10px", fontWeight: 600, color: "#1f2937" }}>
                        Stage
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "center",
                        }}
                      >
                        Currency
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Deals
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Total Value
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        % of Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealFunnel.map((item, index) => (
                      <tr key={`funnel-${item.stage}-${item.currency}-${index}`}>
                        <td style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "2px",
                                background: funnelColors[index % funnelColors.length],
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ color: "#1f2937", fontWeight: 500 }}>{item.stage}</span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          {item.currency}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#1f2937",
                          }}
                        >
                          {item.count}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#10b981",
                          }}
                        >
                          {item.currency}{" "}
                          {item.value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#4F46E5",
                          }}
                        >
                          {item.percentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: "340px" }}
              >
                No funnel data available
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Deal Value Report
            </h6>
            {dealLoading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "280px" }}
              >
                <div className="spinner-border spinner-border-sm">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : dealValue?.by_owner && dealValue.by_owner.length > 0 ? (
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
                  <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ border: "none", padding: "10px", fontWeight: 600, color: "#1f2937" }}>
                        Owner
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "center",
                        }}
                      >
                        Currency
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Deals
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Total Value
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Avg Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealValue.by_owner.map((item, index) => (
                      <tr key={`value-owner-${item.owner}-${item.currency}-${index}`}>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            color: "#1f2937",
                            fontWeight: 500,
                          }}
                        >
                          {getUserDisplayName(item.owner)}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          {item.currency}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#1f2937",
                          }}
                        >
                          {item.deal_count}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#10b981",
                          }}
                        >
                          {item.currency}{" "}
                          {item.total_value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td
                          style={{
                            padding: "10px",
                            borderTop: "1px solid #f0f0f0",
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#4F46E5",
                          }}
                        >
                          {item.currency}{" "}
                          {item.avg_value.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: "280px" }}
              >
                No deal value data available
              </div>
            )}
          </div>
        </Col>

        <Col lg={6}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Stage Duration Report
            </h6>
            {dealLoading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "280px" }}
              >
                <div className="spinner-border spinner-border-sm">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : dealStageDuration.length > 0 ? (
              <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
                  <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
                    <tr>
                      <th style={{ border: "none", padding: "10px", fontWeight: 600, color: "#1f2937" }}>
                        Stage
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Deals
                      </th>
                      <th
                        style={{
                          border: "none",
                          padding: "10px",
                          fontWeight: 600,
                          color: "#1f2937",
                          textAlign: "right",
                        }}
                      >
                        Avg Duration (Days)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealStageDuration
                      .filter((item) => item.deal_count > 0)
                      .map((item, index) => (
                        <tr key={`deal-duration-${item.stage}-${index}`}>
                          <td
                            style={{
                              padding: "10px",
                              borderTop: "1px solid #f0f0f0",
                              color: "#1f2937",
                              fontWeight: 500,
                            }}
                          >
                            {item.stage}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              borderTop: "1px solid #f0f0f0",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {item.deal_count}
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              borderTop: "1px solid #f0f0f0",
                              textAlign: "right",
                              fontWeight: 600,
                              color: "#4F46E5",
                            }}
                          >
                            {item.avg_duration_days.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: "280px" }}
              >
                No stage duration data available
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Lost Reasons Report
            </h6>
            {dealLoading ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "300px" }}
              >
                <div className="spinner-border spinner-border-sm">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : dealLostReasons.length > 0 ? (
              <Row className="g-0">
                <Col xs={5}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dealLostReasons as unknown as Record<string, unknown>[]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {dealLostReasons.map((entry, pieIdx) => (
                          <Cell
                            key={`cell-${entry.reason}-${entry.currency}-${pieIdx}`}
                            fill={lostColors[pieIdx % lostColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
                <Col xs={7}>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
                      <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th style={{ border: "none", padding: "10px", fontWeight: 600, color: "#1f2937" }}>
                            Lost Reason
                          </th>
                          <th
                            style={{
                              border: "none",
                              padding: "10px",
                              fontWeight: 600,
                              color: "#1f2937",
                              textAlign: "center",
                            }}
                          >
                            Currency
                          </th>
                          <th
                            style={{
                              border: "none",
                              padding: "10px",
                              fontWeight: 600,
                              color: "#1f2937",
                              textAlign: "right",
                            }}
                          >
                            Count
                          </th>
                          <th
                            style={{
                              border: "none",
                              padding: "10px",
                              fontWeight: 600,
                              color: "#1f2937",
                              textAlign: "right",
                            }}
                          >
                            % of Lost
                          </th>
                          <th
                            style={{
                              border: "none",
                              padding: "10px",
                              fontWeight: 600,
                              color: "#1f2937",
                              textAlign: "right",
                            }}
                          >
                            Total Value Lost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dealLostReasons.map((item, rowIdx) => (
                          <tr key={`lost-reason-${item.reason}-${item.currency}-${rowIdx}`}>
                            <td style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "2px",
                                    background: lostColors[rowIdx % lostColors.length],
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ color: "#1f2937", fontWeight: 500 }}>{item.reason}</span>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "center",
                                color: "#6b7280",
                              }}
                            >
                              {item.currency}
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#1f2937",
                              }}
                            >
                              {item.count}
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#4F46E5",
                              }}
                            >
                              {item.percentage.toFixed(1)}%
                            </td>
                            <td
                              style={{
                                padding: "10px",
                                borderTop: "1px solid #f0f0f0",
                                textAlign: "right",
                                fontWeight: 600,
                                color: "#ef4444",
                              }}
                            >
                              {item.currency}{" "}
                              {item.total_value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Col>
              </Row>
            ) : (
              <div
                className="d-flex justify-content-center align-items-center text-muted"
                style={{ height: "300px" }}
              >
                No lost reasons data available
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
