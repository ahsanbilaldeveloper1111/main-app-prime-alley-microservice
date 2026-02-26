import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from 'react';
import { Card, Row, Col, Badge, Form } from 'react-bootstrap';
import { AlertCircle, Check, Clock, FileText, Wallet, TrendingUp, Package } from 'lucide-react';
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import router from "next/router";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,ResponsiveContainer,Legend} from 'recharts';
import { formatNumber } from "@utils/Helper";

const CURRENCY_SYMBOL = '';
const formatWithOneDecimal = (value: number | string | undefined | null): string =>
  (Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatInteger = (value: number | string | undefined | null): string =>
  (Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";


import { GetDashboardCounters, GetProfitLossData, GetTopProducts, GetRecentActivity, GetAnalyticsByMonth, GetCompanyDetails } from "@utils/accounting";
import { useSession } from "next-auth/react";


const CustomerDashboard = () => {

  const { data:session, status } = useSession();
  const [currency, setCurrency] = useState<string>('');
  const [dashboardCounters, setDashboardCounters] = useState<any>(null);
  const [profitLossData, setProfitLossData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<Array<{
    name: string;
    total_revenue: string;
    status: string;
    subscriptions: string;
  }>>([]);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [analyticsByMonth, setAnalyticsByMonth] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<Array<{
    month: string;
    month_name?: string;
    spent: number;
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
  }>>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Last 3 months');
  const [summaryCards, setSummaryCards] = useState<StatsCardData[]>([]);

  useEffect(() => {
    getCompanyDetails();
  }, []);
  useEffect(() => {
    getDashboardCounters();
    getProfitLossData();
    getTopProducts();
    getRecentActivity();
    getAnalyticsByMonth();
  }, [currency, selectedPeriod]);

  const getCompanyDetails = async () => {
    const response = await GetCompanyDetails() as any;
    setCurrency(response?.profile?.currency);
  };

  const getDashboardCounters = async () => {
    const response = await GetDashboardCounters() as any;
    setDashboardCounters(response);
    setSummaryCards([
      { title: 'Subscriptions', value: formatInteger(response?.products?.total ?? 0), icon: Package, iconColor: '#3b82f6', iconBgColor: 'rgba(59, 130, 246, 0.1)' },
      { title: 'Total Invoice Amount', value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.total_amount)}`, icon: FileText, iconColor: '#3b82f6', iconBgColor: 'rgba(59, 130, 246, 0.1)' },
      { title: 'Outstanding Amount', value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.outstanding_amount)}`, icon: AlertCircle, iconColor: '#fbbf24', iconBgColor: 'rgba(251, 191, 36, 0.1)' },
      { title: 'Overdue Invoices', value: formatInteger(response?.invoices?.overdue_invoices_count ?? 0), icon: Clock, iconColor: '#ef4444', iconBgColor: 'rgba(239, 68, 68, 0.1)' },
      { title: 'Overdue Amount', value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.overdue_amount)}`, icon: AlertCircle, iconColor: '#fbbf24', iconBgColor: 'rgba(251, 191, 36, 0.1)', link: { text: 'Pay Now', onClick: () => router.push('/billing/invoices') } },
      { title: 'Paid This Month', value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(52340.5)}`, icon: Wallet, iconColor: '#10B981', iconBgColor: '#D1FAE5', subtitle: 'Last 30 days' }
    ]);
  };

   // Helper function to get status badge color
   const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'primary';
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'suspended': return 'secondary';
      case 'in progress': return 'info';
      case 'inactive': return 'secondary';
      default: return 'primary';
    }
  };

  // Helper function to get background color RGB for status
  const getStatusBackgroundColor = (status: string | null | undefined) => {
    if (!status) return '59, 130, 246'; // blue default
    switch (status.toLowerCase()) {
      case 'active': return '34, 197, 94'; // green
      case 'trial': return '251, 191, 36'; // yellow
      case 'in progress': return '59, 130, 246'; // blue
      case 'suspended': return '156, 163, 175'; // gray
      case 'inactive': return '107, 114, 128'; // darker gray
      default: return '59, 130, 246'; // blue
    }
  };

  // Helper function to get icon color for status
  const getStatusIconColor = (status: string | null | undefined) => {
    if (!status) return '#3b82f6'; // blue default
    switch (status.toLowerCase()) {
      case 'active': return '#22c55e'; // green
      case 'trial': return '#fbbf24'; // yellow
      case 'in progress': return '#3b82f6'; // blue
      case 'suspended': return '#9ca3af'; // gray
      case 'inactive': return '#6b7280'; // darker gray
      default: return '#3b82f6'; // blue
    }
  };

  // Helper function to get icon for subscription status
  const getSubscriptionIcon = (status: string | null | undefined) => {
    if (!status) return <FileText size={18} />;
    switch (status.toLowerCase()) {
      case 'active':
        return <Check size={18} />;
      case 'trial':
        return <Clock size={18} />;
      case 'suspended':
        return <AlertCircle size={18} />;
      case 'in progress':
        return <TrendingUp size={18} />;
      case 'inactive':
        return <AlertCircle size={18} />;
      case 'certiive':
        return <Package size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const getProfitLossData = async () => {
    const response = await GetProfitLossData();
    setProfitLossData(response);
  };

  const getTopProducts = async () => {
    const response = await GetTopProducts();
    setTopProducts(response as any);
  };

  const getRecentActivity = async () => {
    const response = await GetRecentActivity();
    setRecentActivity(response);
  };

  // Helper function to format date as DD-MM-YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Calculate date range based on selected period
  const getDateRange = (period: string): { start_date: string; end_date: string } => {
    const today = new Date();
    const endDate = new Date(today);
    let startDate = new Date(today);

    switch (period) {
      case 'Last 3 months':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'Last 6 months':
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'This year':
        startDate = new Date(today.getFullYear(), 0, 1); // January 1st of current year
        break;
      default:
        startDate.setMonth(today.getMonth() - 3);
    }

    return {
      start_date: formatDate(startDate),
      end_date: formatDate(endDate)
    };
  };

  const getAnalyticsByMonth = async () => {
    const dateRange = getDateRange(selectedPeriod);
    console.log('Date Range:', dateRange); // Debug log
    const response = await GetAnalyticsByMonth(dateRange.start_date, dateRange.end_date) as any;

    // Transform the response data for the chart
    // Use response if available, otherwise use sampleResponse
    const dataToUse = response as any;
    const transformedData = dataToUse.map((item: any) => {
      // Extract month abbreviation from month_name (e.g., "Jun 2025" -> "Jun")
      const monthAbbr = item.month_name;// ? item.month_name.split(' ')[0] : '';
      return {
        month: monthAbbr,
        month_name: item.month_name,
        spent: item.total_amount || 0,
        total_amount: item.total_amount || 0,
        paid_amount: item.paid_amount || 0,
        outstanding_amount: item.outstanding_amount || 0
      };
    });
    
    setSpendingData(transformedData);
  };

  const SpendingChart = () => {
    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white border rounded shadow-sm p-3">
            <p className="mb-2 fw-semibold">{data.month_name}</p>
            <p className="mb-1 small">
              <span className="text-muted">Open Invoice Amount: </span>
              <span className="fw-semibold text-primary">{currency} {formatNumber(data.total_amount)}</span>
            </p>
            <p className="mb-1 small">
              <span className="text-muted">Paid Amount: </span>
              <span className="fw-semibold text-success">{currency} {formatNumber(data.paid_amount)}</span>
            </p>
            <p className="mb-0 small">
              <span className="text-muted">Open Unpaid Amount: </span>
              <span className="fw-semibold text-warning">{currency} {formatNumber(data.outstanding_amount)}</span>
            </p>
          </div>
        );
      }
      return null;
    };

    const barChartData: any[] = [];
    for (const item of spendingData) {
      barChartData.push({
        month: item.month,
        month_name: item.month_name,
        total_amount: item.total_amount,
        paid_amount: item.paid_amount,
        outstanding_amount: item.outstanding_amount
      });
    }
    console.log(barChartData);

    return (
      <ResponsiveContainer width="100%" height={354}>
        <BarChart data={barChartData}>
          
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="total_amount" fill="#04a9f5" name="Total Amount" />
          <Bar dataKey="paid_amount" fill="#28a745" name="Paid" />
          <Bar dataKey="outstanding_amount" fill="#ffc107" name="Unpaid" />
        </BarChart>

        
      </ResponsiveContainer>
    );
  };

     

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />


<div>
                {/* <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 className="mb-1">Welcome back, {session?.user?.name}!</h2>
                    <p className="text-muted mb-0">Here's what's happening with your account today.</p>
                  </div>
                </div> */}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <a href="/dashboard" className="text-decoration-none">
                  Accounting
                </a>
              </li>
              <li className="breadcrumb-item active fw-bold" aria-current="page">
                Dashboard
              </li>
            </ol>
          </nav>
        </div>

      </div>
        
                {/* Summary Cards */}
      {/* <StatsCards data={summaryCards} gridMinWidth="180px" /> */}
      <StatsCards data={summaryCards} gridMinWidth="180px" valueFontSize="28px" />
        
                <Row>
                  {/* Spending Overview */}
                  <Col lg={8} className="mb-4">
                    <Card>
                      <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0" style={{ fontWeight: '600' }}>Spending Overview</h5>
                        <Form.Select 
                          size="sm" 
                          style={{ width: '150px' }}
                          value={selectedPeriod}
                          onChange={(e) => {
                            setSelectedPeriod(e.target.value);
                          }}
                        >
                          <option value="Last 3 months">Last 3 months</option>
                          <option value="Last 6 months">Last 6 months</option>
                          <option value="This year">This year</option>
                        </Form.Select>
                      </div>
                      <SpendingChart />

                        {/* <Row className="mt-4">
                          <Col lg={4}>
                            <div className="text-center border p-2 rounded">
                            <h6 className="mb-2 text-muted">Open Invoice Amount</h6>
                              <h4 className="fw-semibold text-primary">{currency} {formatNumber(dashboardCounters?.invoices?.total_amount)}</h4>
                            </div>
                          </Col>
                          <Col lg={4}>
                            <div className="text-center border p-2 rounded">
                              <h6 className="mb-2 text-muted">Open Unpaid Amount</h6>
                              <h4 className="fw-semibold text-warning">{currency} {formatNumber(dashboardCounters?.invoices?.outstanding_amount)}</h4>
                            </div>
                          </Col>
                          <Col lg={4}>
                            <div className="text-center border p-2 rounded">
                              <h6 className="mb-2 text-muted">Paid Amount</h6>
                              <h4 className="fw-semibold text-success">{currency} {formatNumber(dashboardCounters?.invoices?.paid_amount)}</h4>
                            </div>
                          </Col>
                        </Row> */}
                      </Card.Body>
                    </Card>
                  </Col>


                  {/* Active Subscriptions */}
        <Col lg={4} className="mb-4">
          <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Card.Body>
              <h5 className="mb-4" style={{ fontWeight: '600' }}>Subscriptions</h5>
              <div style={{ maxHeight: '367px', overflowY: 'auto' }}>
                {topProducts.map((subscription, index) => (
                  <div key={index} className="mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded d-flex align-items-center justify-content-center" 
                        style={{ 
                          width: '36px', 
                          height: '36px',
                          backgroundColor: `rgba(${getStatusBackgroundColor(subscription?.status)}, 0.1)`,
                          flexShrink: 0
                        }}
                      >
                        <div style={{ color: getStatusIconColor(subscription?.status) }}>
                          {subscription?.subscriptions || '0'}
                        </div>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h6 className="mb-0 text-truncate text-capitalize" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                          {subscription?.name}
                        </h6>
                      </div>
                      <div style={{ marginLeft: '8px', flexShrink: 0 }}>
                        <Badge 
                          bg={getStatusBadgeColor(subscription?.status)}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          {subscription?.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>






                </Row>
              </div>

    </React.Fragment>
  );
};

CustomerDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerDashboard;
