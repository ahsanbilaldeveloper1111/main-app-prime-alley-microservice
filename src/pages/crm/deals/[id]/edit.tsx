import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  updateDeal,
  getDeal,
  getStages,
  getCrmProducts,
  createEstimate,
  CrmProduct,
  StageData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Badge, Table, Modal } from "react-bootstrap";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, FileText, Plus, Edit, Trash2, Package, History, Calendar, RefreshCw } from "lucide-react";
import Select from 'react-select';
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug } from '@utils/Helper';
import { convertCurrency, formatCurrency } from '@utils/currency';

const EditDeal = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  const [negotiationBar, setNegotiationBar] = useState(0);
  const [probability, setProbability] = useState(0);
  const isInitialLoad = useRef(true);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [estimationItems, setEstimationItems] = useState<Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
  });
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] = useState(false);
  const [convertingPrice, setConvertingPrice] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    ticket_id: null as number | null,
    stage_id: undefined as number | undefined,
    assigned_to: null as string | null,
    expected_close_date: "",
    company_name: "",
    industry: "",
    decision_maker_title: "",
    decision_maker_name: "",
    decision_maker_phone_country_code: "",
    decision_maker_phone: "",
    decision_maker_email: "",
    deal_type: "",
    contract_length: "",
    contract_length_custom: "",
    billing_model: "",
    payment_terms: "",
    payment_terms_custom: "",
    risk_level: "",
    competitors: "",
    quotation_sent: false,
    contract_sent: false,
    contract_received: false,
    follow_up_date: "",
    currency: "USD",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  });

  useEffect(() => {
    fetchStages();
    fetchExtensions();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getCrmProducts({ per_page: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const fetchDealData = async () => {
      if (!router.isReady || !id || isInitialLoad.current === false) return;
      
      try {
        setFetching(true);
        const deal = await getDeal(Number(id));
        
        // Format dates for input fields
        const formatDate = (dateString: string | null) => {
          if (!dateString) return "";
          return dateString.split('T')[0];
        };

        setFormData({
          name: deal.name || "",
          ticket_id: deal.ticket_id ? Number(deal.ticket_id) : null,
          stage_id: deal.stage_id ? Number(deal.stage_id) : undefined,
          assigned_to: deal.assigned_to || null,
          expected_close_date: formatDate(deal.expected_close_date),
          company_name: deal.company_name || "",
          industry: deal.industry || "",
          decision_maker_title: deal.decision_maker_title || "",
          decision_maker_name: deal.decision_maker_name || (deal as any).main_decision_maker?.name || "",
          decision_maker_phone_country_code: deal.decision_maker_phone_country_code || (deal as any).main_decision_maker?.phone_country_code || "",
          decision_maker_phone: deal.decision_maker_phone || (deal as any).main_decision_maker?.phone || "",
          decision_maker_email: (deal as any).main_decision_maker?.email || "",
          deal_type: deal.deal_type || "",
          contract_length: deal.contract_length || "",
          contract_length_custom: deal.contract_length_custom || "",
          billing_model: deal.billing_model || "",
          payment_terms: deal.payment_terms || "",
          payment_terms_custom: deal.payment_terms_custom || "",
          risk_level: deal.risk_level || "",
          competitors: deal.competitors || "",
          quotation_sent: deal.quotation_sent || false,
          contract_sent: deal.contract_sent || false,
          contract_received: deal.contract_received || false,
          follow_up_date: formatDate(deal.follow_up_date),
          currency: deal.currency || "USD",
          tax_percentage: (deal as any).tax_percentage?.toString() || "0",
          standard_discount_percentage: (deal as any).standard_discount_percentage?.toString() || "0",
          special_discount_percentage: (deal as any).special_discount_percentage?.toString() || "0",
        });

        // Set additional data
        // Sort estimates by created_at date (newest first) to ensure latest revision is always first
        const sortedEstimates = deal.estimates && deal.estimates.length > 0
          ? [...deal.estimates].sort((a: any, b: any) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA; // Sort descending (newest first)
            })
          : [];
        setEstimates(sortedEstimates);
        setAttachments((deal as any).attachments || []);
        setHistories((deal as any).histories || []);
        setNegotiationBar(deal.negotiation_bar || 0);
        setProbability(deal.probability || 0);

        // Load estimation chart from the most recent estimate or deal
        if (sortedEstimates.length > 0) {
          // Get the latest estimate (first in sorted array)
          const latestEstimate = sortedEstimates[0];
          
          // Load tax and discount percentages from the latest estimate
          if (latestEstimate.tax_percentage) {
            setFormData(prev => ({ ...prev, tax_percentage: latestEstimate.tax_percentage.toString() }));
          }
          if (latestEstimate.standard_discount_percentage) {
            setFormData(prev => ({ ...prev, standard_discount_percentage: latestEstimate.standard_discount_percentage.toString() }));
          }
          if (latestEstimate.special_discount_percentage) {
            setFormData(prev => ({ ...prev, special_discount_percentage: latestEstimate.special_discount_percentage.toString() }));
          }
          
          if (latestEstimate.estimation_chart && latestEstimate.estimation_chart.length > 0) {
            setEstimationItems(latestEstimate.estimation_chart.map((item: any) => ({
              product_id: item.product_id || 0,
              product_service: item.product_service || "",
              description: item.description || "",
              qty: item.qty || 1,
              unit_price: item.unit_price || 0,
              original_currency: item.original_currency || deal.currency || "USD",
              original_price: item.original_price || item.unit_price || 0,
            })));
          } else {
            // If latest estimate has no items, clear estimation items
            setEstimationItems([]);
          }
        } else if (deal.estimation_chart && Array.isArray(deal.estimation_chart) && deal.estimation_chart.length > 0) {
          setEstimationItems(deal.estimation_chart.map((item: any) => ({
            product_id: item.product_id || 0,
            product_service: item.product_service || "",
            description: item.description || "",
            qty: item.qty || 1,
            unit_price: item.unit_price || 0,
            original_currency: item.original_currency || deal.currency || "USD",
            original_price: item.original_price || item.unit_price || 0,
          })));
        }
        
        isInitialLoad.current = false;
      } catch (error) {
        console.error("Failed to fetch deal:", error);
        toast.error("Failed to load deal data");
        router.push("/crm/deals");
      } finally {
        setFetching(false);
      }
    };

    fetchDealData();
  }, [router.isReady, id, router]);

  const fetchStages = async () => {
    try {
      const stagesData = await getStages('deal');
      setStages(stagesData || []);
    } catch (error) {
      console.error("Failed to fetch stages:", error);
    }
  };

  const fetchExtensions = async () => {
    try {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DEALS);
      if (hierarchyData?.extensions) {
        setExtensions(hierarchyData.extensions);
      }
    } catch (error) {
      console.error("Failed to fetch extensions:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formStep < 4) {
      setFormStep(formStep + 1);
      return;
    }

    if (!id) return;

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        stage_id: formData.stage_id,
        assigned_to: formData.assigned_to,
        expected_close_date: formData.expected_close_date,
        company_name: formData.company_name,
        industry: formData.industry,
        decision_maker_title: formData.decision_maker_title,
        decision_maker_name: formData.decision_maker_name,
        decision_maker_phone_country_code: formData.decision_maker_phone_country_code,
        decision_maker_phone: formData.decision_maker_phone,
        decision_maker_email: formData.decision_maker_email,
        deal_type: formData.deal_type,
        contract_length: formData.contract_length,
        contract_length_custom: formData.contract_length_custom || "",
        billing_model: formData.billing_model,
        payment_terms: formData.payment_terms,
        payment_terms_custom: formData.payment_terms_custom || "",
        risk_level: formData.risk_level,
        competitors: formData.competitors || "",
        quotation_sent: formData.quotation_sent,
        contract_sent: formData.contract_sent,
        contract_received: formData.contract_received,
        follow_up_date: formData.follow_up_date || "",
        currency: formData.currency,
        negotiation_bar: negotiationBar,
        probability: probability,
      };

      if (formData.ticket_id) {
        payload.ticket_id = formData.ticket_id;
      }

      // Update deal first
      await updateDeal(Number(id), payload);

      // Create/update estimation chart separately if items exist
      if (estimationItems.length > 0) {
        const estimatePayload = {
          deal_id: Number(id),
          estimation_chart: estimationItems.map(item => ({
            product_id: item.product_id,
            product_service: item.product_service,
            description: item.description || "",
            qty: item.qty,
            unit_price: item.unit_price,
            original_currency: item.original_currency || formData.currency,
            original_price: item.original_price || item.unit_price,
          })),
          standard_discount_percentage: parseFloat(formData.standard_discount_percentage || "0"),
          special_discount_percentage: parseFloat(formData.special_discount_percentage || "0"),
          tax_percentage: parseFloat(formData.tax_percentage || "0"),
          currency: formData.currency,
        };

        await createEstimate(estimatePayload);
      }

      toast.success("Deal updated successfully!");
      router.push("/crm/deals");
    } catch (error: any) {
      console.error("Failed to update deal:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <React.Fragment>
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Deals"
        />
        <div className="text-center py-5">
          <p>Loading deal data...</p>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Deals"
      />
      <div className="container-fluid">
        {/* Edit Deal Form */}
        <div className="row">
          <div className="col-12">
            <Card className="border-0 shadow-sm">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 app-heading">Deal Information</h4>
                  <Link href="/crm/deals">
                    <Button variant="outline-secondary" size="sm">
                      <ArrowLeft size={16} className="me-2" />
                      Back to Deals
                    </Button>
                  </Link>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
          {/* Timeline Navigation - Same as create page */}
          <div className="mb-4">
            <div className="d-flex align-items-center justify-content-between position-relative">
              <div 
                className="position-absolute bg-light" 
                style={{ 
                  left: '0', 
                  right: '0', 
                  top: '20px', 
                  height: '2px', 
                  zIndex: 0 
                }}
              />
              <div 
                className="position-absolute bg-primary" 
                style={{ 
                  left: '0', 
                  top: '20px', 
                  height: '2px', 
                  width: `${(formStep / 4) * 100}%`,
                  zIndex: 0,
                  transition: 'width 0.3s ease'
                }}
              />
              
              {[0, 1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className="text-center position-relative" 
                  style={{ cursor: 'pointer', flex: 1 }}
                  onClick={() => setFormStep(step)}
                >
                  <div 
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                    style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                  >
                    {formStep > step ? <CheckCircle size={20} /> : step + 1}
                  </div>
                  <small className={`d-block mt-2 ${formStep === step ? 'fw-bold text-primary' : 'text-muted'}`}>
                    {step === 0 ? 'Deal Info' : step === 1 ? 'Company Info' : step === 2 ? 'Characteristics' : step === 3 ? 'Progress & Notes' : 'Estimation'}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content - Same structure as create page */}
          <div style={{ minHeight: '400px' }}>
            {/* Step 0: Deal Information */}
            {formStep === 0 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-primary">DEAL INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Deal Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter deal name" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stage <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.stage_id || ''}
                          onChange={(e) => setFormData({ ...formData, stage_id: e.target.value ? Number(e.target.value) : undefined })}
                          required
                        >
                          <option value="">Select Stage</option>
                          {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                              {stage.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Expected Close Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="date" 
                          value={formData.expected_close_date}
                          onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Assigned to <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.assigned_to || ''}
                          onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                          required
                        >
                          <option value="">Select User</option>
                          {extensions.map((ext: any) => (
                            <option key={ext.id || ext.extension} value={ext.id || ext.extension}>
                              {ext.display_name || ext.name || ext.id}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {/* <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Probability</Form.Label>
                        <div className="d-flex align-items-center gap-2">
                          <Form.Range 
                            value={probability}
                            onChange={(e) => setProbability(Number(e.target.value))}
                            style={{ flex: 1 }} 
                          />
                          <Badge bg="primary" style={{ minWidth: '60px' }}>{probability}%</Badge>
                        </div>
                        <Form.Text className="text-muted">Likelihood of closing this deal</Form.Text>
                      </Form.Group>
                    </Col> */}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.currency}
                          onChange={async (e) => {
                            const newCurrency = e.target.value;
                            setFormData({ ...formData, currency: newCurrency });
                            
                            // Convert all existing estimation items to new currency
                            if (estimationItems.length > 0) {
                              try {
                                setConvertingPrice(true);
                                const convertedItems = await Promise.all(
                                  estimationItems.map(async (item) => {
                                    const product = products.find(p => p.id === item.product_id);
                                    if (product) {
                                      const productCurrency = product.currency.toUpperCase();
                                      const oldDealCurrency = formData.currency.toUpperCase();
                                      const newDealCurrency = newCurrency.toUpperCase();
                                      
                                      // If product currency matches new deal currency, use original price
                                      if (productCurrency === newDealCurrency) {
                                        return {
                                          ...item,
                                          unit_price: parseFloat(product.price) || item.unit_price,
                                        };
                                      }
                                      
                                      // Convert from old deal currency to new deal currency
                                      if (oldDealCurrency !== newDealCurrency) {
                                        const convertedPrice = await convertCurrency(
                                          item.unit_price,
                                          oldDealCurrency,
                                          newDealCurrency
                                        );
                                        return {
                                          ...item,
                                          unit_price: convertedPrice,
                                        };
                                      }
                                    }
                                    return item;
                                  })
                                );
                                setEstimationItems(convertedItems);
                              } catch (error) {
                                console.error('Failed to convert existing items:', error);
                                toast.error('Failed to convert prices to new currency');
                              } finally {
                                setConvertingPrice(false);
                              }
                            }
                          }}
                          required
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
                          <option value="PKR">PKR</option>
                          <option value="INR">INR</option>
                          <option value="AUD">AUD</option>
                          <option value="CAD">CAD</option>
                          <option value="JPY">JPY</option>
                          <option value="CNY">CNY</option>
                          <option value="AED">AED</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Follow-up Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={formData.follow_up_date}
                          onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Step 1: Company Information */}
            {formStep === 1 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          placeholder="Enter company name" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Industry <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          required
                        >
                          <option value="">Select Industry</option>
                          <option value="Technology">Technology</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Finance">Finance</option>
                          <option value="Banking & Financial Services">Banking & Financial Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Retail">Retail</option>
                          <option value="Education">Education</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Telecommunications">Telecommunications</option>
                          <option value="Construction">Construction</option>
                          <option value="Other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Decision Maker Title</Form.Label>
                        <Form.Select 
                          value={formData.decision_maker_title}
                          onChange={(e) => setFormData({ ...formData, decision_maker_title: e.target.value })}
                        >
                          <option value="">Select Title</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Decision Maker Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.decision_maker_name}
                          onChange={(e) => setFormData({ ...formData, decision_maker_name: e.target.value })}
                          placeholder="Decision maker name" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Decision Maker Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="email" 
                          value={formData.decision_maker_email}
                          onChange={(e) => setFormData({ ...formData, decision_maker_email: e.target.value })}
                          placeholder="decisionmaker@company.com" 
                          required 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Decision Maker Phone <span className="text-danger">*</span></Form.Label>
                        <div className="phone-input-wrapper">
                          <PhoneInput
                            international
                            defaultCountry="US"
                            value={formData.decision_maker_phone_country_code && formData.decision_maker_phone 
                              ? `${formData.decision_maker_phone_country_code}${formData.decision_maker_phone}` 
                              : formData.decision_maker_phone || undefined}
                            onChange={(value) => {
                              if (value) {
                                try {
                                  // Parse the phone number to extract country code and national number
                                  const phoneNumber = parsePhoneNumber(value);
                                  if (phoneNumber) {
                                    setFormData(prev => ({
                                      ...prev,
                                      decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                      decision_maker_phone: phoneNumber.nationalNumber,
                                    }));
                                  } else {
                                    // Fallback: store full number in phone field
                                    setFormData(prev => ({
                                      ...prev,
                                      decision_maker_phone_country_code: "",
                                      decision_maker_phone: value,
                                    }));
                                  }
                                } catch (error) {
                                  // If parsing fails, store full number in phone field
                                  setFormData(prev => ({
                                    ...prev,
                                    decision_maker_phone_country_code: "",
                                    decision_maker_phone: value,
                                  }));
                                }
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  decision_maker_phone_country_code: "",
                                  decision_maker_phone: "",
                                }));
                              }
                            }}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Step 2: Deal Characteristics */}
            {formStep === 2 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-info">DEAL CHARACTERISTICS</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Deal Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.deal_type}
                          onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
                          required
                        >
                          <option value="">Select Deal Type</option>
                          <option value="new_sale">New Sale</option>
                          <option value="renewal">Renewal</option>
                          <option value="migration">Migration</option>
                          <option value="upsell">Upsell</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Contract Length <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.contract_length}
                          onChange={(e) => setFormData({ ...formData, contract_length: e.target.value })}
                          required
                        >
                          <option value="">Select Length</option>
                          <option value="1m">1 month</option>
                          <option value="3m">3 months</option>
                          <option value="6m">6 months</option>
                          <option value="12m">12 months</option>
                          <option value="24m">24 months</option>
                          <option value="36m">36 months</option>
                          <option value="custom">Custom</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {formData.contract_length === 'custom' && (
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Custom Contract Length</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={formData.contract_length_custom}
                            onChange={(e) => setFormData({ ...formData, contract_length_custom: e.target.value })}
                            placeholder="e.g., 18 months"
                          />
                        </Form.Group>
                      </Col>
                    )}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Billing Model <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.billing_model}
                          onChange={(e) => setFormData({ ...formData, billing_model: e.target.value })}
                          required
                        >
                          <option value="">Select Model</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi_annual">Semi-Annual</option>
                          <option value="annual">Annual</option>
                          <option value="one_time">One-time</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Payment Terms <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.payment_terms}
                          onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                          required
                        >
                          <option value="">Select Terms</option>
                          <option value="net_15">Net 15</option>
                          <option value="net_30">Net 30</option>
                          <option value="net_45">Net 45</option>
                          <option value="net_60">Net 60</option>
                          <option value="upfront">Upfront</option>
                          <option value="custom">Custom</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    {formData.payment_terms === 'custom' && (
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Custom Payment Terms</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={formData.payment_terms_custom}
                            onChange={(e) => setFormData({ ...formData, payment_terms_custom: e.target.value })}
                            placeholder="e.g., 50% Upfront"
                          />
                        </Form.Group>
                      </Col>
                    )}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Risk Level <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.risk_level}
                          onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                          required
                        >
                          <option value="">Select Risk Level</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Competitors</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.competitors}
                          onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                          placeholder="Enter competitor names (comma separated)"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Step 3: Progress & Notes */}
            {formStep === 3 && (
              <div>
                {/* Negotiation Progress */}
                <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
                    <Row>
                      {/* <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Negotiation Progress</Form.Label>
                          <div className="d-flex align-items-center gap-2">
                            <Form.Range 
                              value={negotiationBar}
                              onChange={(e) => setNegotiationBar(Number(e.target.value))}
                              style={{ flex: 1 }} 
                            />
                            <Badge bg="info" style={{ minWidth: '60px' }}>{negotiationBar}%</Badge>
                          </div>
                          <Form.Text className="text-muted">Visual indicator of negotiation progress</Form.Text>
                        </Form.Group>
                      </Col> */}
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quotation Sent</Form.Label>
                          <Form.Check
                            type="checkbox"
                            checked={formData.quotation_sent}
                            onChange={(e) => setFormData({ ...formData, quotation_sent: e.target.checked })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contract Sent</Form.Label>
                          <Form.Check
                            type="checkbox"
                            checked={formData.contract_sent}
                            onChange={(e) => setFormData({ ...formData, contract_sent: e.target.checked })}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contract Received</Form.Label>
                          <Form.Check
                            type="checkbox"
                            checked={formData.contract_received}
                            onChange={(e) => setFormData({ ...formData, contract_received: e.target.checked })}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Attachments */}
                {/* <Card className="mb-3 border-0 bg-light">
                  <Card.Body>
                    <h5 className="fw-bold mb-4 text-info">ATTACHMENTS</h5>
                    {attachments.length > 0 ? (
                      <div className="border rounded p-3 bg-white">
                        <small className="text-muted d-block mb-2">Attached Documents:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {attachments.map((attachment: any) => (
                            <Badge key={attachment.id} bg="secondary" className="p-2">
                              <a 
                                href={attachment.file_path} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-white text-decoration-none"
                              >
                                {attachment.name} ({attachment.file_name})
                              </a>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted p-3 border rounded bg-white">
                        <p className="mb-0">No documents attached</p>
                      </div>
                    )}
                  </Card.Body>
                </Card> */}

                {/* Revision History */}
                {histories.length > 0 && (
                  <Card className="mb-3 border-0 bg-light">
                    <Card.Body>
                      <h5 className="fw-bold mb-4 text-primary">REVISION HISTORY</h5>
                      <div className="border rounded p-3 bg-white">
                        <div className="list-group">
                          {histories.slice(0, 5).map((history: any) => (
                            <div key={history.id} className="list-group-item">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1">{history.event === 'created' ? 'Created' : 'Updated'}</h6>
                                  <p className="mb-1 small">{history.description}</p>
                                  <small className="text-muted">
                                    {new Date(history.created_at).toLocaleString()}
                                  </small>
                                </div>
                                {history.changes && Object.keys(history.changes).length > 0 && (
                                  <Badge bg="info">Changes</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </div>
            )}

            {/* Step 4: Estimation Chart */}
            {formStep === 4 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5>
                  
                  {/* Deal-level settings */}
                  <Row className="mb-4">
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tax Percentage (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.tax_percentage}
                          onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Standard Discount (%)</Form.Label>
                        <Form.Select
                          value={(formData.standard_discount_percentage && parseFloat(formData.standard_discount_percentage))}
                          onChange={(e) => setFormData({ ...formData, standard_discount_percentage: e.target.value })}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Special Discount (%)</Form.Label>
                        <Form.Control
                          disabled={extensions?.length <= 1}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.special_discount_percentage}
                          onChange={(e) => setFormData({ ...formData, special_discount_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => setShowRevisionHistoryModal(true)}
                    >
                      <History size={14} className="me-1" />
                      Revision History
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setItemFormData({
                          product_id: null,
                          product_service: "",
                          description: "",
                          qty: 1,
                          unit_price: 0,
                        });
                        setShowAddItemModal(true);
                      }}
                    >
                      <Plus size={14} className="me-1" />
                      Add Item
                    </Button>
                  </div>

                  {/* Estimation Items Table */}
                  <div style={{ marginBottom: '30px', width: '100%' }}>
                    <style dangerouslySetInnerHTML={{__html: `
                      .order-items-table-wrapper {
                        width: 100%;
                        overflow-x: auto;
                      }
                      .order-items-table-wrapper .table-responsive {
                        width: 100%;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                      }
                      .order-items-table-wrapper table {
                        width: 100%;
                        margin: 0;
                        border-collapse: separate;
                        border-spacing: 0;
                        table-layout: auto;
                      }
                      .order-items-table-wrapper thead th {
                        background: #f8f9fa !important;
                        padding: 12px 16px !important;
                        font-size: 0.875rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #495057;
                        border-bottom: 2px solid #dee2e6;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper thead th:first-of-type {
                        width: 50px !important;
                        min-width: 50px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper thead th:last-of-type {
                        width: 120px !important;
                        min-width: 120px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper tbody td {
                        padding: 14px 16px !important;
                        font-size: 0.875rem;
                        vertical-align: middle;
                        border-bottom: 1px solid #f0f0f0;
                        background: #fff;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                      }
                      .order-items-table-wrapper tbody td:first-of-type {
                        width: 50px !important;
                        min-width: 50px !important;
                        text-align: center;
                        color: #6c757d;
                        font-weight: 500;
                      }
                      .order-items-table-wrapper tbody td:last-of-type {
                        width: 120px !important;
                        min-width: 120px !important;
                        text-align: center;
                      }
                      .order-items-table-wrapper tbody td:nth-last-child(2),
                      .order-items-table-wrapper thead th:nth-last-child(2) {
                        min-width: 150px !important;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tbody td:nth-last-child(3),
                      .order-items-table-wrapper thead th:nth-last-child(3) {
                        min-width: 140px !important;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tbody tr:hover {
                        background-color: #f8f9fa;
                      }
                      .order-items-table-wrapper tbody tr:last-child td {
                        border-bottom: none;
                      }
                      .order-items-table-wrapper tfoot td {
                        padding: 12px 16px !important;
                        background: #f8f9fa !important;
                        font-size: 0.875rem;
                        border-top: 2px solid #dee2e6;
                        white-space: nowrap;
                      }
                      .order-items-table-wrapper tfoot td:first-of-type {
                        width: auto !important;
                        min-width: auto !important;
                        max-width: none !important;
                      }
                      .order-items-table-wrapper tfoot td:last-of-type {
                        width: auto !important;
                        min-width: 150px !important;
                        max-width: none !important;
                        text-align: right;
                        font-weight: 600;
                      }
                      .order-items-table-wrapper tfoot tr:last-child td:first-of-type {
                        padding-left: 20px !important;
                      }
                      .order-items-table-wrapper tfoot tr:last-child td:last-of-type {
                        padding-right: 20px !important;
                      }
                    `}} />
                    <div className="order-items-table-wrapper">
                      <div className="table-responsive" style={{ width: '100%' }}>
                        <Table hover style={{ marginBottom: 0 }}>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th style={{ minWidth: '200px' }}>Product Name</th>
                              <th style={{ minWidth: '120px' }}>SKU</th>
                              <th style={{ minWidth: '80px', textAlign: 'center' }}>Qty</th>
                              {estimationItems.some((item) => item.description) && <th style={{ minWidth: '180px' }}>Description</th>}
                              <th style={{ minWidth: '140px', textAlign: 'right' }}>Unit Price</th>
                              <th style={{ minWidth: '150px', textAlign: 'right' }}>Total Price</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {estimationItems.map((item, index) => {
                              const subtotal = item.qty * item.unit_price;
                              const product = products.find(p => p.id === item.product_id);
                              const showConversionInfo = product && 
                                product.currency.toUpperCase() !== formData.currency.toUpperCase() &&
                                item.original_currency &&
                                item.original_price !== item.unit_price;
                              
                              return (
                                <tr key={index}>
                                  <td>{index + 1}</td>
                                  <td className="fw-semibold" style={{ color: '#212529' }}>{item.product_service || 'N/A'}</td>
                                  <td style={{ color: '#6c757d', fontSize: '0.813rem' }}>{product?.sku || 'N/A'}</td>
                                  <td style={{ textAlign: 'center', fontWeight: 500, whiteSpace: 'nowrap' }}>{item.qty || '0'}</td>
                                  {estimationItems.some((i) => i.description) && (
                                    <td style={{ 
                                      maxWidth: '180px', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      color: '#6c757d',
                                      fontSize: '0.813rem'
                                    }}>
                                      {item.description || '-'}
                                    </td>
                                  )}
                                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 500 }}>
                                      {formData.currency || 'USD'} {parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {showConversionInfo && (
                                      <div className="small text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                        Original: {formatCurrency(item.original_price, item.original_currency)}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'USD'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1 justify-content-center">
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1"
                                        title="Edit Item"
                                        style={{ minWidth: 'auto', padding: '4px' }}
                                        onClick={() => {
                                          setEditingItemIndex(index);
                                          setItemFormData({
                                            product_id: item.product_id,
                                            product_service: item.product_service,
                                            description: item.description,
                                            qty: item.qty,
                                            unit_price: item.unit_price,
                                          });
                                          setShowAddItemModal(true);
                                        }}
                                      >
                                        <Edit size={16} />
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-1 text-danger"
                                        title="Delete Item"
                                        style={{ minWidth: 'auto', padding: '4px' }}
                                        onClick={() => {
                                          setEstimationItems(estimationItems.filter((_, i) => i !== index));
                                        }}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {estimationItems.length === 0 && (
                              <tr>
                                <td colSpan={estimationItems.some((item) => item.description) ? 8 : 7} className="text-center text-muted py-5">
                                  <Package size={40} className="text-muted mb-3" style={{ opacity: 0.5, display: 'block', margin: '0 auto 12px' }} />
                                  <div style={{ fontSize: '0.938rem', fontWeight: 500, marginBottom: '4px' }}>No items in estimation chart</div>
                                  <small style={{ fontSize: '0.813rem' }}>Click "Add Item" to add products or services</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {estimationItems.length > 0 && (() => {
                            const grandTotal = estimationItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
                            
                            const totalDiscountPercentage = parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0");
                            
                            const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
                            const subtotalAfterDiscount = grandTotal - totalDiscount;
                            const taxAmount = (subtotalAfterDiscount * parseFloat(formData.tax_percentage || "0")) / 100;
                            const netValue = subtotalAfterDiscount + taxAmount;
                            return (
                              <tfoot>
                                <tr>
                                  <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <strong>Subtotal:</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'USD'} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                                {totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <span style={{ color: '#6c757d' }}>
                                        Discount ({parseFloat(formData.standard_discount_percentage || "0") + parseFloat(formData.special_discount_percentage || "0")}%):
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#dc3545', whiteSpace: 'nowrap' }}>
                                      - {formData.currency || 'USD'} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                {parseFloat(formData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <strong>Tax ({formData.tax_percentage}%):</strong>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {formData.currency || 'USD'} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '1rem', borderTop: '2px solid #dee2e6' }}>
                                  <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px' }}>
                                    <strong style={{ fontSize: '1rem' }}>Total:</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#198754', paddingTop: '16px', paddingBottom: '16px', paddingRight: '20px', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'USD'} {netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              </tfoot>
                            );
                          })()}
                        </Table>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Add/Edit Item Modal */}
            <Modal show={showAddItemModal} onHide={() => {
              setShowAddItemModal(false);
              setEditingItemIndex(null);
              setItemFormData({
                product_id: null,
                product_service: "",
                description: "",
                qty: 1,
                unit_price: 0,
              });
            }} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title>{editingItemIndex !== null ? 'Edit Item' : 'Add New Item'}</Modal.Title>
              </Modal.Header>
              <Form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                const newItem = {
                  product_id: itemFormData.product_id!,
                  product_service: itemFormData.product_service,
                  description: itemFormData.description,
                  qty: itemFormData.qty,
                  unit_price: itemFormData.unit_price,
                  original_currency: selectedProduct?.currency || formData.currency,
                  original_price: parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
                };

                if (editingItemIndex !== null) {
                  const updated = [...estimationItems];
                  updated[editingItemIndex] = newItem;
                  setEstimationItems(updated);
                } else {
                  setEstimationItems([...estimationItems, newItem]);
                }

                setShowAddItemModal(false);
                setEditingItemIndex(null);
                setItemFormData({
                  product_id: null,
                  product_service: "",
                  description: "",
                  qty: 1,
                  unit_price: 0,
                });
              }} noValidate>
                <Modal.Body>
                  <Row className="g-3">
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Product <span className="text-danger">*</span></Form.Label>
                        <Select
                          value={itemFormData.product_id ? {
                            value: itemFormData.product_id,
                            label: itemFormData.product_service || products.find(p => p.id === itemFormData.product_id)?.name || ""
                          } : null}
                          onChange={async (selectedOption: any) => {
                            const product = products.find(p => p.id === selectedOption?.value);
                            if (product) {
                              const originalPrice = parseFloat(product.price) || 0;
                              const productCurrency = product.currency.toUpperCase();
                              const dealCurrency = formData.currency.toUpperCase();
                              
                              // Convert price if currencies differ
                              let convertedPrice = originalPrice;
                              if (productCurrency !== dealCurrency) {
                                try {
                                  setConvertingPrice(true);
                                  convertedPrice = await convertCurrency(
                                    originalPrice,
                                    productCurrency,
                                    dealCurrency
                                  );
                                } catch (error) {
                                  console.error('Failed to convert currency:', error);
                                  toast.error(`Failed to convert ${productCurrency} to ${dealCurrency}`);
                                  // Keep original price if conversion fails
                                  convertedPrice = originalPrice;
                                } finally {
                                  setConvertingPrice(false);
                                }
                              }
                              
                              setItemFormData({
                                ...itemFormData,
                                product_id: product.id,
                                product_service: product.name,
                                unit_price: convertedPrice,
                              });
                            }
                          }}
                          options={products.map(product => {
                            const productCurrency = product.currency.toUpperCase();
                            const dealCurrency = formData.currency.toUpperCase();
                            const originalPrice = parseFloat(product.price) || 0;
                            
                            // Show both currencies if they differ
                            if (productCurrency !== dealCurrency) {
                              return {
                                value: product.id,
                                label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(2)} → ${dealCurrency} (will convert)`,
                              };
                            }
                            
                            return {
                              value: product.id,
                              label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(2)}`,
                            };
                          })}
                          placeholder="Select a product"
                          isSearchable
                          isLoading={loadingProducts}
                          isDisabled={editingItemIndex !== null}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Enter product description or specifications"
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Quantity <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          placeholder="Enter quantity"
                          value={itemFormData.qty}
                          onChange={(e) => setItemFormData({ ...itemFormData, qty: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>
                          Unit Price <span className="text-danger">*</span>
                          {convertingPrice && (
                            <span className="ms-2 text-muted small">
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Converting...
                            </span>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter unit price"
                          value={itemFormData.unit_price}
                          onChange={(e) => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                          required
                          disabled={convertingPrice}
                        />
                        {itemFormData.product_id && (() => {
                          const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                          if (selectedProduct) {
                            const productCurrency = selectedProduct.currency.toUpperCase();
                            const dealCurrency = formData.currency.toUpperCase();
                            const originalPrice = parseFloat(selectedProduct.price) || 0;
                            
                            if (productCurrency !== dealCurrency && itemFormData.unit_price !== originalPrice) {
                              return (
                                <Form.Text className="text-muted d-block">
                                  Converted from {formatCurrency(originalPrice, productCurrency)} 
                                  {' → '}
                                  {formatCurrency(itemFormData.unit_price, dealCurrency)}
                                </Form.Text>
                              );
                            }
                          }
                          return null;
                        })()}
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Card className="bg-light border-0">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Sub Total:</span>
                            <h5 className="mb-0 text-success">
                              {formatCurrency(itemFormData.qty * itemFormData.unit_price, formData.currency)}
                            </h5>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline-secondary" onClick={() => {
                    setShowAddItemModal(false);
                    setEditingItemIndex(null);
                    setItemFormData({
                      product_id: null,
                      product_service: "",
                      description: "",
                      qty: 1,
                      unit_price: 0,
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="button"
                    disabled={!itemFormData.product_id || itemFormData.qty < 1 || itemFormData.unit_price <= 0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                      const newItem = {
                        product_id: itemFormData.product_id!,
                        product_service: itemFormData.product_service,
                        description: itemFormData.description,
                        qty: itemFormData.qty,
                        unit_price: itemFormData.unit_price,
                        original_currency: selectedProduct?.currency || formData.currency,
                        original_price: parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
                      };

                      if (editingItemIndex !== null) {
                        const updated = [...estimationItems];
                        updated[editingItemIndex] = newItem;
                        setEstimationItems(updated);
                      } else {
                        setEstimationItems([...estimationItems, newItem]);
                      }

                      setShowAddItemModal(false);
                      setEditingItemIndex(null);
                      setItemFormData({
                        product_id: null,
                        product_service: "",
                        description: "",
                        qty: 1,
                        unit_price: 0,
                      });
                    }}
                  >
                    {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>

            {/* Revision History Modal */}
            <Modal show={showRevisionHistoryModal} onHide={() => setShowRevisionHistoryModal(false)} size="lg" centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  <History size={20} className="me-2" />
                  Revision History
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {estimates.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <Table hover>
                        <thead className="bg-light">
                          <tr>
                            <th>Version</th>
                            <th>Created</th>
                            <th>Grand Total</th>
                            <th>Net Value</th>
                            <th>Items</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estimates.map((estimate: any, index: number) => {
                            const grandTotal = parseFloat(estimate.grand_total || "0");
                            const netValue = parseFloat(estimate.net_value || "0");
                            const itemCount = estimate.estimation_chart?.length || 0;
                            
                            return (
                              <tr key={estimate.id || index}>
                                <td>
                                  <Badge bg="secondary">
                                    {estimate.version || `v${estimates.length - index}.0`}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Calendar size={14} className="me-2 text-muted" />
                                    {new Date(estimate.created_at).toLocaleString()}
                                  </div>
                                </td>
                                <td className="fw-bold text-success">
                                  {grandTotal.toLocaleString()} {estimate.currency || formData.currency}
                                </td>
                                <td>
                                  {netValue.toLocaleString()} {estimate.currency || formData.currency}
                                </td>
                                <td>
                                  <Badge bg="secondary">{itemCount} items</Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="p-1 text-info"
                                      title="Load Version"
                                      onClick={() => {
                                        // Load the revision items
                                        if (estimate.estimation_chart && estimate.estimation_chart.length > 0) {
                                          setEstimationItems(estimate.estimation_chart.map((item: any) => ({
                                            product_id: item.product_id || 0,
                                            product_service: item.product_service || "",
                                            description: item.description || "",
                                            qty: item.qty || 1,
                                            unit_price: item.unit_price || 0,
                                            original_currency: item.original_currency || estimate.currency || formData.currency,
                                            original_price: item.original_price || item.unit_price || 0,
                                          })));
                                          
                                          // Also restore tax and discount percentages if available
                                          if (estimate.tax_percentage) {
                                            setFormData(prev => ({ ...prev, tax_percentage: estimate.tax_percentage.toString() }));
                                          }
                                          if (estimate.standard_discount_percentage) {
                                            setFormData(prev => ({ ...prev, standard_discount_percentage: estimate.standard_discount_percentage.toString() }));
                                          }
                                          if (estimate.special_discount_percentage) {
                                            setFormData(prev => ({ ...prev, special_discount_percentage: estimate.special_discount_percentage.toString() }));
                                          }
                                          
                                          setShowRevisionHistoryModal(false);
                                          toast.success(`${estimate.version || `v${estimates.length - index}.0`} has been loaded successfully!`);
                                        } else {
                                          toast.error("This revision has no items to load");
                                        }
                                      }}
                                    >
                                      <RefreshCw size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    
                    <Card className="border-0 bg-light mt-3">
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <small className="text-muted">Total Revisions</small>
                            <div className="fw-bold">{estimates.length}</div>
                          </Col>
                          <Col md={6}>
                            <small className="text-muted">Latest Update</small>
                            <div className="fw-bold">
                              {estimates.length > 0 ? new Date(estimates[0].created_at).toLocaleString() : 'N/A'}
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </>
                ) : (
                  <div className="text-center text-muted p-5">
                    <History size={48} className="mb-3 text-muted" />
                    <p className="mb-0">No revision history available</p>
                    <small>Revisions will appear here when estimates are created</small>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowRevisionHistoryModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>

          {/* Form Footer */}
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  setFormStep(formStep - 1);
                } else {
                  router.push("/crm/deals");
                }
              }}
            >
              {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
            </Button>
            <div className="d-flex gap-2">
              {formStep < 4 ? (
                <Button 
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormStep(formStep + 1);
                  }}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Deal'}
                </Button>
              )}
            </div>
          </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

EditDeal.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditDeal;

