import { toast } from "react-toastify";
import axiosInstance from "./axios";

const tenant_id = "tenant_123"

// Chat Message Interfaces
export interface ChatMessagePayload {
  message: string;
  tenant_id: string;
  thread_id?: string;
}

export interface ChatMessageResponse {
  response?: string;
  message?: string;
  thread_id?: string;
  error?: string;
}

// Chat Survey Interfaces
export interface ChatSurveyPayload {
  rating: number;
  feedback?: string | null;
  thread_id?: string;
  tenant_id: string;
}

export interface ChatSurveyResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// FAQ Interfaces
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData extends Record<string, unknown> {
  id?: number;
  question: string;
  answer: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FAQListResponse {
  tenant_id?: string;
  tenant_name?: string | null;
  faqs_count?: number;
  faqs?: FAQData[];
  files_count?: number;
  files?: any[];
  data?: FAQData[];
  success?: boolean;
  message?: string;
  error?: string;
}

export interface FAQResponse {
  id?: number;
  question?: string;
  answer?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  success?: boolean;
  message?: string;
  error?: string;
}

export interface CreateTenantFAQPayload {
  tenant_id: string;
  faqs: string; // JSON string array of FAQItem[]
  have_files?: string; // "true" or "false"
  files?: File[] | string[]; // Array of File objects or file paths
}

export interface DeleteTenantFAQParams {
  tenant_id: string;
  faq_id: number;
}

// Training Interface
export interface ChatTrainingPayload {
  tenant_id: string;
  chunk_size: number;
  chunk_overlap: number;
}

export interface ChatTrainingResponse {
  message?: string;
  tenant_id?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  tenant_documents?: {
    files: number;
    chunks: number;
  };
  global_documents?: {
    files: number;
    chunks: number;
  };
  tenant_faqs?: {
    count: number;
    chunks: number;
  };
  global_faqs?: {
    count: number;
    chunks: number;
  };
  total_chunks?: number;
  changes_detected?: boolean;
  success?: boolean;
  error?: string;
}

/**
 * Send a chat message to the AI chatbot
 * @param payload - Chat message payload containing message, tenant_id, and optional thread_id
 * @returns Promise with chat response containing AI response and thread_id
 */
export const sendChatMessage = async (
  payload: ChatMessagePayload
): Promise<ChatMessageResponse> => {
  try {
    const response = await axiosInstance.post<ChatMessageResponse>('/chat', payload);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'An error occurred');
    }
    
    return response.data;
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'An error occurred while processing your request. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Submit a chat survey/feedback
 * @param payload - Survey payload containing rating, feedback, thread_id, and tenant_id
 * @returns Promise with survey response
 */
export const submitChatSurvey = async (
  payload: ChatSurveyPayload
): Promise<ChatSurveyResponse> => {
  try {
    const response = await axiosInstance.post<ChatSurveyResponse>('/chat/survey', payload);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'An error occurred');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Survey submission error:', error);
    // Don't show toast for survey errors to avoid interrupting user flow
    throw error;
  }
};

/**
 * Get tenant-specific FAQs
 * @param tenantId - Optional tenant identifier; when not provided or empty, request is sent without tenant_id (no default tenant_123)
 * @param search - Optional search term to filter FAQs (sent as query param for server-side search)
 * @returns Promise with list of tenant FAQs
 */
export const getTenantFAQs = async (tenantId?: string, search?: string): Promise<FAQData[]> => {
  try {
    const params = new URLSearchParams();
    const id = tenantId?.trim();
    if (id) params.set("tenant_id", id);
    if (search?.trim()) params.set("search", search.trim());
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await axiosInstance.get<FAQListResponse>(`/chat/tenant-faqs${query}`);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to fetch tenant FAQs');
    }
    
    // Handle different response structures
    // New structure: { tenant_id, faqs_count, faqs: [...], files_count, files: [...] }
    if (response.data?.faqs && Array.isArray(response.data.faqs)) {
      return response.data.faqs;
    }
    // Legacy structure: direct array
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // Nested data structure: { data: [...] }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch tenant FAQs. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Create tenant-specific FAQs
 * @param payload - FAQ payload containing tenant_id, faqs (JSON string), have_files, and files
 * @returns Promise with created FAQ response
 */
export const createTenantFAQ = async (
  payload: CreateTenantFAQPayload
): Promise<any> => {
  try {
    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('tenant_id', payload.tenant_id);
    formData.append('faqs', payload.faqs);
    
    if (payload.have_files) {
      formData.append('have_files', payload.have_files);
    }
    
    // Append files if provided
    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        // FormData.append handles both File objects and strings
        formData.append('files[]', file as any);
      });
    }
    
    const response = await axiosInstance.post('/chat/tenant-faqs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to create tenant FAQs');
    }
    
    toast.success('Tenant FAQs created successfully');
    return response.data;
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to create tenant FAQs. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Delete a tenant-specific FAQ
 * @param params - Object containing tenant_id and faq_id
 * @returns Promise with deletion response
 */
export const deleteTenantFAQ = async (params: DeleteTenantFAQParams): Promise<void> => {
  try {
    const response = await axiosInstance.delete('/chat/tenant-faqs', {
      params: {
        tenant_id: params.tenant_id,
        faq_id: params.faq_id,
      },
    });
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to delete tenant FAQ');
    }
    
    toast.success('Tenant FAQ deleted successfully');
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to delete tenant FAQ. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Get global FAQs
 * @param search - Optional search term (sent as query param for server-side search)
 * @returns Promise with list of global FAQs
 */
export const getGlobalFAQs = async (search?: string): Promise<FAQData[]> => {
  try {
    const url = search?.trim()
      ? `/chat/global-faqs?search=${encodeURIComponent(search.trim())}`
      : "/chat/global-faqs/";
    const response = await axiosInstance.get<FAQListResponse>(url);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to fetch global FAQs');
    }
    
    // Handle different response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.faqs && Array.isArray(response.data.faqs)) {
      return response.data.faqs;
    }
    
    return [];
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch global FAQs. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Create or update global FAQs
 * @param payload - FAQ payload containing faqs (JSON string), have_files, and files
 * @returns Promise with created FAQ response
 */
export const createGlobalFAQ = async (
  payload: Omit<CreateTenantFAQPayload, 'tenant_id'>
): Promise<any> => {
  try {
    // Create FormData for file uploads
    const formData = new FormData();
    formData.append('faqs', payload.faqs);
    
    if (payload.have_files) {
      formData.append('have_files', payload.have_files);
    }
    
    // Append files if provided
    if (payload.files && payload.files.length > 0) {
      payload.files.forEach((file) => {
        // FormData.append handles both File objects and strings
        formData.append('files[]', file as any);
      });
    }
    
    const response = await axiosInstance.post('/chat/global-faqs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to create global FAQs');
    }
    
    toast.success('Global FAQs created successfully');
    return response.data;
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to create global FAQs. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Delete a global FAQ
 * @param faq_id - FAQ ID to delete
 * @returns Promise with deletion response
 */
export const deleteGlobalFAQ = async (faq_id: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete('/chat/global-faqs/', {
      params: {
        faq_id: faq_id,
      },
    });
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to delete global FAQ');
    }
    
    toast.success('Global FAQ deleted successfully');
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to delete global FAQ. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Submit training data for chat
 * @param payload - Training payload containing tenant_id, chunk_size, and chunk_overlap
 * @returns Promise with training response
 */
export const submitChatTraining = async (
  payload: ChatTrainingPayload
): Promise<ChatTrainingResponse> => {
  try {
    const response = await axiosInstance.post<ChatTrainingResponse>('/chat/training', payload);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'Failed to submit training data');
    }
    
    return response.data;
  } catch (error: any) {
    const errorMsg = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Failed to submit training data. Please try again.';
    
    toast.error(errorMsg);
    throw error;
  }
};
