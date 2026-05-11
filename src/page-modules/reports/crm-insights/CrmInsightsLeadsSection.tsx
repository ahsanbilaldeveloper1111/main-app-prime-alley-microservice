import React from "react";
import { Row, Col } from "react-bootstrap";
import {
  Users,
  UserPlus,
  UserCheck,
  AlertCircle,
  Handshake,
} from "lucide-react";
import KPIOverview from "@components/KPIS-overview";
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import type {
  LeadAssignmentReport,
  LeadConversionReport,
  LeadOverviewReport,
  LeadSourceReport,
  LeadStageDurationReport,
} from "@utils/crm";
import {
  buildLeadConversionTableRows,
  CRM_INSIGHTS_PIE_COLORS_LEAD_SOURCE,
} from "./crmInsightsDomain";
import {
  CrmInsightsLoadingSpinner,
  CrmInsightsReportEmptyState,
  CrmInsightsReportPanel,
  CrmInsightsReportScrollTable,
  CrmInsightsTd,
  CrmInsightsTh,
} from "./crmInsightsUi";

export type CrmInsightsLeadsSectionProps = Readonly<{
  loading: boolean;
  leadOverview: LeadOverviewReport | null;
  leadConversion: LeadConversionReport | null;
  leadSources: LeadSourceReport[];
  leadAssignments: LeadAssignmentReport[];
  leadStageDuration: LeadStageDurationReport[];
  getUserDisplayName: (extension: string | number) => string;
}>;

export function CrmInsightsLeadsSection({
  loading,
  leadOverview,
  leadConversion,
  leadSources,
  leadAssignments,
  leadStageDuration,
  getUserDisplayName,
}: CrmInsightsLeadsSectionProps) {
  const conversionRows = buildLeadConversionTableRows(leadConversion);
  const colors = CRM_INSIGHTS_PIE_COLORS_LEAD_SOURCE;

  let sourceAnalysisBody: React.ReactNode;
  if (loading) {
    sourceAnalysisBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (leadSources.length === 0) {
    sourceAnalysisBody = (
      <CrmInsightsReportEmptyState height={280}>No source data available</CrmInsightsReportEmptyState>
    );
  } else {
    sourceAnalysisBody = (
      <Row className="g-0">
        <Col xs={6}>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={leadSources.map((s) => ({
                  name: s.source || "Unknown",
                  value: Number.parseInt(s.count, 10),
                  percentage: s.percentage,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                {leadSources.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.source || "unknown"}-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={6}>
          <div className="d-flex flex-column justify-content-center h-100 ps-2">
            {leadSources.map((item, idx) => (
              <div
                key={`source-${item.source || "unknown"}-${idx}`}
                className="d-flex align-items-center gap-2 mb-2"
                style={{ fontSize: "11px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "2px",
                    background: colors[idx % colors.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#6b7280", whiteSpace: "nowrap", flex: 1 }}>
                  {item.source || "Unknown"}
                </span>
                <span style={{ fontWeight: 600, color: "#1f2937" }}>{item.count}</span>
                <span style={{ color: "#6b7280", fontSize: "10px" }}>
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    );
  }

  let assignmentReportBody: React.ReactNode;
  if (loading) {
    assignmentReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (leadAssignments.length === 0) {
    assignmentReportBody = (
      <CrmInsightsReportEmptyState height={280}>No assignment data available</CrmInsightsReportEmptyState>
    );
  } else {
    assignmentReportBody = (
      <CrmInsightsReportScrollTable
        maxHeight={340}
        headerRow={
          <tr>
            <CrmInsightsTh>User/Owner</CrmInsightsTh>
            <CrmInsightsTh align="right">Assigned Leads</CrmInsightsTh>
          </tr>
        }
      >
        {leadAssignments.map((item) => (
          <tr key={`assignment-${item.user_extension}`}>
            <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>
              {getUserDisplayName(item.user_extension)}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
              {item.assigned_count}
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  }

  let conversionReportBody: React.ReactNode;
  if (loading) {
    conversionReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (conversionRows.length === 0) {
    conversionReportBody = (
      <CrmInsightsReportEmptyState height={280}>No conversion data available</CrmInsightsReportEmptyState>
    );
  } else {
    conversionReportBody = (
      <CrmInsightsReportScrollTable
        maxHeight={280}
        headerRow={
          <tr>
            <CrmInsightsTh>Stage</CrmInsightsTh>
            <CrmInsightsTh align="right">Total Leads</CrmInsightsTh>
            <CrmInsightsTh align="right">Converted</CrmInsightsTh>
            <CrmInsightsTh align="right">Conv. Rate</CrmInsightsTh>
          </tr>
        }
      >
        {conversionRows.map((item) => (
          <tr key={`conversion-${item.stage}`}>
            <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>{item.stage}</CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ color: "#6b7280" }}>
              {item.count}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#10b981" }}>
              {item.converted}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
              {item.conversionRate}%
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  }

  let stageDurationReportBody: React.ReactNode;
  if (loading) {
    stageDurationReportBody = <CrmInsightsLoadingSpinner height={280} />;
  } else if (leadStageDuration.length === 0) {
    stageDurationReportBody = (
      <CrmInsightsReportEmptyState height={280}>No stage duration data available</CrmInsightsReportEmptyState>
    );
  } else {
    stageDurationReportBody = (
      <CrmInsightsReportScrollTable
        maxHeight={280}
        headerRow={
          <tr>
            <CrmInsightsTh>Stage</CrmInsightsTh>
            <CrmInsightsTh align="right">Leads</CrmInsightsTh>
            <CrmInsightsTh align="right">Avg (Days)</CrmInsightsTh>
            <CrmInsightsTh align="right">Min</CrmInsightsTh>
            <CrmInsightsTh align="right">Max</CrmInsightsTh>
          </tr>
        }
      >
        {leadStageDuration.map((item, index) => (
          <tr key={`duration-${item.stage}-${index}`}>
            <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>{item.stage}</CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
              {item.lead_count}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#4F46E5" }}>
              {item.avg_duration_days.toFixed(1)}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ color: "#10b981" }}>
              {item.min_duration_days.toFixed(1)}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ color: "#6b7280" }}>
              {item.max_duration_days.toFixed(1)}
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  }

  return (
    <div style={{ padding: "0 32px 24px", background: "#f8f9fa" }}>
      <KPIOverview
        title="Lead Overview"
        items={[
          {
            icon: <Users size={24} />,
            iconColor: "#4F46E5",
            label: "TOTAL LEADS",
            value: (leadOverview?.total_leads || leadConversion?.total_leads || 0).toLocaleString(),
          },
          {
            icon: <UserPlus size={24} />,
            iconColor: "#10b981",
            label: "NEW LEADS",
            value: (leadOverview?.new_leads || 0).toLocaleString(),
          },
          {
            icon: <UserCheck size={24} />,
            iconColor: "#f59e0b",
            label: "ASSIGNED LEADS",
            value: (leadOverview?.owned_leads || 0).toLocaleString(),
            trend: {
              value: leadOverview?.total_leads
                ? `${((leadOverview.owned_leads / leadOverview.total_leads) * 100).toFixed(1)}% of total`
                : "0%",
              isPositive: false,
              label: "",
            },
          },
          {
            icon: <AlertCircle size={24} />,
            iconColor: "#3b82f6",
            label: "UNASSIGNED",
            value: (leadOverview?.unassigned_leads || 0).toLocaleString(),
          },
          {
            icon: <Handshake size={24} />,
            iconColor: "#8b5cf6",
            label: "CONVERTED",
            value: (leadConversion?.converted_to_deals || 0).toLocaleString(),
            trend: {
              value: leadConversion
                ? `${leadConversion.conversion_rate.toFixed(1)}% conversion`
                : "0%",
              isPositive: true,
              label: "",
            },
          },
        ]}
      />

      <Row className="g-3 mb-3">
        <Col lg={5}>
          <CrmInsightsReportPanel title="Lead Source Analysis" wrapStyle={{ height: "100%" }}>
            {sourceAnalysisBody}
          </CrmInsightsReportPanel>
        </Col>

        <Col lg={7}>
          <CrmInsightsReportPanel title="Lead Assignment Report" wrapStyle={{ height: "100%" }}>
            {assignmentReportBody}
          </CrmInsightsReportPanel>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <CrmInsightsReportPanel title="Conversion Report by Stage">{conversionReportBody}</CrmInsightsReportPanel>
        </Col>

        <Col lg={6}>
          <CrmInsightsReportPanel title="Stage Duration Report">{stageDurationReportBody}</CrmInsightsReportPanel>
        </Col>
      </Row>
    </div>
  );
}
