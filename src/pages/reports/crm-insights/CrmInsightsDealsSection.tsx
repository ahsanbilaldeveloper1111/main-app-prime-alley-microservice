import React from "react";
import { Row, Col } from "react-bootstrap";
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
import {
  CrmInsightsKpiCard,
  CrmInsightsLoadingSpinner,
  CrmInsightsReportPanel,
  CrmInsightsResponsiveKpiSlot,
} from "./crmInsightsUi";

export type CrmInsightsDealsSectionProps = Readonly<{
  dealLoading: boolean;
  dealValue: DealValueReport | null;
  dealConversion: DealConversionReport | null;
  dealFunnel: DealFunnelReport[];
  dealStageDuration: DealStageDurationReport[];
  dealLostReasons: DealLostReasonReport[];
  getUserDisplayName: (extension: string | number) => string;
}>;

function AedTotalCompactHeading({
  dealValue,
}: Readonly<{ dealValue: DealValueReport | null }>) {
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

  let funnelReportBody: React.ReactNode;
  if (dealLoading) {
    funnelReportBody = <CrmInsightsLoadingSpinner height={340} />;
  } else if (dealFunnel.length > 0) {
    funnelReportBody = (
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
    );
  } else {
    funnelReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "340px" }}
      >
        No funnel data available
      </div>
    );
  }

  let dealValueReportBody: React.ReactNode;
  const dealValueRows = dealValue?.by_owner;
  if (dealLoading) {
    dealValueReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (dealValueRows && dealValueRows.length > 0) {
    dealValueReportBody = (
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
            {dealValueRows.map((item, index) => (
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
    );
  } else {
    dealValueReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No deal value data available
      </div>
    );
  }

  let stageDurationReportBody: React.ReactNode;
  if (dealLoading) {
    stageDurationReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (dealStageDuration.length > 0) {
    stageDurationReportBody = (
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
    );
  } else {
    stageDurationReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No stage duration data available
      </div>
    );
  }

  let lostReasonsReportBody: React.ReactNode;
  if (dealLoading) {
    lostReasonsReportBody = <CrmInsightsLoadingSpinner height={300} />;
  } else if (dealLostReasons.length > 0) {
    lostReasonsReportBody = (
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
    );
  } else {
    lostReasonsReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "300px" }}
      >
        No lost reasons data available
      </div>
    );
  }

  const dealKpiDesktopCol = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
    style: { flex: "0 0 auto" as const, width: "25%" },
  };
  const dealKpiMobileCol = { xs: 12, sm: 6, md: 4 };

  return (
    <div style={{ padding: "0 32px 24px", background: "#f8f9fa" }}>
      <div style={{ marginBottom: "24px" }}>
        <h6 className="mb-3" style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
          Deal Overview
        </h6>
        <Row className="g-3">
          <CrmInsightsResponsiveKpiSlot
            desktopCol={dealKpiDesktopCol}
            mobileCol={dealKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#10b981"
                icon={<DollarSign size={16} />}
                label="TOTAL VALUE (AED)"
                value={<AedTotalCompactHeading dealValue={dealValue} />}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={dealKpiDesktopCol}
            mobileCol={dealKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#4F46E5"
                icon={<Handshake size={16} />}
                label="TOTAL DEALS"
                value={dealConversion?.total_deals || 0}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={dealKpiDesktopCol}
            mobileCol={dealKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#f59e0b"
                icon={<ShoppingBag size={16} />}
                label="CONVERTED TO ORDERS"
                value={dealConversion?.converted_to_orders || 0}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={dealKpiDesktopCol}
            mobileCol={dealKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#8b5cf6"
                icon={<TrendingUp size={16} />}
                label="CONVERSION RATE"
                value={`${dealConversion?.conversion_rate?.toFixed(1) || "0.0"}%`}
                footer={
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {dealConversion?.converted_to_orders || 0} of {dealConversion?.total_deals || 0} deals
                  </span>
                }
              />
            )}
          />
        </Row>
      </div>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <CrmInsightsReportPanel title="Deal Funnel Report">{funnelReportBody}</CrmInsightsReportPanel>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <CrmInsightsReportPanel title="Deal Value Report">{dealValueReportBody}</CrmInsightsReportPanel>
        </Col>

        <Col lg={6}>
          <CrmInsightsReportPanel title="Stage Duration Report">{stageDurationReportBody}</CrmInsightsReportPanel>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <CrmInsightsReportPanel title="Lost Reasons Report">{lostReasonsReportBody}</CrmInsightsReportPanel>
        </Col>
      </Row>
    </div>
  );
}
