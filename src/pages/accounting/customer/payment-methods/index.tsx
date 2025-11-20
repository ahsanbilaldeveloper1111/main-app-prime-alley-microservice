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

const PaymentMethods = () => {


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
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      {/* <PageHeader
        title="Customer Dashboard"
        showSearch={false}
      /> */}

      {renderPaymentMethods()}

      

    </React.Fragment>
  );
};

PaymentMethods.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default PaymentMethods;
