import React, { useState, useEffect } from "react";
import { Button, Form, Badge, Dropdown } from "react-bootstrap";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import { Plus,  Trash2, X } from "lucide-react";
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
import { convertCurrency } from '@utils/currency';
import { useSession } from "next-auth/react";
import {
  fieldLabel,
  inputStyle,
  fieldWrap,
  sectionHeading,
  sectionHeadingNext,
  dropdownToggleStyle,
  getTodayLocalYyyyMmDd,
} from "@components/crmDealFormUi";
import {
  buildConvertDealFormStateFromLead,
  getBusinessTypeUiStateFromLead,
  loadCampaignIndustryContext,
  loadDealTemplateForLead,
  validateConvertDealStep0,
  validateConvertDealStep1,
  validateConvertDealStep2,
  validateConvertDealStep4,
} from "@utils/crm/convertToDealShared";

function leadConvertTemplateFieldInputType(
  fieldType: string | undefined,
): "date" | "email" | "text" {
  if (fieldType === "date") {
    return "date";
  }
  if (fieldType === "email") {
    return "email";
  }
  return "text";
}

export interface ConvertLeadToDealModalProps {
  show: boolean;
  onHide: () => void;
  leadId: number;
  onSuccess?: () => void;
}

const ConvertLeadToDealModal: React.FC<ConvertLeadToDealModalProps> = ({
  show,
  onHide,
  leadId,
  onSuccess
}) => {
  const normalizeTemplateDataKey = (key: string): string => {
    const normalizedKey = key.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
    let start = 0;
    let end = normalizedKey.length;

    while (start < end && normalizedKey[start] === "_") {
      start += 1;
    }

    while (end > start && normalizedKey[end - 1] === "_") {
      end -= 1;
    }

    return normalizedKey.slice(start, end);
  };

  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [stages, setStages] = useState<StageData[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
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

  const [estimationItems, setEstimationItems] = useState<Array<{
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
  }>>([]);

  const [lineItemProducts, setLineItemProducts] = useState<CrmProduct[]>([]);
  const [loadingLineItemProducts, setLoadingLineItemProducts] = useState(false);
  const [lineItemInput, setLineItemInput] = useState<string>("");
  const [lineItemQty, setLineItemQty] = useState<number>(0);
  const [lineItemTax, setLineItemTax] = useState<number>(0);
  const [lineItemDiscount, setLineItemDiscount] = useState<number>(0);

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
    business_type_id: null as number | null,
  });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#0091ae");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#8a8a8a");

  // Reset modal state when closed
  useEffect(() => {
    if (!show) {
      setEstimationItems([]);
      setTemplateFieldsData({});
      setDealTemplate(null);
      setBusinessTypeId(null);
      setBusinessTypeOther("");
      setShowOtherBusinessType(false);
      setShowAllIndustries(false);
    }
  }, [show]);

  // Fetch initial data
  useEffect(() => {
    if (show) {
      fetchStages();
      fetchExtensions();
      fetchBusinessTypes();
      fetchAllIndustries();
      const fetchLineItemProducts = async () => {
        setLoadingLineItemProducts(true);
        try {
          const response = await getCrmProducts({ per_page: 100 });
          setLineItemProducts(response?.data || []);
        } catch (error) {
          console.error("Failed to fetch products:", error);
          setLineItemProducts([]);
        } finally {
          setLoadingLineItemProducts(false);
        }
      };
      fetchLineItemProducts();
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
      setFormData({
        ...buildConvertDealFormStateFromLead(leadRecord, leadId),
        business_type_id: leadData.business_type_id || null,
      });

      const bt = getBusinessTypeUiStateFromLead(leadRecord);
      setBusinessTypeId(bt.businessTypeId);
      setBusinessTypeOther(bt.businessTypeOther);
      setShowOtherBusinessType(bt.showOtherBusinessType);

      try {
        setLoadingTemplate(true);
        const { template, templateFieldsData: initialFields } =
          await loadDealTemplateForLead(leadId);
        if (template) {
          setDealTemplate(template);
          setTemplateFieldsData(initialFields);
        } else {
          setDealTemplate(null);
          setTemplateFieldsData({});
        }
      } catch (error: unknown) {
        console.error("Failed to fetch deal template:", error);
        setDealTemplate(null);
        setTemplateFieldsData({});
      } finally {
        setLoadingTemplate(false);
      }

      if (leadData.campaign_id) {
        try {
          setLoadingIndustries(true);
          const ctx = await loadCampaignIndustryContext(Number(leadData.campaign_id));
          setCampaign(ctx.campaignData);
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

  const validateStep0 = (): boolean =>
    validateConvertDealStep0(formData, "Owner");
  const validateStep1 = (): boolean => validateConvertDealStep1(formData);
  const validateStep2 = (): boolean =>
    validateConvertDealStep2(dealTemplate, templateFieldsData);
  const validateStep4 = (): boolean => validateConvertDealStep4(estimationItems);

  const addLineItem = () => {
    if (!lineItemInput) return;
    const product = lineItemProducts.find((p) => p.name === lineItemInput);
    if (!product) return;
    const unitPrice = Number.parseFloat(String(product.price || "0")) || 0;
    setEstimationItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_service: product.name,
        description: "",
        qty: lineItemQty || 1,
        unit_price: unitPrice,
        original_currency: product.currency || formData.currency,
        original_price: unitPrice,
        tax_percentage: String(lineItemTax ?? 0),
        standard_discount_percentage: String(lineItemDiscount ?? 0),
        special_discount_percentage: "0",
      },
    ]);
    setLineItemInput("");
    setLineItemQty(0);
    setLineItemTax(0);
    setLineItemDiscount(0);
  };

  const removeLineItem = (index: number) => {
    setEstimationItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const followUpMin = getTodayLocalYyyyMmDd();
    if (
      formData.follow_up_date &&
      formData.follow_up_date < followUpMin
    ) {
      toast.error("Follow-up date must be today or a future date");
      return;
    }

    if (!validateStep0() || !validateStep1() || !validateStep4()) {
      return;
    }
    if (dealTemplate && !validateStep2()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: formData.name,
        stage_id: formData.stage_id ? String(formData.stage_id) : undefined,
        assigned_to: formData.assigned_to,
        expected_close_date: formData.expected_close_date,
        company_name: formData.company_name,
        ...(formData.company_domain && { company_domain: formData.company_domain }),
        industry_ids: formData.industry_ids,
        ...(businessTypeId ? { business_type_id: String(businessTypeId) } : {}),
        ...(businessTypeOther ? { business_type_other: businessTypeOther } : {}),
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
        follow_up_date: formData.follow_up_date || "",
        currency: formData.currency,
        tax_percentage: formData.tax_percentage || "0",
        standard_discount_percentage: formData.standard_discount_percentage || "0",
        special_discount_percentage: formData.special_discount_percentage || "0",
        ticket_id: formData.ticket_id || formData.lead_id,
        lead_id: formData.lead_id,
      };

      if (dealTemplate && dealTemplate.id) {
        payload.deal_template_id = dealTemplate.id;
        const filteredTemplateData: Record<string, any> = {};
        if (dealTemplate.name) {
          filteredTemplateData.template_name = dealTemplate.name;
        }
        Object.entries(templateFieldsData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            filteredTemplateData[normalizeTemplateDataKey(key)] = value;
          }
        });
        if (Object.keys(filteredTemplateData).length > 0) {
          payload.template_data = filteredTemplateData;
        }
      }

      const createdDeal = await createDeal(payload, false).then((res) => res?.data);
      
      if (estimationItems.length > 0 && createdDeal?.id) {
        try {
          const estimatePayload = {
            deal_id: Number(createdDeal.id),
            estimation_chart: estimationItems.map(item => ({
              product_id: item.product_id,
              product_service: item.product_service,
              description: item.description || "",
              qty: item.qty,
              unit_price: item.unit_price,
              original_currency: item.original_currency || formData.currency,
              original_price: item.original_price ?? item.unit_price,
              tax_percentage: parseFloat(String(item.tax_percentage ?? "0")),
              standard_discount_percentage: parseFloat(String(item.standard_discount_percentage ?? "0")),
              special_discount_percentage: parseFloat(String(item.special_discount_percentage ?? "0")),
            })),
            standard_discount_percentage: parseFloat(formData.standard_discount_percentage || "0"),
            special_discount_percentage: parseFloat(formData.special_discount_percentage || "0"),
            tax_percentage: parseFloat(formData.tax_percentage || "0"),
            currency: formData.currency,
          };

          await createEstimate(estimatePayload, false);
        } catch (estimateError: any) {
          console.error("Failed to create estimate:", estimateError);
          toast.warning("Deal created but failed to save estimation chart");
        }
      }
      
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

  if (!show) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onHide}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#141414",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Convert Lead to Deal
            {sourceLead && (
              <Badge bg="info" style={{ fontWeight: "500" }}>
                {sourceLead.name}
              </Badge>
            )}
          </h2>
          <button
            type="button"
            onClick={onHide}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 40px" }}>
          {loadingLead ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#141414" }}>
                Loading lead data...
              </p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <div>
                {/* Deal Information */}
                <>
                  <h3 style={sectionHeading}>DEAL INFORMATION</h3>
                    <div style={fieldWrap}>
                      {fieldLabel("Deal Name", true)}
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        placeholder="Enter deal name"
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Stage", true)}
                      <Form.Select
                        value={formData.stage_id ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stage_id: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        style={inputStyle}
                      >
                        <option value="">Select Stage</option>
                        {stages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Expected Close Date", true)}
                      <input
                        type="date"
                        value={formData.expected_close_date}
                        onChange={(e) =>
                          setFormData({ ...formData, expected_close_date: e.target.value })}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Owner", true)}
                      <Form.Select
                        value={formData.assigned_to ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            assigned_to: e.target.value || null,
                          })
                        }
                        style={inputStyle}
                      >
                        <option value="">Select User</option>
                        {extensions.map((ext: any) => (
                          <option
                            key={ext.id || ext.extension}
                            value={ext.id || ext.extension}
                          >
                            {ext.display_name || ext.name || ext.id}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Currency", true)}
                      <Form.Select
                        value={formData.currency}
                        onChange={async (e) => {
                          const newCurrency = e.target.value;
                          setFormData({ ...formData, currency: newCurrency });
                          if (estimationItems.length > 0) {
                            try {
                              setConvertingPrice(true);
                              const convertedItems = await Promise.all(
                                estimationItems.map(async (item) => {
                                  const product = lineItemProducts.find(
                                    (p) => p.id === item.product_id
                                  );
                                  if (product) {
                                    const productCurrency =
                                      product.currency.toUpperCase();
                                    const oldDealCurrency =
                                      formData.currency.toUpperCase();
                                    const newDealCurrency =
                                      newCurrency.toUpperCase();
                                    if (productCurrency === newDealCurrency) {
                                      return {
                                        ...item,
                                        unit_price:
                                          parseFloat(product.price) ||
                                          item.unit_price,
                                      };
                                    }
                                    if (oldDealCurrency !== newDealCurrency) {
                                      const convertedPrice =
                                        await convertCurrency(
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
                            } catch (err) {
                              console.error("Failed to convert items:", err);
                              toast.error(
                                "Failed to convert prices to new currency"
                              );
                            } finally {
                              setConvertingPrice(false);
                            }
                          }
                        }}
                        style={inputStyle}
                      >
                        <option value="AED">AED</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </Form.Select>
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Follow-up Date")}
                      <input
                        type="date"
                        min={getTodayLocalYyyyMmDd()}
                        value={formData.follow_up_date}
                        onChange={(e) => {
                          const value = e.target.value;
                          const minDate = getTodayLocalYyyyMmDd();
                          if (value && value < minDate) {
                            return;
                          }
                          setFormData({
                            ...formData,
                            follow_up_date: value,
                          });
                        }}
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                    </div>
                  </>

                {/* Company Information */}
                <>
                  <h3 style={sectionHeadingNext}>COMPANY INFORMATION</h3>
                    <div style={fieldWrap}>
                      {fieldLabel("Company Name", true)}
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({ ...formData, company_name: e.target.value })
                        }
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Company domain")}
                      <input
                        type="text"
                        value={formData.company_domain}
                        onChange={(e) =>
                          setFormData({ ...formData, company_domain: e.target.value })
                        }
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        placeholder="e.g. example.com"
                        data-no-capitalize
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Select Business Type", true)}
                      <Form.Select
                      value={
                        showOtherBusinessType
                          ? "other"
                          : businessTypeId
                          ? String(businessTypeId)
                          : ""
                      }
                        onChange={(e) => {
                          const value = e.target.value;
                        if (value === "other") {
                          setBusinessTypeId(null);
                          setBusinessTypeOther("");
                          setShowOtherBusinessType(true);
                        } else if (value) {
                          setBusinessTypeId(Number(value));
                          setBusinessTypeOther("");
                          setShowOtherBusinessType(false);
                        } else {
                          setBusinessTypeId(null);
                          setBusinessTypeOther("");
                          setShowOtherBusinessType(false);
                        }
                        }}
                        style={inputStyle}
                      >
                        <option value="">Select Business Type</option>
                        {businessTypes.map((bt) => (
                          <option key={bt.id} value={bt.id}>
                            {bt.name}
                          </option>
                        ))}
                        <option value="other">Other</option>
                      </Form.Select>
                    </div>
                    {showOtherBusinessType && (
                      <div style={fieldWrap}>
                        {fieldLabel("Business Type (Other)", true)}
                        <input
                          type="text"
                          value={businessTypeOther}
                          onChange={(e) => setBusinessTypeOther(e.target.value)}
                          style={inputStyle}
                          onFocus={focusStyle}
                          onBlur={blurStyle}
                          placeholder="Enter business type"
                        />
                      </div>
                    )}
                    <div style={fieldWrap}>
                      {fieldLabel("Decision Maker Title")}
                      <Form.Select
                        value={formData.decision_maker_title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            decision_maker_title: e.target.value,
                          })
                        }
                        style={inputStyle}
                      >
                        <option value="">Select Title</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Mrs.">Mrs.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </Form.Select>
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Decision Maker Name", true)}
                      <input
                        type="text"
                        value={formData.decision_maker_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            decision_maker_name: e.target.value,
                          })
                        }
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        placeholder="Decision maker name"
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Decision Maker Email", true)}
                      <input
                        type="email"
                        autoCapitalize="off"
                        value={formData.decision_maker_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            decision_maker_email: e.target.value,
                          })
                        }
                        style={inputStyle}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                        placeholder="decisionmaker@company.com"
                      />
                    </div>
                    <div style={fieldWrap}>
                      {fieldLabel("Decision Maker Phone", true)}
                      <PhoneInput
                        international
                        defaultCountry="US"
                        value={
                          formData.decision_maker_phone_country_code &&
                          formData.decision_maker_phone
                            ? `${formData.decision_maker_phone_country_code}${formData.decision_maker_phone}`
                            : formData.decision_maker_phone || undefined
                        }
                        onChange={(value) => {
                          if (value) {
                            try {
                              const phoneNumber = parsePhoneNumber(value);
                              if (phoneNumber) {
                                setFormData((prev) => ({
                                  ...prev,
                                  decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                  decision_maker_phone: phoneNumber.nationalNumber,
                                }));
                              } else {
                                setFormData((prev) => ({
                                  ...prev,
                                  decision_maker_phone_country_code: "",
                                  decision_maker_phone: value,
                                }));
                              }
                            } catch {
                              setFormData((prev) => ({
                                ...prev,
                                decision_maker_phone_country_code: "",
                                decision_maker_phone: value,
                              }));
                            }
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              decision_maker_phone_country_code: "",
                              decision_maker_phone: "",
                            }));
                          }
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </>

                {/* Deal Characteristics (template from API when available) */}
                  <h3 style={sectionHeadingNext}>DEAL CHARACTERISTICS</h3>
                  {loadingTemplate && (
                    <div style={{ textAlign: "center", padding: "16px" }}>
                      <div className="spinner-border spinner-border-sm text-primary" aria-hidden />
                      <p className="small text-muted mt-2 mb-0">Loading deal template...</p>
                    </div>
                  )}
                  {!loadingTemplate && !dealTemplate && (
                    <p className="text-muted small mb-3">
                      No deal template applies to this lead. You can continue without template fields.
                    </p>
                  )}

                  {dealTemplate && (
                    <>
                      {dealTemplate.name && (
                        <div style={{ marginBottom: "16px" }}>
                          <Badge bg="info" style={{ fontWeight: "500" }}>
                            Template: {dealTemplate.name}
                          </Badge>
                        </div>
                      )}
                    {dealTemplate.description && (
                      <div
                        style={{
                          padding: "12px 16px",
                          marginBottom: "16px",
                          backgroundColor: "#e7f6f8",
                          borderRadius: "4px",
                          fontSize: "14px",
                          color: "#141414",
                        }}
                      >
                        {dealTemplate.description}
                      </div>
                    )}
                    {dealTemplate.fields && dealTemplate.fields.length > 0 ? (
                      (() => {
                        const fieldsArray = dealTemplate.fields || [];
                        const sortedFields = [...fieldsArray].sort(
                          (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                        );
                        return sortedFields.map((field: DealTemplateField) => {
                          const fieldValue =
                            templateFieldsData[field.field_name] || "";
                          return (
                            <div key={field.field_name} style={fieldWrap}>
                              {fieldLabel(
                                field.field_name,
                                !!field.is_required
                              )}
                              {field.field_type === "dropdown" ? (
                                <Form.Select
                                  value={fieldValue}
                                  onChange={(e) =>
                                    setTemplateFieldsData({
                                      ...templateFieldsData,
                                      [field.field_name]: e.target.value,
                                    })
                                  }
                                  style={inputStyle}
                                >
                                  <option value="">
                                    Select {field.field_name}
                                  </option>
                                  {field.options?.map((option: string) => (
                                    <option
                                      key={`${field.field_name}:${option}`}
                                      value={option}
                                    >
                                      {option}
                                    </option>
                                  ))}
                                </Form.Select>
                              ) : (
                                <input
                                  type={leadConvertTemplateFieldInputType(
                                    field.field_type,
                                  )}
                                  value={fieldValue}
                                  onChange={(e) =>
                                    setTemplateFieldsData({
                                      ...templateFieldsData,
                                      [field.field_name]: e.target.value,
                                    })
                                  }
                                  style={inputStyle}
                                  onFocus={focusStyle}
                                  onBlur={blurStyle}
                                  placeholder={`Enter ${field.field_name}`}
                                />
                              )}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <p
                        style={{
                          textAlign: "center",
                          padding: "24px",
                          color: "#6c757d",
                          marginBottom: 0,
                        }}
                      >
                        No fields defined in this template.
                      </p>
                    )}
                  </>
                  )}

                {/* Negotiation Progress intentionally removed from lead → deal conversion */}

                {/* Estimation Chart – inline grid (match renderCreateDealForm) */}
                <>
                  <h3 style={sectionHeadingNext}>ESTIMATION CHART</h3>
                  <div style={{ marginTop: "28px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 120px 70px 70px 100px auto",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Add line item
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Pricing
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Quantity
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Tax (%)
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Discount (%)
                      </span>
                      <span style={{ width: "36px" }} />
                    </div>

                    {estimationItems.map((item, index) => (
                      <div
                        key={`${item.product_id}-${index}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 120px 70px 70px 100px auto",
                          gap: "8px",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <div
                          style={{
                            padding: "10px 12px",
                            border: "1px solid #eaf0f6",
                            borderRadius: "4px",
                            fontSize: "14px",
                            color: "#141414",
                            backgroundColor: "#f7fafc",
                          }}
                        >
                          {item.product_service}
                        </div>
                        <div
                          style={{
                            padding: "10px 12px",
                            border: "1px solid #eaf0f6",
                            borderRadius: "4px",
                            fontSize: "14px",
                            color: "#141414",
                            backgroundColor: "#f7fafc",
                            minHeight: "44px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {formData.currency} {Number(item.unit_price || 0).toFixed(2)}
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) =>
                            setEstimationItems((prev) =>
                              prev.map((li, i) =>
                                i === index
                                  ? { ...li, qty: Number(e.target.value) || 1 }
                                  : li
                              )
                            )
                          }
                          style={{ ...inputStyle, width: "70px" }}
                        />
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.tax_percentage ?? ""}
                          onChange={(e) =>
                            setEstimationItems((prev) =>
                              prev.map((li, i) =>
                                i === index
                                  ? { ...li, tax_percentage: e.target.value }
                                  : li
                              )
                            )
                          }
                          style={{ ...inputStyle, width: "70px" }}
                        />
                        <Form.Select
                          value={
                            item.standard_discount_percentage ??
                            item.special_discount_percentage ??
                            ""
                          }
                          onChange={(e) =>
                            setEstimationItems((prev) =>
                              prev.map((li, i) =>
                                i === index
                                  ? {
                                      ...li,
                                      standard_discount_percentage: e.target.value,
                                      special_discount_percentage: "0",
                                    }
                                  : li,
                              )
                            )
                          }
                          style={{
                            ...inputStyle,
                            width: "100%",
                            minWidth: 0,
                            minHeight: "44px",
                            paddingRight: "2rem",
                          }}
                        >
                          <option value="">Select</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="15">15</option>
                        </Form.Select>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#f2545b",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 120px 70px 70px 100px auto",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          disabled={loadingLineItemProducts}
                          style={{
                            ...dropdownToggleStyle(!!lineItemInput),
                            color: lineItemInput ? "#141414" : "#a0aec0",
                          }}
                        >
                          {loadingLineItemProducts
                            ? "Loading products..."
                            : lineItemInput || "Add a line item"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          style={{
                            width: "100%",
                            maxHeight: "260px",
                            overflowY: "auto",
                          }}
                        >
                          {lineItemProducts.length === 0 && !loadingLineItemProducts ? (
                            <Dropdown.Item disabled>No products available</Dropdown.Item>
                          ) : (
                            lineItemProducts.map((p) => (
                              <Dropdown.Item
                                key={p.id}
                                onClick={() => setLineItemInput(p.name)}
                                style={{ display: "flex", alignItems: "center" }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    maxWidth: "100%",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={`${p.name} – ${formData.currency} ${p.price || "0"}`}
                                >
                                  {p.name} – {formData.currency} {p.price || "0"}
                                </span>
                              </Dropdown.Item>
                            ))
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                      <div
                        style={{
                          ...inputStyle,
                          width: "100%",
                          minHeight: "44px",
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: "#f7fafc",
                        }}
                      >
                        {lineItemInput
                          ? `${formData.currency} ${Number(
                              lineItemProducts.find((p) => p.name === lineItemInput)?.price || 0,
                            ).toFixed(2)}`
                          : `${formData.currency} 0.00`}
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={lineItemQty || ""}
                        placeholder="0"
                        onChange={(e) =>
                          setLineItemQty(Number(e.target.value) ? Number(e.target.value) : 0)
                        }
                        style={{ ...inputStyle, width: "70px" }}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={lineItemTax || ""}
                        placeholder="0"
                        onChange={(e) => setLineItemTax(Number(e.target.value) || 0)}
                        style={{ ...inputStyle, width: "70px" }}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                      <Form.Select
                        value={lineItemDiscount ? String(lineItemDiscount) : ""}
                        onChange={(e) =>
                          setLineItemDiscount(
                            e.target.value ? Number(e.target.value) : 0,
                          )
                        }
                        style={{
                          ...inputStyle,
                          width: "100%",
                          minWidth: 0,
                          minHeight: "44px",
                          paddingRight: "2rem",
                        }}
                      >
                        <option value="">Select</option>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                      </Form.Select>
                      <button
                        type="button"
                        onClick={addLineItem}
                        disabled={!lineItemInput}
                        style={{
                          background: lineItemInput ? "#0091ae" : "#cbd5e0",
                          border: "none",
                          borderRadius: "4px",
                          width: "44px",
                          height: "44px",
                          minWidth: "44px",
                          flexShrink: 0,
                          padding: 0,
                          cursor: lineItemInput ? "pointer" : "not-allowed",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </>
              </div>
            </Form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
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
              "Create Deal"
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ConvertLeadToDealModal;