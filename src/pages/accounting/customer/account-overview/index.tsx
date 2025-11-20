import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import CompanyLogo2 from "@assets/images/Prime3.png";
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

const AccountOverview = () => {

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
                  <img src={CompanyLogo2.src} alt="logo" className="img-fluid" style={{marginTop: '21px',maxWidth: '200px'}} />
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


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Customer Dashboard"
        showSearch={false}
      /> */}

      {renderAccountOverview()}

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

    </React.Fragment>
  );
};

AccountOverview.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AccountOverview;
