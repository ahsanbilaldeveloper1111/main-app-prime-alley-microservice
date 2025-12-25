import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import { useState } from 'react';
import { Card, Row, Col, Button, Badge, Form, Modal } from 'react-bootstrap';
import { ChevronRight, Clock, DollarSign, Edit, FileText, Wallet, Users, Mail, Phone, User, Package, Check, TrendingUp } from 'lucide-react';
import { formatNumber } from "@utils/Helper";

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import countries from "world-countries";

import { GetCompanyDetails,GetPaymentMethods,UpdateCompanyDetails,GetDashboardCounters } from "@utils/accounting";
import ThemeSelect from "@components/ThemeSelect";
import { toast } from "react-toastify";

const AccountOverview = () => {

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

  const [billingInfo, setBillingInfo] = useState<any>({
    name: '',
    email: '',
    phone: '',
    country: '',
    profile: {
      address: '',
      postal_code: ''
    },
  });

  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const getCompanyDetails = async () => {
    const response = await GetCompanyDetails() as any;
    setCompanyDetails(response);
  };

  useEffect(() => {
    getCompanyDetails();
  }, []);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  useEffect(() => {
    getPaymentMethods();
  }, []);
  const getPaymentMethods = async () => {
    const response = await GetPaymentMethods() as any;
    setPaymentMethods(response?.payment_methods || []);
  };

  const [showBillingEditModal, setShowBillingEditModal] = useState(false);
  const [showManageAccountModal, setShowManageAccountModal] = useState(false);

  // Initialize billingInfo when modal opens or companyDetails changes
  useEffect(() => {
    if (companyDetails && showBillingEditModal) {
      setBillingInfo({
        name: companyDetails.name || '',
        email: companyDetails.email || '',
        phone: companyDetails.phone || '',
        country: companyDetails.country || companyDetails.profile?.country || '',
        profile: {
          address: companyDetails.profile?.address || '',
          postal_code: companyDetails.profile?.postal_code || ''
        }
      });
    }
  }, [companyDetails, showBillingEditModal]);

  const countryOptions = useMemo(
    () =>
        countries.map((country: any) => ({
            value: country.name.common,
            label: country.name.common,
        })),
    [],
);

  const handleSaveBillingInfo = async () => {
    setShowBillingEditModal(false);
    //toast.error('Todo: Need api for update billing details');
    return false;
    const response = await UpdateCompanyDetails(billingInfo) as any;
    if(response){
      toast.success('Billing information updated successfully');
      setShowBillingEditModal(false);
    }else{
      toast.error('Failed to update billing information');
      setShowBillingEditModal(false);
    }
  };


  const [dashboardCounters, setDashboardCounters] = useState<any>(null);
  useEffect(() => {
    getDashboardCounters();
  }, []);
  const getDashboardCounters = async () => {
    const response = await GetDashboardCounters() as any;
    setDashboardCounters(response);
  };


  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Account Overview" />

      <PageHeader
        title="Account Overview"
        description="Here's what's happening with your account today."
        showSearch={false}
      />

<div>
         
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
                  <h5 className="mb-1" style={{ fontWeight: '600', fontSize: '1.1rem' }}>{companyDetails?.name}</h5>
                  <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                  {companyDetails?.profile?.address}
                  </p>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => setShowManageAccountModal(true)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                >
                  <Edit size={12} className="me-1" />
                  Edit
                </Button>
              </div>

              <div className="p-2 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f8f9fa' }}>
                <div>
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Total Invoice Amount</small>
                  <h4 className="mb-0" style={{ fontWeight: '700', fontSize: '1.5rem' }}>{companyDetails?.profile?.currency} {formatNumber(dashboardCounters?.invoices?.total_amount)}</h4>
                  <small className="text-muted">(Inclusive VAT)</small>
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
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{companyDetails?.profile?.currency} {formatNumber(companyDetails?.profile?.credit_limit)}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-2">
                <small className="text-muted" style={{ fontSize: '0.8rem' }}>Pending</small>
                <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>{companyDetails?.profile?.currency} {formatNumber(companyDetails?.profile?.outstanding_invoices)}</span>
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
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                {companyDetails?.profile?.tax_id || 'N/A'}
                </span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>VAT Rate</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                {companyDetails?.profile?.vat_rate} %
                </span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center py-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Exemption</small>
                <Badge bg="secondary" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                {companyDetails?.profile?.vat_exemption ? 'Yes' : 'No'}
                </Badge>
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
                <User size={12} style={{ color: '#3b82f6' }} />
                <p className="mb-0 text-truncate flex-grow-1 text-capitalize" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                {companyDetails?.name}
                </p>
              </div>
              
              <div className="d-flex align-items-center gap-2 py-1 border-bottom">
                <Mail size={12} style={{ color: '#3b82f6' }} />
                <p className="mb-0 text-truncate flex-grow-1 text-lowercase" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                {companyDetails?.email}
                </p>
              </div>

              <div className="d-flex align-items-center gap-2 py-1">
                <Phone size={12} style={{ color: '#3b82f6' }} />
                <p className="mb-0 flex-grow-1" style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                {companyDetails?.phone}
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
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                Net {companyDetails?.profile?.payment_terms} days
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Late Fee</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                {formatNumber(companyDetails?.profile?.late_fee_rule)}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Payment Mode</small>
                <span className="fw-semibold text-capitalize" style={{ fontSize: '0.8rem' }}>
                {companyDetails?.profile?.payment_mode?.replace('_', ' ')}
                </span>
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

              {paymentMethods?.map((method: any) => (
                    <div key={method.id}>
                      {method.is_default ===true && (
                        <>
                        

                        <div className="d-flex justify-content-between align-items-center py-1 border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Card</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>•••• {method.card?.last4}</span>
              </div>

                        
                        <div className="d-flex justify-content-between align-items-center py-1border-bottom">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Card Type</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                {method.card?.brand}
                </span>
              </div>

                        <div className="d-flex justify-content-between align-items-center py-1">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Expiry</small>
                <span className="fw-semibold" style={{ fontSize: '0.8rem' }}>
                {method.card?.exp_month}/{method.card?.exp_year}
                </span>
              </div>
                        </>
                      )}
                    </div>
                  ))}
              
              

              
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

         
        </div>
     
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
                    <ThemeSelect 
                    value={(() => {
                      const countryValue = billingInfo.country || companyDetails?.country || companyDetails?.profile?.country || '';
                      if (!countryValue) return null;
                      const selectedCountry = countryOptions.find((opt: any) => 
                        opt.value === countryValue || 
                        opt.value?.toLowerCase() === countryValue?.toLowerCase()?.trim() ||
                        opt.label?.toLowerCase() === countryValue?.toLowerCase()?.trim()
                      );
                      return selectedCountry || null;
                    })()}
                    onChange={(e: any) => setBillingInfo({ ...billingInfo, country: e?.value || e?.label || '' })}
                     options={countryOptions} />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      type="text"
                      value={billingInfo.profile?.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, profile: { ...billingInfo.profile, address: e.target.value } })}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Postcode *</Form.Label>
                    <Form.Control
                      type="text"
                      value={billingInfo.profile?.postal_code}
                      onChange={(e) => setBillingInfo({ ...billingInfo, profile: { ...billingInfo.profile, postal_code: e.target.value } })}
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
            <Button variant="primary" onClick={() => handleSaveBillingInfo()}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

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
                
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Billing Address</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={2}
                  value={billingInfo.profile?.address}
                  onChange={(e) => setBillingInfo({...billingInfo, profile: { ...billingInfo.profile, address: e.target.value } })}
                />
              </Form.Group>
            </Form>
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
