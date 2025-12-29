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
  getCrmDashboardOverview,
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
  Edit,
  Calendar,
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


import { ListGroup, Form } from 'react-bootstrap';
import {
  Users,
  UserPlus,
  DollarSign,
  ShoppingCart,
  Search,
  Mail,
  CheckCircle,
  ChevronRight,
  ChevronDown,

} from 'lucide-react';
import { LineChart, Line,} from 'recharts';

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
  monthlyValue?: number;
}

const KPICard: React.FC<KPICardData> = ({ title, value, change, isPositive, icon, color, monthlyValue }) => {
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
        {monthlyValue !== undefined && (
          <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2">
            <Calendar size={16} className={`text-${color}`} />
            <div>
              <span className="text-muted small">This Month: </span>
              <span className={`fw-semibold text-${color}`}>{monthlyValue}</span>
            </div>
          </div>
        )}
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

// Chart color palette - 15 colors for handling large datasets
const CHART_COLORS = [
  "#ffc107", // Yellow
  "#0dcaf0", // Cyan
  "#6c757d", // Gray
  "#198754", // Green
  "#dc3545", // Red
  "#0d6efd", // Blue
  "#6610f2", // Purple
  "#e83e8c", // Pink
  "#fd7e14", // Orange
  "#20c997", // Teal
  "#ff6b6b", // Coral Red
  "#4ecdc4", // Turquoise
  "#95e1d3", // Mint
  "#f38181", // Salmon
  "#aa96da", // Lavender
];

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
  
  // Conversion percentages
  const [leadToDealPercent, setLeadToDealPercent] = useState(0);
  const [dealToOrderPercent, setDealToOrderPercent] = useState(0);

  const [dashboardOverview, setDashboardOverview] = useState<any>(null);
  
  // Header search and date range state - moved to top to avoid hooks order violation
  const [searchText, setSearchText] = useState<string>('');
  const today = new Date().toISOString().slice(0, 10);
  const prior = new Date(); prior.setDate(prior.getDate() - 30);
  const [fromDate, setFromDate] = useState<string>(prior.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState<string>(today);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const datePickerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = useCallback(async () => {
    try {
      const data = await getCrmDashboardOverview();
      console.log("Dashboard Overview", data);
      setDashboardOverview(data);
    } catch (error) {
      console.error("Failed to fetch dashboard overview data:", error);
    }
  }, []);
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
      const dealsByStageData = dealsDistribution.map((item: { stage_name: string; count: number; color: string }, index: number) => ({
        name: item.stage_name,
        value: item.count,
        color: item.color || CHART_COLORS[index % CHART_COLORS.length],
      }));
      setDealsByStage(dealsByStageData);

      // Process orders by stage from API
      const ordersDistribution = (dashboard as CrmDashboardData)?.stage_distribution?.orders || [];
      const ordersByStageData = ordersDistribution.map((item: { stage_name: string; count: number; color: string }, index: number) => ({
        name: item.stage_name,
        value: item.count,
        color: item.color || CHART_COLORS[index % CHART_COLORS.length],
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

  const stats = dashboardData?.stats;
  
  const kpiData: KPICardData[] = [
    {
      title: "Total Leads (All Time)",
      value: (stats?.leads?.total || 0).toString(),
      icon: <Target size={24} />,
      color: "primary",
      monthlyValue: stats?.leads?.this_month,
    },
    {
      title: "Total Deals (All Time)",
      value: (stats?.deals?.total || 0).toString(),
      icon: <Handshake size={24} />,
      color: "success",
      monthlyValue: stats?.deals?.this_month,
    },
    {
      title: "Total Orders (All Time)",
      value: (stats?.orders?.total || 0).toString(),
      icon: <ShoppingBag size={24} />,
      color: "info",
      monthlyValue: stats?.orders?.this_month,
    },
    {
      title: "Lead to Deal Conversion (Past 30 Days)",
      value: `${leadToDealPercent}%`,
      icon: <TrendingUp size={24} />,
      color: "warning",
    },
    {
      title: "Deal to Order Conversion (Past 30 Days)",
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



  const campaignData = [
    { name: 'Apr 1', Clicks: 5, Leads: 8, Deals: 6, Orders: 4 },
    { name: 'Apr 1', Clicks: 15, Leads: 18, Deals: 12, Orders: 8 },
    { name: 'Apr 22', Clicks: 25, Leads: 22, Deals: 18, Orders: 15 },
    { name: 'Apr 16', Clicks: 35, Leads: 28, Deals: 22, Orders: 18 },
    { name: 'Apr 13', Clicks: 30, Leads: 32, Deals: 28, Orders: 22 },
    { name: 'Apr 24', Clicks: 45, Leads: 38, Deals: 35, Orders: 30 },
  ];

  const tasksData = [
    { name: 'Completed', value: 12, color: '#20C997' },
    { name: 'In Progress', value: 8, color: '#FFC107' },
    { name: 'Pending', value: 5, color: '#FD7E14' },
  ];

  const totalTasks = tasksData.reduce((sum, item) => sum + item.value, 0);
  const completedPercentage = Math.round((tasksData[0].value / totalTasks) * 100);

  // Calculate funnel percentages (relative to Prospects as 100%)
  const prospectsCount = dashboardOverview?.crm_data_count || 0;
  const leadsCount = dashboardData?.stats?.leads?.active || 0;
  const dealsCount = dashboardData?.stats?.deals?.active || 0;
  const ordersCount = dashboardData?.stats?.orders?.total || 0;
  
  const prospectsPercentage = prospectsCount > 0 ? 100 : 0;
  const leadsPercentage = prospectsCount > 0 ? Math.round((leadsCount / prospectsCount) * 100) : 0;
  const dealsPercentage = prospectsCount > 0 ? Math.round((dealsCount / prospectsCount) * 100) : 0;
  const ordersPercentage = prospectsCount > 0 ? Math.round((ordersCount / prospectsCount) * 100) : 0;

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Dashboard"
      />

     
<>
      <Row className="mb-4 align-items-center">
          <Col xs={12} md={7} className="mb-2 mb-md-0">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h4 style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>CRM Dashboard</h4>
              <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
                <Search className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }} size={18} />
                <Form.Control
                  type="text"
                  placeholder="Search here..."
                  className="ps-5"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ height: '40px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
              </div>
            </div>
          </Col>

          <Col xs={12} md={5} className="d-flex justify-content-md-end align-items-center">
            <div ref={datePickerRef} style={{ position: 'relative' }}>
              <div onClick={() => setShowDatePicker((s) => !s)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', minWidth: '160px' }}>
                <Calendar size={16} color="#64748B" />
                <div style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600 }}>{fromDate} — {toDate}</div>
                <div style={{ marginLeft: '8px', marginRight: '-4px' }}>
                  <ChevronDown size={16} color="#64748B" />
                </div>
              </div>

              {showDatePicker && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', zIndex: 1060 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ height: '40px', borderRadius: '6px' }} />
                    <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ height: '40px', borderRadius: '6px' }} />
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Top Stats */}
        <Row className="g-3 mb-4">
          <Col xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={20} color="#0EA5E9" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardOverview?.crm_data_count || 0}</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Prospects</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserPlus size={20} color="#3B82F6" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.stats?.leads?.active || 0}</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Leads</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign size={20} color="#F59E0B" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.stats?.deals?.active || 0}</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Deals</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingCart size={20} color="#F97316" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.stats?.orders?.total || 0}</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Orders</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col  xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={20} color="#0EA5E9" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_stats?.last_30_days?.leads_to_deals_percentage || 0}%</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Leads to Deals Conversion</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={20} color="#10B981" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_stats?.last_30_days?.deals_to_orders_percentage || 0}</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Deals to Orders Conversion</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row className="g-4">
          {/* Left Column */}
          <Col xxl={4}  xl={6} lg={6} md={6} sm={12}>
            {/* Leads Funnel */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Leads Funnel</h5>
                <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px' }}>Stage Volume</p>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Prospects</span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{dashboardOverview?.crm_data_count || 0}</span>
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#E6EEF9', borderRadius: '8px' }}>
                        <div style={{ width: `${prospectsPercentage}%`, height: '100%', backgroundColor: '#3B82F6', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Leads</span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{leadsCount}</span>
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                        <div style={{ width: `${leadsPercentage}%`, height: '100%', backgroundColor: '#14B8A6', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Deals</span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{dealsCount}</span>
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#FFFAEB', borderRadius: '8px' }}>
                        <div style={{ width: `${dealsPercentage}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Orders</span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{ordersCount}</span>
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#FFF7ED', borderRadius: '8px' }}>
                        <div style={{ width: `${ordersPercentage}%`, height: '100%', backgroundColor: '#F97316', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Prospects → Orders conversion: {ordersPercentage}%</p>
              </Card.Body>
            </Card>

            {/* Recent Activities */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Recent Activities</h5>
                
                <ListGroup variant="flush">
                  <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={16} color="#10B981" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>24 Apr 2024</span>
                            <span style={{ fontSize: '14px', color: '#1E293B', marginLeft: '8px', fontWeight: 500 }}>
                              Followed with <span style={{ color: '#3B82F6' }}>ABC Corp.</span>
                            </span>
                          </div>
                          <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} /> Email
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Sent a .pptx via Eid permail.</p>
                      </div>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UserPlus size={16} color="#3B82F6" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>26 Apr 2024</span>
                            <span style={{ fontSize: '14px', color: '#1E293B', marginLeft: '8px', fontWeight: 500 }}>
                              Scall with <span style={{ color: '#3B82F6' }}>John Smith</span>
                            </span>
                          </div>
                          <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} /> Email
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Sent a dad's win'ta paper onad ; (hair new offer.</p>
                      </div>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={16} color="#10B981" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>33 Apr 2024</span>
                            <span style={{ fontSize: '14px', color: '#1E293B', marginLeft: '8px', fontWeight: 500 }}>
                              Schoote presentation for Demo
                            </span>
                          </div>
                          <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Check In
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>Beel s .anedio wini ff hone ufccuss nqgm eah.</p>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Upcoming Meetings */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: '24px' }}>
              <Card.Body>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Upcoming Meetings</h5>
                  <a href="#" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Calendar <ChevronRight size={16} />
                  </a>
                </div>

                <ListGroup variant="flush">
                  <ListGroup.Item style={{ padding: '16px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <img src="/api/placeholder/40/40" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>
                          Product Demo – <span style={{ color: '#3B82F6' }}>ABC Corp</span>
                        </h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>18:00 – 16:30 GiMib</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#94A3B8" />
                        <span style={{ fontSize: '13px', color: '#64748B' }}>Apr 26, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px', fontWeight: 600, color: '#3B82F6' }}>
                        S
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>
                          Quarterly Review – <span style={{ color: '#3B82F6' }}>Smith LLC</span>
                        </h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>14:00 – 16:30 GiMib</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#94A3B8" />
                        <span style={{ fontSize: '13px', color: '#64748B' }}>Apr 26, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Middle Column */}
          <Col xxl={4}  xl={6} lg={6} md={6} sm={12}>
            {/* Orders Revenue */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>Orders Revenue</h5>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>Total Order Revenue</p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#1E293B' }}>AED 17,305</h2>
                  <div style={{ height: '32px' }}>
                    <svg width="120" height="32" viewBox="0 0 120 32">
                      <path d="M0,16 L10,20 L20,12 L30,18 L40,8 L50,14 L60,10 L70,6 L80,4 L90,8 L100,6 L110,4 L120,2" 
                            fill="none" 
                            stroke="#10B981" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div style={{ width: '100%', height: '40px', background: 'linear-gradient(90deg, #14B8A6 0%, #10B981 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '16px', marginBottom: '16px' }}>
                  AED 17,305
                </div>

                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.6' }}>
                  Tip: Track pipeline volume in the Leads Funnel to monitor conversion rates. Revenue is only generated at the Orders stage.
                </p>
              </Card.Body>
            </Card>

            {/* Tasks Completion */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: '#1E293B' }}>Tasks Completion</h5>
                
                <Row>
                  <Col md={6}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={tasksData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {tasksData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '28px', fontWeight: 700, fill: '#1E293B' }}>
                          {completedPercentage}%
                        </text>
                        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '13px', fill: '#64748B' }}>
                          Completed
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col md={6} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {tasksData.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color }}></div>
                          <span style={{ fontSize: '14px', color: '#64748B' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>{item.value}</span>
                      </div>
                    ))}
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Upcoming Tasks */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Upcoming Tasks</h5>
                  <a href="#" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Due dates <ChevronRight size={16} />
                  </a>
                </div>

                <ListGroup variant="flush">
                  <ListGroup.Item style={{ padding: '16px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>Call Amy Davis</h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Diqit Is sheduled for omprow</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: '#D1FAE5', borderRadius: '6px' }}>
                        <Calendar size={14} color="#10B981" />
                        <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 500 }}>Apr 26, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '16px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>Send Proposal to XYZ Inc.</h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Diqit $acLaeeie princing options.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: '#D1FAE5', borderRadius: '6px' }}>
                        <Calendar size={14} color="#10B981" />
                        <span style={{ fontSize: '13px', color: '#10B981', fontWeight: 500 }}>Apr 27, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item style={{ padding: '16px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>Create presentation for Demo</h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Discuss tentop iann preemta.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px' }}>
                        <Calendar size={14} color="#64748B" />
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Apr 25, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <img src="https://i.pravatar.cc/150?img=12" alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h6 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>Send Quote to Smith LLC.</h6>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Pinal quote needed.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px' }}>
                        <Calendar size={14} color="#64748B" />
                        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>Apr 28, 2024</span>
                      </div>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col xxl={4}  xl={12} lg={12} md={12} sm={12}>
            {/* Campaign Performance */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Campaign Performance</h5>
                
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={campaignData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="Clicks" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Leads" stroke="#14B8A6" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Deals" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Orders" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card.Body>
            </Card>

            {/* Top Customers */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Top Customers</h5>
                
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: '12px', display: 'grid', gridTemplateColumns: '36px 1fr 100px 60px 90px', gap: '8px', paddingLeft: '4px' }}>
                  <span></span>
                  <span>CUSTOMER</span>
                  <span style={{ textAlign: 'right' }}>TOTAL REVENUE</span>
                  <span style={{ textAlign: 'center' }}>ORDERS</span>
                  <span style={{ textAlign: 'right' }}>LAST ORDER</span>
                </div>

                <ListGroup variant="flush">
                  <ListGroup.Item style={{ padding: '10px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 60px 90px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                        A
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>ABC Corp</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 8,700</span>
                      <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>-</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 23, 2024</span>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '10px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 60px 90px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                        A
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>XYZ Inc</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 6,200</span>
                      <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>-</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 17, 2024</span>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 60px 90px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        S
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>Smith LLC</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 2,405</span>
                      <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>-</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 15, 2024</span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 60px 90px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        S
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>Smith LLC</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 2,405</span>
                      <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center' }}>-</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 15, 2024</span>
                    </div>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Recent Deals */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Deals</h5>
                
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: '12px', display: 'grid', gridTemplateColumns: '36px 1fr 100px 100px', gap: '8px', paddingLeft: '4px' }}>
                  <span></span>
                  <span>LEAD</span>
                  <span style={{ textAlign: 'right' }}>DEAL VALUE</span>
                  <span style={{ textAlign: 'right' }}>LAST ORDERS</span>
                </div>

                <ListGroup variant="flush">
                  <ListGroup.Item style={{ padding: '10px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 100px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                        A
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>ABC Corp</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 8,700</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 23, 2024</span>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '10px 0', border: 'none', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 100px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                        A
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>XYZ Inc</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 6,200</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 19, 2024</span>
                    </div>
                  </ListGroup.Item>

                  <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 100px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        S
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>Smith LLC</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 2,405</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 19, 2024</span>
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 100px 100px', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        S
                      </div>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>Smith LLC</span>
                      <span style={{ fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>AED 2,405</span>
                      <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>Apr 19, 2024</span>
                    </div>
                  </ListGroup.Item>
                  
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </>
      
    </React.Fragment>
  );
};

CrmDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CrmDashboard;
