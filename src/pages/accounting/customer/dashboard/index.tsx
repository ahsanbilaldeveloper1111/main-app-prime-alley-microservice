import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from 'react';
import { Card, Row, Col,Button,Badge, Form} from 'react-bootstrap';
import {AlertCircle, Check, Clock, DollarSign, FileText,  Wallet, TrendingUp, Package} from 'lucide-react';
import Link from 'next/link';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,ResponsiveContainer,Legend} from 'recharts';
import UAECurrencyLogo from "@assets/images/uae-currency-logo.jpg";
import { formatNumber } from "@utils/Helper";

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";


import { GetDashboardCounters, GetProfitLossData, GetTopProducts, GetRecentActivity, GetAnalyticsByMonth, GetCompanyDetails } from "@utils/accounting";
import { useSession } from "next-auth/react";
import router from "next/router";


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
  const [summaryCards, setSummaryCards] = useState<Array<{
    title: string;
    value: any;
    icon: React.ReactElement;
    color: string;
    change?: string;
    isPositive?: boolean;
    isImage?: boolean;
    iconBg?: string;
    iconColor?: string;
    payNow?: boolean;
  }>>([]);

  useEffect(() => {
    getCompanyDetails();
  }, []);
  useEffect(() => {
    getDashboardCounters();
    getProfitLossData();
    getTopProducts();
    getRecentActivity();
    getAnalyticsByMonth();
  }, [currency]);

  const getCompanyDetails = async () => {
    const response = await GetCompanyDetails() as any;
    setCurrency(response?.profile?.currency);
  };

  const getDashboardCounters = async () => {
    const response = await GetDashboardCounters() as any;
    setDashboardCounters(response);
    setSummaryCards(
      [
        { title: 'Subscriptions', value: response?.products?.total || 0, icon: <Package size={24} />, color: 'primary', iconBg: 'rgba(59, 130, 246, 0.1)', iconColor: '#3b82f6' },
        { title: 'Total Invoice Amount', value: currency + ' ' + formatNumber(response?.invoices?.total_amount), icon: <FileText size={24} />, color: 'primary', iconBg: 'rgba(59, 130, 246, 0.1)', iconColor: '#3b82f6' },
        { title: 'Outstanding Amount', value: currency + ' ' + formatNumber(response?.invoices?.outstanding_amount), icon: <AlertCircle size={24} />, color: 'warning', iconBg: 'rgba(251, 191, 36, 0.1)', iconColor: '#fbbf24' },
        //  { title: 'Est. Next Month', value: '0.00', icon: <Wallet size={24} />, color: 'info', iconBg: 'rgba(34, 211, 238, 0.1)', iconColor: '#22d3ee' },
        { title: 'Overdue Invoices', value: response?.invoices?.overdue_invoices_count, icon: <Clock size={24} />, color: 'danger', iconBg: 'rgba(239, 68, 68, 0.1)', iconColor: '#ef4444', payNow: false },
        { title: 'Overdue Amount', value: currency + ' ' + formatNumber(response?.invoices?.overdue_amount), icon: <AlertCircle size={24} />, color: 'warning', iconBg: 'rgba(251, 191, 36, 0.1)', iconColor: '#fbbf24', payNow: true }
      ]
    );
  
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

  const getAnalyticsByMonth = async () => {
    const response = await GetAnalyticsByMonth() as any;

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
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 className="mb-1">Welcome back, {session?.user?.name}!</h2>
                    <p className="text-muted mb-0">Here's what's happening with your account today.</p>
                  </div>
                </div>
        
                {/* Summary Cards - 6 boxes in one row */}
      <Row className="mb-4">
        {summaryCards.map((card, index) => (
          <Col xl={3} lg={4} md={4} key={index} className="mb-3">
            <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
              <Card.Body>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded p-2" style={{ backgroundColor: card.iconBg, flexShrink: 0 }}>
                    <div style={{ color: card.iconColor }}>{card.icon}</div>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{card.value}</h3>
                    <p className="text-muted mb-0" style={{ fontSize: '0.7rem', lineHeight: '1.3' }}>{card.title}</p>
                  </div>
                </div>
                {card.payNow && (
                  <div className="d-flex justify-content-end mt-2" style={{ position: 'absolute', top: '-25px', right: '0px' }}>
                    <Button 
                    onClick={() => router.push('/accounting/customer/invoices')}
                      variant="primary" 
                      size="sm"
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.35rem 0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      Pay Now
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
                
        
                <Row>
                  {/* Spending Overview */}
                  <Col lg={8} className="mb-4">
                    <Card>
                      <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0" style={{ fontWeight: '600' }}>Spending Overview</h5>
                        <Form.Select size="sm" style={{ width: '150px' }}>
                          <option>Last 6 months</option>
                          <option>Last 12 months</option>
                          <option>This year</option>
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
