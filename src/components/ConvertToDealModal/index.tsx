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

type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

async function fetchProductsByIndustryImpl(args: {
  industryId: number;
  setLoadingProducts: SetState<boolean>;
  setProducts: SetState<CrmProduct[]>;
}): Promise<void> {
  try {
    args.setLoadingProducts(true);
    const response = await getCrmProducts({
      per_page: 100,
      industry_id: args.industryId,
    });
    args.setProducts(response.data || []);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    toast.error("Failed to fetch products");
  } finally {
    args.setLoadingProducts(false);
  }
}

async function loadLeadTemplateImpl(args: {
  leadId: number;
  setLoadingTemplate: SetState<boolean>;
  setDealTemplate: SetState<DealTemplateData | null>;
  setTemplateFieldsData: SetState<Record<string, any>>;
}): Promise<void> {
  try {
    args.setLoadingTemplate(true);
    const { template, templateFieldsData: initialFields } =
      await loadDealTemplateForLead(args.leadId);
    if (template) {
      args.setDealTemplate(template);
      args.setTemplateFieldsData(initialFields);
    }
  } catch (error) {
    console.error("Failed to fetch deal template:", error);
  } finally {
    args.setLoadingTemplate(false);
  }
}

async function loadCampaignIndustryContextImpl(args: {
  campaignId: number;
  setLoadingIndustries: SetState<boolean>;
  setCampaignIndustries: SetState<IndustryData[]>;
  setFormData: SetState<any>;
  setSelectedIndustryId: SetState<number | null>;
  fetchProductsByIndustry: (industryId: number) => Promise<void>;
}): Promise<void> {
  try {
    args.setLoadingIndustries(true);
    const ctx = await loadCampaignIndustryContext(args.campaignId);
    if (ctx.campaignIndustryIds.length === 0) return;

    args.setCampaignIndustries(ctx.filteredIndustries);
    args.setFormData((prev: any) => ({
      ...prev,
      industry_ids: ctx.campaignIndustryIds,
    }));

    if (ctx.filteredIndustries.length === 1) {
      const industryId = ctx.filteredIndustries[0].id;
      args.setSelectedIndustryId(industryId);
      await args.fetchProductsByIndustry(industryId);
    }
  } catch (error) {
    console.error("Failed to fetch campaign/industries:", error);
  } finally {
    args.setLoadingIndustries(false);
  }
}

async function fetchLeadDataImpl(args: {
  leadId: number;
  setLoadingLead: SetState<boolean>;
  setSourceLead: SetState<any>;
  setFormData: SetState<any>;
  setLoadingTemplate: SetState<boolean>;
  setDealTemplate: SetState<DealTemplateData | null>;
  setTemplateFieldsData: SetState<Record<string, any>>;
  setLoadingIndustries: SetState<boolean>;
  setCampaignIndustries: SetState<IndustryData[]>;
  setSelectedIndustryId: SetState<number | null>;
  fetchProductsByIndustry: (industryId: number) => Promise<void>;
}): Promise<void> {
  try {
    args.setLoadingLead(true);
    const leadData: any = await getLead(args.leadId);
    args.setSourceLead(leadData);

    const leadRecord = leadData as Record<string, unknown>;
    args.setFormData(buildConvertDealFormStateFromLead(leadRecord, args.leadId));

    await loadLeadTemplateImpl({
      leadId: args.leadId,
      setLoadingTemplate: args.setLoadingTemplate,
      setDealTemplate: args.setDealTemplate,
      setTemplateFieldsData: args.setTemplateFieldsData,
    });

    const campaignId = leadData?.campaign_id;
    if (!campaignId) return;
    await loadCampaignIndustryContextImpl({
      campaignId: Number(campaignId),
      setLoadingIndustries: args.setLoadingIndustries,
      setCampaignIndustries: args.setCampaignIndustries,
      setFormData: args.setFormData,
      setSelectedIndustryId: args.setSelectedIndustryId,
      fetchProductsByIndustry: args.fetchProductsByIndustry,
    });
  } catch (error) {
    console.error("Failed to fetch lead:", error);
    toast.error("Failed to load lead data");
  } finally {
    args.setLoadingLead(false);
  }
}

type DealCreatePayloadArgs = Parameters<typeof buildDealCreatePayload>[0];
type ConvertDealFormData = DealCreatePayloadArgs["formData"];

type EstimationItemFormData = {
  product_id: number | null;
  product_service: string;
  description: string;
  qty: number;
  unit_price: number;
  tax_percentage: string;
  standard_discount_percentage: string;
  special_discount_percentage: string;
};

function buildEmptyEstimationItemFormData(): EstimationItemFormData {
  return {
    product_id: null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  };
}

function getAddItemAvailableIndustries(
  showAllIndustries: boolean,
  allIndustries: IndustryData[],
  formData: { industry_ids?: number[] },
  campaignIndustries: IndustryData[],
): IndustryData[] {
  if (showAllIndustries) {
    return allIndustries;
  }
  const industryIds = formData.industry_ids;
  if (industryIds && industryIds.length > 0) {
    return allIndustries.filter((ind) => industryIds.includes(ind.id));
  }
  return campaignIndustries;
}

function ConvertDealTimelineNav(props: Readonly<{
  formStep: number;
  hasTemplate: boolean;
  onStepClick: (step: number) => void;
}>) {
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between position-relative">
        <div
          className="position-absolute bg-light"
          style={{ left: "0", right: "0", top: "20px", height: "2px", zIndex: 0 }}
        />
        <div
          className="position-absolute bg-primary"
          style={{
            left: "0",
            top: "20px",
            height: "2px",
            width: `${getConvertDealTimelineProgressPercent(props.formStep, props.hasTemplate)}%`,
            zIndex: 0,
            transition: "width 0.3s ease",
          }}
        />

        {[0, 1, 2, 3, 4].map((step) => {
          if (!isConvertDealStepVisible(step, props.hasTemplate)) return null;
          const displayNumber = getConvertDealDisplayNumber(step, props.hasTemplate);

          return (
            <button
              type="button"
              key={step}
              className="text-center position-relative"
              style={{
                cursor: "pointer",
                flex: 1,
                background: "transparent",
                border: "none",
                padding: 0,
              }}
              onClick={() => props.onStepClick(step)}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${
                  props.formStep >= step ? "bg-primary text-white" : "bg-light text-muted"
                }`}
                style={{ width: "40px", height: "40px", zIndex: 1, position: "relative" }}
              >
                {props.formStep > step ? <CheckCircle size={20} /> : displayNumber}
              </div>
              <small
                className={`d-block mt-2 ${
                  props.formStep === step ? "fw-bold text-primary" : "text-muted"
                }`}
              >
                {getConvertDealStepLabel(step)}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConvertDealFooter(props: Readonly<{
  formStep: number;
  loading: boolean;
  estimationItemsCount: number;
  onBackOrCancel: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onSubmit: (e: React.FormEvent | React.MouseEvent) => void;
}>) {
  return (
    <Modal.Footer>
      <Button variant="secondary" onClick={props.onBackOrCancel}>
        {props.formStep > 0 ? (
          <>
            <ChevronLeft size={16} className="me-1" /> Previous
          </>
        ) : (
          "Cancel"
        )}
      </Button>

      {props.formStep < 4 ? (
        <Button variant="primary" onClick={props.onNext}>
          Next <ChevronRight size={16} className="ms-1" />
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={props.onSubmit}
          disabled={props.loading || props.estimationItemsCount === 0}
        >
          {props.loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              {" "}
              Creating...
            </>
          ) : (
            "Create Deal"
          )}
        </Button>
      )}
    </Modal.Footer>
  );
}

function DealInformationStep(props: Readonly<{
  formData: any;
  setFormData: SetState<any>;
  stages: StageData[];
  extensions: any[];
  handleDealCurrencyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}>) {
  return (
    <Card className="mb-3 border-0 bg-light">
      <Card.Body>
        <h5 className="fw-bold mb-4 text-primary">DEAL INFORMATION</h5>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Deal Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={props.formData.name}
                onChange={(e) => props.setFormData({ ...props.formData, name: e.target.value })}
                placeholder="Enter deal name"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Stage <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={props.formData.stage_id || ""}
                onChange={(e) =>
                  props.setFormData({
                    ...props.formData,
                    stage_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                required
              >
                <option value="">Select Stage</option>
                {props.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Expected Close Date <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="date"
                value={props.formData.expected_close_date}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, expected_close_date: e.target.value })
                }
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Assigned to <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={props.formData.assigned_to || ""}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, assigned_to: e.target.value || null })
                }
                required
              >
                <option value="">Select User</option>
                {props.extensions.map((ext: any) => (
                  <option key={ext.id || ext.extension} value={ext.id || ext.extension}>
                    {ext.display_name || ext.name || ext.id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Currency <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select value={props.formData.currency} onChange={props.handleDealCurrencyChange} required>
                <option value="AED">AED</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Follow-up Date</Form.Label>
              <Form.Control
                type="date"
                value={props.formData.follow_up_date}
                onChange={(e) => props.setFormData({ ...props.formData, follow_up_date: e.target.value })}
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function CompanyInformationStep(props: Readonly<{
  formData: any;
  setFormData: SetState<any>;
  businessTypes: BusinessTypeData[];
  businessTypeId: number | null;
  setBusinessTypeId: SetState<number | null>;
  businessTypeOther: string;
  setBusinessTypeOther: SetState<string>;
  showOtherBusinessType: boolean;
  setShowOtherBusinessType: SetState<boolean>;
}>) {
  let businessTypeSelectValue = "";
  if (props.showOtherBusinessType) {
    businessTypeSelectValue = "other";
  } else if (props.businessTypeId) {
    businessTypeSelectValue = String(props.businessTypeId);
  }

  return (
    <Card className="mb-3 border-0 bg-light">
      <Card.Body>
        <h5 className="fw-bold mb-4 text-success">COMPANY INFORMATION</h5>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Company Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={props.formData.company_name}
                onChange={(e) => props.setFormData({ ...props.formData, company_name: e.target.value })}
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
                value={props.formData.company_domain}
                onChange={(e) => props.setFormData({ ...props.formData, company_domain: e.target.value })}
                placeholder="e.g. example.com"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Select Business Type <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={businessTypeSelectValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "other") {
                    props.setShowOtherBusinessType(true);
                    props.setBusinessTypeId(null);
                    props.setBusinessTypeOther("");
                    return;
                  }
                  if (value) {
                    props.setShowOtherBusinessType(false);
                    props.setBusinessTypeId(Number(value));
                    props.setBusinessTypeOther("");
                    return;
                  }
                  props.setShowOtherBusinessType(false);
                  props.setBusinessTypeId(null);
                  props.setBusinessTypeOther("");
                }}
                required
              >
                <option value="">Select Business Type</option>
                {props.businessTypes.map((businessType) => (
                  <option key={businessType.id} value={businessType.id}>
                    {businessType.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>

          {props.showOtherBusinessType && (
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Business Type (Other) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={props.businessTypeOther}
                  onChange={(e) => props.setBusinessTypeOther(e.target.value)}
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
                value={props.formData.decision_maker_title}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, decision_maker_title: e.target.value })
                }
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
              <Form.Label>
                Decision Maker Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={props.formData.decision_maker_name}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, decision_maker_name: e.target.value })
                }
                placeholder="Decision maker name"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Decision Maker Email <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="email"
                autoCapitalize="off"
                value={props.formData.decision_maker_email}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, decision_maker_email: e.target.value })
                }
                placeholder="decisionmaker@company.com"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                Decision Maker Phone <span className="text-danger">*</span>
              </Form.Label>
              <div className="phone-input-wrapper">
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={
                    props.formData.decision_maker_phone_country_code && props.formData.decision_maker_phone
                      ? `${props.formData.decision_maker_phone_country_code}${props.formData.decision_maker_phone}`
                      : props.formData.decision_maker_phone || undefined
                  }
                  onChange={(value) => {
                    if (value) {
                      try {
                        const phoneNumber = parsePhoneNumber(value);
                        if (phoneNumber) {
                          props.setFormData((prev: any) => ({
                            ...prev,
                            decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                            decision_maker_phone: phoneNumber.nationalNumber,
                          }));
                        } else {
                          props.setFormData((prev: any) => ({
                            ...prev,
                            decision_maker_phone_country_code: "",
                            decision_maker_phone: value,
                          }));
                        }
                      } catch (error) {
                        console.error("Failed to parse phone number:", error);
                        props.setFormData((prev: any) => ({
                          ...prev,
                          decision_maker_phone_country_code: "",
                          decision_maker_phone: value,
                        }));
                      }
                      return;
                    }
                    props.setFormData((prev: any) => ({
                      ...prev,
                      decision_maker_phone_country_code: "",
                      decision_maker_phone: "",
                    }));
                  }}
                  placeholder="Enter phone number"
                />
              </div>
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function DealCharacteristicsStep(props: Readonly<{
  dealTemplate: DealTemplateData | null;
  loadingTemplate: boolean;
  templateFieldsData: Record<string, any>;
  setTemplateFieldsData: SetState<Record<string, any>>;
}>) {
  const template = props.dealTemplate;
  if (!template) return null;

  const fields = template.fields || [];
  const sortedFields = [...fields].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  );

  const renderTemplateFieldControl = (field: DealTemplateField) => {
    const fieldValue = props.templateFieldsData[field.field_name] || "";
    const updateField = (value: string) => {
      props.setTemplateFieldsData({
        ...props.templateFieldsData,
        [field.field_name]: value,
      });
    };

    if (field.field_type === "dropdown") {
      return (
        <Form.Select
          value={fieldValue}
          onChange={(e) => updateField(e.target.value)}
          required={field.is_required}
        >
          <option value="">Select {field.field_name}</option>
          {field.options?.map((option: string) => (
            <option key={`${field.field_name}:${option}`} value={option}>
              {option}
            </option>
          ))}
        </Form.Select>
      );
    }

    if (field.field_type === "text" || !field.field_type) {
      return (
        <Form.Control
          type="text"
          value={fieldValue}
          onChange={(e) => updateField(e.target.value)}
          placeholder={`Enter ${field.field_name}`}
          required={field.is_required}
        />
      );
    }

    let inputType: "date" | "email" | "text" = "text";
    if (field.field_type === "date") {
      inputType = "date";
    } else if (field.field_type === "email") {
      inputType = "email";
    }

    return (
      <Form.Control
        type={inputType}
        value={fieldValue}
        onChange={(e) => updateField(e.target.value)}
        placeholder={`Enter ${field.field_name}`}
        required={field.is_required}
      />
    );
  };

  let templateMainContent: React.ReactNode;
  if (props.loadingTemplate) {
    templateMainContent = (
      <div className="text-center py-4">
        <output className="d-inline-block" aria-live="polite">
          <div className="spinner-border text-primary">
            <span className="visually-hidden">Loading template...</span>
          </div>
        </output>
        <p className="mt-2 text-muted">Loading template fields...</p>
      </div>
    );
  } else if (sortedFields.length > 0) {
    templateMainContent = (
      <Row>
        {sortedFields.map((field: DealTemplateField) => (
          <Col md={6} key={field.field_name}>
            <Form.Group className="mb-3">
              <Form.Label>
                {field.field_name}
                {field.is_required && <span className="text-danger"> *</span>}
              </Form.Label>
              {renderTemplateFieldControl(field)}
            </Form.Group>
          </Col>
        ))}
      </Row>
    );
  } else {
    templateMainContent = (
      <div className="text-center py-4 text-muted">
        <p>No fields defined in this template.</p>
      </div>
    );
  }

  return (
    <Card className="mb-3 border-0 bg-light">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold mb-0 text-info">DEAL CHARACTERISTICS</h5>
          {template.name && (
            <Badge bg="info" className="ms-2">
              Template: {template.name}
            </Badge>
          )}
        </div>
        {template.description && (
          <div className="alert alert-info mb-4">
            <small>{template.description}</small>
          </div>
        )}

        {templateMainContent}
      </Card.Body>
    </Card>
  );
}

function NegotiationProgressStep(props: Readonly<{ formData: any; setFormData: SetState<any> }>) {
  return (
    <Card className="mb-3 border-0 bg-light">
      <Card.Body>
        <h5 className="fw-bold mb-4 text-warning">NEGOTIATION PROGRESS</h5>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Quotation Sent</Form.Label>
              <Form.Check
                type="checkbox"
                checked={props.formData.quotation_sent}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, quotation_sent: e.target.checked })
                }
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Contract Sent</Form.Label>
              <Form.Check
                type="checkbox"
                checked={props.formData.contract_sent}
                onChange={(e) => props.setFormData({ ...props.formData, contract_sent: e.target.checked })}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Contract Received</Form.Label>
              <Form.Check
                type="checkbox"
                checked={props.formData.contract_received}
                onChange={(e) =>
                  props.setFormData({ ...props.formData, contract_received: e.target.checked })
                }
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

function EstimationChartStep(props: Readonly<{
  formData: any;
  products: CrmProduct[];
  estimationItems: EstimationItem[];
  setEstimationItems: SetState<EstimationItem[]>;
  setShowAddItemModal: SetState<boolean>;
  setEditingItemIndex: SetState<number | null>;
  setShowAllIndustries: SetState<boolean>;
  setItemFormData: SetState<EstimationItemFormData>;
}>) {
  return (
    <Card className="mb-3 border-0 bg-light">
      <Card.Body>
        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              props.setEditingItemIndex(null);
              props.setShowAllIndustries(false);
              props.setItemFormData(buildEmptyEstimationItemFormData());
              props.setShowAddItemModal(true);
            }}
          >
            <Plus size={14} className="me-1" />
            Add Item
          </Button>
        </div>

        <div style={{ marginBottom: "30px", width: "100%" }}>
          <style
            dangerouslySetInnerHTML={{
              __html: `
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
                    `,
            }}
          />
          <div className="order-items-table-wrapper">
            <div className="table-responsive" style={{ width: "100%" }}>
              <Table hover style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ minWidth: "200px" }}>Product Name</th>
                    <th style={{ minWidth: "120px" }}>SKU</th>
                    <th style={{ minWidth: "80px", textAlign: "center" }}>Qty</th>
                    {props.estimationItems.some((item) => item.description) && (
                      <th style={{ minWidth: "180px" }}>Description</th>
                    )}
                    <th style={{ minWidth: "140px", textAlign: "right" }}>Unit Price</th>
                    <th style={{ minWidth: "80px", textAlign: "center" }}>Tax (%)</th>
                    <th style={{ minWidth: "90px", textAlign: "center" }}>Std Disc (%)</th>
                    <th style={{ minWidth: "90px", textAlign: "center" }}>Spec Disc (%)</th>
                    <th style={{ minWidth: "150px", textAlign: "right" }}>Total Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {props.estimationItems.map((item, index) => {
                    const subtotal = item.qty * item.unit_price;
                    const product = props.products.find((p) => p.id === item.product_id);
                    const showConversionInfo =
                      product &&
                      product.currency.toUpperCase() !== props.formData.currency.toUpperCase() &&
                      item.original_currency &&
                      item.original_price !== item.unit_price;
                    const taxPct = Number.parseFloat(String(item.tax_percentage ?? "0")) || 0;
                    const stdPct = Number.parseFloat(String(item.standard_discount_percentage ?? "0")) || 0;
                    const specPct = Number.parseFloat(String(item.special_discount_percentage ?? "0")) || 0;
                    const discPct = stdPct + specPct;
                    const lineDisc = (subtotal * discPct) / 100;
                    const lineAfterDisc = subtotal - lineDisc;
                    const lineTax = (lineAfterDisc * taxPct) / 100;
                    const lineTotal = lineAfterDisc + lineTax;

                    return (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td className="fw-semibold" style={{ color: "#212529" }}>
                          {item.product_service || "N/A"}
                        </td>
                        <td style={{ color: "#6c757d", fontSize: "0.813rem" }}>{product?.sku || "N/A"}</td>
                        <td style={{ textAlign: "center", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {item.qty || "0"}
                        </td>
                        {props.estimationItems.some((i) => i.description) && (
                          <td
                            style={{
                              maxWidth: "180px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "#6c757d",
                              fontSize: "0.813rem",
                            }}
                          >
                            {item.description || "-"}
                          </td>
                        )}
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 500 }}>
                            {props.formData.currency || "AED"}{" "}
                            {Number.parseFloat(String(item.unit_price || "0")).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          {showConversionInfo && (
                            <div className="small text-muted" style={{ fontSize: "0.75rem", marginTop: "2px" }}>
                              Original: {formatCurrency(item.original_price, item.original_currency)}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap", color: "#6c757d", fontSize: "0.875rem" }}>
                          {item.tax_percentage ?? "0"}%
                        </td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap", color: "#6c757d", fontSize: "0.875rem" }}>
                          {item.standard_discount_percentage ?? "0"}%
                        </td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap", color: "#6c757d", fontSize: "0.875rem" }}>
                          {item.special_discount_percentage ?? "0"}%
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "#212529", whiteSpace: "nowrap" }}>
                          {props.formData.currency || "AED"}{" "}
                          {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1"
                              title="Edit Item"
                              style={{ minWidth: "auto", padding: "4px" }}
                              onClick={() => {
                                props.setEditingItemIndex(index);
                                props.setItemFormData({
                                  product_id: item.product_id,
                                  product_service: item.product_service,
                                  description: item.description ?? "",
                                  qty: item.qty,
                                  unit_price: item.unit_price,
                                  tax_percentage: item.tax_percentage ?? "0",
                                  standard_discount_percentage: item.standard_discount_percentage ?? "0",
                                  special_discount_percentage: item.special_discount_percentage ?? "0",
                                });
                                props.setShowAddItemModal(true);
                              }}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-1 text-danger"
                              title="Delete Item"
                              style={{ minWidth: "auto", padding: "4px" }}
                              onClick={() => {
                                props.setEstimationItems(props.estimationItems.filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {props.estimationItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={props.estimationItems.some((item) => item.description) ? 11 : 10}
                        className="text-center text-muted py-5"
                      >
                        <Package
                          size={40}
                          className="text-muted mb-3"
                          style={{ opacity: 0.5, display: "block", margin: "0 auto 12px" }}
                        />
                        <div style={{ fontSize: "0.938rem", fontWeight: 500, marginBottom: "4px" }}>
                          No items in estimation chart
                        </div>
                        <small style={{ fontSize: "0.813rem" }}>
                          Click "Add Item" to add products or services
                        </small>
                      </td>
                    </tr>
                  )}
                </tbody>
                {props.estimationItems.length > 0 &&
                  (() => {
                    const subtotalAll = props.estimationItems.reduce(
                      (sum, item) => sum + item.qty * item.unit_price,
                      0,
                    );
                    let totalDiscountSum = 0;
                    let totalTaxSum = 0;
                    props.estimationItems.forEach((item) => {
                      const st = item.qty * item.unit_price;
                      const stdPct = Number.parseFloat(String(item.standard_discount_percentage ?? "0")) || 0;
                      const specPct = Number.parseFloat(String(item.special_discount_percentage ?? "0")) || 0;
                      const taxPct = Number.parseFloat(String(item.tax_percentage ?? "0")) || 0;
                      const disc = (st * (stdPct + specPct)) / 100;
                      const afterDisc = st - disc;
                      totalDiscountSum += disc;
                      totalTaxSum += (afterDisc * taxPct) / 100;
                    });
                    const netValue = subtotalAll - totalDiscountSum + totalTaxSum;
                    const colSpanVal = props.estimationItems.some((item) => item.description) ? 10 : 9;
                    return (
                      <tfoot>
                        <tr>
                          <td colSpan={colSpanVal} style={{ textAlign: "right", paddingRight: "20px" }}>
                            <strong>Subtotal:</strong>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                            {props.formData.currency || "AED"}{" "}
                            {subtotalAll.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                        {totalDiscountSum > 0 && (
                          <tr>
                            <td colSpan={colSpanVal} style={{ textAlign: "right", paddingRight: "20px" }}>
                              <span style={{ color: "#6c757d" }}>Total Discount:</span>
                            </td>
                            <td style={{ textAlign: "right", color: "#dc3545", whiteSpace: "nowrap" }}>
                              - {props.formData.currency || "AED"}{" "}
                              {totalDiscountSum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )}
                        {totalTaxSum > 0 && (
                          <tr>
                            <td colSpan={colSpanVal} style={{ textAlign: "right", paddingRight: "20px" }}>
                              <strong>Total Tax:</strong>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {props.formData.currency || "AED"}{" "}
                              {totalTaxSum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )}
                        <tr style={{ fontSize: "1rem", borderTop: "2px solid #dee2e6" }}>
                          <td
                            colSpan={colSpanVal}
                            style={{
                              textAlign: "right",
                              paddingRight: "20px",
                              paddingTop: "16px",
                              paddingBottom: "16px",
                              paddingLeft: "20px",
                            }}
                          >
                            <strong style={{ fontSize: "1rem" }}>Total:</strong>
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              fontSize: "1rem",
                              color: "#198754",
                              paddingTop: "16px",
                              paddingBottom: "16px",
                              paddingRight: "20px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {props.formData.currency || "AED"}{" "}
                            {netValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
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
  );
}

function ConvertDealStepSwitcher(props: Readonly<{
  formStep: number;
  formData: any;
  setFormData: SetState<any>;
  stages: StageData[];
  extensions: any[];
  handleDealCurrencyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  businessTypes: BusinessTypeData[];
  businessTypeId: number | null;
  setBusinessTypeId: SetState<number | null>;
  businessTypeOther: string;
  setBusinessTypeOther: SetState<string>;
  showOtherBusinessType: boolean;
  setShowOtherBusinessType: SetState<boolean>;
  dealTemplate: DealTemplateData | null;
  loadingTemplate: boolean;
  templateFieldsData: Record<string, any>;
  setTemplateFieldsData: SetState<Record<string, any>>;
  products: CrmProduct[];
  estimationItems: EstimationItem[];
  setEstimationItems: SetState<EstimationItem[]>;
  setShowAddItemModal: SetState<boolean>;
  setEditingItemIndex: SetState<number | null>;
  setShowAllIndustries: SetState<boolean>;
  setItemFormData: SetState<EstimationItemFormData>;
}>) {
  switch (props.formStep) {
    case 0:
      return (
        <DealInformationStep
          formData={props.formData}
          setFormData={props.setFormData}
          stages={props.stages}
          extensions={props.extensions}
          handleDealCurrencyChange={props.handleDealCurrencyChange}
        />
      );
    case 1:
      return (
        <CompanyInformationStep
          formData={props.formData}
          setFormData={props.setFormData}
          businessTypes={props.businessTypes}
          businessTypeId={props.businessTypeId}
          setBusinessTypeId={props.setBusinessTypeId}
          businessTypeOther={props.businessTypeOther}
          setBusinessTypeOther={props.setBusinessTypeOther}
          showOtherBusinessType={props.showOtherBusinessType}
          setShowOtherBusinessType={props.setShowOtherBusinessType}
        />
      );
    case 2:
      return (
        <DealCharacteristicsStep
          dealTemplate={props.dealTemplate}
          loadingTemplate={props.loadingTemplate}
          templateFieldsData={props.templateFieldsData}
          setTemplateFieldsData={props.setTemplateFieldsData}
        />
      );
    case 3:
      return <NegotiationProgressStep formData={props.formData} setFormData={props.setFormData} />;
    case 4:
      return (
        <EstimationChartStep
          formData={props.formData}
          products={props.products}
          estimationItems={props.estimationItems}
          setEstimationItems={props.setEstimationItems}
          setShowAddItemModal={props.setShowAddItemModal}
          setEditingItemIndex={props.setEditingItemIndex}
          setShowAllIndustries={props.setShowAllIndustries}
          setItemFormData={props.setItemFormData}
        />
      );
    default:
      return null;
  }
}

function AddEstimationItemModal(props: Readonly<{
  show: boolean;
  onHide: () => void;
  editingItemIndex: number | null;
  setEditingItemIndex: SetState<number | null>;
  products: CrmProduct[];
  setProducts: SetState<CrmProduct[]>;
  formData: any;
  estimationItems: EstimationItem[];
  setEstimationItems: SetState<EstimationItem[]>;
  showAllIndustries: boolean;
  setShowAllIndustries: SetState<boolean>;
  selectedIndustryId: number | null;
  setSelectedIndustryId: SetState<number | null>;
  campaignIndustries: IndustryData[];
  allIndustries: IndustryData[];
  loadingIndustries: boolean;
  loadingAllIndustries: boolean;
  loadingProducts: boolean;
  convertingPrice: boolean;
  setConvertingPrice: SetState<boolean>;
  itemFormData: EstimationItemFormData;
  setItemFormData: SetState<EstimationItemFormData>;
  handleIndustryChange: (selectedOption: any) => Promise<void>;
}>) {
  const closeAndReset = () => {
    props.onHide();
    props.setEditingItemIndex(null);
    props.setShowAllIndustries(false);
    props.setItemFormData(buildEmptyEstimationItemFormData());
  };

  const availableIndustries = getAddItemAvailableIndustries(
    props.showAllIndustries,
    props.allIndustries,
    props.formData,
    props.campaignIndustries,
  );

  const isProductSelectDisabled =
    props.editingItemIndex === null ? !props.selectedIndustryId || props.loadingProducts : true;

  return (
    <Modal show={props.show} onHide={closeAndReset} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{props.editingItemIndex === null ? "Add New Item" : "Edit Item"}</Modal.Title>
      </Modal.Header>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const selectedProduct = props.products.find((p) => p.id === props.itemFormData.product_id);
          const newItem = {
            product_id: props.itemFormData.product_id!,
            product_service: props.itemFormData.product_service,
            description: props.itemFormData.description,
            qty: props.itemFormData.qty,
            unit_price: props.itemFormData.unit_price,
            original_currency: selectedProduct?.currency || props.formData.currency,
            original_price: Number.parseFloat(selectedProduct?.price || "0") || props.itemFormData.unit_price,
            tax_percentage: props.itemFormData.tax_percentage || "0",
            standard_discount_percentage: props.itemFormData.standard_discount_percentage || "0",
            special_discount_percentage: props.itemFormData.special_discount_percentage || "0",
          };

          if (props.editingItemIndex === null) {
            props.setEstimationItems([...props.estimationItems, newItem]);
          } else {
            const updated = [...props.estimationItems];
            updated[props.editingItemIndex] = newItem;
            props.setEstimationItems(updated);
          }

          closeAndReset();
        }}
        noValidate
      >
        <Modal.Body>
          <Row className="g-3">
            <Col md={12}>
              <Form.Group>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label>
                    Product Group <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Check
                    type="switch"
                    id="show-all-industries"
                    label="Show All Product Groups"
                    checked={props.showAllIndustries}
                    onChange={(e) => {
                      props.setShowAllIndustries(e.target.checked);
                      props.setSelectedIndustryId(null);
                      props.setItemFormData((prev) => ({
                        ...prev,
                        product_id: null,
                        product_service: "",
                        unit_price: 0,
                      }));
                      props.setProducts([]);
                    }}
                  />
                </div>
                <Select
                  value={
                    props.selectedIndustryId
                      ? {
                          value: props.selectedIndustryId,
                          label:
                            availableIndustries.find((ind) => ind.id === props.selectedIndustryId)?.name || "",
                        }
                      : null
                  }
                  onChange={props.handleIndustryChange}
                  options={availableIndustries.map((industry) => ({
                    value: industry.id,
                    label: industry.name,
                  }))}
                  placeholder="Select product group..."
                  isSearchable
                  isLoading={props.loadingIndustries || props.loadingAllIndustries}
                  isDisabled={props.loadingIndustries || props.loadingAllIndustries}
                  required
                />
                {props.showAllIndustries === false && availableIndustries.length === 1 ? (
                  <Form.Text className="text-muted">Only one product group available</Form.Text>
                ) : null}
              </Form.Group>
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>
                  Product <span className="text-danger">*</span>
                </Form.Label>
                <Select
                  value={
                    props.itemFormData.product_id
                      ? {
                          value: props.itemFormData.product_id,
                          label:
                            props.itemFormData.product_service ||
                            props.products.find((p) => p.id === props.itemFormData.product_id)?.name ||
                            "",
                        }
                      : null
                  }
                  onChange={async (selectedOption: any) => {
                    const product = props.products.find((p) => p.id === selectedOption?.value);
                    if (product) {
                      const originalPrice = Number.parseFloat(product.price) || 0;
                      const productCurrency = product.currency.toUpperCase();
                      const dealCurrency = props.formData.currency.toUpperCase();

                      let convertedPrice = originalPrice;
                      if (productCurrency !== dealCurrency) {
                        try {
                          props.setConvertingPrice(true);
                          convertedPrice = await convertCurrency(originalPrice, productCurrency, dealCurrency);
                        } catch (error) {
                          console.error("Failed to convert currency:", error);
                          toast.error(`Failed to convert ${productCurrency} to ${dealCurrency}`);
                          convertedPrice = originalPrice;
                        } finally {
                          props.setConvertingPrice(false);
                        }
                      }

                      props.setItemFormData((prev) => ({
                        ...prev,
                        product_id: product.id,
                        product_service: product.name,
                        unit_price: convertedPrice,
                      }));
                    }
                  }}
                  options={props.products.map((product) => {
                    const productCurrency = product.currency.toUpperCase();
                    const dealCurrency = props.formData.currency.toUpperCase();
                    const originalPrice = Number.parseFloat(product.price) || 0;

                    if (productCurrency !== dealCurrency) {
                      return {
                        value: product.id,
                        label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(
                          2,
                        )} → ${dealCurrency} (will convert)`,
                      };
                    }

                    return {
                      value: product.id,
                      label: `${product.name} (${product.sku}) - ${productCurrency} ${originalPrice.toFixed(2)}`,
                    };
                  })}
                  placeholder={props.selectedIndustryId ? "Select a product" : "Please select a product group first"}
                  isSearchable
                  isLoading={props.loadingProducts}
                  isDisabled={isProductSelectDisabled}
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
                  value={props.itemFormData.description}
                  onChange={(e) => props.setItemFormData({ ...props.itemFormData, description: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Quantity <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={props.itemFormData.qty}
                  onChange={(e) =>
                    props.setItemFormData({
                      ...props.itemFormData,
                      qty: Number.parseInt(e.target.value, 10) || 1,
                    })
                  }
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Unit Price <span className="text-danger">*</span>
                  {props.convertingPrice && (
                    <output className="ms-2 text-muted small d-inline-flex align-items-center" aria-live="polite">
                      <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                      {" "}
                      Converting...
                    </output>
                  )}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter unit price"
                  value={props.itemFormData.unit_price}
                  onChange={(e) =>
                    props.setItemFormData({
                      ...props.itemFormData,
                      unit_price: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  disabled={props.convertingPrice}
                />
                {props.itemFormData.product_id &&
                  (() => {
                    const selectedProduct = props.products.find((p) => p.id === props.itemFormData.product_id);
                    if (selectedProduct) {
                      const productCurrency = selectedProduct.currency.toUpperCase();
                      const dealCurrency = props.formData.currency.toUpperCase();
                      const originalPrice = Number.parseFloat(selectedProduct.price) || 0;

                      if (productCurrency !== dealCurrency && props.itemFormData.unit_price !== originalPrice) {
                        return (
                          <Form.Text className="text-muted d-block">
                            Converted from {formatCurrency(originalPrice, productCurrency)} {" → "}
                            {formatCurrency(props.itemFormData.unit_price, dealCurrency)}
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
                  value={props.itemFormData.tax_percentage}
                  onChange={(e) => props.setItemFormData({ ...props.itemFormData, tax_percentage: e.target.value })}
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
                  value={props.itemFormData.standard_discount_percentage}
                  onChange={(e) =>
                    props.setItemFormData({
                      ...props.itemFormData,
                      standard_discount_percentage: e.target.value,
                    })
                  }
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
                  value={props.itemFormData.special_discount_percentage}
                  onChange={(e) =>
                    props.setItemFormData({
                      ...props.itemFormData,
                      special_discount_percentage: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Card className="bg-light border-0">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Sub Total:</span>
                    <h5 className="mb-0 text-success">
                      {formatCurrency(props.itemFormData.qty * props.itemFormData.unit_price, props.formData.currency)}
                    </h5>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeAndReset}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            disabled={
              !props.itemFormData.product_id ||
              props.itemFormData.qty < 1 ||
              props.itemFormData.unit_price <= 0
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const selectedProduct = props.products.find((p) => p.id === props.itemFormData.product_id);
              const newItem = {
                product_id: props.itemFormData.product_id!,
                product_service: props.itemFormData.product_service,
                description: props.itemFormData.description,
                qty: props.itemFormData.qty,
                unit_price: props.itemFormData.unit_price,
                original_currency: selectedProduct?.currency || props.formData.currency,
                original_price: Number.parseFloat(selectedProduct?.price || "0") || props.itemFormData.unit_price,
                tax_percentage: props.itemFormData.tax_percentage || "0",
                standard_discount_percentage: props.itemFormData.standard_discount_percentage || "0",
                special_discount_percentage: props.itemFormData.special_discount_percentage || "0",
              };

              if (props.editingItemIndex === null) {
                props.setEstimationItems([...props.estimationItems, newItem]);
              } else {
                const updated = [...props.estimationItems];
                updated[props.editingItemIndex] = newItem;
                props.setEstimationItems(updated);
              }

              closeAndReset();
            }}
          >
            {props.editingItemIndex === null ? "Add Item" : "Update Item"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
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
  const [itemFormData, setItemFormData] = useState<EstimationItemFormData>(
    buildEmptyEstimationItemFormData(),
  );

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
    await fetchLeadDataImpl({
      leadId,
      setLoadingLead,
      setSourceLead,
      setFormData,
      setLoadingTemplate,
      setDealTemplate,
      setTemplateFieldsData,
      setLoadingIndustries,
      setCampaignIndustries,
      setSelectedIndustryId,
      fetchProductsByIndustry,
    });
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
    await fetchProductsByIndustryImpl({
      industryId,
      setLoadingProducts,
      setProducts,
    });
  };

  const handleIndustryChange = async (selectedOption: any) => {
    const industryId = selectedOption?.value || null;
    setSelectedIndustryId(industryId);
    
    setItemFormData((prev) => ({
      ...prev,
      product_id: null,
      product_service: "",
      unit_price: 0,
    }));
    
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
              <output className="d-inline-block" aria-live="polite">
                <div className="spinner-border text-primary">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </output>
              <p className="mt-3">Loading lead data...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <ConvertDealTimelineNav
                formStep={formStep}
                hasTemplate={hasTemplate}
                onStepClick={setFormStep}
              />

              <div style={{ minHeight: '400px' }}>
                <ConvertDealStepSwitcher
                  formStep={formStep}
                  formData={formData}
                  setFormData={setFormData}
                  stages={stages}
                  extensions={extensions}
                  handleDealCurrencyChange={handleDealCurrencyChange}
                  businessTypes={businessTypes}
                  businessTypeId={businessTypeId}
                  setBusinessTypeId={setBusinessTypeId}
                  businessTypeOther={businessTypeOther}
                  setBusinessTypeOther={setBusinessTypeOther}
                  showOtherBusinessType={showOtherBusinessType}
                  setShowOtherBusinessType={setShowOtherBusinessType}
                  dealTemplate={dealTemplate}
                  loadingTemplate={loadingTemplate}
                  templateFieldsData={templateFieldsData}
                  setTemplateFieldsData={setTemplateFieldsData}
                  products={products}
                  estimationItems={estimationItems}
                  setEstimationItems={setEstimationItems}
                  setShowAddItemModal={setShowAddItemModal}
                  setEditingItemIndex={setEditingItemIndex}
                  setShowAllIndustries={setShowAllIndustries}
                  setItemFormData={setItemFormData}
                />
              </div>
            </Form>
          )}
        </Modal.Body>

        <ConvertDealFooter
          formStep={formStep}
          loading={loading}
          estimationItemsCount={estimationItems.length}
          onBackOrCancel={handleBackOrCancel}
          onNext={handleNextStep}
          onSubmit={handleSubmit}
        />
      </Modal>

      <AddEstimationItemModal
        show={showAddItemModal}
        onHide={() => setShowAddItemModal(false)}
        editingItemIndex={editingItemIndex}
        setEditingItemIndex={setEditingItemIndex}
        products={products}
        setProducts={setProducts}
        formData={formData}
        estimationItems={estimationItems}
        setEstimationItems={setEstimationItems}
        showAllIndustries={showAllIndustries}
        setShowAllIndustries={setShowAllIndustries}
        selectedIndustryId={selectedIndustryId}
        setSelectedIndustryId={setSelectedIndustryId}
        campaignIndustries={campaignIndustries}
        allIndustries={allIndustries}
        loadingIndustries={loadingIndustries}
        loadingAllIndustries={loadingAllIndustries}
        loadingProducts={loadingProducts}
        convertingPrice={convertingPrice}
        setConvertingPrice={setConvertingPrice}
        itemFormData={itemFormData}
        setItemFormData={setItemFormData}
        handleIndustryChange={handleIndustryChange}
      />
    </>
  );
};

export default ConvertToDealModal;