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

export type CrmInsightsLeadsSectionProps = Readonly<{
  loading: boolean;
  leadOverview: LeadOverviewReport | null;
  leadConversion: LeadConversionReport | null;
  leadSources: LeadSourceReport[];
  leadAssignments: LeadAssignmentReport[];
  leadStageDuration: LeadStageDurationReport[];
  getUserDisplayName: (extension: string | number) => string;
}>;

const loadingSpinner280 = (
  <div className="d-flex justify-content-center align-items-center" style={{ height: "280px" }}>
    <div className="spinner-border spinner-border-sm">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

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
    sourceAnalysisBody = loadingSpinner280;
  } else if (leadSources.length === 0) {
    sourceAnalysisBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No source data available
      </div>
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
    assignmentReportBody = loadingSpinner280;
  } else if (leadAssignments.length === 0) {
    assignmentReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No assignment data available
      </div>
    );
  } else {
    assignmentReportBody = (
      <div style={{ maxHeight: "340px", overflowY: "auto" }}>
        <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
          <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th
                style={{
                  border: "none",
                  padding: "10px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
                User/Owner
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
                Assigned Leads
              </th>
            </tr>
          </thead>
          <tbody>
            {leadAssignments.map((item) => (
              <tr key={`assignment-${item.user_extension}`}>
                <td
                  style={{
                    padding: "10px",
                    borderTop: "1px solid #f0f0f0",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {getUserDisplayName(item.user_extension)}
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
                  {item.assigned_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  let conversionReportBody: React.ReactNode;
  if (loading) {
    conversionReportBody = loadingSpinner280;
  } else if (conversionRows.length === 0) {
    conversionReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No conversion data available
      </div>
    );
  } else {
    conversionReportBody = (
      <div style={{ maxHeight: "280px", overflowY: "auto" }}>
        <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
          <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th
                style={{
                  border: "none",
                  padding: "10px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
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
                Total Leads
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
                Converted
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
                Conv. Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {conversionRows.map((item) => (
              <tr key={`conversion-${item.stage}`}>
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
                    color: "#6b7280",
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
                  {item.converted}
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
                  {item.conversionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  let stageDurationReportBody: React.ReactNode;
  if (loading) {
    stageDurationReportBody = loadingSpinner280;
  } else if (leadStageDuration.length === 0) {
    stageDurationReportBody = (
      <div
        className="d-flex justify-content-center align-items-center text-muted"
        style={{ height: "280px" }}
      >
        No stage duration data available
      </div>
    );
  } else {
    stageDurationReportBody = (
      <div style={{ maxHeight: "280px", overflowY: "auto" }}>
        <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
          <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
            <tr>
              <th
                style={{
                  border: "none",
                  padding: "10px",
                  fontWeight: 600,
                  color: "#1f2937",
                }}
              >
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
                Leads
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
                Avg (Days)
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
                Min
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
                Max
              </th>
            </tr>
          </thead>
          <tbody>
            {leadStageDuration.map((item, index) => (
              <tr key={`duration-${item.stage}-${index}`}>
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
                  {item.lead_count}
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
                <td
                  style={{
                    padding: "10px",
                    borderTop: "1px solid #f0f0f0",
                    textAlign: "right",
                    color: "#10b981",
                  }}
                >
                  {item.min_duration_days.toFixed(1)}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderTop: "1px solid #f0f0f0",
                    textAlign: "right",
                    color: "#6b7280",
                  }}
                >
                  {item.max_duration_days.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
              height: "100%",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Lead Source Analysis
            </h6>
            {sourceAnalysisBody}
          </div>
        </Col>

        <Col lg={7}>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb",
              height: "100%",
            }}
          >
            <h6 className="mb-3" style={{ fontSize: "15px", fontWeight: 600, color: "#1f2937" }}>
              Lead Assignment Report
            </h6>
            {assignmentReportBody}
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
              Conversion Report by Stage
            </h6>
            {conversionReportBody}
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
            {stageDurationReportBody}
          </div>
        </Col>
      </Row>
    </div>
  );
}
