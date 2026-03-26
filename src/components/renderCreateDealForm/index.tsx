import React, { useState, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Dropdown, Form, Button, Card, Modal, Table } from "react-bootstrap";
import {
  getDeal,
  updateDeal,
  createDeal,
  getStages,
  getBusinessTypes,
  getIndustries,
  getCrmProducts,
  createEstimate,
} from "@utils/crm";
import type { CrmProduct } from "@utils/crm";
import { GetHierarchyData } from "@utils/users";
import { ModuleSlug, GlobalDateTimeFormat } from "@utils/Helper";
import { toast } from "react-toastify";
import moment from "moment";
import PhoneInput, {
  parsePhoneNumber as parsePhoneNumberLib,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Select from "react-select";

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface LineItem {
  id: number;
  name: string;
  quantity: number;
  tax: number;
  discount: number;
  /** For createEstimate payload when saving revision from this section */
  product_id?: number;
  unit_price?: number;
  standard_discount_percentage?: number;
  special_discount_percentage?: number;
}

interface DealFormData {
  // Deal Information (matching Edit modal)
  name: string;
  stage_id: number | undefined;
  expected_close_date: string;
  assigned_to: string | null;
  currency: string;
  follow_up_date: string;
  // Company Information
  company_name: string;
  business_type_id: number | null;
  business_type_other: string;
  decision_maker_title: string;
  decision_maker_name: string;
  decision_maker_phone_country_code: string;
  decision_maker_phone: string;
  decision_maker_email: string;
  industry_ids: number[];
  // Deal Characteristics (template fields)
  deal_type: string;
  contract_length: string;
  contract_length_custom: string;
  billing_model: string;
  payment_terms: string;
  payment_terms_custom: string;
  risk_level: string;
  competitors: string;
  // Progress & Notes
  quotation_sent: boolean;
  contract_sent: boolean;
  contract_received: boolean;
  // Legacy fields (keeping for backward compatibility)
  dealName: string;
  pipeline: string;
  dealStage: string;
  amount: string;
  closeDate: string;
  dealOwner: string;
  priority: string;
  closedLostReason: string;
  closedWonReason: string;
  createDate: string;
  dealCollaborator: string;
  dealDescription: string;
  dealProbability: string;
  forecastCategory: string;
  forecastProbability: string;
  nextStep: string;
  sharedTeams: string;
  sharedUsers: string;
  contactAssociateRecord: string;
  contactAssociationLabel: string;
  addTimelineContact: boolean;
  companyAssociateRecord: string;
  companyAssociationLabel: string;
  addTimelineCompany: boolean;
  lineItems: LineItem[];
  /** Used when saving revision from combined line items section */
  tax_percentage?: string;
  standard_discount_percentage?: string;
  special_discount_percentage?: string;
}

interface SimpleDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
}

interface CreateDealSidebarProps {
  onClose: () => void;
  dealId?: number | null;
  onSuccess?: () => void;
}

interface EstimateChartItem {
  id?: number;
  product_id?: number;
  product_service?: string;
  qty?: number;
  unit_price?: number | string;
  tax_percentage?: number | string;
  standard_discount_percentage?: number | string;
  special_discount_percentage?: number | string;
}

interface RevisionProductRow {
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
}

// ─── Initial State ────────────────────────────────────────────────────────────
const initialDealForm: DealFormData = {
  // Deal Information
  name: "",
  stage_id: undefined,
  expected_close_date: "",
  assigned_to: null,
  currency: "AED",
  follow_up_date: "",
  // Company Information
  company_name: "",
  business_type_id: null,
  business_type_other: "",
  decision_maker_title: "",
  decision_maker_name: "",
  decision_maker_phone_country_code: "",
  decision_maker_phone: "",
  decision_maker_email: "",
  industry_ids: [],
  // Deal Characteristics
  deal_type: "",
  contract_length: "",
  contract_length_custom: "",
  billing_model: "",
  payment_terms: "",
  payment_terms_custom: "",
  risk_level: "",
  competitors: "",
  // Progress & Notes
  quotation_sent: false,
  contract_sent: false,
  contract_received: false,
  // Legacy fields
  dealName: "",
  pipeline: "Deals pipeline",
  dealStage: "",
  amount: "",
  closeDate: "",
  dealOwner: "",
  priority: "",
  closedLostReason: "",
  closedWonReason: "",
  createDate: "",
  dealCollaborator: "No owner",
  dealDescription: "",
  dealProbability: "",
  forecastCategory: "",
  forecastProbability: "",
  nextStep: "",
  sharedTeams: "",
  sharedUsers: "No user",
  contactAssociateRecord: "",
  contactAssociationLabel: "No label",
  addTimelineContact: false,
  companyAssociateRecord: "",
  companyAssociationLabel: "Primary",
  addTimelineCompany: false,
  lineItems: [],
  tax_percentage: "0",
  standard_discount_percentage: "0",
  special_discount_percentage: "0",
};

// ─── Dropdown options ─────────────────────────────────────────────────────────
const PIPELINE_OPTIONS = [
  "Deals pipeline",
  "Sales Pipeline",
  "Partner Pipeline",
];
const DEAL_STAGE_OPTIONS = [
  "Appointment Scheduled",
  "Qualified To Buy",
  "Presentation Scheduled",
  "Decision Maker Bought-In",
  "Contract Sent",
  "Closed Won",
  "Closed Lost",
];
const CURRENCY_OPTIONS = [
  "US Dollar (USD) $",
  "Euro (EUR) €",
  "British Pound (GBP) £",
  "Pakistani Rupee (PKR) ₨",
  "Japanese Yen (JPY) ¥",
];
const DEAL_OWNER_OPTIONS = ["Rizwan Haider", "John Doe", "Jane Smith"];
const DEAL_TYPE_OPTIONS = ["New Business", "Existing Business"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const COLLABORATOR_OPTIONS = [
  "No owner",
  "Rizwan Haider",
  "John Doe",
  "Jane Smith",
];
const FORECAST_CATEGORY_OPTIONS = ["Pipeline", "Best Case", "Commit", "Closed"];
const SHARED_TEAMS_OPTIONS = ["Team A", "Team B", "Team C"];
const SHARED_USERS_OPTIONS = [
  "No user",
  "Rizwan Haider",
  "John Doe",
  "Jane Smith",
];
const ASSOCIATION_LABEL_OPTIONS = [
  "No label",
  "Decision Maker",
  "Primary",
  "Billing",
];
// ─── Sub-components ───────────────────────────────────────────────────────────

const FIELD_LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  color: "#141414",
  marginBottom: "8px",
};

const REQUIRED_MARK_STYLE: React.CSSProperties = {
  color: "#f2545b",
  marginLeft: "2px",
};

const fieldLabel = (text: string, required: boolean = false) => (
  <label
    style={FIELD_LABEL_STYLE}
  >
    {text}
    {required && <span style={REQUIRED_MARK_STYLE}>*</span>}
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

const hoverBackgroundHandlers = (
  enabled: boolean,
  hoverColor: string,
  defaultColor: string,
) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enabled) e.currentTarget.style.backgroundColor = hoverColor;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enabled) e.currentTarget.style.backgroundColor = defaultColor;
  },
});

// Simple reusable single-select dropdown
const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder,
  testId,
}) => (
  <Dropdown>
    <Dropdown.Toggle
      data-test-id={testId}
      variant="outline-secondary"
      style={dropdownToggleStyle(!!value)}
    >
      {value || placeholder || "Select..."}
    </Dropdown.Toggle>
    <Dropdown.Menu style={{ width: "100%" }}>
      {options.map((opt) => (
        <Dropdown.Item key={opt} onClick={() => onChange(opt)}>
          {opt}
        </Dropdown.Item>
      ))}
    </Dropdown.Menu>
  </Dropdown>
);

const parsePercent = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const mapEstimateChartToLineItems = (
  chart: EstimateChartItem[],
  fallbackTaxPct: number,
  fallbackStdDiscPct: number,
  fallbackSpecDiscPct: number,
  getId: (idx: number, item: EstimateChartItem) => number,
): LineItem[] => {
  const fallbackDiscount = fallbackStdDiscPct + fallbackSpecDiscPct;
  return chart.map((item, idx) => ({
    id: getId(idx, item),
    name: item.product_service || "",
    quantity: item.qty ?? 1,
    tax: parsePercent(item.tax_percentage ?? fallbackTaxPct),
    discount:
      item.standard_discount_percentage != null ||
      item.special_discount_percentage != null
        ? parsePercent(item.standard_discount_percentage) +
          parsePercent(item.special_discount_percentage)
        : fallbackDiscount,
    product_id: item.product_id,
    unit_price:
      item.unit_price == null
        ? undefined
        : Number.parseFloat(String(item.unit_price)),
    standard_discount_percentage:
      item.standard_discount_percentage != null
        ? parsePercent(item.standard_discount_percentage)
        : undefined,
    special_discount_percentage:
      item.special_discount_percentage != null
        ? parsePercent(item.special_discount_percentage)
        : undefined,
  }));
};

const getRevisionProductLineTotal = (
  item: Pick<
    RevisionProductRow,
    | "qty"
    | "unit_price"
    | "tax_percentage"
    | "standard_discount_percentage"
    | "special_discount_percentage"
  >,
) => {
  const subtotal = (item.qty || 0) * (item.unit_price || 0);
  const stdPct = parsePercent(item.standard_discount_percentage);
  const specPct = parsePercent(item.special_discount_percentage);
  const taxPct = parsePercent(item.tax_percentage);
  const discount = (subtotal * (stdPct + specPct)) / 100;
  const afterDiscount = subtotal - discount;
  const tax = (afterDiscount * taxPct) / 100;
  return {
    subtotal,
    discount,
    tax,
    lineTotal: afterDiscount + tax,
  };
};

const getRevisionProductsTotals = (items: RevisionProductRow[]) =>
  items.reduce(
    (acc, item) => {
      const { subtotal, discount, tax } = getRevisionProductLineTotal(item);
      return {
        subtotalAll: acc.subtotalAll + subtotal,
        totalDiscount: acc.totalDiscount + discount,
        totalTax: acc.totalTax + tax,
      };
    },
    { subtotalAll: 0, totalDiscount: 0, totalTax: 0 },
  );

const getProgressFlags = (deal: Record<string, unknown>) => ({
  quotation_sent: Boolean(deal.quotation_sent),
  contract_sent: Boolean(deal.contract_sent),
  contract_received: Boolean(deal.contract_received),
});

const OVERLAY_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
  background: "transparent",
};

const SIDEBAR_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  width: "600px",
  height: "100vh",
  backgroundColor: "#ffffff",
  boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
  zIndex: 1001,
  display: "flex",
  flexDirection: "column",
};

const SIDEBAR_HEADER_STYLE: React.CSSProperties = {
  padding: "20px 24px",
  borderBottom: "1px solid #eaf0f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const SIDEBAR_TITLE_STYLE: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#141414",
  margin: 0,
};

const SIDEBAR_CLOSE_BUTTON_STYLE: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "4px",
  cursor: "pointer",
  color: "#718096",
  display: "flex",
  alignItems: "center",
};

// ─── Main renderCreateDeal ────────────────────────────────────────────────────

const renderCreateDeal = (
  showCreateDealSidebar: boolean,
  setShowCreateDealSidebar: (show: boolean) => void,
) => {
  if (!showCreateDealSidebar) return null;
  return <CreateDealSidebar onClose={() => setShowCreateDealSidebar(false)} />;
};

export default renderCreateDeal;

// ─── Sidebar component (self-contained for easy integration) ──────────────────

export const CreateDealSidebar: React.FC<CreateDealSidebarProps> = ({
  onClose,
  dealId,
  onSuccess,
}) => {
  const isEditMode = !!dealId;
  const [dealForm, setDealForm] = useState(initialDealForm);
  const [lineItemInput, setLineItemInput] = useState<string>("");
  const [lineItemProductId, setLineItemProductId] = useState<
    number | undefined
  >(undefined);
  const [lineItemUnitPrice, setLineItemUnitPrice] = useState<number>(0);
  const [lineItemQty, setLineItemQty] = useState<number>(0);
  const [lineItemTax, setLineItemTax] = useState<number>(0);
  const [lineItemDiscount, setLineItemDiscount] = useState<number>(0);
  const [lineItemProducts, setLineItemProducts] = useState<CrmProduct[]>([]);
  const [loadingLineItemProducts, setLoadingLineItemProducts] = useState(false);
  const [savingRevision, setSavingRevision] = useState(false);
  const [isContactsExpanded, setIsContactsExpanded] = useState(true);
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [stages, setStages] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [allIndustries, setAllIndustries] = useState<any[]>([]);
  const [showOtherBusinessType, setShowOtherBusinessType] = useState(false);

  // Revisions (edit mode only)
  const [editEstimates, setEditEstimates] = useState<any[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(
    null,
  );
  const [showAddRevisionModal, setShowAddRevisionModal] = useState(false);
  const [editEditingRevisionIndex, setEditEditingRevisionIndex] = useState<
    number | null
  >(null);
  const [editRevisionProducts, setEditRevisionProducts] = useState<
    RevisionProductRow[]
  >([]);
  const [editRevisionFormData, setEditRevisionFormData] = useState({
    tax_percentage: "0",
    standard_discount_percentage: "0",
    special_discount_percentage: "0",
  });
  const [editRevisionProductsCatalog, setEditRevisionProductsCatalog] =
    useState<CrmProduct[]>([]);
  const [editRevisionLoadingProducts, setEditRevisionLoadingProducts] =
    useState(false);
  const [editRevisionSelectedProductIds, setEditRevisionSelectedProductIds] =
    useState<Array<{ value: number; label: string }>>([]);

  const set = (key: keyof DealFormData) => (val: any) =>
    setDealForm((prev) => ({ ...prev, [key]: val }));
  const setE =
    (key: keyof DealFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setDealForm((prev) => ({ ...prev, [key]: e.target.value }));

  // Fetch stages, extensions, business types, and industries
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          stagesData,
          hierarchyData,
          businessTypesResponse,
          industriesResponse,
        ] = await Promise.all([
          getStages("deal"),
          GetHierarchyData(ModuleSlug.CRM_DEALS),
          getBusinessTypes({ per_page: 1000 }),
          getIndustries({ per_page: 1000 }),
        ]);
        setStages(stagesData || []);
        if (hierarchyData?.extensions) {
          setExtensions(hierarchyData.extensions);
        }
        setBusinessTypes(businessTypesResponse?.data || []);
        setAllIndustries(industriesResponse?.data || []);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch deal data when in edit mode
  useEffect(() => {
    if (isEditMode && dealId) {
      const fetchDealData = async () => {
        setFetching(true);
        try {
          const deal = await getDeal(dealId);
          const formatDate = (dateString: string | null) => {
            if (!dateString) return "";
            return dateString.split("T")[0];
          };

          const dealAny = deal as any;
          const progressFlags = getProgressFlags(dealAny);

          setDealForm({
            ...initialDealForm,
            name: deal.name || "",
            stage_id: deal.stage_id ? Number(deal.stage_id) : undefined,
            assigned_to: deal.assigned_to || null,
            expected_close_date: formatDate(deal.expected_close_date),
            company_name: deal.company_name || "",
            industry_ids:
              dealAny.industry_ids && Array.isArray(dealAny.industry_ids)
                ? dealAny.industry_ids
                    .map((id: any) => Number(id))
                    .filter((id: number) => !Number.isNaN(id))
                : dealAny.industries && Array.isArray(dealAny.industries)
                  ? dealAny.industries
                      .map((ind: any) =>
                        typeof ind === "object" ? Number(ind.id) : Number(ind),
                      )
                      .filter((id: number) => !Number.isNaN(id))
                  : [],
            decision_maker_title: deal.decision_maker_title || "",
            decision_maker_name:
              deal.decision_maker_name ||
              dealAny.main_decision_maker?.name ||
              "",
            decision_maker_phone_country_code:
              deal.decision_maker_phone_country_code ||
              dealAny.main_decision_maker?.phone_country_code ||
              "",
            decision_maker_phone:
              deal.decision_maker_phone ||
              dealAny.main_decision_maker?.phone ||
              "",
            decision_maker_email:
              deal.decision_maker_email ||
              dealAny.main_decision_maker?.email ||
              "",
            deal_type: deal.deal_type || "",
            contract_length: deal.contract_length || "",
            contract_length_custom: deal.contract_length_custom || "",
            billing_model: deal.billing_model || "",
            payment_terms: deal.payment_terms || "",
            payment_terms_custom: deal.payment_terms_custom || "",
            risk_level: deal.risk_level || "",
            competitors: deal.competitors || "",
            ...progressFlags,
            follow_up_date: formatDate(deal.follow_up_date),
            currency: deal.currency || "AED",
          });

          // Set business type
          if (dealAny.business_type_id) {
            setDealForm((prev) => ({
              ...prev,
              business_type_id: Number(dealAny.business_type_id),
            }));
            setShowOtherBusinessType(false);
          } else if (dealAny.business_type_other) {
            setDealForm((prev) => ({
              ...prev,
              business_type_other: dealAny.business_type_other,
            }));
            setShowOtherBusinessType(true);
          }

          // Prefill line items (estimations) from latest estimate or deal.estimation_chart
          const sortedEstimates =
            dealAny.estimates &&
            Array.isArray(dealAny.estimates) &&
            dealAny.estimates.length > 0
              ? [...dealAny.estimates].sort((a: any, b: any) => {
                  const dateA = new Date(a.created_at || 0).getTime();
                  const dateB = new Date(b.created_at || 0).getTime();
                  return dateB - dateA;
                })
              : [];
          const latestEstimate = sortedEstimates[0];
          const chart =
            latestEstimate?.estimation_chart &&
            latestEstimate.estimation_chart.length > 0
              ? latestEstimate.estimation_chart
              : dealAny.estimation_chart &&
                  Array.isArray(dealAny.estimation_chart) &&
                  dealAny.estimation_chart.length > 0
                ? dealAny.estimation_chart
                : [];
          const taxPct =
            latestEstimate != null
              ? parseFloat(String(latestEstimate.tax_percentage ?? "0")) || 0
              : parseFloat(String(dealAny.tax_percentage ?? "0")) || 0;
          const stdDisc =
            latestEstimate != null
              ? parseFloat(
                  String(latestEstimate.standard_discount_percentage ?? "0"),
                ) || 0
              : parseFloat(
                  String(dealAny.standard_discount_percentage ?? "0"),
                ) || 0;
          const specDisc =
            latestEstimate != null
              ? parseFloat(
                  String(latestEstimate.special_discount_percentage ?? "0"),
                ) || 0
              : parseFloat(
                  String(dealAny.special_discount_percentage ?? "0"),
                ) || 0;
          const lineItemsFromApi = mapEstimateChartToLineItems(
            chart,
            taxPct,
            stdDisc,
            specDisc,
            (idx, item) => item.id ?? Date.now() + idx,
          );
          setDealForm((prev) => ({
            ...prev,
            lineItems: lineItemsFromApi,
            tax_percentage: String(
              latestEstimate?.tax_percentage ?? dealAny.tax_percentage ?? "0",
            ),
            standard_discount_percentage: String(
              latestEstimate?.standard_discount_percentage ??
                dealAny.standard_discount_percentage ??
                "0",
            ),
            special_discount_percentage: String(
              latestEstimate?.special_discount_percentage ??
                dealAny.special_discount_percentage ??
                "0",
            ),
          }));
          setEditEstimates(sortedEstimates);
          setSelectedRevisionId(sortedEstimates[0]?.id ?? null);
        } catch (error) {
          console.error("Failed to fetch deal:", error);
          toast.error("Failed to load deal data");
        } finally {
          setFetching(false);
        }
      };
      fetchDealData();
    }
  }, [dealId, isEditMode]);

  // Fetch CRM products for line item dropdown
  useEffect(() => {
    const fetchProducts = async () => {
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
    fetchProducts();
  }, []);

  const isFormValid =
    dealForm.name.trim() !== "" &&
    dealForm.stage_id !== undefined &&
    dealForm.expected_close_date !== "" &&
    dealForm.assigned_to !== null &&
    dealForm.company_name.trim() !== "" &&
    dealForm.decision_maker_name.trim() !== "" &&
    dealForm.decision_maker_email.trim() !== "" &&
    dealForm.decision_maker_phone.trim() !== "";

  // Line items
  const addLineItem = () => {
    // If a product has been selected via the old dropdown inputs, reuse that logic
    if (lineItemInput) {
      const discountTotal = lineItemDiscount ?? 0;
      setDealForm((prev) => ({
        ...prev,
        lineItems: [
          ...prev.lineItems,
          {
            id: Date.now(),
            name: lineItemInput,
            quantity: lineItemQty || 1,
            tax: lineItemTax ?? 0,
            discount: discountTotal,
            product_id: lineItemProductId,
            unit_price: lineItemUnitPrice,
            standard_discount_percentage: Math.floor(discountTotal / 2),
            special_discount_percentage:
              discountTotal - Math.floor(discountTotal / 2),
          },
        ],
      }));
      setLineItemInput("");
      setLineItemProductId(undefined);
      setLineItemUnitPrice(0);
      setLineItemQty(0);
      setLineItemTax(0);
      setLineItemDiscount(0);
      return;
    }

    // Otherwise, add a new blank line item with the same shape as items added earlier
    setDealForm((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: Date.now(),
          name: "",
          quantity: 1,
          tax: 0,
          discount: 0,
          product_id: undefined,
          unit_price: 0,
          standard_discount_percentage: 0,
          special_discount_percentage: 0,
        },
      ],
    }));
  };

  // Append line items from a selected revision (adds prefilled rows; does not replace)
  const appendRevisionAsLineItems = (estimate: any) => {
    const chart =
      estimate?.estimation_chart && Array.isArray(estimate.estimation_chart)
        ? estimate.estimation_chart
        : [];
    const taxPct = parseFloat(String(estimate.tax_percentage ?? "0")) || 0;
    const stdDisc =
      parseFloat(String(estimate.standard_discount_percentage ?? "0")) || 0;
    const specDisc =
      parseFloat(String(estimate.special_discount_percentage ?? "0")) || 0;
    const lineItemsFromRevision = mapEstimateChartToLineItems(
      chart,
      taxPct,
      stdDisc,
      specDisc,
      (idx) => Date.now() + idx,
    );
    setDealForm((prev) => ({
      ...prev,
      // Replace existing line items with those from the selected revision
      lineItems: lineItemsFromRevision,
    }));
    setSelectedRevisionId(estimate.id);
  };

  // Only line items with a non-empty name are sent when saving revision
  const filledLineItems = dealForm.lineItems.filter(
    (li) => (li.name || "").trim() !== "",
  );

  // Save current line items as a new revision (same API as Add Revision modal)
  const saveRevisionFromLineItems = async () => {
    if (!dealId || filledLineItems.length === 0) return;
    setSavingRevision(true);
    try {
      const payload = {
        deal_id: dealId,
        estimation_chart: filledLineItems.map((item) => {
          const stdPct =
            item.standard_discount_percentage ??
            Math.floor((item.discount ?? 0) / 2);
          const specPct =
            item.special_discount_percentage ??
            (item.discount ?? 0) - Math.floor((item.discount ?? 0) / 2);
          return {
            product_id: item.product_id ?? 0,
            product_service: item.name,
            description: "",
            qty: item.quantity,
            unit_price: item.unit_price ?? 0,
            original_currency: dealForm.currency || "AED",
            original_price: item.unit_price ?? 0,
            tax_percentage: parseFloat(String(item.tax ?? "0")),
            standard_discount_percentage: stdPct,
            special_discount_percentage: specPct,
          };
        }),
        standard_discount_percentage: parseFloat(
          dealForm.standard_discount_percentage || "0",
        ),
        special_discount_percentage: parseFloat(
          dealForm.special_discount_percentage || "0",
        ),
        tax_percentage: parseFloat(dealForm.tax_percentage || "0"),
        currency: dealForm.currency || "AED",
      };
      await createEstimate(payload, false);
      const updated = await getDeal(dealId);
      const estimates = (updated as any).estimates || [];
      const sorted = [...estimates].sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setEditEstimates(sorted);
      toast.success("Revision saved!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save revision");
    } finally {
      setSavingRevision(false);
    }
  };

  const removeLineItem = (id: number) =>
    setDealForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((li) => li.id !== id),
    }));

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#0091ae");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderColor = "#8a8a8a");

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close create deal form"
        style={OVERLAY_STYLE}
      />

      {/* Sidebar */}
      <div style={SIDEBAR_STYLE}>
        {/* ── Header ── */}
        <div style={SIDEBAR_HEADER_STYLE}>
          <h2 style={SIDEBAR_TITLE_STYLE}>
            {isEditMode ? "Edit Deal" : "Create Deal"}
          </h2>
          <button onClick={onClose} style={SIDEBAR_CLOSE_BUTTON_STYLE}>
            <X size={24} />
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 40px" }}>
          {fetching ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading deal data...</p>
            </div>
          ) : (
            <>
              {/* Deal Information Section */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#141414",
                  marginBottom: "16px",
                  marginTop: 0,
                }}
              >
                DEAL INFORMATION
              </h3>

              {/* Deal name */}
              <div style={fieldWrap}>
                {fieldLabel("Deal Name", true)}
                <input
                  type="text"
                  data-test-id="dealname-input"
                  value={dealForm.name}
                  onChange={setE("name")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter deal name"
                />
              </div>

              {/* Stage */}
              <div style={fieldWrap}>
                {fieldLabel("Stage", true)}
                <Form.Select
                  value={dealForm.stage_id || ""}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      stage_id: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
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

              {/* Expected Close Date */}
              <div style={fieldWrap}>
                {fieldLabel("Expected Close Date", true)}
                <input
                  type="date"
                  data-test-id="expectedclosedate-input"
                  value={dealForm.expected_close_date}
                  onChange={setE("expected_close_date")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Owner */}
              <div style={fieldWrap}>
                {fieldLabel("Owner", true)}
                <Form.Select
                  value={dealForm.assigned_to || ""}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      assigned_to: e.target.value || null,
                    }))
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

              {/* Currency */}
              <div style={fieldWrap}>
                {fieldLabel("Currency", true)}
                <Form.Select
                  value={dealForm.currency}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </Form.Select>
              </div>

              {/* Follow-up Date */}
              <div style={fieldWrap}>
                {fieldLabel("Follow-up Date")}
                <input
                  type="date"
                  data-test-id="followupdate-input"
                  value={dealForm.follow_up_date}
                  onChange={setE("follow_up_date")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
              </div>

              {/* Company Information Section */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#141414",
                  marginBottom: "16px",
                  marginTop: "32px",
                }}
              >
                COMPANY INFORMATION
              </h3>

              {/* Company Name */}
              <div style={fieldWrap}>
                {fieldLabel("Company Name", true)}
                <input
                  type="text"
                  data-test-id="companyname-input"
                  value={dealForm.company_name}
                  onChange={setE("company_name")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter company name"
                />
              </div>

              {/* Business Type */}
              <div style={fieldWrap}>
                {fieldLabel("Select Business Type", true)}
                <Form.Select
                  value={
                    showOtherBusinessType
                      ? "other"
                      : dealForm.business_type_id
                        ? String(dealForm.business_type_id)
                        : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "other") {
                      setShowOtherBusinessType(true);
                      setDealForm((prev) => ({
                        ...prev,
                        business_type_id: null,
                        business_type_other: "",
                      }));
                    } else if (value) {
                      setShowOtherBusinessType(false);
                      setDealForm((prev) => ({
                        ...prev,
                        business_type_id: Number(value),
                        business_type_other: "",
                      }));
                    } else {
                      setShowOtherBusinessType(false);
                      setDealForm((prev) => ({
                        ...prev,
                        business_type_id: null,
                        business_type_other: "",
                      }));
                    }
                  }}
                  style={inputStyle}
                >
                  <option value="">Select Business Type</option>
                  {businessTypes.map((businessType) => (
                    <option key={businessType.id} value={businessType.id}>
                      {businessType.name}
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
                    value={dealForm.business_type_other}
                    onChange={setE("business_type_other")}
                    style={inputStyle}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                    placeholder="Enter business type"
                  />
                </div>
              )}

              {/* Decision Maker Title */}
              <div style={fieldWrap}>
                {fieldLabel("Decision Maker Title")}
                <Form.Select
                  value={dealForm.decision_maker_title}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      decision_maker_title: e.target.value,
                    }))
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

              {/* Decision Maker Name */}
              <div style={fieldWrap}>
                {fieldLabel("Decision Maker Name", true)}
                <input
                  type="text"
                  data-test-id="decisionmakername-input"
                  value={dealForm.decision_maker_name}
                  onChange={setE("decision_maker_name")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Decision maker name"
                />
              </div>

              {/* Decision Maker Email */}
              <div style={fieldWrap}>
                {fieldLabel("Decision Maker Email", true)}
                <input
                  type="email"
                  data-test-id="decisionmakeremail-input"
                  value={dealForm.decision_maker_email}
                  onChange={setE("decision_maker_email")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="decisionmaker@company.com"
                />
              </div>

              {/* Decision Maker Phone */}
              <div style={fieldWrap}>
                {fieldLabel("Decision Maker Phone", true)}
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={
                    dealForm.decision_maker_phone_country_code &&
                    dealForm.decision_maker_phone
                      ? `${dealForm.decision_maker_phone_country_code}${dealForm.decision_maker_phone}`
                      : dealForm.decision_maker_phone || undefined
                  }
                  onChange={(value) => {
                    if (value) {
                      try {
                        const phoneNumber = parsePhoneNumberLib(value);
                        if (phoneNumber) {
                          setDealForm((prev) => ({
                            ...prev,
                            decision_maker_phone_country_code: `+${phoneNumber.countryCallingCode}`,
                            decision_maker_phone: phoneNumber.nationalNumber,
                          }));
                        } else {
                          setDealForm((prev) => ({
                            ...prev,
                            decision_maker_phone_country_code: "",
                            decision_maker_phone: value,
                          }));
                        }
                      } catch (error) {
                        setDealForm((prev) => ({
                          ...prev,
                          decision_maker_phone_country_code: "",
                          decision_maker_phone: value,
                        }));
                      }
                    } else {
                      setDealForm((prev) => ({
                        ...prev,
                        decision_maker_phone_country_code: "",
                        decision_maker_phone: "",
                      }));
                    }
                  }}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Industries */}
              <div style={fieldWrap}>
                {fieldLabel("Industries")}
                <Select
                  isMulti
                  value={allIndustries
                    .filter((ind) => dealForm.industry_ids.includes(ind.id))
                    .map((ind) => ({ value: ind.id, label: ind.name }))}
                  onChange={(selected) => {
                    setDealForm((prev) => ({
                      ...prev,
                      industry_ids: selected
                        ? selected.map((s) => s.value)
                        : [],
                    }));
                  }}
                  options={allIndustries.map((ind) => ({
                    value: ind.id,
                    label: ind.name,
                  }))}
                  placeholder="Select industries..."
                  isSearchable
                />
              </div>

              {/* Deal Characteristics Section */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#141414",
                  marginBottom: "16px",
                  marginTop: "32px",
                }}
              >
                DEAL CHARACTERISTICS
              </h3>

              {/* Deal Type */}
              <div style={fieldWrap}>
                {fieldLabel("Deal Type")}
                <input
                  type="text"
                  data-test-id="dealtype-input"
                  value={dealForm.deal_type}
                  onChange={setE("deal_type")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter deal type"
                />
              </div>

              {/* Contract Length */}
              <div style={fieldWrap}>
                {fieldLabel("Contract Length")}
                <Form.Select
                  value={dealForm.contract_length}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      contract_length: e.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select Contract Length</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </div>

              {dealForm.contract_length === "custom" && (
                <div style={fieldWrap}>
                  {fieldLabel("Contract Length (Custom)")}
                  <input
                    type="text"
                    value={dealForm.contract_length_custom}
                    onChange={setE("contract_length_custom")}
                    style={inputStyle}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                    placeholder="Enter custom contract length"
                  />
                </div>
              )}

              {/* Billing Model */}
              <div style={fieldWrap}>
                {fieldLabel("Billing Model")}
                <input
                  type="text"
                  value={dealForm.billing_model}
                  onChange={setE("billing_model")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter billing model"
                />
              </div>

              {/* Payment Terms */}
              <div style={fieldWrap}>
                {fieldLabel("Payment Terms")}
                <Form.Select
                  value={dealForm.payment_terms}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      payment_terms: e.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select Payment Terms</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_60">Net 60</option>
                  <option value="custom">Custom</option>
                </Form.Select>
              </div>

              {dealForm.payment_terms === "custom" && (
                <div style={fieldWrap}>
                  {fieldLabel("Payment Terms (Custom)")}
                  <input
                    type="text"
                    value={dealForm.payment_terms_custom}
                    onChange={setE("payment_terms_custom")}
                    style={inputStyle}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                    placeholder="Enter custom payment terms"
                  />
                </div>
              )}

              {/* Risk Level */}
              <div style={fieldWrap}>
                {fieldLabel("Risk Level")}
                <input
                  type="text"
                  value={dealForm.risk_level}
                  onChange={setE("risk_level")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter risk level"
                />
              </div>

              {/* Competitors */}
              <div style={fieldWrap}>
                {fieldLabel("Competitors")}
                <input
                  type="text"
                  value={dealForm.competitors}
                  onChange={setE("competitors")}
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                  placeholder="Enter competitors"
                />
              </div>

              <div style={{ marginTop: "28px" }}>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#141414",
                    marginBottom: "16px",
                    marginTop: 0,
                  }}
                >
                  Associate Deal with
                </h3>

                {/* Contacts section */}
                {!isEditMode && (
                  <div
                    style={{
                      border: "1px solid #cccccc",
                      borderRadius: "6px",
                      marginBottom: "16px",
                      overflow: "hidden",
                      borderLeft: "4px solid #ccc",
                    }}
                  >
                    {/* Contacts Header */}
                    <div
                      onClick={() => setIsContactsExpanded(!isContactsExpanded)}
                      style={{
                        padding: "12px 16px",
                        backgroundColor: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isContactsExpanded ? (
                        <ChevronDown size={16} style={{ color: "#6c757d" }} />
                      ) : (
                        <ChevronRight size={16} style={{ color: "#6c757d" }} />
                      )}
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#141414",
                        }}
                      >
                        Contacts
                      </span>
                    </div>

                    {/* Contacts Content */}
                    {isContactsExpanded && (
                      <div style={{ padding: "16px" }}>
                        <div style={fieldWrap}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#141414",
                              marginBottom: "6px",
                            }}
                          >
                            Associate records
                          </label>
                          <SimpleDropdown
                            value={dealForm.contactAssociateRecord}
                            options={["Contact A", "Contact B", "Contact C"]}
                            onChange={set("contactAssociateRecord")}
                            placeholder="Search"
                            testId="contact-associate-input"
                          />
                        </div>

                        <div style={fieldWrap}>
                          <label
                            style={{
                              display: "block",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#141414",
                              marginBottom: "6px",
                            }}
                          >
                            Association label
                          </label>
                          <SimpleDropdown
                            value={dealForm.contactAssociationLabel}
                            options={ASSOCIATION_LABEL_OPTIONS}
                            onChange={set("contactAssociationLabel")}
                            testId="contact-label-input"
                          />
                        </div>

                        <div style={{ marginBottom: "8px" }}>
                          <Form.Check
                            type="checkbox"
                            label={
                              <span
                                style={{ fontSize: "13px", color: "#6c757d" }}
                              >
                                Add timeline activity from this Contact{" "}
                                <span
                                  title="Adds contact activity to the deal timeline"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    backgroundColor: "#e0e7ef",
                                    color: "#6c757d",
                                    fontSize: "11px",
                                    cursor: "help",
                                  }}
                                >
                                  i
                                </span>
                              </span>
                            }
                            checked={dealForm.addTimelineContact}
                            onChange={(e) =>
                              setDealForm((p) => ({
                                ...p,
                                addTimelineContact: e.target.checked,
                              }))
                            }
                          />
                        </div>

                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#0091ae",
                            fontSize: "13px",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Plus size={14} /> Add more
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Companies section */}
                <div
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    overflow: "hidden",
                    borderLeft: "4px solid #ccc",
                  }}
                >
                  {/* Companies Header */}
                  <div
                    onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
                    style={{
                      padding: "12px 16px",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {isCompaniesExpanded ? (
                      <ChevronDown size={16} style={{ color: "#6c757d" }} />
                    ) : (
                      <ChevronRight size={16} style={{ color: "#6c757d" }} />
                    )}
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#141414",
                      }}
                    >
                      Companies
                    </span>
                  </div>

                  {/* Companies Content */}
                  {isCompaniesExpanded && (
                    <div style={{ padding: "16px" }}>
                      <div style={fieldWrap}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#141414",
                            marginBottom: "6px",
                          }}
                        >
                          Associate records
                        </label>
                        <SimpleDropdown
                          value={dealForm.companyAssociateRecord}
                          options={["Company A", "Company B", "Company C"]}
                          onChange={set("companyAssociateRecord")}
                          placeholder="Search"
                          testId="company-associate-input"
                        />
                      </div>

                      <div style={fieldWrap}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#141414",
                            marginBottom: "6px",
                          }}
                        >
                          Association label{" "}
                          <span style={{ color: "#f2545b" }}>*</span>{" "}
                          <span
                            title="Required association label"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              backgroundColor: "#e0e7ef",
                              color: "#6c757d",
                              fontSize: "11px",
                              cursor: "help",
                            }}
                          >
                            i
                          </span>
                        </label>
                        <input
                          type="text"
                          value={dealForm.companyAssociationLabel}
                          readOnly
                          style={{
                            ...inputStyle,
                            backgroundColor: "#f7fafc",
                            color: "#a0aec0",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "8px" }}>
                        <Form.Check
                          type="checkbox"
                          label={
                            <span
                              style={{ fontSize: "13px", color: "#6c757d" }}
                            >
                              Add timeline activity from this Company{" "}
                              <span
                                title="Adds company activity to the deal timeline"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "14px",
                                  height: "14px",
                                  borderRadius: "50%",
                                  backgroundColor: "#e0e7ef",
                                  color: "#6c757d",
                                  fontSize: "11px",
                                  cursor: "help",
                                }}
                              >
                                i
                              </span>
                            </span>
                          }
                          checked={dealForm.addTimelineCompany}
                          onChange={(e) =>
                            setDealForm((p) => ({
                              ...p,
                              addTimelineCompany: e.target.checked,
                            }))
                          }
                        />
                      </div>

                      <button
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#0091ae",
                          fontSize: "13px",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Plus size={14} /> Add more
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Line items & Revisions (combined) ── */}
              <div style={{ marginTop: "28px" }}>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#141414",
                    marginBottom: "16px",
                  }}
                >
                  LINE ITEMS & REVISIONS
                </h3>

                {/* Revision dropdown: add prefilled line items from a revision (edit mode, when any revisions exist) */}
                {isEditMode && Boolean(dealId) && editEstimates.length >= 1 && (
                  <div style={{ marginBottom: "16px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#141414",
                        marginBottom: "6px",
                      }}
                    >
                      Add line items from revision
                    </label>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        style={{
                          ...dropdownToggleStyle(
                            !!editEstimates.find(
                              (e: any) => e.id === selectedRevisionId,
                            ),
                          ),
                          color: editEstimates.some(
                            (e: any) => e.id === selectedRevisionId,
                          )
                            ? "#141414"
                            : "#a0aec0",
                        }}
                      >
                        {(() => {
                          const selected = editEstimates.find(
                            (e: any) => e.id === selectedRevisionId,
                          );
                          return selected
                            ? `Version ${selected.version || selected.id} – ${selected.created_at ? moment(selected.created_at).format(GlobalDateTimeFormat) : ""} (${selected.estimation_chart?.length || 0} items)`
                            : "Select a previous version";
                        })()}
                      </Dropdown.Toggle>
                      <Dropdown.Menu style={{ width: "100%" }}>
                        {editEstimates.map((estimate: any) => (
                          <Dropdown.Item
                            key={estimate.id}
                            onClick={() => appendRevisionAsLineItems(estimate)}
                          >
                            Version {estimate.version || estimate.id} –{" "}
                            {estimate.created_at
                              ? moment(estimate.created_at).format(
                                  GlobalDateTimeFormat,
                                )
                              : ""}{" "}
                            ({estimate.estimation_chart?.length || 0} items)
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 70px 70px 70px auto",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                    }}
                  >
                    Add line item
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                    }}
                  >
                    Quantity
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                    }}
                  >
                    Tax (%)
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#141414",
                    }}
                  >
                    Discount (%)
                  </span>
                  <span style={{ width: "36px" }} />
                </div>

                {/* Existing line items */}
                {dealForm.lineItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 70px 70px 70px auto",
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        setDealForm((prev) => ({
                          ...prev,
                          lineItems: prev.lineItems.map((li) =>
                            li.id === item.id
                              ? { ...li, name: e.target.value }
                              : li,
                          ),
                        }))
                      }
                      placeholder="Item name"
                      style={{ ...inputStyle }}
                      onFocus={focusStyle}
                      onBlur={blurStyle}
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setDealForm((prev) => ({
                          ...prev,
                          lineItems: prev.lineItems.map((li) =>
                            li.id === item.id
                              ? { ...li, quantity: Number(e.target.value) || 1 }
                              : li,
                          ),
                        }))
                      }
                      style={{ ...inputStyle, width: "70px" }}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.tax ?? 0}
                      onChange={(e) =>
                        setDealForm((prev) => ({
                          ...prev,
                          lineItems: prev.lineItems.map((li) =>
                            li.id === item.id
                              ? { ...li, tax: Number(e.target.value) || 0 }
                              : li,
                          ),
                        }))
                      }
                      style={{ ...inputStyle, width: "70px" }}
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount ?? 0}
                      onChange={(e) =>
                        setDealForm((prev) => ({
                          ...prev,
                          lineItems: prev.lineItems.map((li) =>
                            li.id === item.id
                              ? { ...li, discount: Number(e.target.value) || 0 }
                              : li,
                          ),
                        }))
                      }
                      style={{ ...inputStyle, width: "70px" }}
                    />
                    <button
                      onClick={() => removeLineItem(item.id)}
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

                {isEditMode && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 70px 70px 70px auto",
                      gap: "8px",
                      alignItems: "center",
                      marginTop: "8px",
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
                              onClick={() => {
                                setLineItemInput(p.name);
                                setLineItemProductId(p.id);
                                setLineItemUnitPrice(
                                  Number.parseFloat(String(p.price || "0")) || 0,
                                );
                              }}
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
                                title={`${p.name} – ${dealForm.currency || "AED"} ${p.price || "0"}`}
                              >
                                {p.name} – {dealForm.currency || "AED"} {p.price || "0"}
                              </span>
                            </Dropdown.Item>
                          ))
                        )}
                      </Dropdown.Menu>
                    </Dropdown>
                    {[
                      {
                        key: "qty",
                        node: (
                          <input
                            type="number"
                            min={1}
                            value={lineItemQty || ""}
                            placeholder="0"
                            onChange={(e) =>
                              setLineItemQty(
                                Number(e.target.value) ? Number(e.target.value) : 0,
                              )
                            }
                            style={{ ...inputStyle, width: "70px" }}
                            onFocus={focusStyle}
                            onBlur={blurStyle}
                          />
                        ),
                      },
                      {
                        key: "tax",
                        node: (
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
                        ),
                      },
                      {
                        key: "discount",
                        node: (
                          <Form.Select
                            value={lineItemDiscount ? String(lineItemDiscount) : ""}
                            onChange={(e) =>
                              setLineItemDiscount(
                                e.target.value ? Number(e.target.value) : 0,
                              )
                            }
                            style={{ ...inputStyle, width: "70px" }}
                          >
                            <option value="">Select</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                          </Form.Select>
                        ),
                      },
                    ].map((field) => (
                      <React.Fragment key={field.key}>{field.node}</React.Fragment>
                    ))}
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
                )}

                {/* Add extra field + Save revision (edit mode only) */}
                {isEditMode && Boolean(dealId) && (
                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="primary"
                      disabled={
                        filledLineItems.length === 0 || savingRevision
                      }
                      onClick={saveRevisionFromLineItems}
                    >
                      {savingRevision ? "Saving..." : "Save revision"}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={addLineItem}
                    >
                      <Plus size={16} className="me-1" />
                      Add extra field
                    </Button>
                  </div>
                )}
              </div>

              {/* Progress & Notes Section */}
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#141414",
                  marginBottom: "16px",
                  marginTop: "32px",
                }}
              >
                NEGOTIATION PROGRESS
              </h3>

              {/* Quotation Sent */}
              <div style={fieldWrap}>
                <Form.Check
                  type="checkbox"
                  label="Quotation Sent"
                  checked={dealForm.quotation_sent}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      quotation_sent: e.target.checked,
                    }))
                  }
                />
              </div>

              {/* Contract Sent */}
              <div style={fieldWrap}>
                <Form.Check
                  type="checkbox"
                  label="Contract Sent"
                  checked={dealForm.contract_sent}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      contract_sent: e.target.checked,
                    }))
                  }
                />
              </div>

              {/* Contract Received */}
              <div style={fieldWrap}>
                <Form.Check
                  type="checkbox"
                  label="Contract Received"
                  checked={dealForm.contract_received}
                  onChange={(e) =>
                    setDealForm((prev) => ({
                      ...prev,
                      contract_received: e.target.checked,
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #eaf0f6",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-start",
          }}
        >
          <button
            type="button"
            disabled={!isFormValid || loading}
            onClick={async () => {
              if (!isFormValid) return;
              setLoading(true);
              try {
                const payload: any = {
                  name: dealForm.name,
                  stage_id: dealForm.stage_id
                    ? String(dealForm.stage_id)
                    : undefined,
                  assigned_to: dealForm.assigned_to,
                  expected_close_date: dealForm.expected_close_date,
                  company_name: dealForm.company_name,
                  industry_ids: dealForm.industry_ids,
                  ...(dealForm.business_type_id
                    ? { business_type_id: String(dealForm.business_type_id) }
                    : {}),
                  ...(dealForm.business_type_other
                    ? { business_type_other: dealForm.business_type_other }
                    : {}),
                  decision_maker_title: dealForm.decision_maker_title,
                  decision_maker_name: dealForm.decision_maker_name,
                  decision_maker_phone_country_code:
                    dealForm.decision_maker_phone_country_code,
                  decision_maker_phone: dealForm.decision_maker_phone,
                  decision_maker_email: dealForm.decision_maker_email,
                  deal_type: dealForm.deal_type,
                  contract_length: dealForm.contract_length,
                  contract_length_custom: dealForm.contract_length_custom || "",
                  billing_model: dealForm.billing_model,
                  payment_terms: dealForm.payment_terms,
                  payment_terms_custom: dealForm.payment_terms_custom || "",
                  risk_level: dealForm.risk_level,
                  competitors: dealForm.competitors || "",
                  quotation_sent: dealForm.quotation_sent,
                  contract_sent: dealForm.contract_sent,
                  contract_received: dealForm.contract_received,
                  follow_up_date: dealForm.follow_up_date || "",
                  currency: dealForm.currency,
                };

                if (isEditMode && dealId) {
                  await updateDeal(dealId, payload);
                  // Toast is already shown by updateDeal function
                } else {
                  await createDeal(payload);
                  // Toast is already shown by createDeal function
                }

                if (onSuccess) {
                  onSuccess();
                }
                onClose();
              } catch (error: any) {
                console.error("Failed to save deal:", error);
                toast.error(error?.message || "Failed to save deal");
              } finally {
                setLoading(false);
              }
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: isFormValid && !loading ? "#0091ae" : "#cbd5e0",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isFormValid && !loading ? "pointer" : "not-allowed",
            }}
            {...hoverBackgroundHandlers(
              isFormValid && !loading,
              "#007a94",
              "#0091ae",
            )}
          >
            {loading ? "Saving..." : isEditMode ? "Update Deal" : "Create"}
          </button>

          {!isEditMode && (
            <button
              type="button"
              disabled={!isFormValid || loading}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: isFormValid && !loading ? "#141414" : "#a0aec0",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: isFormValid && !loading ? "pointer" : "not-allowed",
              }}
              {...hoverBackgroundHandlers(
                isFormValid && !loading,
                "#f7fafc",
                "transparent",
              )}
            >
              Create and add another
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#141414",
              border: "1px solid #8a8a8a",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            {...hoverBackgroundHandlers(!loading, "#f7fafc", "transparent")}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Add/Edit Revision Modal */}
      <Modal
        show={showAddRevisionModal}
        onHide={() => {
          setShowAddRevisionModal(false);
          setEditEditingRevisionIndex(null);
          setEditRevisionProducts([]);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editEditingRevisionIndex !== null
              ? "Copy Revision / Quotation"
              : "Add Revision / Quotation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Add Products</Form.Label>
              <Select
                isMulti
                value={editRevisionSelectedProductIds}
                onChange={(selected) =>
                  setEditRevisionSelectedProductIds(
                    selected ? [...selected] : [],
                  )
                }
                options={editRevisionProductsCatalog.map((p) => ({
                  value: p.id,
                  label: `${p.name} – ${dealForm.currency || "AED"} ${p.price || 0}`,
                }))}
                placeholder={
                  editRevisionLoadingProducts
                    ? "Loading products..."
                    : "Select products to add..."
                }
                isDisabled={editRevisionLoadingProducts}
                isSearchable
              />
              <div className="d-flex gap-2 mt-2 flex-wrap">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    const toAdd = editRevisionProductsCatalog.filter(
                      (p) =>
                        editRevisionSelectedProductIds.some(
                          (s) => s.value === p.id,
                        ) &&
                        !editRevisionProducts.some(
                          (ep) => ep.product_id === p.id,
                        ),
                    );
                    const newItems = toAdd.map((p) => ({
                      product_id: p.id,
                      product_service: p.name || "",
                      description: "",
                      qty: 1,
                      unit_price: parseFloat(String(p.price || "0")),
                      original_currency: dealForm.currency || "AED",
                      original_price: parseFloat(String(p.price || "0")),
                      tax_percentage: editRevisionFormData.tax_percentage,
                      standard_discount_percentage:
                        editRevisionFormData.standard_discount_percentage,
                      special_discount_percentage:
                        editRevisionFormData.special_discount_percentage,
                    }));
                    setEditRevisionProducts([
                      ...editRevisionProducts,
                      ...newItems,
                    ]);
                    setEditRevisionSelectedProductIds([]);
                  }}
                  disabled={editRevisionSelectedProductIds.length === 0}
                >
                  <Plus size={14} className="me-1" />
                  Add Selected Products
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setEditRevisionProducts([
                      ...editRevisionProducts,
                      {
                        product_id: 0,
                        product_service: "",
                        description: "",
                        qty: 1,
                        unit_price: 0,
                        original_currency: dealForm.currency || "AED",
                        original_price: 0,
                        tax_percentage: editRevisionFormData.tax_percentage,
                        standard_discount_percentage:
                          editRevisionFormData.standard_discount_percentage,
                        special_discount_percentage:
                          editRevisionFormData.special_discount_percentage,
                      },
                    ]);
                  }}
                >
                  <Plus size={14} className="me-1" />
                  Add Custom Product
                </Button>
              </div>
            </Form.Group>

            <Form.Label>Products in this revision</Form.Label>
            <div className="table-responsive mb-3">
              <Table size="sm" hover>
                <thead className="bg-light">
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Tax (%)</th>
                    <th>Std Disc (%)</th>
                    <th>Spec Disc (%)</th>
                    <th>Line Total</th>
                    <th style={{ minWidth: "auto" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {editRevisionProducts.map((item, idx) => {
                    const { lineTotal } = getRevisionProductLineTotal(item);
                    return (
                      <tr key={idx}>
                        <td>
                          <Form.Control
                            type="text"
                            size="sm"
                            placeholder="Product name"
                            value={item.product_service}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = {
                                ...item,
                                product_service: e.target.value,
                              };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min={1}
                            size="sm"
                            style={{ width: 70 }}
                            value={item.qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10) || 1;
                              const updated = [...editRevisionProducts];
                              updated[idx] = { ...item, qty: v };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            step={0.01}
                            size="sm"
                            style={{ width: 90 }}
                            value={item.unit_price}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              const updated = [...editRevisionProducts];
                              updated[idx] = {
                                ...item,
                                unit_price: v,
                                original_price: v,
                              };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            size="sm"
                            style={{ width: 70 }}
                            value={item.tax_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = {
                                ...item,
                                tax_percentage: e.target.value,
                              };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            size="sm"
                            style={{ width: 70 }}
                            value={item.standard_discount_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = {
                                ...item,
                                standard_discount_percentage: e.target.value,
                              };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            size="sm"
                            style={{ width: 70 }}
                            value={item.special_discount_percentage ?? "0"}
                            onChange={(e) => {
                              const updated = [...editRevisionProducts];
                              updated[idx] = {
                                ...item,
                                special_discount_percentage: e.target.value,
                              };
                              setEditRevisionProducts(updated);
                            }}
                          />
                        </td>
                        <td>
                          {dealForm.currency || "AED"}{" "}
                          {lineTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td style={{ minWidth: "auto" }}>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger"
                            onClick={() =>
                              setEditRevisionProducts(
                                editRevisionProducts.filter(
                                  (_, i) => i !== idx,
                                ),
                              )
                            }
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {editRevisionProducts.length === 0 && (
                <div className="text-center text-muted py-3 small">
                  No products. Select products above and click &quot;Add
                  Selected Products&quot;.
                </div>
              )}
            </div>

            {editRevisionProducts.length > 0 &&
              (() => {
                const { subtotalAll, totalDiscount, totalTax } =
                  getRevisionProductsTotals(editRevisionProducts);
                const grandTotal = subtotalAll - totalDiscount + totalTax;
                return (
                  <Card className="bg-light border-0">
                    <Card.Body className="py-2">
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Subtotal:</span>
                        <span>
                          {dealForm.currency}{" "}
                          {subtotalAll.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="d-flex justify-content-between text-danger">
                          <span>Total Discount:</span>
                          <span>
                            - {dealForm.currency}{" "}
                            {totalDiscount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      {totalTax > 0 && (
                        <div className="d-flex justify-content-between">
                          <span>Total Tax:</span>
                          <span>
                            {dealForm.currency}{" "}
                            {totalTax.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between fw-bold mt-1 pt-1 border-top">
                        <span>Grand Total:</span>
                        <span className="text-success">
                          {dealForm.currency}{" "}
                          {grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })()}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setShowAddRevisionModal(false);
              setEditEditingRevisionIndex(null);
              setEditRevisionProducts([]);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={editRevisionProducts.length === 0}
            onClick={async () => {
              if (!dealId || editRevisionProducts.length === 0) return;
              try {
                const payload = {
                  deal_id: dealId,
                  estimation_chart: editRevisionProducts.map((item) => ({
                    product_id: item.product_id,
                    product_service: item.product_service,
                    description: item.description || "",
                    qty: item.qty,
                    unit_price: item.unit_price,
                    original_currency:
                      item.original_currency || dealForm.currency,
                    original_price: item.original_price ?? item.unit_price,
                    tax_percentage: parseFloat(
                      String(item.tax_percentage ?? "0"),
                    ),
                    standard_discount_percentage: parseFloat(
                      String(item.standard_discount_percentage ?? "0"),
                    ),
                    special_discount_percentage: parseFloat(
                      String(item.special_discount_percentage ?? "0"),
                    ),
                  })),
                  standard_discount_percentage: parseFloat(
                    editRevisionFormData.standard_discount_percentage || "0",
                  ),
                  special_discount_percentage: parseFloat(
                    editRevisionFormData.special_discount_percentage || "0",
                  ),
                  tax_percentage: parseFloat(
                    editRevisionFormData.tax_percentage || "0",
                  ),
                  currency: dealForm.currency || "AED",
                };
                await createEstimate(payload, false);
                const updated = await getDeal(dealId);
                const estimates = (updated as any).estimates || [];
                const sorted = [...estimates].sort(
                  (a: any, b: any) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                );
                setEditEstimates(sorted);
                toast.success(
                  editEditingRevisionIndex !== null
                    ? "Revision copied!"
                    : "Revision added!",
                );
                setShowAddRevisionModal(false);
                setEditEditingRevisionIndex(null);
                setEditRevisionProducts([]);
                if (onSuccess) onSuccess();
              } catch (err: any) {
                toast.error(err?.message || "Failed to save revision");
              }
            }}
          >
            {editEditingRevisionIndex !== null
              ? "Copy Revision"
              : "Save Revision"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

/**
 * Usage in your parent component:
 *
 * import { CreateDealSidebar } from './renderCreateDeal';
 *
 * const [showCreateDealSidebar, setShowCreateDealSidebar] = useState(false);
 *
 * // In your JSX:
 * {showCreateDealSidebar && (
 *   <CreateDealSidebar onClose={() => setShowCreateDealSidebar(false)} />
 * )}
 *
 * // Or use the renderCreateDeal helper (like renderCreateContact):
 * import renderCreateDeal from './renderCreateDeal';
 * {renderCreateDeal(showCreateDealSidebar, setShowCreateDealSidebar)}
 */
