  import { toast } from "react-toastify";
import axiosInstance from "./axios";



export interface PaginationParams extends Record<string, any> {
  page?: number;
  per_page?: number;
  search?: string;
}

// Helper function to extract data from controlhub response
function extractData<T>(response: any): T {
  

  // Handle successful response with nested data structure
  if (response?.code === 200 && response?.data?.success) {
    
    return response.data.data;
  }

  // Handle direct data response (fallback)
  if (response?.data) {
    
    return response.data;
  }

  console.error("Failed to extract data from response:", response);

  throw new Error(
    response?.data?.message || response?.message || "API request failed"
  );
}

interface ApiResponse {
  success: boolean;
  message: string;
  action: string;
  data: any[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    last_page: number;
    from: number;
    to: number;
  };
}


interface TransformedResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  dataList: any[];
  summary: any;
  meta: {
    total: number;
    limit: number;
    per_page: number;
    page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    next_page_url:string;
    prev_page_url:string;
  };
}
const transformApiResponse = (apiResponse: any): TransformedResponse => {
   const response = apiResponse?.data;
  
  if (response?.success === true) {
    return {
      draw: 1,
      recordsTotal: response?.pagination?.total,
      recordsFiltered: response?.pagination?.total,
      dataList: response?.data,
      summary: response?.summary,
      meta: {
        total: response?.pagination?.total,
        limit: response?.pagination?.limit,
        per_page: response?.pagination?.limit,
        page: response?.pagination?.page,
        current_page: response?.pagination?.page,
        last_page: response?.pagination?.last_page,
        from: response?.pagination?.from,
        to: response?.pagination?.to,
        next_page_url: response?.pagination?.next_page_url,
        prev_page_url: response?.pagination?.prev_page_url
      }
    };
  } else {
    console.log('response msg', response?.message);
    return {
      draw: 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      dataList: [],
      summary: null,
      meta: {
        total: 0,
        limit: 10,
        page: 1,
        current_page: 1,
        last_page: 0,
        from: 0,
        to: 0,
        next_page_url: '',
        prev_page_url: '',
        per_page:15
      }
    };
  }
};

export const GetProducts = async (params: PaginationParams = {}) => {
  try {
   // const response = await axiosInstance.get('accounting/get-products', { params });//products/all'
    const response = await axiosInstance.get('accounting/products/all', { params });
    const formattedResponse = transformApiResponse(response.data);
    console.log('formattedResponse', formattedResponse);
    return formattedResponse;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch products");
    throw error;
  }
};

export const GetCustomerStatements = async (params: any = {}) => {
  try {
    const response = await axiosInstance.post('accounting/reports/customer-statement', params);
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch customer statements");
    throw error;
  }
};

export const GetProductCategories = async (): Promise<any[]> => {
  try {
    const response = await axiosInstance.get('accounting/get-product-categories');
    const formattedResponse = extractData(response.data);
    return formattedResponse as any[];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch product categories");
    throw error;
  }
};

export const GetPaymentMethods = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-payment-methods', { params });
    const formattedResponse = extractData(response.data);
    return formattedResponse;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch payment methods");
    throw error;
  }
};

export const setDefaultPaymentMethod = async (
  paymentMethodId: string
): Promise<void> => {
  try {
    await axiosInstance.post('accounting/set-default-payment-method', {
      payment_method_id: paymentMethodId,
    });
  } catch (error: any) {
    toast.error(error?.message || "Failed to set default payment method");
    throw error;
  }
};

export const deletePaymentMethod = async (
  paymentMethodId: string
): Promise<void> => {
  try {
    await axiosInstance.post('accounting/delete-payment-method', {
      payment_method_id: paymentMethodId,
    });
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete payment method");
    throw error;
  }
};

export const addPaymentMethod = async (
  payload: any
): Promise<void> => {
  try {
    await axiosInstance.post('accounting/add-payment-method', payload);
  } catch (error: any) {
    toast.error(error?.message || "Failed to add payment method");
    throw error;
  }
};

export const GetPayments = async (params: PaginationParams = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-payments', { params });
    const formattedResponse = transformApiResponse(response.data);
    return formattedResponse;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch payments");
    throw error;
  }
};

//Dashboard apis start
export const GetDashboardCounters = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-dashboard-counter', { params });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch dashboard counters");
    throw error;
  }
};
export const GetProfitLossData = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting//get-profit-loss', { params });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch profit loss data");
    throw error;
  }
};
export const GetTopProducts = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-top-products', { params });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch top products");
    throw error;
  }
};
export const GetRecentActivity = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-recent-activity', { params });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch recent activity");
    throw error;
  }
};
export const GetAnalyticsByMonth = async (start_date?: string, end_date?: string, params: { crm_company_id?: string | number } = {}) => {
  try {
    const queryParams: any = { ...params };
    if (start_date) {
      queryParams.start_date = start_date;
    }
    if (end_date) {
      queryParams.end_date = end_date;
    }
    const response = await axiosInstance.get('accounting/get-analytics-by-month', { params: queryParams });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch analytics by month");
    throw error;
  }
};
//Dashboard apis end
export const GetCompanyDetails = async (params: { crm_company_id?: string | number } = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-company-details', { params });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch company details");
    throw error;
  }
};
export const GetInvoices = async (params: PaginationParams = {}) => {
  try {
    const response = await axiosInstance.get('accounting/get-invoices', { params });
    const formattedResponse = transformApiResponse(response.data);
    return formattedResponse;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch invoices");
    throw error;
  }
};

export const UpdateCompanyDetails = async (payload: any) => {
  try {
    const response = await axiosInstance.post('accounting/update-company-details', payload);
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update company details");
    throw error;
  }
};

export const CompletePayment = async (payload: any) => {
  try {
    const response = await axiosInstance.post('accounting/stripe/complete-payment', payload);
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update company details");
    throw error;
  }
};

export const GetAccountAuditLogs = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('accounting/audit-logs', { params });
    return response.data ?? [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch account audit logs");
    throw error;
  }
};

export const GetCurrencies = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get("accounting/currencies");
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch currencies");
    throw error;
  }
};

const companyDocumentsBasePath = (companyId: string | number) =>
  `accounting/company/${companyId}/documents`;

/** GET accounting/company/{id}/documents */
export const GetCompanyDocuments = async (
  companyId: string | number,
  params: Record<string, unknown> = {}
) => {
  try {
    const response = await axiosInstance.get(companyDocumentsBasePath(companyId), {
      params,
    });
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch company documents");
    throw error;
  }
};

/** POST accounting/company/{id}/documents */
export const PostCompanyDocuments = async (
  companyId: string | number,
  payload: FormData | Record<string, unknown>
) => {
  try {
    const response = await axiosInstance.post(
      companyDocumentsBasePath(companyId),
      payload
    );
    return extractData(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to upload company documents");
    throw error;
  }
};

/** DELETE accounting/company/{id}/documents/{documentId} */
export const DeleteCompanyDocument = async (
  companyId: string | number,
  documentId: string | number
) => {
  try {
    const response = await axiosInstance.delete(
      `${companyDocumentsBasePath(companyId)}/${documentId}`
    );
    return response?.data?.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete company document");
    throw error;
  }
};

/** GET accounting/company/{id}/documents/{documentId}/download */
export const GetCompanyDocumentDownload = async (
  companyId: string | number,
  documentId: string | number
) => {
  try {
    const response = await axiosInstance.get(
      `${companyDocumentsBasePath(companyId)}/${documentId}/download`,
      { responseType: "blob" }
    );
    return response?.data ?? null;
  } catch (error: any) {
    toast.error(error?.message || "Failed to download company document");
    throw error;
  }
};

