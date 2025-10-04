import { toast } from "react-toastify";
import axiosInstance from "./axios";

// API Response Structure from Controlhub
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
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

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
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  currency_code: string;
  exchange_rate: string;
  notes: string | null;
  terms_conditions: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_end_date: string | null;
  parent_invoice_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  payment_mode: string;
  company: CompanyData;
  reseller: ResellerData | null;
  items: InvoiceItemData[];
  payments: InvoicePaymentData[];
}

export interface InvoiceCreateUpdatePayload {
  company_id: string;
  invoice_date: string;
  due_date: string;
  payment_mode: string;
  currency_code: string;
  exchange_rate: string;
  tax_amount: number;
  notes: string;
  terms_conditions: string;
  items: InvoiceItemCreateUpdatePayload[];
  subtotal: number;
  total_amount: number;
}

export interface InvoiceItemCreateUpdatePayload {
  product_id: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
}

export interface ExpenseData {
  id: number;
  company_id: number | null;
  vendor_id: number | null;
  category_id: string;
  expense_number: string | null;
  expense_date: string;
  description: string;
  amount: string;
  currency_code: string;
  exchange_rate: string;
  tax_amount: string;
  tax_type: "amount" | "percentage";
  total_amount: string;
  payment_method: string | null;
  payment_status: "pending" | "paid" | "failed" | "cancelled";
  receipt_path: string | null;
  notes: string | null;
  is_billable: string;
  service_id: number | null;
  created_at: string;
  updated_at: string;
  files: {
    name: string;
    path: string;
    size: number;
    type: string;
    uploaded_at: string;
  }[];
  vendor: any | null;
  category: ExpenseCategoryData;
  service: any | null;
  currency: string;
}

export interface ExpenseCategoryData {
  id: number;
  company_id: number | null;
  name: string;
  description: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  company?: any | null;
  expenses?: ExpenseData[];
}

export interface ExpenseCreateUpdatePayload {
  category_id: string;
  expense_date: string;
  description: string;
  amount: string;
  tax_amount: string;
  tax_type: "amount" | "percentage";
  total_amount: string;
  currency: string;
}

export interface ExpenseCategoryCreateUpdatePayload {
  name: string;
  description: string;
  color: string;
  is_active: boolean;
}

export interface ProductData {
  id: number;
  name: string;
  description?: string;
  currency_code: string;
  is_active: boolean;
  created_at: string;
  category_id: string;
  is_service: boolean;
  base_price: string;
  updated_at: string;
  deleted_at: string | null;
  invoice_items: any[];
  category?: ProductCategoryData;
}

export interface ProductCategoryData {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
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
  is_active: boolean;
}

export interface ProductCreateUpdatePayload {
  name: string;
  description?: string;
  category_id: string;
  base_price: string;
  is_active: boolean;
  is_service: boolean;
}

export interface InventoryData {
  id: number;
  company_id: number | null;
  name: string;
  description?: string;
  base_price: string;
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
  status: "in_stock" | "low_stock" | "out_of_stock";
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
  category_id: string;
  location_id?: number | null;
  supplier_id?: number | null;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point?: number | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
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
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventorySupplierCreateUpdatePayload {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
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
    is_active: boolean;
    created_at: string;
    updated_at: string;
    discount_applicability_id: string;
    product: {
      id: number;
      name: string;
      description: string;
      currency_code: string;
      is_active: boolean;
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
}

export interface ProductPricingData {
  id: number;
  company_id: string;
  product_id: string;
  selling_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  discount_applicability_id: number | null;
  product: {
    id: number;
    name: string;
    description: string | null;
    currency_code: string;
    is_active: boolean;
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
      is_active: boolean;
      parent_id: number | null;
      created_at: string;
      updated_at: string;
    };
  };
  discount_applicability: any | null;
}

export interface ProductPricingCreateUpdatePayload {
  product_id: string;
  selling_price: string;
  is_active: boolean;
}

export interface PaginationParams extends Record<string, any> {
  page?: number;
  per_page?: number;
  search?: string;
}

// Helper function to extract data from controlhub response
function extractData<T>(response: any): T {
  console.log("Extracting data from response:", response);

  // Handle successful response with nested data structure
  if (response?.code === 200 && response?.data?.success) {
    console.log("Extracting from nested data structure:", response.data.data);
    return response.data.data;
  }

  // Handle direct data response (fallback)
  if (response?.data) {
    console.log("Extracting from direct data:", response.data);
    return response.data;
  }

  console.error("Failed to extract data from response:", response);

  throw new Error(
    response?.data?.message || response?.message || "API request failed"
  );
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
      pagination: extractedData.pagination,
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch resellers");
    throw error;
  }
};

export const createReseller = async (
  data: Partial<ResellerData>
): Promise<ResellerData> => {
  try {
    const response = await axiosInstance.post("/accounting/resellers", data);
    return extractData<ResellerData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create reseller");
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

export const updateReseller = async (
  id: number,
  data: Partial<ResellerData>
): Promise<ResellerData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/resellers/${id}`,
      data
    );
    return extractData<ResellerData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update reseller");
    throw error;
  }
};

export const deleteReseller = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/resellers/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete reseller");
    throw error;
  }
};

// Company Management
export const getCompanies = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<CompanyData>> => {
  try {
    const response = await axiosInstance.get("/accounting/company", { params });

    // Handle the actual API response structure based on your example
    if (response.data?.code === 200 && response.data?.data?.success) {
      const companiesData = response.data.data.data; // The company array
      return {
        data: companiesData,
        pagination: {
          current_page: response.data.data.pagination?.page || 1,
          per_page:
            response.data.data.pagination?.limit || companiesData.length,
          total: response.data.data.pagination?.total || companiesData.length,
          last_page: response.data.data.pagination?.last_page || 1,
          from: response.data.data.pagination?.from || 1,
          to: response.data.data.pagination?.to || companiesData.length,
        },
      };
    }

    // Fallback to extractData if structure is different
    const companiesData = extractData<CompanyData[]>(response.data);
    return {
      data: companiesData,
      pagination: {
        current_page: 1,
        per_page: companiesData.length,
        total: companiesData.length,
        last_page: 1,
        from: 1,
        to: companiesData.length,
      },
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch companies");
    throw error;
  }
};

export const importCompanies = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosInstance.post(
      "/accounting/company/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to import companies");
    throw error;
  }
};

export const exportCompanies = async (
  params: PaginationParams = {}
): Promise<Blob> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/company/export",
      params,
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to export companies");
    throw error;
  }
};

export const generateTemplate = async (): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/company/generate-template",
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to generate template");
    throw error;
  }
};

export const downloadTemplate = async (): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/company/download-template",
      {
        responseType: "blob",
      }
    );
    return response.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to download template");
    throw error;
  }
};

export const createUpdateProfile = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/company/create-update-profile",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create/update profile");
    throw error;
  }
};

export const createUpdateCallingAccess = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/company/create-update-calling-access",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create/update calling access");
    throw error;
  }
};

export const deleteCallingAccess = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/company/delete-calling-access/${id}`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete calling access");
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

// Discount Applicability
export const getDiscountApplicability = async (
  companyId: number
): Promise<DiscountApplicabilityData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/company/${companyId}/discount-applicability`
    );
    return extractData<DiscountApplicabilityData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch discount applicability");
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
      data
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
      data
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

export const getDiscountApplicabilityList = async (
  companyId: number,
  params: PaginationParams = {}
): Promise<PaginationWrapper<DiscountApplicabilityData>> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/company/${companyId}/discount-applicability-list`,
      { params }
    );

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The discount applicability array
        pagination: {
          current_page: response.data.data.pagination?.page || 1,
          per_page:
            response.data.data.pagination?.limit ||
            response.data.data.data.length,
          total:
            response.data.data.pagination?.total ||
            response.data.data.data.length,
          last_page: response.data.data.pagination?.last_page || 1,
          from: response.data.data.pagination?.from || 1,
          to:
            response.data.data.pagination?.to || response.data.data.data.length,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<DiscountApplicabilityData>>(
      response.data
    );
  } catch (error: any) {
    toast.error(
      error?.message || "Failed to fetch discount applicability list"
    );
    throw error;
  }
};

// Product Pricing
export const getProductPricingList = async (
  companyId: number,
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductPricingData>> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/company/${companyId}/product-pricing-list`,
      { params: { ...params, load_product: true } }
    );

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The product pricing array
        pagination: {
          current_page: response.data.data.pagination?.page || 1,
          per_page:
            response.data.data.pagination?.limit ||
            response.data.data.data.length,
          total:
            response.data.data.pagination?.total ||
            response.data.data.data.length,
          last_page: response.data.data.pagination?.last_page || 1,
          from: response.data.data.pagination?.from || 1,
          to:
            response.data.data.pagination?.to || response.data.data.data.length,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<ProductPricingData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product pricing list");
    throw error;
  }
};

export const getProductPricing = async (
  companyId: number
): Promise<ProductPricingData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/company/${companyId}/product-pricing`
    );
    return extractData<ProductPricingData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product pricing");
    throw error;
  }
};

export const updateProductPricing = async (
  companyId: number,
  data: ProductPricingCreateUpdatePayload
): Promise<ProductPricingData> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/company/${companyId}/product-pricing`,
      data
    );
    return extractData<ProductPricingData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product pricing");
    throw error;
  }
};

export const bulkUpdateProductPricing = async (
  companyId: number,
  data: ProductPricingCreateUpdatePayload[]
): Promise<ProductPricingData[]> => {
  try {
    const response = await axiosInstance.post(
      `/accounting/company/${companyId}/product-pricing/bulk-update`,
      data
    );
    return extractData<ProductPricingData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to bulk update product pricing");
    throw error;
  }
};

export const deleteProductPricing = async (
  companyId: number,
  productId: string
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/company/${companyId}/product-pricing/${productId}`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product pricing");
    throw error;
  }
};

// Invoice Management
export const getInvoices = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InvoiceData>> => {
  try {
    const response = await axiosInstance.get("/accounting/invoices", {
      params,
    });

    // Handle the nested response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The invoice array
        pagination: {
          current_page: response.data.data.pagination.page,
          per_page: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          last_page: response.data.data.pagination.last_page,
          from: response.data.data.pagination.from,
          to: response.data.data.pagination.to,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<InvoiceData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch invoices");
    throw error;
  }
};

export const createInvoice = async (
  data: InvoiceCreateUpdatePayload
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

export const updateInvoice = async (
  id: number,
  data: InvoiceCreateUpdatePayload
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
  try {
    await axiosInstance.delete(`/accounting/invoices/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete invoice");
    throw error;
  }
};

// Expense Management
export const getExpenses = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ExpenseData>> => {
  try {
    const response = await axiosInstance.get("/accounting/expenses", {
      params,
    });

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data.data, // The expense array (nested data)
        pagination: {
          current_page: response.data.data.data.current_page,
          per_page: response.data.data.data.per_page,
          total: response.data.data.data.total,
          last_page: response.data.data.data.last_page,
          from: response.data.data.data.from,
          to: response.data.data.data.to,
        },
      };
    }

    // Fallback to extractData if structure is different
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

// Expense Categories
export const getExpenseCategories = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ExpenseCategoryData>> => {
  try {
    const response = await axiosInstance.get("/accounting/expense-categories", {
      params,
    });

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The category array (direct data)
        pagination: {
          current_page: response.data.data.pagination.page,
          per_page: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          last_page: response.data.data.pagination.last_page,
          from: response.data.data.pagination.from,
          to: response.data.data.pagination.to,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<ExpenseCategoryData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch expense categories");
    throw error;
  }
};

export const createExpenseCategory = async (
  data: ExpenseCategoryCreateUpdatePayload
): Promise<ExpenseCategoryData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/expense-categories",
      data
    );
    return extractData<ExpenseCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create expense category");
    throw error;
  }
};

export const getExpenseCategory = async (
  id: number
): Promise<ExpenseCategoryData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/expense-categories/${id}`
    );
    return extractData<ExpenseCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch expense category");
    throw error;
  }
};

export const updateExpenseCategory = async (
  id: number,
  data: ExpenseCategoryCreateUpdatePayload
): Promise<ExpenseCategoryData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/expense-categories/${id}`,
      data
    );
    return extractData<ExpenseCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update expense category");
    throw error;
  }
};

export const deleteExpenseCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/expense-categories/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete expense category");
    throw error;
  }
};

export const softDeleteExpenseCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(
      `/accounting/expense-categories/${id}/soft-delete`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to soft delete expense category");
    throw error;
  }
};

export const restoreExpenseCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/expense-categories/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore expense category");
    throw error;
  }
};

// Product Management
export const getProducts = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductData>> => {
  try {
    const response = await axiosInstance.get("/accounting/products", {
      params,
    });

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      const productsData = response.data.data.data; // The product array
      return {
        data: productsData,
        pagination: {
          current_page: response.data.data.pagination?.page || 1,
          per_page: response.data.data.pagination?.limit || productsData.length,
          total: response.data.data.pagination?.total || productsData.length,
          last_page: response.data.data.pagination?.last_page || 1,
          from: response.data.data.pagination?.from || 1,
          to: response.data.data.pagination?.to || productsData.length,
        },
      };
    }

    // Fallback to extractData if structure is different
    const productsData = extractData<ProductData[]>(response.data);
    return {
      data: productsData,
      pagination: {
        current_page: 1,
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

export const getActiveProducts = async (): Promise<ProductData[]> => {
  try {
    const response = await axiosInstance.get("/accounting/products/active");
    return extractData<ProductData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch active products");
    throw error;
  }
};

export const getProductsWithCompanyPricing = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<ProductData>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/products/with-company-pricing",
      { params }
    );
    return extractData<PaginationWrapper<ProductData>>(response.data);
  } catch (error: any) {
    toast.error(
      error?.message || "Failed to fetch products with company pricing"
    );
    throw error;
  }
};

export const createProduct = async (
  data: ProductCreateUpdatePayload
): Promise<ProductData> => {
  try {
    const response = await axiosInstance.post("/accounting/products", data);
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create product");
    throw error;
  }
};

export const getProductCategoriesList = async (): Promise<
  ProductCategoryData[]
> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/products/categories-list"
    );
    return extractData<ProductCategoryData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product categories list");
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
  } catch (error: any) {
    toast.error(error?.message || "Failed to create product category");
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
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product category");
    throw error;
  }
};

export const deleteProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/products/categories/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product category");
    throw error;
  }
};

export const softDeleteProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(
      `/accounting/products/categories/${id}/soft-delete`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to soft delete product category");
    throw error;
  }
};

export const restoreProductCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/products/categories/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore product category");
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
    const response = await axiosInstance.put(
      `/accounting/products/${id}`,
      data
    );
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product");
    throw error;
  }
};

export const deleteProduct = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/products/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product");
    throw error;
  }
};

export const softDeleteProduct = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/products/${id}/soft-delete`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to soft delete product");
    throw error;
  }
};

export const restoreProduct = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/accounting/products/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore product");
    throw error;
  }
};

export const getProductWithPricing = async (
  productId: number,
  companyId: number
): Promise<ProductData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/products/${productId}/pricing/${companyId}`
    );
    return extractData<ProductData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product with pricing");
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

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      const categoriesData = response.data.data.data; // The category array
      return {
        data: categoriesData,
        pagination: {
          current_page: response.data.data.pagination?.page || 1,
          per_page:
            response.data.data.pagination?.limit || categoriesData.length,
          total: response.data.data.pagination?.total || categoriesData.length,
          last_page: response.data.data.pagination?.last_page || 1,
          from: response.data.data.pagination?.from || 1,
          to: response.data.data.pagination?.to || categoriesData.length,
        },
      };
    }

    // Fallback to extractData if structure is different
    const categoriesData = extractData<ProductCategoryData[]>(response.data);
    return {
      data: categoriesData,
      pagination: {
        current_page: 1,
        per_page: categoriesData.length,
        total: categoriesData.length,
        last_page: 1,
        from: 1,
        to: categoriesData.length,
      },
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product categories");
    throw error;
  }
};

export const createProductCategoryDirect = async (
  data: ProductCategoryCreateUpdatePayload
): Promise<ProductCategoryData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/product-categories",
      data
    );
    return extractData<ProductCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create product category");
    throw error;
  }
};

export const getProductCategory = async (
  id: number
): Promise<ProductCategoryData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/product-categories/${id}`
    );
    return extractData<ProductCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product category");
    throw error;
  }
};

export const updateProductCategoryDirect = async (
  id: number,
  data: ProductCategoryCreateUpdatePayload
): Promise<ProductCategoryData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/product-categories/${id}`,
      data
    );
    return extractData<ProductCategoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update product category");
    throw error;
  }
};

export const deleteProductCategoryDirect = async (
  id: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/product-categories/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete product category");
    throw error;
  }
};

// Stripe Payment Methods
export const getPaymentMethods = async (
  profileId: number
): Promise<PaymentMethodData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/stripe/payment-methods/${profileId}`
    );

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      const paymentMethods = response.data.data.data.payment_methods || [];

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

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      const pm = response.data.data.data;

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

// Inventory Management
export const getInventories = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InventoryData>> => {
  try {
    const response = await axiosInstance.get("/accounting/inventory", {
      params,
    });

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The inventory array (nested data)
        pagination: {
          current_page: response.data.data.pagination.page,
          per_page: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          last_page: response.data.data.pagination.last_page,
          from: response.data.data.pagination.from,
          to: response.data.data.pagination.to,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<InventoryData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventories");
    throw error;
  }
};

export const createInventory = async (
  data: InventoryCreateUpdatePayload
): Promise<InventoryData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/create",
      data
    );
    return extractData<InventoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create inventory");
    throw error;
  }
};

export const getInventoriesForSelect = async (): Promise<InventoryData[]> => {
  try {
    const response = await axiosInstance.get("/accounting/inventory/select");
    return extractData<InventoryData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventories for select");
    throw error;
  }
};

export const getInventorySummary = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get("/accounting/inventory/summary");
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory summary");
    throw error;
  }
};

export const getInventoryStats = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get("/accounting/inventory/stats");
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory stats");
    throw error;
  }
};

export const searchInventories = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InventoryData>> => {
  try {
    const response = await axiosInstance.get("/accounting/inventory/search", {
      params,
    });
    return extractData<PaginationWrapper<InventoryData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to search inventories");
    throw error;
  }
};

export const getInventoryCategories = async (): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/categories"
    );
    return extractData<any[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory categories");
    throw error;
  }
};

export const getInventoryByCategory = async (
  category: string
): Promise<InventoryData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/category/${category}`
    );
    return extractData<InventoryData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory by category");
    throw error;
  }
};

export const getInventory = async (id: number): Promise<InventoryData> => {
  try {
    const response = await axiosInstance.get(`/accounting/inventory/${id}`);
    return extractData<InventoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory");
    throw error;
  }
};

export const getInventoryWithItems = async (
  id: number
): Promise<InventoryData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/${id}/items`
    );
    return extractData<InventoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory with items");
    throw error;
  }
};

export const updateInventory = async (
  id: number,
  data: InventoryCreateUpdatePayload
): Promise<InventoryData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/inventory/${id}`,
      data
    );
    return extractData<InventoryData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update inventory");
    throw error;
  }
};

export const deleteInventory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/inventory/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete inventory");
    throw error;
  }
};

// Inventory Items
export const getAllInventoryItems = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InventoryItemData>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/all",
      { params }
    );
    return extractData<PaginationWrapper<InventoryItemData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch all inventory items");
    throw error;
  }
};

export const getItemsByInventory = async (
  inventoryId: number
): Promise<InventoryItemData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/items/inventory/${inventoryId}`
    );
    return extractData<InventoryItemData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch items by inventory");
    throw error;
  }
};

export const attachItem = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/items/attach",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to attach item");
    throw error;
  }
};

export const detachItem = async (
  inventoryId: number,
  itemId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/accounting/inventory/items/${inventoryId}/${itemId}`
    );
  } catch (error: any) {
    toast.error(error?.message || "Failed to detach item");
    throw error;
  }
};

export const createInventoryItem = async (
  data: Partial<InventoryItemData>
): Promise<InventoryItemData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/items",
      data
    );
    return extractData<InventoryItemData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create inventory item");
    throw error;
  }
};

export const getInventoryItemsSummary = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/summary"
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory items summary");
    throw error;
  }
};

export const getLowStockItems = async (): Promise<InventoryItemData[]> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/low-stock"
    );
    return extractData<InventoryItemData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch low stock items");
    throw error;
  }
};

export const getOutOfStockItems = async (): Promise<InventoryItemData[]> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/out-of-stock"
    );
    return extractData<InventoryItemData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch out of stock items");
    throw error;
  }
};

export const getReorderReport = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/reorder-report"
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch reorder report");
    throw error;
  }
};

export const createItemMovement = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/items/movements",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create item movement");
    throw error;
  }
};

export const getItemMovements = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<any>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/items/movements",
      { params }
    );
    return extractData<PaginationWrapper<any>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch item movements");
    throw error;
  }
};

export const bulkAdjustment = async (data: any): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/items/bulk-adjustment",
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to perform bulk adjustment");
    throw error;
  }
};

export const getInventoryItem = async (
  id: number
): Promise<InventoryItemData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/items/${id}`
    );
    return extractData<InventoryItemData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory item");
    throw error;
  }
};

export const updateInventoryItem = async (
  id: number,
  data: Partial<InventoryItemData>
): Promise<InventoryItemData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/inventory/items/${id}`,
      data
    );
    return extractData<InventoryItemData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update inventory item");
    throw error;
  }
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/inventory/items/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete inventory item");
    throw error;
  }
};

// Inventory Locations
export const getInventoryLocations = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InventoryLocationData>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/locations",
      { params }
    );

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The location array (nested data)
        pagination: {
          current_page: response.data.data.pagination.page,
          per_page: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          last_page: response.data.data.pagination.last_page,
          from: response.data.data.pagination.from,
          to: response.data.data.pagination.to,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<InventoryLocationData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory locations");
    throw error;
  }
};

export const createInventoryLocation = async (
  data: InventoryLocationCreateUpdatePayload
): Promise<InventoryLocationData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/locations",
      data
    );
    return extractData<InventoryLocationData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create inventory location");
    throw error;
  }
};

export const getInventoryLocation = async (
  id: number
): Promise<InventoryLocationData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/locations/${id}`
    );
    return extractData<InventoryLocationData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory location");
    throw error;
  }
};

export const updateInventoryLocation = async (
  id: number,
  data: InventoryLocationCreateUpdatePayload
): Promise<InventoryLocationData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/inventory/locations/${id}`,
      data
    );
    return extractData<InventoryLocationData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update inventory location");
    throw error;
  }
};

export const deleteInventoryLocation = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/inventory/locations/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete inventory location");
    throw error;
  }
};

export const getLocationInventory = async (
  id: number
): Promise<InventoryData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/locations/${id}/inventory`
    );
    return extractData<InventoryData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch location inventory");
    throw error;
  }
};

// Inventory Suppliers
export const getInventorySuppliers = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<InventorySupplierData>> => {
  try {
    const response = await axiosInstance.get(
      "/accounting/inventory/suppliers",
      { params }
    );

    // Handle the actual API response structure
    if (response.data?.code === 200 && response.data?.data?.success) {
      return {
        data: response.data.data.data, // The supplier array (nested data)
        pagination: {
          current_page: response.data.data.pagination.page,
          per_page: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          last_page: response.data.data.pagination.last_page,
          from: response.data.data.pagination.from,
          to: response.data.data.pagination.to,
        },
      };
    }

    // Fallback to extractData if structure is different
    return extractData<PaginationWrapper<InventorySupplierData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory suppliers");
    throw error;
  }
};

export const createInventorySupplier = async (
  data: InventorySupplierCreateUpdatePayload
): Promise<InventorySupplierData> => {
  try {
    const response = await axiosInstance.post(
      "/accounting/inventory/suppliers",
      data
    );
    return extractData<InventorySupplierData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create inventory supplier");
    throw error;
  }
};

export const getInventorySupplier = async (
  id: number
): Promise<InventorySupplierData> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/suppliers/${id}`
    );
    return extractData<InventorySupplierData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch inventory supplier");
    throw error;
  }
};

export const updateInventorySupplier = async (
  id: number,
  data: InventorySupplierCreateUpdatePayload
): Promise<InventorySupplierData> => {
  try {
    const response = await axiosInstance.put(
      `/accounting/inventory/suppliers/${id}`,
      data
    );
    return extractData<InventorySupplierData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update inventory supplier");
    throw error;
  }
};

export const deleteInventorySupplier = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/accounting/inventory/suppliers/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete inventory supplier");
    throw error;
  }
};

export const getSupplierProducts = async (
  id: number
): Promise<ProductData[]> => {
  try {
    const response = await axiosInstance.get(
      `/accounting/inventory/suppliers/${id}/products`
    );
    return extractData<ProductData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch supplier products");
    throw error;
  }
};

// Direct Payment Interfaces
export interface CreateDirectPaymentData {
  amount: number;
  currency: string;
  payment_method_id: string;
  invoice_id: number;
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

// Create direct payment function
export const createDirectPayment = async (data: CreateDirectPaymentData): Promise<PaymentIntentResponse> => {
  try {
    const response = await axiosInstance.post(
      '/accounting/stripe/create-payment-intent',
      data
    );
    
    // Handle the actual API response structure
    console.log(response, "RARARA");
    if (response.data?.code === 200 && response.data?.data?.success) {
      // The actual payment intent data should be in response.data.data.data
      // If it's an empty array, we might need to handle this case
      const paymentData = response.data.data;
      
      // if (Array.isArray(paymentData) && paymentData.length === 0) {
      //   // Handle case where data is empty array
      //   throw new Error("No payment intent data returned from server");
      // }
      
      return paymentData as PaymentIntentResponse;
    }
    
    // Fallback to extractData if structure is different
    return extractData<PaymentIntentResponse>(response.data);
  } catch (error: any) {
    console.log(error, "error.createDirectPayment");
    toast.error(error?.message || "Failed to create direct payment");
    throw error;
  }
};
