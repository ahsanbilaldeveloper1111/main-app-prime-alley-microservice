import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useEffect,
  useMemo,
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
import countries from "world-countries";

import { GetCompanyDetails,GetPaymentMethods,UpdateCompanyDetails } from "@utils/accounting";
import ThemeSelect from "@components/ThemeSelect";
import { toast } from "react-toastify";
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



  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Account Overview" />

      <PageHeader
        title="Account Overview"
        description="Manage your account and billing details"
        showSearch={false}
      />

<div>
         
          <Row className="mb-4">
            <Col lg={7} className="mb-4">
              <Card style={{ minHeight: '274px' }}>
                <Card.Body>
                  {/* <h5 className="fw-semibold mb-2">RingEdge Account</h5> */}
                  {/* <img src={CompanyLogo2.src} alt="logo" className="img-fluid" style={{marginTop: '21px',maxWidth: '200px'}} /> */}
                  <h5 className="fw-semibold mb-2 text-capitalize">{companyDetails?.name}</h5>
                  <div className="mb-5">
                    {/* <Badge bg="secondary" pill className="px-3 py-2 me-2">Trial</Badge>
                    <Badge bg="primary" pill className="px-3 py-2">Upgrade</Badge> */}
                    <p className="text-muted mb-0 small">{companyDetails?.profile?.address}</p>
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
                  <h6 className="text-muted mb-3">Open Invoice Amount</h6>
                  <h2 className="mb-1">£17.99</h2>
                  <small className="text-muted">(Inclusive VAT)</small>
                  
                  <hr />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Account credit limit</span>
                    <span>{companyDetails?.profile?.currency} {companyDetails?.profile?.credit_limit}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Outstanding invoices</span>
                    <span>{companyDetails?.profile?.currency} {companyDetails?.profile?.outstanding_invoices}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
  
          <Row>

          <Col md={6} lg={3} className="mb-3">
              <Card className='billing-details-cards'>
                <Card.Body>
                  <h6 className="text-muted mb-2">Tax information</h6>
                  <p className="mb-1"><small className="text-muted">VAT number</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.profile?.tax_id || 'N/A'}</p>

                  <p className="mb-1"><small className="text-muted">VAT Rate (%)</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.profile?.vat_rate || 'N/A'}</p>

                  <p className="mb-1"><small className="text-muted">VAT Exemption</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.profile?.vat_exemption ? 'Yes' : 'No'}</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
              <Card className='billing-details-cards'>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="text-muted mb-0">Billing contact</h6>
                    {/* <Button variant="link" size="sm" className="p-0" onClick={() => setShowBillingEditModal(true)}>
                      <Edit size={16} />
                    </Button> */}
                  </div>
                  <p className="mb-1"><small className="text-muted">Name</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.name}</p>

                  <p className="mb-1"><small className="text-muted">Email</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.email}</p>

                  <p className="mb-1"><small className="text-muted">Phone</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.phone}</p>
                </Card.Body>
              </Card>
            </Col>


            <Col md={6} lg={3} className="mb-3">
              <Card className='billing-details-cards'>
                <Card.Body>
                  <h6 className="text-muted mb-2">Terms & Rules</h6>
                  <p className="mb-1"><small className="text-muted">Payment Terms (Days)</small></p>
                  <p className="fw-semibold mb-1">Net {companyDetails?.profile?.payment_terms} days</p>
                  <p className="mb-1"><small className="text-muted">Payment Mode</small></p>
                  <p className="fw-semibold mb-1 text-capitalize">{companyDetails?.profile?.payment_mode?.replace('_', ' ')}</p>
                  <p className="mb-1"><small className="text-muted">Late Fee Rule</small></p>
                  <p className="fw-semibold mb-1">{companyDetails?.profile?.late_fee_rule}</p>
                </Card.Body>
              </Card>
            </Col>
            {paymentMethods?.length > 0 && (
            <Col md={6} lg={3} className="mb-3">
              <Card className='billing-details-cards'>
                <Card.Body>
                  <h6 className="text-muted mb-2">Payment method</h6>
                  
                   {paymentMethods?.map((method: any) => (
                    <div key={method.id}>
                      {method.is_default ===true && (
                        <>
                        <p className="mb-1"><small className="text-muted">Card number</small></p>
                        <p className="fw-semibold mb-1">•••• {method.card?.last4}</p>

                        {/* <p className="fw-semibold">{method.card?.brand}</p> */}
                        <p className="mb-1"><small className="text-muted">Card Type</small></p>
                        <p className="fw-semibold mb-1 text-capitalize">{method.card?.brand}</p>

                        <p className="mb-1"><small className="text-muted">Exp</small></p>
                        <p className="fw-semibold mb-1">{method.card?.exp_month}/{method.card?.exp_year}</p>
                        </>
                      )}
                    </div>
                  ))}
                  
                </Card.Body>
              </Card>
            </Col>
            )}

            
            
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
