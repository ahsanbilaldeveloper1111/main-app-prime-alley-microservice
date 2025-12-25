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
  // Additional fields for renderInvoices
  invoiceRef?: string;
  invoiceDate?: string;
  paid?: string;
  balanceDue?: string;
  paymentId?: string;
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
  const [entriesPerPage, setEntriesPerPage] = useState('15');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [billingCycleFilter, setBillingCycleFilter] = useState('All Billing Cycles');
  const [billingHistoryFilter, setBillingHistoryFilter] = useState('All');
  const [billingHistorySearch, setBillingHistorySearch] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('All');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([
    { 
      id: 1, 
      name: 'Veeam Data Platform Essentials', 
      description: "Vere's leer adicat, on time prcheucing",
      status: 'Active', 
      billingCycle: 'Yearly', 
      renewalStart: '15-Dec-2025',
      renewalEnd: '15-Dec-2026',
      price: 'AED 230.73'
    },
    { 
      id: 2, 
      name: 'Microsoft Defender', 
      description: "Heres leer adieting on time penesom",
      status: 'Active', 
      billingCycle: 'Yearly', 
      renewalStart: '15-Dec-2025',
      renewalEnd: '15-Dec-2026',
      price: 'AED 88.35'
    },
    { 
      id: 3, 
      name: 'Exchange Online (Plan 2)', 
      description: "Vere's leer eid Data Microsoft",
      status: 'Active', 
      billingCycle: 'Yearly', 
      renewalStart: '24-Nov-2025',
      renewalEnd: '24-Nov-2026',
      price: 'AED 353.92'
    },
    { 
      id: 4, 
      name: 'Worry Free Services', 
      description: "Vere's leer anticiency, on time archucing",
      status: 'Trial', 
      billingCycle: 'One Time', 
      renewalStart: '15-Dec-2025',
      renewalEnd: '15-Dec-2026',
      price: 'AED 99.04'
    },
    { 
      id: 5, 
      name: 'Windows Server 2022', 
      description: "Vere y leer eid Data rignoris",
      status: 'In Progress', 
      billingCycle: 'Yearly', 
      renewalStart: '15-Dov-2025',
      renewalEnd: '15-Dev-2026',
      price: 'AED 1,913.60'
    },
    { 
      id: 6, 
      name: 'Exchange Online Archiving', 
      description: "Jile a leer ari Data rgroris",
      status: 'Suspended', 
      billingCycle: 'Yearly', 
      renewalStart: '15-Dec-2025',
      renewalEnd: '15-Dec-2026',
      price: 'AED 134.85'
    },
    { 
      id: 7, 
      name: 'UCaaS-Firewall 90G1', 
      description: "Here's loer tsile ornari",
      status: 'Active', 
      billingCycle: 'Yearly', 
      renewalStart: '24-Nov-2025',
      renewalEnd: '24-Nov-2025',
      price: 'AED 600.36'
    },
    { 
      id: 8, 
      name: 'UCaaS-Firewall', 
      description: '',
      status: 'Certiive', 
      billingCycle: 'One Time', 
      renewalStart: '15-Dec-2025',
      renewalEnd: '15-Dov-2026',
      price: 'AED 504.32'
    }
  ]);

  const [billingInfo, setBillingInfo] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+44 20 1234 5678',
    company: 'Ringedge Corporation',
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
 // Dashboard Screen - Updated Version
const renderDashboard = () => {
  const summaryCards = [
    { title: 'Active Subscriptions', value: '19', icon: <Package size={24} />, color: 'primary', iconBg: 'rgba(59, 130, 246, 0.1)', iconColor: '#3b82f6' },
    { title: 'Total Invoice Amount', value: '162,883', icon: <FileText size={24} />, color: 'primary', iconBg: 'rgba(59, 130, 246, 0.1)', iconColor: '#3b82f6' },
    { title: 'Outstanding Amount', value: '38,962.07', icon: <AlertCircle size={24} />, color: 'warning', iconBg: 'rgba(251, 191, 36, 0.1)', iconColor: '#fbbf24' },
    { title: 'Est. Next Month', value: '41,500.00', icon: <Wallet size={24} />, color: 'info', iconBg: 'rgba(34, 211, 238, 0.1)', iconColor: '#22d3ee' },
    { title: 'Overdue Invoices', value: '3', icon: <Clock size={24} />, color: 'danger', iconBg: 'rgba(239, 68, 68, 0.1)', iconColor: '#ef4444', payNow: true },
    { title: 'Overdue Amount', value: '14,250.00', icon: <AlertCircle size={24} />, color: 'warning', iconBg: 'rgba(251, 191, 36, 0.1)', iconColor: '#fbbf24', payNow: true }
  ];

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Trial': return 'warning';
      case 'Suspended': return 'secondary';
      case 'In Progress': return 'info';
      default: return 'primary';
    }
  };

  // Helper function to get icon for subscription status
  const getSubscriptionIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <Check size={18} />;
      case 'Trial':
        return <Clock size={18} />;
      case 'Suspended':
        return <AlertCircle size={18} />;
      case 'In Progress':
        return <TrendingUp size={18} />;
      case 'Certiive':
        return <Package size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  const spendingData = [
    { month: 'Jun', paid: 120, unpaid: 60 },
    { month: 'Jul', paid: 160, unpaid: 60 },
    { month: 'Aug', paid: 200, unpaid: 80 },
    { month: 'Sep', paid: 260, unpaid: 90 },
    { month: 'Oct', paid: 320, unpaid: 100 },
    { month: 'Jun', paid: 120, unpaid: 60 },
    { month: 'Jul', paid: 160, unpaid: 60 },
    { month: 'Aug', paid: 200, unpaid: 80 },
    { month: 'Sep', paid: 260, unpaid: 90 },
    { month: 'Oct', paid: 320, unpaid: 100 }
  ];

  const SpendingChart = () => (
    <ResponsiveContainer width="100%" height={354}>
      <BarChart data={spendingData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => `AED ${value.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="paid" fill="#28a745" name="Paid" />
        <Bar dataKey="unpaid" fill="#ffc107" name="Unpaid" />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Welcome back, Ring Edge!</h2>
          <p className="text-muted mb-0">Here's what's happening with your account today.</p>
        </div>
      </div>

      {/* Summary Cards - 6 boxes in one row */}
      <Row className="mb-4">
        {summaryCards.map((card, index) => (
          <Col xl={2} lg={4} md={6} key={index} className="mb-3">
            <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
              <Card.Body>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded p-2" style={{ backgroundColor: card.iconBg, flexShrink: 0 }}>
                    <div style={{ color: card.iconColor }}>{card.icon}</div>
                  </div>
                  <div className="flex-grow-1">
                    <h3 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: '600' }}>{card.value}</h3>
                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>{card.title}</p>
                  </div>
                </div>
                {card.payNow && (
                  <div className="d-flex justify-content-end mt-2" style={{ position: 'absolute', top: '-25px', right: '0px' }}>
                    <Button 
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
          <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
            </Card.Body>
          </Card>
        </Col>

        {/* Active Subscriptions */}
        <Col lg={4} className="mb-4">
          <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Card.Body>
              <h5 className="mb-4" style={{ fontWeight: '600' }}>Active Subscriptions</h5>
              <div style={{ maxHeight: '367px', overflowY: 'auto' }}>
                {subscriptions.map((subscription) => (
                  
                  <div key={subscription.id} className="mb-3 pb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <div 
                        className="rounded d-flex align-items-center justify-content-center" 
                        style={{ 
                          width: '36px', 
                          height: '36px',
                          backgroundColor: `rgba(${subscription.status === 'Active' ? '34, 197, 94' : subscription.status === 'Trial' ? '251, 191, 36' : subscription.status === 'Suspended' ? '156, 163, 175' : '59, 130, 246'}, 0.1)`,
                          flexShrink: 0
                        }}
                      >
                        <div style={{ color: subscription.status === 'Active' ? '#22c55e' : subscription.status === 'Trial' ? '#fbbf24' : subscription.status === 'Suspended' ? '#6b7280' : '#3b82f6' }}>
                          {getSubscriptionIcon(subscription.status)}
                        </div>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h6 className="mb-0 text-truncate" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                          {subscription.name}
                        </h6>
                      </div>
                      <div style={{ marginLeft: '8px', flexShrink: 0 }}>
                        <Badge 
                          bg={getStatusBadgeColor(subscription.status)}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        >
                          {subscription.status}
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
  );
};

  // Account Overview
  // const renderAccountOverview = () => {
  //   const BillingEditModal = () => (
  //     <Modal show={showBillingEditModal} onHide={() => setShowBillingEditModal(false)} size="lg" centered>
  //       <Modal.Header closeButton>
  //         <Modal.Title>Edit Billing Information</Modal.Title>
  //       </Modal.Header>
  //       <Modal.Body>
  //         <Form>
  //           <Row>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Full Name *</Form.Label>
  //                 <Form.Control
  //                   type="text"
  //                   value={billingInfo.name}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Email *</Form.Label>
  //                 <Form.Control
  //                   type="email"
  //                   value={billingInfo.email}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Phone *</Form.Label>
  //                 <Form.Control
  //                   type="tel"
  //                   value={billingInfo.phone}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Country *</Form.Label>
  //                 <Form.Select value={billingInfo.country} onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}>
  //                   <option>United Kingdom</option>
  //                   <option>United States</option>
  //                   <option>Pakistan</option>
  //                 </Form.Select>
  //               </Form.Group>
  //             </Col>
  //             <Col md={12}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Address *</Form.Label>
  //                 <Form.Control
  //                   type="text"
  //                   value={billingInfo.address}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>City *</Form.Label>
  //                 <Form.Control
  //                   type="text"
  //                   value={billingInfo.city}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Postcode *</Form.Label>
  //                 <Form.Control
  //                   type="text"
  //                   value={billingInfo.postcode}
  //                   onChange={(e) => setBillingInfo({ ...billingInfo, postcode: e.target.value })}
  //                 />
  //               </Form.Group>
  //             </Col>
  //           </Row>
  //         </Form>
  //       </Modal.Body>
  //       <Modal.Footer>
  //         <Button variant="outline-secondary" onClick={() => setShowBillingEditModal(false)}>
  //           Cancel
  //         </Button>
  //         <Button variant="primary" onClick={() => setShowBillingEditModal(false)}>
  //           Save Changes
  //         </Button>
  //       </Modal.Footer>
  //     </Modal>
  //   );

  //   return (
  //     <div>
  //       <div className="mb-4">
  //         <h2 className="mb-1">Account Overview</h2>
  //         <p className="text-muted mb-0">Manage your account and billing details</p>
  //       </div>

  //       <Row className="mb-4">
  //         <Col lg={7} className="mb-4">
  //           <Card style={{ minHeight: '274px' }}>
  //             <Card.Body>
  //               {/* <h5 className="fw-semibold mb-2">RingEdge Account</h5> */}
  //               <img src={CompanyLogo2.src} alt="logo" className="img-fluid" style={{marginTop: '21px'}} />
  //               <div className="mb-5">
  //                 <Badge bg="secondary" pill className="px-3 py-2 me-2">Trial</Badge>
  //                 <Badge bg="primary" pill className="px-3 py-2">Upgrade</Badge>
  //               </div>
  //               <hr className="my-3" />
  //               <div className="d-flex justify-content-end">
  //                 {/* <Button variant="link" className="text-decoration-none">
  //                   Manage Account <ChevronRight size={16} />
  //                 </Button> */}
  //                 <Button 
  //                   variant="link" 
  //                   className="text-decoration-none"
  //                   onClick={() => setShowManageAccountModal(true)}
  //                 >
  //                   Manage Account <ChevronRight size={16} />
  //                 </Button>
  //               </div>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col lg={5} className="mb-4">
  //           <Card>
  //             <Card.Body>
  //               <h6 className="text-muted mb-3">Target upgrade charges</h6>
  //               <h2 className="mb-1">£17.99</h2>
  //               <small className="text-muted">(Excludes taxes and fees)</small>
  //               <div className="mt-3">
  //                 <small className="text-muted">Target upgrade date: 08/05/2025</small>
  //               </div>
  //               <hr />
  //               <div className="d-flex justify-content-between mb-2">
  //                 <span className="text-muted">Account credit</span>
  //                 <span>£0.00</span>
  //               </div>
  //               <div className="d-flex justify-content-between mb-2">
  //                 <span className="text-muted">Pending credit</span>
  //                 <span>£0.00</span>
  //               </div>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //       </Row>

  //       <Row>
  //         <Col md={6} lg={3} className="mb-3">
  //           <Card className='billing-details-cards'>
  //             <Card.Body>
  //               <h6 className="text-muted mb-2">Billing cycle</h6>
  //               <p className="mb-1"><small className="text-muted">Billing plan</small></p>
  //               <p className="fw-semibold">Monthly</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={6} lg={3} className="mb-3">
  //           <Card className='billing-details-cards'>
  //             <Card.Body>
  //               <h6 className="text-muted mb-2">Payment method</h6>
  //               <p className="mb-1"><small className="text-muted">Card number</small></p>
  //               <p className="fw-semibold">•••• 4242</p>
  //               <small className="text-muted">Exp: 12/25</small>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={6} lg={3} className="mb-3">
  //           <Card className='billing-details-cards'>
  //             <Card.Body>
  //               <div className="d-flex justify-content-between align-items-center mb-2">
  //                 <h6 className="text-muted mb-0">Billing contact</h6>
  //                 <Button variant="link" size="sm" className="p-0" onClick={() => setShowBillingEditModal(true)}>
  //                   <Edit size={16} />
  //                 </Button>
  //               </div>
  //               <p className="mb-1"><small className="text-muted">Name</small></p>
  //               <p className="fw-semibold">{billingInfo.name}</p>
  //               <p className="mb-1"><small className="text-muted">Email</small></p>
  //               <p className="fw-semibold mb-0">{billingInfo.email}</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={6} lg={3} className="mb-3">
  //           <Card className='billing-details-cards'>
  //             <Card.Body>
  //               <h6 className="text-muted mb-2">Tax information</h6>
  //               <p className="mb-1"><small className="text-muted">VAT number</small></p>
  //               <p className="fw-semibold">Not specified</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //       </Row>

  //       {BillingEditModal()}
  //     </div>
  //   );
  // };

  // Account Overview - Updated Version
// const renderAccountOverview = () => {
//   const BillingEditModal = () => (
//     <Modal show={showBillingEditModal} onHide={() => setShowBillingEditModal(false)} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Edit Billing Information</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form>
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Full Name *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.name}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Email *</Form.Label>
//                 <Form.Control
//                   type="email"
//                   value={billingInfo.email}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Phone *</Form.Label>
//                 <Form.Control
//                   type="tel"
//                   value={billingInfo.phone}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Country *</Form.Label>
//                 <Form.Select value={billingInfo.country} onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}>
//                   <option>United Kingdom</option>
//                   <option>United States</option>
//                   <option>Pakistan</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={12}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Address *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.address}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>City *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.city}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Postcode *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.postcode}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, postcode: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>
//         </Form>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="outline-secondary" onClick={() => setShowBillingEditModal(false)}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={() => setShowBillingEditModal(false)}>
//           Save Changes
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );

//   return (
//     <div>
//       {/* Page Header */}
//       <div className="mb-4">
//         <h2 className="mb-1">Account Overview</h2>
//         <p className="text-muted mb-0">Here's what's happening with your account today.</p>
//       </div>

//       {/* Company Info Card */}
//       <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//         <Card.Body className="p-4">
//           <h3 className="mb-2" style={{ fontWeight: '600', fontSize: '1.75rem' }}>RingEdge</h3>
//           <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
//             Heres what's happening your account today.
//           </p>
//           <p className="text-muted mb-0" style={{ fontSize: '0.9rem', letterSpacing: '0.3px' }}>
//             UNIT TO: 33C-4, THE DXWR TOIWIHT LJT-P-NE | JUMEIRAH LAKES TOWERS, DUBAI
//           </p>
//         </Card.Body>
//       </Card>

//       {/* Total Invoice Amount Section */}
//       <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', backgroundColor: '#f8f9fa' }}>
//         <Card.Body className="p-4">
//           <Row className="align-items-center">
//             <Col lg={6}>
//               <h5 className="mb-2" style={{ fontWeight: '500', fontSize: '1.1rem' }}>Total Invoice Amount</h5>
//               <h2 className="mb-0" style={{ fontWeight: '700', fontSize: '2.5rem' }}>AED 161,389.83</h2>
//             </Col>
//             <Col lg={6} className="text-lg-end mt-3 mt-lg-0">
//               <Button 
//                 variant="info" 
//                 size="lg" 
//                 className="me-2 px-4"
//                 style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8' }}
//               >
//                 Pay Now
//               </Button>
//               <Button 
//                 variant="outline-secondary" 
//                 size="lg" 
//                 className="px-4"
//               >
//                 View unpaid invoices
//               </Button>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {/* Information Cards Grid */}
//       <Row className="mb-4">
//         {/* Tax Information */}
//         <Col lg={4} className="mb-4">
//           <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
//             <Card.Body className="p-4">
//               <h5 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Tax Information</h5>
              
//               <div className="mb-4">
//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                   <span className="text-muted" style={{ fontSize: '0.9rem' }}>VAT Number</span>
//                   <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>0</span>
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                   <span className="text-muted" style={{ fontSize: '0.9rem' }}>VAT Rate</span>
//                   <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>5.00</span>
//                 </div>
//               </div>

//               <div>
//                 <div className="d-flex justify-content-between align-items-center mb-2">
//                   <span className="text-muted" style={{ fontSize: '0.9rem' }}>VAT Exemption</span>
//                   <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>No</span>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Billing Contact */}
//         <Col lg={4} className="mb-4">
//           <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
//             <Card.Body className="p-4">
//               <h5 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Billing Contact</h5>
              
//               <div className="mb-4">
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <FileText size={20} style={{ color: '#3b82f6' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>info@ringedge.org.uk</p>
//                   </div>
//                   <div className="d-flex gap-2">
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ width: '32px', height: '32px', border: '1px solid #dee2e6', borderRadius: '6px' }}
//                     >
//                       <Edit size={16} />
//                     </Button>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ width: '32px', height: '32px', border: '1px solid #dee2e6', borderRadius: '6px' }}
//                     >
//                       <Trash2 size={16} />
//                     </Button>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <FileText size={20} style={{ color: '#3b82f6' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>+971546462186</p>
//                   </div>
//                   <div className="d-flex gap-2">
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ width: '32px', height: '32px', border: '1px solid #dee2e6', borderRadius: '6px' }}
//                     >
//                       <Edit size={16} />
//                     </Button>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ width: '32px', height: '32px', border: '1px solid #dee2e6', borderRadius: '6px' }}
//                     >
//                       <Trash2 size={16} />
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Terms & Rules */}
//         <Col lg={4} className="mb-4">
//           <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '100%' }}>
//             <Card.Body className="p-4">
//               <h5 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Terms & Rules</h5>
              
//               <div className="mb-4">
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded-circle" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(34, 211, 238, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <Clock size={20} style={{ color: '#22d3ee' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>Net 12 days</p>
//                   </div>
//                   <Badge 
//                     bg="light" 
//                     text="dark" 
//                     style={{ 
//                       fontSize: '0.75rem', 
//                       padding: '0.35rem 0.75rem',
//                       border: '1px solid #dee2e6'
//                     }}
//                   >
//                     Payment terms
//                   </Badge>
//                 </div>
//               </div>

//               <div>
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded-circle" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(34, 211, 238, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <DollarSign size={20} style={{ color: '#22d3ee' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '500' }}>Lato Fee Rule</p>
//                   </div>
//                   <Badge 
//                     bg="light" 
//                     text="dark" 
//                     style={{ 
//                       fontSize: '0.75rem', 
//                       padding: '0.35rem 0.75rem',
//                       border: '1px solid #dee2e6'
//                     }}
//                   >
//                     An Meee targ
//                   </Badge>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {BillingEditModal()}
//     </div>
//   );
// };


// Account Overview - Updated Version -2
// const renderAccountOverview = () => {
//   const BillingEditModal = () => (
//     <Modal show={showBillingEditModal} onHide={() => setShowBillingEditModal(false)} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Edit Billing Information</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Form>
//           <Row>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Full Name *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.name}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Email *</Form.Label>
//                 <Form.Control
//                   type="email"
//                   value={billingInfo.email}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Phone *</Form.Label>
//                 <Form.Control
//                   type="tel"
//                   value={billingInfo.phone}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Country *</Form.Label>
//                 <Form.Select value={billingInfo.country} onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}>
//                   <option>United Kingdom</option>
//                   <option>United States</option>
//                   <option>Pakistan</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={12}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Address *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.address}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>City *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.city}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group className="mb-3">
//                 <Form.Label>Postcode *</Form.Label>
//                 <Form.Control
//                   type="text"
//                   value={billingInfo.postcode}
//                   onChange={(e) => setBillingInfo({ ...billingInfo, postcode: e.target.value })}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>
//         </Form>
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="outline-secondary" onClick={() => setShowBillingEditModal(false)}>
//           Cancel
//         </Button>
//         <Button variant="primary" onClick={() => setShowBillingEditModal(false)}>
//           Save Changes
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );

//   return (
//     <div>
//       {/* Page Header */}
//       <div className="mb-4">
//         <h2 className="mb-1">Account Overview</h2>
//         <p className="text-muted mb-0">Here's what's happening with your account today.</p>
//       </div>

//       {/* Company Info & Total Amount Card */}
//       <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//         <Card.Body className="p-4">
//           <Row>
//             <Col lg={12} className="mb-4">
//               <h3 className="mb-2" style={{ fontWeight: '600', fontSize: '1.75rem' }}>ACME TRADING LLC</h3>
//               <p className="text-muted mb-1" style={{ fontSize: '0.95rem' }}>
//                 Heres what's happening your account today.
//               </p>
//               <p className="text-muted mb-0" style={{ fontSize: '0.9rem', letterSpacing: '0.3px' }}>
//                 UNIT TO: 33C-4, THE DXWR TOIWIHT LJT-P-NE | JUMEIRAH LAKES TOWERS, DUBAI
//               </p>
//             </Col>
//           </Row>
          
//           <div className="p-4 rounded" style={{ backgroundColor: '#f8f9fa' }}>
//             <Row className="align-items-center">
//               <Col lg={6}>
//                 <h5 className="mb-2" style={{ fontWeight: '500', fontSize: '1.1rem', color: '#6c757d' }}>
//                   Total Invoice Amount
//                 </h5>
//                 <h2 className="mb-0" style={{ fontWeight: '700', fontSize: '2.5rem' }}>
//                   AED 161,389.83
//                 </h2>
//               </Col>
//               <Col lg={6} className="text-lg-end mt-3 mt-lg-0">
//                 <Button 
//                   variant="info" 
//                   size="lg" 
//                   className="me-2 px-4"
//                   style={{ backgroundColor: '#5bc0de', borderColor: '#5bc0de', color: 'white' }}
//                 >
//                   Pay Now
//                 </Button>
//                 <Button 
//                   variant="outline-secondary" 
//                   size="lg" 
//                   className="px-4"
//                 >
//                   View unpaid invoices
//                 </Button>
//               </Col>
//             </Row>
//           </div>
//         </Card.Body>
//       </Card>

//       {/* Original Cards Row - Restructured */}
//       <Row>
//         {/* Tax Information */}
//         <Col md={6} lg={4} className="mb-3">
//           <Card className='billing-details-cards' style={{ height: '100%' }}>
//             <Card.Body>
//               <h6 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Tax Information</h6>
              
//               <div className="mb-3">
//                 <p className="mb-1"><small className="text-muted">VAT Number</small></p>
//                 <p className="fw-semibold mb-0" style={{ fontSize: '1.1rem' }}>0</p>
//               </div>
              
//               <div className="mb-3">
//                 <p className="mb-1"><small className="text-muted">VAT Rate</small></p>
//                 <p className="fw-semibold mb-0" style={{ fontSize: '1.1rem' }}>5.00</p>
//               </div>
              
//               <div>
//                 <p className="mb-1"><small className="text-muted">VAT Exemption</small></p>
//                 <p className="fw-semibold mb-0" style={{ fontSize: '1.1rem' }}>No</p>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Billing Contact */}
//         <Col md={6} lg={4} className="mb-3">
//           <Card className='billing-details-cards' style={{ height: '100%' }}>
//             <Card.Body>
//               <h6 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Billing Contact</h6>
              
//               <div className="mb-4">
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <FileText size={18} style={{ color: '#3b82f6' }} />
//                   </div>
//                   <div className="flex-grow-1" style={{ minWidth: 0 }}>
//                     <p className="mb-0 text-truncate" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
//                       ahsan@acme.org.uk
//                     </p>
//                   </div>
//                   <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ 
//                         width: '28px', 
//                         height: '28px', 
//                         border: '1px solid #dee2e6', 
//                         borderRadius: '4px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}
//                     >
//                       <Edit size={14} />
//                     </Button>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ 
//                         width: '28px', 
//                         height: '28px', 
//                         border: '1px solid #dee2e6', 
//                         borderRadius: '4px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}
//                     >
//                       <Trash2 size={14} />
//                     </Button>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(59, 130, 246, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <FileText size={18} style={{ color: '#3b82f6' }} />
//                   </div>
//                   <div className="flex-grow-1" style={{ minWidth: 0 }}>
//                     <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
//                       +971546462186
//                     </p>
//                   </div>
//                   <div className="d-flex gap-2" style={{ flexShrink: 0 }}>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ 
//                         width: '28px', 
//                         height: '28px', 
//                         border: '1px solid #dee2e6', 
//                         borderRadius: '4px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}
//                     >
//                       <Edit size={14} />
//                     </Button>
//                     <Button 
//                       variant="link" 
//                       size="sm" 
//                       className="p-1 text-muted"
//                       style={{ 
//                         width: '28px', 
//                         height: '28px', 
//                         border: '1px solid #dee2e6', 
//                         borderRadius: '4px',
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'center'
//                       }}
//                     >
//                       <Trash2 size={14} />
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Terms & Rules */}
//         <Col md={6} lg={4} className="mb-3">
//           <Card className='billing-details-cards' style={{ height: '100%' }}>
//             <Card.Body>
//               <h6 className="mb-4" style={{ fontWeight: '600', fontSize: '1.1rem' }}>Terms & Rules</h6>
              
//               <div className="mb-4">
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded-circle" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(34, 211, 238, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <Clock size={18} style={{ color: '#22d3ee' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Net 12 days</p>
//                   </div>
//                   <Badge 
//                     bg="light" 
//                     text="dark" 
//                     style={{ 
//                       fontSize: '0.7rem', 
//                       padding: '0.3rem 0.6rem',
//                       border: '1px solid #dee2e6',
//                       fontWeight: '500'
//                     }}
//                   >
//                     Payment terms
//                   </Badge>
//                 </div>
//               </div>

//               <div>
//                 <div className="d-flex align-items-center gap-3">
//                   <div className="d-flex align-items-center justify-content-center rounded-circle" 
//                     style={{ 
//                       width: '40px', 
//                       height: '40px', 
//                       backgroundColor: 'rgba(34, 211, 238, 0.1)',
//                       flexShrink: 0 
//                     }}>
//                     <DollarSign size={18} style={{ color: '#22d3ee' }} />
//                   </div>
//                   <div className="flex-grow-1">
//                     <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Lato Fee Rule</p>
//                   </div>
//                   <Badge 
//                     bg="light" 
//                     text="dark" 
//                     style={{ 
//                       fontSize: '0.7rem', 
//                       padding: '0.3rem 0.6rem',
//                       border: '1px solid #dee2e6',
//                       fontWeight: '500'
//                     }}
//                   >
//                     An Meee targ
//                   </Badge>
//                 </div>
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       {BillingEditModal()}
//     </div>
//   );
// };


// Account Overview - Updated Version
// Note: Make sure to import Mail and Phone icons at the top of your file:
// import { Mail, Phone } from 'lucide-react';

// Account Overview - Updated Version
// Note: Make sure to import Mail and Phone icons at the top of your file:
// import { Mail, Phone } from 'lucide-react';

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
                  <option>United Arab Emirates</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Company *</Form.Label>
                <Form.Control
                  type="text"
                  value={billingInfo.company}
                  onChange={(e) => setBillingInfo({ ...billingInfo, company: e.target.value })}
                />
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
      {/* Page Header */}
      <div className="mb-3">
        <h2 className="mb-1">Account Overview</h2>
        <p className="text-muted mb-0">Here's what's happening with your account today.</p>
      </div>

      {/* Company Info & Invoice Section */}
      <Row className="mb-3">
        <Col lg={8} className="mb-3">
          <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Card.Body className="p-3">
              <div className="d-flex align-items-start gap-3 mb-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  flexShrink: 0 
                }}>
                  <Users size={20} style={{ color: '#3b82f6' }} />
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1" style={{ fontWeight: '600', fontSize: '1.1rem' }}>{billingInfo.company}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                    {billingInfo.address}, {billingInfo.city}, {billingInfo.postcode}, {billingInfo.country}
                  </p>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowBillingEditModal(true)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                >
                  <Edit size={12} className="me-1" />
                  Edit
                </Button>
              </div>

              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
                <div>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Invoice Amount</small>
                  <h4 className="mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>AED 161,389.83</h4>
                </div>
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary"
                    size="sm"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', fontWeight: '600' }}
                  >
                    Pay Now
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    size="sm"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                  >
                    View Invoices
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4} className="mb-3">
          <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Card.Body className="p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  flexShrink: 0 
                }}>
                  <Wallet size={16} style={{ color: '#22c55e' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.9rem' }}>Account Balance</h6>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>Credit</small>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>AED 0.00</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-2">
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>Pending</small>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>AED 0.00</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Information Cards Grid */}
      <Row>
        {/* Tax Information */}
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards'>
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  flexShrink: 0 
                }}>
                  <FileText size={14} style={{ color: '#fbbf24' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Tax Information</h6>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>VAT Number</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>0</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>VAT Rate</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>5.00%</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Exemption</small>
                <Badge bg="secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>No</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Billing Contact */}
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards' >
            <Card.Body className="p-2">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                    width: '28px', 
                    height: '28px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    flexShrink: 0 
                  }}>
                    <Users size={14} style={{ color: '#3b82f6' }} />
                  </div>
                  <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Billing Contact</h6>
                </div>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-primary"
                  onClick={() => setShowBillingEditModal(true)}
                  style={{ textDecoration: 'none' }}
                >
                  <Edit size={12} />
                </Button>
              </div>
              
              <div className="d-flex align-items-center gap-2 py-1 border-bottom">
                <FileText size={12} style={{ color: '#3b82f6' }} />
                <p className="mb-0 text-truncate flex-grow-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  {billingInfo.email}
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 py-1">
                <FileText size={12} style={{ color: '#3b82f6' }} />
                <p className="mb-0 flex-grow-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  {billingInfo.phone}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Payment Terms */}
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards' >
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  flexShrink: 0 
                }}>
                  <Clock size={14} style={{ color: '#22d3ee' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Payment Terms</h6>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Payment Due</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>Net 12</span>
              </div>

              <div className="d-flex justify-content-between align-items-center py-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Late Fee</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>Standard</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Payment Method */}
        <Col md={6} lg={3} className="mb-3">
          <Card className='billing-details-cards' >
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  flexShrink: 0 
                }}>
                  <DollarSign size={14} style={{ color: '#a855f7' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Payment Method</h6>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Card</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>•••• 4242</span>
              </div>

              <div className="d-flex justify-content-between align-items-center py-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Expiry</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>12/25</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Information Row */}
      <Row>
        {/* Upcoming Renewals */}
        <Col md={6} lg={4} className="mb-3">
          <Card className='billing-details-cards' style={{ height: '100%' }}>
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(251, 191, 36, 0.1)',
                  flexShrink: 0 
                }}>
                  <Clock size={14} style={{ color: '#fbbf24' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Upcoming Renewals</h6>
              </div>
              
              {subscriptions
                .filter(sub => sub.status === 'Active' || sub.status === 'Trial')
                .slice(0, 3)
                .map((sub, index) => (
                  <div key={sub.id} className={`py-1 ${index < 2 ? 'border-bottom' : ''}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <small className="d-block text-truncate" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                          {sub.name}
                        </small>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>{sub.renewalEnd}</small>
                      </div>
                      <small className="fw-semibold ms-2" style={{ fontSize: '0.75rem', flexShrink: 0 }}>
                        {sub.price}
                      </small>
                    </div>
                  </div>
                ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col md={6} lg={4} className="mb-3">
          <Card className='billing-details-cards' style={{ height: '100%' }}>
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  flexShrink: 0 
                }}>
                  <TrendingUp size={14} style={{ color: '#22c55e' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Recent Activity</h6>
              </div>
              
              <div className="d-flex gap-2 py-1 border-bottom">
                <Check size={12} className="mt-1 text-success" style={{ flexShrink: 0 }} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <small className="d-block" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Payment completed</small>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>2 hours ago</small>
                </div>
              </div>
              
              <div className="d-flex gap-2 py-1 border-bottom">
                <FileText size={12} className="mt-1 text-info" style={{ flexShrink: 0 }} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <small className="d-block" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Invoice #INV-003 generated</small>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>Yesterday</small>
                </div>
              </div>

              <div className="d-flex gap-2 py-1">
                <Package size={12} className="mt-1 text-primary" style={{ flexShrink: 0 }} />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <small className="d-block" style={{ fontSize: '0.75rem', fontWeight: '500' }}>Subscription activated</small>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>3 days ago</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col md={6} lg={4} className="mb-3">
          <Card className='billing-details-cards' style={{ height: '100%' }}>
            <Card.Body className="p-2">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ 
                  width: '28px', 
                  height: '28px', 
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  flexShrink: 0 
                }}>
                  <DollarSign size={14} style={{ color: '#a855f7' }} />
                </div>
                <h6 className="mb-0" style={{ fontWeight: '600', fontSize: '0.85rem' }}>Quick Actions</h6>
              </div>
              
              <div className="d-flex flex-column gap-2">
                <div 
                  className="d-flex align-items-center gap-2 py-2 px-2" 
                  style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setActiveScreen('invoices')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="rounded d-flex align-items-center justify-content-center" style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    flexShrink: 0 
                  }}>
                    <FileText size={12} style={{ color: '#3b82f6' }} />
                  </div>
                  <small style={{ fontSize: '0.75rem', fontWeight: '500' }}>Download Invoices</small>
                </div>

                <div 
                  className="d-flex align-items-center gap-2 py-2 px-2" 
                  style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setActiveScreen('payment-methods')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="rounded d-flex align-items-center justify-content-center" style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    flexShrink: 0 
                  }}>
                    <Wallet size={12} style={{ color: '#22c55e' }} />
                  </div>
                  <small style={{ fontSize: '0.75rem', fontWeight: '500' }}>Update Payment Method</small>
                </div>

                <div 
                  className="d-flex align-items-center gap-2 py-2 px-2" 
                  style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setActiveScreen('products')}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div className="rounded d-flex align-items-center justify-content-center" style={{ 
                    width: '24px', 
                    height: '24px', 
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    flexShrink: 0 
                  }}>
                    <Package size={12} style={{ color: '#a855f7' }} />
                  </div>
                  <small style={{ fontSize: '0.75rem', fontWeight: '500' }}>View Subscriptions</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {BillingEditModal()}
    </div>
  );
};
  // Products Management Original
  // const renderProducts = () => {
  //   const handleAddProduct = () => {
  //     const today = new Date().toISOString().split('T')[0];
  //     const price = parseFloat(newProduct.price) || 0;
  //     const multiplier = newProduct.type === 'Annual' ? 1 : newProduct.type === 'Monthly' ? 12 : 1;
  //     const totalAmount = price * multiplier;
      
  //     const product: Product = {
  //       id: products.length + 1,
  //       name: newProduct.name,
  //       category: newProduct.category,
  //       price: `£${price.toFixed(2)}`,
  //       type: newProduct.type,
  //       totalAmount: `£${totalAmount.toFixed(2)}`,
  //       status: newProduct.status,
  //       created: today
  //     };
      
  //     setProducts([...products, product]);
  //     setShowProductModal(false);
  //     setNewProduct({ name: '', category: '', price: '', type: 'Monthly', status: 'Active' });
  //   };

  //   const handleEditProduct = (product: Product) => {
  //     setSelectedProduct(product);
  //     setShowViewModal(true);
  //   };

  //   const handleDeleteProduct = (id: number) => {
  //     if (window.confirm('Are you sure you want to delete this product?')) {
  //       setProducts(products.filter(p => p.id !== id));
  //     }
  //   };

  //   const AddProductModal = () => (
  //     <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg" centered>
  //       <Modal.Header closeButton>
  //         <Modal.Title>Add New Product</Modal.Title>
  //       </Modal.Header>
  //       <Modal.Body>
  //         <Form>
  //           <Row>
  //             <Col md={12}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Product Name *</Form.Label>
  //                 <Form.Control
  //                   type="text"
  //                   value={newProduct.name}
  //                   onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
  //                   placeholder="Enter product name"
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Category *</Form.Label>
  //                 <Form.Select
  //                   value={newProduct.category}
  //                   onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
  //                 >
  //                   <option value="">Select category</option>
  //                   <option>Gateway</option>
  //                   <option>Policy</option>
  //                   <option>SLA</option>
  //                   <option>Basic</option>
  //                 </Form.Select>
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Price *</Form.Label>
  //                 <Form.Control
  //                   type="number"
  //                   step="0.01"
  //                   value={newProduct.price}
  //                   onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
  //                   placeholder="0.00"
  //                 />
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Type *</Form.Label>
  //                 <Form.Select
  //                   value={newProduct.type}
  //                   onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
  //                 >
  //                   <option>Monthly</option>
  //                   <option>Annual</option>
  //                   <option>One-time</option>
  //                 </Form.Select>
  //               </Form.Group>
  //             </Col>
  //             <Col md={6}>
  //               <Form.Group className="mb-3">
  //                 <Form.Label>Status *</Form.Label>
  //                 <Form.Select
  //                   value={newProduct.status}
  //                   onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value })}
  //                 >
  //                   <option>Active</option>
  //                   <option>Trial</option>
  //                   <option>Inactive</option>
  //                 </Form.Select>
  //               </Form.Group>
  //             </Col>
  //           </Row>
  //         </Form>
  //       </Modal.Body>
  //       <Modal.Footer>
  //         <Button variant="outline-secondary" onClick={() => setShowProductModal(false)}>
  //           Cancel
  //         </Button>
  //         <Button variant="primary" onClick={handleAddProduct}>
  //           Add Product
  //         </Button>
  //       </Modal.Footer>
  //     </Modal>
  //   );

  //   const ViewProductModal = () => {
  //     if (!selectedProduct) return null;
      
  //     const getStatusColor = (status: string): string => {
  //       switch (status) {
  //         case 'Active': return 'success';
  //         case 'Trial': return 'warning';
  //         case 'Inactive': return 'secondary';
  //         default: return 'primary';
  //       }
  //     };

  //     return (
  //       <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
  //         <Modal.Header closeButton>
  //           <Modal.Title>Product Details</Modal.Title>
  //         </Modal.Header>
  //         <Modal.Body>
  //           <div className="mb-4 pb-4 border-bottom">
  //             <div className="d-flex justify-content-between align-items-start">
  //               <div>
  //                 <h4 className="mb-2">{selectedProduct.name}</h4>
  //                 <p className="text-muted mb-0">Product ID: #{selectedProduct.id}</p>
  //               </div>
  //               <Badge bg={getStatusColor(selectedProduct.status)} className="px-3 py-2">
  //                 {selectedProduct.status}
  //               </Badge>
  //             </div>
  //           </div>

  //           <Row>
  //             <Col md={6} className="mb-3">
  //               <div className="p-3 bg-light rounded">
  //                 <p className="text-muted mb-1 small">Category</p>
  //                 <p className="mb-0 fw-semibold">{selectedProduct.category}</p>
  //               </div>
  //             </Col>
  //             <Col md={6} className="mb-3">
  //               <div className="p-3 bg-light rounded">
  //                 <p className="text-muted mb-1 small">Type</p>
  //                 <p className="mb-0 fw-semibold">{selectedProduct.type}</p>
  //               </div>
  //             </Col>
  //             <Col md={6} className="mb-3">
  //               <div className="p-3 bg-light rounded">
  //                 <p className="text-muted mb-1 small">Price</p>
  //                 <p className="mb-0 fw-semibold text-primary">{selectedProduct.price}</p>
  //               </div>
  //             </Col>
  //             <Col md={6} className="mb-3">
  //               <div className="p-3 bg-light rounded">
  //                 <p className="text-muted mb-1 small">Total Amount</p>
  //                 <p className="mb-0 fw-semibold text-success">{selectedProduct.totalAmount}</p>
  //               </div>
  //             </Col>
  //           </Row>
  //         </Modal.Body>
  //         <Modal.Footer>
  //           <Button variant="outline-secondary" onClick={() => setShowViewModal(false)}>Close</Button>
  //           <Button variant="primary"><Edit size={16} className="me-2" />Edit Product</Button>
  //         </Modal.Footer>
  //       </Modal>
  //     );
  //   };

  //   return (
  //     <div>
  //       <div className="d-flex justify-content-between align-items-center mb-4">
  //         <div>
  //           <h2 className="mb-1">My Products</h2>
  //           <p className="text-muted mb-0">Manage your subscriptions and services</p>
  //         </div>
  //         <Button variant="primary" onClick={() => setShowProductModal(true)}>
  //           <Plus size={16} className="me-2" />
  //           Add Product
  //         </Button>
  //       </div>

  //       {/* Stats Cards */}
  //       <Row className="mb-4">
  //         <Col md={3} className="mb-3">
  //           <Card>
  //             <Card.Body>
  //               <h3 className="mb-1">24</h3>
  //               <p className="text-muted mb-0 small">Total Products</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={3} className="mb-3">
  //           <Card>
  //             <Card.Body>
  //               <h3 className="text-success mb-1">20</h3>
  //               <p className="text-muted mb-0 small">Active</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={3} className="mb-3">
  //           <Card>
  //             <Card.Body>
  //               <h3 className="text-warning mb-1">4</h3>
  //               <p className="text-muted mb-0 small">Trial</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //         <Col md={3} className="mb-3">
  //           <Card>
  //             <Card.Body>
  //               <h3 className="text-info mb-1">£1,080</h3>
  //               <p className="text-muted mb-0 small">Total Value</p>
  //             </Card.Body>
  //           </Card>
  //         </Col>
  //       </Row>

  //       {/* Filters */}
  //       <Card className="mb-4">
  //         <Card.Body>
  //           <Row className="align-items-center">
  //             <Col md={4}>
  //               <Form.Control type="search" placeholder="Search products..." />
  //             </Col>
  //             <Col md={2}>
  //               <Form.Select>
  //                 <option>All Categories</option>
  //                 <option>Gateway</option>
  //                 <option>Policy</option>
  //                 <option>SLA</option>
  //               </Form.Select>
  //             </Col>
  //             <Col md={2}>
  //               <Form.Select>
  //                 <option>All Status</option>
  //                 <option>Active</option>
  //                 <option>Trial</option>
  //                 <option>Inactive</option>
  //               </Form.Select>
  //             </Col>
  //             <Col md={2}>
  //               <Form.Select>
  //                 <option>All Types</option>
  //                 <option>Monthly</option>
  //                 <option>Annual</option>
  //                 <option>One-time</option>
  //               </Form.Select>
  //             </Col>
  //             <Col md={2}>
  //               <Button variant="outline-primary" className="w-100">
  //                 <Filter size={16} className="me-2" />
  //                 Apply
  //               </Button>
  //             </Col>
  //           </Row>
  //         </Card.Body>
  //       </Card>

  //       {/* Products Table */}
  //       <Card>
  //         <Card.Body>
  //           <Table responsive hover>
  //             <thead className="bg-light">
  //               <tr>
  //                 <th>Product</th>
  //                 <th>Category</th>
  //                 <th>Price</th>
  //                 <th>Type</th>
  //                 <th>Total Amount</th>
  //                 <th>Status</th>
  //                 <th>Created</th>
  //                 <th>Actions</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {products.map((product) => (
  //                 <tr key={product.id}>
  //                   <td className="fw-semibold">{product.name}</td>
  //                   <td>{product.category}</td>
  //                   <td className="text-primary fw-semibold">{product.price}</td>
  //                   <td>{product.type}</td>
  //                   <td className="text-success fw-semibold">{product.totalAmount}</td>
  //                   <td>
  //                     <Badge bg={product.status === 'Active' ? 'success' : product.status === 'Trial' ? 'warning' : 'secondary'} className="bg-opacity-10 text-dark">
  //                       {product.status}
  //                     </Badge>
  //                   </td>
  //                   <td>{product.created}</td>
  //                   <td>
  //                     <div className="d-flex gap-2">
  //                       <Button variant="link" size="sm" className="p-1" onClick={() => handleEditProduct(product)}>
  //                         <Eye size={16} />
  //                       </Button>
  //                       <Button variant="link" size="sm" className="p-1 text-danger" onClick={() => handleDeleteProduct(product.id)}>
  //                         <Trash2 size={16} />
  //                       </Button>
  //                     </div>
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </Table>
  //         </Card.Body>
  //       </Card>

  //       {AddProductModal()}
  //       {ViewProductModal()}
  //     </div>
  //   );
  // };


  // Subscriptions Screen - Updated Version
// Subscriptions Screen - Updated Version
const renderProducts = () => {
 



  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'Active': { bg: 'success', text: 'white' },
      'Trial': { bg: 'warning', text: 'dark' },
      'In Progress': { bg: 'warning', text: 'dark' },
      'Suspended': { bg: 'danger', text: 'white' },
      'Certiive': { bg: 'info', text: 'white' }
    };
    
    const config = statusConfig[status] || { bg: 'secondary', text: 'white' };
    
    return (
      <Badge 
        bg={config.bg} 
        text={config.text}
        style={{ 
          fontSize: '0.75rem', 
          padding: '0.35rem 0.75rem',
          fontWeight: '500'
        }}
      >
        {status}
      </Badge>
    );
  };

  const handleDeleteSubscription = (id: number) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== id));
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="mb-1">Subscriptions</h2>
        <p className="text-muted mb-0">Manage your recurring services & renewals.</p>
      </div>

      {/* Filters Section */}
      {/* <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center g-3">
            <Col xs={12} sm={6} md={3}>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Show</span>
                <Form.Select 
                  size="sm" 
                  style={{ width: '80px' }}
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(e.target.value)}
                >
                  <option>10</option>
                  <option>15</option>
                  <option>25</option>
                  <option>50</option>
                </Form.Select>
                <span className="text-muted small">entries</span>
              </div>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Select 
                size="sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Trial</option>
                <option>In Progress</option>
                <option>Suspended</option>
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Select 
                size="sm"
                value={billingCycleFilter}
                onChange={(e) => setBillingCycleFilter(e.target.value)}
              >
                <option>All Billing Cycles</option>
                <option>Yearly</option>
                <option>Monthly</option>
                <option>One Time</option>
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <div className="d-flex gap-2">
                <Form.Control 
                  type="search" 
                  placeholder="Search..." 
                  size="sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Dropdown>
                  <Dropdown.Toggle 
                    variant="outline-secondary" 
                    size="sm"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Account gprnoges
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>Export CSV</Dropdown.Item>
                    <Dropdown.Item>Export PDF</Dropdown.Item>
                    <Dropdown.Item>Print</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card> */}

      {/* Filters */}
         <Card className="mb-4">
           <Card.Body>
           <Row className="align-items-center">
               <Col md={2}>
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
               <Col md={2} className="ms-auto">
  <Button variant="outline-primary" className="w-100">
    <Filter size={16} className="me-2" />
    Apply
  </Button>
</Col>
             </Row>
           </Card.Body>
         </Card>

      {/* Subscriptions Table */}
      <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ minWidth: '1000px' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <tr>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Subscription Name 
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Status
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Billing Cycle
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Renewal Start Date
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Renewal End Date
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Subscriptions
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription, index) => (
                  <tr 
                    key={subscription.id}
                    style={{ 
                      borderBottom: index === subscriptions.length - 1 ? 'none' : '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    className="align-middle"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem', color: '#212529', marginBottom: '4px' }}>
                          {subscription.name}
                        </div>
                        {subscription.description && (
                          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                            {subscription.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {subscription.billingCycle}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {subscription.renewalStart}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {subscription.renewalEnd}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        10
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        {subscription.price}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
  // Billing History - original
  // const renderBillingHistory = () => {
  //   const billingData = [
  //     { id: 1, invoice: 'INV-001', date: '5/5/2024', dueDate: '7/11/2024', amount: '£17.99', status: 'Paid', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' },
  //     { id: 2, invoice: 'INV-002', date: '7/6/2024', dueDate: '7/8/2024', amount: '£17.99', status: 'Cancelled', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' },
  //     { id: 3, invoice: 'INV-003', date: '05/01/2024', dueDate: '06/02/2024', amount: '£17.99', status: 'Unpaid', paymentMethod: 'Card ****4242', items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], subtotal: '£17.99', tax: '£0.00', total: '£17.99' }
  //   ];

  //   const getStatusBadge = (status: string) => {
  //     const statusColors: { [key: string]: string } = { Paid: 'success', Cancelled: 'danger', Unpaid: 'warning' };
  //     return <Badge bg={statusColors[status]} className="bg-opacity-10 text-dark">{status}</Badge>;
  //   };

  //   const InvoiceModal = () => {
  //     if (!selectedInvoice) return null;

  //     return (
  //       <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg" centered>
  //         <Modal.Header closeButton>
  //           <Modal.Title>
  //             <div className="d-flex justify-content-between align-items-start w-100">
  //               <div>
  //                 <h5 className="mb-1">Invoice Details</h5>
  //                 <p className="text-muted mb-0 small">Invoice #{selectedInvoice.invoice}</p>
  //               </div>
  //               {getStatusBadge(selectedInvoice.status)}
  //             </div>
  //           </Modal.Title>
  //         </Modal.Header>
  //         <Modal.Body>
  //           <div className="mb-4 pb-4 border-bottom">
  //             <Row>
  //               <Col md={6}>
  //                 <h6 className="text-muted mb-2">From</h6>
  //                 {/* <h6 className="mb-1">RingEdge</h6> */}
  //                 <img src={CompanyLogo2.src} alt="logo" className="img-fluid" />
  //                 <p className="text-muted mb-0 small">123 Business Street<br />London, UK SW1A 1AA</p>
  //               </Col>
  //               <Col md={6}>
  //                 <h6 className="text-muted mb-2">Bill To</h6>
  //                 <h6 className="mb-1">{billingInfo.name}</h6>
  //                 <p className="text-muted mb-0 small">{billingInfo.address}<br />{billingInfo.city}, {billingInfo.postcode}</p>
  //               </Col>
  //             </Row>
  //           </div>

  //           <div className="mb-4 pb-4 border-bottom">
  //             <Row>
  //               <Col xs={6} md={3}>
  //                 <p className="text-muted mb-1 small">Invoice Date</p>
  //                 <p className="fw-semibold mb-0">{selectedInvoice.date}</p>
  //               </Col>
  //               <Col xs={6} md={3}>
  //                 <p className="text-muted mb-1 small">Due Date</p>
  //                 <p className="fw-semibold mb-0">{selectedInvoice.dueDate}</p>
  //               </Col>
  //               <Col xs={6} md={3}>
  //                 <p className="text-muted mb-1 small">Payment Method</p>
  //                 <p className="fw-semibold mb-0">{selectedInvoice.paymentMethod}</p>
  //               </Col>
  //               <Col xs={6} md={3}>
  //                 <p className="text-muted mb-1 small">Invoice ID</p>
  //                 <p className="fw-semibold mb-0">#{selectedInvoice.invoice}</p>
  //               </Col>
  //             </Row>
  //           </div>

  //           <div className="mb-4">
  //             <h6 className="text-muted mb-3">Items</h6>
  //             <Table responsive>
  //               <thead className="bg-light">
  //                 <tr>
  //                   <th>Description</th>
  //                   <th className="text-center">Quantity</th>
  //                   <th className="text-end">Price</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 {selectedInvoice.items.map((item, index) => (
  //                   <tr key={index}>
  //                     <td>{item.name}</td>
  //                     <td className="text-center">{item.quantity}</td>
  //                     <td className="text-end fw-semibold">{item.price}</td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </Table>
  //           </div>

  //           <div className="bg-light rounded p-3">
  //             <Row className="mb-2">
  //               <Col xs={6}><p className="mb-0 text-muted">Subtotal:</p></Col>
  //               <Col xs={6} className="text-end"><p className="mb-0 fw-semibold">{selectedInvoice.subtotal}</p></Col>
  //             </Row>
  //             <Row className="mb-2">
  //               <Col xs={6}><p className="mb-0 text-muted">Tax:</p></Col>
  //               <Col xs={6} className="text-end"><p className="mb-0 fw-semibold">{selectedInvoice.tax}</p></Col>
  //             </Row>
  //             <hr />
  //             <Row>
  //               <Col xs={6}><p className="mb-0 fw-bold">Total:</p></Col>
  //               <Col xs={6} className="text-end"><p className="mb-0 fw-bold text-primary fs-5">{selectedInvoice.total}</p></Col>
  //             </Row>
  //           </div>
  //         </Modal.Body>
  //         <Modal.Footer>
  //           <Button variant="outline-secondary" onClick={() => setShowInvoiceModal(false)}>Close</Button>
  //           <Button variant="primary"><Download size={16} className="me-2" />Download PDF</Button>
  //         </Modal.Footer>
  //       </Modal>
  //     );
  //   };

  //   return (
  //     <div>
  //       <div className="mb-4">
  //         <h2 className="mb-1">Billing History</h2>
  //         <p className="text-muted mb-0">View and manage your invoices</p>
  //       </div>

  //       <Card>
  //         <Card.Body>
  //           <div className="d-flex gap-3 mb-4 border-bottom">
  //             {['All', 'Paid', 'Unpaid', 'Cancelled'].map((status) => (
  //               <button
  //                 key={status}
  //                 className={`btn btn-link text-decoration-none pb-2 position-relative ${
  //                   billingFilter === status ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
  //                 }`}
  //                 onClick={() => setBillingFilter(status)}
  //               >
  //                 {status}
  //               </button>
  //             ))}
  //           </div>

  //           <div className="d-flex justify-content-between align-items-center mb-3">
  //             <div className="d-flex align-items-center gap-2">
  //               <Form.Select size="sm" style={{ width: '80px' }}>
  //                 <option>10</option>
  //                 <option>25</option>
  //                 <option>50</option>
  //               </Form.Select>
  //               <span className="text-muted small">entries</span>
  //             </div>
  //             <Form.Control type="search" placeholder="Search..." size="sm" style={{ width: '200px' }} />
  //           </div>

  //           <Table responsive hover>
  //             <thead className="bg-light">
  //               <tr>
  //                 <th>Invoice ID</th>
  //                 <th>Date</th>
  //                 <th>Due Date</th>
  //                 <th>Payment Method</th>
  //                 <th>Amount</th>
  //                 <th>Status</th>
  //                 <th>Actions</th>
  //               </tr>
  //             </thead>
  //             <tbody>
  //               {billingData.map((item) => (
  //                 <tr key={item.id}>
  //                   <td className="fw-semibold">{item.invoice}</td>
  //                   <td>{item.date}</td>
  //                   <td>{item.dueDate}</td>
  //                   <td>{item.paymentMethod}</td>
  //                   <td className="fw-semibold">{item.amount}</td>
  //                   <td>{getStatusBadge(item.status)}</td>
  //                   <td>
  //                     <Button variant="link" size="sm" className="p-1" onClick={() => { setSelectedInvoice(item); setShowInvoiceModal(true); }}>
  //                       <Eye size={18} />
  //                     </Button>
  //                   </td>
  //                 </tr>
  //               ))}
  //             </tbody>
  //           </Table>
  //         </Card.Body>
  //       </Card>

  //       {InvoiceModal()}
  //     </div>
  //   );
  // };

  // Billing History - Updated Version
// NOTE: Add these state declarations at the TOP of your BillingPage component:

/*
  const [billingHistoryFilter, setBillingHistoryFilter] = useState('All');
  const [billingHistorySearch, setBillingHistorySearch] = useState('');
*/

const renderBillingHistory = () => {
  const billingData = [
    { 
      id: 1, 
      paymentId: 'INV-10309',
      invoice: 'INV-10309', 
      amount: 'AED 5,300.71',
      paymentMethod: 'CHEQUE', 
      status: 'Completed', 
      date: '16-Dec-2025',
      dueDate: '16-Dec-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    
    { 
      id: 2, 
      paymentId: 'INV-10308',
      invoice: 'INV-10308', 
      amount: 'AED 3,008.25',
      paymentMethod: 'CHEQUE', 
      status: 'Pending', 
      date: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 3, 
      paymentId: 'INV-10307',
      invoice: 'INV-10307', 
      amount: 'AED 480.50',
      paymentMethod: 'BANK_TRANSFER', 
      status: 'Pending', 
      date: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 4, 
      paymentId: 'INV-10306',
      invoice: 'INV-10305', 
      amount: 'AED 1,774.50',
      paymentMethod: 'CHEQUE', 
      status: 'Completed', 
      date: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 5, 
      paymentId: 'INV-10305',
      invoice: 'INV-10305', 
      amount: 'AED 2,400.00',
      paymentMethod: 'BANK_TRANSFER', 
      status: 'Completed', 
      date: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 6, 
      paymentId: 'INV-10304',
      invoice: 'INV-10304', 
      amount: 'AED 2,384.40',
      paymentMethod: 'BANK_TRANSFER', 
      status: 'Completed', 
      date: '01-Nov-2025',
      dueDate: '01-Nov-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 7, 
      paymentId: 'INV-10303',
      invoice: 'INV-10303', 
      amount: 'AED 980.00',
      paymentMethod: 'AED 980.00', 
      status: 'Completed', 
      date: '26-Nov-2025',
      dueDate: '26-Nov-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 8, 
      paymentId: 'INV-10302',
      invoice: 'INV-10302', 
      amount: 'AED 980.00',
      paymentMethod: 'AED 980.00', 
      status: 'Completed', 
      date: '26-Nov-2025',
      dueDate: '26-Nov-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    },
    { 
      id: 9, 
      paymentId: 'INV-10301',
      invoice: 'INV-10301', 
      amount: 'AED 980.00',
      paymentMethod: 'AED 980.00', 
      status: 'Completed', 
      date: '26-Nov-2025',
      dueDate: '26-Nov-2025',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: '£17.99' }], 
      subtotal: '£17.99', 
      tax: '£0.00', 
      total: '£17.99' 
    }
  ];

  // Get counts for filter badges
  const allCount = billingData.length;
  const overdueCount = billingData.filter(item => item.status === 'Overdue').length;
  const pendingCount = billingData.filter(item => item.status === 'Pending').length;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      'Completed': { bg: 'success', text: 'white' },
      'Pending': { bg: 'warning', text: 'dark' },
      'Cancelled': { bg: 'danger', text: 'white' },
      'Unpaid': { bg: 'warning', text: 'dark' },
      'Overdue': { bg: 'danger', text: 'white' }
    };
    
    const config = statusConfig[status] || { bg: 'secondary', text: 'white' };
    
    return (
      <Badge 
        bg={config.bg} 
        text={config.text}
        style={{ 
          fontSize: '0.75rem', 
          padding: '0.35rem 0.75rem',
          fontWeight: '500'
        }}
      >
        {status}
      </Badge>
    );
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
                {selectedInvoice.items.map((item: any, index: number) => (
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
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="mb-1">Billing History</h2>
        <p className="text-muted mb-0">Manage your recurring services & renewals.</p>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col lg={9} className="mb-3 mb-lg-0">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant={billingHistoryFilter === 'All' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${billingHistoryFilter === 'All' ? 'bg-light' : ''}`}
                  onClick={() => setBillingHistoryFilter('All')}
                  style={{ 
                    fontWeight: billingHistoryFilter === 'All' ? '600' : '400',
                    color: billingHistoryFilter === 'All' ? '#212529' : '#6c757d'
                  }}
                >
                  All 
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {allCount}
                  </Badge>
                </Button>
                
                <Button
                  variant={billingHistoryFilter === 'Overdue' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${billingHistoryFilter === 'Overdue' ? 'bg-light' : ''}`}
                  onClick={() => setBillingHistoryFilter('Overdue')}
                  style={{ 
                    fontWeight: billingHistoryFilter === 'Overdue' ? '600' : '400',
                    color: billingHistoryFilter === 'Overdue' ? '#212529' : '#6c757d'
                  }}
                >
                  Overdue 
                  <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {overdueCount}
                  </Badge>
                </Button>

                <Button
                  variant={billingHistoryFilter === 'Pending' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${billingHistoryFilter === 'Pending' ? 'bg-light' : ''}`}
                  onClick={() => setBillingHistoryFilter('Pending')}
                  style={{ 
                    fontWeight: billingHistoryFilter === 'Pending' ? '600' : '400',
                    color: billingHistoryFilter === 'Pending' ? '#212529' : '#6c757d'
                  }}
                >
                  <FileText size={16} className="me-1" />
                  Pending 
                  <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {pendingCount}
                  </Badge>
                </Button>

                <Button
                  variant={billingHistoryFilter === 'Paid' ? 'light' : 'link'}
                  className={`custtabs text-decoration-none ${billingHistoryFilter === 'Paid' ? 'bg-light' : ''}`}
                  onClick={() => setBillingHistoryFilter('Paid')}
                  style={{ 
                    fontWeight: billingHistoryFilter === 'Paid' ? '600' : '400',
                    color: billingHistoryFilter === 'Paid' ? '#212529' : '#6c757d'
                  }}
                >
                  <FileText size={16} className="me-1" />
                  Paid
                  <ChevronRight size={14} className="ms-1" />
                </Button>
              </div>
            </Col>
            <Col lg={3}>
              <Form.Control 
                type="search" 
                placeholder="Search Invoices..." 
                value={billingHistorySearch}
                onChange={(e) => setBillingHistorySearch(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Billing History Table */}
      <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ minWidth: '1000px' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <tr>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Payment ID
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Invoice
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Amount
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Payment Method
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Status
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Date
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {billingData.map((item, index) => (
                  <tr 
                    key={item.id}
                    style={{ 
                      borderBottom: index === billingData.length - 1 ? 'none' : '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    className="align-middle"
                  >
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        {item.paymentId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {item.invoice}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {item.amount}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {item.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {item.date}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-2 view-receipt-btn "
                        style={{ color: '#0d6efd', fontSize: '0.85rem', textDecoration: 'none' }}
                        
                          onClick={() => { setSelectedInvoice(item); setShowInvoiceModal(true);
                          
                        }}
                      >
                        View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {InvoiceModal()}
    </div>
  );
};

const renderInvoices = () => {
  // Sample invoice data
  const invoicesData = [
    { 
      id: 1, 
      invoice: 'INV-10309',
      invoiceRef: 'INV-10309',
      date: '15-Dec-2025',
      invoiceDate: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      amount: 'AED 5,300.71',
      total: 'AED 5,300.71',
      paid: 'AED 5,300.71',
      balanceDue: 'AED 5,300.71',
      status: 'Overdue',
      items: [{ name: 'UCASS Gateway', quantity: 1, price: 'AED 5,300.71' }],
      subtotal: 'AED 5,048.30',
      tax: 'AED 252.41',
      paymentMethod: 'Card ****4242'
    },
    { 
      id: 2, 
      invoice: 'INV-10308',
      invoiceRef: 'INV-10308',
      date: '15-Dec-2025',
      invoiceDate: '15-Dec-2025',
      dueDate: '15-Dec-2025',
      amount: 'AED 2,008.25',
      total: 'AED 2,008.25',
      paid: 'AED 88.35',
      balanceDue: 'AED 88.95',
      status: 'Pending',
      items: [{ name: 'Microsoft Defender', quantity: 1, price: 'AED 2,008.25' }],
      subtotal: 'AED 1,912.62',
      tax: 'AED 95.63',
      paymentMethod: 'Card ****4242'
    },
    { 
      id: 3, 
      invoice: 'INV-10307',
      invoiceRef: 'INV-10307',
      date: '12-Dec-2025',
      invoiceDate: '12-Dec-2025',
      dueDate: '24-Nov-2025',
      amount: 'AED 480.50',
      total: 'AED 480.50',
      paid: 'AED 490.50',
      balanceDue: 'AED 480.50',
      status: 'Pending',
      items: [{ name: 'Exchange Online', quantity: 1, price: 'AED 480.50' }],
      subtotal: 'AED 457.62',
      tax: 'AED 22.88',
      paymentMethod: 'Bank Transfer'
    },
    { 
      id: 4, 
      invoice: 'INV-10306',
      invoiceRef: 'INV-10306',
      date: '12-Dec-2025',
      invoiceDate: '12-Dec-2025',
      dueDate: '15-Dec-2025',
      amount: 'AED 1,774.50',
      total: 'AED 1,774.50',
      paid: 'AED 1,774.50',
      balanceDue: 'AED 2400.00',
      status: 'Due as.. Today',
      items: [{ name: 'Windows Server 2022', quantity: 1, price: 'AED 1,774.50' }],
      subtotal: 'AED 1,690.00',
      tax: 'AED 84.50',
      paymentMethod: 'Card ****4242'
    },
    { 
      id: 5, 
      invoice: 'INV-10305',
      invoiceRef: 'INV-10305',
      date: '12-Dec-2025',
      invoiceDate: '12-Dec-2025',
      dueDate: '15-Dec-2025',
      amount: 'AED 2,300.00',
      total: 'AED 2,300.00',
      paid: 'AED 2,330.00',
      balanceDue: 'AED 1,200.40',
      status: 'Partially Paid',
      items: [{ name: 'UCaaS-Firewall 90G1', quantity: 1, price: 'AED 2,300.00' }],
      subtotal: 'AED 2,190.48',
      tax: 'AED 109.52',
      paymentMethod: 'Bank Transfer'
    },
    { 
      id: 6, 
      invoice: 'INV-10304',
      invoiceRef: 'INV-10304',
      date: '01-Dec-2025',
      invoiceDate: '01-Dec-2025',
      dueDate: '01-Dec-2025',
      amount: 'AED 2,384.40',
      total: 'AED 2,384.40',
      paid: 'AED 2,384.40',
      balanceDue: 'AED 2,384.40',
      status: 'Partially Paid',
      items: [{ name: 'Exchange Online Archiving', quantity: 1, price: 'AED 2,384.40' }],
      subtotal: 'AED 2,270.86',
      tax: 'AED 113.54',
      paymentMethod: 'Card ****4242'
    },
    { 
      id: 7, 
      invoice: 'INV-10303',
      invoiceRef: 'INV-10303',
      date: '26-Nov-2025',
      invoiceDate: '26-Nov-2025',
      dueDate: '26-Nov-2025',
      amount: 'AED 980.00',
      total: 'AED 980.00',
      paid: 'AED 980.00',
      balanceDue: 'AED 0.00',
      status: 'Paid',
      items: [{ name: 'Veeam Data Platform', quantity: 1, price: 'AED 980.00' }],
      subtotal: 'AED 933.33',
      tax: 'AED 46.67',
      paymentMethod: 'Bank Transfer'
    },
    { 
      id: 8, 
      invoice: 'INV-10302',
      invoiceRef: 'INV-10302',
      date: '26-Nov-2025',
      invoiceDate: '26-Nov-2025',
      dueDate: '26-Nov-2025',
      amount: 'AED 980.00',
      total: 'AED 980.00',
      paid: 'AED 980.00',
      balanceDue: 'AED 960.00',
      status: 'Pending',
      items: [{ name: 'Microsoft 365 Business', quantity: 1, price: 'AED 980.00' }],
      subtotal: 'AED 933.33',
      tax: 'AED 46.67',
      paymentMethod: 'Card ****4242'
    }
  ];

  // Calculate summary stats
  const totalOutstanding = 'AED 56,982.12';
  const overdueAmount = 'AED 14,250.00';
  const overdueCount = invoicesData.filter(inv => inv.status === 'Overdue').length;
  const pendingCount = invoicesData.filter(inv => inv.status === 'Pending').length;
  const paidCount = invoicesData.filter(inv => inv.status === 'Paid').length;
  const balanceDue = 'AED 43,000.00';

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Paid': { bg: 'success', text: 'white' },
      'Pending': { bg: 'warning', text: 'dark' },
      'Partially Paid': { bg: 'info', text: 'white' },
      'Overdue': { bg: 'danger', text: 'white' },
      'Due as.. Today': { bg: 'warning', text: 'dark' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'secondary', text: 'white' };
    
    return (
      <Badge 
        bg={config.bg} 
        text={config.text}
        style={{ 
          fontSize: '0.75rem', 
          padding: '0.35rem 0.75rem',
          fontWeight: '500'
        }}
      >
        {status}
      </Badge>
    );
  };

  const InvoiceDetailModal = () => {
    if (!selectedInvoice) return null;

    return (
      <Modal show={showInvoiceDetailModal} onHide={() => setShowInvoiceDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex justify-content-between align-items-start w-100">
              <div>
                <h5 className="mb-1">Invoice Details</h5>
                <p className="text-muted mb-0 small">Invoice #{selectedInvoice.invoiceRef}</p>
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
                <h6 className="mb-1">ACME TRADING LLC</h6>
                <p className="text-muted mb-0 small">
                  UNIT TO: 33C-4, THE DXWR TOIWIHT<br />
                  JUMEIRAH LAKES TOWERS, DUBAI
                </p>
              </Col>
              <Col md={6}>
                <h6 className="text-muted mb-2">Bill To</h6>
                <h6 className="mb-1">John Doe</h6>
                <p className="text-muted mb-0 small">
                  123 Business Street<br />
                  London, SW1A 1AA
                </p>
              </Col>
            </Row>
          </div>

          <div className="mb-4 pb-4 border-bottom">
            <Row>
              <Col xs={6} md={3}>
                <p className="text-muted mb-1 small">Invoice Date</p>
                <p className="fw-semibold mb-0">{selectedInvoice.invoiceDate}</p>
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
                <p className="fw-semibold mb-0">#{selectedInvoice.invoiceRef}</p>
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
              <Col xs={6}><p className="mb-0 text-muted">Tax (5%):</p></Col>
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
          <Button variant="outline-secondary" onClick={() => setShowInvoiceDetailModal(false)}>Close</Button>
          <Button variant="primary"><Download size={16} className="me-2" />Download PDF</Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4">
        <h2 className="mb-1">Invoices</h2>
        <p className="text-muted mb-0">Manage your recurring services & renewals.</p>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="mb-4" style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col lg={9} className="mb-3 mb-lg-0">
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  variant={invoiceFilter === 'All' ? 'light' : 'link'}
                  className={`text-decoration-none ${invoiceFilter === 'All' ? 'bg-light' : ''}`}
                  onClick={() => setInvoiceFilter('All')}
                  style={{ 
                    fontWeight: invoiceFilter === 'All' ? '600' : '400',
                    color: invoiceFilter === 'All' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  All 
                  <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {invoicesData.length}
                  </Badge>
                </Button>
                
                <Button
                  variant={invoiceFilter === 'Overdue' ? 'light' : 'link'}
                  className={`text-decoration-none ${invoiceFilter === 'Overdue' ? 'bg-light' : ''}`}
                  onClick={() => setInvoiceFilter('Overdue')}
                  style={{ 
                    fontWeight: invoiceFilter === 'Overdue' ? '600' : '400',
                    color: invoiceFilter === 'Overdue' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Overdue 
                  <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {overdueCount}
                  </Badge>
                </Button>

                <Button
                  variant={invoiceFilter === 'Pending' ? 'light' : 'link'}
                  className={`text-decoration-none ${invoiceFilter === 'Pending' ? 'bg-light' : ''}`}
                  onClick={() => setInvoiceFilter('Pending')}
                  style={{ 
                    fontWeight: invoiceFilter === 'Pending' ? '600' : '400',
                    color: invoiceFilter === 'Pending' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Pending 
                  <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7rem' }}>
                    {pendingCount}
                  </Badge>
                </Button>

                <Button
                  variant={invoiceFilter === 'Paid' ? 'light' : 'link'}
                  className={`text-decoration-none ${invoiceFilter === 'Paid' ? 'bg-light' : ''}`}
                  onClick={() => setInvoiceFilter('Paid')}
                  style={{ 
                    fontWeight: invoiceFilter === 'Paid' ? '600' : '400',
                    color: invoiceFilter === 'Paid' ? '#212529' : '#6c757d',
                    padding: '0.5rem 1rem'
                  }}
                >
                  Paid
                  <ChevronRight size={14} className="ms-1" />
                </Button>
              </div>
            </Col>
            <Col lg={3}>
              <Form.Control 
                type="search" 
                placeholder="Search invoices..." 
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Invoices Table */}
      <Card style={{ border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ minWidth: '1200px' }}>
              <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <tr>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Invoice Ref
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Invoice Date
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Due Date
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Total
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Paid
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Balance Due
                    <ChevronRight size={14} className="ms-1" style={{ opacity: 0.5 }} />
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Status
                  </th>
                  <th className="py-3 px-4" style={{ fontWeight: '600', fontSize: '0.85rem', color: '#495057' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoicesData.map((invoice, index) => (
                  <tr 
                    key={invoice.id}
                    style={{ 
                      borderBottom: index === invoicesData.length - 1 ? 'none' : '1px solid #f0f0f0',
                      transition: 'background-color 0.2s'
                    }}
                    className="align-middle"
                  >
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        {invoice.invoiceRef}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {invoice.invoiceDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {invoice.dueDate}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        {invoice.total}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                        {invoice.paid}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#212529' }}>
                        {invoice.balanceDue}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="py-3 px-4">
                      {invoice.status === 'Paid' ? (
                        <Button 
                          variant="light" 
                          size="sm"
                          style={{ 
                            backgroundColor: '#e9ecef',
                            borderColor: '#dee2e6',
                            color: '#212529',
                            fontSize: '0.85rem',
                            padding: '0.375rem 0.75rem',
                            fontWeight: '500'
                          }}
                          onClick={() => { 
                            setSelectedInvoice(invoice); 
                            setShowInvoiceDetailModal(true);
                          }}
                        >
                          View
                        </Button>
                      ) : (
                        <Button 
                          variant="info" 
                          size="sm"
                          style={{ 
                            backgroundColor: '#5bc0de', 
                            borderColor: '#5bc0de', 
                            color: 'white',
                            fontSize: '0.85rem',
                            padding: '0.375rem 0.75rem'
                          }}
                        >
                          Pay Now
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

      {InvoiceDetailModal()}
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
          {activeScreen === 'invoices' && renderInvoices()}
          {activeScreen === 'payment-method' && renderPaymentMethods()}
        </div>
      </div>
    </div>
    </>
  );
};

export default BillingPage;