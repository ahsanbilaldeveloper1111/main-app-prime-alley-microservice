import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  updateDeal,
  getDeal,
  getStages,
  StageData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Badge, Table } from "react-bootstrap";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, FileText, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug } from '@utils/Helper';

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
  });

  useEffect(() => {
    fetchStages();
    fetchExtensions();
  }, []);

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
          decision_maker_name: deal.decision_maker_name || deal.main_decision_maker?.name || "",
          decision_maker_phone_country_code: deal.decision_maker_phone_country_code || deal.main_decision_maker?.phone_country_code || "",
          decision_maker_phone: deal.decision_maker_phone || deal.main_decision_maker?.phone || "",
          decision_maker_email: deal.main_decision_maker?.email || "",
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
        });

        // Set additional data
        setEstimates(deal.estimates || []);
        setAttachments(deal.attachments || []);
        setHistories(deal.histories || []);
        setNegotiationBar(deal.negotiation_bar || 0);
        setProbability(deal.probability || 0);
        
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
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_LEADS);
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

      await updateDeal(Number(id), payload);
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
          subLink="/crm/deals"
          currentTitle="Edit Deal"
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
        subLink="/crm/deals"
        currentTitle="Edit Deal"
      />
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Edit Deal</h2>
            <p className="text-muted mb-0">Update the deal details below</p>
          </div>
          <Link href="/crm/deals">
            <Button variant="outline-secondary">
              <ArrowLeft size={16} className="me-2" />
              Back to Deals
            </Button>
          </Link>
        </div>

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
                    <Col md={6}>
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
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          required
                        >
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                          <option value="EUR">EUR</option>
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
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Country Code</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.decision_maker_phone_country_code}
                          onChange={(e) => setFormData({ ...formData, decision_maker_phone_country_code: e.target.value })}
                          placeholder="+1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Decision Maker Phone <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="tel" 
                          value={formData.decision_maker_phone}
                          onChange={(e) => setFormData({ ...formData, decision_maker_phone: e.target.value })}
                          placeholder="1234567890" 
                          required 
                        />
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
                      <Col md={12}>
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
                      </Col>
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
                <Card className="mb-3 border-0 bg-light">
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
                </Card>

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
                  {estimates.length > 0 ? (
                    <>
                      {estimates.map((estimate: any, estimateIndex: number) => (
                        <Card key={estimate.id} className="mb-3 border bg-white">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h6 className="mb-0">Version {estimate.version}</h6>
                                <small className="text-muted">
                                  Created: {new Date(estimate.created_at).toLocaleDateString()}
                                  {estimate.is_final && <Badge bg="success" className="ms-2">Final</Badge>}
                                </small>
                              </div>
                              <div className="d-flex gap-2">
                                <Button variant="outline-info" size="sm">
                                  <Eye size={14} className="me-1" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                            
                            {estimate.estimation_chart && estimate.estimation_chart.length > 0 && (
                              <div className="table-responsive">
                                <Table size="sm" hover>
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th>Product/Service</th>
                                      <th>Description</th>
                                      <th>Qty</th>
                                      <th>Unit Price</th>
                                      <th>Currency</th>
                                      <th>Sub Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {estimate.estimation_chart.map((item: any, itemIndex: number) => (
                                      <tr key={itemIndex}>
                                        <td>{itemIndex + 1}</td>
                                        <td>{item.product_service}</td>
                                        <td>{item.description || 'N/A'}</td>
                                        <td>{item.qty}</td>
                                        <td>{item.unit_price?.toLocaleString() || 0}</td>
                                        <td>
                                          <Badge bg="secondary">{item.original_currency || estimate.currency}</Badge>
                                        </td>
                                        <td className="fw-bold">
                                          {(item.qty * item.unit_price).toLocaleString()} {item.original_currency || estimate.currency}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td colSpan={6} className="text-end fw-bold">Subtotal:</td>
                                      <td className="fw-bold">{estimate.grand_total} {estimate.currency}</td>
                                    </tr>
                                    {parseFloat(estimate.discount_amount || 0) > 0 && (
                                      <tr>
                                        <td colSpan={6} className="text-end">Discount ({estimate.standard_discount_percentage}%):</td>
                                        <td>-{estimate.discount_amount} {estimate.currency}</td>
                                      </tr>
                                    )}
                                    <tr>
                                      <td colSpan={6} className="text-end fw-bold">Tax ({estimate.tax_percentage}%):</td>
                                      <td className="fw-bold">
                                        {((parseFloat(estimate.grand_total || 0) - parseFloat(estimate.discount_amount || 0)) * parseFloat(estimate.tax_percentage || 0) / 100).toFixed(2)} {estimate.currency}
                                      </td>
                                    </tr>
                                    <tr className="table-primary">
                                      <td colSpan={6} className="text-end fw-bold">Net Value:</td>
                                      <td className="fw-bold">{estimate.net_value} {estimate.currency}</td>
                                    </tr>
                                  </tfoot>
                                </Table>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <div className="text-center text-muted p-5 border rounded bg-white">
                      <FileText size={48} className="mb-3 text-muted" />
                      <p className="mb-0">No estimation charts available</p>
                      <small>Estimation charts will appear here when created</small>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
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
      </div>
    </React.Fragment>
  );
};

EditDeal.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EditDeal;

