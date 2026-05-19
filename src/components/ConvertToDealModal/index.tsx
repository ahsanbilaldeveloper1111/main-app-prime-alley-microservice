import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Card, Badge, Table } from "react-bootstrap";
import Select from 'react-select';
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import { CheckCircle, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "react-toastify";
import {
  createDeal,
  getStages,
  getLead,
  getCrmProducts,
  createEstimate,
  getIndustries,
  getBusinessTypes,
  CrmProduct,
  StageData,
  DealTemplateData,
  DealTemplateField,
  IndustryData,
  BusinessTypeData,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug } from '@utils/Helper';
import {
  buildConvertDealFormStateFromLead,
  loadCampaignIndustryContext,
  loadDealTemplateForLead,
  validateConvertDealStep0,
  validateConvertDealStep1,
  validateConvertDealStep2,
  validateConvertDealStep4,
} from "@utils/crm/convertToDealShared";
import { convertCurrency, formatCurrency } from '@utils/currency';

interface ConvertToDealModalProps {
  show: boolean;
  onHide: () => void;
  leadId: number;
  onSuccess?: () => void;
}

type EstimationItem = Readonly<{
  product_id: number;
  product_service: string;
  description: string;
  qty: number;
  unit_price: number;
  original_currency: string;
  original_price: number;
  tax_percentage: string;
  standard_discount_percentage: string;
  special_discount_percentage: string;
}>;

function getNextConvertDealStep(current: number, hasTemplate: boolean): number {
  const next = current + 1;
  if (!hasTemplate && next === 2) return 3;
  return Math.min(4, next);
}

function getPrevConvertDealStep(current: number, hasTemplate: boolean): number {
  const prev = current - 1;
  if (!hasTemplate && prev === 2) return 1;
  return Math.max(0, prev);
}

function isConvertDealStepVisible(step: number, hasTemplate: boolean): boolean {
  return hasTemplate || step !== 2;
}

function getConvertDealDisplayNumber(step: number, hasTemplate: boolean): number {
  return !hasTemplate && step > 2 ? step : step + 1;
}

function getConvertDealStepLabel(step: number): string {
  switch (step) {
    case 0:
      return "Deal Info";
    case 1:
      return "Company Info";
    case 2:
      return "Characteristics";
    case 3:
      return "Progress";
    case 4:
      return "Estimation";
    default:
      return "";
  }
}

function getConvertDealTimelineProgressPercent(formStep: number, hasTemplate: boolean): number {
  const totalVisibleSteps = hasTemplate ? 5 : 4;
  const visualPosition = !hasTemplate && formStep > 2 ? formStep - 1 : formStep;
  return ((visualPosition + 1) / totalVisibleSteps) * 100;
}

function filterNonEmptyTemplateFields(
  templateFieldsData: Record<string, unknown>,
): Record<string, unknown> | null {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(templateFieldsData)) {
    if (value !== null && value !== undefined && value !== "") {
      filtered[key] = value;
    }
  }
  return Object.keys(filtered).length > 0 ? filtered : null;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildEstimatePayload(args: {
  dealId: number;
  estimationItems: readonly EstimationItem[];
  currency: string;
  standardDiscountPct: string;
  specialDiscountPct: string;
  taxPct: string;
}) {
  return {
    deal_id: args.dealId,
    estimation_chart: args.estimationItems.map((item) => ({
      product_id: item.product_id,
      product_service: item.product_service,
      description: item.description || "",
      qty: item.qty,
      unit_price: item.unit_price,
      original_currency: item.original_currency || args.currency,
      original_price: item.original_price ?? item.unit_price,
      tax_percentage: toNumber(item.tax_percentage ?? "0"),
      standard_discount_percentage: toNumber(item.standard_discount_percentage ?? "0"),
      special_discount_percentage: toNumber(item.special_discount_percentage ?? "0"),
    })),
    standard_discount_percentage: toNumber(args.standardDiscountPct || "0"),
    special_discount_percentage: toNumber(args.specialDiscountPct || "0"),
    tax_percentage: toNumber(args.taxPct || "0"),
    currency: args.currency,
  };
}

function buildDealCreatePayload(args: {
  formData: {
    name: string;
    stage_id?: number;
    assigned_to: string | null;
    expected_close_date: string;
    company_name: string;
    company_domain: string;
    industry_ids: number[];
    decision_maker_title: string;
    decision_maker_name: string;
    decision_maker_phone_country_code: string;
    decision_maker_phone: string;
    decision_maker_email: string;
    deal_type: string;
    contract_length: string;
    contract_length_custom: string;
    billing_model: string;
    payment_terms: string;
    payment_terms_custom: string;
    risk_level: string;
    competitors: string;
    quotation_sent: boolean;
    contract_sent: boolean;
    contract_received: boolean;
    follow_up_date: string;
    currency: string;
    tax_percentage: string;
    standard_discount_percentage: string;
    special_discount_percentage: string;
    ticket_id: number | null;
    lead_id: number | null;
  };
  businessTypeId: number | null;
  businessTypeOther: string;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, unknown>;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: args.formData.name,
    stage_id: args.formData.stage_id ? String(args.formData.stage_id) : undefined,
    assigned_to: args.formData.assigned_to,
    expected_close_date: args.formData.expected_close_date,
    company_name: args.formData.company_name,
    industry_ids: args.formData.industry_ids,
    decision_maker_title: args.formData.decision_maker_title,
    decision_maker_name: args.formData.decision_maker_name,
    decision_maker_phone_country_code: args.formData.decision_maker_phone_country_code,
    decision_maker_phone: args.formData.decision_maker_phone,
    decision_maker_email: args.formData.decision_maker_email,
    deal_type: args.formData.deal_type,
    contract_length: args.formData.contract_length,
    contract_length_custom: args.formData.contract_length_custom || "",
    billing_model: args.formData.billing_model,
    payment_terms: args.formData.payment_terms,
    payment_terms_custom: args.formData.payment_terms_custom || "",
    risk_level: args.formData.risk_level,
    competitors: args.formData.competitors || "",
    quotation_sent: args.formData.quotation_sent,
    contract_sent: args.formData.contract_sent,
    contract_received: args.formData.contract_received,
    follow_up_date: args.formData.follow_up_date || "",
    currency: args.formData.currency,
    tax_percentage: args.formData.tax_percentage || "0",
    standard_discount_percentage: args.formData.standard_discount_percentage || "0",
    special_discount_percentage: args.formData.special_discount_percentage || "0",
    ticket_id: args.formData.ticket_id || args.formData.lead_id,
    lead_id: args.formData.lead_id,
  };

  if (args.formData.company_domain) {
    payload.company_domain = args.formData.company_domain;
  }

  if (args.businessTypeId) {
    payload.business_type_id = String(args.businessTypeId);
  }

  if (args.businessTypeOther) {
    payload.business_type_other = args.businessTypeOther;
  }

  const templateId = args.dealTemplate?.id;
  if (templateId) {
    payload.deal_template_id = templateId;
    const filteredTemplateData = filterNonEmptyTemplateFields(args.templateFieldsData);
    if (filteredTemplateData) payload.template_data = filteredTemplateData;
  }

  return payload;
}

async function convertEstimationItemsForNewCurrency(args: {
  estimationItems: readonly EstimationItem[];
  products: readonly CrmProduct[];
  oldDealCurrency: string;
  newDealCurrency: string;
}): Promise<EstimationItem[]> {
  if (args.estimationItems.length === 0) return [];
  const oldCcy = args.oldDealCurrency.toUpperCase();
  const newCcy = args.newDealCurrency.toUpperCase();
  if (!oldCcy || !newCcy || oldCcy === newCcy) return [...args.estimationItems];

  return Promise.all(
    args.estimationItems.map(async (item) => {
      const product = args.products.find((p) => p.id === item.product_id);
      const productCurrency = String(product?.currency ?? "").toUpperCase();

      if (product && productCurrency && productCurrency === newCcy) {
        return {
          ...item,
          unit_price: toNumber(product.price, item.unit_price),
        };
      }

      const convertedPrice = await convertCurrency(item.unit_price, oldCcy, newCcy);
      return { ...item, unit_price: convertedPrice };
    }),
  );
}

const ConvertToDealModal: React.FC<ConvertToDealModalProps> = ({
  show,
  onHide,
  leadId,
  onSuccess
}) => {
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [campaignIndustries, setCampaignIndustries] = useState<IndustryData[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [allIndustries, setAllIndustries] = useState<IndustryData[]>([]);
  const [loadingAllIndustries, setLoadingAllIndustries] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [sourceLead, setSourceLead] = useState<any>(null);
  const [convertingPrice, setConvertingPrice] = useState(false);
  const [dealTemplate, setDealTemplate] = useState<DealTemplateData | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateFieldsData, setTemplateFieldsData] = useState<Record<string, any>>({});
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeData[]>([]);
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [businessTypeOther, setBusinessTypeOther] = useState<string>("");
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);

  const [estimationItems, setEstimationItems] = useState<EstimationItem[]>([]);
  
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  });

  const [formData, setFormData] = useState({
    name: "",
    ticket_id: null as number | null,
    lead_id: null as number | null,
    stage_id: undefined as number | undefined,
    assigned_to: null as string | null,
    expected_close_date: "",
    company_name: "",
    company_domain: "",
    industry_ids: [] as number[],
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
    currency: "AED",
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  });

  // Reset modal state when closed
  useEffect(() => {
    if (!show) {
      setFormStep(0);
      setEstimationItems([]);
      setTemplateFieldsData({});
      setBusinessTypeId(null);
      setBusinessTypeOther("");
      setShowOtherBusinessType(false);
    }
  }, [show]);

  // Fetch initial data
  useEffect(() => {
    if (show) {
      fetchStages();
      fetchExtensions();
      fetchBusinessTypes();
      fetchAllIndustries();
    }
  }, [show]);

  // Fetch lead data when modal opens
  useEffect(() => {
    if (show && leadId) {
      fetchLeadData();
    }
  }, [show, leadId]);

  const fetchLeadData = async () => {
    try {
      setLoadingLead(true);
      const leadData: any = await getLead(leadId);
      setSourceLead(leadData);

      const leadRecord = leadData as Record<string, unknown>;
      setFormData(buildConvertDealFormStateFromLead(leadRecord, leadId));

      try {
        setLoadingTemplate(true);
        const { template, templateFieldsData: initialFields } = await loadDealTemplateForLead(leadId);
        if (template) {
          setDealTemplate(template);
          setTemplateFieldsData(initialFields);
        }
      } catch (error) {
        console.error("Failed to fetch deal template:", error);
      } finally {
        setLoadingTemplate(false);
      }

      if (leadData.campaign_id) {
        try {
          setLoadingIndustries(true);
          const ctx = await loadCampaignIndustryContext(Number(leadData.campaign_id));
          if (ctx.campaignIndustryIds.length > 0) {
            setCampaignIndustries(ctx.filteredIndustries);
            setFormData((prev) => ({
              ...prev,
              industry_ids: ctx.campaignIndustryIds,
            }));
            if (ctx.filteredIndustries.length === 1) {
              setSelectedIndustryId(ctx.filteredIndustries[0].id);
              await fetchProductsByIndustry(ctx.filteredIndustries[0].id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch campaign/industries:", error);
        } finally {
          setLoadingIndustries(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch lead:", error);
      toast.error("Failed to load lead data");
    } finally {
      setLoadingLead(false);
    }
  };

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

  const fetchBusinessTypes = async () => {
    try {
      const businessTypesResponse = await getBusinessTypes({ per_page: 1000 });
      setBusinessTypes(businessTypesResponse?.data || []);
    } catch (error) {
      console.error("Failed to fetch business types:", error);
    }
  };

  const fetchAllIndustries = async () => {
    try {
      setLoadingAllIndustries(true);
      const response = await getIndustries({ per_page: 1000 });
      setAllIndustries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch industries:", error);
    } finally {
      setLoadingAllIndustries(false);
    }
  };

  const fetchProductsByIndustry = async (industryId: number) => {
    try {
      setLoadingProducts(true);
      const response = await getCrmProducts({ 
        per_page: 100,
        industry_id: industryId 
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleIndustryChange = async (selectedOption: any) => {
    const industryId = selectedOption?.value || null;
    setSelectedIndustryId(industryId);
    
    setItemFormData({
      ...itemFormData,
      product_id: null,
      product_service: "",
      unit_price: 0,
    });
    
    if (industryId) {
      await fetchProductsByIndustry(industryId);
    } else {
      setProducts([]);
    }
  };

  const handleDealCurrencyChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newCurrency = e.target.value;
    const oldCurrency = formData.currency;
    setFormData((prev) => ({ ...prev, currency: newCurrency }));

    if (estimationItems.length === 0) return;

    try {
      setConvertingPrice(true);
      const convertedItems = await convertEstimationItemsForNewCurrency({
        estimationItems,
        products,
        oldDealCurrency: oldCurrency,
        newDealCurrency: newCurrency,
      });
      setEstimationItems(convertedItems);
    } catch (error) {
      console.error("Failed to convert existing items:", error);
      toast.error("Failed to convert prices to new currency");
    } finally {
      setConvertingPrice(false);
    }
  };

  const validateStep0 = (): boolean =>
    validateConvertDealStep0(formData, "Assigned to");
  const validateStep1 = (): boolean => validateConvertDealStep1(formData);
  const validateStep2 = (): boolean =>
    validateConvertDealStep2(dealTemplate, templateFieldsData);
  const validateStep3 = (): boolean => true;
  const validateStep4 = (): boolean => validateConvertDealStep4(estimationItems);

  const hasTemplate = Boolean(dealTemplate);

  const validateCurrentStep = (): boolean => {
    switch (formStep) {
      case 0: return validateStep0();
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return validateStep4();
      default: return true;
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateCurrentStep()) {
      setFormStep(getNextConvertDealStep(formStep, hasTemplate));
    }
  };

  const handleBackOrCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (formStep > 0) {
      setFormStep(getPrevConvertDealStep(formStep, hasTemplate));
      return;
    }
    onHide();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formStep < 4) {
      setFormStep(getNextConvertDealStep(formStep, hasTemplate));
      return;
    }

    const canSubmit =
      validateStep0() &&
      validateStep1() &&
      validateStep4() &&
      (!dealTemplate || validateStep2());
    if (!canSubmit) return;

    setLoading(true);
    try {
      const payload = buildDealCreatePayload({
        formData,
        businessTypeId,
        businessTypeOther,
        dealTemplate,
        templateFieldsData,
      });

      const createdDeal = await createDeal(payload).then((res) => res?.data);
      
      if (estimationItems.length > 0 && createdDeal?.id) {
        try {
          const estimatePayload = buildEstimatePayload({
            dealId: Number(createdDeal.id),
            estimationItems,
            currency: formData.currency,
            standardDiscountPct: formData.standard_discount_percentage,
            specialDiscountPct: formData.special_discount_percentage,
            taxPct: formData.tax_percentage,
          });
          await createEstimate(estimatePayload, false);
        } catch (estimateError: any) {
          console.error("Failed to create estimate:", estimateError);
          toast.warning("Deal created but failed to save estimation chart");
        }
      }
      
      toast.success("Deal created successfully!");
      onHide();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create deal:", error);
      toast.error(error.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        centered
        backdrop="static"
        className="convert-to-deal-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Convert Lead to Deal
            {sourceLead && (
              <Badge bg="info" className="ms-2">
                {sourceLead.name}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
          {loadingLead ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading lead data...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {/* Timeline Navigation */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between position-relative">
                  <div 
                    className="position-absolute bg-light" 
                    style={{ left: '0', right: '0', top: '20px', height: '2px', zIndex: 0 }}
                  />
                  <div 
                    className="position-absolute bg-primary" 
                    style={{ 
                      left: '0', 
                      top: '20px', 
                      height: '2px', 
                      width: `${getConvertDealTimelineProgressPercent(formStep, hasTemplate)}%`,
                      zIndex: 0,
                      transition: 'width 0.3s ease'
                    }}
                  />
                  
                  {[0, 1, 2, 3, 4].map((step) => {
                    if (!isConvertDealStepVisible(step, hasTemplate)) return null;
                    const displayNumber = getConvertDealDisplayNumber(step, hasTemplate);
                    
                    return (
                      <button
                        type="button"
                        key={step}
                        className="text-center position-relative" 
                        style={{
                          cursor: 'pointer',
                          flex: 1,
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                        }}
                        onClick={() => setFormStep(step)}
                      >
                        <div 
                          className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= step ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                          style={{ width: '40px', height: '40px', zIndex: 1, position: 'relative' }}
                        >
                          {formStep > step ? <CheckCircle size={20} /> : displayNumber}
                        </div>
                        <small className={`d-block mt-2 ${formStep === step ? 'fw-bold text-primary' : 'text-muted'}`}>
                          {getConvertDealStepLabel(step)}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Steps - Copy all the step content from the CreateDeal page here */}
              {/* Step 0, 1, 2, 3, 4 content goes here - same as in the original file */}
              {/* Due to character limits, I'm showing the structure - you'll copy the exact step content */}
              {/* Steps */}
              
              
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
                        <Form.Label>Currency <span className="text-danger">*</span></Form.Label>
                        <Form.Select 
                          value={formData.currency}
                          onChange={handleDealCurrencyChange}
                          required
                        >
                         
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
                        <Form.Label>Company domain</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={formData.company_domain}
                          onChange={(e) => setFormData({ ...formData, company_domain: e.target.value })}
                          placeholder="e.g. example.com" 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Select Business Type <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          value={showOtherBusinessType ? "other" : (businessTypeId ? String(businessTypeId) : "")}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "other") {
                              setShowOtherBusinessType(true);
                              setBusinessTypeId(null);
                              setBusinessTypeOther("");
                            } else if (value) {
                              setShowOtherBusinessType(false);
                              setBusinessTypeId(Number(value));
                              setBusinessTypeOther("");
                            } else {
                              setShowOtherBusinessType(false);
                              setBusinessTypeId(null);
                              setBusinessTypeOther("");
                            }
                          }}
                          required
                        >
                          <option value="">Select Business Type</option>
                          {businessTypes.map((businessType) => (
                            <option key={businessType.id} value={businessType.id}>
                              {businessType.name}
                            </option>
                          ))}
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {showOtherBusinessType && (
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Business Type (Other) <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={businessTypeOther}
                            onChange={(e) => setBusinessTypeOther(e.target.value)}
                            placeholder="Enter business type"
                            required
                          />
                        </Form.Group>
                      </Col>
                    )}
                    <Col md={6}>
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
                    <Col md={6}>
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
                          autoCapitalize="off" 
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

            {/* Step 2: Deal Characteristics - Only show if template is available */}
            {formStep === 2 && dealTemplate && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0 text-info">DEAL CHARACTERISTICS</h5>
                    {dealTemplate.name && (
                      <Badge bg="info" className="ms-2">
                        Template: {dealTemplate.name}
                      </Badge>
                    )}
                  </div>
                  {dealTemplate.description && (
                    <div className="alert alert-info mb-4">
                      <small>{dealTemplate.description}</small>
                    </div>
                  )}
                  {loadingTemplate ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading template...</span>
                      </div>
                      <p className="mt-2 text-muted">Loading template fields...</p>
                    </div>
                  ) : dealTemplate.fields && dealTemplate.fields.length > 0 ? (
                    <Row>
                      {(() => {
                        const fieldsArray = dealTemplate.fields || [];
                        const sortedFields = [...fieldsArray].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                        return sortedFields.map((field: DealTemplateField) => {
                          const fieldValue = templateFieldsData[field.field_name] || '';
                          
                          return (
                            <Col md={6} key={field.field_name}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  {field.field_name}
                                  {field.is_required && <span className="text-danger"> *</span>}
                                </Form.Label>
                                {field.field_type === 'dropdown' ? (
                                  <Form.Select
                                    value={fieldValue}
                                    onChange={(e) => setTemplateFieldsData({
                                      ...templateFieldsData,
                                      [field.field_name]: e.target.value
                                    })}
                                    required={field.is_required}
                                  >
                                    <option value="">Select {field.field_name}</option>
                                    {field.options && field.options.map((option: string, index: number) => (
                                      <option key={index} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </Form.Select>
                                ) : field.field_type === 'text' || !field.field_type ? (
                                  <Form.Control
                                    type="text"
                                    value={fieldValue}
                                    onChange={(e) => setTemplateFieldsData({
                                      ...templateFieldsData,
                                      [field.field_name]: e.target.value
                                    })}
                                    placeholder={`Enter ${field.field_name}`}
                                    required={field.is_required}
                                  />
                                ) : (
                                  <Form.Control
                                    type={field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : 'text'}
                                    value={fieldValue}
                                    onChange={(e) => setTemplateFieldsData({
                                      ...templateFieldsData,
                                      [field.field_name]: e.target.value
                                    })}
                                    placeholder={`Enter ${field.field_name}`}
                                    required={field.is_required}
                                  />
                                )}
                              </Form.Group>
                            </Col>
                          );
                        });
                      })()}
                    </Row>
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <p>No fields defined in this template.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Step 3: Progress & Notes */}
            {formStep === 3 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
                  <Row>
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
            )}

            {/* Step 4: Estimation Chart */}
            {formStep === 4 && (
              <Card className="mb-3 border-0 bg-light">
                <Card.Body>
                  {/* <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5> */}
                  
                  {/* Warning message if no products */}
                  {/* {estimationItems.length === 0 && (
                    <Card className="mb-3 border-warning bg-warning bg-opacity-10">
                      <Card.Body className="py-2">
                        <div className="d-flex align-items-center gap-2 text-warning">
                          <strong>⚠️ Required:</strong>
                          <span>Please add at least one product to the estimation chart before creating the deal.</span>
                        </div>
                      </Card.Body>
                    </Card>
                  )} */}
                  
                  {/* Deal-level settings */}
                  {/* <Row className="mb-4">
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
                    {extensions?.length > 1 && <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Special Discount (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.special_discount_percentage}
                          onChange={(e) => setFormData({ ...formData, special_discount_percentage: e.target.value })}
                          placeholder="0"
                        />
                      </Form.Group>
                    </Col>}
                  </Row> */}

                  {/* Add Item Button */}
                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingItemIndex(null);
                        setShowAllIndustries(false);
                        setItemFormData({
                          product_id: null,
                          product_service: "",
                          description: "",
                          qty: 1,
                          unit_price: 0,
                          tax_percentage: "0",
                          standard_discount_percentage: "0",
                          special_discount_percentage: "0",
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
                        /*overflow: hidden;*/
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
                              <th style={{ minWidth: '80px', textAlign: 'center' }}>Tax (%)</th>
                              <th style={{ minWidth: '90px', textAlign: 'center' }}>Std Disc (%)</th>
                              <th style={{ minWidth: '90px', textAlign: 'center' }}>Spec Disc (%)</th>
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
                              const taxPct = parseFloat(String(item.tax_percentage ?? "0")) || 0;
                              const stdPct = parseFloat(String(item.standard_discount_percentage ?? "0")) || 0;
                              const specPct = parseFloat(String(item.special_discount_percentage ?? "0")) || 0;
                              const discPct = stdPct + specPct;
                              const lineDisc = (subtotal * discPct) / 100;
                              const lineAfterDisc = subtotal - lineDisc;
                              const lineTax = (lineAfterDisc * taxPct) / 100;
                              const lineTotal = lineAfterDisc + lineTax;
                              
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
                                      {formData.currency || 'AED'} {parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {showConversionInfo && (
                                      <div className="small text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                        Original: {formatCurrency(item.original_price, item.original_currency)}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#6c757d', fontSize: '0.875rem' }}>
                                    {item.tax_percentage ?? '0'}%
                                  </td>
                                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#6c757d', fontSize: '0.875rem' }}>
                                    {item.standard_discount_percentage ?? '0'}%
                                  </td>
                                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap', color: '#6c757d', fontSize: '0.875rem' }}>
                                    {item.special_discount_percentage ?? '0'}%
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                            description: item.description ?? "",
                                            qty: item.qty,
                                            unit_price: item.unit_price,
                                            tax_percentage: item.tax_percentage ?? "0",
                                            standard_discount_percentage: item.standard_discount_percentage ?? "0",
                                            special_discount_percentage: item.special_discount_percentage ?? "0",
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
                                <td colSpan={estimationItems.some((item) => item.description) ? 11 : 10} className="text-center text-muted py-5">
                                  <Package size={40} className="text-muted mb-3" style={{ opacity: 0.5, display: 'block', margin: '0 auto 12px' }} />
                                  <div style={{ fontSize: '0.938rem', fontWeight: 500, marginBottom: '4px' }}>No items in estimation chart</div>
                                  <small style={{ fontSize: '0.813rem' }}>Click "Add Item" to add products or services</small>
                                </td>
                              </tr>
                            )}
                          </tbody>
                          {estimationItems.length > 0 && (() => {
                            const subtotalAll = estimationItems.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
                            let totalDiscountSum = 0;
                            let totalTaxSum = 0;
                            estimationItems.forEach((item) => {
                              const st = item.qty * item.unit_price;
                              const stdPct = parseFloat(String(item.standard_discount_percentage ?? "0")) || 0;
                              const specPct = parseFloat(String(item.special_discount_percentage ?? "0")) || 0;
                              const taxPct = parseFloat(String(item.tax_percentage ?? "0")) || 0;
                              const disc = (st * (stdPct + specPct)) / 100;
                              const afterDisc = st - disc;
                              totalDiscountSum += disc;
                              totalTaxSum += (afterDisc * taxPct) / 100;
                            });
                            const netValue = subtotalAll - totalDiscountSum + totalTaxSum;
                            const colSpanVal = estimationItems.some((item) => item.description) ? 10 : 9;
                            return (
                              <tfoot>
                                <tr>
                                  <td colSpan={colSpanVal} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <strong>Subtotal:</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {subtotalAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                                {totalDiscountSum > 0 && (
                                  <tr>
                                    <td colSpan={colSpanVal} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <span style={{ color: '#6c757d' }}>Total Discount:</span>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#dc3545', whiteSpace: 'nowrap' }}>
                                      - {formData.currency || 'AED'} {totalDiscountSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                {totalTaxSum > 0 && (
                                  <tr>
                                    <td colSpan={colSpanVal} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <strong>Total Tax:</strong>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {formData.currency || 'AED'} {totalTaxSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '1rem', borderTop: '2px solid #dee2e6' }}>
                                  <td colSpan={colSpanVal} style={{ textAlign: 'right', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px' }}>
                                    <strong style={{ fontSize: '1rem' }}>Total:</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#198754', paddingTop: '16px', paddingBottom: '16px', paddingRight: '20px', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              </div>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleBackOrCancel}
          >
            {formStep > 0 ? <><ChevronLeft size={16} className="me-1" /> Previous</> : 'Cancel'}
          </Button>
          
          {formStep < 4 ? (
            <Button 
              variant="primary"
              onClick={handleNextStep}
            >
              Next <ChevronRight size={16} className="ms-1" />
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={loading || estimationItems.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Creating...
                </>
              ) : (
                'Create Deal'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Add Item Modal - nested modal for adding products */}
      {/* Copy the Add Item Modal from the original file */}
      <Modal show={showAddItemModal} onHide={() => {
              setShowAddItemModal(false);
              setEditingItemIndex(null);
              setShowAllIndustries(false);
              setItemFormData({
                product_id: null,
                product_service: "",
                description: "",
                qty: 1,
                unit_price: 0,
                tax_percentage: "0",
                standard_discount_percentage: "0",
                special_discount_percentage: "0",
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
                  tax_percentage: itemFormData.tax_percentage || "0",
                  standard_discount_percentage: itemFormData.standard_discount_percentage || "0",
                  special_discount_percentage: itemFormData.special_discount_percentage || "0",
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
                  tax_percentage: "0",
                  standard_discount_percentage: "0",
                  special_discount_percentage: "0",
                });
              }} noValidate>
                <Modal.Body>
                  <Row className="g-3">
                    {/* Industry Selection */}
                    <Col md={12}>
                      <Form.Group>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <Form.Label>Product Group <span className="text-danger">*</span></Form.Label>
                          <Form.Check
                            type="switch"
                            id="show-all-industries"
                            label="Show All Product Groups"
                            checked={showAllIndustries}
                            onChange={(e) => {
                              setShowAllIndustries(e.target.checked);
                              // Reset selected industry when switching
                              setSelectedIndustryId(null);
                              setItemFormData({
                                ...itemFormData,
                                product_id: null,
                                product_service: "",
                                unit_price: 0,
                              });
                              setProducts([]);
                            }}
                          />
                        </div>
                        {(() => {
                          // Determine available industries based on switch
                          const availableIndustries = showAllIndustries
                            ? allIndustries
                            : (formData.industry_ids && formData.industry_ids.length > 0
                              ? allIndustries.filter(ind => formData.industry_ids.includes(ind.id))
                              : campaignIndustries);
                          
                          return (
                            <Select
                              value={selectedIndustryId ? {
                                value: selectedIndustryId,
                                label: availableIndustries.find(ind => ind.id === selectedIndustryId)?.name || ""
                              } : null}
                              onChange={handleIndustryChange}
                              options={availableIndustries.map(industry => ({
                                value: industry.id,
                                label: industry.name
                              }))}
                              placeholder="Select product group..."
                              isSearchable
                              isLoading={loadingIndustries || loadingAllIndustries}
                              isDisabled={loadingIndustries || loadingAllIndustries}
                              required
                            />
                          );
                        })()}
                        {(() => {
                          const availableIndustries = showAllIndustries
                            ? allIndustries
                            : (formData.industry_ids && formData.industry_ids.length > 0
                              ? allIndustries.filter(ind => formData.industry_ids.includes(ind.id))
                              : campaignIndustries);
                          
                          return availableIndustries.length === 1 && !showAllIndustries ? (
                            <Form.Text className="text-muted">
                              Only one product group available
                            </Form.Text>
                          ) : null;
                        })()}
                      </Form.Group>
                    </Col>
                    
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
                              // Calculate converted price synchronously for display (will be recalculated on selection)
                              // For now, just show original price - conversion happens on selection
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
                          placeholder={selectedIndustryId ? "Select a product" : "Please select a product group first"}
                          isSearchable
                          isLoading={loadingProducts}
                          isDisabled={editingItemIndex !== null || !selectedIndustryId || loadingProducts}
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
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Tax (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={itemFormData.tax_percentage}
                          onChange={(e) => setItemFormData({ ...itemFormData, tax_percentage: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Standard Discount (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={itemFormData.standard_discount_percentage}
                          onChange={(e) => setItemFormData({ ...itemFormData, standard_discount_percentage: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Special Discount (%)</Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0"
                          value={itemFormData.special_discount_percentage}
                          onChange={(e) => setItemFormData({ ...itemFormData, special_discount_percentage: e.target.value })}
                        />
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
                    setShowAllIndustries(false);
                    setItemFormData({
                      product_id: null,
                      product_service: "",
                      description: "",
                      qty: 1,
                      unit_price: 0,
                      tax_percentage: "0",
                      standard_discount_percentage: "0",
                      special_discount_percentage: "0",
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
                        tax_percentage: itemFormData.tax_percentage || "0",
                        standard_discount_percentage: itemFormData.standard_discount_percentage || "0",
                        special_discount_percentage: itemFormData.special_discount_percentage || "0",
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
                        tax_percentage: "0",
                        standard_discount_percentage: "0",
                        special_discount_percentage: "0",
                      });
                    }}
                  >
                    {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                  </Button>
                </Modal.Footer>
              </Form>
            </Modal>
    </>
  );
};

export default ConvertToDealModal;