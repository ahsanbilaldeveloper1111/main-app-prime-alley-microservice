/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import Layout from "@layout/index";
import ProtectedRoute from "@components/ProtectedRoute";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { 
  Target,
  Handshake,
  ShoppingBag,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Wallet
} from 'lucide-react';
import KPIOverview from '@components/KPIS-overview';
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
  Legend
} from 'recharts';
import {
  getLeadOverviewReport,
  getLeadSourceReport,
  getLeadAssignmentReport,
  getLeadConversionReport,
  getLeadStageDurationReport,
  getDealFunnelReport,
  getDealValueReport,
  getDealStageDurationReport,
  getDealLostReasonReport,
  getDealConversionReport,
  getOrderSummaryReport,
  getOrderStatusReport,
  getOrderRevenueReport,
  getOrderStageDurationReport,
  getOrderCancellationReport,
  getStages,
  type LeadOverviewReport,
  type LeadSourceReport,
  type LeadAssignmentReport,
  type LeadConversionReport,
  type LeadStageDurationReport,
  type LeadReportFilters,
  type DealFunnelReport,
  type DealValueReport,
  type DealStageDurationReport,
  type DealLostReasonReport,
  type DealConversionReport,
  type DealReportFilters,
  type OrderSummaryReport,
  type OrderStatusReport,
  type OrderRevenueReport,
  type OrderStageDurationReport,
  type OrderCancellationReport,
  type OrderReportFilters,
  type StageData
} from '@utils/crm';
import { GetHierarchyData } from '@utils/users';
import { ModuleSlug } from '@utils/Helper';
import { usePermissions } from "@utils/permissionUtils";

const CrmReports = () => {
  const { PERMISSIONS } = HEADER_CONSTANTS;
  const { hasPermission } = usePermissions();
  
  // Check permissions for each report module
  const canViewReports = hasPermission(PERMISSIONS.VIEW_CRM_REPORTS);
  const canViewLeadsReports = hasPermission(PERMISSIONS.VIEW_CRM_LEADS_REPORTS);
  const canViewDealsReports = hasPermission(PERMISSIONS.VIEW_CRM_DEALS_REPORTS);
  const canViewOrdersReports = hasPermission(PERMISSIONS.VIEW_CRM_ORDERS_REPORTS);

  // Determine initial tab based on available permissions
  const getInitialTab = () => {
    if (canViewLeadsReports) return 'leads';
    if (canViewDealsReports) return 'deals';
    if (canViewOrdersReports) return 'orders';
    return 'leads'; // fallback
  };

  // Reports Page States
  const [selectedReportModule, setSelectedReportModule] = useState(getInitialTab());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter States - Leads
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30');

  // Filter States - Deals
  const [selectedDealCurrency, setSelectedDealCurrency] = useState<string>('');
  const [selectedDealOwner, setSelectedDealOwner] = useState<string>('');
  const [selectedDealDateRange, setSelectedDealDateRange] = useState<string>('30');

  // Filter States - Orders
  const [selectedOrderCurrency, setSelectedOrderCurrency] = useState<string>('');
  const [selectedOrderOwner, setSelectedOrderOwner] = useState<string>('');
  const [selectedOrderDateRange, setSelectedOrderDateRange] = useState<string>('30');

  // Filter Options Data
  const [stages, setStages] = useState<StageData[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Lead Reports Data States
  const [leadOverview, setLeadOverview] = useState<LeadOverviewReport | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSourceReport[]>([]);
  const [leadAssignments, setLeadAssignments] = useState<LeadAssignmentReport[]>([]);
  const [leadConversion, setLeadConversion] = useState<LeadConversionReport | null>(null);
  const [leadStageDuration, setLeadStageDuration] = useState<LeadStageDurationReport[]>([]);
  const [loading, setLoading] = useState(false);

  // Deal Reports Data States
  const [dealFunnel, setDealFunnel] = useState<DealFunnelReport[]>([]);
  const [dealValue, setDealValue] = useState<DealValueReport | null>(null);
  const [dealStageDuration, setDealStageDuration] = useState<DealStageDurationReport[]>([]);
  const [dealLostReasons, setDealLostReasons] = useState<DealLostReasonReport[]>([]);
  const [dealConversion, setDealConversion] = useState<DealConversionReport | null>(null);
  const [dealLoading, setDealLoading] = useState(false);

  // Order Reports Data States
  const [orderSummary, setOrderSummary] = useState<OrderSummaryReport | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusReport[]>([]);
  const [orderRevenue, setOrderRevenue] = useState<OrderRevenueReport | null>(null);
  const [orderStageDuration, setOrderStageDuration] = useState<OrderStageDurationReport[]>([]);
  const [orderCancellations, setOrderCancellations] = useState<OrderCancellationReport[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  // Helper function to get module slug based on report module type
  const getModuleSlug = (module: string) => {
    switch (module) {
      case 'leads':
        return ModuleSlug.CRM_LEADS;
      case 'deals':
        return ModuleSlug.CRM_DEALS;
      case 'orders':
        return ModuleSlug.CRM_ORDERS;
      default:
        return ModuleSlug.CRM_REPORTS;
    }
  };

  // Helper function to get stage type based on report module type
  const getStageType = (module: string) => {
    switch (module) {
      case 'leads':
        return 'lead';
      case 'deals':
        return 'deal';
      case 'orders':
        return 'order';
      default:
        return 'lead';
    }
  };

  // Fetch stages and users based on selected report module
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [stagesData, hierarchyData] = await Promise.all([
          getStages(getStageType(selectedReportModule)),
          GetHierarchyData(getModuleSlug(selectedReportModule))
        ]);
        setStages(stagesData || []);
        if (hierarchyData?.extensions) {
          setUsers(hierarchyData.extensions);
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };
    fetchFilterData();
  }, [selectedReportModule]);

  // Helper function to update dates based on date range selection
  const handleDateRangeChange = (range: string, module: 'leads' | 'deals' | 'orders') => {
    const today = new Date();
    let newStartDate: Date;
    
    if (range === 'custom') {
      // Keep current dates for custom
      return;
    } else if (range === '7') {
      newStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30') {
      newStartDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90') {
      newStartDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      return;
    }
    
    const newStartDateStr = newStartDate.toISOString().split('T')[0];
    const newEndDateStr = today.toISOString().split('T')[0];
    
    setStartDate(newStartDateStr);
    setEndDate(newEndDateStr);
    
    if (module === 'leads') {
      setSelectedDateRange(range);
    } else if (module === 'deals') {
      setSelectedDealDateRange(range);
    } else if (module === 'orders') {
      setSelectedOrderDateRange(range);
    }
  };

  // Fetch reports only on module change or initial load
  useEffect(() => {
    if (selectedReportModule === 'leads') {
      fetchLeadReports();
    } else if (selectedReportModule === 'deals') {
      fetchDealReports();
    } else if (selectedReportModule === 'orders') {
      fetchOrderReports();
    }
  }, [selectedReportModule]);

  // Helper function to get user display name from extension
  const getUserDisplayName = (extension: string | number): string => {
    if (!extension) return `User ${extension}`;
    const user = users.find(u => {
      const userId = u.id || u.extension || u;
      return userId.toString() === extension.toString();
    });
    if (user) {
      return user.display_name || user.name || `User ${extension}`;
    }
    return `User ${extension}`;
  };

  const fetchLeadReports = async () => {
    setLoading(true);
    try {
      const filters: LeadReportFilters = {
        date_from: startDate,
        date_to: endDate,
        date_field: 'updated_at',
        stage_id: selectedStageId ? Number.parseInt(selectedStageId, 10) : undefined,
        source: selectedSource || undefined,
        owner: selectedOwner || undefined
      };

      const [overview, sources, assignments, conversion, stageDuration] = await Promise.all([
        getLeadOverviewReport(filters),
        getLeadSourceReport(filters),
        getLeadAssignmentReport(filters),
        getLeadConversionReport(filters),
        getLeadStageDurationReport(filters)
      ]);

      setLeadOverview(overview);
      setLeadSources(sources);
      setLeadAssignments(assignments);
      setLeadConversion(conversion);
      setLeadStageDuration(stageDuration);
    } catch (error) {
      console.error('Failed to fetch lead reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealReports = async () => {
    setDealLoading(true);
    try {
      const filters: DealReportFilters = {
        date_from: startDate,
        date_to: endDate,
        date_field: 'updated_at',
        currency: selectedDealCurrency || undefined,
        owner: selectedDealOwner || undefined
      };

      const [funnel, value, stageDuration, lostReasons, conversion] = await Promise.all([
        getDealFunnelReport(filters),
        getDealValueReport(filters),
        getDealStageDurationReport(filters),
        getDealLostReasonReport(filters),
        getDealConversionReport(filters)
      ]);
      
      setDealFunnel(funnel);
      setDealValue(value);
      setDealStageDuration(stageDuration);
      setDealLostReasons(lostReasons);
      setDealConversion(conversion);
    } catch (error) {
      console.error('Failed to fetch deal reports:', error);
    } finally {
      setDealLoading(false);
    }
  };

  const fetchOrderReports = async () => {
    setOrderLoading(true);
    try {
      const filters: OrderReportFilters = {
        date_from: startDate,
        date_to: endDate,
        date_field: 'updated_at',
        currency: selectedOrderCurrency || undefined,
        owner: selectedOrderOwner || undefined
      };

      const [summary, status, revenue, stageDuration, cancellations] = await Promise.all([
        getOrderSummaryReport(filters),
        getOrderStatusReport(filters),
        getOrderRevenueReport(filters),
        getOrderStageDurationReport(filters),
        getOrderCancellationReport(filters)
      ]);
      
      setOrderSummary(summary);
      setOrderStatus(status);
      setOrderRevenue(revenue);
      setOrderStageDuration(stageDuration);
      setOrderCancellations(cancellations);
    } catch (error) {
      console.error('Failed to fetch order reports:', error);
    } finally {
      setOrderLoading(false);
    }
  };


  // Prepare table data from conversion report
  const getTableData = () => {
    if (selectedReportModule === 'leads' && leadConversion) {
      const stageMap = new Map<string, { count: number; converted: number }>();
      
      leadConversion.by_stage.forEach((item) => {
        const existing = stageMap.get(item.stage) || { count: 0, converted: 0 };
        stageMap.set(item.stage, {
          count: existing.count + Number.parseInt(item.count || '0', 10),
          converted: existing.converted + item.converted
        });
      });

      return Array.from(stageMap.entries()).map(([stage, data]) => {
        const conversionRate = data.count > 0 ? ((data.converted / data.count) * 100).toFixed(2) : '0.00';
    return {
          stage,
          count: data.count,
          converted: data.converted,
          conversionRate
        };
      });
    }
    return [];
  };

  // Report tabs configuration
  const reportTabs = [
    { id: 'leads', label: 'Leads', icon: <Target size={16} /> },
    { id: 'deals', label: 'Deals', icon: <Handshake size={16} /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
  ];

  // Filter report tabs based on permissions
  const availableReportTabs = reportTabs.filter(tab => {
    if (tab.id === 'leads') return canViewLeadsReports;
    if (tab.id === 'deals') return canViewDealsReports;
    if (tab.id === 'orders') return canViewOrdersReports;
    return false;
  });

  // Update selected tab if current selection is not available
  useEffect(() => {
    if (!availableReportTabs.some(tab => tab.id === selectedReportModule)) {
      if (availableReportTabs.length > 0) {
        setSelectedReportModule(availableReportTabs[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewLeadsReports, canViewDealsReports, canViewOrdersReports]);

  // If no permissions, show access denied
  if (!canViewReports) {
    return (
      <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_REPORTS]}>
        <div />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_REPORTS]}>
      <div style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header with Title and Date Range */}
      <div style={{
        background: 'white',
        padding: '20px 32px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 className="mb-0 fw-bold" style={{ fontSize: '20px', color: '#1f2937' }}>Reports</h2>
        <div className="d-flex gap-3 align-items-center">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="d-flex align-items-center gap-2 border-0 bg-transparent" 
              style={{
                padding: '8px 16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <Calendar size={16} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                {new Date(startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - {new Date(endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
            </button>
            {showDatePicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '320px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="start-date-input" style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input
                    id="start-date-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
      </div>
                <div style={{ marginBottom: '12px' }}>
                  <label htmlFor="end-date-input" style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>End Date</label>
                  <input
                    id="end-date-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowDatePicker(false)}
                  style={{
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                    cursor: 'pointer',
                      color: '#374151'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDatePicker(false);
                      if (selectedReportModule === 'leads') {
                        fetchLeadReports();
                      } else if (selectedReportModule === 'deals') {
                        fetchDealReports();
                      } else if (selectedReportModule === 'orders') {
                        fetchOrderReports();
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                    </div>
                      </div>
            )}
                    </div>
                  </div>
                </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        padding: '0 32px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '32px'
      }}>
        {availableReportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedReportModule(tab.id);
              if (tab.id === 'leads') {
                fetchLeadReports();
              } else if (tab.id === 'deals') {
                fetchDealReports();
              } else if (tab.id === 'orders') {
                fetchOrderReports();
              }
            }}
            style={{
              padding: '16px 0',
              border: 'none',
              background: 'transparent',
              borderBottom: selectedReportModule === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
              color: selectedReportModule === tab.id ? '#4F46E5' : '#6b7280',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
          </div>

      {/* Lead Reports */}
      {selectedReportModule === 'leads' && canViewLeadsReports && (
        <div style={{ padding: '24px 0px', background: '#f8f9fa' }}>
          {/* Advanced Filters for Leads */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Label htmlFor="lead-source-select" className="small fw-bold mb-2">Lead Source</Form.Label>
                  <Form.Select 
                    id="lead-source-select" 
                    size="sm" 
                    style={{ fontSize: '0.875rem' }}
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                  >
                    <option value="">All Sources</option>
                    {leadSources.map((source) => (
                      <option key={source.source || 'unknown'} value={source.source || 'unknown'}>{source.source || 'Unknown'}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label htmlFor="lead-stage-select" className="small fw-bold mb-2">Stage</Form.Label>
                  <Form.Select 
                    id="lead-stage-select" 
                    size="sm" 
                    style={{ fontSize: '0.875rem' }}
                    value={selectedStageId}
                    onChange={(e) => setSelectedStageId(e.target.value)}
                  >
                    <option value="">All Stages</option>
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id.toString()}>{stage.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label htmlFor="lead-date-range-select" className="small fw-bold mb-2">Date Range</Form.Label>
                  <Form.Select 
                    id="lead-date-range-select" 
                    size="sm" 
                    style={{ fontSize: '0.875rem' }}
                    value={selectedDateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value, 'leads')}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="custom">Custom Range</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label htmlFor="lead-owner-select" className="small fw-bold mb-2">Owner</Form.Label>
                  <Form.Select 
                    id="lead-owner-select" 
                    size="sm" 
                    style={{ fontSize: '0.875rem' }}
                    value={selectedOwner}
                    onChange={(e) => setSelectedOwner(e.target.value)}
                  >
                    <option value="">All Owners</option>
                    {users.map((user) => {
                      const userId = user.id || user.extension || user;
                      const userLabel = user.display_name || user.name || userId;
                      return (
                        <option key={userId} value={userId.toString()}>
                          {userLabel}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                  <Button
                      variant="primary"
                    size="sm"
                      className="flex-grow-1"
                      onClick={() => fetchLeadReports()}
                      disabled={loading}
                    >
                      Apply
                  </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedStageId('');
                        setSelectedSource('');
                        setSelectedOwner('');
                        setSelectedDateRange('30');
                        setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        setEndDate(new Date().toISOString().split('T')[0]);
                      }}
                    >
                      Reset
                    </Button>
              </div>
            </Col>
              </Row>
            </Card.Body>
          </Card>

            {/* Lead Overview KPIs */}
            <KPIOverview
              title="Lead Overview"
              items={[
                {
                  icon: <Users size={24} />,
                  iconColor: '#4F46E5',
                  label: 'TOTAL LEADS',
                  value: (leadOverview?.total_leads || leadConversion?.total_leads || 0).toLocaleString()
                },
                {
                  icon: <UserPlus size={24} />,
                  iconColor: '#10b981',
                  label: 'NEW LEADS',
                  value: (leadOverview?.new_leads || 0).toLocaleString()
                },
                {
                  icon: <UserCheck size={24} />,
                  iconColor: '#f59e0b',
                  label: 'ASSIGNED LEADS',
                  value: (leadOverview?.owned_leads || 0).toLocaleString(),
                  trend: {
                    value: leadOverview?.total_leads ? `${((leadOverview.owned_leads / leadOverview.total_leads) * 100).toFixed(1)}% of total` : '0%',
                    isPositive: false,
                    label: ''
                  }
                },
                {
                  icon: <AlertCircle size={24} />,
                  iconColor: '#3b82f6',
                  label: 'UNASSIGNED',
                  value: (leadOverview?.unassigned_leads || 0).toLocaleString()
                },
                {
                  icon: <Handshake size={24} />,
                  iconColor: '#8b5cf6',
                  label: 'CONVERTED',
                  value: (leadConversion?.converted_to_deals || 0).toLocaleString(),
                  trend: {
                    value: leadConversion ? `${leadConversion.conversion_rate.toFixed(1)}% conversion` : '0%',
                    isPositive: true,
                    label: ''
                  }
                }
              ]}
            />

            {/* Lead Source and Assignment Report - Combined Row */}
            <Row className="g-3 mb-3">
              {/* Lead Source Analysis */}
              <Col lg={5}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', height: '100%' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Lead Source Analysis</h6>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (() => {
                    if (leadSources.length === 0) {
                      return (
                        <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                          No source data available
                        </div>
                      );
                    }
                    const colors = ['#4F46E5', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
                    return (
                      <Row className="g-0">
                        <Col xs={6}>
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={leadSources.map(s => ({ name: s.source || 'Unknown', value: Number.parseInt(s.count, 10), percentage: s.percentage }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={85}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {leadSources.map((entry, index) => (
                                  <Cell key={`cell-${entry.source || 'unknown'}-${index}`} fill={colors[index % 6]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                </Col>
                        <Col xs={6}>
                          <div className="d-flex flex-column justify-content-center h-100 ps-2">
                            {leadSources.map((item, idx) => (
                              <div key={`source-${item.source || 'unknown'}-${idx}`} className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: '11px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[idx % 6], flexShrink: 0 }}></div>
                                <span style={{ color: '#6b7280', whiteSpace: 'nowrap', flex: 1 }}>{item.source || 'Unknown'}</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.count}</span>
                                <span style={{ color: '#6b7280', fontSize: '10px' }}>({item.percentage.toFixed(1)}%)</span>
                              </div>
                            ))}
                          </div>
                </Col>
          </Row>
                    );
                  })()}
                </div>
              </Col>

              {/* Lead Assignment Report */}
              <Col lg={7}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb', height: '100%' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Lead Assignment Report</h6>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (() => {
                    if (leadAssignments.length === 0) {
                      return (
                        <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                          No assignment data available
                        </div>
                      );
                    }
                    return (
                      <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                          <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>User/Owner</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Assigned Leads</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leadAssignments.map((item) => (
                              <tr key={`assignment-${item.user_extension}`}>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                  {getUserDisplayName(item.user_extension)}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                  {item.assigned_count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </Col>
            </Row>

            {/* Conversion and Stage Duration - Combined Row */}
            <Row className="g-3 mb-3">
              {/* Conversion Report */}
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Conversion Report by Stage</h6>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (() => {
                    const tableData = getTableData();
                    if (tableData.length === 0) {
                      return (
                        <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                          No conversion data available
                        </div>
                      );
                    }
                    return (
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                          <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Stage</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Total Leads</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Converted</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Conv. Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.map((item) => (
                              <tr key={`conversion-${item.stage}`}>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                  {item.stage}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', color: '#6b7280' }}>
                                  {item.count}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                  {item.converted}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                  {item.conversionRate}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </Col>

              {/* Stage Duration Report */}
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Stage Duration Report</h6>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (() => {
                    if (leadStageDuration.length === 0) {
                      return (
                        <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                          No stage duration data available
                        </div>
                      );
                    }
                    return (
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                          <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Stage</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Leads</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Avg (Days)</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Min</th>
                              <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Max</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leadStageDuration.map((item, index) => (
                              <tr key={`duration-${item.stage}-${index}`}>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                  {item.stage}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                  {item.lead_count}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                  {item.avg_duration_days.toFixed(1)}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', color: '#10b981' }}>
                                  {item.min_duration_days.toFixed(1)}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', color: '#6b7280' }}>
                                  {item.max_duration_days.toFixed(1)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </Col>
            </Row>

          </div>
        )}

        {/* Deal Reports */}
        {selectedReportModule === 'deals' && canViewDealsReports && (
          <div style={{ padding: '24px 0px', background: '#f8f9fa' }}>
            {/* Advanced Filters for Deals */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={2}>
                    <Form.Label htmlFor="deal-currency-select" className="small fw-bold mb-2">Currency</Form.Label>
                    <Form.Select 
                      id="deal-currency-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedDealCurrency}
                      onChange={(e) => setSelectedDealCurrency(e.target.value)}
                    >
                      <option value="">All Currencies</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="PKR">PKR</option>
                      <option value="INR">INR</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                      <option value="JPY">JPY</option>
                      <option value="CNY">CNY</option>
                      <option value="AED">AED</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label htmlFor="deal-date-range-select" className="small fw-bold mb-2">Date Range</Form.Label>
                    <Form.Select 
                      id="deal-date-range-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedDealDateRange}
                      onChange={(e) => handleDateRangeChange(e.target.value, 'deals')}
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="custom">Custom Range</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label htmlFor="deal-owner-select" className="small fw-bold mb-2">Owner</Form.Label>
                    <Form.Select 
                      id="deal-owner-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedDealOwner}
                      onChange={(e) => setSelectedDealOwner(e.target.value)}
                    >
                      <option value="">All Owners</option>
                      {users.map((user) => {
                        const userId = user.id || user.extension || user;
                        const userLabel = user.display_name || user.name || userId;
                        return (
                          <option key={userId} value={userId.toString()}>
                            {userLabel}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => fetchDealReports()}
                        disabled={dealLoading}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedDealCurrency('');
                          setSelectedDealOwner('');
                          setSelectedDealDateRange('30');
                          setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                          setEndDate(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Deal Overview KPIs */}
            <div style={{ marginBottom: '24px' }}>
              <h6 className="mb-3" style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Deal Overview</h6>
              <Row className="g-3">
                {/* Total Value */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '25%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <DollarSign size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL VALUE (USD)
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdValue = dealValue?.by_currency?.find(c => c.currency === 'USD')?.total_value || 0;
                          if (usdValue >= 1000000) {
                            return `$${(usdValue / 1000000).toFixed(1)}M`;
                          } else if (usdValue >= 1000) {
                            return `$${(usdValue / 1000).toFixed(1)}K`;
                          }
                          return `$${usdValue.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <DollarSign size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL VALUE (USD)
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdValue = dealValue?.by_currency?.find(c => c.currency === 'USD')?.total_value || 0;
                          if (usdValue >= 1000000) {
                            return `$${(usdValue / 1000000).toFixed(1)}M`;
                          } else if (usdValue >= 1000) {
                            return `$${(usdValue / 1000).toFixed(1)}K`;
                          }
                          return `$${usdValue.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Total Deals */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '25%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#4F46E5' }}>
                          <Handshake size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL DEALS
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.total_deals || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#4F46E5' }}>
                          <Handshake size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL DEALS
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.total_deals || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Converted to Orders */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '25%' }} className="d-none d-lg-block">
<Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#f59e0b' }}>
                          <ShoppingBag size={16} />
              </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            CONVERTED TO ORDERS
                          </p>
            </div>
          </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.converted_to_orders || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#f59e0b' }}>
                          <ShoppingBag size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            CONVERTED TO ORDERS
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.converted_to_orders || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Conversion Rate */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '25%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#8b5cf6' }}>
                          <TrendingUp size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            CONVERSION RATE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.conversion_rate?.toFixed(1) || '0.0'}%
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2">
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                          {dealConversion?.converted_to_orders || 0} of {dealConversion?.total_deals || 0} deals
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#8b5cf6' }}>
                          <TrendingUp size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            CONVERSION RATE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {dealConversion?.conversion_rate?.toFixed(1) || '0.0'}%
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2">
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                          {dealConversion?.converted_to_orders || 0} of {dealConversion?.total_deals || 0} deals
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Deal Funnel Report */}
            <Row className="g-3 mb-3">
              <Col lg={12}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Deal Funnel Report</h6>
                  {dealLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '340px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : dealFunnel.length > 0 ? (
                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Stage</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Deals</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Total Value</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>% of Total</th>
                </tr>
              </thead>
              <tbody>
                          {dealFunnel.map((item, index) => {
                            const colors = ['#4F46E5', '#6366f1', '#8b5cf6', '#10b981', '#059669'];
                            return (
                              <tr key={`funnel-${item.stage}-${item.currency}-${index}`}>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0' }}>
                                  <div className="d-flex align-items-center gap-2">
                                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[index % colors.length], flexShrink: 0 }}></div>
                                    <span style={{ color: '#1f2937', fontWeight: 500 }}>{item.stage}</span>
                                  </div>
                    </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                  {item.currency}
                    </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                  {item.count}
                    </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                  {item.currency} {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                  {item.percentage.toFixed(1)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '340px' }}>
                      No funnel data available
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Deal Value and Stage Duration Reports */}
            <Row className="g-3 mb-3">
              {/* Deal Value Report */}
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Deal Value Report</h6>
                  {dealLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : dealValue?.by_owner && dealValue.by_owner.length > 0 ? (
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Owner</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Deals</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Total Value</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Avg Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dealValue.by_owner.map((item, index) => (
                            <tr key={`value-owner-${item.owner}-${item.currency}-${index}`}>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                {getUserDisplayName(item.owner)}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                {item.currency}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                {item.deal_count}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                {item.currency} {item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                {item.currency} {item.avg_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
                      </table>
          </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                      No deal value data available
                    </div>
                  )}
                </div>
              </Col>

              {/* Stage Duration Report */}
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Stage Duration Report</h6>
                  {dealLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '280px' }}>
                      <div className="spinner-border spinner-border-sm">
                        <span className="visually-hidden">Loading...</span>
              </div>
              </div>
                  ) : dealStageDuration.length > 0 ? (
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Stage</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Deals</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Avg Duration (Days)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dealStageDuration
                            .filter(item => item.deal_count > 0)
                            .map((item, index) => (
                              <tr key={`deal-duration-${item.stage}-${index}`}>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                  {item.stage}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                  {item.deal_count}
                                </td>
                                <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                  {item.avg_duration_days.toFixed(1)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
            </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '280px' }}>
                      No stage duration data available
          </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Lost Reasons Report */}
            <Row className="g-3 mb-3">
              <Col lg={12}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Lost Reasons Report</h6>
                  {dealLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
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
                              data={dealLostReasons}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={false}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {dealLostReasons.map((entry) => {
                                const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280', '#9ca3af'];
                                const index = dealLostReasons.indexOf(entry);
                                return (
                                  <Cell key={`cell-${entry.reason}-${entry.currency}`} fill={colors[index % colors.length]} />
                                );
                              })}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Col>
                      <Col xs={7}>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                            <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Lost Reason</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Count</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>% of Lost</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Total Value Lost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dealLostReasons.map((item) => {
                                const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280', '#9ca3af'];
                                const index = dealLostReasons.indexOf(item);
                                return (
                                  <tr key={`lost-reason-${item.reason}-${item.currency}`}>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[index % colors.length], flexShrink: 0 }}></div>
                                        <span style={{ color: '#1f2937', fontWeight: 500 }}>{item.reason}</span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                      {item.currency}
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                      {item.count}
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                      {item.percentage.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                      {item.currency} {item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '300px' }}>
                      No lost reasons data available
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}

        {/* Order Reports */}
        {selectedReportModule === 'orders' && canViewOrdersReports && (
          <div style={{ padding: '24px 0px', background: '#f8f9fa' }}>
            {/* Advanced Filters for Orders */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={2}>
                    <Form.Label htmlFor="order-currency-select" className="small fw-bold mb-2">Currency</Form.Label>
                    <Form.Select 
                      id="order-currency-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedOrderCurrency}
                      onChange={(e) => setSelectedOrderCurrency(e.target.value)}
                    >
                      <option value="">All Currencies</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="PKR">PKR</option>
                      <option value="INR">INR</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                      <option value="JPY">JPY</option>
                      <option value="CNY">CNY</option>
                      <option value="AED">AED</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label htmlFor="order-date-range-select" className="small fw-bold mb-2">Date Range</Form.Label>
                    <Form.Select 
                      id="order-date-range-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedOrderDateRange}
                      onChange={(e) => handleDateRangeChange(e.target.value, 'orders')}
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="custom">Custom Range</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label htmlFor="order-owner-select" className="small fw-bold mb-2">Owner</Form.Label>
                    <Form.Select 
                      id="order-owner-select" 
                      size="sm" 
                      style={{ fontSize: '0.875rem' }}
                      value={selectedOrderOwner}
                      onChange={(e) => setSelectedOrderOwner(e.target.value)}
                    >
                      <option value="">All Owners</option>
                      {users.map((user) => {
                        const userId = user.id || user.extension || user;
                        const userLabel = user.display_name || user.name || userId;
                        return (
                          <option key={userId} value={userId.toString()}>
                            {userLabel}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => fetchOrderReports()}
                        disabled={orderLoading}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderCurrency('');
                          setSelectedOrderOwner('');
                          setSelectedOrderDateRange('30');
                          setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                          setEndDate(new Date().toISOString().split('T')[0]);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Order Overview KPIs */}
            <div style={{ marginBottom: '24px' }}>
              <h6 className="mb-3" style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>Order Overview</h6>
              <Row className="g-3">
                {/* Total Orders */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '20%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#f59e0b' }}>
                          <ShoppingBag size={16} />
          </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL ORDERS
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderSummary?.total_orders?.toLocaleString() || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#f59e0b' }}>
                          <ShoppingBag size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL ORDERS
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderSummary?.total_orders?.toLocaleString() || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Pending */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '20%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#3b82f6' }}>
                          <Clock size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            PENDING
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderStatus.find(s => s.status === 'Pending')?.count || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2">
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                          {orderSummary?.total_orders ? `${((orderStatus.find(s => s.status === 'Pending')?.count || 0) / orderSummary.total_orders * 100).toFixed(1)}% of total` : '0% of total'}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#3b82f6' }}>
                          <Clock size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            PENDING
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderStatus.find(s => s.status === 'Pending')?.count || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2">
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                          {orderSummary?.total_orders ? `${((orderStatus.find(s => s.status === 'Pending')?.count || 0) / orderSummary.total_orders * 100).toFixed(1)}% of total` : '0% of total'}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Approved */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '20%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <CheckCircle size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            APPROVED
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderStatus.find(s => s.status === 'Approved')?.count || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <CheckCircle size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            APPROVED
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {orderStatus.find(s => s.status === 'Approved')?.count || 0}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Total Revenue */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '20%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <DollarSign size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL REVENUE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdValue = orderSummary?.by_currency?.find(c => c.currency === 'USD')?.total_value || 0;
                          if (usdValue >= 1000000) return `$${(usdValue / 1000000).toFixed(1)}M`;
                          if (usdValue >= 1000) return `$${(usdValue / 1000).toFixed(1)}K`;
                          return `$${usdValue.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#10b981' }}>
                          <DollarSign size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            TOTAL REVENUE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdValue = orderSummary?.by_currency?.find(c => c.currency === 'USD')?.total_value || 0;
                          if (usdValue >= 1000000) return `$${(usdValue / 1000000).toFixed(1)}M`;
                          if (usdValue >= 1000) return `$${(usdValue / 1000).toFixed(1)}K`;
                          return `$${usdValue.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Avg Order Value */}
                <Col xs={12} sm={6} md={4} lg={3} style={{ flex: '0 0 auto', width: '20%' }} className="d-none d-lg-block">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#8b5cf6' }}>
                          <Wallet size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            AVG ORDER VALUE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdAvg = orderSummary?.by_currency?.find(c => c.currency === 'USD')?.avg_value || 0;
                          if (usdAvg >= 1000) return `$${(usdAvg / 1000).toFixed(1)}K`;
                          return `$${usdAvg.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} md={4} className="d-lg-none">
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-end justify-content-between mb-3">
                        <div style={{ color: '#8b5cf6' }}>
                          <Wallet size={16} />
                        </div>
                        <div className="text-end">
                          <p className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            AVG ORDER VALUE
                          </p>
                        </div>
                      </div>
                      <h2 className="mb-2 fw-bold text-end" style={{ fontSize: '1.75rem' }}>
                        {(() => {
                          const usdAvg = orderSummary?.by_currency?.find(c => c.currency === 'USD')?.avg_value || 0;
                          if (usdAvg >= 1000) return `$${(usdAvg / 1000).toFixed(1)}K`;
                          return `$${usdAvg.toFixed(2)}`;
                        })()}
                      </h2>
                      <div className="d-flex align-items-center justify-content-end mt-2" style={{ minHeight: '20px' }}>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Revenue by Month Report */}
            <Row className="g-3 mb-3">
              <Col lg={12}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Revenue by Month</h6>
                  {orderLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '380px' }}>
                      <div className="spinner-border spinner-border-sm"><span className="visually-hidden">Loading...</span></div>
                    </div>
                  ) : orderRevenue?.by_month && orderRevenue.by_month.length > 0 ? (
                    <Row className="g-3">
                      <Col lg={7}>
                        <ResponsiveContainer width="100%" height={380}>
                          <ComposedChart 
                            data={(() => {
                              const monthMap = new Map<string, { orders: number; revenue: number }>();
                              orderRevenue.by_month.forEach(item => {
                                const existing = monthMap.get(item.month) || { orders: 0, revenue: 0 };
                                monthMap.set(item.month, {
                                  orders: existing.orders + item.order_count,
                                  revenue: existing.revenue + item.total_value
                                });
                              });
                              return Array.from(monthMap.entries()).map(([month, data]) => ({
                                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                                orders: data.orders,
                                revenue: data.revenue
                              }));
                            })()}
                            barCategoryGap="15%"
                          >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                            <YAxis 
                              yAxisId="left"
                              stroke="#4F46E5"
                style={{ fontSize: '12px' }}
                              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="#10b981"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                              formatter={(value: any, name: string) => {
                                if (name === 'Revenue') return [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue'];
                                return [value, 'Orders'];
                              }}
              />
              <Legend />
                            <Bar yAxisId="left" dataKey="revenue" fill="#4F46E5" name="Revenue" radius={[8, 8, 0, 0]} />
                            <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" radius={[8, 8, 0, 0]} />
                          </ComposedChart>
          </ResponsiveContainer>
                      </Col>
                      <Col lg={5}>
                        <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                          <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                            <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Month</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Orders</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Revenue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderRevenue.by_month.map((item, index) => (
                                <tr key={`revenue-month-${item.month}-${item.currency}-${index}`}>
                                  <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                    {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                  </td>
                                  <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                    {item.currency}
                                  </td>
                                  <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                    {item.order_count}
                                  </td>
                                  <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                    {item.currency} {item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
              </div>
                      </Col>
                    </Row>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '380px' }}>
                      No revenue data available
                  </div>
                  )}
                </div>
              </Col>
            </Row>

            {/* Revenue by Owner and Stage Duration Reports */}
            <Row className="g-3 mb-3">
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Revenue by Owner</h6>
                  {orderLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '340px' }}>
                      <div className="spinner-border spinner-border-sm"><span className="visually-hidden">Loading...</span></div>
                  </div>
                  ) : orderRevenue?.by_owner && orderRevenue.by_owner.length > 0 ? (
                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Owner</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Orders</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Total Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderRevenue.by_owner.map((item, index) => (
                            <tr key={`revenue-owner-${item.owner || 'null'}-${item.currency}-${index}`}>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                {item.owner ? getUserDisplayName(item.owner) : 'Unassigned'}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                {item.currency}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                {item.order_count}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                                {item.currency} {item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '340px' }}>
                      No revenue data available
                  </div>
                  )}
                </div>
        </Col>
              <Col lg={6}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Stage Duration</h6>
                  {orderLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '340px' }}>
                      <div className="spinner-border spinner-border-sm"><span className="visually-hidden">Loading...</span></div>
              </div>
                  ) : orderStageDuration.length > 0 ? (
                    <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                      <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Stage</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Orders</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Avg Duration (Days)</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Min</th>
                            <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Max</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderStageDuration.filter(item => item.order_count > 0).map((item, index) => (
                            <tr key={`order-duration-${item.stage}-${index}`}>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', color: '#1f2937', fontWeight: 500 }}>
                                {item.stage}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                {item.order_count}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                {item.avg_duration_days.toFixed(1)}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', color: '#10b981' }}>
                                {item.min_duration_days.toFixed(1)}
                              </td>
                              <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', color: '#6b7280' }}>
                                {item.max_duration_days.toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '340px' }}>
                      No stage duration data available
                </div>
                  )}
                  </div>
              </Col>
            </Row>

            {/* Cancellations Report */}
            <Row className="g-3 mb-3">
              <Col lg={12}>
                <div style={{ background: 'white', borderRadius: '8px', padding: '20px', border: '1px solid #e5e7eb' }}>
                  <h6 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>Cancellations</h6>
                  {orderLoading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                      <div className="spinner-border spinner-border-sm"><span className="visually-hidden">Loading...</span></div>
                </div>
                  ) : orderCancellations.length > 0 ? (
                    <Row className="g-0">
                      <Col xs={3}>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={orderCancellations}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={false}
                              outerRadius={90}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {orderCancellations.map((entry) => {
                                const colors = ['#ef4444', '#f59e0b', '#dc2626', '#b91c1c', '#991b1b'];
                                const index = orderCancellations.indexOf(entry);
                                return (
                                  <Cell key={`cell-${entry.reason}-${entry.currency}`} fill={colors[index % colors.length]} />
                                );
                              })}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </Col>
                      <Col xs={9}>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          <table className="table table-sm table-hover mb-0" style={{ fontSize: '12px' }}>
                            <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0, zIndex: 1 }}>
                              <tr>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937' }}>Lost Reason</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'center' }}>Currency</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Count</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>% of Cancelled</th>
                                <th style={{ border: 'none', padding: '10px', fontWeight: 600, color: '#1f2937', textAlign: 'right' }}>Value Lost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderCancellations.map((item) => {
                                const colors = ['#ef4444', '#f59e0b', '#dc2626', '#b91c1c', '#991b1b'];
                                const index = orderCancellations.indexOf(item);
                                return (
                                  <tr key={`cancellation-${item.reason}-${item.currency}`}>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: colors[index % colors.length], flexShrink: 0 }}></div>
                                        <span style={{ color: '#1f2937', fontWeight: 500 }}>{item.reason}</span>
                  </div>
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'center', color: '#6b7280' }}>
                                      {item.currency}
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                                      {item.count}
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#4F46E5' }}>
                                      {item.percentage.toFixed(1)}%
                                    </td>
                                    <td style={{ padding: '10px', borderTop: '1px solid #f0f0f0', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                                      {item.currency} {item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                </div>
                      </Col>
                    </Row>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center text-muted" style={{ height: '300px' }}>
                      No cancellation data available
              </div>
                  )}
                </div>
        </Col>
      </Row>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

CrmReports.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};

export default CrmReports;