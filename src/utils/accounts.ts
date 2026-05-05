import { toast } from "react-toastify";
import axiosInstance from "./axios";
import {
  accountingEnvelopeSuccess,
  extractAccountingApiData,
  peelAccountingResponseBody,
} from "./accountingResponseHelpers";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function firstNonEmptyString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t.length > 0) {
        return t;
      }
    }
  }
  return undefined;
}

function joinValidationErrors(errors: Record<string, unknown>): string | undefined {
  const parts: string[] = [];
  for (const v of Object.values(errors)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim()) {
          parts.push(item.trim());
        }
      }
    } else if (typeof v === "string" && v.trim()) {
      parts.push(v.trim());
    }
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(" ");
}

function messageFromNestedData(inner: Record<string, unknown>): string | undefined {
  const innerErrors = inner["errors"];
  if (isPlainObject(innerErrors)) {
    const joined = joinValidationErrors(innerErrors);
    if (joined) {
      return joined;
    }
  }
  return firstNonEmptyString(inner["message"]);
}

function messageFromResponseData(data: unknown): string | undefined {
  if (typeof data === "string") {
    const t = data.trim();
    return t.length > 0 ? t : undefined;
  }
  if (!isPlainObject(data)) {
    return undefined;
  }

  const inner = data["data"];
  if (isPlainObject(inner)) {
    const fromInner = messageFromNestedData(inner);
    if (fromInner) {
      return fromInner;
    }
  }

  const errs = data["errors"];
  if (isPlainObject(errs)) {
    const joined = joinValidationErrors(errs);
    if (joined) {
      return joined;
    }
  }

  const rootMsg = firstNonEmptyString(data["message"]);
  if (rootMsg) {
    return rootMsg;
  }

  return firstNonEmptyString(data["error"]);
}

function hasAxiosResponse(
  error: unknown,
): error is { response: { data?: unknown }; message?: string } {
  if (!isPlainObject(error) || !("response" in error)) {
    return false;
  }
  return error["response"] !== undefined && error["response"] !== null;
}

const ACCOUNTS_AXIOS_STATUS_MESSAGE = /^request failed with status code \d+/i;

/** Removes Axios boilerplate if it was concatenated with an API message. */
function stripAxiosStatusNoise(text: string): string {
  // Avoid `\s*…\s*` around the phrase (ReDoS / typescript:S5852): match the fixed
  // substring only, then normalize whitespace in one pass.
  return text
    .replaceAll(/request failed with status code \d+/gi, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * User-facing message from axios errors for accounting/accounts API calls.
 * Prefers response body over the generic "Request failed with status code …" string.
 */
export function getAccountsAxiosErrorMessage(error: unknown, fallback: string): string {
  let resolved = fallback;

  if (hasAxiosResponse(error)) {
    const data = (error.response as { data?: unknown }).data;
    const fromBody = messageFromResponseData(data);
    if (fromBody) {
      resolved = fromBody;
    }
  }

  if (resolved === fallback && isPlainObject(error) && typeof error["message"] === "string") {
    const raw = error["message"].trim();
    if (raw.length > 0 && !ACCOUNTS_AXIOS_STATUS_MESSAGE.test(raw)) {
      resolved = raw;
    }
  }

  if (resolved === fallback && error instanceof Error) {
    const raw = error.message.trim();
    if (raw.length > 0 && !ACCOUNTS_AXIOS_STATUS_MESSAGE.test(raw)) {
      resolved = raw;
    }
  }

  const cleaned = stripAxiosStatusNoise(resolved);
  if (!cleaned || ACCOUNTS_AXIOS_STATUS_MESSAGE.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

// API body: legacy `{ code, data: inner }` or direct `inner` ({ success, data, message?, ... }).
interface ControlhubResponse<T> {
  code: number;
  message: string;
  data: {
    success: boolean;
    data: T;
  };
}

// Pagination wrapper
interface PaginationWrapper<T> {
  data: T[];
  summary: any;
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    page: number;
    limit: number;
  };
}

type IdLike = number | string;

// Base interfaces for accounting entities
export interface ResellerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  parent_id: number | null;
  organization_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  parent_id?: number | null;
  organization_unit?: string | null;
  reseller_id?: string | null;
  country?: string;
  stripe_customer_id?: string | null;
  crm_company_id?: IdLike | null;
  profile?: {
    id: number;
    company_id: string;
    currency: string;
    vat_rate?: string;
    vat_exemption?: boolean;
    tax_id?: string;
    discount_type?: string;
    address?: string;
    discount_limit?: string;
    discount_applicability?: string[];
    payment_methods?: string[];
    payment_mode?: string;
    credit_limit?: string;
    early_payment_discount?: string;
    late_fee_rule?: string;
    payment_terms?: number;
    outstanding_invoices?: string;
    discounts_applied_ytd?: string;
    vat_collected?: string;
    active_subscriptions?: string;
    last_refund_date?: string;
    profile_status?: string;
    selected_products?: string[];
  };
  reseller?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    parent_id: number | null;
    organization_unit: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface InvoiceItemData {
  id: number;
  invoice_id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_percentage: string;
  line_total: string;
  created_at: string;
  updated_at: string;
  tax_rate: string;
  tax_amount?: string;
  product: ProductData;
}

export interface InvoicePaymentData {
  id: number;
  invoice_id: string;
  amount: string;
  payment_method: string;
  payment_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceData {
  id: number;
  company_id: string;

  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount_due: string;
  tenant_id?: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  currency_code: string;
  vat_rate: number;
  notes: string | null;
  terms_conditions: string | null;
  is_recurring: boolean;
  crm_company_id?: number | string;
  recurring_frequency: string | null;
  /** Subscription / recurring end date from API (create/update use this key). */
  end_date?: string | null;
  recurring_end_date: string | null;
  parent_invoice_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  payment_mode: string;
  status: string;
  /** When true, invoice view uses vendor/session tenant layout (see InvoiceViewModal). */
  is_tenant_invoice?: boolean;
  company: CompanyData;
  reseller: ResellerData | null;
  items: InvoiceItemData[];
  payments: InvoicePaymentData[];
  bank_accounts: string[];

}

export interface InvoiceCreateUpdatePayload {
  company_id: string;
  invoice_date: string;
  due_date: string;
  payment_mode: string;
  currency_code: string;
  tax_amount: number;
  vat_rate?: number;
  notes: string;
  terms_conditions: string;
  items: InvoiceItemCreateUpdatePayload[];
  subtotal: number;
  total_amount: number;
  status: string;
}

export interface InvoiceItemCreateUpdatePayload {
  product_id: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
  vat_rate?: string; // For API compatibility - maps to tax_rate
  tax_amount?: string;
}

// API-specific interface for invoice items (uses vat_rate instead of tax_rate)
export interface InvoiceItemAPIPayload {
  product_id: number;
  quantity: number;
  unit_price: number;
  vat_rate: string;
  tax_amount?: string;
  description?: string;
}

// API-specific interface for invoice creation/update (uses vat_rate for items)
export interface InvoiceCreateUpdateAPIPayload {
  tenant_id: string;
  crm_company_id?: string;
  po_number?: string;
  invoice_date: string;
  due_date: string;
  end_date?: string;
  payment_mode: "one_time" | "recurring" | "subscription";
  currency_code?: string;
  exchange_rate: number;
  tax_amount: number;
  notes?: string;
  terms_conditions?: string;
  items: InvoiceItemAPIPayload[];
  subtotal: number;
  total_amount: number;
  status?: string;
}

export interface ExpenseData {
  id: number;
  company_id: number | null;
  vendor_id: number | null;
  category_id: string;
  expense_number: string | null;
  expense_date: string;
  payment_date: string | null;
  description: string;
  amount: string;
  currency_code: string;
  tax_amount: string;
  tax_type: "amount" | "percentage";
  total_amount: string;
  payment_method: string | null;
  receipt_path: string | null;
  notes: string | null;
  is_billable: string;
  service_id: number | null;
  accounting_basis: "cash" | "accrual";
  created_at: string;
  updated_at: string;
  files: {
    name: string;
    path: string;
    size: number;
    type: string;
    uploaded_at: string;
  }[];
  vendor: unknown;
  category: ExpenseCategoryData;
  service: unknown;
  currency: string;
}

export interface ExpenseCategoryData {
  id: number;
  company_id: number | null;
  name: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  company?: unknown;
  expenses?: ExpenseData[];
}

export interface ExpenseCreateUpdatePayload {
  category_id: string;
  vendor_id?: string;
  expense_date: string;
  payment_date?: string;
  description: string;
  amount: string;
  tax_amount: string;
  tax_type: "amount" | "percentage";
  total_amount: string;
  currency: string;
  accounting_basis: "cash" | "accrual";
}

export interface ExpenseCategoryCreateUpdatePayload {
  name: string;
  description: string;
  color: string;
}

export interface ProductData {
  id: number;
  name: string;
  description?: string;
  /** Public URL for product logo/image when returned by the API */
  logo_url?: string;
  currency_code?: string;
  currency?: string;
  created_at?: string;
  category_id: string;
  is_service: boolean;
  base_price: string;
  effective_price: string;
  vat_rate: string;
  pricing_type: string;
  updated_at?: string;
  deleted_at?: string | null;
  invoice_items?: any[];
  category?: ProductCategoryData;
  company_pricing?: unknown;
}

export interface ProductCategoryData {
  id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  parent: ProductCategoryData | null;
  children: ProductCategoryData[];
  products: ProductData[];
}

export interface ProductCategoryCreateUpdatePayload {
  name: string;
  description: string;
  is_active?: boolean;
}

export interface ProductCreateUpdatePayload {
  name: string;
  sku?: string;
  description?: string;
  category_id: string;
  base_price: string | number;
  is_active?: boolean;
  is_service: boolean;
  currency: string;
  /** Sent as multipart field `logo_file` when provided */
  logo_file?: File;
}

function appendProductScalarFields(
  form: FormData,
  data: Omit<ProductCreateUpdatePayload, "logo_file">,
): void {
  const entries = Object.entries(data) as [keyof typeof data, unknown][];
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (typeof value === "boolean") {
      form.append(String(key), value ? "1" : "0");
      continue;
    }
    if (typeof value === "string") {
      form.append(String(key), value);
      continue;
    }
    if (typeof value === "number") {
      form.append(String(key), String(value));
    }
  }
}

function buildProductMultipartBody(
  data: ProductCreateUpdatePayload,
): FormData {
  const { logo_file: logoFile, ...fields } = data;
  const form = new FormData();
  appendProductScalarFields(form, fields);
  if (logoFile instanceof File) {
    form.append("logo_file", logoFile, logoFile.name);
  }
  return form;
}

export interface InventoryData {
  id: number;
  company_id: number | null;
  name: string;
  description?: string;
  base_price: string;
  currency: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  location_id: number | null;
  supplier_id: number | null;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number | null;
  notes: string | null;
  last_updated: string;
  category?: ProductCategoryData;
  location?: InventoryLocationData;
  supplier?: InventorySupplierData;
}

export interface InventoryCreateUpdatePayload {
  name: string;
  description?: string;
  base_price: string;
  currency: string;
  category_id: string;
  location_id?: number | null;
  supplier_id?: number | null;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point?: number | null;
  notes?: string | null;
}

export interface InventoryLocationData {
  id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryLocationCreateUpdatePayload {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export interface InventoryItemData {
  id: number;
  product_id: number;
  inventory_id: number;
  quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
  product?: ProductData;
  inventory?: InventoryData;
}

export interface InventorySupplierData {
  id: number;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  payment_terms?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventorySupplierCreateUpdatePayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PaymentMethodData {
  id: string;
  type: "card" | "bank_account";
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
    routing_number: string;
  };
  billing_details?: {
    name: string;
  };
  is_default: boolean;
  created_at: string;
}

export interface DiscountApplicabilityData {
  id: number;
  customer_id: number | null;
  name: string;
  description: string;
  is_applicable: boolean;
  discount_percentage: string;
  discount_amount: string | null;
  valid_from: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
  discount_type: "percentage" | "fixed";
  company_id: string;
  product_pricings: {
    id: number;
    company_id: string;
    product_id: string;
    selling_price: string;
    created_at: string;
    updated_at: string;
    discount_applicability_id: string;
    product: {
      id: number;
      name: string;
      description: string;
      currency_code: string;
      created_at: string;
      category_id: string;
      is_service: boolean;
      base_price: string;
      updated_at: string;
      deleted_at: string | null;
    };
  }[];
  company: {
    id: number;
    name: string;
    parent_id: number | null;
    organization_unit: string | null;
    created_at: string;
    updated_at: string;
    reseller_id: string | null;
    country: string;
    phone: string;
    email: string;
    stripe_customer_id: string;
  };
}

export interface DiscountApplicabilityCreateUpdatePayload {
  name: string;
  description: string;
  is_applicable: boolean;
  discount_type: "percentage" | "fixed";
  discount_percentage: number;
  discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  pricing_ids: number[];
  company_id?: number;
}

export interface ProductPricingData {
  id: number;
  company_id: string;
  product_id: string;
  selling_price: string;
  created_at: string;
  updated_at: string;
  discount_applicability_id: number | null;
  product: {
    id: number;
    name: string;
    description: string | null;
    currency_code: string;
    created_at: string;
    category_id: string;
    is_service: boolean;
    base_price: string;
    updated_at: string;
    deleted_at: string | null;
    category: {
      id: number;
      name: string;
      description: string | null;
      parent_id: number | null;
      created_at: string;
      updated_at: string;
    };
  };
  discount_applicability: unknown;
}

export interface ProductPricingCreateUpdatePayload {
  product_id: string;
  selling_price: string;
  company_id?: number;
}

export interface CustomerProductPricingCreatePayload {
  product_id: string;
  selling_price: string;
}

export interface CustomerProductPricingDataItem {
  product_id: number;
  selling_price: number;
  discount_applicability_id: number | null;
  custom_description: string;
  is_active: boolean;
  renewal_start_date: string;
  renewal_end_date: string;
  status: "Active" | "Trial" | "In Progress" | "Suspended" | "Inactive";
  billing_cycle: "one time" | "monthly" | "quarterly" | "yearly";
  subscriptions: number;
  base_price?: number;
  final_price?: number;
  product?: ProductData;
}

export interface CustomerProductPricingBulkPayload {
  pricing_data: CustomerProductPricingDataItem[];
}

export interface CustomerProductPricingUpsertPayload {
  product_id: string;
  selling_price: number;
  custom_description: string | null;
  is_active: boolean;
  discount_applicability_id: number | null;
  renewal_start_date: string | null;
  renewal_end_date: string | null;
  status: CustomerProductPricingDataItem["status"];
  billing_cycle: CustomerProductPricingDataItem["billing_cycle"];
  subscriptions: number;
}

export interface CustomerProductPricingListParams extends PaginationParams {
  search?: string;
  status?: string;
  billing_cycle?: string;
  sort_order?: string;
  /** Filter subscriptions with renewal period on/after this date (YYYY-MM-DD). */
  renewal_start_date?: string;
  /** Filter subscriptions with renewal period on/before this date (YYYY-MM-DD). */
  renewal_end_date?: string;
}

export const getCustomerProductPricingList = async (
  customer: IdLike,
  params: CustomerProductPricingListParams = {},
): Promise<ProductPricingData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/customers/${customer}/product-pricing-list`,
      { params },
    );
    return extractData<ProductPricingData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch customer product pricing list");
    throw error;
  }
};

export const createCustomerProductPricing = async (
  customer: IdLike,
  data: CustomerProductPricingCreatePayload,
): Promise<ProductPricingData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/customers/${customer}/product-pricing-list`,
      data,
    );
    return extractData<ProductPricingData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create customer product pricing");
    throw error;
  }
};

export const createCustomerProductPricingBulk = async (
  customer: IdLike,
  data: CustomerProductPricingBulkPayload,
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/customers/${customer}/product-pricing/bulk-update`,
      data,
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create customer product pricing");
    throw error;
  }
};

export const upsertCustomerProductPricing = async (
  customer: IdLike,
  data: CustomerProductPricingUpsertPayload,
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/customers/${customer}/product-pricing`,
      data,
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update customer product pricing");
    throw error;
  }
};


export const deleteCustomerProductPricing = async (
  customer: IdLike,
  productId: IdLike,
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/customers/${customer}/product-pricing/${productId}`,
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete customer product pricing");
    throw error;
  }
};

export interface PaginationParams extends Record<string, any> {
  page?: number;
  per_page?: number;
  limit?: number;
}

// Unwrap legacy `{ code, data }` or direct success envelopes (see accountingResponseHelpers).
function extractData<T>(response: any): T {
  return extractAccountingApiData<T>(response);
}

/** `env.data` may be a bare list or `{ data: rows, pagination?, summary? }`. */
function listRowsFromEnvelopePayload(raw: unknown): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw != null && typeof raw === "object" && "data" in raw) {
    const inner = (raw as { data: unknown }).data;
    return Array.isArray(inner) ? inner : [];
  }
  return [];
}

function paginationFromAccountingEnvelope(
  env: Record<string, any>,
  raw: unknown,
): Record<string, any> {
  if (
    !Array.isArray(raw) &&
    raw != null &&
    typeof raw === "object" &&
    "pagination" in raw
  ) {
    const nested = (raw as { pagination?: Record<string, any> }).pagination;
    if (nested != null && typeof nested === "object") {
      return nested;
    }
  }
  const fromEnv = env.pagination;
  return fromEnv != null && typeof fromEnv === "object" ? fromEnv : {};
}

function summaryFromAccountingEnvelope(
  env: Record<string, any>,
  raw: unknown,
): unknown {
  if (env.summary !== undefined && env.summary !== null) {
    return env.summary;
  }
  if (
    !Array.isArray(raw) &&
    raw != null &&
    typeof raw === "object" &&
    "summary" in raw
  ) {
    return (raw as { summary: unknown }).summary;
  }
  return undefined;
}

// Reseller Management
export const getResellers = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ResellerData>> => {
  try {
    const response = await axiosInstance.get("/accounting/resellers", {
      params,
    });
    const extractedData = extractData<PaginationWrapper<ResellerData>>(
      response.data
    );

    // Transform the response to match our interface
    return {
      data: extractedData.data,
      summary: extractedData.summary,
      pagination: extractedData.pagination,
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch resellers");
    throw error;
  }
};



export const getReseller = async (id: number): Promise<ResellerData> => {
  try {
    const response = await axiosInstance.get(`/accounting/resellers/${id}`);
    return extractData<ResellerData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch reseller");
    throw error;
  }
};




// Company Management
export const getCompanies = async (
  params: PaginationParams & { load_profile?: boolean } = {}
): Promise<PaginationWrapper<CompanyData>> => {
  try {
    const response = await axiosInstance.get("/accounting/company", { params });

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const raw = env.data;
      const companiesData = listRowsFromEnvelopePayload(raw) as CompanyData[];
      const pg = paginationFromAccountingEnvelope(env, raw);
      return {
        data: companiesData,
        summary: summaryFromAccountingEnvelope(env, raw),
        pagination: {
          current_page: pg.page || 1,
          page: pg.page || 1,
          limit: pg.limit || companiesData.length,
          per_page: pg.limit || companiesData.length,
          total: pg.total || companiesData.length,
          last_page: pg.last_page || 1,
          from: pg.from || 1,
          to: pg.to || companiesData.length,
        },
      };
    }

    const companiesData = extractData<CompanyData[]>(response.data);
    const peeled = peelAccountingResponseBody(response.data);
    return {
      data: companiesData,
      summary: peeled?.summary,
      pagination: {
        current_page: 1,
        per_page: companiesData.length,
        total: companiesData.length,
        last_page: 1,
        from: 1,
        to: companiesData.length,
        page: 1,
        limit: companiesData.length,
      },
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch companies");
    throw error;
  }
};



export const getAvailableExtensions = async (
  companyId: number
): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/company/available-extensions/${companyId}`
    );
    return extractData<any[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch available extensions");
    throw error;
  }
};

export const generateFacCode = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/company/generate-fac-code",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to generate FAC code");
    throw error;
  }
};

export const createUpdateCompany = async (data: any): Promise<CompanyData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/company/create-update",
      data
    );
    return extractData<CompanyData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create/update company");
    throw error;
  }
};

export const deleteCompany = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/company/delete/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete company");
    throw error;
  }
};

export const getCompany = async (id: number): Promise<CompanyData> => {
  try {
    const response = await axiosInstance.get(`/accounting/company/${id}`);
    return extractData<CompanyData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch company");
    throw error;
  }
};


export const createDiscountApplicability = async (
  companyId: number,
  data: DiscountApplicabilityCreateUpdatePayload
): Promise<DiscountApplicabilityData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/company/${companyId}/discount-applicability`,
      { ...data, company_id: companyId }
    );
    return extractData<DiscountApplicabilityData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create discount applicability");
    throw error;
  }
};

export const updateDiscountApplicability = async (
  companyId: number,
  applicabilityId: number,
  data: DiscountApplicabilityCreateUpdatePayload
): Promise<DiscountApplicabilityData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/company/${companyId}/discount-applicability/${applicabilityId}`,
      { ...data, company_id: companyId }
    );
    return extractData<DiscountApplicabilityData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update discount applicability");
    throw error;
  }
};

export const deleteDiscountApplicability = async (
  companyId: number,
  applicabilityId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/company/${companyId}/discount-applicability/${applicabilityId}`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete discount applicability");
    throw error;
  }
};





// Invoice Management
export const getInvoices = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<any>> => {
  try {
    const response = await axiosInstance.get("/accounting/invoices", {
      params,
    });

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const raw = env.data;
      const rows = listRowsFromEnvelopePayload(raw);
      const pg = paginationFromAccountingEnvelope(env, raw);
      return {
        data: rows,
        summary: summaryFromAccountingEnvelope(env, raw),
        pagination: {
          current_page: pg.page || 1,
          page: pg.page || 1,
          limit: pg.limit || rows.length,
          per_page: pg.per_page ?? pg.limit,
          total: pg.total ?? rows.length,
          last_page: pg.last_page || 1,
          from: pg.from ?? 1,
          to: pg.to ?? rows.length,
        },
      };
    }

    return extractData<PaginationWrapper<InvoiceData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch invoices");
    throw error;
  }
};

export const createInvoice = async (
  data: InvoiceCreateUpdateAPIPayload
): Promise<InvoiceData> => {
  try {
    const response = await axiosInstance.post("/accounting/invoices", data);
    return extractData<InvoiceData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create invoice");
    throw error;
  }
};

export const getInvoice = async (id: number): Promise<InvoiceData> => {
  try {
    const response = await axiosInstance.get(`/accounting/invoices/${id}`);
    return extractData<InvoiceData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch invoice");
    throw error;
  }
};
export interface InvoicePaymentPayload {
  invoice_id: number;
  payment_method: "stripe" | "bank_transfer" | "cash" | "check";
  payment_mode: "one_time" | "recurring";
  amount: number;
  payment_method_id: string;
  notes?: string;
}

export const payInvoice = async (payload: InvoicePaymentPayload): Promise<any> => {
  try {
    const response = await axiosInstance.post(`/accounting/invoices/pay`, payload);
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to process payment");
    throw error;
  }
};

export const getInvoiceDetails = async (id: number): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/invoices/${id}/details`
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch invoice details");
    throw error;
  }
};

export const generateInvoicePdf = async (id: number): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(`/accounting/invoices/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to generate invoice PDF");
    throw error;
  }
};

export const downloadInvoicePdf = async (id: number): Promise<void> => {
  try {
    const response = await axiosInstance.get(`/accounting/invoices/${id}/download-pdf`,  {
      responseType: "blob",
      headers: {
        Accept: "blob",
      },
    });
    
    // Check if response is valid
    // if (!response.data || response.data.size === 0) {
    //   throw new Error('Empty PDF response received');
    // }
    
    // Extract filename from content-disposition header if available
    let filename = `invoice-${id}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const extracted = filenameMatch?.[1];
      if (extracted) {
        filename = extracted.replaceAll(/['"]/g, "");
      }
    }
    
    // response.data is already a blob when responseType is "blob"
    const blob = response.data;
    
    // Verify blob type
    if (blob.type !== 'application/pdf') {
      console.warn('Unexpected blob type:', blob.type, 'Expected: application/pdf');
    }
    
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
    toast.success('PDF downloaded successfully');
  } catch (error: any) {
    console.error('PDF download error:', error);
    toast.error(error?.message || "Failed to download invoice PDF");
    throw error;
  }
};


export const downloadExpensePdf = async (id: number): Promise<void> => {
  try {
    const response = await axiosInstance.get(`/accounting/expenses/${id}/download-pdf`,  {
      responseType: "blob",
      headers: {
        Accept: "blob",
      },
    });
    
    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error('Empty PDF response received');
    }
    
    // Extract filename from content-disposition header if available
    let filename = `expense-${id}.pdf`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const extracted = filenameMatch?.[1];
      if (extracted) {
        filename = extracted.replaceAll(/['"]/g, "");
      }
    }
    
    // response.data is already a blob when responseType is "blob"
    const blob = response.data;
    
    // Verify blob type
    if (blob.type !== 'application/pdf') {
      console.warn('Unexpected blob type:', blob.type, 'Expected: application/pdf');
    }
    
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
    toast.success('PDF downloaded successfully');
  } catch (error: any) {
    console.error('PDF download error:', error);
    toast.error(error?.message || "Failed to download expense PDF");
    throw error;
  }
};

export const downloadTemplate = async (): Promise<void> => {
  try {
    const response = await axiosInstance.get(`/accounting/company/template/download`,  {
      responseType: "blob",
      headers: {
        Accept: "blob",
      },
    });
    
    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error('Empty response received');
    }
    
    // Extract filename from content-disposition header if available
    let filename = `company-template.csv`;
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const extracted = filenameMatch?.[1];
      if (extracted) {
        filename = extracted.replaceAll(/['"]/g, "");
      }
    }
    
    // response.data is already a blob when responseType is "blob"
    const blob = response.data;
    
    // Verify blob type
    
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    globalThis.URL.revokeObjectURL(url);
    
  } catch (error: any) {
    console.error('PDF download error:', error);
    toast.error(error?.message || "Failed to download File");
    throw error;
  }
};

export const updateInvoice = async (
  id: number,
  data: InvoiceCreateUpdateAPIPayload
): Promise<InvoiceData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/invoices/${id}`,
      data
    );
    return extractData<InvoiceData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update invoice");
    throw error;
  }
};

export const deleteInvoice = async (id: number): Promise<void> => {
    const response = await axiosInstance.delete(`/accounting/invoices/${id}`);
    const result = extractData<any>(response.data);
    if(result?.success === true){
      return result;
    }
    throw new Error(result?.message);
};

// Expense Management
export const getExpenses = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ExpenseData>> => {
  try {
    const response = await axiosInstance.get("/accounting/expenses", {
      params,
    });

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const d = env.data;
      const expenseRows = Array.isArray(d) ? d : d?.data ?? [];
      const meta =
        Array.isArray(d) || d == null || typeof d !== "object"
          ? env.pagination ?? {}
          : d;
      const pg = meta && typeof meta === "object" ? meta : {};
      return {
        data: expenseRows,
        summary: env.summary,
        pagination: {
          current_page: pg.current_page || pg.page || 1,
          page: pg.page || pg.current_page || 1,
          limit: pg.limit || expenseRows.length,
          per_page: pg.per_page,
          total: pg.total ?? expenseRows.length,
          last_page: pg.last_page || 1,
          from: pg.from ?? 1,
          to: pg.to ?? expenseRows.length,
        },
      };
    }

    return extractData<PaginationWrapper<ExpenseData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch expenses");
    throw error;
  }
};

export const createExpense = async (
  data: ExpenseCreateUpdatePayload | FormData
): Promise<ExpenseData> => {
  try {
    const response = await axiosInstance.post("/accounting/expenses", data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : {},
    });
    return extractData<ExpenseData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create expense");
    throw error;
  }
};

export const uploadCompanyFile = async (
  data:FormData
): Promise<ExpenseData> => {
  try {
    const response = await axiosInstance.post("/accounting/company/file/upload", data, {
      headers:
        data instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : {},
    });
    
    const peeled = peelAccountingResponseBody(response.data) ?? response.data;
    if (
      typeof peeled === "object" &&
      peeled !== null &&
      peeled.success === false
    ) {
      throw new Error(
        typeof peeled.message === "string" && peeled.message.trim()
          ? peeled.message
          : "File upload failed",
      );
    }

    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload company file");
    throw error;
  }
};

export const getExpense = async (id: number): Promise<ExpenseData> => {
  try {
    const response = await axiosInstance.get(`/accounting/expenses/${id}`);
    return extractData<ExpenseData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch expense");
    throw error;
  }
};

export const updateExpense = async (
  id: number,
  data: ExpenseCreateUpdatePayload | FormData
): Promise<ExpenseData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/expenses/${id}`,
      data,
      {
        headers:
          data instanceof FormData
            ? { "Content-Type": "multipart/form-data" }
            : {},
      }
    );
    return extractData<ExpenseData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update expense");
    throw error;
  }
};

export const deleteExpense = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/expenses/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete expense");
    throw error;
  }
};

export const downloadReceipt = async (id: number): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/expenses/${id}/receipt`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to download receipt");
    throw error;
  }
};

export const downloadFile = async (
  id: number,
  fileIndex: number
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/expenses/${id}/files/${fileIndex}`,
      {
        responseType: "blob",
        headers: {
          Accept: "blob",
        },
      }
    );
    
    // Extract filename from content-disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = `receipt_${id}_${fileIndex}`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    return {
      blob: response.data,
      filename: filename
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to download file");
    throw error;
  }
};




export const getProductsWithCompanyPricing = async (
  companyId?: number,
  params: PaginationParams = {}
): Promise<ProductData[]> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/products/with-company-pricing",
      { params: { ...params, company_id: companyId } }
    );
    return extractData<PaginationWrapper<ProductData>>(response.data) as any;
  } catch (error: any) {
    toast.error(
      error?.message || "Failed to fetch products with company pricing"
    );
    throw error;
  }
};


// Product Management
export const getProducts = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductData>> => {
  try {
    const response = await axiosInstance.get("/accounting/list-products", {
      params: { ...params },
    });

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const rawList = env.data;
      const productsData = listRowsFromEnvelopePayload(rawList) as ProductData[];
      const pg = paginationFromAccountingEnvelope(env, rawList);
      return {
        summary: summaryFromAccountingEnvelope(env, rawList),
        data: productsData,
        pagination: {
          current_page: pg.page || 1,
          page: pg.page || 1,
          limit: pg.limit || productsData.length,
          per_page: pg.limit || productsData.length,
          total: pg.total || productsData.length,
          last_page: pg.last_page || 1,
          from: pg.from || 1,
          to: pg.to || productsData.length,
        },
      };
    }

    const extracted = extractData<ProductData[]>(response.data);
    const productsData = Array.isArray(extracted) ? extracted : [];
    const peeled = peelAccountingResponseBody(response.data);
    return {
      data: productsData,
      summary: peeled?.summary,
      pagination: {
        current_page: 1,
        page: 1,
        limit: productsData.length,
        per_page: productsData.length,
        total: productsData.length,
        last_page: 1,
        from: 1,
        to: productsData.length,
      },
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch products");
    throw error;
  }
};

export const createProduct = async (
  data: ProductCreateUpdatePayload
): Promise<ProductData> => {
  try {
    const isMultipart = data.logo_file instanceof File;
    const body = isMultipart ? buildProductMultipartBody(data) : data;
    const response = await axiosInstance.post("/accounting/products", body, {
      headers:
        body instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    });
    return extractData<ProductData>(response.data);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to create product"));
    throw error;
  }
};

export const getProductCategoriesList = async (
  params: PaginationParams = {},
): Promise<PaginationWrapper<ProductCategoryData>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/products/categories-list",
      { params },
    );

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const raw = env.data;
      const categoriesData = listRowsFromEnvelopePayload(raw) as ProductCategoryData[];
      const pg = paginationFromAccountingEnvelope(env, raw);
      return {
        data: categoriesData,
        summary: summaryFromAccountingEnvelope(env, raw),
        pagination: {
          current_page: pg.page || 1,
          page: pg.page || 1,
          limit: pg.limit || categoriesData.length,
          per_page: pg.limit || categoriesData.length,
          total: pg.total ?? categoriesData.length,
          last_page: pg.last_page || 1,
          from: pg.from || 1,
          to: pg.to || categoriesData.length,
        },
      };
    }

    const categoriesData = extractData<ProductCategoryData[]>(response.data);
    const peeled = peelAccountingResponseBody(response.data);
    return {
      data: Array.isArray(categoriesData) ? categoriesData : [],
      summary: peeled?.summary,
      pagination: {
        current_page: 1,
        page: 1,
        limit: Array.isArray(categoriesData) ? categoriesData.length : 0,
        per_page: Array.isArray(categoriesData) ? categoriesData.length : 0,
        total: Array.isArray(categoriesData) ? categoriesData.length : 0,
        last_page: 1,
        from: 1,
        to: Array.isArray(categoriesData) ? categoriesData.length : 0,
      },
    };
  } catch (error: unknown) {
    toast.error(
      getAccountsAxiosErrorMessage(error, "Failed to fetch product categories list"),
    );
    throw error;
  }
};

export const createProductCategory = async (
  data: ProductCategoryCreateUpdatePayload
): Promise<ProductCategoryData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/products/categories",
      data
    );
    return extractData<ProductCategoryData>(response.data);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to create product category"));
    throw error;
  }
};

export const updateProductCategory = async (
  id: number,
  data: ProductCategoryCreateUpdatePayload
): Promise<ProductCategoryData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/products/categories/${id}`,
      data
    );
    return extractData<ProductCategoryData>(response.data);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to update product category"));
    throw error;
  }
};

export const deleteProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/products/categories/${id}`);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to delete product category"));
    throw error;
  }
};

export const softDeleteProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(
      `/accounting/products/categories/${id}/soft-delete`
    );
  } catch (error: unknown) {
    toast.error(
      getAccountsAxiosErrorMessage(error, "Failed to soft delete product category"),
    );
    throw error;
  }
};

export const restoreProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/products/categories/${id}/restore`);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to restore product category"));
    throw error;
  }
};

export const getProduct = async (id: number): Promise<ProductData> => {
  try {
    const response = await axiosInstance.get(`/accounting/products/${id}`);
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product");
    throw error;
  }
};

export const updateProduct = async (
  id: number,
  data: ProductCreateUpdatePayload
): Promise<ProductData> => {
  try {
    const isMultipart = data.logo_file instanceof File;
    const body = isMultipart ? buildProductMultipartBody(data) : data;
    const response = await axiosInstance.post(
      `/accounting/products/${id}`,
      body,
      {
        headers:
          body instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
      },
    );
    return extractData<ProductData>(response.data);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to update product"));
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/products/${id}`);
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to delete product"));
    throw error;
  }
};




// Product Categories (separate from products)
export const getProductCategories = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductCategoryData>> => {
  try {
    const response = await axiosInstance.get("/accounting/product-categories", {
      params,
    });

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const raw = env.data;
      const categoriesData = listRowsFromEnvelopePayload(raw) as ProductCategoryData[];
      const pg = paginationFromAccountingEnvelope(env, raw);
      return {
        data: categoriesData,
        summary: summaryFromAccountingEnvelope(env, raw),
        pagination: {
          current_page: pg.page || 1,
          page: pg.page || 1,
          limit: pg.limit || categoriesData.length,
          per_page: pg.limit || categoriesData.length,
          total: pg.total || categoriesData.length,
          last_page: pg.last_page || 1,
          from: pg.from || 1,
          to: pg.to || categoriesData.length,
        },
      };
    }

    const categoriesData = extractData<ProductCategoryData[]>(response.data);
    const peeled = peelAccountingResponseBody(response.data);
    return {
      data: categoriesData,
      summary: peeled?.summary,
      pagination: {
        current_page: 1,
        page: 1,
        limit: categoriesData.length,
        per_page: categoriesData.length,
        total: categoriesData.length,
        last_page: 1,
        from: 1,
        to: categoriesData.length,
      },
    };
  } catch (error: unknown) {
    toast.error(getAccountsAxiosErrorMessage(error, "Failed to fetch product categories"));
    throw error;
  }
};

// Stripe Payment Methods

// Stripe Payment Methods
export const getPaymentMethods = async (
  profileId: number
): Promise<PaymentMethodData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/stripe/payment-methods/${profileId}`
    );

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const d = env.data as { payment_methods?: unknown } | unknown[] | null;
      const rawList =
        d != null && typeof d === "object" && !Array.isArray(d) && "payment_methods" in d
          ? (d as { payment_methods: unknown[] }).payment_methods
          : d;
      const paymentMethods = Array.isArray(rawList) ? rawList : [];

      // Transform the response to match our PaymentMethodData interface
      return paymentMethods.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : undefined,
        bank_account: pm.bank_account
          ? {
              bank_name: pm.bank_account.bank_name,
              last4: pm.bank_account.last4,
              routing_number: pm.bank_account.routing_number,
            }
          : undefined,
        billing_details: pm.billing_details
          ? {
              name: pm.billing_details.name,
            }
          : undefined,
        is_default: pm.is_default,
        created_at: new Date(pm.created * 1000).toISOString(), // Convert Unix timestamp to ISO string
      }));
    }

    // Fallback to extractData if structure is different
    return extractData<PaymentMethodData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch payment methods");
    throw error;
  }
};
export const getCustomerPaymentMethods = async (
  profileId: number
): Promise<PaymentMethodData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/stripe/payment-methods/customer/${profileId}`
    );

    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      const d = env.data as { payment_methods?: unknown } | unknown[] | null;
      const rawList =
        d != null && typeof d === "object" && !Array.isArray(d) && "payment_methods" in d
          ? (d as { payment_methods: unknown[] }).payment_methods
          : d;
      const paymentMethods = Array.isArray(rawList) ? rawList : [];

      // Transform the response to match our PaymentMethodData interface
      return paymentMethods.map((pm: any) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : undefined,
        bank_account: pm.bank_account
          ? {
              bank_name: pm.bank_account.bank_name,
              last4: pm.bank_account.last4,
              routing_number: pm.bank_account.routing_number,
            }
          : undefined,
        billing_details: pm.billing_details
          ? {
              name: pm.billing_details.name,
            }
          : undefined,
        is_default: pm.is_default,
        created_at: new Date(pm.created * 1000).toISOString(), // Convert Unix timestamp to ISO string
      }));
    }

    // Fallback to extractData if structure is different
    return extractData<PaymentMethodData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch payment methods");
    throw error;
  }
};
export const createPaymentMethod = async (
  profileId: number,
  data: any
): Promise<PaymentMethodData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/stripe/payment-methods/${profileId}`,
      data
    );
    return extractData<PaymentMethodData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create payment method");
    throw error;
  }
};

export const updatePaymentMethod = async (
  paymentMethodId: string,
  data: any
): Promise<PaymentMethodData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/stripe/payment-methods/${paymentMethodId}`,
      data
    );
    return extractData<PaymentMethodData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update payment method");
    throw error;
  }
};

export const deletePaymentMethod = async (
  paymentMethodId: string
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/stripe/payment-methods/${paymentMethodId}`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete payment method");
    throw error;
  }
};

export const setDefaultPaymentMethod = async (
  profileId: number,
  paymentMethodId: string
): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/stripe/set-default/${profileId}`, {
      payment_method_id: paymentMethodId,
    });
  } catch (error: any) {
    toast.error(error?.message || "Failed to set default payment method");
    throw error;
  }
};

export const validateCard = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/stripe/validate-card",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to validate card");
    throw error;
  }
};

export const testCardValidation = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/stripe/test-card-validation"
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to test card validation");
    throw error;
  }
};

export const createPaymentMethodWithElements = async (
  profileId: number,
  data: any
): Promise<PaymentMethodData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/stripe/create-payment-method/${profileId}`,
      data
    );
    return extractData<PaymentMethodData>(response.data);
  } catch (error: any) {
    toast.error(
      error?.message || "Failed to create payment method with elements"
    );
    throw error;
  }
};

export const createAndConfirmPaymentMethod = async (
  profileId: number,
  data: any
): Promise<PaymentMethodData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/stripe/create-and-confirm-payment-method/${profileId}`,
      data
    );

    const env = accountingEnvelopeSuccess(response.data);
    if (env?.data != null) {
      const pm = env.data as Record<string, any>;

      // Transform the response to match our PaymentMethodData interface
      return {
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              exp_month: pm.card.exp_month,
              exp_year: pm.card.exp_year,
            }
          : undefined,
        bank_account: pm.bank_account
          ? {
              bank_name: pm.bank_account.bank_name,
              last4: pm.bank_account.last4,
              routing_number: pm.bank_account.routing_number,
            }
          : undefined,
        billing_details: pm.billing_details
          ? {
              name: pm.billing_details.name,
            }
          : undefined,
        is_default: pm.is_default,
        created_at: new Date(pm.created * 1000).toISOString(), // Convert Unix timestamp to ISO string
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaymentMethodData>(response.data);
  } catch (error: any) {
    toast.error(
      error?.message || "Failed to create and confirm payment method"
    );
    throw error;
  }
};

export const savePaymentMethod = async (
  data: any
): Promise<PaymentMethodData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/stripe/save-payment-method",
      data
    );
    return extractData<PaymentMethodData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to save payment method");
    throw error;
  }
};

export const getPublishableKey = async (): Promise<string> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/stripe/publishable-key"
    );
    return extractData<string>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to get publishable key");
    throw error;
  }
};





// Direct Payment Interfaces
export interface CreateDirectPaymentData {
  invoice_id: number;
  payment_method: string;
  payment_mode: string;
  amount: number;
  processing_fee: number;
  base_amount: number;
  payment_method_id: string;
  currency_code: string;
  /** Lowercase currency (kept for API compatibility). */
  currency: string;
  notes: string;
  customer_id: number;
}

// Payment Intent Response Interface
export interface PaymentIntentResponse {
  id: string;
  status: 'succeeded' | 'requires_action' | 'requires_payment_method' | 'canceled';
  client_secret: string;
  amount: number;
  currency: string;
}

// API Response Interface
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface CustomerData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  company_id?: number | string | null;
  crm_company_id?: number | string | null;
  stripe_customer_id?: string | null;
  profile?: Record<string, any>;
}

export interface CustomerCreatePayload {
  [key: string]: any;
}

export interface CustomerUpdatePayload {
  name?: string;
  crm_company_id?: string | number;
  phone?: string;
  email?: string;
  /** Send only keys that changed; backend should merge into existing profile. */
  profile?: Record<string, unknown>;
  [key: string]: any;
}

export const getCustomers = async (
  params: PaginationParams = {},
): Promise<PaginationWrapper<CustomerData>> => {
  try {
    const response = await axiosInstance.get("/accounting/customers", { params });
    return extractData<PaginationWrapper<CustomerData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch customers");
    throw error;
  }
};

export const createCustomer = async (
  data: CustomerCreatePayload,
): Promise<CustomerData> => {
  try {
    const response = await axiosInstance.post("/accounting/customers", data);
    return extractData<CustomerData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create customer");
    throw error;
  }
};

export const updateCustomer = async (
  customer: number | string,
  data: CustomerUpdatePayload,
): Promise<CustomerData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/customers/${customer}`,
      data,
    );
    return extractData<CustomerData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update customer");
    throw error;
  }
};

export const deleteCustomer = async (
  customer: number | string,
): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/customers/${customer}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete customer");
    throw error;
  }
};

export const getCustomer = async (
  customer: number | string,
): Promise<CustomerData> => {
  try {
    const response = await axiosInstance.get(`/accounting/customers/${customer}`, {
      /** Without this, axios rejects on 404 and you never get `response.data` in this block. */
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
    const raw = response.data;
    const envelope = peelAccountingResponseBody(raw);
    if (
      envelope != null &&
      typeof envelope === "object" &&
      !Array.isArray(envelope) &&
      envelope.success === false
    ) {
      return envelope as unknown as CustomerData;
    }

    return extractData<CustomerData>(raw);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch customer");
    throw error;
  }
};

// Create direct payment function
export const createDirectPayment = async (data: CreateDirectPaymentData): Promise<PaymentIntentResponse> => {
  try {
    const response = await axiosInstance.post(
      '/accounting/stripe/create-payment-intent',
      data
    );
    
    const env = accountingEnvelopeSuccess(response.data);
    if (env != null) {
      return env as PaymentIntentResponse;
    }

    return extractData<PaymentIntentResponse>(response.data);
  } catch (error: any) {
    console.log(error, "error.createDirectPayment");
    toast.error(error?.message || "Failed to create direct payment");
    throw error;
  }
};


