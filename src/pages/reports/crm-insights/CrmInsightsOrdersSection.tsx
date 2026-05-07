import React, { useMemo } from "react";
import { Row, Col, Card } from "react-bootstrap";
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

const spinner380 = (
  <div className="d-flex justify-content-center align-items-center" style={{ height: "380px" }}>
    <div className="spinner-border spinner-border-sm">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const spinner340 = (
  <div className="d-flex justify-content-center align-items-center" style={{ height: "340px" }}>
    <div className="spinner-border spinner-border-sm">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const spinner300 = (
  <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
    <div className="spinner-border spinner-border-sm">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

type OrdersMonthChartSeries = ReturnType<typeof aggregateOrderRevenueByMonthChartPoints>;

function renderOrdersRevenueByMonthSection(
  orderLoading: boolean,
  revenueByMonthRows: OrderRevenueReport["by_month"] | undefined,
  revenueChartData: OrdersMonthChartSeries,
): React.ReactNode {
  if (orderLoading) {
    return spinner380;
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
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            <table className="table table-sm table-hover mb-0" style={{ fontSize: "12px" }}>
              <thead style={{ background: "#f8f9fa", position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ border: "none", padding: "10px", fontWeight: 600, color: "#1f2937" }}>
                    Month
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
                    Orders
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
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueByMonthRows.map((item, index) => (
                  <tr key={`revenue-month-${item.month}-${item.currency}-${index}`}>
                    <td
                      style={{
                        padding: "10px",
                        borderTop: "1px solid #f0f0f0",
                        color: "#1f2937",
                        fontWeight: 500,
                      }}
                    >
                      {new Date(`${item.month}-01`).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
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
                      {item.order_count}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    );
  }
  return (
    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: "380px" }}>
      No revenue data available
    </div>
  );
}

function renderOrdersRevenueByOwnerSection(
  orderLoading: boolean,
  revenueByOwnerRows: OrderRevenueReport["by_owner"] | undefined,
  getUserDisplayName: (extension: string | number) => string,
): React.ReactNode {
  if (orderLoading) {
    return spinner340;
  }
  if (revenueByOwnerRows && revenueByOwnerRows.length > 0) {
    return (
      <div style={{ maxHeight: "340px", overflowY: "auto" }}>
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
                Orders
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
                Total Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {revenueByOwnerRows.map((item, index) => (
              <tr key={`revenue-owner-${item.owner || "null"}-${item.currency}-${index}`}>
                <td
                  style={{
                    padding: "10px",
                    borderTop: "1px solid #f0f0f0",
                    color: "#1f2937",
                    fontWeight: 500,
                  }}
                >
                  {item.owner ? getUserDisplayName(item.owner) : "Unassigned"}
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
                  {item.order_count}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: "340px" }}>
      No revenue data available
    </div>
  );
}

function renderOrdersStageDurationSection(
  orderLoading: boolean,
  orderStageDuration: OrderStageDurationReport[],
): React.ReactNode {
  if (orderLoading) {
    return spinner340;
  }
  if (orderStageDuration.length > 0) {
    return (
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
                  textAlign: "right",
                }}
              >
                Orders
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
            {orderStageDuration
              .filter((item) => item.order_count > 0)
              .map((item, index) => (
                <tr key={`order-duration-${item.stage}-${index}`}>
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
                    {item.order_count}
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
    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: "340px" }}>
      No stage duration data available
    </div>
  );
}

function renderOrdersCancellationsSection(
  orderLoading: boolean,
  orderCancellations: OrderCancellationReport[],
): React.ReactNode {
  const cancelColors = CRM_INSIGHTS_CANCELLATION_COLORS;
  if (orderLoading) {
    return spinner300;
  }
  if (orderCancellations.length > 0) {
    return (
      <Row className="g-0">
        <Col xs={3}>
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
        </Col>
        <Col xs={9}>
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
                    % of Cancelled
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
                    Value Lost
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderCancellations.map((item, rowIdx) => (
                  <tr key={`cancellation-${item.reason}-${item.currency}-${rowIdx}`}>
                    <td style={{ padding: "10px", borderTop: "1px solid #f0f0f0" }}>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "2px",
                            background: cancelColors[rowIdx % cancelColors.length],
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
  }
  return (
    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: "300px" }}>
      No cancellation data available
    </div>
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

  return (
    <div style={{ padding: "0 32px 24px", background: "#f8f9fa" }}>
      <div style={{ marginBottom: "24px" }}>
        <h6 className="mb-3" style={{ fontSize: "16px", fontWeight: 600, color: "#1f2937" }}>
          Order Overview
        </h6>
        <Row className="g-3">
          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "20%" }} className="d-none d-lg-block">
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
                      TOTAL ORDERS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {orderSummary?.total_orders?.toLocaleString() || 0}
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
                      TOTAL ORDERS
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {orderSummary?.total_orders?.toLocaleString() || 0}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "20%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#3b82f6" }}>
                    <Clock size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      PENDING
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {pendingCount}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2">
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {pendingPercentLabel}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#3b82f6" }}>
                    <Clock size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      PENDING
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {pendingCount}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2">
                  <span className="text-muted small" style={{ fontSize: "0.8rem" }}>
                    {pendingPercentLabel}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "20%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#10b981" }}>
                    <CheckCircle size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      APPROVED
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {approvedCount}
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
                    <CheckCircle size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      APPROVED
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {approvedCount}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "20%" }} className="d-none d-lg-block">
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
                      TOTAL REVENUE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {formatAedTotalCompact(aedTotal)}
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
                      TOTAL REVENUE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {formatAedTotalCompact(aedTotal)}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={4} lg={3} style={{ flex: "0 0 auto", width: "20%" }} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#8b5cf6" }}>
                    <Wallet size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      AVG ORDER VALUE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {formatAedAvgCompact(aedAvg)}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={4} className="d-lg-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-end justify-content-between mb-3">
                  <div style={{ color: "#8b5cf6" }}>
                    <Wallet size={16} />
                  </div>
                  <div className="text-end">
                    <p
                      className="text-muted text-uppercase small mb-1"
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}
                    >
                      AVG ORDER VALUE
                    </p>
                  </div>
                </div>
                <h2 className="mb-2 fw-bold text-end" style={{ fontSize: "1.75rem" }}>
                  {formatAedAvgCompact(aedAvg)}
                </h2>
                <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: "20px" }} />
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
              Revenue by Month
            </h6>
            {revenueByMonthSectionBody}
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
              Revenue by Owner
            </h6>
            {revenueByOwnerSectionBody}
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
              Stage Duration
            </h6>
            {stageDurationSectionBody}
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
              Cancellations
            </h6>
            {cancellationsSectionBody}
          </div>
        </Col>
      </Row>
    </div>
  );
}
