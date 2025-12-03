import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  ProgressBar,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  getCrmDashboard,
  getLeads,
  getDeals,
  getOrders,
  DashboardData as CrmDashboardData,
  LeadData,
  DealData,
  OrderData,
} from "@utils/crm";
import {
  Target,
  Handshake,
  ShoppingBag,
  TrendingUp,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import moment from "moment";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

// KPI Card Component
interface KPICardData {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
}

const KPICard: React.FC<KPICardData> = ({ title, value, change, isPositive, icon, color }) => {
  return (
    <Card
      className="h-100"
      style={{
        transition: "all 0.2s ease",
        border: "1px solid #e9ecef",
      }}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className={`bg-${color} bg-opacity-10 rounded p-3`}>
            <div className={`text-${color}`}>{icon}</div>
          </div>
          {change && (
            <Badge bg={isPositive ? "success" : "danger"} className="bg-opacity-10">
              {change}
            </Badge>
          )}
        </div>
        <h3 className="mb-1">{value}</h3>
        <p className="text-muted mb-0 small">{title}</p>
      </Card.Body>
    </Card>
  );
};

// Helper functions for badge colors
const getDealBadgeColor = (deal: DealData): string => {
  if (deal.is_lost) return "danger";
  if (deal.stage?.is_won) return "success";
  return "secondary";
};

const getOrderBadgeColor = (order: OrderData): string => {
  if (order.status === "delivered") return "success";
  if (order.status === "in_progress") return "info";
  if (order.status === "approved") return "primary";
  return "warning";
};

const CrmDashboard = () => {
  const [dashboardData, setDashboardData] = useState<CrmDashboardData | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadData[]>([]);
  const [recentDeals, setRecentDeals] = useState<DealData[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chart data states
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [ordersByStage, setOrdersByStage] = useState<any[]>([]);
  
  // Totals
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [leadToDealPercent, setLeadToDealPercent] = useState(0);
  const [dealToOrderPercent, setDealToOrderPercent] = useState(0);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data and recent items in parallel
      const [
        dashboard,
        leadsResponse,
        dealsResponse,
        ordersResponse,
      ] = await Promise.all([
        getCrmDashboard().then((res: any) => res.data.data),
        getLeads({ per_page: 5 }),
        getDeals({ per_page: 5 }),
        getOrders({ per_page: 5 }),
      ]);
      console.log("ZEZEZE", dashboard);
      setDashboardData(dashboard as CrmDashboardData);

      // Set totals from API stats
      const stats = (dashboard as CrmDashboardData)?.stats;
      setTotalLeads(stats?.leads?.total || 0);
      setTotalDeals(stats?.deals?.total || 0);
      setTotalOrders(stats?.orders?.total || 0);

      // Set conversion percentages from API
      const conversionStats = (dashboard as CrmDashboardData)?.conversion_stats?.last_30_days;
      setLeadToDealPercent(conversionStats?.leads_to_deals_percentage || 0);
      setDealToOrderPercent(conversionStats?.deals_to_orders_percentage || 0);

      // Get recent items
      console.log("ZEZEZE", leadsResponse);
      setRecentLeads((leadsResponse?.data as any)?.data?.slice(0, 5) || []);
      setRecentDeals(dealsResponse?.dataList?.slice(0, 5) || []);
      setRecentOrders(ordersResponse?.dataList?.slice(0, 5) || []);

      // Process monthly data from API - convert string numbers to numbers
      const monthlyDataArray = (dashboard as CrmDashboardData)?.monthly_data || [];
      const processedMonthlyData = monthlyDataArray.map((item: { month: string; month_label: string; leads: number | string; deals: number | string; orders: number | string }) => ({
        month: item.month_label || item.month,
        leads: Number(item.leads) || 0,
        deals: Number(item.deals) || 0,
        orders: Number(item.orders) || 0,
      }));
      setMonthlyData(processedMonthlyData);

      // Process deals by stage from API
      const dealsDistribution = (dashboard as CrmDashboardData)?.stage_distribution?.deals || [];
      const dealsByStageData = dealsDistribution.map((item: { stage_name: string; count: number; color: string }) => ({
        name: item.stage_name,
        value: item.count,
        color: item.color || "#0d6efd",
      }));
      setDealsByStage(dealsByStageData);

      // Process orders by stage from API
      const ordersDistribution = (dashboard as CrmDashboardData)?.stage_distribution?.orders || [];
      const ordersByStageData = ordersDistribution.map((item: { stage_name: string; count: number; color: string }) => ({
        name: item.stage_name,
        value: item.count,
        color: item.color || "#198754",
      }));
      setOrdersByStage(ordersByStageData);

      setLoading(false);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      setError(error?.message || "Failed to load dashboard data");
      setLoading(false);
      toast.error(error?.message || "Failed to load dashboard data");
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <Spinner animation="border">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-3"
          onClick={fetchDashboardData}
        >
          Retry
        </Button>
      </div>
    );
  }

  const kpiData: KPICardData[] = [
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      icon: <Target size={24} />,
      color: "primary",
    },
    {
      title: "Total Deals",
      value: totalDeals.toString(),
      icon: <Handshake size={24} />,
      color: "success",
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: <ShoppingBag size={24} />,
      color: "info",
    },
    {
      title: "Lead to Deal Conversion",
      value: `${leadToDealPercent}%`,
      icon: <TrendingUp size={24} />,
      color: "warning",
    },
    {
      title: "Deal to Order Conversion",
      value: `${dealToOrderPercent}%`,
      icon: <TrendingUp size={24} />,
      color: "secondary",
    },
  ];

  // Calculate max count for progress bars
  const leadsByStage = dashboardData?.stage_distribution?.leads || [];
  const maxLeadCount = leadsByStage.reduce(
    (max, stage) => Math.max(max, stage.count),
    0
  ) || 1;

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Dashboard"
      />

      <PageHeader title="CRM Dashboard" />

      <div className="container-fluid">
        {/* KPI Cards */}
        <style>{`
          @media (min-width: 1400px) {
            .kpi-card-col { flex: 0 0 20% !important; max-width: 20% !important; }
          }
          @media (min-width: 1200px) and (max-width: 1399px) {
            .kpi-card-col { flex: 0 0 25% !important; max-width: 25% !important; }
          }
          @media (min-width: 992px) and (max-width: 1199px) {
            .kpi-card-col { flex: 0 0 33.333% !important; max-width: 33.333% !important; }
          }
          @media (min-width: 768px) and (max-width: 991px) {
            .kpi-card-col { flex: 0 0 50% !important; max-width: 50% !important; }
          }
          @media (max-width: 767px) {
            .kpi-card-col { flex: 0 0 100% !important; max-width: 100% !important; }
          }
        `}</style>
        <Row className="mb-4">
          {kpiData.map((kpi) => (
            <Col key={kpi.title} className="mb-3 kpi-card-col">
              <KPICard {...kpi} />
            </Col>
          ))}
        </Row>

        {/* Charts Row */}
        <Row className="mb-4">
          {/* Monthly Bar Chart */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Leads, Deals & Orders by Month</h5>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px" }} />
                      <Legend />
                      <Bar dataKey="leads" fill="#0d6efd" radius={[8, 8, 0, 0]} name="Leads" />
                      <Bar dataKey="deals" fill="#198754" radius={[8, 8, 0, 0]} name="Deals" />
                      <Bar dataKey="orders" fill="#0dcaf0" radius={[8, 8, 0, 0]} name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">No data available</div>
                )}
                  </Card.Body>
                </Card>
          </Col>

          {/* Deals by Stage Pie Chart */}
          <Col lg={3} className="mb-4">
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                <h5 className="mb-4 fw-bold">Deals by Stage</h5>
                {dealsByStage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dealsByStage}
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: "#666", strokeWidth: 1 }}
                      >
                        {dealsByStage.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">No deals data available</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Orders by Stage Doughnut Chart */}
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-4 fw-bold">Orders by Stage</h5>
                {ordersByStage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ordersByStage}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="80%"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: "#666", strokeWidth: 1 }}
                      >
                        {ordersByStage.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-5">No orders data available</div>
                )}
                  </Card.Body>
                </Card>
          </Col>
        </Row>

        {/* Leads by Stage */}
        {leadsByStage.length > 0 && (
          <Row className="mb-4">
            <Col lg={6} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Body style={{ minHeight: "344px" }}>
                  <h5 className="mb-4 fw-bold">Leads by Stage</h5>
                  {leadsByStage.map((item) => (
                    <div key={item.stage_id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold">{item.stage_name}</span>
                        <Badge
                          bg="primary"
                          className="bg-opacity-10 text-dark"
                        >
                          {item.count}
                        </Badge>
                      </div>
                      <ProgressBar
                        now={(item.count / maxLeadCount) * 100}
                        style={{
                          height: "8px",
                          backgroundColor: "#e9ecef",
                        }}
                        className="rounded"
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>

          {/* Recent Leads */}
            <Col lg={6} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0 fw-bold">Recent Leads</h5>
                <Link
                  href="/crm/leads"
                      className="btn btn-link btn-sm text-decoration-none"
                >
                      View All →
                </Link>
                        </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {recentLeads.length > 0 ? (
                      <Table hover responsive className="mb-0">
                        <thead
                          style={{
                            position: "sticky",
                            top: 0,
                            backgroundColor: "#fff",
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                              }}
                            >
                              Name
                            </th>
                            <th
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                              }}
                            >
                              Stage
                            </th>
                            <th
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                              }}
                            >
                              Created
                            </th>
                            <th
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                              }}
                            >
                              Last Activity
                            </th>
                            <th
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                borderBottom: "2px solid #dee2e6",
                              }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                                {lead.name || "Unnamed Lead"}
                              </td>
                              <td>
                                <Badge bg="primary" className="bg-opacity-10 text-dark">
                          {lead.stage?.name || "No Stage"}
                                </Badge>
                              </td>
                              <td style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                                {moment(lead.created_at).format("MMM DD, YYYY")}
                              </td>
                              <td style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                                {moment(lead.updated_at).format("MMM DD, YYYY")}
                              </td>
                              <td>
                      <Link
                        href={`/crm/leads/${lead.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        title="View Details"
                      >
                                  <Eye size={14} />
                      </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-muted text-center py-4">No recent leads</p>
                    )}
                  </div>
              </Card.Body>
            </Card>
            </Col>
          </Row>
        )}

        {/* Recent Deals and Orders */}
        <Row>
          {/* Recent Deals */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                    Recent Deals
                  </h5>
                <Link
                    href="/crm/deals"
                    className="btn btn-link btn-sm text-decoration-none"
                >
                    View All →
                </Link>
                        </div>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {recentDeals.length > 0 ? (
                    recentDeals.map((deal) => (
                      <div key={deal.id} className="mb-3 d-flex align-items-start gap-2">
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#0d6efd",
                            marginTop: "6px",
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex-grow-1">
                          <h6
                            className="mb-2"
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              color: "#2c3e50",
                            }}
                          >
                            {deal.name || "Unnamed Deal"}
                        </h6>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <small className="text-muted">
                              {moment(deal.created_at).format("MMM DD, YYYY")}
                            </small>
                            {deal.grand_total && (
                              <small className="text-muted">
                                Value: {deal.grand_total}
                              </small>
                            )}
                            <Badge
                              bg={getDealBadgeColor(deal)}
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                padding: "4px 10px",
                                textTransform: "uppercase",
                              }}
                            >
                              {deal.stage?.name || "No Stage"}
                            </Badge>
                        </div>
                      </div>
                      <Link
                          href={`/crm/deals/${deal.id}/edit`}
                        className="btn btn-sm btn-outline-secondary"
                        title="View Details"
                      >
                          <Eye size={14} />
                      </Link>
                    </div>
                  ))
                ) : (
                    <p className="text-muted text-center py-4">No recent deals</p>
                )}
          </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Orders */}
          <Col lg={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                    Recent Orders
                  </h5>
                    <Link
                    href="/crm/orders"
                    className="btn btn-link btn-sm text-decoration-none"
                    >
                    View All →
                    </Link>
                  </div>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="mb-3 d-flex align-items-start gap-2">
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#0d6efd",
                            marginTop: "6px",
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex-grow-1">
                          <h6
                            className="mb-2"
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 600,
                              color: "#2c3e50",
                            }}
                          >
                            {order.order_number} - {order.customer_name}
                          </h6>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <small className="text-muted">
                              {moment(order.created_at).format("MMM DD, YYYY")}
                            </small>
                            {order.final_amount && (
                              <small className="text-muted">
                                Amount: {order.final_amount}
                              </small>
                            )}
                            <Badge
                              bg={getOrderBadgeColor(order)}
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                padding: "4px 10px",
                                textTransform: "uppercase",
                              }}
                            >
                              {order.stage?.name || order.status || "No Stage"}
                            </Badge>
                  </div>
                        </div>
                    <Link
                          href={`/crm/orders/${order.id}/edit`}
                          className="btn btn-sm btn-outline-secondary"
                          title="View Details"
                    >
                          <Eye size={14} />
                    </Link>
                  </div>
                    ))
                  ) : (
                    <p className="text-muted text-center py-4">No recent orders</p>
                    )}
                  </div>
                </Card.Body>
              </Card>
                      </Col>
                    </Row>
            </div>
    </React.Fragment>
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
