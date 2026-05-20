import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getStages,
  getCrmProducts,
  getCampaignById,
  getIndustries,
  CrmProduct,
  IndustryData,
  DealTemplateData,
  DealTemplateField,
  getBusinessTypes,
} from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import {
  Button,
  Row,
  Col,
  Form,
  Card,
  Badge,
  Table,
  Modal,
} from "react-bootstrap";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Package,
  History,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Select from "react-select";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { ModuleSlug } from "@utils/Helper";
import { convertCurrency, formatCurrency } from "@utils/currency";
import { crmAppKeys } from "@query/keys";
import {
  isDealTemplatePrimitiveValue,
  getNormalizedDealTemplateValue,
  type EstimationLineItem,
} from "@utils/crm/editDealFetchHelpers";
import { runEditDealInitialLoad } from "@utils/crm/editDealInitialLoad";
import {
  advanceEditDealFormStepOnSubmit,
  submitUpdatedDealFromEditPage,
} from "@utils/crm/editDealSubmitHelpers";
import { validateEditDealCurrentStep } from "@utils/crm/editDealStepValidators";
import { EditDealWizardTimeline } from "@page-modules/crm/deals/EditDealWizardTimeline";

function getBusinessTypeSelectValue(
  showOtherBusinessType: boolean,
  businessTypeId: number | null,
): string {
  if (showOtherBusinessType) return "other";
  if (businessTypeId) return String(businessTypeId);
  return "";
}

function getDealTemplateFieldInputType(
  fieldType: string | undefined,
): "date" | "email" | "text" {
  if (fieldType === "date") return "date";
  if (fieldType === "email") return "email";
  return "text";
}

function resolveAddItemModalAvailableIndustries(
  showAllIndustries: boolean,
  formIndustryIds: number[],
  allIndustries: IndustryData[],
  campaignIndustries: IndustryData[],
): IndustryData[] {
  if (showAllIndustries) return allIndustries;
  if (formIndustryIds.length > 0) {
    return allIndustries.filter((ind) => formIndustryIds.includes(ind.id));
  }
  return campaignIndustries;
}

function formatRevisionVersionLabel(
  version: string | undefined,
  estimatesLength: number,
  index: number,
): string {
  if (version) return version;
  const n = estimatesLength - index;
  return `v${n}.0`;
}

async function convertEstimationItemsToNewDealCurrency(
  estimationItems: EstimationLineItem[],
  products: CrmProduct[],
  previousDealCurrency: string,
  newDealCurrency: string,
): Promise<EstimationLineItem[]> {
  return Promise.all(
    estimationItems.map(async (item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return item;
      const productCurrency = product.currency.toUpperCase();
      const newDealCur = newDealCurrency.toUpperCase();
      const oldDealCur = previousDealCurrency.toUpperCase();
      if (productCurrency === newDealCur) {
        return {
          ...item,
          unit_price: Number.parseFloat(product.price) || item.unit_price,
        };
      }
      if (oldDealCur !== newDealCur) {
        const convertedPrice = await convertCurrency(
          item.unit_price,
          oldDealCur,
          newDealCur,
        );
        return { ...item, unit_price: convertedPrice };
      }
      return item;
    }),
  );
}

function useIndustriesQueryErrorToast(
  isError: boolean,
  error: unknown,
): void {
  useEffect(() => {
    if (!isError) return;
    console.error("Failed to fetch product groups:", error);
    toast.error("Failed to fetch product groups");
  }, [isError, error]);
}

function useCampaignIndustriesFromSourceLead(args: {
  campaignId: string | number | undefined;
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

type DealLineItemFormState = {
  product_id: number | null;
  product_service: string;
  description: string;
  qty: number;
  unit_price: number;
};

function useEditDealProductLoading(
  setSelectedIndustryId: React.Dispatch<React.SetStateAction<number | null>>,
  setItemFormData: React.Dispatch<
    React.SetStateAction<DealLineItemFormState>
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
      toast.error("Failed to fetch products for selected product group");
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

type EditDealFormActionDeps = Readonly<{
  router: ReturnType<typeof useRouter>;
  id: string | string[] | undefined;
  formStep: number;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  formData: any;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
  businessTypeId: number | null;
  businessTypeOther: string;
  negotiationBar: number;
  probability: number;
  estimationItems: EstimationLineItem[];
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>;

function useEditDealFormActions(deps: EditDealFormActionDeps) {
  const {
    router,
    id,
    formStep,
    setFormStep,
    formData,
    dealTemplate,
    templateFieldsData,
    businessTypeId,
    businessTypeOther,
    negotiationBar,
    probability,
    estimationItems,
    setLoading,
  } = deps;

  const validateCurrentStep = useCallback(
    (): boolean =>
      validateEditDealCurrentStep({
        formStep,
        formData,
        dealTemplate,
        templateFieldsData,
      }),
    [formStep, formData, dealTemplate, templateFieldsData],
  );

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
      if (
        advanceEditDealFormStepOnSubmit({
          formStep,
          dealTemplate,
          setFormStep,
        })
      ) {
        return;
      }

      await submitUpdatedDealFromEditPage({
        router,
        id,
        formStep,
        setFormStep,
        formData,
        dealTemplate,
        templateFieldsData,
        businessTypeId,
        businessTypeOther,
        negotiationBar,
        probability,
        estimationItems,
        setLoading,
      });
    },
    [
      router,
      id,
      formStep,
      setFormStep,
      formData,
      dealTemplate,
      templateFieldsData,
      businessTypeId,
      businessTypeOther,
      negotiationBar,
      probability,
      estimationItems,
      setLoading,
    ],
  );

  return { handleNextStep, handleSubmit };
}

function useEditDealInitialLoadOnReady(args: {
  router: ReturnType<typeof useRouter>;
  id: string | string[] | undefined;
  isInitialLoad: { current: boolean };
  setFetching: React.Dispatch<React.SetStateAction<boolean>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setBusinessTypeId: React.Dispatch<React.SetStateAction<number | null>>;
  setBusinessTypeOther: React.Dispatch<React.SetStateAction<string>>;
  setShowOtherBusinessType: React.Dispatch<React.SetStateAction<boolean>>;
  setSourceLead: React.Dispatch<React.SetStateAction<unknown>>;
  setDealTemplate: React.Dispatch<
    React.SetStateAction<DealTemplateData | null>
  >;
  setTemplateFieldsData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setEstimates: React.Dispatch<React.SetStateAction<unknown[]>>;
  setAttachments: React.Dispatch<React.SetStateAction<unknown[]>>;
  setHistories: React.Dispatch<React.SetStateAction<unknown[]>>;
  setNegotiationBar: React.Dispatch<React.SetStateAction<number>>;
  setProbability: React.Dispatch<React.SetStateAction<number>>;
  setEstimationItems: React.Dispatch<
    React.SetStateAction<EstimationLineItem[]>
  >;
}): void {
  const {
    router,
    id,
    isInitialLoad,
    setFetching,
    setFormData,
    setBusinessTypeId,
    setBusinessTypeOther,
    setShowOtherBusinessType,
    setSourceLead,
    setDealTemplate,
    setTemplateFieldsData,
    setEstimates,
    setAttachments,
    setHistories,
    setNegotiationBar,
    setProbability,
    setEstimationItems,
  } = args;

  useEffect(() => {
    runEditDealInitialLoad({
      router,
      dealIdParam: id,
      isInitialLoad,
      setFetching,
      setFormData,
      setBusinessTypeId,
      setBusinessTypeOther,
      setShowOtherBusinessType,
      setSourceLead,
      setDealTemplate,
      setTemplateFieldsData,
      setEstimates,
      setAttachments,
      setHistories,
      setNegotiationBar,
      setProbability,
      setEstimationItems,
    }).catch(() => undefined);
  }, [router.isReady, id, router]);
}

function useEditDealPageQueries(sourceLead: { campaign_id?: unknown } | null) {
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
    campaignQuery,
    industriesQuery,
    loadingIndustries,
  };
}

type EditDealLoadedPhaseIntegrationArgs = Readonly<{
  router: ReturnType<typeof useRouter>;
  id: string | string[] | undefined;
  isInitialLoad: { current: boolean };
  showAllIndustries: boolean;
  formData: { industry_ids?: number[] };
  allIndustries: IndustryData[];
  campaignIndustries: IndustryData[];
  industriesQuery: { isError: boolean; error: unknown };
  sourceLead: { campaign_id?: unknown } | null;
  campaignQuery: { data: unknown };
  fetchProductsByIndustry: (industryId: number) => Promise<void>;
  setCampaignIndustries: React.Dispatch<React.SetStateAction<IndustryData[]>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setSelectedIndustryId: React.Dispatch<React.SetStateAction<number | null>>;
  setFetching: React.Dispatch<React.SetStateAction<boolean>>;
  setBusinessTypeId: React.Dispatch<React.SetStateAction<number | null>>;
  setBusinessTypeOther: React.Dispatch<React.SetStateAction<string>>;
  setShowOtherBusinessType: React.Dispatch<React.SetStateAction<boolean>>;
  setSourceLead: React.Dispatch<React.SetStateAction<unknown>>;
  setDealTemplate: React.Dispatch<
    React.SetStateAction<DealTemplateData | null>
  >;
  setTemplateFieldsData: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
  setEstimates: React.Dispatch<React.SetStateAction<unknown[]>>;
  setAttachments: React.Dispatch<React.SetStateAction<unknown[]>>;
  setHistories: React.Dispatch<React.SetStateAction<unknown[]>>;
  setNegotiationBar: React.Dispatch<React.SetStateAction<number>>;
  setProbability: React.Dispatch<React.SetStateAction<number>>;
  setEstimationItems: React.Dispatch<
    React.SetStateAction<EstimationLineItem[]>
  >;
  formStep: number;
  setFormStep: React.Dispatch<React.SetStateAction<number>>;
  dealTemplate: DealTemplateData | null;
  templateFieldsData: Record<string, any>;
  businessTypeId: number | null;
  businessTypeOther: string;
  negotiationBar: number;
  probability: number;
  estimationItems: EstimationLineItem[];
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>;

function useEditDealLoadedPhaseIntegration(a: EditDealLoadedPhaseIntegrationArgs) {
  const addItemAvailableIndustries = useMemo(
    () =>
      resolveAddItemModalAvailableIndustries(
        a.showAllIndustries,
        a.formData.industry_ids ?? [],
        a.allIndustries,
        a.campaignIndustries,
      ),
    [
      a.showAllIndustries,
      a.formData.industry_ids,
      a.allIndustries,
      a.campaignIndustries,
    ],
  );

  useIndustriesQueryErrorToast(a.industriesQuery.isError, a.industriesQuery.error);

  useCampaignIndustriesFromSourceLead({
    campaignId: a.sourceLead?.campaign_id as string | number | undefined,
    campaignData: a.campaignQuery.data,
    allIndustries: a.allIndustries,
    fetchProductsByIndustry: a.fetchProductsByIndustry,
    setCampaignIndustries: a.setCampaignIndustries,
    setFormData: a.setFormData,
    setSelectedIndustryId: a.setSelectedIndustryId,
  });

  useEditDealInitialLoadOnReady({
    router: a.router,
    id: a.id,
    isInitialLoad: a.isInitialLoad,
    setFetching: a.setFetching,
    setFormData: a.setFormData,
    setBusinessTypeId: a.setBusinessTypeId,
    setBusinessTypeOther: a.setBusinessTypeOther,
    setShowOtherBusinessType: a.setShowOtherBusinessType,
    setSourceLead: a.setSourceLead,
    setDealTemplate: a.setDealTemplate,
    setTemplateFieldsData: a.setTemplateFieldsData,
    setEstimates: a.setEstimates,
    setAttachments: a.setAttachments,
    setHistories: a.setHistories,
    setNegotiationBar: a.setNegotiationBar,
    setProbability: a.setProbability,
    setEstimationItems: a.setEstimationItems,
  });

  const { handleNextStep, handleSubmit } = useEditDealFormActions({
    router: a.router,
    id: a.id,
    formStep: a.formStep,
    setFormStep: a.setFormStep,
    formData: a.formData,
    dealTemplate: a.dealTemplate,
    templateFieldsData: a.templateFieldsData,
    businessTypeId: a.businessTypeId,
    businessTypeOther: a.businessTypeOther,
    negotiationBar: a.negotiationBar,
    probability: a.probability,
    estimationItems: a.estimationItems,
    setLoading: a.setLoading,
  });

  return { addItemAvailableIndustries, handleNextStep, handleSubmit };
}

const EditDeal = () => { // NOSONAR S3776 — wizard markup; logic extracted to hooks/helpers above.
  const router = useRouter();
  const { id } = router.query;
  const [formStep, setFormStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [histories, setHistories] = useState<any[]>([]);
  const [negotiationBar, setNegotiationBar] = useState(0);
  const [probability, setProbability] = useState(0);
  const isInitialLoad = useRef(true);
  const [campaignIndustries, setCampaignIndustries] = useState<IndustryData[]>(
    [],
  );
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(
    null,
  );
  const [sourceLead, setSourceLead] = useState<any>(null);
  const [dealTemplate, setDealTemplate] = useState<DealTemplateData | null>(
    null,
  );
  const [templateFieldsData, setTemplateFieldsData] = useState<
    Record<string, any>
  >({});

  // Business type state
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [businessTypeOther, setBusinessTypeOther] = useState<string>("");
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);
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
  const {
    products,
    setProducts,
    loadingProducts,
    fetchProductsByIndustry,
    handleIndustryChange,
  } = useEditDealProductLoading(setSelectedIndustryId, setItemFormData);
  const [showRevisionHistoryModal, setShowRevisionHistoryModal] =
    useState(false);
  const [convertingPrice, setConvertingPrice] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    ticket_id: null as number | null,
    stage_id: undefined as number | undefined,
    assigned_to: null as string | null,
    expected_close_date: "",
    company_name: "",
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

  const {
    stages,
    extensions,
    businessTypes,
    allIndustries,
    loadingAllIndustries,
    campaignQuery,
    industriesQuery,
    loadingIndustries,
  } = useEditDealPageQueries(sourceLead);

  const { addItemAvailableIndustries, handleNextStep, handleSubmit } =
    useEditDealLoadedPhaseIntegration({
      router,
      id,
      isInitialLoad,
      showAllIndustries,
      formData,
      allIndustries,
      campaignIndustries,
      industriesQuery,
      sourceLead,
      campaignQuery,
      fetchProductsByIndustry,
      setCampaignIndustries,
      setFormData,
      setSelectedIndustryId,
      setFetching,
      setBusinessTypeId,
      setBusinessTypeOther,
      setShowOtherBusinessType,
      setSourceLead,
      setDealTemplate,
      setTemplateFieldsData,
      setEstimates,
      setAttachments,
      setHistories,
      setNegotiationBar,
      setProbability,
      setEstimationItems,
      formStep,
      setFormStep,
      dealTemplate,
      templateFieldsData,
      businessTypeId,
      businessTypeOther,
      negotiationBar,
      probability,
      estimationItems,
      setLoading,
    });

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
            <Card
              className="border-0 shadow-sm"
              data-attachment-count={attachments.length}
            >
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0 app-heading">Edit Deal Information</h4>
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
                  <EditDealWizardTimeline
                    formStep={formStep}
                    setFormStep={setFormStep}
                    dealTemplate={dealTemplate}
                  />

                  {/* Form Content - Same structure as create page */}
                  <div style={{ minHeight: "400px" }}>
                    {/* Step 0: Deal Information */}
                    {formStep === 0 && (
                      <Card className="mb-3 border-0 bg-light">
                        <Card.Body>
                          <h5 className="fw-bold mb-4 text-primary">
                            DEAL INFORMATION
                          </h5>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Deal Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      name: e.target.value,
                                    })
                                  }
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
                                  value={formData.stage_id || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      stage_id: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    })
                                  }
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
                                <Form.Label>
                                  Expected Close Date{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  value={formData.expected_close_date}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      expected_close_date: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Assigned to{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={formData.assigned_to || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      assigned_to: e.target.value || null,
                                    })
                                  }
                                  required
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
                                <Form.Label>
                                  Currency{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={formData.currency}
                                  onChange={async (e) => {
                                    const newCurrency = e.target.value;
                                    setFormData({
                                      ...formData,
                                      currency: newCurrency,
                                    });

                                    // Convert all existing estimation items to new currency
                                    if (estimationItems.length > 0) {
                                      try {
                                        setConvertingPrice(true);
                                        const convertedItems =
                                          await convertEstimationItemsToNewDealCurrency(
                                            estimationItems,
                                            products,
                                            formData.currency,
                                            newCurrency,
                                          );
                                        setEstimationItems(convertedItems);
                                      } catch (error) {
                                        console.error(
                                          "Failed to convert existing items:",
                                          error,
                                        );
                                        toast.error(
                                          "Failed to convert prices to new currency",
                                        );
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
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      follow_up_date: e.target.value,
                                    })
                                  }
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
                          <h5 className="fw-bold mb-4 text-success">
                            COMPANY INFORMATION
                          </h5>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Company Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.company_name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      company_name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter company name"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Select Business Type{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                  value={getBusinessTypeSelectValue(
                                    showOtherBusinessType,
                                    businessTypeId,
                                  )}
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
                                    <option
                                      key={businessType.id}
                                      value={businessType.id}
                                    >
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
                                  <Form.Label>
                                    Business Type (Other){" "}
                                    <span className="text-danger">*</span>
                                  </Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={businessTypeOther}
                                    onChange={(e) =>
                                      setBusinessTypeOther(e.target.value)
                                    }
                                    placeholder="Enter business type"
                                    required
                                  />
                                </Form.Group>
                              </Col>
                            )}
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Decision Maker Title</Form.Label>
                                <Form.Select
                                  value={formData.decision_maker_title}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      decision_maker_title: e.target.value,
                                    })
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
                            <Col md={8}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Decision Maker Name{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={formData.decision_maker_name}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      decision_maker_name: e.target.value,
                                    })
                                  }
                                  placeholder="Decision maker name"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Decision Maker Email{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="email"
                                  value={formData.decision_maker_email}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      decision_maker_email: e.target.value,
                                    })
                                  }
                                  placeholder="decisionmaker@company.com"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Decision Maker Phone{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <div className="phone-input-wrapper">
                                  <PhoneInput
                                    international
                                    defaultCountry="US"
                                    value={
                                      formData.decision_maker_phone_country_code &&
                                      formData.decision_maker_phone
                                        ? `${formData.decision_maker_phone_country_code}${formData.decision_maker_phone}`
                                        : formData.decision_maker_phone ||
                                          undefined
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        try {
                                          // Parse the phone number to extract country code and national number
                                          const phoneNumber =
                                            parsePhoneNumber(value);
                                          if (phoneNumber) {
                                            setFormData((prev) => ({
                                              ...prev,
                                              decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                                              decision_maker_phone:
                                                phoneNumber.nationalNumber,
                                            }));
                                          } else {
                                            // Fallback: store full number in phone field
                                            setFormData((prev) => ({
                                              ...prev,
                                              decision_maker_phone_country_code:
                                                "",
                                              decision_maker_phone: value,
                                            }));
                                          }
                                        } catch (error: unknown) {
                                          console.debug(
                                            "Phone number parse failed, storing raw value",
                                            error,
                                          );
                                          setFormData((prev) => ({
                                            ...prev,
                                            decision_maker_phone_country_code:
                                              "",
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
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}

                    {/* Step 2: Deal Characteristics */}
                    {formStep === 2 && dealTemplate && (
                        <Card className="mb-3 border-0 bg-light">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                              <h5 className="fw-bold mb-0 text-info">
                                DEAL CHARACTERISTICS
                              </h5>
                              {dealTemplate?.name && (
                                <Badge bg="info" className="ms-2">
                                  Template: {dealTemplate?.name}
                                </Badge>
                              )}
                            </div>
                            {dealTemplate?.description && (
                              <div className="alert alert-info mb-4">
                                <small>{dealTemplate?.description}</small>
                              </div>
                            )}
                            {Object.keys(templateFieldsData || {}).length >
                              0 && (
                              <div className="alert alert-light border mb-3">
                                <div className="fw-semibold mb-2">
                                  Template Data
                                </div>
                                <div className="small text-muted">
                                  {Object.entries(templateFieldsData)
                                    .filter(([, value]) => {
                                      if (!isDealTemplatePrimitiveValue(value))
                                        return false;
                                      return (
                                        getNormalizedDealTemplateValue(value) !== ""
                                      );
                                    })
                                    .map(([key, value]) => (
                                      <div key={key}>
                                        <strong>{key}</strong>:{" "}
                                        {getNormalizedDealTemplateValue(value)}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                            {dealTemplate?.fields &&
                            dealTemplate.fields.length > 0 ? (
                              <Row>
                                {(() => {
                                  const fieldsArray = dealTemplate.fields || [];
                                  const sortedFields = [...fieldsArray].sort(
                                    (a, b) =>
                                      (Number(a.sort_order) || 0) -
                                      (Number(b.sort_order) || 0),
                                  );
                                  return sortedFields.map(
                                    (field: DealTemplateField) => {
                                      const fieldValue =
                                        templateFieldsData[field.field_name] ||
                                        "";

                                      let templateFieldInput: React.ReactNode;
                                      if (field.field_type === "dropdown") {
                                        templateFieldInput = (
                                          <Form.Select
                                            value={fieldValue}
                                            onChange={(e) =>
                                              setTemplateFieldsData({
                                                ...templateFieldsData,
                                                [field.field_name]:
                                                  e.target.value,
                                              })
                                            }
                                            required={field.is_required}
                                          >
                                            <option value="">
                                              Select {field.field_name}
                                            </option>
                                            {field.options &&
                                              Array.isArray(field.options) &&
                                              field.options.map(
                                                (option: string) => (
                                                  <option
                                                    key={`${field.field_name}:${option}`}
                                                    value={option}
                                                  >
                                                    {option}
                                                  </option>
                                                ),
                                              )}
                                          </Form.Select>
                                        );
                                      } else if (
                                        field.field_type === "text" ||
                                        !field.field_type
                                      ) {
                                        templateFieldInput = (
                                          <Form.Control
                                            type="text"
                                            value={fieldValue}
                                            onChange={(e) =>
                                              setTemplateFieldsData({
                                                ...templateFieldsData,
                                                [field.field_name]:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder={`Enter ${field.field_name}`}
                                            required={field.is_required}
                                          />
                                        );
                                      } else {
                                        const extraInputType =
                                          getDealTemplateFieldInputType(
                                            field.field_type,
                                          );
                                        templateFieldInput = (
                                          <Form.Control
                                            type={extraInputType}
                                            value={fieldValue}
                                            onChange={(e) =>
                                              setTemplateFieldsData({
                                                ...templateFieldsData,
                                                [field.field_name]:
                                                  e.target.value,
                                              })
                                            }
                                            placeholder={`Enter ${field.field_name}`}
                                            required={field.is_required}
                                          />
                                        );
                                      }

                                      return (
                                        <Col md={6} key={field.field_name}>
                                          <Form.Group className="mb-3">
                                            <Form.Label>
                                              {field.field_name}
                                              {field.is_required && (
                                                <span className="text-danger">
                                                  {" "}
                                                  *
                                                </span>
                                              )}
                                            </Form.Label>
                                            {templateFieldInput}
                                          </Form.Group>
                                        </Col>
                                      );
                                    },
                                  );
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
                      <div>
                        {/* Negotiation Progress */}
                        <Card className="mb-3 border-0 bg-light">
                          <Card.Body>
                            <h5 className="fw-bold mb-4 text-warning">
                              NEGOTIATION PROGRESS
                            </h5>
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
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        quotation_sent: e.target.checked,
                                      })
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Contract Sent</Form.Label>
                                  <Form.Check
                                    type="checkbox"
                                    checked={formData.contract_sent}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        contract_sent: e.target.checked,
                                      })
                                    }
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Contract Received</Form.Label>
                                  <Form.Check
                                    type="checkbox"
                                    checked={formData.contract_received}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        contract_received: e.target.checked,
                                      })
                                    }
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
                              <h5 className="fw-bold mb-4 text-primary">
                                REVISION HISTORY
                              </h5>
                              <div className="border rounded p-3 bg-white">
                                <div className="list-group">
                                  {histories.slice(0, 5).map((history: any) => (
                                    <div
                                      key={history.id}
                                      className="list-group-item"
                                    >
                                      <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                          <h6 className="mb-1">
                                            {history.event === "created"
                                              ? "Created"
                                              : "Updated"}
                                          </h6>
                                          <p className="mb-1 small">
                                            {history.description}
                                          </p>
                                          <small className="text-muted">
                                            {new Date(
                                              history.created_at,
                                            ).toLocaleString()}
                                          </small>
                                        </div>
                                        {history.changes &&
                                          Object.keys(history.changes).length >
                                            0 && (
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
                          <h5 className="fw-bold mb-4 text-success">
                            ESTIMATION CHART
                          </h5>

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
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      tax_percentage: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label>Standard Discount (%)</Form.Label>
                                <Form.Select
                                  value={
                                    formData.standard_discount_percentage &&
                                    Number.parseFloat(
                                      formData.standard_discount_percentage,
                                    )
                                  }
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      standard_discount_percentage:
                                        e.target.value,
                                    })
                                  }
                                >
                                  <option value="0">0%</option>
                                  <option value="5">5%</option>
                                  <option value="10">10%</option>
                                  <option value="15">15%</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            {extensions?.length > 1 && (
                              <Col md={4}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Special Discount (%)</Form.Label>
                                  <Form.Select
                                    value={
                                      formData.special_discount_percentage &&
                                      Number.parseFloat(
                                        formData.special_discount_percentage,
                                      )
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        special_discount_percentage:
                                          e.target.value,
                                      })
                                    }
                                  >
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="10">10%</option>
                                    <option value="15">15%</option>
                                  </Form.Select>
                                </Form.Group>
                              </Col>
                            )}
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
                                setShowAllIndustries(false);
                                setShowAddItemModal(true);
                              }}
                            >
                              <Plus size={14} className="me-1" />
                              Add Item
                            </Button>
                          </div>

                          {/* Estimation Items Table */}
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
                    `,
                              }}
                            />
                            <div className="order-items-table-wrapper">
                              <div
                                className="table-responsive"
                                style={{ width: "100%" }}
                              >
                                <Table hover style={{ marginBottom: 0 }}>
                                  <thead>
                                    <tr>
                                      <th>#</th>
                                      <th style={{ minWidth: "200px" }}>
                                        Product Name
                                      </th>
                                      <th style={{ minWidth: "120px" }}>SKU</th>
                                      <th
                                        style={{
                                          minWidth: "80px",
                                          textAlign: "center",
                                        }}
                                      >
                                        Qty
                                      </th>
                                      {estimationItems.some(
                                        (item) => item.description,
                                      ) && (
                                        <th style={{ minWidth: "180px" }}>
                                          Description
                                        </th>
                                      )}
                                      <th
                                        style={{
                                          minWidth: "140px",
                                          textAlign: "right",
                                        }}
                                      >
                                        Unit Price
                                      </th>
                                      <th
                                        style={{
                                          minWidth: "150px",
                                          textAlign: "right",
                                        }}
                                      >
                                        Total Price
                                      </th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {estimationItems.map((item, index) => {
                                      const subtotal =
                                        item.qty * item.unit_price;
                                      const product = products.find(
                                        (p) => p.id === item.product_id,
                                      );
                                      const showConversionInfo =
                                        product &&
                                        product.currency.toUpperCase() !==
                                          formData.currency.toUpperCase() &&
                                        item.original_currency &&
                                        item.original_price !== item.unit_price;

                                      return (
                                        <tr
                                          key={`${item.product_id}-${item.product_service}-${item.unit_price}-${item.qty}`}
                                        >
                                          <td>{index + 1}</td>
                                          <td
                                            className="fw-semibold"
                                            style={{ color: "#212529" }}
                                          >
                                            {item.product_service || "N/A"}
                                          </td>
                                          <td
                                            style={{
                                              color: "#6c757d",
                                              fontSize: "0.813rem",
                                            }}
                                          >
                                            {product?.sku || "N/A"}
                                          </td>
                                          <td
                                            style={{
                                              textAlign: "center",
                                              fontWeight: 500,
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {item.qty || "0"}
                                          </td>
                                          {estimationItems.some(
                                            (i) => i.description,
                                          ) && (
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
                                          <td
                                            style={{
                                              textAlign: "right",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            <div style={{ fontWeight: 500 }}>
                                              {formData.currency || "AED"}{" "}
                                              {Number.parseFloat(
                                                String(item.unit_price || "0"),
                                              ).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </div>
                                            {showConversionInfo && (
                                              <div
                                                className="small text-muted"
                                                style={{
                                                  fontSize: "0.75rem",
                                                  marginTop: "2px",
                                                }}
                                              >
                                                Original:{" "}
                                                {formatCurrency(
                                                  item.original_price,
                                                  item.original_currency,
                                                )}
                                              </div>
                                            )}
                                          </td>
                                          <td
                                            style={{
                                              textAlign: "right",
                                              fontWeight: 600,
                                              color: "#212529",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {formData.currency || "AED"}{" "}
                                            {subtotal.toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )}
                                          </td>
                                          <td>
                                            <div className="d-flex gap-1 justify-content-center">
                                              <Button
                                                variant="link"
                                                size="sm"
                                                className="p-1"
                                                title="Edit Item"
                                                style={{
                                                  minWidth: "auto",
                                                  padding: "4px",
                                                }}
                                                onClick={() => {
                                                  setEditingItemIndex(index);
                                                  setItemFormData({
                                                    product_id: item.product_id,
                                                    product_service:
                                                      item.product_service,
                                                    description:
                                                      item.description,
                                                    qty: item.qty,
                                                    unit_price: item.unit_price,
                                                  });
                                                  setShowAllIndustries(false);
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
                                                style={{
                                                  minWidth: "auto",
                                                  padding: "4px",
                                                }}
                                                onClick={() => {
                                                  setEstimationItems(
                                                    estimationItems.filter(
                                                      (_, i) => i !== index,
                                                    ),
                                                  );
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
                                        <td
                                          colSpan={
                                            estimationItems.some(
                                              (item) => item.description,
                                            )
                                              ? 8
                                              : 7
                                          }
                                          className="text-center text-muted py-5"
                                        >
                                          <Package
                                            size={40}
                                            className="text-muted mb-3"
                                            style={{
                                              opacity: 0.5,
                                              display: "block",
                                              margin: "0 auto 12px",
                                            }}
                                          />
                                          <div
                                            style={{
                                              fontSize: "0.938rem",
                                              fontWeight: 500,
                                              marginBottom: "4px",
                                            }}
                                          >
                                            No items in estimation chart
                                          </div>
                                          <small
                                            style={{ fontSize: "0.813rem" }}
                                          >
                                            Click "Add Item" to add products or
                                            services
                                          </small>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                  {estimationItems.length > 0 &&
                                    (() => {
                                      const grandTotal = estimationItems.reduce(
                                        (sum, item) =>
                                          sum + item.qty * item.unit_price,
                                        0,
                                      );

                                      const totalDiscountPercentage =
                                        Number.parseFloat(
                                          formData.standard_discount_percentage ||
                                            "0",
                                        ) +
                                        Number.parseFloat(
                                          formData.special_discount_percentage ||
                                            "0",
                                        );

                                      const totalDiscount =
                                        (grandTotal * totalDiscountPercentage) /
                                        100;
                                      const subtotalAfterDiscount =
                                        grandTotal - totalDiscount;
                                      const taxAmount =
                                        (subtotalAfterDiscount *
                                          Number.parseFloat(
                                            formData.tax_percentage || "0",
                                          )) /
                                        100;
                                      const netValue =
                                        subtotalAfterDiscount + taxAmount;
                                      return (
                                        <tfoot>
                                          <tr>
                                            <td
                                              colSpan={
                                                estimationItems.some(
                                                  (item) => item.description,
                                                )
                                                  ? 7
                                                  : 6
                                              }
                                              style={{
                                                textAlign: "right",
                                                paddingRight: "20px",
                                              }}
                                            >
                                              <strong>Subtotal:</strong>
                                            </td>
                                            <td
                                              style={{
                                                textAlign: "right",
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {formData.currency || "AED"}{" "}
                                              {grandTotal.toLocaleString(
                                                undefined,
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                },
                                              )}
                                            </td>
                                          </tr>
                                          {totalDiscount > 0 && (
                                            <tr>
                                              <td
                                                colSpan={
                                                  estimationItems.some(
                                                    (item) => item.description,
                                                  )
                                                    ? 7
                                                    : 6
                                                }
                                                style={{
                                                  textAlign: "right",
                                                  paddingRight: "20px",
                                                }}
                                              >
                                                <span
                                                  style={{ color: "#6c757d" }}
                                                >
                                                  Discount (
                                                  {Number.parseFloat(
                                                    formData.standard_discount_percentage ||
                                                      "0",
                                                  ) +
                                                    Number.parseFloat(
                                                      formData.special_discount_percentage ||
                                                        "0",
                                                    )}
                                                  %):
                                                </span>
                                              </td>
                                              <td
                                                style={{
                                                  textAlign: "right",
                                                  color: "#dc3545",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                - {formData.currency || "AED"}{" "}
                                                {totalDiscount.toLocaleString(
                                                  undefined,
                                                  {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  },
                                                )}
                                              </td>
                                            </tr>
                                          )}
                                          {Number.parseFloat(
                                            formData.tax_percentage || "0",
                                          ) > 0 && (
                                            <tr>
                                              <td
                                                colSpan={
                                                  estimationItems.some(
                                                    (item) => item.description,
                                                  )
                                                    ? 7
                                                    : 6
                                                }
                                                style={{
                                                  textAlign: "right",
                                                  paddingRight: "20px",
                                                }}
                                              >
                                                <strong>
                                                  Tax ({formData.tax_percentage}
                                                  %):
                                                </strong>
                                              </td>
                                              <td
                                                style={{
                                                  textAlign: "right",
                                                  fontWeight: 600,
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {formData.currency || "AED"}{" "}
                                                {taxAmount.toLocaleString(
                                                  undefined,
                                                  {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  },
                                                )}
                                              </td>
                                            </tr>
                                          )}
                                          <tr
                                            style={{
                                              fontSize: "1rem",
                                              borderTop: "2px solid #dee2e6",
                                            }}
                                          >
                                            <td
                                              colSpan={
                                                estimationItems.some(
                                                  (item) => item.description,
                                                )
                                                  ? 7
                                                  : 6
                                              }
                                              style={{
                                                textAlign: "right",
                                                paddingRight: "20px",
                                                paddingTop: "16px",
                                                paddingBottom: "16px",
                                                paddingLeft: "20px",
                                              }}
                                            >
                                              <strong
                                                style={{ fontSize: "1rem" }}
                                              >
                                                Total:
                                              </strong>
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
                                              {formData.currency || "AED"}{" "}
                                              {netValue.toLocaleString(
                                                undefined,
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                },
                                              )}
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
                    <Modal
                      show={showAddItemModal}
                      onHide={() => {
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
                      }}
                      size="lg"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>
                          {editingItemIndex === null
                            ? "Add New Item"
                            : "Edit Item"}
                        </Modal.Title>
                      </Modal.Header>
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const selectedProduct = products.find(
                            (p) => p.id === itemFormData.product_id,
                          );
                          const newItem = {
                            product_id: itemFormData.product_id!,
                            product_service: itemFormData.product_service,
                            description: itemFormData.description,
                            qty: itemFormData.qty,
                            unit_price: itemFormData.unit_price,
                            original_currency:
                              selectedProduct?.currency || formData.currency,
                            original_price:
                              Number.parseFloat(
                                selectedProduct?.price || "0",
                              ) || itemFormData.unit_price,
                          };

                          if (editingItemIndex === null) {
                            setEstimationItems([...estimationItems, newItem]);
                          } else {
                            const updated = [...estimationItems];
                            updated[editingItemIndex] = newItem;
                            setEstimationItems(updated);
                          }

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
                        }}
                        noValidate
                      >
                        <Modal.Body>
                          <Row className="g-3">
                            {/* Industry Selection */}
                            <Col md={12}>
                              <Form.Group>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <Form.Label>
                                    Product Group{" "}
                                    <span className="text-danger">*</span>
                                  </Form.Label>
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
                                <Select
                                  value={
                                    selectedIndustryId
                                      ? {
                                          value: selectedIndustryId,
                                          label:
                                            addItemAvailableIndustries.find(
                                              (ind) =>
                                                ind.id === selectedIndustryId,
                                            )?.name || "",
                                        }
                                      : null
                                  }
                                  onChange={handleIndustryChange}
                                  options={addItemAvailableIndustries.map(
                                    (industry) => ({
                                      value: industry.id,
                                      label: industry.name,
                                    }),
                                  )}
                                  placeholder="Select product group..."
                                  isSearchable
                                  isLoading={
                                    loadingIndustries || loadingAllIndustries
                                  }
                                  isDisabled={
                                    loadingIndustries || loadingAllIndustries
                                  }
                                  required
                                />
                                {addItemAvailableIndustries.length === 1 &&
                                  !showAllIndustries && (
                                    <Form.Text className="text-muted">
                                      Only one product group available
                                    </Form.Text>
                                  )}
                              </Form.Group>
                            </Col>

                            <Col md={12}>
                              <Form.Group>
                                <Form.Label>
                                  Product <span className="text-danger">*</span>
                                </Form.Label>
                                <Select
                                  value={
                                    itemFormData.product_id
                                      ? {
                                          value: itemFormData.product_id,
                                          label:
                                            itemFormData.product_service ||
                                            products.find(
                                              (p) =>
                                                p.id ===
                                                itemFormData.product_id,
                                            )?.name ||
                                            "",
                                        }
                                      : null
                                  }
                                  onChange={async (selectedOption: any) => {
                                    const product = products.find(
                                      (p) => p.id === selectedOption?.value,
                                    );
                                    if (product) {
                                      const originalPrice =
                                        Number.parseFloat(product.price) || 0;
                                      const productCurrency =
                                        product.currency.toUpperCase();
                                      const dealCurrency =
                                        formData.currency.toUpperCase();

                                      // Convert price if currencies differ
                                      let convertedPrice = originalPrice;
                                      if (productCurrency !== dealCurrency) {
                                        try {
                                          setConvertingPrice(true);
                                          convertedPrice =
                                            await convertCurrency(
                                              originalPrice,
                                              productCurrency,
                                              dealCurrency,
                                            );
                                        } catch (error) {
                                          console.error(
                                            "Failed to convert currency:",
                                            error,
                                          );
                                          toast.error(
                                            `Failed to convert ${productCurrency} to ${dealCurrency}`,
                                          );
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
                                  options={products.map((product) => {
                                    const productCurrency =
                                      product.currency.toUpperCase();
                                    const dealCurrency =
                                      formData.currency.toUpperCase();
                                    const originalPrice =
                                      Number.parseFloat(product.price) || 0;

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
                                  placeholder={
                                    selectedIndustryId
                                      ? "Select a product"
                                      : "Please select a product group first"
                                  }
                                  isSearchable
                                  isLoading={loadingProducts}
                                  isDisabled={
                                    editingItemIndex !== null ||
                                    !selectedIndustryId ||
                                    loadingProducts
                                  }
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
                                  onChange={(e) =>
                                    setItemFormData({
                                      ...itemFormData,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>
                                  Quantity{" "}
                                  <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  placeholder="Enter quantity"
                                  value={itemFormData.qty}
                                  onChange={(e) =>
                                    setItemFormData({
                                      ...itemFormData,
                                      qty:
                                        Number.parseInt(e.target.value, 10) ||
                                        1,
                                    })
                                  }
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>
                                  Unit Price{" "}
                                  <span className="text-danger">*</span>
                                  {convertingPrice && (
                                    <span className="ms-2 text-muted small">
                                      <span
                                        className="spinner-border spinner-border-sm me-1"
                                        aria-hidden="true"
                                      />
                                      {" "}
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
                                  onChange={(e) =>
                                    setItemFormData({
                                      ...itemFormData,
                                      unit_price:
                                        Number.parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  required
                                  disabled={convertingPrice}
                                />
                                {itemFormData.product_id &&
                                  (() => {
                                    const selectedProduct = products.find(
                                      (p) => p.id === itemFormData.product_id,
                                    );
                                    if (selectedProduct) {
                                      const productCurrency =
                                        selectedProduct.currency.toUpperCase();
                                      const dealCurrency =
                                        formData.currency.toUpperCase();
                                      const originalPrice =
                                        Number.parseFloat(
                                          selectedProduct.price,
                                        ) || 0;

                                      if (
                                        productCurrency !== dealCurrency &&
                                        itemFormData.unit_price !==
                                          originalPrice
                                      ) {
                                        return (
                                          <Form.Text className="text-muted d-block">
                                            Converted from{" "}
                                            {formatCurrency(
                                              originalPrice,
                                              productCurrency,
                                            )}
                                            {" → "}
                                            {formatCurrency(
                                              itemFormData.unit_price,
                                              dealCurrency,
                                            )}
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
                                    <span className="text-muted">
                                      Sub Total:
                                    </span>
                                    <h5 className="mb-0 text-success">
                                      {formatCurrency(
                                        itemFormData.qty *
                                          itemFormData.unit_price,
                                        formData.currency,
                                      )}
                                    </h5>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button
                            variant="outline-secondary"
                            onClick={() => {
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
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            type="button"
                            disabled={
                              !itemFormData.product_id ||
                              itemFormData.qty < 1 ||
                              itemFormData.unit_price <= 0
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const selectedProduct = products.find(
                                (p) => p.id === itemFormData.product_id,
                              );
                              const newItem = {
                                product_id: itemFormData.product_id!,
                                product_service: itemFormData.product_service,
                                description: itemFormData.description,
                                qty: itemFormData.qty,
                                unit_price: itemFormData.unit_price,
                                original_currency:
                                  selectedProduct?.currency ||
                                  formData.currency,
                                original_price:
                                  Number.parseFloat(
                                    selectedProduct?.price || "0",
                                  ) || itemFormData.unit_price,
                              };

                              if (editingItemIndex === null) {
                                setEstimationItems([
                                  ...estimationItems,
                                  newItem,
                                ]);
                              } else {
                                const updated = [...estimationItems];
                                updated[editingItemIndex] = newItem;
                                setEstimationItems(updated);
                              }

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
                            }}
                          >
                            {editingItemIndex === null
                              ? "Add Item"
                              : "Update Item"}
                          </Button>
                        </Modal.Footer>
                      </Form>
                    </Modal>

                    {/* Revision History Modal */}
                    <Modal
                      show={showRevisionHistoryModal}
                      onHide={() => setShowRevisionHistoryModal(false)}
                      size="lg"
                      centered
                    >
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
                                  {estimates.map(
                                    (estimate: any, index: number) => {
                                      const grandTotal = Number.parseFloat(
                                        estimate.grand_total || "0",
                                      );
                                      const netValue = Number.parseFloat(
                                        estimate.net_value || "0",
                                      );
                                      const itemCount =
                                        estimate.estimation_chart?.length || 0;

                                      return (
                                        <tr key={estimate.id || index}>
                                          <td>
                                            <Badge bg="secondary">
                                              {estimate.version ||
                                                `v${estimates.length - index}.0`}
                                            </Badge>
                                          </td>
                                          <td>
                                            <div className="d-flex align-items-center">
                                              <Calendar
                                                size={14}
                                                className="me-2 text-muted"
                                              />
                                              {new Date(
                                                estimate.created_at,
                                              ).toLocaleString()}
                                            </div>
                                          </td>
                                          <td className="fw-bold text-success">
                                            {grandTotal.toLocaleString()}{" "}
                                            {estimate.currency ||
                                              formData.currency}
                                          </td>
                                          <td>
                                            {netValue.toLocaleString()}{" "}
                                            {estimate.currency ||
                                              formData.currency}
                                          </td>
                                          <td>
                                            <Badge bg="secondary">
                                              {itemCount} items
                                            </Badge>
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
                                                  if (
                                                    estimate.estimation_chart &&
                                                    estimate.estimation_chart
                                                      .length > 0
                                                  ) {
                                                    setEstimationItems(
                                                      estimate.estimation_chart.map(
                                                        (item: any) => ({
                                                          product_id:
                                                            item.product_id ||
                                                            0,
                                                          product_service:
                                                            item.product_service ||
                                                            "",
                                                          description:
                                                            item.description ||
                                                            "",
                                                          qty: item.qty || 1,
                                                          unit_price:
                                                            item.unit_price ||
                                                            0,
                                                          original_currency:
                                                            item.original_currency ||
                                                            estimate.currency ||
                                                            formData.currency,
                                                          original_price:
                                                            item.original_price ||
                                                            item.unit_price ||
                                                            0,
                                                        }),
                                                      ),
                                                    );

                                                    // Also restore tax and discount percentages if available
                                                    if (
                                                      estimate.tax_percentage
                                                    ) {
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        tax_percentage:
                                                          estimate.tax_percentage.toString(),
                                                      }));
                                                    }
                                                    if (
                                                      estimate.standard_discount_percentage
                                                    ) {
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        standard_discount_percentage:
                                                          estimate.standard_discount_percentage.toString(),
                                                      }));
                                                    }
                                                    if (
                                                      estimate.special_discount_percentage
                                                    ) {
                                                      setFormData((prev) => ({
                                                        ...prev,
                                                        special_discount_percentage:
                                                          estimate.special_discount_percentage.toString(),
                                                      }));
                                                    }

                                                    setShowRevisionHistoryModal(
                                                      false,
                                                    );
                                                    const loadedVersionLabel =
                                                      formatRevisionVersionLabel(
                                                        estimate.version,
                                                        estimates.length,
                                                        index,
                                                      );
                                                    toast.success(
                                                      `${loadedVersionLabel} has been loaded successfully!`,
                                                    );
                                                  } else {
                                                    toast.error(
                                                      "This revision has no items to load",
                                                    );
                                                  }
                                                }}
                                              >
                                                <RefreshCw size={14} />
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    },
                                  )}
                                </tbody>
                              </Table>
                            </div>

                            <Card className="border-0 bg-light mt-3">
                              <Card.Body>
                                <Row>
                                  <Col md={6}>
                                    <small className="text-muted">
                                      Total Revisions
                                    </small>
                                    <div className="fw-bold">
                                      {estimates.length}
                                    </div>
                                  </Col>
                                  <Col md={6}>
                                    <small className="text-muted">
                                      Latest Update
                                    </small>
                                    <div className="fw-bold">
                                      {estimates.length > 0
                                        ? new Date(
                                            estimates[0].created_at,
                                          ).toLocaleString()
                                        : "N/A"}
                                    </div>
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>
                          </>
                        ) : (
                          <div className="text-center text-muted p-5">
                            <History size={48} className="mb-3 text-muted" />
                            <p className="mb-0">
                              No revision history available
                            </p>
                            <small>
                              Revisions will appear here when estimates are
                              created
                            </small>
                          </div>
                        )}
                      </Modal.Body>
                      <Modal.Footer>
                        <Button
                          variant="secondary"
                          onClick={() => setShowRevisionHistoryModal(false)}
                        >
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
                      {formStep > 0 ? (
                        <>
                          <ChevronLeft size={16} className="me-1" /> Previous
                        </>
                      ) : (
                        "Cancel"
                      )}
                    </Button>
                    <div className="d-flex gap-2">
                      {formStep < 4 ? (
                        <Button variant="primary" onClick={handleNextStep}>
                          Next <ChevronRight size={16} className="ms-1" />
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={loading}
                        >
                          {loading ? "Updating..." : "Update Deal"}
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
