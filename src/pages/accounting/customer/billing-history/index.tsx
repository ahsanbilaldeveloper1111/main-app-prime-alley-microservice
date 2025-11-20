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

const BillingHistory = () => {


  const [billingFilter, setBillingFilter] = useState('All');
  const [billingSearch, setBillingSearch] = useState('');

  const [showBillingEditModal, setShowBillingEditModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Customer Dashboard"
        showSearch={false}
      /> */}

      {renderBillingHistory()}


      

    </React.Fragment>
  );
};

BillingHistory.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default BillingHistory;
