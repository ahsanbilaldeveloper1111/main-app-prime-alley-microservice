import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Card, Badge, Table, Dropdown } from "react-bootstrap";
import Select from 'react-select';
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import { Plus, Edit, Trash2, Package, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  createDeal,
  getStages,
  getLead,
  getCrmProducts,
  createEstimate,
  getRelevantDealTemplate,
  getCampaignById,
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
import { ModuleSlug, ValidationType, checkRequiredFields } from '@utils/Helper';
import { convertCurrency, formatCurrency } from '@utils/currency';
import { useSession } from "next-auth/react";

export interface ConvertLeadToDealModalProps {
  show: boolean;
  onHide: () => void;
  leadId: number;
  onSuccess?: () => void;
}

// ─── Edit Deal–style UI (match renderCreateDealForm) ───────────────────────────
const fieldLabel = (text: string, required: boolean = false) => (
  <label
    style={{
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#141414",
      marginBottom: "8px",
    }}
  >
    {text}
    {required && <span style={{ color: "#f2545b", marginLeft: "2px" }}>*</span>}
  </label>
);

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "300",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const fieldWrap: React.CSSProperties = { marginBottom: "20px" };

const sectionHeading: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#141414",
  marginBottom: "16px",
  marginTop: 0,
};

const sectionHeadingNext: React.CSSProperties = {
  ...sectionHeading,
  marginTop: "32px",
};

const dropdownToggleStyle = (hasValue: boolean): React.CSSProperties => ({
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: "1px solid #8a8a8a",
  borderRadius: "4px",
  fontSize: "16px",
  fontWeight: "300",
  backgroundColor: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: hasValue ? "#141414" : "#a0aec0",
});

const ConvertLeadToDealModal: React.FC<ConvertLeadToDealModalProps> = ({
  show,
  onHide,
  leadId,
  onSuccess
}) => {
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
      setBusinessTypeId(null);
      setBusinessTypeOther("");
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

      // Parse contact_persons
      let contactPersonsArray: any[] = [];
      if (leadData.contact_persons) {
        if (typeof leadData.contact_persons === 'string') {
          try {
            contactPersonsArray = JSON.parse(leadData.contact_persons);
          } catch (e) {
            console.error("Failed to parse contact_persons:", e);
          }
        } else if (Array.isArray(leadData.contact_persons)) {
          contactPersonsArray = leadData.contact_persons;
        }
      }

      const primaryContact = contactPersonsArray.find(cp => cp.email) || 
                             contactPersonsArray.find(cp => cp.phone) || 
                             contactPersonsArray[0] || {};

      const leadDataAny = leadData as any;
      const contactPersonName = primaryContact.name || leadDataAny.contact_person_name || "";

      // Calculate default expected close date (7 days from now)
      const defaultCloseDate = new Date();
      defaultCloseDate.setDate(defaultCloseDate.getDate() + 7);
      const formattedCloseDate = defaultCloseDate.toISOString().split('T')[0];

      // Auto-fill form data
      setFormData({
        name: leadData.name || "",
        ticket_id: leadId,
        lead_id: leadId,
        stage_id: undefined,
        assigned_to: leadData.user_extension ? String(leadData.user_extension) : null,
        expected_close_date: formattedCloseDate,
        company_name: leadData.company_name || "",
        company_domain: (leadData as any).company_domain ?? "",
        industry_ids: [],
        decision_maker_title: primaryContact.title || leadDataAny.contact_person_title || "",
        decision_maker_name: contactPersonName,
        decision_maker_phone_country_code: primaryContact.phone_country_code || leadDataAny.contact_phone_country_code || "",
        decision_maker_phone: primaryContact.phone || leadDataAny.contact_phone || "",
        decision_maker_email: primaryContact.email || "",
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

      // Fetch deal template
      try {
        setLoadingTemplate(true);
        const template = await getRelevantDealTemplate({ lead_id: leadId });
        if (template) {
          setDealTemplate(template);
          const initialFieldsData: Record<string, any> = {};
          if (template.fields) {
            template.fields.forEach((field) => {
              initialFieldsData[field.field_name] = '';
            });
          }
          setTemplateFieldsData(initialFieldsData);
        }
      } catch (error) {
        console.error("Failed to fetch deal template:", error);
      } finally {
        setLoadingTemplate(false);
      }

      // Fetch campaign and industries
      if (leadData.campaign_id) {
        try {
          setLoadingIndustries(true);
          const campaignData = await getCampaignById(leadData.campaign_id);
          setCampaign(campaignData);
          
          const industriesData = (campaignData as any).industries;
          const industryIds = (campaignData as any).industry_ids;
          
          let campaignIndustryIds: number[] = [];
          if (industriesData && Array.isArray(industriesData)) {
            campaignIndustryIds = industriesData.map((ind: any) => typeof ind === 'object' ? ind.id : ind);
          } else if (industryIds && Array.isArray(industryIds)) {
            campaignIndustryIds = industryIds;
          }
          
          if (campaignIndustryIds.length > 0) {
            const allIndustriesResponse = await getIndustries({ per_page: 1000 });
            const allInds = allIndustriesResponse.data || [];
            const filteredIndustries = allInds.filter((ind: IndustryData) => 
              campaignIndustryIds.includes(ind.id)
            );
            setCampaignIndustries(filteredIndustries);
            
            setFormData((prev) => ({
              ...prev,
              industry_ids: campaignIndustryIds,
            }));
            
            if (filteredIndustries.length === 1) {
              setSelectedIndustryId(filteredIndustries[0].id);
              await fetchProductsByIndustry(filteredIndustries[0].id);
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

  // Validation functions
  const validateStep0 = (): boolean => {
    const requiredFields = [
      { field: 'name' as const, name: 'Deal Name' },
      { field: 'stage_id' as const, name: 'Stage' },
      { field: 'expected_close_date' as const, name: 'Expected Close Date' },
      { field: 'assigned_to' as const, name: 'Assigned to' },
      { field: 'currency' as const, name: 'Currency' },
    ];
    return checkRequiredFields(formData, requiredFields);
  };

  const validateStep1 = (): boolean => {
    const requiredFields = [
      { field: 'company_name' as const, name: 'Company Name' },
      { field: 'decision_maker_name' as const, name: 'Decision Maker Name' },
      { field: 'decision_maker_email' as const, name: 'Decision Maker Email', type: ValidationType.EMAIL },
      { field: 'decision_maker_phone' as const, name: 'Decision Maker Phone' },
    ];
    return checkRequiredFields(formData, requiredFields);
  };

  const validateStep2 = (): boolean => {
    if (!dealTemplate) return true;
    
    if (dealTemplate.fields && dealTemplate.fields.length > 0) {
      for (const field of dealTemplate.fields) {
        if (field.is_required) {
          const fieldValue = templateFieldsData[field.field_name];
          if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
            toast.error(`${field.field_name} is required`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    return true;
  };

  const validateStep4 = (): boolean => {
    if (!estimationItems || estimationItems.length === 0) {
      toast.error('Please add at least one product to the estimation chart');
      return false;
    }
    return true;
  };

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
        quotation_sent: formData.quotation_sent,
        contract_sent: formData.contract_sent,
        contract_received: formData.contract_received,
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
        Object.entries(templateFieldsData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            filteredTemplateData[key] = value;
          }
        });
        if (Object.keys(filteredTemplateData).length > 0) {
          payload.template_data = filteredTemplateData;
        }
      }

      const createdDeal = await createDeal(payload).then((res) => res?.data);
      
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
                      {fieldLabel("Assigned to", true)}
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
                        value={formData.follow_up_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            follow_up_date: e.target.value,
                          })
                        }
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

                {/* Deal Characteristics (template) */}
                {dealTemplate && (
                  <>
                    <h3 style={sectionHeadingNext}>DEAL CHARACTERISTICS</h3>
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
                    {loadingTemplate ? (
                      <div style={{ textAlign: "center", padding: "24px" }}>
                        <div className="spinner-border text-primary" role="status" />
                        <p style={{ marginTop: "12px", marginBottom: 0, color: "#6c757d" }}>
                          Loading template fields...
                        </p>
                      </div>
                    ) : dealTemplate.fields && dealTemplate.fields.length > 0 ? (
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
                                  {field.options &&
                                    field.options.map(
                                      (option: string, index: number) => (
                                        <option key={index} value={option}>
                                          {option}
                                        </option>
                                      )
                                    )}
                                </Form.Select>
                              ) : field.field_type === "text" ||
                                !field.field_type ? (
                                <input
                                  type="text"
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
                              ) : (
                                <input
                                  type={
                                    field.field_type === "date"
                                      ? "date"
                                      : field.field_type === "email"
                                        ? "email"
                                        : "text"
                                  }
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

                {/* Negotiation Progress */}
                <>
                  <h3 style={sectionHeadingNext}>NEGOTIATION PROGRESS</h3>
                    <div style={fieldWrap}>
                      <Form.Check
                        type="checkbox"
                        id="quotation_sent"
                        label={
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#141414",
                            }}
                          >
                            Quotation Sent
                          </span>
                        }
                        checked={formData.quotation_sent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quotation_sent: e.target.checked,
                          })
                        }
                      />
                    </div>
                    <div style={fieldWrap}>
                      <Form.Check
                        type="checkbox"
                        id="contract_sent"
                        label={
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#141414",
                            }}
                          >
                            Contract Sent
                          </span>
                        }
                        checked={formData.contract_sent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contract_sent: e.target.checked,
                          })
                        }
                      />
                    </div>
                    <div style={fieldWrap}>
                      <Form.Check
                        type="checkbox"
                        id="contract_received"
                        label={
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#141414",
                            }}
                          >
                            Contract Received
                          </span>
                        }
                        checked={formData.contract_received}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contract_received: e.target.checked,
                          })
                        }
                      />
                    </div>
                  </>

                {/* Estimation Chart – inline grid (match renderCreateDealForm) */}
                <>
                  <h3 style={sectionHeadingNext}>ESTIMATION CHART</h3>
                  <div style={{ marginTop: "28px" }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 70px 70px 70px auto",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#141414" }}>
                        Add line item
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
                          gridTemplateColumns: "1fr 70px 70px 70px auto",
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
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={
                            (Number(item.standard_discount_percentage) || 0) +
                            (Number(item.special_discount_percentage) || 0) || ""
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
                                  : li
                              )
                            )
                          }
                          style={{ ...inputStyle, width: "70px" }}
                        />
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
                        gridTemplateColumns: "1fr 70px 70px 70px auto",
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
                        <Dropdown.Menu style={{ width: "100%" }}>
                          {lineItemProducts.length === 0 && !loadingLineItemProducts ? (
                            <Dropdown.Item disabled>No products available</Dropdown.Item>
                          ) : (
                            lineItemProducts.map((p) => (
                              <Dropdown.Item
                                key={p.id}
                                onClick={() => setLineItemInput(p.name)}
                              >
                                {p.name} – {formData.currency} {p.price || "0"}
                              </Dropdown.Item>
                            ))
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
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
                        step={0.01}
                        value={lineItemTax || ""}
                        placeholder="0"
                        onChange={(e) => setLineItemTax(Number(e.target.value) || 0)}
                        style={{ ...inputStyle, width: "70px" }}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={lineItemDiscount || ""}
                        placeholder="0"
                        onChange={(e) => setLineItemDiscount(Number(e.target.value) || 0)}
                        style={{ ...inputStyle, width: "70px" }}
                        onFocus={focusStyle}
                        onBlur={blurStyle}
                      />
                      <button
                        type="button"
                        onClick={addLineItem}
                        disabled={!lineItemInput}
                        style={{
                          background: lineItemInput ? "#0091ae" : "#cbd5e0",
                          border: "none",
                          borderRadius: "4px",
                          padding: "10px",
                          cursor: lineItemInput ? "pointer" : "not-allowed",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Plus size={16} />
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