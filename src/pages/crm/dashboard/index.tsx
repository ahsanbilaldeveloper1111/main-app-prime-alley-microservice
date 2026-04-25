import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Spinner,
  ListGroup,
} from "react-bootstrap";
import { useSession } from "next-auth/react";
import {
  getCrmDashboard,
  getCrmDashboardOverview,
  getLeads,
  getDeals,
  getOrders,
  DashboardData as CrmDashboardData,
  AuditTrailEntry,
  LeadData,
  DealData,
  OrderData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { buildCrmAuditLinesForEntry } from "@utils/crmAuditTrail";
import {
  Target,
  Handshake,
  ShoppingBag,
  TrendingUp,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import StatsCards from "@components/GenericStatsCards";
import {
  Users,
  UserPlus,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  ChevronRight,

} from 'lucide-react';
import { LineChart, Line,} from 'recharts';

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import {
  formatCrmPreviewDate,
  formatMeetingDateLocal,
  formatMeetingTimeLocal,
  formatNumber,
  ModuleSlug,
} from "@utils/Helper";

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

const getRecordTypeFromAuditableType = (auditableType: unknown): string => {
  if (typeof auditableType !== "string" || !auditableType.trim()) return "";
  const typeParts = auditableType.split("\\").filter(Boolean);
  return typeParts.at(-1) || "";
};

const DASHBOARD_TIMEFRAME_LABEL = "Last 30 days";

const formatDashboardHistoryUtcDateTime = (date: unknown): string => {
  if (typeof date !== "string" || !date.trim()) {
    return "";
  }

  const parsed = moment.utc(date);
  if (!parsed.isValid()) {
    return "";
  }

  return parsed.local().format("D MMMM, YYYY [at] hh:mm A");
};

const getLeadToOrderConversionPercentage = (
  apiValue: unknown,
  leadsCount: number,
  ordersCount: number,
): number => {
  if (typeof apiValue === "number" && !Number.isNaN(apiValue)) {
    return apiValue;
  }
  if (leadsCount > 0) {
    return (ordersCount / leadsCount) * 100;
  }
  return 0;
};

const getMeetingRecordNavigation = (
  recordType: unknown,
  recordId: unknown,
): { label: string; href: string | null } => {
  const typeLabel = getRecordTypeFromAuditableType(recordType);
  const normalizedType = typeLabel.toLowerCase();
  const idValue =
    typeof recordId === "string" || typeof recordId === "number"
      ? String(recordId).trim()
      : "";

  if (!normalizedType || !idValue) {
    return { label: typeLabel || "", href: null };
  }

  if (normalizedType === "ticket") {
    return {
      label: typeLabel,
      href: `/crm/tickets/tickets-detailpage?id=${encodeURIComponent(idValue)}`,
    };
  }

  const detailPageTypeMap: Record<string, string> = {
    prospect: "prospect",
    lead: "lead",
    deal: "deal",
    order: "order",
    company: "companies",
    companies: "companies",
  };

  const detailType = detailPageTypeMap[normalizedType];
  if (!detailType) {
    return { label: typeLabel, href: null };
  }

  return {
    label: typeLabel,
    href: `/crm/detailspage?type=${detailType}&id=${encodeURIComponent(idValue)}`,
  };
};

const dashboardCellEllipsisStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const dashboardWrapTextStyle: React.CSSProperties = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const recentLeadsGridTemplate = "36px minmax(0, 1fr) 120px 80px 140px";
const recentDealsGridTemplate = "36px minmax(0, 1fr) 100px 100px";

const humanizeDashboardAuditKey = (key: string): string =>
  key
    .replaceAll("_", " ")
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());

const formatDashboardAuditFieldValue = (
  _field: string,
  value: unknown,
): string => {
  if (value == null || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "—";
  }

  if (typeof value === "string") {
    return value.trim() || "—";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "—";
    }

    return value
      .map((item) => formatDashboardAuditFieldValue("", item))
      .join(", ");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "[Complex value]";
  }
};

const getDashboardActivitySummary = (
  activity: AuditTrailEntry,
): string =>
  buildCrmAuditLinesForEntry(
    activity,
    formatDashboardAuditFieldValue,
    humanizeDashboardAuditKey,
  );

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

// Helper function to format numbers with commas
// const formatNumber = (value: number | undefined | null): string => {
//   const num = value || 0;
//   return num.toLocaleString('en-US');
// };

const CrmDashboard = () => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
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
  const [extensions, setExtensions] = useState<any[]>([]);

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

  const fetchExtensions = useCallback(async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (fetchError) {
      console.error("Failed to fetch extensions:", fetchError);
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
      console.log("dashboard data", dashboard);
      setDashboardData(dashboard);

      // Set conversion percentages from API
      setLeadToDealPercent(dashboard?.conversion_ratios?.lead_to_deal || 0);
      setDealToOrderPercent(dashboard?.conversion_ratios?.deal_to_order || 0);
      
      // Set campaign performance chart data
      if (dashboard?.campaign_performance?.chart_data) {
        const chartData = dashboard.campaign_performance.chart_data.map((item: any) => ({
          name: item.month_label || item.month,
          leads: Number(item.leads) || 0,
          deals: Number(item.deals) || 0,
          orders: Number(item.orders) || 0,
        }));
        setMonthlyData(chartData);
      }
      
      // Set task statuses data
      if (dashboard?.task_statuses) {
        const taskData = [
          { name: 'Completed', value: dashboard.task_statuses.completed || 0, color: '#20C997' },
          { name: 'Pending', value: dashboard.task_statuses.pending || 0, color: '#FFC107' },
          { name: 'Overdue', value: dashboard.task_statuses.overdue || 0, color: '#FD7E14' },
        ];
        // Update tasksData will be done in render
      }

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

  function getNameByExtension(extension: string) {
    const extensionValue = String(extension);
    const extensionData = extensions.find(
      (ext) =>
        String(ext.id) === extensionValue ||
        String(ext.extension) === extensionValue,
    );
    return extensionData?.display_name || extensionData?.name || extension;
  }

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

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
    (max: number, stage: any) => Math.max(max, stage.count || 0),
    0
  ) || 1;



  // Campaign Performance data from API
  const campaignData = dashboardData?.campaign_performance?.chart_data?.map((item: any) => ({
    name: item.month_label || item.month,
    Leads: Number(item.leads) || 0,
    Deals: Number(item.deals) || 0,
    Orders: Number(item.orders) || 0,
  })) || [];

  // Tasks data from API
  const tasksData = dashboardData?.task_statuses ? [
    { name: 'Completed', value: dashboardData.task_statuses.completed || 0, color: '#20C997' },
    { name: 'Pending', value: dashboardData.task_statuses.pending || 0, color: '#FFC107' },
    { name: 'Overdue', value: dashboardData.task_statuses.overdue || 0, color: '#FD7E14' },
  ] : [];

  const totalTasks = tasksData.reduce((sum, item) => sum + item.value, 0);
  const completedPercentage = totalTasks > 0 ? Math.round((tasksData[0]?.value / totalTasks) * 100) : 0;

  // Calculate funnel percentages (relative to Prospects as 100%)
  const prospectsCount = dashboardData?.counts?.crm_data || 0;
  const leadsCount = dashboardData?.counts?.leads || 0;
  const dealsCount = dashboardData?.counts?.deals || 0;
  const ordersCount = dashboardData?.counts?.orders || 0;
  const leadToOrderConversionPercentage = getLeadToOrderConversionPercentage(
    dashboardData?.conversion_ratios?.lead_to_order,
    leadsCount,
    ordersCount,
  );

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
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>CRM Dashboard</h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Dashboard widgets and summary cards reflect the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}.
                </p>
              </div>
              {/* <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
                <Search className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', zIndex: 10 }} size={18} />
                <Form.Control
                  type="text"
                  placeholder="Search here..."
                  className="ps-5"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ height: '40px', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
              </div> */}
            </div>
          </Col>

          {/* <Col xs={12} md={5} className="d-flex justify-content-md-end align-items-center">
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
          </Col> */}
        </Row>

        {/* Top Stats */}
        {/* <Row className="g-3 mb-4">
          <Col xxl={2}  xl={4} lg={4} md={4} sm={6}>
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={20} color="#0EA5E9" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.crm_data || 0, true)}</h3>
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
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.leads || 0, true)}</h3>
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
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.deals || 0, true)}</h3>
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
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{formatNumber(dashboardData?.counts?.orders || 0, true)}</h3>
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
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_ratios?.lead_to_deal?.toFixed(2) || 0}%</h3>
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
                    <h3 style={{ fontSize: '28px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{dashboardData?.conversion_ratios?.deal_to_order?.toFixed(2) || 0}%</h3>
                    <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Deals to Orders Conversion</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row> */}

<div className="mb-4">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <Badge
              bg="light"
              text="dark"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#64748B',
                border: '1px solid #E2E8F0',
                padding: '6px 10px',
              }}
            >
              Timeframe: {DASHBOARD_TIMEFRAME_LABEL}
            </Badge>
          </div>
          <StatsCards
            gridMinWidth="180px"
            data={[
              {
                title: 'Prospects',
                value: formatNumber(dashboardData?.counts?.crm_data || 0, true),
                icon: Users,
                iconColor: '#0EA5E9',
                iconBgColor: '#E0F2FE',
              },
              {
                title: 'Leads',
                value: formatNumber(dashboardData?.counts?.leads || 0, true),
                icon: UserPlus,
                iconColor: '#3B82F6',
                iconBgColor: '#DBEAFE',
              },
              {
                title: 'Deals',
                value: formatNumber(dashboardData?.counts?.deals || 0, true),
                icon: DollarSign,
                iconColor: '#F59E0B',
                iconBgColor: '#FEF3C7',
              },
              {
                title: 'Orders',
                value: formatNumber(dashboardData?.counts?.orders || 0, true),
                icon: ShoppingCart,
                iconColor: '#F97316',
                iconBgColor: '#FED7AA',
              },
              {
                title: 'Leads to Deals Conversion',
                value: `${(dashboardData?.conversion_ratios?.lead_to_deal ?? 0).toFixed(2)}%`,
                icon: TrendingUp,
                iconColor: '#0EA5E9',
                iconBgColor: '#E0F2FE',
                subtitle: DASHBOARD_TIMEFRAME_LABEL,
              },
              {
                title: 'Deals to Orders Conversion',
                value: `${(dashboardData?.conversion_ratios?.deal_to_order ?? 0).toFixed(2)}%`,
                icon: TrendingUp,
                iconColor: '#10B981',
                iconBgColor: '#D1FAE5',
                subtitle: DASHBOARD_TIMEFRAME_LABEL,
              },
            ]}
          />
        </div>

        {/* Main Content */}
        <Row className="g-4">
          {/* Left Column */}
          <Col xxl={4} xl={6} lg={12} md={12}>
            {/* Leads Funnel */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Leads Funnel</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: 0 }}>
                    Stage volume for the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}
                  </p>
                  <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                    {DASHBOARD_TIMEFRAME_LABEL}
                  </Badge>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '14px', color: '#1E293B', fontWeight: 500 }}>Prospects</span>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(prospectsCount, true)}</span>
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
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(leadsCount, true)}</span>
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
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(dealsCount, true)}</span>
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
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{formatNumber(ordersCount, true)}</span>
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '260px', height: '32px', backgroundColor: '#FFF7ED', borderRadius: '8px' }}>
                        <div style={{ width: `${ordersPercentage}%`, height: '100%', backgroundColor: '#F97316', borderRadius: '8px' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Leads → Orders conversion: {leadToOrderConversionPercentage.toFixed(2)}%</p>
              </Card.Body>
            </Card>

            {/* Recent Activities */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>Recent Activities</h5>
                
                <ListGroup variant="flush">
                  {(dashboardData?.recent_activities || []).slice(0, 5).map((activity: any, index: number) => {
                    const recordType = getRecordTypeFromAuditableType(activity.auditable_type);
                    const recordTypeLabel =
                      recordType.toLowerCase() === "ticket" ? "Lead" : recordType;
                    const activitySummary = getDashboardActivitySummary(
                      activity as AuditTrailEntry,
                    );
                    const getIcon = () => {
                      if (activity.type === 'lead') return <UserPlus size={16} color="#3B82F6" />;
                      if (activity.type === 'meeting') return <Calendar size={16} color="#10B981" />;
                      if (activity.type === 'followup') return <CheckCircle size={16} color="#10B981" />;
                      return <Users size={16} color="#10B981" />;
                    };
                    const getBgColor = () => {
                      if (activity.type === 'lead') return '#DBEAFE';
                      if (activity.type === 'meeting') return '#D1FAE5';
                      if (activity.type === 'followup') return '#D1FAE5';
                      return '#D1FAE5';
                    };
                    const getTypeLabel = () => {
                      if (activity.type === 'lead') return 'Lead';
                      if (activity.type === 'meeting') return 'Meeting';
                      if (activity.type === 'followup') return 'Follow-up';
                      return 'Activity';
                    };
                    return (
                      <ListGroup.Item key={activity.id || index} style={{ padding: '16px 0', border: 'none', borderBottom: index < 4 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getBgColor(), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getIcon()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '4px' }}>
                              <div style={{ ...dashboardWrapTextStyle, flex: 1 }}>
                                <span style={{ fontSize: '13px', color: '#64748B' }}>
                                  {activity.created_at
                                    ? formatDashboardHistoryUtcDateTime(activity.created_at)
                                    : ""}
                                </span>
                                <div
                                  title={activitySummary}
                                  style={{
                                    ...dashboardWrapTextStyle,
                                    fontSize: '14px',
                                    color: '#1E293B',
                                    marginTop: '6px',
                                    fontWeight: 500,
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.5',
                                  }}
                                >
                                  {activitySummary}
                                </div>
                              </div>
                              <div style={{ padding: '4px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {getTypeLabel()}
                              </div>
                            </div>
                            {activity.user_extension && (
                              <p style={{ ...dashboardWrapTextStyle, fontSize: '13px', color: '#94A3B8', margin: 0, marginTop: '8px' }}>
                                Extension: {getNameByExtension(activity.user_extension)}
                              </p>
                            )}
                            {recordTypeLabel && (
                              <div style={{ marginTop: '8px', minWidth: 0 }}>
                                <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                                  {recordTypeLabel}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {(!dashboardData?.recent_activities || dashboardData.recent_activities.length === 0) && (
                    <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent activities</p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Upcoming Meetings */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: '24px' }}>
              <Card.Body>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#1E293B' }}>Upcoming Meetings</h5>
                  <Link href="/planner/calendar" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Calendar <ChevronRight size={16} />
                  </Link>
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.upcoming_meetings || []).slice(0, 5).map((meeting: any, index: number) => {
                    const initials = meeting.name ? meeting.name.charAt(0).toUpperCase() : 'M';
                    const companyName = meeting.lead?.company_name || meeting.deal?.company_name || '';
                    const meetingTime = meeting.meeting_time
                      ? formatMeetingTimeLocal(meeting.meeting_date, meeting.meeting_time)
                      : '';
                    const meetingRecordType = getMeetingRecordNavigation(meeting.record_type, meeting.record?.id);
                    return (
                      <ListGroup.Item key={meeting.id || index} style={{ padding: '16px 0', border: 'none', borderBottom: index < (dashboardData?.upcoming_meetings?.length || 0) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px', fontWeight: 600, color: '#3B82F6' }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h6 style={{ ...dashboardWrapTextStyle, fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>
                              {meeting.name} {companyName && <span style={{ color: '#3B82F6' }}>– {companyName}</span>}
                            </h6>
                            <p style={{ ...dashboardWrapTextStyle, fontSize: '13px', color: '#64748B', margin: 0 }}>
                              {meeting.meeting_type} {meetingTime && `– ${meetingTime}`}
                            </p>
                            {meetingRecordType.label && (
                              <div style={{ marginTop: '8px', minWidth: 0 }}>
                                {meetingRecordType.href ? (
                                  <Link href={meetingRecordType.href} style={{ textDecoration: 'none' }}>
                                    <Badge bg="light" text="dark" style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                                      {meetingRecordType.label}
                                    </Badge>
                                  </Link>
                                ) : (
                                  <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                                    {meetingRecordType.label}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <Calendar size={14} color="#94A3B8" />
                            <span style={{ fontSize: '13px', color: '#64748B' }}>
                              {formatMeetingDateLocal(meeting.meeting_date, meeting.meeting_time) || formatCrmPreviewDate(meeting.meeting_date)}
                            </span>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {(!dashboardData?.upcoming_meetings || dashboardData.upcoming_meetings.length === 0) && (
                    <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No upcoming meetings</p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Middle Column */}
          <Col xxl={4} xl={6} lg={12} md={12}>
            {/* Orders Revenue */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <Card.Body>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#1E293B' }}>Orders Revenue</h5>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#64748B', marginBottom: 0 }}>
                    Total order revenue for the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}
                  </p>
                  <Badge bg="light" text="dark" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B', border: '1px solid #E2E8F0' }}>
                    {DASHBOARD_TIMEFRAME_LABEL}
                  </Badge>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#1E293B' }}>AED {formatNumber(dashboardData?.order_revenue_aed || 0)}</h2>
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
                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0' }}>
                  Revenue from orders created within the {DASHBOARD_TIMEFRAME_LABEL.toLowerCase()}.
                </p>

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
                  {session?.user?.permissions?.includes('view-crm-tasks') && (
                  <Link href="/crm/tasks" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <ChevronRight size={16} />
                  </Link>
                  )}

                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.upcoming_tasks || []).slice(0, 5).map((task: any, index: number) => {
                    const initials = task.name ? task.name.charAt(0).toUpperCase() : 'T';
                    const isOverdue = task.status === 'overdue';
                    const bgColor = isOverdue ? '#F1F5F9' : '#D1FAE5';
                    const textColor = isOverdue ? '#64748B' : '#10B981';
                    return (
                      <ListGroup.Item key={task.id || index} style={{ padding: '16px 0', border: 'none', borderBottom: index < (dashboardData?.upcoming_tasks?.length || 0) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 600, color: '#3B82F6' }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h6 style={{ ...dashboardWrapTextStyle, fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#1E293B' }}>{task.name}</h6>
                            {task.company_name && (
                              <p style={{ ...dashboardWrapTextStyle, fontSize: '13px', color: '#64748B', margin: 0 }}>{task.company_name}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', backgroundColor: bgColor, borderRadius: '6px',textTransform: 'uppercase', flexShrink: 0 }}>
                            <Calendar size={14} color={textColor} />
                            <span style={{ fontSize: '13px', color: textColor, fontWeight: 500 }}>
                              {task.due_date ? formatCrmPreviewDate(task.due_date) : "—"}
                            </span>
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {(!dashboardData?.upcoming_tasks || dashboardData.upcoming_tasks.length === 0) && (
                    <ListGroup.Item style={{ padding: '16px 0', border: 'none' }}>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No upcoming tasks</p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col xxl={4} xl={12} lg={12} md={12}>
            {/* CRM Pipeline */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: '#1E293B' }}>CRM Pipeline</h5>
                
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={campaignData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" iconSize={8} />
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
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Leads</h5>
                
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: '12px', display: 'grid', gridTemplateColumns: recentLeadsGridTemplate, gap: '8px', paddingLeft: '4px' }}>
                  <span></span>
                  <span style={dashboardCellEllipsisStyle}>Lead</span>
                  <span style={{ ...dashboardCellEllipsisStyle, textAlign: 'left' }}>Campaign Name</span>
                  <span style={{ ...dashboardCellEllipsisStyle, textAlign: 'right' }}>Stage At</span>
                  {/* <span style={{ textAlign: 'right' }}>Created At</span> */}
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.recent_leads || []).slice(0, 5).map((lead: any, index: number) => {
                    const initials = lead.name ? lead.name.charAt(0).toUpperCase() : 'L';
                    const campaignName = lead.campaign?.name || '-';
                    const stageName = lead.stage?.name || '-';
                    const stageColor = lead.stage?.color || '#64748B';
                    return (
                      <ListGroup.Item key={lead.id || index} style={{ padding: '10px 0', border: 'none', borderBottom: index < (dashboardData?.recent_leads?.length || 0) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: recentLeadsGridTemplate, gap: '8px', alignItems: 'center' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                            {initials}
                          </div>
                          <span title={lead.name || '-'} style={{ ...dashboardCellEllipsisStyle, fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{lead.name || '-'}</span>
                          <span title={campaignName} style={{ ...dashboardCellEllipsisStyle, fontSize: '13px', color: '#1E293B', fontWeight: 500, textAlign: 'left' }}>{campaignName}</span>
                          <span title={stageName} style={{ ...dashboardCellEllipsisStyle, fontSize: '13px', color: stageColor, fontWeight: 500, textAlign: 'right' }}>{stageName}</span>
                          {/* <span style={{ fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
                            {convertDateTimeWithOffsetToLocal(lead.created_at,undefined,'DD MMM YYYY,hh:mm:ss A')}
                          </span> */}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {(!dashboardData?.recent_leads || dashboardData.recent_leads.length === 0) && (
                    <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent leads</p>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>

            {/* Recent Deals */}
            <Card style={{ border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Card.Body style={{ padding: '20px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1E293B' }}>Recent Deals</h5>
                
                <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: '12px', display: 'grid', gridTemplateColumns: recentDealsGridTemplate, gap: '8px', paddingLeft: '4px' }}>
                  <span></span>
                  <span style={dashboardCellEllipsisStyle}>LEAD</span>
                  <span style={{ ...dashboardCellEllipsisStyle, textAlign: 'right' }}>DEAL VALUE</span>
                  <span style={{ ...dashboardCellEllipsisStyle, textAlign: 'right' }}>LAST ORDERS</span>
                </div>

                <ListGroup variant="flush">
                  {(dashboardData?.recent_deals || []).slice(0, 5).map((deal: any, index: number) => {
                    const initials = deal.name ? deal.name.charAt(0).toUpperCase() : 'D';
                    const companyName = deal.company_name || deal.ticket?.company_name || 'N/A';
                    const dealValue = deal.grand_total || deal.net_value || 0;
                    const currency = deal.currency || 'AED';
                    return (
                      <ListGroup.Item key={deal.id || index} style={{ padding: '10px 0', border: 'none', borderBottom: index < (dashboardData?.recent_deals?.length || 0) - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: recentDealsGridTemplate, gap: '8px', alignItems: 'center' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#3B82F6' }}>
                            {initials}
                          </div>
                          <span title={companyName} style={{ ...dashboardCellEllipsisStyle, fontSize: '13px', color: '#1E293B', fontWeight: 500 }}>{companyName}</span>
                          <span title={`${currency} ${formatNumber(Number(dealValue))}`} style={{ ...dashboardCellEllipsisStyle, fontSize: '13px', color: '#1E293B', fontWeight: 600, textAlign: 'right' }}>{currency} {formatNumber(Number(dealValue))}</span>
                          <span style={{ ...dashboardCellEllipsisStyle, fontSize: '12px', color: '#64748B', textAlign: 'right' }}>
                            {deal.created_at ? formatCrmPreviewDate(deal.created_at) : "—"}
                          </span>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                  {(!dashboardData?.recent_deals || dashboardData.recent_deals.length === 0) && (
                    <ListGroup.Item style={{ padding: '10px 0', border: 'none' }}>
                      <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'center' }}>No recent deals</p>
                    </ListGroup.Item>
                  )}
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
