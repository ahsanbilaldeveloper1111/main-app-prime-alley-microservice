
import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Table, Modal, Dropdown, ProgressBar} from 'react-bootstrap';
import { 
  Eye, 
  CreditCard, 
  Clock, 
  Wallet, 
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Phone,
  CheckCircle,


  Edit, 
  Trash2, 
  Filter, 
  Plus, 

  Settings,
  Download,
  Search,

  LayoutDashboard,
 
  Package,
  FileText,

  Bell,

  Check,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Star,
  
  TrendingDown,
  Calendar,
  Upload,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,

 
  PieChart,
  Pie,
  Cell

} from 'recharts';
import "@assets/scss/billing.scss";
import CompanyLogo from "@assets/images/ringedge-logo.png";
import CompanyLogo2 from "@assets/images/ringedge-logo-black-n-blue.png";
import TopBar from '@layout/Moduler/Topbar';


// interface ExpenseFormData {
//   category: string;
//   expenseDate: string;
//   description: string;
//   currency: string;
//   amount: string;
//   taxAmount: string;
//   taxType: string;
//   totalAmount: string;
//   receiptFiles: File[];
// }

interface BillingStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  key: string;
}

const BillingPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  const [billingFilter, setBillingFilter] = useState('All');
  const [billingSearch, setBillingSearch] = useState('');
  const [billingEntriesPerPage, setBillingEntriesPerPage] = useState(10);

  const [showProductModal, setShowProductModal] = useState(false);
const [showBillingEditModal, setShowBillingEditModal] = useState(false);
const [showColumnSelector, setShowColumnSelector] = useState(false);
const [visibleColumns, setVisibleColumns] = useState({
  productName: true,
  category: true,
  price: true,
  type: true,
  totalAmount: true,
  status: true,
  created: true,
  action: true
});
const [productFormData, setProductFormData] = useState({
  name: '',
  category: '',
  basePrice: '',
  type: '',
  status: 'Active',
  description: ''
});
const [billingInfo, setBillingInfo] = useState({
  name: 'Rizwan Haider',
  email: 'rizwan@ringedge.com',
  phone: '07831 505446',
  address: '',
  city: '',
  postcode: '',
  country: 'United Kingdom'
});

const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [expenseFormData, setExpenseFormData] = useState({
      category: '',
      expenseDate: '',
      description: '',
      currency: 'USD',
      amount: '',
      taxAmount: '',
      taxType: 'Amount',
      totalAmount: '',
      receiptFiles: []
    });
  
  const steps: BillingStep[] = [
    { id: 0, title: 'Customer Dashboard', icon: <LayoutDashboard size={18} />, key: 'overview' },
    { id: 1, title: 'Account overview', icon: <Eye size={18} />, key: 'overview' },
    { id: 2, title: 'Product details', icon: <CreditCard size={18} />, key: 'product' },
    { id: 3, title: 'Billing history', icon: <Clock size={18} />, key: 'history' },
    { id: 4, title: 'Payment method', icon: <Wallet size={18} />, key: 'payment' },
    { id: 5, title: 'Expenses & Reports', icon: <FileText size={18} />, key: 'expenses' } 
    // { id: 5, title: 'Purchase', icon: <ShoppingCart size={18} />, key: 'purchase' }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };
  const CustomerDashboard = () => {
    const [activeScreen, setActiveScreen] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
  
  
    // Dashboard Screen
  
      const summaryCards = [
        { title: 'Active Products', value: '8', icon: <Package size={24} />, color: 'primary', change: '+2 this month' },
        { title: 'Total Orders', value: '24', icon: <ShoppingCart size={24} />, color: 'success', change: '3 pending' },
        { title: 'Total Spent', value: '£2,450', icon: <DollarSign size={24} />, color: 'info', change: 'Lifetime' },
        { title: 'Pending Invoices', value: '2', icon: <FileText size={24} />, color: 'warning', change: '£450 due' }
      ];
  
      const recentOrders = [
        { id: 'ORD-2024-145', product: 'UCASS- Gateway 16 Channel', date: '2024-10-15', amount: '£300.00', status: 'Delivered' },
        { id: 'ORD-2024-144', product: 'UCASS- Advance Policy', date: '2024-10-10', amount: '£216.00', status: 'Processing' },
        { id: 'ORD-2024-143', product: 'UCASS-SLA', date: '2024-10-05', amount: '£420.00', status: 'Delivered' },
        { id: 'ORD-2024-142', product: 'UCASS-Basic', date: '2024-09-28', amount: '£144.00', status: 'Delivered' }
      ];
  
      const activeProducts = [
        { name: 'UCASS- Gateway 16 Channel', status: 'Active', renewal: '2024-11-15', spent: '£300.00' },
        { name: 'UCASS- Advance Policy', status: 'Trial', renewal: '2024-11-20', spent: '£0.00' },
        { name: 'UCASS-SLA', status: 'Active', renewal: '2024-11-10', spent: '£420.00' },
        { name: 'UCASS-Basic', status: 'Active', renewal: '2024-11-25', spent: '£144.00' }
      ];
  
      const SpendingChart = () => {
        const data = [
          { month: 'Jun', spent: 180 },
          { month: 'Jul', spent: 220 },
          { month: 'Aug', spent: 280 },
          { month: 'Sep', spent: 350 },
          { month: 'Oct', spent: 420 }
        ];
  
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value}`} />
              <Line type="monotone" dataKey="spent" stroke="#0d6efd" strokeWidth={2} name="Spending" />
            </LineChart>
          </ResponsiveContainer>
        );
      };
  
      return (
        <div className="p-4">
          {/* Welcome Section */}
          <div className="mb-4">
            <h2 className="mb-1">Welcome back, John!</h2>
            <p className="text-muted mb-0">Here's what's happening with your account today.</p>
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
                    </div>
                    <h3 className="mb-1">{card.value}</h3>
                    <p className="text-muted mb-0 small">{card.title}</p>
                    <small className="text-muted">{card.change}</small>
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
  
              {/* Recent Orders */}
              <Card className="mt-4">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Recent Orders</h5>
                    <Button variant="link" size="sm" onClick={() => setActiveScreen('orders')}>
                      View All
                    </Button>
                  </div>
                  <Table hover responsive>
                    <thead className="bg-light">
                      <tr>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="fw-semibold">{order.id}</td>
                          <td>{order.product}</td>
                          <td>{order.date}</td>
                          <td className="fw-semibold">{order.amount}</td>
                          <td>
                            <Badge bg={order.status === 'Delivered' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
  
            {/* Active Products & Quick Actions */}
            <Col lg={4} className="mb-4">
              <Card className="mb-4">
                <Card.Body>
                  <h5 className="mb-4">Active Products</h5>
                  {activeProducts.map((product, index) => (
                    <div key={index} className="mb-3 pb-3 border-bottom">
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
                  <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setActiveScreen('products')}>
                    View All Products
                  </Button>
                </Card.Body>
              </Card>
  
              {/* Quick Actions */}
              {/* <Card>
                <Card.Body>
                  <h5 className="mb-4">Quick Actions</h5>
                  <div className="d-grid gap-2">
                    <Button variant="primary">
                      <ShoppingCart size={16} className="me-2" />
                      New Order
                    </Button>
                    <Button variant="outline-primary">
                      <FileText size={16} className="me-2" />
                      View Invoices
                    </Button>
                    <Button variant="outline-primary">
                      <CreditCard size={16} className="me-2" />
                      Manage Payments
                    </Button>
                    <Button variant="outline-primary">
                      <Download size={16} className="me-2" />
                      Download Reports
                    </Button>
                  </div>
                </Card.Body>
              </Card> */}
            </Col>
          </Row>
        </div>
      );
   
  
  };

  const renderAccountOverview = () => (
    <div>
      <Row className="mb-4">
        <Col lg={7}>
          <Card style={{ minHeight: '295px' }}>
            <Card.Body>
              <div className="d-inline-flex align-items-center justify-content-center mb-3">
              <img src={CompanyLogo2.src} alt="logo" className="img-fluid" />
              </div>
              <h5 className="fw-semibold mb-2">Ring Edge</h5>
              <div className="mb-3">
                <Badge bg="secondary" pill className="px-3 py-2 text-white fw-semibold me-2" style={{ fontSize: '0.85rem' }}>
                  Trial
                </Badge>
                <Badge bg="primary" pill className="px-3 py-2 fw-semibold text-white" style={{ fontSize: '0.85rem' }}>
                  Upgrade
                </Badge>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-end">
                <Button variant="link" className="text-decoration-none fw-semibold text-primary">
                  Manage subscription <ChevronRight size={16} />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5}>
          <Card>
            <Card.Body>
              <h6 className="text-muted mb-3">Target upgrade charges</h6>
              <h2 className="mb-1">£17.99</h2>
              <small className="text-muted">(Excludes taxes and fees)</small>
              <div className="mt-3">
                <small className="text-muted">Target upgrade date: 08/05/2025</small>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Account credit</span>
                <span>£0.00</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Pending credit</span>
                <span>£0.00</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Free service credit</span>
                <span>£0.00</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      <Row>
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards'>
            <Card.Body>
              <h6 className="text-muted mb-2">Billing cycle details</h6>
              <p className="mb-1"><small className="text-muted">Target billing plan</small></p>
              <p className="fw-semibold">Monthly</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards'>
            <Card.Body>
              <h6 className="text-muted mb-2">Primary payment method</h6>
              <p className="mb-1"><small className="text-muted">Credit card number</small></p>
              <p className="fw-semibold">•••• •••• •••• 4242</p>
              <p className="mb-0"><small className="text-muted">Expiration date: 12/25</small></p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards'>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="text-muted mb-0">Billing contact information</h6>
                <Button variant="link" size="sm" className="p-0" onClick={() => setShowBillingEditModal(true)}>
                  <Edit size={16} />
                </Button>
              </div>
              <p className="mb-1"><small className="text-muted">Name</small></p>
              <p className="fw-semibold">{billingInfo.name}</p>
              <p className="mb-1"><small className="text-muted">Email</small></p>
              <p className="fw-semibold mb-0">{billingInfo.email}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards'>
            <Card.Body>
              <h6 className="text-muted mb-2">Tax information</h6>
              <p className="mb-1"><small className="text-muted">VAT number</small></p>
              <p className="fw-semibold">Not specified</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
      {BillingEditModal()}
    </div>
  );
  
  const renderExpensesReports = () => {
    
    
    const expenses = [
      { id: 1, date: '2024-10-15', category: 'Software', description: 'UCASS Gateway License', amount: '£300.00', tax: '£60.00', total: '£360.00', status: 'Approved' },
      { id: 2, date: '2024-10-12', category: 'Subscription', description: 'Monthly Service Fee', amount: '£150.00', tax: '£30.00', total: '£180.00', status: 'Approved' },
      { id: 3, date: '2024-10-08', category: 'Hardware', description: 'Network Equipment', amount: '£450.00', tax: '£90.00', total: '£540.00', status: 'Pending' },
      { id: 4, date: '2024-10-05', category: 'Support', description: 'Technical Support Package', amount: '£200.00', tax: '£40.00', total: '£240.00', status: 'Approved' },
      { id: 5, date: '2024-09-28', category: 'Software', description: 'UCASS SLA Premium', amount: '£420.00', tax: '£84.00', total: '£504.00', status: 'Approved' }
    ];
  
    const summaryData = [
      { title: 'Total Expenses', value: '£1,824.00', change: '+12.5%', isPositive: true, icon: <DollarSign size={24} />, color: 'primary' },
      { title: 'This Month', value: '£1,080.00', change: '+8.3%', isPositive: true, icon: <Calendar size={24} />, color: 'success' },
      { title: 'Pending Approval', value: '£540.00', change: '1 expense', isPositive: false, icon: <FileText size={24} />, color: 'warning' },
      { title: 'Tax Paid', value: '£304.00', change: 'YTD', isPositive: false, icon: <TrendingUp size={24} />, color: 'info' }
    ];
  
    const categoryData = [
      { name: 'Software', value: 720, color: '#0d6efd' },
      { name: 'Subscription', value: 180, color: '#198754' },
      { name: 'Hardware', value: 540, color: '#ffc107' },
      { name: 'Support', value: 240, color: '#dc3545' }
    ];
  
    const monthlyData = [
      { month: 'Jun', amount: 890 },
      { month: 'Jul', amount: 1150 },
      { month: 'Aug', amount: 980 },
      { month: 'Sep', amount: 1320 },
      { month: 'Oct', amount: 1824 }
    ];
  
    const handleExpenseInputChange = (field: string, value: any) => {
      const updatedData = { ...expenseFormData, [field]: value };
  
      // Auto-calculate total amount
      if (field === 'amount' || field === 'taxAmount' || field === 'taxType') {
        const amount = parseFloat(updatedData.amount) || 0;
        const taxAmount = parseFloat(updatedData.taxAmount) || 0;
  
        let calculatedTax = 0;
        if (updatedData.taxType === 'Percentage') {
          calculatedTax = (amount * taxAmount) / 100;
        } else {
          calculatedTax = taxAmount;
        }
  
        updatedData.totalAmount = (amount + calculatedTax).toFixed(2);
      }
  
      setExpenseFormData(updatedData);
    };
  
    const handleFileUpload = (e: any) => {
      const files = Array.from(e.target.files) as File[];
      //setExpenseFormData({ ...expenseFormData, receiptFiles: files });
    };
  
    
    const handleRemoveFile = (index: number) => {
      const newFiles = expenseFormData.receiptFiles.filter((_, i) => i !== index);
      setExpenseFormData({ ...expenseFormData, receiptFiles: newFiles });
    };
  
    const handleAddExpense = () => {
      console.log('Expense Data:', expenseFormData);
      alert('Expense added successfully!');
      setShowAddExpenseModal(false);
      setExpenseFormData({
        category: '',
        expenseDate: '',
        description: '',
        currency: 'USD',
        amount: '',
        taxAmount: '',
        taxType: 'Amount',
        totalAmount: '',
        receiptFiles: []
      });
    };
  
    // Add Expense Modal
    const AddExpenseModal = () => (
      <Modal show={showAddExpenseModal} onHide={() => setShowAddExpenseModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">Please fill in the details below to create a new expense.</p>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={expenseFormData.category}
                    onChange={(e) => handleExpenseInputChange('category', e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="Software">Software</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Support">Support</option>
                    <option value="Training">Training</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expense Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={expenseFormData.expenseDate}
                    onChange={(e) => handleExpenseInputChange('expenseDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter expense description..."
                    value={expenseFormData.description}
                    onChange={(e) => handleExpenseInputChange('description', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency *</Form.Label>
                  <Form.Select
                    value={expenseFormData.currency}
                    onChange={(e) => handleExpenseInputChange('currency', e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={expenseFormData.amount}
                    onChange={(e) => handleExpenseInputChange('amount', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Amount</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={expenseFormData.taxAmount}
                    onChange={(e) => handleExpenseInputChange('taxAmount', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tax Type</Form.Label>
                  <Form.Select
                    value={expenseFormData.taxType}
                    onChange={(e) => handleExpenseInputChange('taxType', e.target.value)}
                  >
                    <option value="Amount">Amount</option>
                    <option value="Percentage">Percentage</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount</Form.Label>
                  <Form.Control
                    type="text"
                    value={expenseFormData.totalAmount}
                    disabled
                    className="bg-light fw-semibold"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Receipt Files</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                  />
                  <Form.Text className="text-muted">
                    Upload PDF, PNG, or JPEG files (max 10MB each)
                  </Form.Text>
                </Form.Group>
                
                {expenseFormData.receiptFiles.length > 0 && (
                  <div className="mt-2">
                    {expenseFormData.receiptFiles.map((file: any, index: number) => (
                      <div key={index} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                        <div className="d-flex align-items-center">
                          <FileText size={16} className="me-2 text-primary" />
                          <small>{file.name}</small>
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-danger"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddExpenseModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddExpense}
            disabled={!expenseFormData.category || !expenseFormData.expenseDate || !expenseFormData.amount}
          >
            Add Expense
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    const ExpenseCategoryChart = () => {
      const renderLabel = (entry: any) => {
        const total = categoryData.reduce((sum, item) => sum + item.value, 0);
        const percent = ((entry.value / total) * 100).toFixed(0);
        return `${percent}%`;
      };
  
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={renderLabel}
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `£${value}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    };
  
    const MonthlyExpenseChart = () => (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => `£${value}`} />
          <Bar dataKey="amount" fill="#0d6efd" name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    );
  
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Expenses & Reports</h2>
            <p className="text-muted mb-0">Track and manage your expenses</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-primary">
              <Download size={16} className="me-2" />
              Export Report
            </Button>
            <Button variant="primary" onClick={() => setShowAddExpenseModal(true)}>
              <Plus size={16} className="me-2" />
              Add Expense
            </Button>
          </div>
        </div>
  
        {/* Summary Cards */}
        <Row className="mb-4">
          {summaryData.map((item, index) => (
            <Col lg={3} md={6} key={index} className="mb-3">
              <Card style={{minHeight: '194px'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className={`bg-${item.color} bg-opacity-10 rounded p-3`}>
                      <div className={`text-${item.color}`}>{item.icon}</div>
                    </div>
                    {item.isPositive !== false && (
                      <Badge bg={item.isPositive ? 'success' : 'danger'} className="bg-opacity-10">
                        {item.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {item.change}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-1">{item.value}</h3>
                  <p className="text-muted mb-0 small">{item.title}</p>
                  {!item.isPositive && item.change && (
                    <small className="text-muted">{item.change}</small>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
  
        {/* Charts */}
        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Monthly Expenses</h5>
                  <Form.Select size="sm" style={{ width: '150px' }}>
                    <option>Last 6 months</option>
                    <option>Last 12 months</option>
                    <option>This year</option>
                  </Form.Select>
                </div>
                <MonthlyExpenseChart />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <h5 className="mb-4">Expenses by Category</h5>
                <ExpenseCategoryChart />
              </Card.Body>
            </Card>
          </Col>
        </Row>
  
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Control type="search" placeholder="Search expenses..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Software</option>
                  <option>Subscription</option>
                  <option>Hardware</option>
                  <option>Support</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
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
  
        {/* Expenses Table */}
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.date}</td>
                    <td>
                      <Badge bg="light" text="dark" className="fw-normal">
                        {expense.category}
                      </Badge>
                    </td>
                    <td>{expense.description}</td>
                    <td className="fw-semibold">{expense.amount}</td>
                    <td>{expense.tax}</td>
                    <td className="fw-semibold">{expense.total}</td>
                    <td>
                      <Badge bg={expense.status === 'Approved' ? 'success' : 'warning'} className="bg-opacity-10 text-dark">
                        {expense.status}
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
  
        {AddExpenseModal()}
      </div>
    );
  };


  const ColumnSelector = () => (
    <Dropdown show={showColumnSelector} onToggle={() => setShowColumnSelector(!showColumnSelector)}>
      <Dropdown.Toggle variant="outline-primary"
      className="w-100 d-flex align-items-center justify-content-center">
        <Settings size={16} className="me-1" />
        Columns
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <div className="px-3 py-2">
          <Form.Check
            type="checkbox"
            label="Product"
            checked={visibleColumns.productName}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, productName: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Category"
            checked={visibleColumns.category}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, category: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Price"
            checked={visibleColumns.price}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, price: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Type"
            checked={visibleColumns.type}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, type: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Total Amount"
            checked={visibleColumns.totalAmount}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, totalAmount: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Status"
            checked={visibleColumns.status}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, status: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Created"
            checked={visibleColumns.created}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, created: e.target.checked })}
            className="mb-2"
          />
          <Form.Check
            type="checkbox"
            label="Status"
            checked={visibleColumns.action}
            onChange={(e) => setVisibleColumns({ ...visibleColumns, action: e.target.checked })}
          />
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
  // Product Modal Component
const ProductModal = () => (
  <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
    <Modal.Header closeButton>
      <Modal.Title>Add New Product</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., UCASS- Gateway 16 Channel"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                value={productFormData.category}
                onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Gateway">Gateway</option>
                <option value="Policy">Policy</option>
                <option value="SLA">SLA</option>
                <option value="Basic Services">Basic Services</option>
                <option value="Advanced Services">Advanced Services</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Base Price *</Form.Label>
              <Form.Control
                type="number"
                placeholder="0.00"
                value={productFormData.basePrice}
                onChange={(e) => setProductFormData({ ...productFormData, basePrice: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Type *</Form.Label>
              <Form.Select
                value={productFormData.type}
                onChange={(e) => setProductFormData({ ...productFormData, type: e.target.value })}
              >
                <option value="">Select type</option>
                <option value="Monthly Subscription">Monthly Subscription</option>
                <option value="Annual Subscription">Annual Subscription</option>
                <option value="One-time Purchase">One-time Purchase</option>
                <option value="Pay-as-you-go">Pay-as-you-go</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Status *</Form.Label>
              <Form.Select
                value={productFormData.status}
                onChange={(e) => setProductFormData({ ...productFormData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Trial">Trial</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter product description..."
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={() => setShowProductModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => {
        console.log('Product Data:', productFormData);
        setShowProductModal(false);
        alert('Product added successfully!');
      }}>
        Add Product
      </Button>
    </Modal.Footer>
  </Modal>
);

  const renderProductDetails = () => {
    const products = [
      {
        id: 1,
        name: 'UCASS- Gateway 16 Channel',
        category: 'Gateway',
        price: '£300.00',
        type: 'Monthly Subscription',
        status: 'Active',
        created: '2024-10-15',
		action: 'enable'
      },
      {
        id: 2,
        name: 'UCASS- Advance Policy',
        category: 'Policy',
        price: '£216.00',
        type: 'Annual Subscription',
        status: 'Trial',
        created: '2024-10-20',
		action: 'enable'
      },
      {
        id: 3,
        name: 'UCASS-SLA',
        category: 'SLA',
        price: '£420.00',
        type: 'Monthly Subscription',
        status: 'Active',
        created: '2024-10-10',
		action: 'enable'
      },
      {
        id: 4,
        name: 'UCASS-Basic',
        category: 'Basic Services',
        price: '£144.00',
        type: 'One-time Purchase',
        status: 'Inactive',
        created: '2024-10-25',
		action: 'enable'
      },
    ];
    
  
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Product Details</h5>
          <Button variant="primary" size="sm" onClick={() => setShowProductModal(true)}>
            <Plus size={16} className="me-1" />
            Add New Product
          </Button>
        </div>
  
        {/* Stats */}
        <Row className="mb-4">
          <Col md={3} className="mb-3">
            <Card>
              <Card.Body>
                <h3 className="mb-1">24</h3>
                <p className="text-muted mb-0 small">Total Products</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card>
              <Card.Body>
                <h3 className="text-success mb-1">20</h3>
                <p className="text-muted mb-0 small">Active</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card>
              <Card.Body>
                <h3 className="text-warning mb-1">4</h3>
                <p className="text-muted mb-0 small">Trial</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card>
              <Card.Body>
                <h3 className="text-info mb-1">£1,080.00</h3>
                <p className="text-muted mb-0 small">Total Value</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
  
        {/* Filters */}
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Control type="search" placeholder="Search products..." />
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Categories</option>
                  <option>Gateway</option>
                  <option>Policy</option>
                  <option>SLA</option>
                  <option>Basic Services</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select>
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Trial</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="outline-primary" className="w-100">
                  <Filter size={16} className="me-2" />
                  Apply
                </Button>
              </Col>
              <Col md={2}>
                <ColumnSelector />
              </Col>
            </Row>
          </Card.Body>
        </Card>
  
        {/* Products Table */}
        <Card>
      <Card.Body>
        {/* <div className="d-flex justify-content-end mb-3">
          <ColumnSelector />
        </div> */}

        <Table responsive hover>
          <thead className="bg-light">
            <tr>
              {visibleColumns.productName && <th>Product Name</th>}
              {visibleColumns.category && <th>Category</th>}
              {visibleColumns.price && <th>Price</th>}
              {visibleColumns.type && <th>Type</th>}
              {visibleColumns.status && <th>Status</th>}
              {visibleColumns.created && <th>Created</th>}
              {visibleColumns.action && <th>ACTION</th>}
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {visibleColumns.productName && <td className="fw-semibold">{product.name}</td>}
                {visibleColumns.category && <td>{product.category}</td>}
                {visibleColumns.price && <td>{product.price}</td>}
                {visibleColumns.type && <td>{product.type}</td>}
                {visibleColumns.status && (
                  <td>
                    <Badge
                      bg={
                        product.status === 'Active'
                          ? 'success'
                          : product.status === 'Trial'
                          ? 'warning'
                          : 'secondary'
                      }
                      className="bg-opacity-10 text-dark"
                    >
                      {product.status}
                    </Badge>
                  </td>
                )}
                {visibleColumns.created && <td>{product.created}</td>}
                {visibleColumns.action && (
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
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>


  
        {ProductModal()}
      </div>
    );
  };
  

  // const renderBillingHistory = () => (
  //   <Card>
  //     <Card.Body>
  //       <h5 className="mb-4">Billing history</h5>
  //       <div className="table-responsive">
  //         <table className="table table-hover">
  //           <thead>
  //             <tr>
  //               <th>Date</th>
  //               <th>Due date</th>
  //               <th>Document #</th>
  //               <th>Payment method</th>
  //               <th>Status</th>
  //               <th>Amount</th>
  //               <th>Total amount due</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             <tr>
  //               <td className="text-center py-5 text-muted">
  //                 There is no transactions information yet
  //               </td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </div>
  //     </Card.Body>
  //   </Card>
  // );
  const renderBillingHistory = () => {
    const billingData = [
      { id: 1, invoice: 'INV-001', date: '5/5/2024', dueDate: '7/11/2024', amount: '£17.99', status: 'Paid', paymentMethod: 'Card ****4242' },
      { id: 2, invoice: 'INV-002', date: '7/6/2024', dueDate: '7/8/2024', amount: '£17.99', status: 'Cancelled', paymentMethod: 'Card ****4242' },
      { id: 3, invoice: 'INV-003', date: '05/01/2024', dueDate: '06/02/2024', amount: '£17.99', status: 'Unpaid', paymentMethod: 'Card ****4242' },
      { id: 4, invoice: 'INV-004', date: '5/5/2024', dueDate: '7/11/2024', amount: '£17.99', status: 'Paid', paymentMethod: 'Card ****4242' },
      { id: 5, invoice: 'INV-005', date: '7/6/2024', dueDate: '7/8/2024', amount: '£17.99', status: 'Cancelled', paymentMethod: 'Card ****4242' },
      { id: 6, invoice: 'INV-006', date: '05/01/2024', dueDate: '06/02/2024', amount: '£17.99', status: 'Unpaid', paymentMethod: 'Card ****4242' },
      { id: 7, invoice: 'INV-007', date: '5/5/2024', dueDate: '7/11/2024', amount: '£17.99', status: 'Paid', paymentMethod: 'Card ****4242' },
      { id: 8, invoice: 'INV-008', date: '7/6/2024', dueDate: '7/8/2024', amount: '£17.99', status: 'Cancelled', paymentMethod: 'Card ****4242' },
      { id: 9, invoice: 'INV-009', date: '05/01/2024', dueDate: '06/02/2024', amount: '£17.99', status: 'Unpaid', paymentMethod: 'Card ****4242' },
    ];
  
    const getStatusBadge = (status: string) => {
      const statusColors: { [key: string]: string } = {
        Paid: 'success',
        Cancelled: 'danger',
        Unpaid: 'info'
      };
      return (
        <Badge bg={statusColors[status]} className="bg-opacity-10 text-dark fw-normal px-3 py-2">
          {status}
        </Badge>
      );
    };
  
    const filteredData = billingData.filter(item => {
      const matchesFilter = billingFilter === 'All' || item.status === billingFilter;
      const matchesSearch = item.invoice.toLowerCase().includes(billingSearch.toLowerCase()) ||
                           item.paymentMethod.toLowerCase().includes(billingSearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  
    const statusCounts = {
      All: billingData.length,
      Paid: billingData.filter(item => item.status === 'Paid').length,
      Unpaid: billingData.filter(item => item.status === 'Unpaid').length,
      Cancelled: billingData.filter(item => item.status === 'Cancelled').length,
    };
  
    return (
      <Card>
        <Card.Body>
          <h5 className="mb-4">Billing history</h5>
          
          {/* Filter Tabs */}
          <div className="d-flex gap-3 mb-4 border-bottom">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                className={`btn btn-link text-decoration-none pb-2 billing-head-table position-relative ${
                  billingFilter === status ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
                }`}
                onClick={() => setBillingFilter(status)}
              >
                {status} <Badge bg="light" text="muted" className="ms-1">{count}</Badge>
              </button>
            ))}
          </div>
  
          {/* Entries and Search */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <Form.Select 
                size="sm" 
                style={{ width: '80px' }}
                value={billingEntriesPerPage}
                onChange={(e) => setBillingEntriesPerPage(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="text-muted">entries per page</span>
            </div>
            <Form.Control
              type="search"
              placeholder="Search..."
              style={{ width: '200px' }}
              size="sm"
              value={billingSearch}
              onChange={(e) => setBillingSearch(e.target.value)}
            />
          </div>
  
          {/* Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Invoice ID</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Create Date</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Due Date</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Payment Method</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Amount</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Status</th>
                  <th className="text-uppercase text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.id}</td>
                    <td>{item.date}</td>
                    <td>{item.dueDate}</td>
                    <td>{item.paymentMethod}</td>
                    <td className="fw-semibold">{item.amount}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1 text-muted">
                          <Eye size={18} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-muted">
                          <CreditCard size={18} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-muted">
                          <Wallet size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
  
          {/* Footer */}
          <div className="text-muted small mt-3">
            Showing 1 to {Math.min(billingEntriesPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  // Billing Edit Modal Component
const BillingEditModal = () => (
  <Modal show={showBillingEditModal} onHide={() => setShowBillingEditModal(false)} size="lg" centered>
    <Modal.Header closeButton>
      <Modal.Title>Edit Billing Information</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name *</Form.Label>
              <Form.Control
                type="text"
                value={billingInfo.name}
                onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                value={billingInfo.email}
                onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number *</Form.Label>
              <Form.Control
                type="tel"
                value={billingInfo.phone}
                onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Country *</Form.Label>
              <Form.Select
                value={billingInfo.country}
                onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
              >
                <option>United Kingdom</option>
                <option>United States</option>
                <option>Pakistan</option>
                <option>Canada</option>
                <option>Australia</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Address *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Street address"
                value={billingInfo.address}
                onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>City *</Form.Label>
              <Form.Control
                type="text"
                value={billingInfo.city}
                onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Postcode *</Form.Label>
              <Form.Control
                type="text"
                value={billingInfo.postcode}
                onChange={(e) => setBillingInfo({ ...billingInfo, postcode: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="outline-secondary" onClick={() => setShowBillingEditModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => {
        console.log('Updated Billing Info:', billingInfo);
        setShowBillingEditModal(false);
        alert('Billing information updated successfully!');
      }}>
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>
);

  const renderPaymentMethod = () => (
    <Card>
      <Card.Body>
        <h5 className="mb-4">Payment Method</h5>
        <Row>
          <Col md={6}>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Card Number</Form.Label>
                <Form.Control type="text" placeholder="1234 5678 9012 3456" />
              </Form.Group>
              <Row>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expiry Date</Form.Label>
                    <Form.Control type="text" placeholder="MM/YY" />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>CVV</Form.Label>
                    <Form.Control type="text" placeholder="123" />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Cardholder Name</Form.Label>
                <Form.Control type="text" placeholder="John Doe" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Billing Address</Form.Label>
                <Form.Control as="textarea" rows={3} placeholder="Enter billing address" />
              </Form.Group>
            </Form>
          </Col>
          <Col md={6}>
            <div className="bg-light rounded p-4">
              <h6 className="mb-3">Current Payment Method</h6>
              <div className="d-flex align-items-center mb-3">
                <CreditCard className="me-2 text-primary" />
                <span>•••• •••• •••• 4242</span>
              </div>
              <p className="mb-1"><small className="text-muted">Expiration: 12/25</small></p>
              <p className="mb-3"><small className="text-muted">Billing address on file</small></p>
              <Button variant="outline-primary" size="sm">Update Card</Button>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  const renderPurchase = () => {
    const cartItems = [
      {
        id: 1,
        name: 'RingEX Essentials™',
        type: 'Monthly Subscription',
        price: 17.99,
        quantity: 1,
        nextBilling: '08/05/2025'
      },
      {
        id: 2,
        name: 'RingEX Premium™',
        type: 'Annual Subscription',
        price: 49.99,
        quantity: 1,
        nextBilling: '15/06/2025'
      },
      {
        id: 3,
        name: 'RingEX Add-on Storage',
        type: 'One-time Purchase',
        price: 9.99,
        quantity: 2,
        nextBilling: null
      }
    ];

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = 0;
    const total = subtotal + tax;

    return (
      <div>
        <h5 className="mb-4">Review Your Purchase</h5>
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Body>
                <h6 className="fw-semibold mb-3">Cart Items</h6>
                {cartItems.map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-start mb-3 pb-3 border-bottom">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        {/* <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                          <Phone className="text-primary" size={18} />
                        </div> */}
                        <div>
                          <h6 className="mb-0 fw-semibold">{item.name}</h6>
                          <small className="text-muted">{item.type}</small>
                        </div>
                      </div>
                      {item.nextBilling && (
                        <small className="text-muted">Next billing: {item.nextBilling}</small>
                      )}
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold">£{(item.price * item.quantity).toFixed(2)}</div>
                      <small className="text-muted">Qty: {item.quantity}</small>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <h6 className="fw-semibold mb-3">Payment Method</h6>
                <div className="d-flex align-items-center">
                  <CreditCard className="text-primary me-3" size={24} />
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-semibold">•••• •••• •••• 4242</p>
                    <small className="text-muted">Expires 12/25</small>
                  </div>
                  <Button variant="outline-primary" size="sm">Change</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <h6 className="fw-semibold mb-3">Order Summary</h6>
                
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">£{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Tax (VAT)</span>
                  <span className="fw-semibold">£{tax.toFixed(2)}</span>
                </div>
                
                <hr />
                
                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold h5 mb-0 text-primary">£{total.toFixed(2)}</span>
                </div>

                <Button variant="primary" size="lg" className="w-100 mb-3">
                  <CheckCircle size={18} className="me-2" />
                  Confirm Purchase
                </Button>

                <div className="bg-light rounded p-3">
                  <small className="text-muted d-block mb-2">
                    <strong>Note:</strong> Subscriptions will renew automatically
                  </small>
                  <small className="text-muted">
                    By confirming, you agree to our terms and conditions
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const PaymentMethodScreen = () => {
    const [paymentMethods, setPaymentMethods] = useState([
      { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true, cardHolder: 'John Doe' },
      { id: 2, type: 'Mastercard', last4: '8888', expiry: '08/26', isDefault: false, cardHolder: 'John Doe' },
      { id: 3, type: 'Amex', last4: '1234', expiry: '03/27', isDefault: false, cardHolder: 'John Doe' }
    ]);
    
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [newCard, setNewCard] = useState({
      cardNumber: '',
      expiry: '',
      cvv: '',
      cardHolder: '',
      billingAddress: ''
    });
  
    const handleSetDefault = (id: number) => {
      setPaymentMethods(methods => 
        methods.map(method => ({
          ...method,
          isDefault: method.id === id
        }))
      );
    };
  
    const handleDeleteCard = (id: number) => {
      if (window.confirm('Are you sure you want to delete this payment method?')) {
        setPaymentMethods(methods => methods.filter(method => method.id !== id));
      }
    };
  
    const handleAddCard = () => {
      const newMethod = {
        id: paymentMethods.length + 1,
        type: 'Visa',
        last4: newCard.cardNumber.slice(-4),
        expiry: newCard.expiry,
        isDefault: paymentMethods.length === 0,
        cardHolder: newCard.cardHolder
      };
      setPaymentMethods([...paymentMethods, newMethod]);
      setShowAddCardModal(false);
      setNewCard({
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardHolder: '',
        billingAddress: ''
      });
    };
  
    const AddCardModal = () => (
      <Modal show={showAddCardModal} onHide={() => setShowAddCardModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Card Number *</Form.Label>
              <Form.Control
                type="text"
                placeholder="1234 5678 9012 3456"
                value={newCard.cardNumber}
                onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="MM/YY"
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVV *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="123"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Cardholder Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="John Doe"
                value={newCard.cardHolder}
                onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Billing Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter billing address"
                value={newCard.billingAddress}
                onChange={(e) => setNewCard({ ...newCard, billingAddress: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddCardModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddCard}>
            Add Card
          </Button>
        </Modal.Footer>
      </Modal>
    );
  
    return (
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0">Payment Methods</h5>
            <Button variant="primary" size="sm" onClick={() => setShowAddCardModal(true)}>
              <Plus size={16} className="me-1" />
              Add New Card
            </Button>
          </div>
  
          <Row>
            {paymentMethods.map((method) => (
              <Col lg={4} md={6} key={method.id} className="mb-4">
                <Card className="border h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded p-2 me-2">
                          <CreditCard className="text-primary" size={20} />
                        </div>
                        <div>
                          <h6 className="mb-0">{method.type}</h6>
                          <small className="text-muted">•••• {method.last4}</small>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge bg="success" className="bg-opacity-10 text-dark">
                          <Check size={12} /> Default
                        </Badge>
                      )}
                    </div>
  
                    <div className="mb-3">
                      <small className="text-muted d-block">Cardholder</small>
                      <span className="fw-semibold">{method.cardHolder}</span>
                    </div>
  
                    <div className="mb-3">
                      <small className="text-muted d-block">Expires</small>
                      <span className="fw-semibold">{method.expiry}</span>
                    </div>
  
                    <div className="d-flex gap-2">
  {!method.isDefault ? (
    <>
      <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleSetDefault(method.id)}>
        Set Default
      </Button>
      <Button variant="outline-secondary" size="sm" onClick={() => handleDeleteCard(method.id)}>
        <Trash2 size={14} />
      </Button>
    </>
  ) : (
    <Button variant="outline-secondary" size="sm" className="w-100" disabled>
      Default Payment Method
    </Button>
  )}
</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
  
          {AddCardModal()}
  
          {/* Security Note */}
          <div className="alert alert-info mt-4">
            <AlertCircle size={18} className="me-2" />
            <small>
              <strong>Secure Payment:</strong> All payment information is encrypted and securely stored. 
              We never store your CVV number.
            </small>
          </div>
        </Card.Body>
      </Card>
    );
  };
  
  
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <CustomerDashboard />;
      case 1:
        return renderAccountOverview();
      case 2:
        return renderProductDetails();
      case 3:
        return renderBillingHistory();
      case 4:
        return <PaymentMethodScreen/>;
        case 5:
          return renderExpensesReports();
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid">
      {/* <TopBar/> */}
      <Row>
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

  {/* Overlay for mobile */}
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

  <Col lg={3} className="mb-4">
    <Card 
      className={`d-lg-block ${sidebarOpen ? 'd-block' : 'd-none'}`}
      style={{ 
        height: 'calc(100vh - 0px)', 
        position: 'fixed', 
        top: '0px', 
        width: '290px', 
        borderRadius: '0px', 
        paddingTop: '20px',
        left: '-1px',
        zIndex: 1050,
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <Card.Body className="p-0 position-relative">
        {/* Close button for mobile */}
        <Button
          variant="link"
          className="position-absolute d-lg-none text-muted"
          style={{ top: '10px', right: '10px', zIndex: 1 }}
          onClick={() => setSidebarOpen(false)}
        >
          <ChevronLeft size={20} />
        </Button>

        <div className="list-group list-group-flush">
          {steps.map((step) => (
            <button
              key={step.id}
              className={`list-group-item list-group-item-action d-flex align-items-center border-0 ${
                activeStep === step.id ? 'active bg-primary text-white' : ''
              }`}
              onClick={() => {
                setActiveStep(step.id);
                setSidebarOpen(false); // Close sidebar on mobile after selection
              }}
            >
              <span className="me-2">{step.icon}</span>
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      </Card.Body>
    </Card>
  </Col>
  
  <Col lg={8} className="pt-5 mt-5">
    <h2 className="mb-4">My Account</h2>
    {renderStepContent()}
    <div className="d-flex justify-content-between mt-4">
      <Button
        variant="outline-secondary"
        onClick={handleBack}
        disabled={activeStep === 0}
      >
        <ChevronLeft size={18} className="me-1" />
        Back
      </Button>
      <Button
        variant="primary"
        onClick={handleNext}
        disabled={activeStep === steps.length - 1}
      >
        Next
        <ChevronRight size={18} className="ms-1" />
      </Button>
    </div>
  </Col>
</Row>
    </div>
  );
};

export default BillingPage;