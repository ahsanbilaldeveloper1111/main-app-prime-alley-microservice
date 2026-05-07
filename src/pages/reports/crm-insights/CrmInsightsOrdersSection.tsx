import React, { useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  DollarSign,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import type {
  OrderCancellationReport,
  OrderRevenueReport,
  OrderStageDurationReport,
  OrderStatusReport,
  OrderSummaryReport,
} from "@utils/crm";
import {
  aggregateOrderRevenueByMonthChartPoints,
  CRM_INSIGHTS_CANCELLATION_COLORS,
  formatAedAvgCompact,
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

export type CrmInsightsOrdersSectionProps = Readonly<{
  orderLoading: boolean;
  orderSummary: OrderSummaryReport | null;
  orderStatus: OrderStatusReport[];
  orderRevenue: OrderRevenueReport | null;
  orderStageDuration: OrderStageDurationReport[];
  orderCancellations: OrderCancellationReport[];
  getUserDisplayName: (extension: string | number) => string;
}>;

function computeOrdersRevenueChartData(
  byMonth: OrderRevenueReport["by_month"] | undefined | null,
): ReturnType<typeof aggregateOrderRevenueByMonthChartPoints> {
  if (!byMonth?.length) {
    return [];
  }
  return aggregateOrderRevenueByMonthChartPoints(byMonth);
}

function ordersRevenueTooltipFormatter(
  value: number,
  name: string,
): [string | number, string] {
  if (name === "Revenue") {
    return [
      `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      "Revenue",
    ];
  }
  return [value, "Orders"];
}

type OrdersMonthChartSeries = ReturnType<typeof aggregateOrderRevenueByMonthChartPoints>;

function renderOrdersRevenueByMonthSection(
  orderLoading: boolean,
  revenueByMonthRows: OrderRevenueReport["by_month"] | undefined,
  revenueChartData: OrdersMonthChartSeries,
): React.ReactNode {
  if (orderLoading) {
    return <CrmInsightsLoadingSpinner height={380} />;
  }
  if (revenueByMonthRows && revenueByMonthRows.length > 0) {
    return (
      <Row className="g-3">
        <Col lg={7}>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={revenueChartData} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: "12px" }} />
              <YAxis
                yAxisId="left"
                stroke="#4F46E5"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={ordersRevenueTooltipFormatter}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#4F46E5" name="Revenue" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" radius={[8, 8, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </Col>
        <Col lg={5}>
          <CrmInsightsReportScrollTable
            maxHeight={340}
            headerRow={
              <tr>
                <CrmInsightsTh>Month</CrmInsightsTh>
                <CrmInsightsTh align="center">Currency</CrmInsightsTh>
                <CrmInsightsTh align="right">Orders</CrmInsightsTh>
                <CrmInsightsTh align="right">Revenue</CrmInsightsTh>
              </tr>
            }
          >
            {revenueByMonthRows.map((item, index) => (
              <tr key={`revenue-month-${item.month}-${item.currency}-${index}`}>
                <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>
                  {new Date(`${item.month}-01`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </CrmInsightsTd>
                <CrmInsightsTd align="center" style={{ color: "#6b7280" }}>
                  {item.currency}
                </CrmInsightsTd>
                <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
                  {item.order_count}
                </CrmInsightsTd>
                <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#10b981" }}>
                  {item.currency}{" "}
                  {item.total_value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </CrmInsightsTd>
              </tr>
            ))}
          </CrmInsightsReportScrollTable>
        </Col>
      </Row>
    );
  }
  return (
    <CrmInsightsReportEmptyState height={380}>No revenue data available</CrmInsightsReportEmptyState>
  );
}

function renderOrdersRevenueByOwnerSection(
  orderLoading: boolean,
  revenueByOwnerRows: OrderRevenueReport["by_owner"] | undefined,
  getUserDisplayName: (extension: string | number) => string,
): React.ReactNode {
  if (orderLoading) {
    return <CrmInsightsLoadingSpinner height={340} />;
  }
  if (revenueByOwnerRows && revenueByOwnerRows.length > 0) {
    return (
      <CrmInsightsReportScrollTable
        maxHeight={340}
        headerRow={
          <tr>
            <CrmInsightsTh>Owner</CrmInsightsTh>
            <CrmInsightsTh align="center">Currency</CrmInsightsTh>
            <CrmInsightsTh align="right">Orders</CrmInsightsTh>
            <CrmInsightsTh align="right">Total Revenue</CrmInsightsTh>
          </tr>
        }
      >
        {revenueByOwnerRows.map((item, index) => (
          <tr key={`revenue-owner-${item.owner || "null"}-${item.currency}-${index}`}>
            <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>
              {item.owner ? getUserDisplayName(item.owner) : "Unassigned"}
            </CrmInsightsTd>
            <CrmInsightsTd align="center" style={{ color: "#6b7280" }}>
              {item.currency}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
              {item.order_count}
            </CrmInsightsTd>
            <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#10b981" }}>
              {item.currency}{" "}
              {item.total_value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CrmInsightsTd>
          </tr>
        ))}
      </CrmInsightsReportScrollTable>
    );
  }
  return (
    <CrmInsightsReportEmptyState height={340}>No revenue data available</CrmInsightsReportEmptyState>
  );
}

function renderOrdersStageDurationSection(
  orderLoading: boolean,
  orderStageDuration: OrderStageDurationReport[],
): React.ReactNode {
  if (orderLoading) {
    return <CrmInsightsLoadingSpinner height={340} />;
  }
  if (orderStageDuration.length > 0) {
    return (
      <CrmInsightsReportScrollTable
        maxHeight={340}
        headerRow={
          <tr>
            <CrmInsightsTh>Stage</CrmInsightsTh>
            <CrmInsightsTh align="right">Orders</CrmInsightsTh>
            <CrmInsightsTh align="right">Avg Duration (Days)</CrmInsightsTh>
            <CrmInsightsTh align="right">Min</CrmInsightsTh>
            <CrmInsightsTh align="right">Max</CrmInsightsTh>
          </tr>
        }
      >
        {orderStageDuration
          .filter((item) => item.order_count > 0)
          .map((item, index) => (
            <tr key={`order-duration-${item.stage}-${index}`}>
              <CrmInsightsTd style={{ color: "#1f2937", fontWeight: 500 }}>{item.stage}</CrmInsightsTd>
              <CrmInsightsTd align="right" style={{ fontWeight: 600, color: "#1f2937" }}>
                {item.order_count}
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
    <CrmInsightsReportEmptyState height={340}>No stage duration data available</CrmInsightsReportEmptyState>
  );
}

function renderOrdersCancellationsSection(
  orderLoading: boolean,
  orderCancellations: OrderCancellationReport[],
): React.ReactNode {
  const cancelColors = CRM_INSIGHTS_CANCELLATION_COLORS;
  if (orderLoading) {
    return <CrmInsightsLoadingSpinner height={300} />;
  }
  if (orderCancellations.length > 0) {
    return (
      <CrmInsightsPieTableRow
        leftColXs={3}
        rightColXs={9}
        left={
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderCancellations as unknown as Record<string, unknown>[]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="count"
              >
                {orderCancellations.map((entry, pieIdx) => (
                  <Cell
                    key={`cell-${entry.reason}-${entry.currency}-${pieIdx}`}
                    fill={cancelColors[pieIdx % cancelColors.length]}
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
                <CrmInsightsTh align="right">% of Cancelled</CrmInsightsTh>
                <CrmInsightsTh align="right">Value Lost</CrmInsightsTh>
              </tr>
            }
          >
            {orderCancellations.map((item, rowIdx) => (
              <tr key={`cancellation-${item.reason}-${item.currency}-${rowIdx}`}>
                <CrmInsightsTd>
                  <CrmInsightsSwatchLabel
                    swatchColor={cancelColors[rowIdx % cancelColors.length]}
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
  }
  return (
    <CrmInsightsReportEmptyState height={300}>No cancellation data available</CrmInsightsReportEmptyState>
  );
}

export function CrmInsightsOrdersSection({
  orderLoading,
  orderSummary,
  orderStatus,
  orderRevenue,
  orderStageDuration,
  orderCancellations,
  getUserDisplayName,
}: CrmInsightsOrdersSectionProps) {
  const revenueChartData = useMemo(
    () => computeOrdersRevenueChartData(orderRevenue?.by_month),
    [orderRevenue?.by_month],
  );

  const aedTotal = orderSummary?.by_currency?.find((c) => c.currency === "AED")?.total_value || 0;
  const aedAvg = orderSummary?.by_currency?.find((c) => c.currency === "AED")?.avg_value || 0;

  const pendingCount = orderStatus.find((s) => s.status === "Pending")?.count || 0;
  const approvedCount = orderStatus.find((s) => s.status === "Approved")?.count || 0;

  const totalOrdersForPct = orderSummary?.total_orders ?? 0;
  const pendingPercentLabel =
    totalOrdersForPct > 0
      ? `${((pendingCount / totalOrdersForPct) * 100).toFixed(1)}% of total`
      : "0% of total";

  const revenueByMonthRows = orderRevenue?.by_month;
  const revenueByOwnerRows = orderRevenue?.by_owner;

  const revenueByMonthSectionBody = renderOrdersRevenueByMonthSection(
    orderLoading,
    revenueByMonthRows,
    revenueChartData,
  );
  const revenueByOwnerSectionBody = renderOrdersRevenueByOwnerSection(
    orderLoading,
    revenueByOwnerRows,
    getUserDisplayName,
  );
  const stageDurationSectionBody = renderOrdersStageDurationSection(
    orderLoading,
    orderStageDuration,
  );
  const cancellationsSectionBody = renderOrdersCancellationsSection(
    orderLoading,
    orderCancellations,
  );

  const orderKpiDesktopCol = {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3,
    style: { flex: "0 0 auto" as const, width: "20%" },
  };
  const orderKpiMobileCol = { xs: 12, sm: 6, md: 4 };

  return (
    <div style={{ padding: "0 32px 24px", background: "#f8f9fa" }}>
      <div style={{ marginBottom: "24px" }}>
        <h6 className="mb-3" style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
          Order Overview
        </h6>
        <Row className="g-3">
          <CrmInsightsResponsiveKpiSlot
            desktopCol={orderKpiDesktopCol}
            mobileCol={orderKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#f59e0b"
                icon={<ShoppingBag size={16} />}
                label="TOTAL ORDERS"
                value={orderSummary?.total_orders?.toLocaleString() || 0}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={orderKpiDesktopCol}
            mobileCol={orderKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#3b82f6"
                icon={<Clock size={16} />}
                label="PENDING"
                value={pendingCount}
                footer={
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {pendingPercentLabel}
                  </span>
                }
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={orderKpiDesktopCol}
            mobileCol={orderKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#10b981"
                icon={<CheckCircle size={16} />}
                label="APPROVED"
                value={approvedCount}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={orderKpiDesktopCol}
            mobileCol={orderKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#10b981"
                icon={<DollarSign size={16} />}
                label="TOTAL REVENUE"
                value={formatAedTotalCompact(aedTotal)}
              />
            )}
          />
          <CrmInsightsResponsiveKpiSlot
            desktopCol={orderKpiDesktopCol}
            mobileCol={orderKpiMobileCol}
            renderContent={() => (
              <CrmInsightsKpiCard
                iconColor="#8b5cf6"
                icon={<Wallet size={16} />}
                label="AVG ORDER VALUE"
                value={formatAedAvgCompact(aedAvg)}
              />
            )}
          />
        </Row>
      </div>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <CrmInsightsReportPanel title="Revenue by Month">{revenueByMonthSectionBody}</CrmInsightsReportPanel>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={6}>
          <CrmInsightsReportPanel title="Revenue by Owner">{revenueByOwnerSectionBody}</CrmInsightsReportPanel>
        </Col>
        <Col lg={6}>
          <CrmInsightsReportPanel title="Stage Duration">{stageDurationSectionBody}</CrmInsightsReportPanel>
        </Col>
      </Row>

      <Row className="g-3 mb-3">
        <Col lg={12}>
          <CrmInsightsReportPanel title="Cancellations">{cancellationsSectionBody}</CrmInsightsReportPanel>
        </Col>
      </Row>
    </div>
  );
}
