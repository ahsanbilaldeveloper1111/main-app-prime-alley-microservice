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
  CrmInsightsPieTableRow,
  CrmInsightsReportEmptyState,
  CrmInsightsReportPanel,
  CrmInsightsReportScrollTable,
  CrmInsightsResponsiveKpiSlot,
  CrmInsightsSwatchLabel,
  CrmInsightsTd,
  CrmInsightsTh,
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
      <CrmInsightsReportScrollTable
        maxHeight={340}
        headerRow={
          <tr>
            <CrmInsightsTh>Stage</CrmInsightsTh>
            <CrmInsightsTh align="center">Currency</CrmInsightsTh>
            <CrmInsightsTh align="right">Deals</CrmInsightsTh>
            <CrmInsightsTh align="right">Total Value</CrmInsightsTh>
            <CrmInsightsTh align="right">% of Total</CrmInsightsTh>
          </tr>
        }
      >
        {dealFunnel.map((item, index) => (
          <tr key={`funnel-${item.stage}-${item.currency}-${index}`}>
            <CrmInsightsTd>
              <CrmInsightsSwatchLabel
                swatchColor={funnelColors[index % funnelColors.length]}
                label={item.stage}
              />
            </CrmInsightsTd>
            <CrmInsightsTd align="center" style={{ color: "#6b7280" }}>
              {item.currency}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
              {item.count}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#10b981" }}>
              {item.currency}{" "}
              {item.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
              {item.percentage.toFixed(1)}%
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  } else {
    funnelReportBody = (
      <CrmInsightsReportEmptyState height={340}>No funnel data available</CrmInsightsReportEmptyState>
    );
  }

  let dealValueReportBody: React.ReactNode;
  const dealValueRows = dealValue?.by_owner;
  if (dealLoading) {
    dealValueReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (dealValueRows && dealValueRows.length > 0) {
    dealValueReportBody = (
      <CrmInsightsReportScrollTable
        maxHeight={280}
        headerRow={
          <tr>
            <CrmInsightsTh>Owner</CrmInsightsTh>
            <CrmInsightsTh align="center">Currency</CrmInsightsTh>
            <CrmInsightsTh align="right">Deals</CrmInsightsTh>
            <CrmInsightsTh align="right">Total Value</CrmInsightsTh>
            <CrmInsightsTh align="right">Avg Value</CrmInsightsTh>
          </tr>
        }
      >
        {dealValueRows.map((item, index) => (
          <tr key={`value-owner-${item.owner}-${item.currency}-${index}`}>
            <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>
              {getUserDisplayName(item.owner)}
            </CrmInsightsTd>
            <CrmInsightsTd align="center" style={{ color: "#6b7280" }}>
              {item.currency}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
              {item.deal_count}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#10b981" }}>
              {item.currency}{" "}
              {item.total_value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
              {item.currency}{" "}
              {item.avg_value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  } else {
    dealValueReportBody = (
      <CrmInsightsReportEmptyState height={280}>No deal value data available</CrmInsightsReportEmptyState>
    );
  }

  let stageDurationReportBody: React.ReactNode;
  if (dealLoading) {
    stageDurationReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (dealStageDuration.length > 0) {
    stageDurationReportBody = (
      <CrmInsightsReportScrollTable
        maxHeight={280}
        headerRow={
          <tr>
            <CrmInsightsTh>Stage</CrmInsightsTh>
            <CrmInsightsTh align="right">Deals</CrmInsightsTh>
            <CrmInsightsTh align="right">Avg Duration (Days)</CrmInsightsTh>
          </tr>
        }
      >
        {dealStageDuration
          .filter((item) => item.deal_count > 0)
          .map((item, index) => (
            <tr key={`deal-duration-${item.stage}-${index}`}>
              <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>{item.stage}</CrmInsightsTd>
              <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
                {item.deal_count}
              </CrmInsightsTd>
              <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
                {item.avg_duration_days.toFixed(1)}
              </CrmInsightsTd>
            </tr>
          ))}
      </CrmInsightsReportScrollTable>
    );
  } else {
    stageDurationReportBody = (
      <CrmInsightsReportEmptyState height={280}>No stage duration data available</CrmInsightsReportEmptyState>
    );
  }

  let lostReasonsReportBody: React.ReactNode;
  if (dealLoading) {
    lostReasonsReportBody = <CrmInsightsLoadingSpinner height={300} />;
  } else if (dealLostReasons.length > 0) {
    lostReasonsReportBody = (
      <CrmInsightsPieTableRow
        leftColXs={5}
        rightColXs={7}
        left={
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
        }
        right={
          <CrmInsightsReportScrollTable
            maxHeight={300}
            headerRow={
              <tr>
                <CrmInsightsTh>Lost Reason</CrmInsightsTh>
                <CrmInsightsTh align="center">Currency</CrmInsightsTh>
                <CrmInsightsTh align="right">Count</CrmInsightsTh>
                <CrmInsightsTh align="right">% of Lost</CrmInsightsTh>
                <CrmInsightsTh align="right">Total Value Lost</CrmInsightsTh>
              </tr>
            }
          >
            {dealLostReasons.map((item, rowIdx) => (
              <tr key={`lost-reason-${item.reason}-${item.currency}-${rowIdx}`}>
                <CrmInsightsTd>
                  <CrmInsightsSwatchLabel
                    swatchColor={lostColors[rowIdx % lostColors.length]}
                    label={item.reason}
                  />
                </CrmInsightsTd>
                <CrmInsightsTd align="center" style={{ color: "#6b7280" }}>
                  {item.currency}
                </CrmInsightsTd>
                <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
                  {item.count}
                </CrmInsightsTd>
                <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
                  {item.percentage.toFixed(1)}%
                </CrmInsightsTd>
                <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#ef4444" }}>
                  {item.currency}{" "}
                  {item.total_value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </CrmInsightsTd>
              </tr>
            ))}
          </CrmInsightsReportScrollTable>
        }
      />
    );
  } else {
    lostReasonsReportBody = (
      <CrmInsightsReportEmptyState height={300}>No lost reasons data available</CrmInsightsReportEmptyState>
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
