import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, Modal, Dropdown, ProgressBar } from 'react-bootstrap';
import { 
  Eye, CreditCard, Clock, Wallet, ChevronRight, ChevronLeft,
  Edit, Trash2, Filter, Plus, Settings, Download, LayoutDashboard,
  Package, FileText, Bell, Check, DollarSign, TrendingUp, AlertCircle,
  Users, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

interface Product {
      id: number;
      name: string;
      category: string;
      price: string;
      type: string;
      totalAmount: string;
      status: string;
      created: string;
    }
    
    interface Invoice {
      id: number;
      invoice: string;
      date: string;
      dueDate: string;
      amount: string;
      status: string;
      paymentMethod: string;
      items: { name: string; quantity: number; price: string }[];
      subtotal: string;
      tax: string;
      total: string;
    }

const CustomerDashboard = () => {

      const renderDashboard = () => {
            const summaryCards = [
              { title: 'Active Products', value: '8', icon: <Package size={24} />, color: 'primary', change: '+12.5%', isPositive: true },
              { title: 'Total Spent', value: '£2,450', icon: <DollarSign size={24} />, color: 'info', change: '+15.3%', isPositive: true },
              { title: 'Pending Invoices', value: '2', icon: <FileText size={24} />, color: 'warning', change: '-5.1%', isPositive: false },
              { title: 'Monthly Cost', value: '£864', icon: <TrendingUp size={24} />, color: 'success', change: '+8.2%', isPositive: true }
            ];
        
            const activeProducts = [
              { name: 'UCASS Gateway 16 Channel', status: 'Active', renewal: '2024-11-15', spent: '£300.00' },
              { name: 'UCASS Advance Policy', status: 'Trial', renewal: '2024-11-20', spent: '£0.00' },
              { name: 'UCASS SLA', status: 'Active', renewal: '2024-11-10', spent: '£420.00' },
              // { name: 'UCASS Basic', status: 'Active', renewal: '2024-11-25', spent: '£144.00' }
            ];
        
            const spendingData = [
              { month: 'Jun', spent: 180 },
              { month: 'Jul', spent: 220 },
              { month: 'Aug', spent: 280 },
              { month: 'Sep', spent: 350 },
              { month: 'Oct', spent: 420 }
            ];
        
            const SpendingChart = () => (
              <ResponsiveContainer width="100%" height={354}>
                <BarChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `£${value}`} />
                  <Bar dataKey="spent" fill="#0d6efd" name="Spending" />
                </BarChart>
              </ResponsiveContainer>
            );
        
            return (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 className="mb-1">Welcome back, John!</h2>
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
                            <div className={`bg-${card.color} bg-opacity-10 rounded p-3`}>
                              <div className={`text-${card.color}`}>{card.icon}</div>
                            </div>
                            <Badge bg={card.isPositive ? 'success' : 'danger'} className="bg-opacity-10">
                              {card.isPositive ? <ArrowUp size={12} className="me-1" /> : <ArrowDown size={12} className="me-1" />}
                              <span className={`text-${card.isPositive ? 'success' : 'danger'}`}>{card.change}</span>
                            </Badge>
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
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <h5 className="mb-0">Spending Overview</h5>
                          <Form.Select size="sm" style={{ width: '150px' }}>
                            <option>Last 6 months</option>
                            <option>Last 12 months</option>
                            <option>This year</option>
                          </Form.Select>
                        </div>
                        <SpendingChart />
                      </Card.Body>
                    </Card>
                  </Col>
        
                  {/* Active Products */}
                  <Col lg={4} className="mb-4">
                    <Card>
                      <Card.Body>
                        <h5 className="mb-4">Active Products</h5>
                        {activeProducts.map((product, index) => (
                          <div key={index} className="mb-4 pb-4 border-bottom">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">{product.name}</h6>
                                <small className="text-muted">Renewal: {product.renewal}</small>
                              </div>
                              <Badge bg={product.status === 'Active' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                                {product.status}
                              </Badge>
                            </div>
                            <div className="text-muted small">Spent: <span className="fw-semibold">{product.spent}</span></div>
                          </div>
                        ))}
                        <Button variant="outline-primary" size="sm" className="w-100" onClick={() => window.location.href = '/accounting/customer/product-details'}>
                          View All Products
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            );
          };


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Customer Dashboard"
        showSearch={false}
      /> */}

      {renderDashboard()}

    </React.Fragment>
  );
};

CustomerDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerDashboard;
