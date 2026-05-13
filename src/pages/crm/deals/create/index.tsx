import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  createDeal,
  getStages,
  getLead,
  getCrmProducts,
  createEstimate,
  getRelevantDealTemplate,
  getCampaignById,
  getIndustries,
  CrmProduct,
  DealTemplateData,
  DealTemplateField,
  IndustryData,
  getBusinessTypes,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { Button, Row, Col, Form, Card, Badge, Table, Modal } from "react-bootstrap";
import { CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Plus, Edit, Trash2, Package } from "lucide-react";
import Select from 'react-select';
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug, ValidationType, checkRequiredFields } from '@utils/Helper';
import { convertCurrency, formatCurrency } from '@utils/currency';
import { crmAppKeys } from "../../../../query/keys";
import type { UseQueryResult } from "@tanstack/react-query";

function useIndustriesQueryErrorToast(
  isError: boolean,
  error: unknown,
): void {
  useEffect(() => {
    if (!isError) return;
    console.error("Failed to fetch industries:", error);
    toast.error("Failed to fetch industries");
  }, [isError, error]);
}

type CampaignIdForDeal = string | number | undefined;

function useCampaignIndustriesFromSourceLead(args: {
  campaignId: CampaignIdForDeal;
  campaignData: unknown;
  allIndustries: IndustryData[];
  fetchProductsByIndustry: (industryId: number) => Promise<void>;
  setCampaignIndustries: React.Dispatch<React.SetStateAction<IndustryData[]>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setSelectedIndustryId: React.Dispatch<React.SetStateAction<number | null>>;
}): void {
  const {
    campaignId,
    campaignData,
    allIndustries,
    fetchProductsByIndustry,
    setCampaignIndustries,
    setFormData,
    setSelectedIndustryId,
  } = args;

  useEffect(() => {
    if (!campaignId || !campaignData) {
      return;
    }
    const data = campaignData as {
      industries?: unknown;
      industry_ids?: number[];
    };

    const industriesData = data.industries;
    const industryIds = data.industry_ids;

    let campaignIndustryIds: number[] = [];
    if (industriesData && Array.isArray(industriesData)) {
      campaignIndustryIds = industriesData.map((ind: unknown) =>
        typeof ind === "object" && ind !== null && "id" in ind
          ? (ind as { id: number }).id
          : (ind as number),
      );
    } else if (industryIds && Array.isArray(industryIds)) {
      campaignIndustryIds = industryIds;
    }

    if (campaignIndustryIds.length === 0) {
      return;
    }

    const filteredIndustries = allIndustries.filter((ind) =>
      campaignIndustryIds.includes(ind.id),
    );
    setCampaignIndustries(filteredIndustries);

    setFormData((prevFormData: { industry_ids?: number[] }) => {
      if (!prevFormData.industry_ids || prevFormData.industry_ids.length === 0) {
        return {
          ...prevFormData,
          industry_ids: campaignIndustryIds,
        };
      }
      return prevFormData;
    });

    if (filteredIndustries.length === 1) {
      setSelectedIndustryId(filteredIndustries[0].id);
      fetchProductsByIndustry(filteredIndustries[0].id).catch(() => undefined);
    }
  }, [
    campaignId,
    campaignData,
    allIndustries,
    fetchProductsByIndustry,
    setCampaignIndustries,
    setFormData,
    setSelectedIndustryId,
  ]);
}

type CreateDealLineItemFormState = {
  product_id: number | null;
  product_service: string;
  description: string;
  qty: number;
  unit_price: number;
};

function useCreateDealProductLoading(
  setSelectedIndustryId: React.Dispatch<React.SetStateAction<number | null>>,
  setItemFormData: React.Dispatch<
    React.SetStateAction<CreateDealLineItemFormState>
  >,
) {
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchProductsByIndustry = useCallback(async (industryId: number) => {
    try {
      setLoadingProducts(true);
      const response = await getCrmProducts({
        per_page: 100,
        industry_id: industryId,
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products for selected industry");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const handleIndustryChange = useCallback(
    async (selectedOption: { value?: number | null } | null) => {
      const industryId = selectedOption?.value ?? null;
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
    },
    [fetchProductsByIndustry, setItemFormData, setSelectedIndustryId],
  );

  return {
    products,
    setProducts,
    loadingProducts,
    fetchProductsByIndustry,
    handleIndustryChange,
  };
}

function useCreateDealPageQueries(
  router: ReturnType<typeof useRouter>,
  sourceLead: { campaign_id?: unknown } | null,
) {
  const stagesQuery = useQuery({
    queryKey: crmAppKeys.crmStages.byType("deal"),
    queryFn: () => getStages("deal"),
  });
  const extensionsQuery = useQuery({
    queryKey: crmAppKeys.hierarchyExtensions.module(ModuleSlug.CRM_DEALS),
    queryFn: async () => {
      const hierarchyData = await GetHierarchyData(ModuleSlug.CRM_DEALS);
      return hierarchyData?.extensions ?? [];
    },
  });
  const businessTypesQuery = useQuery({
    queryKey: crmAppKeys.businessTypes.selectOptions(),
    queryFn: async () => {
      const r = await getBusinessTypes({ per_page: 1000 });
      return r?.data ?? [];
    },
  });
  const industriesQuery = useQuery({
    queryKey: crmAppKeys.campaigns.industries(),
    queryFn: async () => {
      const r = await getIndustries({ per_page: 1000, page: 1 });
      return r.data ?? [];
    },
  });

  const stages = stagesQuery.data ?? [];
  const extensions = extensionsQuery.data ?? [];
  const businessTypes = businessTypesQuery.data ?? [];
  const allIndustries = industriesQuery.data ?? [];
  const loadingAllIndustries = industriesQuery.isPending;

  const parsedLeadId = useMemo(() => {
    if (
      !router.isReady ||
      router.query.lead_id == null ||
      router.query.lead_id === ""
    ) {
      return null;
    }
    const raw = Array.isArray(router.query.lead_id)
      ? router.query.lead_id[0]
      : router.query.lead_id;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [router.isReady, router.query.lead_id]);

  const leadQuery = useQuery({
    queryKey:
      parsedLeadId === null
        ? ([...crmAppKeys.leads.all(), "byId", "none"] as const)
        : crmAppKeys.leads.byId(parsedLeadId),
    queryFn: () => {
      if (parsedLeadId === null) {
        return Promise.reject(new Error("Lead ID not available"));
      }
      return getLead(parsedLeadId);
    },
    enabled: parsedLeadId !== null,
  });

  const loadingLead = leadQuery.isPending && parsedLeadId != null;

  const campaignIdForQuery = sourceLead?.campaign_id
    ? Number(sourceLead.campaign_id)
    : 0;
  const campaignQuery = useQuery({
    queryKey: crmAppKeys.campaigns.byCampaignId(campaignIdForQuery),
    queryFn: () => getCampaignById(campaignIdForQuery),
    enabled: Boolean(sourceLead?.campaign_id) && campaignIdForQuery > 0,
  });

  const loadingIndustries =
    Boolean(sourceLead?.campaign_id) && campaignQuery.isFetching;

  return {
    stages,
    extensions,
    businessTypes,
    allIndustries,
    loadingAllIndustries,
    parsedLeadId,
    leadQuery,
    loadingLead,
    campaignQuery,
    loadingIndustries,
    industriesQuery,
  };
}

function useCreateDealLeadPipelineEffects(args: {
  parsedLeadId: number | null;
  leadQuery: UseQueryResult<unknown, Error>;
  leadHydratedIdRef: React.MutableRefObject<number | null>;
  setSourceLead: React.Dispatch<React.SetStateAction<any>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setDealTemplate: React.Dispatch<
    React.SetStateAction<DealTemplateData | null>
  >;
  setTemplateFieldsData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setLoadingTemplate: React.Dispatch<React.SetStateAction<boolean>>;
}): void {
  const {
    parsedLeadId,
    leadQuery,
    leadHydratedIdRef,
    setSourceLead,
    setFormData,
    setDealTemplate,
    setTemplateFieldsData,
    setLoadingTemplate,
  } = args;

  useEffect(() => {
    if (parsedLeadId == null) {
      leadHydratedIdRef.current = null;
      return;
    }
    if (!leadQuery.isSuccess || !leadQuery.data) {
      return;
    }
    if (leadHydratedIdRef.current === parsedLeadId) {
      return;
    }
    leadHydratedIdRef.current = parsedLeadId;

    const leadData: any = leadQuery.data;
    const leadId = parsedLeadId;
    setSourceLead(leadData);

    let contactPersonsArray: any[] = [];
    if (leadData.contact_persons) {
      if (typeof leadData.contact_persons === "string") {
        try {
          contactPersonsArray = JSON.parse(leadData.contact_persons);
        } catch (e) {
          console.error("Failed to parse contact_persons:", e);
          contactPersonsArray = [];
        }
      } else if (Array.isArray(leadData.contact_persons)) {
        contactPersonsArray = leadData.contact_persons;
      }
    }

    const primaryContact =
      contactPersonsArray.find((cp) => cp.email) ||
      contactPersonsArray.find((cp) => cp.phone) ||
      contactPersonsArray[0] ||
      {};

    const contactPersonName =
      primaryContact.name || leadData.contact_person_name || "";

    const defaultCloseDate = new Date();
    defaultCloseDate.setDate(defaultCloseDate.getDate() + 7);
    const formattedCloseDate = defaultCloseDate.toISOString().split("T")[0];

    setFormData((prev: any) => ({
      ...prev,
      lead_id: leadId,
      ticket_id: leadId,
      name: leadData.name || "",
      assigned_to: leadData.user_extension
        ? String(leadData.user_extension)
        : null,
      expected_close_date: formattedCloseDate,
      company_name: leadData.company_name || "",
      company_domain: leadData.company_domain ?? "",
      industry: leadData.industry || "",
      decision_maker_title:
        primaryContact.title || leadData.contact_person_title || "",
      decision_maker_name: contactPersonName,
      decision_maker_phone_country_code:
        primaryContact.phone_country_code ||
        leadData.contact_phone_country_code ||
        "",
      decision_maker_phone:
        primaryContact.phone || leadData.contact_phone || "",
      decision_maker_email: primaryContact.email || "",
    }));

    (async () => {
      try {
        setLoadingTemplate(true);
        const template = await getRelevantDealTemplate({ lead_id: leadId });
        if (template) {
          setDealTemplate(template);
          const initialFieldsData: Record<string, any> = {};
          if (template.fields) {
            template.fields.forEach((field) => {
              initialFieldsData[field.field_name] = "";
            });
          }
          setTemplateFieldsData(initialFieldsData);
        } else {
          setDealTemplate(null);
          setTemplateFieldsData({});
        }
      } catch (error) {
        console.error("Failed to fetch deal template:", error);
        setDealTemplate(null);
        setTemplateFieldsData({});
      } finally {
        setLoadingTemplate(false);
      }
    })().catch(() => undefined);
  }, [parsedLeadId, leadQuery.isSuccess, leadQuery.data]);

  useEffect(() => {
    if (leadQuery.isError && parsedLeadId != null) {
      console.error("Failed to fetch lead:", leadQuery.error);
      toast.error("Failed to load lead data for conversion");
    }
  }, [leadQuery.isError, leadQuery.error, parsedLeadId]);
}

function useCreateDealStepValidation(args: {
  formData: Record<string, any>;
  formStep: number;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
  estimationItems: Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>;
}) {
  const { formData, formStep, dealTemplate, templateFieldsData, estimationItems } =
    args;

  const validateStep0 = useCallback((): boolean => {
    const requiredFields = [
      { field: "name" as const, name: "Deal Name" },
      { field: "stage_id" as const, name: "Stage" },
      { field: "expected_close_date" as const, name: "Expected Close Date" },
      { field: "assigned_to" as const, name: "Assigned to" },
      { field: "currency" as const, name: "Currency" },
    ];
    return checkRequiredFields(formData, requiredFields);
  }, [formData]);

  const validateStep1 = useCallback((): boolean => {
    const requiredFields = [
      { field: "company_name" as const, name: "Company Name" },
      { field: "decision_maker_name" as const, name: "Decision Maker Name" },
      {
        field: "decision_maker_email" as const,
        name: "Decision Maker Email",
        type: ValidationType.EMAIL,
      },
      {
        field: "decision_maker_phone" as const,
        name: "Decision Maker Phone",
      },
    ];
    return checkRequiredFields(formData, requiredFields);
  }, [formData]);

  const validateStep2 = useCallback((): boolean => {
    if (!dealTemplate) {
      return true;
    }
    if (dealTemplate.fields && dealTemplate.fields.length > 0) {
      for (const field of dealTemplate.fields) {
        if (field.is_required) {
          const fieldValue = templateFieldsData[field.field_name];
          if (
            !fieldValue ||
            (typeof fieldValue === "string" && fieldValue.trim() === "")
          ) {
            toast.error(`${field.field_name} is required`);
            return false;
          }
        }
      }
    }
    return true;
  }, [dealTemplate, templateFieldsData]);

  const validateStep3 = useCallback((): boolean => true, []);

  const validateStep4 = useCallback((): boolean => {
    if (!estimationItems || estimationItems.length === 0) {
      toast.error(
        "Please add at least one product to the estimation chart before creating the deal",
      );
      return false;
    }
    return true;
  }, [estimationItems]);

  const validateCurrentStep = useCallback((): boolean => {
    switch (formStep) {
      case 0:
        return validateStep0();
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return true;
    }
  }, [
    formStep,
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
  ]);

  return {
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateCurrentStep,
  };
}

function buildCreateDealSubmissionPayload(p: {
  formData: Record<string, any>;
  businessTypeId: number | null;
  businessTypeOther: string;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
}): Record<string, any> {
  const { formData, businessTypeId, businessTypeOther, dealTemplate, templateFieldsData } =
    p;
  const payload: Record<string, any> = {
    name: formData.name,
    stage_id: formData.stage_id ? String(formData.stage_id) : undefined,
    assigned_to: formData.assigned_to,
    expected_close_date: formData.expected_close_date,
    company_name: formData.company_name,
    ...(formData.company_domain && {
      company_domain: formData.company_domain,
    }),
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
    standard_discount_percentage:
      formData.standard_discount_percentage || "0",
    special_discount_percentage:
      formData.special_discount_percentage || "0",
  };

  if (formData.ticket_id) {
    payload.ticket_id = formData.ticket_id;
  } else if (formData.lead_id) {
    payload.ticket_id = formData.lead_id;
  }

  if (formData.lead_id) {
    payload.lead_id = formData.lead_id;
  }

  if (dealTemplate?.id) {
    payload.deal_template_id = dealTemplate.id;
    const filteredTemplateData: Record<string, any> = {};
    Object.entries(templateFieldsData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        filteredTemplateData[key] = value;
      }
    });
    if (Object.keys(filteredTemplateData).length > 0) {
      payload.template_data = filteredTemplateData;
    }
  }

  return payload;
}

async function createEstimateForNewDealIfNeeded(p: {
  estimationItems: Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>;
  createdDeal: { id?: string | number } | undefined;
  formData: Record<string, any>;
}): Promise<void> {
  const { estimationItems, createdDeal, formData } = p;
  if (estimationItems.length === 0 || !createdDeal?.id) return;
  try {
    const estimatePayload = {
      deal_id: Number(createdDeal.id),
      estimation_chart: estimationItems.map((item) => ({
        product_id: item.product_id,
        product_service: item.product_service,
        description: item.description || "",
        qty: item.qty,
        unit_price: item.unit_price,
        original_currency: item.original_currency || formData.currency,
        original_price: item.original_price || item.unit_price,
      })),
      standard_discount_percentage: Number.parseFloat(
        formData.standard_discount_percentage || "0",
      ),
      special_discount_percentage: Number.parseFloat(
        formData.special_discount_percentage || "0",
      ),
      tax_percentage: Number.parseFloat(formData.tax_percentage || "0"),
      currency: formData.currency,
    };
    await createEstimate(estimatePayload, false);
  } catch (estimateError: unknown) {
    console.error("Failed to create estimate:", estimateError);
    toast.warning(
      "Deal created but failed to save estimation chart. You can add it later.",
    );
  }
}

function useCreateDealSubmitHandlers(args: {
  router: ReturnType<typeof useRouter>;
  formStep: number;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  dealTemplate: DealTemplateData | null;
  formData: Record<string, any>;
  templateFieldsData: Record<string, any>;
  businessTypeId: number | null;
  businessTypeOther: string;
  estimationItems: Array<{
    product_id: number;
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    original_currency: string;
    original_price: number;
  }>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  validateStep0: () => boolean;
  validateStep1: () => boolean;
  validateStep2: () => boolean;
  validateStep4: () => boolean;
  validateCurrentStep: () => boolean;
}) {
  const {
    router,
    formStep,
    setFormStep,
    dealTemplate,
    formData,
    templateFieldsData,
    businessTypeId,
    businessTypeOther,
    estimationItems,
    setLoading,
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep4,
    validateCurrentStep,
  } = args;

  const handleNextStep = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!validateCurrentStep()) return;
      let nextStep = formStep + 1;
      if (nextStep === 2 && !dealTemplate) {
        nextStep = 3;
      }
      setFormStep(Math.min(4, nextStep));
    },
    [validateCurrentStep, formStep, dealTemplate, setFormStep],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formStep < 4) {
        let nextStep = formStep + 1;
        if (nextStep === 2 && !dealTemplate) {
          nextStep = 3;
        }
        setFormStep(nextStep);
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
        const payload = buildCreateDealSubmissionPayload({
          formData,
          businessTypeId,
          businessTypeOther,
          dealTemplate,
          templateFieldsData,
        });
        const createdDeal = await createDeal(payload).then((res) => res?.data);
        await createEstimateForNewDealIfNeeded({
          estimationItems,
          createdDeal,
          formData,
        });
        router.push("/crm/deals");
      } catch (error: unknown) {
        console.error("Failed to create deal:", error);
      } finally {
        setLoading(false);
      }
    },
    [
      router,
      formStep,
      setFormStep,
      dealTemplate,
      formData,
      templateFieldsData,
      businessTypeId,
      businessTypeOther,
      estimationItems,
      setLoading,
      validateStep0,
      validateStep1,
      validateStep2,
      validateStep4,
    ],
  );

  return { handleNextStep, handleSubmit };
}

function getCreateDealProgressWidthPercent(
  formStep: number,
  dealTemplate: DealTemplateData | null,
): number {
  const totalVisibleSteps = dealTemplate ? 5 : 4;
  let visualPosition = formStep;
  if (!dealTemplate && formStep > 2) {
    visualPosition = formStep - 1;
  }
  return ((visualPosition + 1) / totalVisibleSteps) * 100;
}

const CREATE_DEAL_WIZARD_STEP_INDEXES = [0, 1, 2, 3, 4] as const;

function getCreateDealWizardDisplayNumber(
  step: number,
  dealTemplate: DealTemplateData | null,
): number {
  if (!dealTemplate && step > 2) {
    return step;
  }
  return step + 1;
}

function getCreateDealWizardStepLabel(step: number): string {
  switch (step) {
    case 0:
      return "Deal Info";
    case 1:
      return "Company Info";
    case 2:
      return "Characteristics";
    case 3:
      return "Progress & Notes";
    default:
      return "Estimation";
  }
}

function CreateDealWizardTimeline(
  props: Readonly<{
    formStep: number;
    dealTemplate: DealTemplateData | null;
    setFormStep: React.Dispatch<React.SetStateAction<number>>;
  }>,
) {
  const { formStep, dealTemplate, setFormStep } = props;
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between position-relative">
        <div
          className="position-absolute bg-light"
          style={{
            left: "0",
            right: "0",
            top: "20px",
            height: "2px",
            zIndex: 0,
          }}
        />
        <div
          className="position-absolute bg-primary"
          style={{
            left: "0",
            top: "20px",
            height: "2px",
            width: `${getCreateDealProgressWidthPercent(formStep, dealTemplate)}%`,
            zIndex: 0,
            transition: "width 0.3s ease",
          }}
        />

        {CREATE_DEAL_WIZARD_STEP_INDEXES.map((step) => {
          if (step === 2 && !dealTemplate) {
            return null;
          }
          const displayNumber = getCreateDealWizardDisplayNumber(
            step,
            dealTemplate,
          );
          const stepLabel = getCreateDealWizardStepLabel(step);
          return (
            <button
              key={step}
              type="button"
              className="text-center position-relative border-0 bg-transparent p-0"
              style={{ flex: 1, cursor: "pointer" }}
              onClick={() => {
                setFormStep(step);
              }}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto ${formStep >= step ? "bg-primary text-white" : "bg-light text-muted"}`}
                style={{
                  width: "40px",
                  height: "40px",
                  zIndex: 1,
                  position: "relative",
                }}
              >
                {formStep > step ? <CheckCircle size={20} /> : displayNumber}
              </div>
              <small
                className={`d-block mt-2 ${formStep === step ? "fw-bold text-primary" : "text-muted"}`}
              >
                {stepLabel}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useCreateDealPageModel() {
  const router = useRouter();
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [campaignIndustries, setCampaignIndustries] = useState<IndustryData[]>(
    [],
  );
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(
    null,
  );
  const [showAllIndustries, setShowAllIndustries] = useState(false);
  const [estimationItems, setEstimationItems] = useState<
    Array<{
      product_id: number;
      product_service: string;
      description: string;
      qty: number;
      unit_price: number;
      original_currency: string;
      original_price: number;
    }>
  >([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemFormData, setItemFormData] = useState({
    product_id: null as number | null,
    product_service: "",
    description: "",
    qty: 1,
    unit_price: 0,
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
  const [sourceLead, setSourceLead] = useState<any>(null);
  const [convertingPrice, setConvertingPrice] = useState(false);
  const [dealTemplate, setDealTemplate] = useState<DealTemplateData | null>(
    null,
  );
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateFieldsData, setTemplateFieldsData] = useState<
    Record<string, any>
  >({});

  const leadHydratedIdRef = useRef<number | null>(null);

  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [businessTypeOther, setBusinessTypeOther] = useState<string>("");
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);

  const {
    stages,
    extensions,
    businessTypes,
    allIndustries,
    loadingAllIndustries,
    parsedLeadId,
    leadQuery,
    loadingLead,
    campaignQuery,
    loadingIndustries,
    industriesQuery,
  } = useCreateDealPageQueries(router, sourceLead);

  const {
    products,
    setProducts,
    loadingProducts,
    fetchProductsByIndustry,
    handleIndustryChange,
  } = useCreateDealProductLoading(setSelectedIndustryId, setItemFormData);

  useIndustriesQueryErrorToast(
    industriesQuery.isError,
    industriesQuery.error,
  );

  useCampaignIndustriesFromSourceLead({
    campaignId: sourceLead?.campaign_id as CampaignIdForDeal,
    campaignData: campaignQuery.data,
    allIndustries,
    fetchProductsByIndustry,
    setCampaignIndustries,
    setFormData,
    setSelectedIndustryId,
  });

  useCreateDealLeadPipelineEffects({
    parsedLeadId,
    leadQuery,
    leadHydratedIdRef,
    setSourceLead,
    setFormData,
    setDealTemplate,
    setTemplateFieldsData,
    setLoadingTemplate,
  });

  const {
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep4,
    validateCurrentStep,
  } = useCreateDealStepValidation({
    formData,
    formStep,
    dealTemplate,
    templateFieldsData,
    estimationItems,
  });

  const { handleNextStep, handleSubmit } = useCreateDealSubmitHandlers({
    router,
    formStep,
    setFormStep,
    dealTemplate,
    formData,
    templateFieldsData,
    businessTypeId,
    businessTypeOther,
    estimationItems,
    setLoading,
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep4,
    validateCurrentStep,
  });

  return {
    router,
    formStep,
    setFormStep,
    loading,
    setLoading,
    campaignIndustries,
    setCampaignIndustries,
    selectedIndustryId,
    setSelectedIndustryId,
    showAllIndustries,
    setShowAllIndustries,
    estimationItems,
    setEstimationItems,
    showAddItemModal,
    setShowAddItemModal,
    editingItemIndex,
    setEditingItemIndex,
    itemFormData,
    setItemFormData,
    formData,
    setFormData,
    sourceLead,
    setSourceLead,
    convertingPrice,
    setConvertingPrice,
    dealTemplate,
    setDealTemplate,
    loadingTemplate,
    setLoadingTemplate,
    templateFieldsData,
    setTemplateFieldsData,
    leadHydratedIdRef,
    businessTypeId,
    setBusinessTypeId,
    businessTypeOther,
    setBusinessTypeOther,
    showOtherBusinessType,
    setShowOtherBusinessType,
    stages,
    extensions,
    businessTypes,
    allIndustries,
    loadingAllIndustries,
    parsedLeadId,
    leadQuery,
    loadingLead,
    campaignQuery,
    loadingIndustries,
    industriesQuery,
    products,
    setProducts,
    loadingProducts,
    fetchProductsByIndustry,
    handleIndustryChange,
    validateStep0,
    validateStep1,
    validateStep2,
    validateStep4,
    validateCurrentStep,
    handleNextStep,
    handleSubmit,
  };
}

type CreateDealPageModel = ReturnType<typeof useCreateDealPageModel>;

function CreateDealLeadConversionBanner(
  props: Readonly<{ sourceLead: any }>,
) {
  const { sourceLead } = props;
  if (!sourceLead) {
    return null;
  }
  return (
    <Card className="mb-3 border-0 bg-info bg-opacity-10">
      <Card.Body>
        <div className="d-flex align-items-center gap-2">
          <Badge bg="info">Converted from Lead</Badge>
          <span className="small text-muted">
            Lead: <strong>{sourceLead.name}</strong>
            {sourceLead.company_name
              ? ` • Company: ${sourceLead.company_name}`
              : ""}
            {sourceLead.id ? ` • ID: #${sourceLead.id}` : ""}
          </span>
        </div>
      </Card.Body>
    </Card>
  );
}

function CreateDealLoadingLeadCard(props: Readonly<{ loadingLead: boolean }>) {
  if (!props.loadingLead) {
    return null;
  }
  return (
    <Card className="mb-3 border-0">
      <Card.Body className="text-center py-4">
        <output className="spinner-border text-primary d-inline-block" aria-live="polite">
          <span className="visually-hidden">Loading lead data...</span>
        </output>
        <p className="mt-2 text-muted">Loading lead information...</p>
      </Card.Body>
    </Card>
  );
}

function CreateDealFormHeaderBar(
  props: Readonly<{ router: ReturnType<typeof useRouter> }>,
) {
  const { router } = props;
  return (
    <Card.Header>
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0 app-heading">Deal Information</h4>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            const w = globalThis.window;
            if (w !== undefined && w.history.length > 1) {
              w.history.back();
            } else {
              void router.push("/crm/deals");
            }
          }}
        >
          <ArrowLeft size={16} className="me-2" />
          Back
        </Button>
      </div>
    </Card.Header>
  );
}

function CreateDealView(props: Readonly<CreateDealPageModel>) { // NOSONAR S3776 — wizard step markup; timeline, banners, and header extracted to child components.
  const {
    router,
    formStep,
    setFormStep,
    loading,
    campaignIndustries,
    selectedIndustryId,
    setSelectedIndustryId,
    showAllIndustries,
    setShowAllIndustries,
    estimationItems,
    setEstimationItems,
    showAddItemModal,
    setShowAddItemModal,
    editingItemIndex,
    setEditingItemIndex,
    itemFormData,
    setItemFormData,
    formData,
    setFormData,
    sourceLead,
    convertingPrice,
    setConvertingPrice,
    dealTemplate,
    loadingTemplate,
    templateFieldsData,
    setTemplateFieldsData,
    businessTypeId,
    setBusinessTypeId,
    businessTypeOther,
    setBusinessTypeOther,
    showOtherBusinessType,
    setShowOtherBusinessType,
    stages,
    extensions,
    businessTypes,
    allIndustries,
    loadingAllIndustries,
    loadingLead,
    loadingIndustries,
    products,
    setProducts,
    loadingProducts,
    handleIndustryChange,
    handleNextStep,
    handleSubmit,
  } = props;

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle="CRM"
        mainLink="/crm/dashboard"
        subTitle="Deals"
      />
      <div className="container-fluid">
        {/* Create Deal Form */}
        <div className="row">
          <div className="col-12">
            <CreateDealLeadConversionBanner sourceLead={sourceLead} />
            <CreateDealLoadingLeadCard loadingLead={loadingLead} />

            <Card className="border-0 shadow-sm">
              <CreateDealFormHeaderBar router={router} />
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <CreateDealWizardTimeline
                    formStep={formStep}
                    dealTemplate={dealTemplate}
                    setFormStep={setFormStep}
                  />

          {/* Form Content Based on Step */}
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
                                          unit_price: Number.parseFloat(product.price) || item.unit_price,
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
                  <h5 className="fw-bold mb-4 text-success">ESTIMATION CHART</h5>
                  
                  {/* Warning message if no products */}
                  {estimationItems.length === 0 && (
                    <Card className="mb-3 border-warning bg-warning bg-opacity-10">
                      <Card.Body className="py-2">
                        <div className="d-flex align-items-center gap-2 text-warning">
                          <strong>⚠️ Required:</strong>
                          <span>Please add at least one product to the estimation chart before creating the deal.</span>
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                  
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
                          value={(formData.standard_discount_percentage && Number.parseFloat(formData.standard_discount_percentage))}
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
                        <Form.Select
                          value={(formData.special_discount_percentage && Number.parseFloat(formData.special_discount_percentage))}
                          onChange={(e) => setFormData({ ...formData, special_discount_percentage: e.target.value })}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="10">10%</option>
                          <option value="15">15%</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>}
                  </Row>

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
                      .order-items-table-wrapper tbody tr:hover td {
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
                                      {formData.currency || 'AED'} {Number.parseFloat(String(item.unit_price || '0')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    {showConversionInfo && (
                                      <div className="small text-muted" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                        Original: {formatCurrency(item.original_price, item.original_currency)}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#212529', whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                            const totalDiscountPercentage = Number.parseFloat(formData.standard_discount_percentage || "0") + Number.parseFloat(formData.special_discount_percentage || "0");
                            const totalDiscount = (grandTotal * totalDiscountPercentage) / 100;
                            const subtotalAfterDiscount = grandTotal - totalDiscount;
                            const taxAmount = (subtotalAfterDiscount * Number.parseFloat(formData.tax_percentage || "0")) / 100;
                            const netValue = subtotalAfterDiscount + taxAmount;
                            return (
                              <tfoot>
                                <tr>
                                  <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <strong>Subtotal:</strong>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {formData.currency || 'AED'} {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                                {totalDiscount > 0 && (
                                  <tr>
                                    <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <span style={{ color: '#6c757d' }}>
                                        Discount ({Number.parseFloat(formData.standard_discount_percentage || "0") + Number.parseFloat(formData.special_discount_percentage || "0")}%):
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#dc3545', whiteSpace: 'nowrap' }}>
                                      - {formData.currency || 'AED'} {totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                {Number.parseFloat(formData.tax_percentage || "0") > 0 && (
                                  <tr>
                                    <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px' }}>
                                      <strong>Tax ({formData.tax_percentage}%):</strong>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                      {formData.currency || 'AED'} {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                )}
                                <tr style={{ fontSize: '1rem', borderTop: '2px solid #dee2e6' }}>
                                  <td colSpan={estimationItems.some((item) => item.description) ? 7 : 6} style={{ textAlign: 'right', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', paddingLeft: '20px' }}>
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

            {/* Add/Edit Item Modal */}
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
                  original_price: Number.parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
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
                              Only one industry available
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
                              const originalPrice = Number.parseFloat(product.price) || 0;
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
                            const originalPrice = Number.parseFloat(product.price) || 0;
                            
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
                          placeholder={selectedIndustryId ? "Select a product" : "Please select an industry first"}
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
                          onChange={(e) => setItemFormData({ ...itemFormData, unit_price: Number.parseFloat(e.target.value) || 0 })}
                          required
                          disabled={convertingPrice}
                        />
                        {itemFormData.product_id && (() => {
                          const selectedProduct = products.find(p => p.id === itemFormData.product_id);
                          if (selectedProduct) {
                            const productCurrency = selectedProduct.currency.toUpperCase();
                            const dealCurrency = formData.currency.toUpperCase();
                            const originalPrice = Number.parseFloat(selectedProduct.price) || 0;
                            
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
                    setShowAllIndustries(false);
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
                        original_price: Number.parseFloat(selectedProduct?.price || "0") || itemFormData.unit_price,
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
          </div>

          {/* Form Footer */}
          <div className="d-flex justify-content-between mt-4">
            <Button 
              variant="secondary" 
              onClick={(e) => {
                e.preventDefault();
                if (formStep > 0) {
                  let prevStep = formStep - 1;
                  // Skip step 2 if no template and going back from step 3
                  if (prevStep === 2 && !dealTemplate) {
                    prevStep = 1;
                  }
                  setFormStep(prevStep);
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
                  onClick={handleNextStep}
                >
                  Next <ChevronRight size={16} className="ms-1" />
                </Button>
              ) : (
                <Button variant="primary" type="submit" disabled={loading || estimationItems.length === 0}>
                  {loading ? 'Creating...' : 'Create Deal'}
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
}

const CreateDeal = () => <CreateDealView {...useCreateDealPageModel()} />;

CreateDeal.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CreateDeal;

