
import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, ProgressBar } from 'react-bootstrap';
import { 
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Package,
  BarChart3,
  FileText,
  TrendingUp,
  DollarSign,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import "@assets/scss/billing.scss";
import { Modal } from 'react-bootstrap';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
  } from 'recharts';



  const RevenueTrendsChart = () => {
    const data = [
      { name: 'Jan', revenue: 4000, commission: 600 },
      { name: 'Feb', revenue: 3000, commission: 450 },
      { name: 'Mar', revenue: 5000, commission: 750 },
      { name: 'Apr', revenue: 4500, commission: 675 },
      { name: 'May', revenue: 6000, commission: 900 },
      { name: 'Jun', revenue: 5500, commission: 825 },
      { name: 'Jul', revenue: 7000, commission: 1050 },
      { name: 'Aug', revenue: 6500, commission: 975 },
      { name: 'Sep', revenue: 8000, commission: 1200 },
      { name: 'Oct', revenue: 7500, commission: 1125 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            formatter={(value) => `£${value}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#0d6efd" 
            strokeWidth={2}
            name="Revenue"
          />
          <Line 
            type="monotone" 
            dataKey="commission" 
            stroke="#198754" 
            strokeWidth={2}
            name="Commission"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const SalesByCategoryChart = () => {
    const data = [
      { name: 'RingEX Premium', value: 7245, color: '#0d6efd' },
      { name: 'RingEX Basic', value: 3650, color: '#198754' },
      { name: 'RingEX Enterprise', value: 9800, color: '#ffc107' },
      { name: 'Add-ons', value: 2450, color: '#dc3545' }
    ];
    const renderLabel = (entry: any) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(0);
        return `${entry.name}: ${percent}%`;
      };
  
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `£${value}`} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const SalesCommissionBarChart = () => {
    const data = [
      { month: 'Jan', sales: 12450, commission: 1867 },
      { month: 'Feb', sales: 10200, commission: 1530 },
      { month: 'Mar', sales: 15600, commission: 2340 },
      { month: 'Apr', sales: 13800, commission: 2070 },
      { month: 'May', sales: 16200, commission: 2430 },
      { month: 'Jun', sales: 14500, commission: 2175 },
      { month: 'Jul', sales: 18900, commission: 2835 },
      { month: 'Aug', sales: 17200, commission: 2580 },
      { month: 'Sep', sales: 19800, commission: 2970 },
      { month: 'Oct', sales: 21500, commission: 3225 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
            formatter={(value) => `£${value}`}
          />
          <Legend />
          <Bar dataKey="sales" fill="#0d6efd" name="Sales" />
          <Bar dataKey="commission" fill="#198754" name="Commission" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const ProductPerformanceChart = () => {
    const data = [
      { name: 'Premium', value: 45 },
      { name: 'Essentials', value: 30 },
      { name: 'Enterprise', value: 15 },
      { name: 'Add-ons', value: 10 }
    ];
    const renderLabel = (entry: any) => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(0);
        return `${entry.name}: ${percent}%`;
      };
    const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545'];
  
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            label={renderLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const CustomerGrowthChart = () => {
    const data = [
      { month: 'Jan', customers: 150 },
      { month: 'Feb', customers: 180 },
      { month: 'Mar', customers: 210 },
      { month: 'Apr', customers: 245 },
      { month: 'May', customers: 268 },
      { month: 'Jun', customers: 285 },
      { month: 'Jul', customers: 298 },
      { month: 'Aug', customers: 310 },
      { month: 'Sep', customers: 318 },
      { month: 'Oct', customers: 324 }
    ];
  
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="customers" 
            stroke="#198754" 
            strokeWidth={3}
            name="Total Customers"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

const ResellerPortal = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceFormData, setInvoiceFormData] = useState({
    customer: '',
    customerEmail: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    notes: '',
    terms: ''
  });
  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'customers', title: 'Customer Management', icon: <Users size={18} /> },
    { id: 'sales', title: 'Sales & Orders', icon: <ShoppingCart size={18} /> },
    { id: 'commission', title: 'Commission & Payouts', icon: <Wallet size={18} /> },
    { id: 'products', title: 'Products & Pricing', icon: <Package size={18} /> },
    { id: 'reports', title: 'Reports & Analytics', icon: <BarChart3 size={18} /> },
    { id: 'invoicing', title: 'Invoicing & Billing', icon: <FileText size={18} /> }
  ];

  // Dashboard Screen
  const renderDashboard = () => {
    const kpiData = [
      { title: 'Total Revenue', value: '£45,890', change: '+12.5%', isPositive: true, icon: <DollarSign size={24} />, color: 'primary' },
      { title: 'Active Customers', value: '324', change: '+8.2%', isPositive: true, icon: <Users size={24} />, color: 'success' },
      { title: 'Commission Earned', value: '£8,450', change: '+15.3%', isPositive: true, icon: <Wallet size={24} />, color: 'info' },
      { title: 'Pending Orders', value: '28', change: '-5.1%', isPositive: false, icon: <ShoppingCart size={24} />, color: 'warning' }
    ];

    const recentTransactions = [
      { id: 'TXN-001', customer: 'Acme Corp', product: 'RingEX Premium', amount: '£49.99', status: 'Completed', date: '2024-10-14' },
      { id: 'TXN-002', customer: 'Tech Solutions', product: 'RingEX Essentials', amount: '£17.99', status: 'Pending', date: '2024-10-14' },
      { id: 'TXN-003', customer: 'Global Inc', product: 'RingEX Enterprise', amount: '£99.99', status: 'Completed', date: '2024-10-13' },
      { id: 'TXN-004', customer: 'StartUp Ltd', product: 'RingEX Essentials', amount: '£17.99', status: 'Completed', date: '2024-10-13' },
      { id: 'TXN-005', customer: 'Enterprise Co', product: 'RingEX Premium', amount: '£49.99', status: 'Failed', date: '2024-10-12' }
    ];

    const topProducts = [
      { name: 'RingEX Premium', sales: 145, revenue: '£7,245', percentage: 65 },
      { name: 'RingEX Essentials', sales: 98, revenue: '£1,762', percentage: 45 },
      { name: 'RingEX Enterprise', sales: 56, revenue: '£5,599', percentage: 35 },
      { name: 'Add-on Storage', sales: 78, revenue: '£779', percentage: 25 }
    ];

    

    return (
      <div>
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Dashboard Overview</h2>
            <p className="text-muted mb-0">Welcome back! Here's what's happening with your reseller account.</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export Report
          </Button>
        </div>

        {/* KPI Cards */}
        <Row className="mb-4">
          {kpiData.map((kpi, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <Card>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`bg-${kpi.color} bg-opacity-10 rounded p-3`}>
                      <div className={`text-${kpi.color}`}>{kpi.icon}</div>
                    </div>
                    <Badge bg={kpi.isPositive ? 'success' : 'danger'} className="bg-opacity-10">
                      {kpi.isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      {kpi.change}
                    </Badge>
                  </div>
                  <h3 className="mb-1">{kpi.value}</h3>
                  <p className="text-muted mb-0 small">{kpi.title}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row>
          {/* Revenue Chart */}
          <Col lg={8} className="mb-4">
            <Card style={{ minHeight: '445px' }}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Revenue Trends</h5>
                  <Form.Select size="sm" style={{ width: '150px' }}>
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 3 months</option>
                    <option>Last year</option>
                  </Form.Select>
                </div>
                <div className="bg-light rounded p-4" style={{ height: '300px' }}>
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    {/* <div className="text-center">
                      <TrendingUp size={48} className="mb-3" />
                      <p className="mb-0">Revenue chart visualization</p>
                      <small>(Integrate with Recharts for actual charts)</small>
                    </div> */}
                    <RevenueTrendsChart />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Top Products */}
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Products</h5>
                {/* {topProducts.map((product, index) => (
                  <div key={index} className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small fw-semibold">{product.name}</span>
                      <span className="small text-muted">{product.sales} sales</span>
                    </div>
                    <ProgressBar now={product.percentage} className="mb-1" style={{ height: '6px' }} />
                    <div className="text-end">
                      <small className="text-muted">{product.revenue}</small>
                    </div>
                  </div>
                ))} */}
                <SalesByCategoryChart/>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Transactions */}
        <Card>
          <Card.Body>
            <h5 className="mb-4">Recent Transactions</h5>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="fw-semibold">{txn.id}</td>
                    <td>{txn.customer}</td>
                    <td>{txn.product}</td>
                    <td className="fw-semibold">{txn.amount}</td>
                    <td>
                      <Badge bg={
                        txn.status === 'Completed' ? 'success' : 
                        txn.status === 'Pending' ? 'warning' : 'danger'
                      } className="bg-opacity-10 text-dark">
                        {txn.status}
                      </Badge>
                    </td>
                    <td>{txn.date}</td>
                    <td>
                      <Button variant="link" size="sm" className="p-1">
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Customer Management Screen
  const renderCustomers = () => {
    const customers = [
      { id: 1, name: 'Acme Corp', email: 'contact@acme.com', products: 3, totalSpent: '£450.00', status: 'Active', joined: '2024-01-15' },
      { id: 2, name: 'Tech Solutions', email: 'info@techsol.com', products: 2, totalSpent: '£280.00', status: 'Active', joined: '2024-02-20' },
      { id: 3, name: 'Global Inc', email: 'hello@global.com', products: 5, totalSpent: '£890.00', status: 'Active', joined: '2024-03-10' },
      { id: 4, name: 'StartUp Ltd', email: 'team@startup.com', products: 1, totalSpent: '£120.00', status: 'Inactive', joined: '2024-04-05' },
      { id: 5, name: 'Enterprise Co', email: 'sales@enterprise.com', products: 8, totalSpent: '£1,450.00', status: 'Active', joined: '2024-05-12' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Customer Management</h2>
            <p className="text-muted mb-0">Manage all your customers in one place</p>
          </div>
          <Button variant="primary">
            <UserPlus size={16} className="me-2" />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <Row className="mb-4">
          <Col md={3} className="mb-3 ">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <h3 className="text-primary mb-1">324</h3>
                <p className="text-muted mb-0 small">Total Customers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <h3 className="text-success mb-1">298</h3>
                <p className="text-muted mb-0 small">Active Customers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <h3 className="text-warning mb-1">26</h3>
                <p className="text-muted mb-0 small">Inactive Customers</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='customer-management-card p-3'>
              <Card.Body>
                <h3 className="text-info mb-1">£45,890</h3>
                <p className="text-muted mb-0 small">Total Revenue</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <Form.Control type="search" placeholder="Search customers..." />
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} className="me-2" />
                  Filter
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Customers Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Customer Name</th>
                  <th>Email</th>
                  <th>Products</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="fw-semibold">{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.products}</td>
                    <td className="fw-semibold">{customer.totalSpent}</td>
                    <td>
                      <Badge bg={customer.status === 'Active' ? 'success' : 'secondary'} className="bg-opacity-10 text-dark">
                        {customer.status}
                      </Badge>
                    </td>
                    <td>{customer.joined}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-danger">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Sales & Orders Screen
  const renderSales = () => {
    const orders = [
      { id: 'ORD-001', customer: 'Acme Corp', product: 'RingEX Premium', quantity: 2, amount: '£99.98', status: 'Completed', date: '2024-10-14' },
      { id: 'ORD-002', customer: 'Tech Solutions', product: 'RingEX Essentials', quantity: 1, amount: '£17.99', status: 'Processing', date: '2024-10-14' },
      { id: 'ORD-003', customer: 'Global Inc', product: 'RingEX Enterprise', quantity: 3, amount: '£299.97', status: 'Completed', date: '2024-10-13' },
      { id: 'ORD-004', customer: 'StartUp Ltd', product: 'RingEX Essentials', quantity: 1, amount: '£17.99', status: 'Cancelled', date: '2024-10-13' },
      { id: 'ORD-005', customer: 'Enterprise Co', product: 'RingEX Premium', quantity: 5, amount: '£249.95', status: 'Completed', date: '2024-10-12' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Sales & Orders</h2>
            <p className="text-muted mb-0">Track and manage all your orders</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export Orders
          </Button>
        </div>

        {/* Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">458</h3>
                    <p className="text-muted mb-0 small">Total Orders</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-2">
                    <ShoppingCart className="text-primary" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">£45,890</h3>
                    <p className="text-muted mb-0 small">Total Sales</p>
                  </div>
                  <div className="bg-success bg-opacity-10 rounded p-2">
                    <DollarSign className="text-success" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">28</h3>
                    <p className="text-muted mb-0 small">Pending Orders</p>
                  </div>
                  <div className="bg-warning bg-opacity-10 rounded p-2">
                    <Calendar className="text-warning" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h3 className="mb-1">£100.25</h3>
                    <p className="text-muted mb-0 small">Avg Order Value</p>
                  </div>
                  <div className="bg-info bg-opacity-10 rounded p-2">
                    <TrendingUp className="text-info" size={20} />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search orders..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Completed</option>
                  <option>Processing</option>
                  <option>Cancelled</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control type="date" />
              </Col>
              <Col md={2}>
                <Form.Control type="date" />
              </Col>
              <Col md={2}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} className="me-2" />
                  Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Orders Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-semibold">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td className="fw-semibold">{order.amount}</td>
                    <td>
                      <Badge bg={
                        order.status === 'Completed' ? 'success' : 
                        order.status === 'Processing' ? 'warning' : 'danger'
                      } className="bg-opacity-10 text-dark">
                        {order.status}
                      </Badge>
                    </td>
                    <td>{order.date}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Commission & Payouts Screen
  const renderCommission = () => {
    const payouts = [
      { id: 'PAY-001', period: 'September 2024', sales: '£12,450', commission: '£1,867.50', rate: '15%', status: 'Paid', date: '2024-10-01' },
      { id: 'PAY-002', period: 'August 2024', sales: '£10,200', commission: '£1,530.00', rate: '15%', status: 'Paid', date: '2024-09-01' },
      { id: 'PAY-003', period: 'July 2024', sales: '£15,600', commission: '£2,340.00', rate: '15%', status: 'Paid', date: '2024-08-01' },
      { id: 'PAY-004', period: 'October 2024', sales: '£8,900', commission: '£1,335.00', rate: '15%', status: 'Pending', date: '2024-11-01' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Commission & Payouts</h2>
            <p className="text-muted mb-0">Track your earnings and payout history</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Download Statement
          </Button>
        </div>

        {/* Commission Overview */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-primary border-4 p-3">
              <Card.Body>
                <h3 className="text-primary mb-1">£8,450.00</h3>
                <p className="text-muted mb-0 small">Total Earned</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-success border-4 p-3">
              <Card.Body>
                <h3 className="text-success mb-1">£7,115.00</h3>
                <p className="text-muted mb-0 small">Total Paid</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-warning border-4 p-3">
              <Card.Body>
                <h3 className="text-warning mb-1">£1,335.00</h3>
                <p className="text-muted mb-0 small">Pending Payout</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="border-start border-info border-4 p-3">
              <Card.Body>
                <h3 className="text-info mb-1">15%</h3>
                <p className="text-muted mb-0 small">Commission Rate</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Commission Structure */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Commission Structure</h5>
                <Table>
                  <thead>
                    <tr>
                      <th>Sales Tier</th>
                      <th>Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>£0 - £10,000</td>
                      <td className="fw-semibold">10%</td>
                    </tr>
                    <tr>
                      <td>£10,001 - £25,000</td>
                      <td className="fw-semibold">15%</td>
                    </tr>
                    <tr className="table-primary">
                      <td>£25,001 - £50,000</td>
                      <td className="fw-semibold">20%</td>
                    </tr>
                    <tr>
                      <td>£50,001+</td>
                      <td className="fw-semibold">25%</td>
                    </tr>
                  </tbody>
                </Table>
                <div className="alert alert-info mb-0 mt-3">
                  <small>Current tier: £10,001 - £25,000 (15% commission)</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card style={{ minHeight: '385px' }}>
              <Card.Body>
                <h5 className="mb-4">Payment Method</h5>
                <div className="mb-3">
                  <p className="text-muted small mb-1">Bank Account</p>
                  <p className="fw-semibold">******* 1234</p>
                </div>
                <div className="mb-3">
                  <p className="text-muted small mb-1">Account Holder</p>
                  <p className="fw-semibold">Reseller Business Ltd</p>
                </div>
                <div className="mb-3">
                  <p className="text-muted small mb-1">Payout Schedule</p>
                  <p className="fw-semibold">Monthly (1st of every month)</p>
                </div>
                <Button variant="outline-primary" size="sm">Update Payment Details</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Payout History */}
        <Card>
          <Card.Body>
            <h5 className="mb-4">Payout History</h5>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Payout ID</th>
                  <th>Period</th>
                  <th>Total Sales</th>
                  <th>Commission</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th>Payout Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="fw-semibold">{payout.id}</td>
                    <td>{payout.period}</td>
                    <td>{payout.sales}</td>
                    <td className="fw-semibold text-success">{payout.commission}</td>
                    <td>{payout.rate}</td>
                    <td>
                      <Badge bg={payout.status === 'Paid' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                        {payout.status}
                      </Badge>
                    </td>
                    <td>{payout.date}</td>
                    <td>
                      <Button variant="link" size="sm" className="p-1">
                        <Download size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Products & Pricing Screen
  const renderProducts = () => {
    const products = [
      { id: 1, name: 'RingEX Essentials', category: 'Communication', cost: '£12.00', price: '£17.99', margin: '33%', stock: 'Unlimited', status: 'Active' },
      { id: 2, name: 'RingEX Premium', category: 'Communication', cost: '£35.00', price: '£49.99', margin: '30%', stock: 'Unlimited', status: 'Active' },
      { id: 3, name: 'RingEX Enterprise', category: 'Communication', cost: '£70.00', price: '£99.99', margin: '30%', stock: 'Unlimited', status: 'Active' },
      { id: 4, name: 'Add-on Storage', category: 'Add-ons', cost: '£6.00', price: '£9.99', margin: '40%', stock: 'Unlimited', status: 'Active' },
      { id: 5, name: 'RingEX Analytics', category: 'Add-ons', cost: '£18.00', price: '£24.99', margin: '28%', stock: 'Limited', status: 'Low Stock' }
    ];

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Products & Pricing</h2>
            <p className="text-muted mb-0">Manage your product catalog and pricing</p>
          </div>
          <Button variant="primary">
            <Package size={16} className="me-2" />
            Request New Product
          </Button>
        </div>

        {/* Product Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="mb-1">24</h3>
                <p className="text-muted mb-0 small">Total Products</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-success mb-1">20</h3>
                <p className="text-muted mb-0 small">Active Products</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-warning mb-1">4</h3>
                <p className="text-muted mb-0 small">Low Stock</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-info mb-1">32%</h3>
                <p className="text-muted mb-0 small">Avg Margin</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={5}>
                <Form.Control type="search" placeholder="Search products..." />
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Communication</option>
                  <option>Add-ons</option>
                  <option>Enterprise</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Low Stock</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} className="me-2" />
                  Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Products Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Your Cost</th>
                  <th>Selling Price</th>
                  <th>Margin</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.cost}</td>
                    <td className="fw-semibold">{product.price}</td>
                    <td>
                      <Badge bg="success" className="bg-opacity-10 text-dark">
                        {product.margin}
                      </Badge>
                    </td>
                    <td>{product.stock}</td>
                    <td>
                      <Badge bg={product.status === 'Active' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                        {product.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1">
                          <Edit size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Pricing Calculator */}
        <Card className="mt-4">
          <Card.Body>
            <h5 className="mb-4">Margin Calculator</h5>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Your Cost Price</Form.Label>
                  <Form.Control type="number" placeholder="0.00" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Price</Form.Label>
                  <Form.Control type="number" placeholder="0.00" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Your Margin</Form.Label>
                  <Form.Control type="text" placeholder="0%" disabled />
                </Form.Group>
              </Col>
            </Row>
            <Button variant="primary">Calculate</Button>
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Reports & Analytics Screen
  const renderReports = () => {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Reports & Analytics</h2>
            <p className="text-muted mb-0">Detailed insights and performance reports</p>
          </div>
          <Button variant="primary">
            <Download size={16} className="me-2" />
            Export All Reports
          </Button>
        </div>

        {/* Date Range Selector */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Label>Report Type</Form.Label>
                <Form.Select>
                  <option>Sales Report</option>
                  <option>Commission Report</option>
                  <option>Customer Report</option>
                  <option>Product Performance</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label>From Date</Form.Label>
                <Form.Control type="date" />
              </Col>
              <Col md={3}>
                <Form.Label>To Date</Form.Label>
                <Form.Control type="date" />
              </Col>
              <Col md={3}>
                <Form.Label>&nbsp;</Form.Label>
                <Button variant="primary" className="w-100">Generate Report</Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Performance Metrics */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Sales Growth</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 12.5%
                  </Badge>
                </div>
                <h3 className="mb-0">£45,890</h3>
                <small className="text-muted">vs last period</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Customer Growth</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 8.2%
                  </Badge>
                </div>
                <h3 className="mb-0">324</h3>
                <small className="text-muted">Total customers</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Avg Order Value</h6>
                  <Badge bg="success" className="bg-opacity-10">
                    <ArrowUp size={12} /> 5.3%
                  </Badge>
                </div>
                <h3 className="mb-0">£100.25</h3>
                <small className="text-muted">Per transaction</small>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="text-muted mb-0">Conversion Rate</h6>
                  <Badge bg="danger" className="bg-opacity-10">
                    <ArrowDown size={12} /> 2.1%
                  </Badge>
                </div>
                <h3 className="mb-0">24.8%</h3>
                <small className="text-muted">Lead to sale</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Sales vs Commission Trend</h5>
                <div className="bg-light rounded p-4" style={{ height: '350px' }}>
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    {/* <div className="text-center">
                      <BarChart3 size={48} className="mb-3" />
                      <p className="mb-0">Line/Bar chart visualization</p>
                      <small>(Integrate with Recharts library)</small>
                    </div> */}
                    <SalesCommissionBarChart/>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Sales by Category</h5>
                <div className="bg-light rounded p-4" style={{ height: '350px' }}>
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    {/* <div className="text-center">
                      <BarChart3 size={48} className="mb-3" />
                      <p className="mb-0">Pie chart</p>
                      <small>(Recharts)</small>
                    </div> */}
                    <ProductPerformanceChart/>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Top Performers */}
        <Row>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Selling Products</h5>
                <Table hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Product</th>
                      <th>Sales</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>RingEX Premium</td>
                      <td>145</td>
                      <td className="fw-semibold">£7,245</td>
                    </tr>
                    <tr>
                      <td>RingEX Enterprise</td>
                      <td>98</td>
                      <td className="fw-semibold">£9,800</td>
                    </tr>
                    <tr>
                      <td>RingEX Essentials</td>
                      <td>203</td>
                      <td className="fw-semibold">£3,650</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Top Customers</h5>
                <Table hover>
                  <thead className="bg-light">
                    <tr>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Enterprise Co</td>
                      <td>12</td>
                      <td className="fw-semibold">£1,450</td>
                    </tr>
                    <tr>
                      <td>Global Inc</td>
                      <td>8</td>
                      <td className="fw-semibold">£890</td>
                    </tr>
                    <tr>
                      <td>Acme Corp</td>
                      <td>6</td>
                      <td className="fw-semibold">£450</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Invoicing & Billing Screen
  const renderInvoicing = () => {
    const invoices = [
      { id: 'INV-001', customer: 'Acme Corp', amount: '£450.00', issued: '2024-10-01', due: '2024-10-15', status: 'Paid' },
      { id: 'INV-002', customer: 'Tech Solutions', amount: '£280.00', issued: '2024-10-05', due: '2024-10-19', status: 'Pending' },
      { id: 'INV-003', customer: 'Global Inc', amount: '£890.00', issued: '2024-09-28', due: '2024-10-12', status: 'Overdue' },
      { id: 'INV-004', customer: 'StartUp Ltd', amount: '£120.00', issued: '2024-10-08', due: '2024-10-22', status: 'Draft' },
      { id: 'INV-005', customer: 'Enterprise Co', amount: '£1,450.00', issued: '2024-09-25', due: '2024-10-09', status: 'Paid' }
    ];

    const handleInvoiceInputChange = (field: string, value: any) => {
        setInvoiceFormData(prev => ({
          ...prev,
          [field]: value
        }));
      };
      
      const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...invoiceFormData.items];
        newItems[index] = {
          ...newItems[index],
          [field]: value
        };
        
        // Calculate amount automatically
        if (field === 'quantity' || field === 'rate') {
          newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }
        
        setInvoiceFormData(prev => ({
          ...prev,
          items: newItems
        }));
      };
      
      const addInvoiceItem = () => {
        setInvoiceFormData(prev => ({
          ...prev,
          items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
        }));
      };
      
      const removeInvoiceItem = (index: number) => {
        if (invoiceFormData.items.length > 1) {
          setInvoiceFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
          }));
        }
      };
      
      const calculateInvoiceTotal = () => {
        return invoiceFormData.items.reduce((sum, item) => sum + item.amount, 0);
      };
      
      const handleGenerateInvoice = () => {
        setShowInvoiceModal(true);
      };
      
      const handleSaveInvoice = () => {
        // Here you would typically send data to your backend
        console.log('Invoice Data:', invoiceFormData);
        alert('Invoice generated successfully!');
        setShowInvoiceModal(false);
        // Reset form
        setInvoiceFormData({
          customer: '',
          customerEmail: '',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
          notes: '',
          terms: ''
        });
      };
      
      // Invoice Creation Modal Component
      const InvoiceCreationModal = () => {
        const subtotal = calculateInvoiceTotal();
        const tax = subtotal * 0.2; // 20% VAT
        const total = subtotal + tax;
      
        return (
          <Modal 
            show={showInvoiceModal} 
            onHide={() => setShowInvoiceModal(false)}
            size="xl"
            centered
          >
            <Modal.Header closeButton className="border-bottom">
              <Modal.Title>Create New Invoice</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row>
                {/* Left Column - Invoice Details */}
                <Col lg={12}>
                  <Card className="mb-4">
                    <Card.Body>
                      <h5 className="mb-4">Customer Information</h5>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Customer Name *</Form.Label>
                            <Form.Select
                              value={invoiceFormData.customer}
                              onChange={(e) => handleInvoiceInputChange('customer', e.target.value)}
                            >
                              <option value="">Select customer...</option>
                              <option value="Acme Corp">Acme Corp</option>
                              <option value="Tech Solutions">Tech Solutions</option>
                              <option value="Global Inc">Global Inc</option>
                              <option value="StartUp Ltd">StartUp Ltd</option>
                              <option value="Enterprise Co">Enterprise Co</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Customer Email *</Form.Label>
                            <Form.Control
                              type="email"
                              placeholder="customer@example.com"
                              value={invoiceFormData.customerEmail}
                              onChange={(e) => handleInvoiceInputChange('customerEmail', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Invoice Date *</Form.Label>
                            <Form.Control
                              type="date"
                              value={invoiceFormData.invoiceDate}
                              onChange={(e) => handleInvoiceInputChange('invoiceDate', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Due Date *</Form.Label>
                            <Form.Control
                              type="date"
                              value={invoiceFormData.dueDate}
                              onChange={(e) => handleInvoiceInputChange('dueDate', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
      
                  <Card className="mb-4">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">Invoice Items</h5>
                        <Button variant="outline-primary" size="sm" onClick={addInvoiceItem}>
                          + Add Item
                        </Button>
                      </div>
      
                      <div className="table-responsive">
                        <Table>
                          <thead className="bg-light">
                            <tr>
                              <th style={{ width: '40%' }}>Description</th>
                              <th style={{ width: '15%' }}>Quantity</th>
                              <th style={{ width: '20%' }}>Rate (£)</th>
                              <th style={{ width: '20%' }}>Amount (£)</th>
                              <th style={{ width: '5%' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoiceFormData.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    placeholder="Item description"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.rate}
                                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    size="sm"
                                    type="text"
                                    value={item.amount.toFixed(2)}
                                    disabled
                                    className="bg-light"
                                  />
                                </td>
                                <td>
                                  {invoiceFormData.items.length > 1 && (
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="text-danger p-0"
                                      onClick={() => removeInvoiceItem(index)}
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
      
                  <Card>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Notes</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Additional notes for the customer..."
                              value={invoiceFormData.notes}
                              onChange={(e) => handleInvoiceInputChange('notes', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Terms & Conditions</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              placeholder="Payment terms and conditions..."
                              value={invoiceFormData.terms}
                              onChange={(e) => handleInvoiceInputChange('terms', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
      
                {/* Right Column - Invoice Summary */}
                <Col lg={12}>
                  <Card className="sticky-top" style={{ top: '20px' }}>
                    <Card.Body>
                      <h5 className="mb-4">Invoice Summary</h5>
                      
                      <div className="mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Invoice #</span>
                          <span className="fw-semibold">INV-{Math.floor(Math.random() * 10000)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Customer</span>
                          <span className="fw-semibold">{invoiceFormData.customer || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Due Date</span>
                          <span className="fw-semibold">{invoiceFormData.dueDate || '-'}</span>
                        </div>
                      </div>
      
                      <div className="mb-4">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Subtotal</span>
                          <span>£{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Tax (20%)</span>
                          <span>£{tax.toFixed(2)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Total</span>
                          <span className="fw-bold h5 text-primary mb-0">£{total.toFixed(2)}</span>
                        </div>
                      </div>
      
                      <div className="alert alert-info mb-3">
                        <small>
                          <strong>Note:</strong> All prices are in GBP. Invoice will be sent to customer's email.
                        </small>
                      </div>
      
                      <Button 
                        variant="primary" 
                        className="w-100 mb-2"
                        onClick={handleSaveInvoice}
                      
                        disabled={!invoiceFormData.customer || !invoiceFormData.dueDate}
                      >
                        <FileText size={16} className="me-2" />
                        Generate Invoice
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        className="w-100"
                        onClick={() => setShowInvoiceModal(false)}
                      >
                        Cancel
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Modal.Body>
          </Modal>
        );
      }

    return (
      <div>
        {InvoiceCreationModal()}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Invoicing & Billing</h2>
            <p className="text-muted mb-0">Create and manage customer invoices</p>
          </div>
          <Button variant="primary" onClick={handleGenerateInvoice}>
            <FileText size={16} className="me-2" />
            Create Invoice
          </Button>
        </div>

        {/* Invoice Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="mb-1">£3,190</h3>
                <p className="text-muted mb-0 small">Total Outstanding</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-success mb-1">£1,900</h3>
                <p className="text-muted mb-0 small">Paid This Month</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-warning mb-1">£280</h3>
                <p className="text-muted mb-0 small">Pending Payment</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className='p-3'>
              <Card.Body>
                <h3 className="text-danger mb-1">£890</h3>
                <p className="text-muted mb-0 small">Overdue</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search invoices..." />
              </Col>
              <Col md={3}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Paid</option>
                  <option>Pending</option>
                  <option>Overdue</option>
                  <option>Draft</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Control type="date" placeholder="From" />
              </Col>
              <Col md={2}>
                <Form.Control type="date" placeholder="To" />
              </Col>
              <Col md={1}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} />
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Invoices Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="fw-semibold">{invoice.id}</td>
                    <td>{invoice.customer}</td>
                    <td className="fw-semibold">{invoice.amount}</td>
                    <td>{invoice.issued}</td>
                    <td>{invoice.due}</td>
                    <td>
                      <Badge bg={
                        invoice.status === 'Paid' ? 'success' : 
                        invoice.status === 'Pending' ? 'warning' :
                        invoice.status === 'Overdue' ? 'danger' : 'secondary'
                      } className="bg-opacity-10 text-dark">
                        {invoice.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1" title="View">
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1" title="Edit">
                          <Edit size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1" title="Download">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Quick Actions */}
        {/* <Row className="mt-4">
          <Col md={6}>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Quick Invoice Generator</h5>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Customer</Form.Label>
                    <Form.Select>
                      <option>Choose customer...</option>
                      <option>Acme Corp</option>
                      <option>Tech Solutions</option>
                      <option>Global Inc</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Amount</Form.Label>
                    <Form.Control type="number" placeholder="0.00" />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Due Date</Form.Label>
                    <Form.Control type="date" />
                  </Form.Group>
                  <Button variant="primary">Generate Invoice</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Invoice Templates</h5>
                <div className="d-flex flex-column gap-2">
                  <Button variant="outline-primary">Standard Invoice Template</Button>
                  <Button variant="outline-primary">Detailed Invoice Template</Button>
                  <Button variant="outline-primary">Simple Receipt Template</Button>
                  <Button variant="outline-secondary">Manage Templates</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row> */}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeScreen) {
      case 'dashboard': return renderDashboard();
      case 'customers': return renderCustomers();
      case 'sales': return renderSales();
      case 'commission': return renderCommission();
      case 'products': return renderProducts();
      case 'reports': return renderReports();
      case 'invoicing': return renderInvoicing();
      default: return renderDashboard();
    }
  };

  return (
    <div className="container-fluid p-0">
      <Row className="g-0">
        {/* Mobile Toggle Button */}
        <Button
          variant="primary"
          className="position-fixed d-lg-none rounded-circle"
          style={{
            top: '20px',
            right: '20px',
            zIndex: 1100,
            width: '50px',
            height: '50px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </Button>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="position-fixed d-lg-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1040
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Col lg={2} className={`d-lg-block ${sidebarOpen ? 'd-block' : 'd-none'}`}>
          <Card 
            style={{ 
              minHeight: '100vh',
              height: '100%',
              position: 'fixed',
              width: '250px',
              borderRadius: '0',
              zIndex: 1050,
              overflowY: 'auto'
            }}
          >
            <Card.Body className="p-0">
              <div className="p-4 border-bottom">
                <h4 className="mb-0">Reseller Portal</h4>
              </div>
              <div className="list-group list-group-flush">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center border-0 ${
                      activeScreen === item.id ? 'active bg-primary text-white' : ''
                    }`}
                    onClick={() => {
                      setActiveScreen(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="me-2">{item.icon}</span>
                    <span className="">{item.title}</span>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={10} className="ms-auto">
          <div className="p-4">
            {renderContent()}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ResellerPortal;