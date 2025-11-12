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
import ExpandableSidebar from '@components/updated-sidebar';
import "@assets/scss/billing.scss";

import CompanyLogo from "@assets/images/ringedge-logo.png";
import CompanyLogo2 from "@assets/images/ringedge-logo-black-n-blue.png";
// Interfaces
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

const BillingPage = () => {
  const [activeScreen, setActiveScreen] = useState('customer-dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [billingFilter, setBillingFilter] = useState('All');
  const [billingSearch, setBillingSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBillingEditModal, setShowBillingEditModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);

  const [billingInfo, setBillingInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 20 1234 5678',
    company: 'Acme Corporation',
    address: '123 Business Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    country: 'United Kingdom'
  });

  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardHolder: '',
    billingAddress: ''
  });

  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true, cardHolder: 'John Doe' },
    { id: 2, type: 'Mastercard', last4: '8888', expiry: '08/26', isDefault: false, cardHolder: 'John Doe' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'UCASS Gateway 16 Channel', category: 'Gateway', price: '£300.00', type: 'Monthly', totalAmount: '£3,600.00', status: 'Active', created: '2024-10-15' },
    { id: 2, name: 'UCASS Advance Policy', category: 'Policy', price: '£216.00', type: 'Annual', totalAmount: '£216.00', status: 'Trial', created: '2024-10-20' },
    { id: 3, name: 'UCASS SLA', category: 'SLA', price: '£420.00', type: 'Monthly', totalAmount: '£5,040.00', status: 'Active', created: '2024-10-10' },
    { id: 4, name: 'UCASS Basic', category: 'Basic', price: '£144.00', type: 'One-time', totalAmount: '£144.00', status: 'Inactive', created: '2024-10-25' }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    type: 'Monthly',
    status: 'Active'
  });



  // Dashboard Screen
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
                <Button variant="outline-primary" size="sm" className="w-100" onClick={() => setActiveScreen('product-details')}>
                  View All Products
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // Account Overview
  const renderAccountOverview = () => {
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
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
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
                  <Form.Select value={billingInfo.country} onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}>
                    <option>United Kingdom</option>
                    <option>United States</option>
                    <option>Pakistan</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    type="text"
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
          <Button variant="primary" onClick={() => setShowBillingEditModal(false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );

    return (
      <div>
        <div className="mb-4">
          <h2 className="mb-1">Account Overview</h2>
          <p className="text-muted mb-0">Manage your account and billing details</p>
        </div>

        <Row className="mb-4">
          <Col lg={7} className="mb-4">
            <Card style={{ minHeight: '274px' }}>
              <Card.Body>
                {/* <h5 className="fw-semibold mb-2">RingEdge Account</h5> */}
                <img src={CompanyLogo2.src} alt="logo" className="img-fluid" style={{marginTop: '21px'}} />
                <div className="mb-5">
                  <Badge bg="secondary" pill className="px-3 py-2 me-2">Trial</Badge>
                  <Badge bg="primary" pill className="px-3 py-2">Upgrade</Badge>
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-end">
                  {/* <Button variant="link" className="text-decoration-none">
                    Manage Account <ChevronRight size={16} />
                  </Button> */}
                  <Button 
                    variant="link" 
                    className="text-decoration-none"
                    onClick={() => setShowManageAccountModal(true)}
                  >
                    Manage Account <ChevronRight size={16} />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={5} className="mb-4">
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
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6} lg={3} className="mb-3">
            <Card className='billing-details-cards'>
              <Card.Body>
                <h6 className="text-muted mb-2">Billing cycle</h6>
                <p className="mb-1"><small className="text-muted">Billing plan</small></p>
                <p className="fw-semibold">Monthly</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3} className="mb-3">
            <Card className='billing-details-cards'>
              <Card.Body>
                <h6 className="text-muted mb-2">Payment method</h6>
                <p className="mb-1"><small className="text-muted">Card number</small></p>
                <p className="fw-semibold">•••• 4242</p>
                <small className="text-muted">Exp: 12/25</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3} className="mb-3">
            <Card className='billing-details-cards'>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-muted mb-0">Billing contact</h6>
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
  };

  // Products Management
  const renderProducts = () => {
    const handleAddProduct = () => {
      const today = new Date().toISOString().split('T')[0];
      const price = parseFloat(newProduct.price) || 0;
      const multiplier = newProduct.type === 'Annual' ? 1 : newProduct.type === 'Monthly' ? 12 : 1;
      const totalAmount = price * multiplier;
      
      const product: Product = {
        id: products.length + 1,
        name: newProduct.name,
        category: newProduct.category,
        price: `£${price.toFixed(2)}`,
        type: newProduct.type,
        totalAmount: `£${totalAmount.toFixed(2)}`,
        status: newProduct.status,
        created: today
      };
      
      setProducts([...products, product]);
      setShowProductModal(false);
      setNewProduct({ name: '', category: '', price: '', type: 'Monthly', status: 'Active' });
    };

    const handleEditProduct = (product: Product) => {
      setSelectedProduct(product);
      setShowViewModal(true);
    };

    const handleDeleteProduct = (id: number) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        setProducts(products.filter(p => p.id !== id));
      }
    };

    const AddProductModal = () => (
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option>Gateway</option>
                    <option>Policy</option>
                    <option>SLA</option>
                    <option>Basic</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={newProduct.type}
                    onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                  >
                    <option>Monthly</option>
                    <option>Annual</option>
                    <option>One-time</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={newProduct.status}
                    onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
                  >
                    <option>Active</option>
                    <option>Trial</option>
                    <option>Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowProductModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddProduct}>
            Add Product
          </Button>
        </Modal.Footer>
      </Modal>
    );

    const ViewProductModal = () => {
      if (!selectedProduct) return null;
      
      const getStatusColor = (status: string): string => {
        switch (status) {
          case 'Active': return 'success';
          case 'Trial': return 'warning';
          case 'Inactive': return 'secondary';
          default: return 'primary';
        }
      };

      return (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Product Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4 pb-4 border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h4 className="mb-2">{selectedProduct.name}</h4>
                  <p className="text-muted mb-0">Product ID: #{selectedProduct.id}</p>
                </div>
                <Badge bg={getStatusColor(selectedProduct.status)} className="px-3 py-2">
                  {selectedProduct.status}
                </Badge>
              </div>
            </div>

            <Row>
              <Col md={6} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <p className="text-muted mb-1 small">Category</p>
                  <p className="mb-0 fw-semibold">{selectedProduct.category}</p>
                </div>
              </Col>
              <Col md={6} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <p className="text-muted mb-1 small">Type</p>
                  <p className="mb-0 fw-semibold">{selectedProduct.type}</p>
                </div>
              </Col>
              <Col md={6} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <p className="text-muted mb-1 small">Price</p>
                  <p className="mb-0 fw-semibold text-primary">{selectedProduct.price}</p>
                </div>
              </Col>
              <Col md={6} className="mb-3">
                <div className="p-3 bg-light rounded">
                  <p className="text-muted mb-1 small">Total Amount</p>
                  <p className="mb-0 fw-semibold text-success">{selectedProduct.totalAmount}</p>
                </div>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowViewModal(false)}>Close</Button>
            <Button variant="primary"><Edit size={16} className="me-2" />Edit Product</Button>
          </Modal.Footer>
        </Modal>
      );
    };

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">My Products</h2>
            <p className="text-muted mb-0">Manage your subscriptions and services</p>
          </div>
          <Button variant="primary" onClick={() => setShowProductModal(true)}>
            <Plus size={16} className="me-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
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
                <h3 className="text-info mb-1">£1,080</h3>
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
                <Form.Select>
                  <option>All Types</option>
                  <option>Monthly</option>
                  <option>Annual</option>
                  <option>One-time</option>
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
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.category}</td>
                    <td className="text-primary fw-semibold">{product.price}</td>
                    <td>{product.type}</td>
                    <td className="text-success fw-semibold">{product.totalAmount}</td>
                    <td>
                      <Badge bg={product.status === 'Active' ? 'success' : product.status === 'Trial' ? 'warning' : 'secondary'} className="bg-opacity-10 text-dark">
                        {product.status}
                      </Badge>
                    </td>
                    <td>{product.created}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="link" size="sm" className="p-1" onClick={() => handleEditProduct(product)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => handleDeleteProduct(product.id)}>
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

        {AddProductModal()}
        {ViewProductModal()}
      </div>
    );
  };

  // Billing History
  const renderBillingHistory = () => {
    const billingData = [
      { id: 1, invoice: 'INV-001', date: '5/5/2024', dueDate: '7/11/2024', amount: '£17.99', status: 'Paid', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' },
      { id: 2, invoice: 'INV-002', date: '7/6/2024', dueDate: '7/8/2024', amount: '£17.99', status: 'Cancelled', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' },
      { id: 3, invoice: 'INV-003', date: '05/01/2024', dueDate: '06/02/2024', amount: '£17.99', status: 'Unpaid', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' }
    ];

    const getStatusBadge = (status: string) => {
      const statusColors: { [key: string]: string } = { Paid: 'success', Cancelled: 'danger', Unpaid: 'warning' };
      return <Badge bg={statusColors[status]} className="bg-opacity-10 text-dark">{status}</Badge>;
    };

    const InvoiceModal = () => {
      if (!selectedInvoice) return null;

      return (
        <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <div className="d-flex justify-content-between align-items-start w-100">
                <div>
                  <h5 className="mb-1">Invoice Details</h5>
                  <p className="text-muted mb-0 small">Invoice #{selectedInvoice.invoice}</p>
                </div>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4 pb-4 border-bottom">
              <Row>
                <Col md={6}>
                  <h6 className="text-muted mb-2">From</h6>
                  {/* <h6 className="mb-1">RingEdge</h6> */}
                  <img src={CompanyLogo2.src} alt="logo" className="img-fluid" />
                  <p className="text-muted mb-0 small">123 Business Street<br />London, UK SW1A 1AA</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Bill To</h6>
                  <h6 className="mb-1">{billingInfo.name}</h6>
                  <p className="text-muted mb-0 small">{billingInfo.address}<br />{billingInfo.city}, {billingInfo.postcode}</p>
                </Col>
              </Row>
            </div>

            <div className="mb-4 pb-4 border-bottom">
              <Row>
                <Col xs={6} md={3}>
                  <p className="text-muted mb-1 small">Invoice Date</p>
                  <p className="fw-semibold mb-0">{selectedInvoice.date}</p>
                </Col>
                <Col xs={6} md={3}>
                  <p className="text-muted mb-1 small">Due Date</p>
                  <p className="fw-semibold mb-0">{selectedInvoice.dueDate}</p>
                </Col>
                <Col xs={6} md={3}>
                  <p className="text-muted mb-1 small">Payment Method</p>
                  <p className="fw-semibold mb-0">{selectedInvoice.paymentMethod}</p>
                </Col>
                <Col xs={6} md={3}>
                  <p className="text-muted mb-1 small">Invoice ID</p>
                  <p className="fw-semibold mb-0">#{selectedInvoice.invoice}</p>
                </Col>
              </Row>
            </div>

            <div className="mb-4">
              <h6 className="text-muted mb-3">Items</h6>
              <Table responsive>
                <thead className="bg-light">
                  <tr>
                    <th>Description</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-end">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-end fw-semibold">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="bg-light rounded p-3">
              <Row className="mb-2">
                <Col xs={6}><p className="mb-0 text-muted">Subtotal:</p></Col>
                <Col xs={6} className="text-end"><p className="mb-0 fw-semibold">{selectedInvoice.subtotal}</p></Col>
              </Row>
              <Row className="mb-2">
                <Col xs={6}><p className="mb-0 text-muted">Tax:</p></Col>
                <Col xs={6} className="text-end"><p className="mb-0 fw-semibold">{selectedInvoice.tax}</p></Col>
              </Row>
              <hr />
              <Row>
                <Col xs={6}><p className="mb-0 fw-bold">Total:</p></Col>
                <Col xs={6} className="text-end"><p className="mb-0 fw-bold text-primary fs-5">{selectedInvoice.total}</p></Col>
              </Row>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowInvoiceModal(false)}>Close</Button>
            <Button variant="primary"><Download size={16} className="me-2" />Download PDF</Button>
          </Modal.Footer>
        </Modal>
      );
    };

    return (
      <div>
        <div className="mb-4">
          <h2 className="mb-1">Billing History</h2>
          <p className="text-muted mb-0">View and manage your invoices</p>
        </div>

        <Card>
          <Card.Body>
            <div className="d-flex gap-3 mb-4 border-bottom">
              {['All', 'Paid', 'Unpaid', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  className={`btn btn-link text-decoration-none pb-2 position-relative ${
                    billingFilter === status ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
                  }`}
                  onClick={() => setBillingFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Form.Select size="sm" style={{ width: '80px' }}>
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </Form.Select>
                <span className="text-muted small">entries</span>
              </div>
              <Form.Control type="search" placeholder="Search..." size="sm" style={{ width: '200px' }} />
            </div>

            <Table responsive hover>
              <thead className="bg-light">
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingData.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold">{item.invoice}</td>
                    <td>{item.date}</td>
                    <td>{item.dueDate}</td>
                    <td>{item.paymentMethod}</td>
                    <td className="fw-semibold">{item.amount}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      <Button variant="link" size="sm" className="p-1" onClick={() => { setSelectedInvoice(item); setShowInvoiceModal(true); }}>
                        <Eye size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {InvoiceModal()}
      </div>
    );
  };

  // Payment Methods
  const renderPaymentMethods = () => {
    const handleSetDefault = (id: number) => {
      setPaymentMethods(methods => methods.map(method => ({ ...method, isDefault: method.id === id })));
    };

    const handleDeleteCard = (id: number) => {
      if (window.confirm('Delete this payment method?')) {
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
      setNewCard({ cardNumber: '', expiry: '', cvv: '', cardHolder: '', billingAddress: '' });
    };

    const AddCardModal = () => (
      <Modal show={showAddCardModal} onHide={() => setShowAddCardModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Payment Method</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Card Number *</Form.Label>
              <Form.Control type="text" placeholder="1234 5678 9012 3456" value={newCard.cardNumber} onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })} />
            </Form.Group>
            <Row>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date *</Form.Label>
                  <Form.Control type="text" placeholder="MM/YY" value={newCard.expiry} onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })} />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CVV *</Form.Label>
                  <Form.Control type="text" placeholder="123" value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Cardholder Name *</Form.Label>
              <Form.Control type="text" placeholder="John Doe" value={newCard.cardHolder} onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Billing Address</Form.Label>
              <Form.Control as="textarea" rows={3} value={newCard.billingAddress} onChange={(e) => setNewCard({ ...newCard, billingAddress: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddCardModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddCard}>Add Card</Button>
        </Modal.Footer>
      </Modal>
    );

    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Payment Methods</h2>
            <p className="text-muted mb-0">Manage your payment methods</p>
          </div>
          <Button variant="primary" onClick={() => setShowAddCardModal(true)}>
            <Plus size={16} className="me-2" />
            Add Card
          </Button>
        </div>

        <Row>
          {paymentMethods.map((method) => (
            <Col lg={4} md={6} key={method.id} className="mb-4">
              <Card>
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
                    {method.isDefault && <Badge bg="success" className="bg-opacity-10 text-dark"><Check size={12} /> Default</Badge>}
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
                        <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => handleSetDefault(method.id)}>Set Default</Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => handleDeleteCard(method.id)}><Trash2 size={14} /></Button>
                      </>
                    ) : (
                      <Button variant="outline-secondary" size="sm" className="w-100" disabled>Default Payment</Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="alert alert-info">
          <AlertCircle size={18} className="me-2" />
          <small><strong>Secure Payment:</strong> All payment information is encrypted and stored securely.</small>
        </div>

        {AddCardModal()}
      </div>
    );
  };



  return (
    <>
      <style>{`
        .main-content-wrapper {
          transition: margin-left 0.3s ease-in-out;
        }

        @media (min-width: 992px) {
          .main-content-wrapper.sidebar-open {
            margin-left: 280px !important;
          }
          
          .main-content-wrapper.sidebar-closed {
            margin-left: 0 !important;
          }
        }
        
        @media (max-width: 991px) {
          .main-content-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
      
        {/* Manage Account Modal */}
        <Modal show={showManageAccountModal} onHide={() => setShowManageAccountModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Manage Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h6 className="mb-3">Account Information</h6>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={billingInfo.name}
                      onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control 
                      type="email" 
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control 
                      type="tel" 
                      value={billingInfo.phone}
                      onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={billingInfo.company}
                      onChange={(e) => setBillingInfo({...billingInfo, company: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Billing Address</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={2}
                  value={billingInfo.address}
                  onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                />
              </Form.Group>
            </Form>
          </div>

          <hr />

          <div className="mb-4">
            <h6 className="mb-3">Account Status</h6>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-2">
              <div>
                <div className="fw-semibold">Account Type</div>
                <small className="text-muted">Business Enterprise</small>
              </div>
              <Badge bg="success">Active</Badge>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-2">
              <div>
                <div className="fw-semibold">Billing Cycle</div>
                <small className="text-muted">Monthly</small>
              </div>
              <Button variant="link" size="sm">Change</Button>
            </div>
            <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded">
              <div>
                <div className="fw-semibold">Auto-renewal</div>
                <small className="text-muted">Enabled for all products</small>
              </div>
              <Form.Check type="switch" defaultChecked />
            </div>
          </div>

          <hr />

          <div>
            <h6 className="mb-3 text-danger">Danger Zone</h6>
            <div className="p-3 border border-danger rounded">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-semibold">Cancel Account</div>
                  <small className="text-muted">Permanently close your account and cancel all services</small>
                </div>
                <Button variant="outline-danger" size="sm">Cancel Account</Button>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowManageAccountModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowManageAccountModal(false);
            // Add save logic here if needed
          }}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>
        {/* Sidebar Toggle Button - Fixed Position */}
        <Button
          variant="primary"
          className="position-fixed d-lg-none"
          style={{
            top: '80px',
            left: sidebarOpen ? '270px' : '10px',
            zIndex: 1100,
            width: '40px',
            height: '40px',
            padding: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'left 0.3s ease-in-out'
          }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </Button>

        {/* Top Navigation */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="link" 
              className="text-dark d-none d-lg-block p-2" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ marginLeft: '-10px' }}
            >
              {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </Button>
            <a className="navbar-brand fw-bold text-primary mb-0" href="#"><img src={CompanyLogo2.src} alt="logo" className="img-fluid" /></a>
          </div>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Button variant="link" className="text-dark position-relative">
              <Bell size={20} />
              <Badge bg="danger" pill className="position-absolute translate-middle" style={{top:'10px', left:'37px'}}>3</Badge>
            </Button>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                <Users size={20} className="text-primary" />
              </div>
              <div className="d-none d-md-block">
                <small className="d-block fw-semibold">John Doe</small>
                <small className="text-muted">john@example.com</small>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1" style={{ position: 'relative', marginTop:'85px' }}>
        {/* Sidebar */}
        <ExpandableSidebar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
        />

        {/* Main Content */}
        <div className={`flex-grow-1 p-4 main-content-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`} style={{ 
          overflowY: 'auto',
          width: '100%'
        }}>
          {activeScreen === 'customer-dashboard' && renderDashboard()}
          {activeScreen === 'account-overview' && renderAccountOverview()}
          {activeScreen === 'product-details' && renderProducts()}
          {activeScreen === 'billing-history' && renderBillingHistory()}
          {activeScreen === 'payment-method' && renderPaymentMethods()}
        </div>
      </div>
    </div>
    </>
  );
};

export default BillingPage;