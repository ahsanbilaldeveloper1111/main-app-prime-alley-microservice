import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import {DollarSign, Package} from 'lucide-react';
import Link from 'next/link';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,ResponsiveContainer} from 'recharts';
import UAECurrencyLogo from "@assets/images/uae-currency-logo.jpg";
import { formatNumber } from "@utils/Helper";

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
    change: string;
    isPositive: boolean;
    isImage: boolean;
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
        { title: 'Active Products', value: response?.products?.total, icon: <Package size={24} />, color: 'primary', change: '+12.5%', isPositive: true,isImage: false },
      { title: 'Open Invoice Amount', value: currency + ' ' + formatNumber(response?.invoices?.total_amount), icon: <DollarSign size={24} />, color: 'info', change: '+15.3%', isPositive: true,isImage: true },
      { title: 'Open Unpaid Amount', value: currency + ' ' + formatNumber(response?.invoices?.outstanding_amount), icon: <DollarSign size={24} />, color: 'warning', change: '-5.1%', isPositive: false,isImage: true },
      { title: 'Paid Amount', value: currency + ' ' + formatNumber(response?.invoices?.paid_amount), icon: <DollarSign size={24} />, color: 'success', change: '+8.2%', isPositive: true,isImage: true }
      ]
    );
  
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
          <Bar dataKey="total_amount" fill="#04a9f5" name="Total Amount" />
          <Bar dataKey="paid_amount" fill="#1de9b6" name="Paid Amount" />
          <Bar dataKey="outstanding_amount" fill="#f4c22b" name="Outstanding Amount" />
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
        
                {/* Summary Cards */}
                <Row className="mb-4">
                  {summaryCards.map((card, index) => (
                    <Col lg={3} md={6} key={index} className="mb-3">
                      <Card>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            

                            {card.isImage ===false && 
                            <>
                            <div className={`bg-${card.color} bg-opacity-10 rounded p-3`}>
                            <div className={`text-${card.color}`}>{card.icon}</div>
                            </div>
                            </>

                               }
                              {card.isImage && 
                              <>
                              <div className={`bg-light  rounded p-3`}>
                              <img src={UAECurrencyLogo.src} alt="Currency Logo" width={24} height={24} />
                              </div>
                              </>
                              }

                            {/* <Badge bg={card.isPositive ? 'success' : 'danger'} className="bg-opacity-10">
                              {card.isPositive ? <ArrowUp size={12} className="me-1" /> : <ArrowDown size={12} className="me-1" />}
                              <span className={`text-${card.isPositive ? 'success' : 'danger'}`}>{card.change}</span>
                            </Badge> */}
                          </div>
                          <h3 className="mb-1">{card.value}</h3>
                          <p className="text-muted mb-0 small">{card.title}</p>
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
                        <h5 className="mb-4">Payments History (Last 6 Months)</h5>
                        {/* <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="mb-0">Spending Overview</h5>
                          <Form.Select size="sm" style={{ width: '150px' }}>
                            <option>Last 6 months</option>
                            <option>Last 12 months</option>
                            <option>This year</option>
                          </Form.Select>
                        </div> */}
                        <SpendingChart />

                        <Row className="mt-4">
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
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
        
                  {/* Active Products */}
                  <Col lg={4} className="mb-4">
                    <Card>
                      <Card.Body>
                        <h5 className="mb-4">Active Subscriptions</h5>
                        {topProducts.map((product: any, index: number) => (
                          <div key={index} className="mb-4 pb-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1 text-capitalize">{product.name}</h6>
                                {/* <small className="text-muted">Renewal: {product.renewal}</small> */}
                              </div>
                              {/* <Badge bg={product.status === 'Active' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                                {product.status}
                              </Badge> */}
                            </div>
                            <div className="text-muted small">Total Revenue: <span className="fw-semibold">{currency} {formatNumber(product.total_revenue)}</span></div>
                          </div>
                        ))}
                        <Link href="/accounting/customer/product-details" className="w-100 btn btn-outline-primary btn-sm">
                          View All Products
                        </Link>
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
