import { toast } from "react-toastify";
import { reportApiError } from "./sentryLogger";
import axiosInstance from "./axios";

interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  filters?: any;
}

/**
 * Helper function to check API response and extract data
 * Handles response structure: { code: 200, message: "Successful", data: { success: true, data: {...}, message: "..." } }
 * @param response - Axios response object
 * @param defaultErrorMessage - Default error message to show if response is invalid
 * @param showSuccessToast - Whether to show success toast (default: false)
 * @returns The actual data if successful, null otherwise
 */
const handleAPIResponse = (
  response: any,
  defaultErrorMessage: string = 'Operation failed',
  showSuccessToast: boolean = false
): any => {
  if (!response?.data) {
    reportApiError('faqs', defaultErrorMessage, { apiResponse: response?.data });
    toast.error(defaultErrorMessage);
    return null;
  }

  const { code, message, data } = response.data;

  // Check if code is 200
  if (code !== 200) {
    const errorMessage = message || data?.message || defaultErrorMessage;
    reportApiError('faqs', errorMessage, { apiResponse: response.data, responseCode: code });
    toast.error(errorMessage);
    return null;
  }

  // Check if data exists
  if (!data) {
    reportApiError('faqs', defaultErrorMessage, { apiResponse: response.data });
    toast.error(defaultErrorMessage);
    return null;
  }

  // For responses with nested success flag: { success: true, data: {...}, message: "..." }
  if (typeof data === 'object' && 'success' in data) {
    if (data.success === true) {
      if (showSuccessToast && data.message) {
        toast.success(data.message);
      }
      // Return the nested data object (could be paginated or single item)
      return data.data || data;
    } else {
      // Success is false
      const errorMessage = data.message || message || defaultErrorMessage;
      reportApiError('faqs', errorMessage, { apiResponse: response.data });
      toast.error(errorMessage);
      return null;
    }
  }

  // If data exists but doesn't have success flag, assume it's the actual data
  // This handles cases where the API returns data directly without success wrapper
  if (data) {
    return data;
  }

  // Fallback: no data found
  reportApiError('faqs', defaultErrorMessage, { apiResponse: response?.data });
  toast.error(defaultErrorMessage);
  return null;
};

/**
 * Helper function to handle API errors
 * @param error - Error object from catch block
 * @param defaultErrorMessage - Default error message
 */
const handleAPIError = (error: any, defaultErrorMessage: string = 'Operation failed') => {
  console.error('API Error:', error);
  
  if (error.response?.data) {
    const errorData = error.response.data;
    
    // Check for nested error structure
    if (errorData.data?.message) {
      toast.error(errorData.data.message);
    } else if (errorData.message) {
      toast.error(errorData.message);
    } else if (errorData.errors) {
      // Handle validation errors
      const errors = errorData.errors;
      const errorMessages = Object.values(errors).flat().join(', ');
      toast.error(errorMessages);
    } else {
      toast.error(defaultErrorMessage);
    }
  } else {
    toast.error(defaultErrorMessage);
  }
};

// ==================== FAQ MODULES ====================

export const ListFAQModules = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", filters = {} } = params;
    
    const response = await axiosInstance.get(
      `faqs/modules`,
      {
        params: {
          page,
          per_page: perPage,
          search,
          ...filters,
        }
      }
    );
    
    return handleAPIResponse(response, 'Failed to fetch FAQ modules');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ modules');
    throw error;
  }
};

export const getAllFAQModules = async () => {
  try {
    const response = await axiosInstance.get(`faqs/modules/all`);
    const result = handleAPIResponse(response, 'Failed to fetch FAQ modules');
    return result || [];
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ modules');
    return [];
  }
};

export const getFAQModule = async (id: number) => {
  try {
    const response = await axiosInstance.get(`faqs/modules/${id}`);
    return handleAPIResponse(response, 'Failed to fetch FAQ module');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ module');
    return null;
  }
};

export const createFAQModule = async (name: string, description?: string, icon?: string) => {
  try {
    const response = await axiosInstance.post(
      `faqs/modules`,
      {
        name,
        description: description || null,
        icon: icon || null
      }
    );
    return handleAPIResponse(response, 'Failed to create FAQ module', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to create FAQ module');
    return null;
  }
};

export const updateFAQModule = async (id: number, name: string, description?: string, icon?: string) => {
  try {
    const response = await axiosInstance.put(
      `faqs/modules/${id}`,
      {
        name,
        description: description || null,
        icon: icon || null
      }
    );
    return handleAPIResponse(response, 'Failed to update FAQ module', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to update FAQ module');
    return null;
  }
};

export const deleteFAQModule = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`faqs/modules/${id}`);
    const result = handleAPIResponse(response, 'Failed to delete FAQ module', true);
    return result !== null;
  } catch (error: any) {
    handleAPIError(error, 'Failed to delete FAQ module');
    return false;
  }
};

// ==================== FAQ TOPICS ====================

export const ListFAQTopics = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", filters = {} } = params;
    
    const response = await axiosInstance.get(
      `faqs/topics`,
      {
        params: {
          page,
          per_page: perPage,
          search,
          ...filters,
        }
      }
    );
    
    return handleAPIResponse(response, 'Failed to fetch FAQ topics');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ topics');
    throw error;
  }
};

export const getAllFAQTopics = async () => {
  try {
    const response = await axiosInstance.get(`faqs/topics/all`);
    const result = handleAPIResponse(response, 'Failed to fetch FAQ topics');
    return result || [];
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ topics');
    return [];
  }
};

export const getFAQTopic = async (id: number) => {
  try {
    const response = await axiosInstance.get(`faqs/topics/${id}`);
    return handleAPIResponse(response, 'Failed to fetch FAQ topic');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ topic');
    return null;
  }
};

export const createFAQTopic = async (faq_module_id: number, name: string, description?: string) => {
  try {
    const response = await axiosInstance.post(
      `faqs/topics`,
      {
        faq_module_id,
        name,
        description: description || null
      }
    );
    return handleAPIResponse(response, 'Failed to create FAQ topic', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to create FAQ topic');
    return null;
  }
};

export const updateFAQTopic = async (id: number, faq_module_id: number, name: string, description?: string) => {
  try {
    const response = await axiosInstance.put(
      `faqs/topics/${id}`,
      {
        faq_module_id,
        name,
        description: description || null
      }
    );
    return handleAPIResponse(response, 'Failed to update FAQ topic', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to update FAQ topic');
    return null;
  }
};

export const deleteFAQTopic = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`faqs/topics/${id}`);
    const result = handleAPIResponse(response, 'Failed to delete FAQ topic', true);
    return result !== null;
  } catch (error: any) {
    handleAPIError(error, 'Failed to delete FAQ topic');
    return false;
  }
};

// ==================== FAQ ITEMS ====================

export const ListFAQItems = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", filters = {} } = params;
    
    const response = await axiosInstance.get(
      `faqs/items`,
      {
        params: {
          page,
          per_page: perPage,
          search,
          ...filters,
        }
      }
    );
    
    return handleAPIResponse(response, 'Failed to fetch FAQs');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQs');
    throw error;
  }
};

export const getAllFAQItems = async () => {
  try {
    const response = await axiosInstance.get(`faqs/items/all`);
    const result = handleAPIResponse(response, 'Failed to fetch FAQs');
    return result || [];
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQs');
    return [];
  }
};

export const getFAQItem = async (id: number) => {
  try {
    const response = await axiosInstance.get(`faqs/items/${id}`);
    return handleAPIResponse(response, 'Failed to fetch FAQ');
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ');
    return null;
  }
};

export const createFAQItem = async (data: {
  topic_id: number;
  question: string;
  answer: string;
  description?: string;
  type?: string;
  view_count?: number;
}) => {
  try {
    const response = await axiosInstance.post(
      `faqs/items`,
      {
        topic_id: data.topic_id,
        question: data.question,
        answer: data.answer,
        description: data.description || null,
        type: data.type || null,
        view_count: data.view_count || 0
      }
    );
    return handleAPIResponse(response, 'Failed to create FAQ', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to create FAQ');
    return null;
  }
};

export const updateFAQItem = async (id: number, data: {
  topic_id: number;
  question: string;
  answer: string;
  description?: string;
  type?: string;
  view_count?: number;
}) => {
  try {
    const response = await axiosInstance.put(
      `faqs/items/${id}`,
      {
        topic_id: data.topic_id,
        question: data.question,
        answer: data.answer,
        description: data.description || null,
        type: data.type || null,
        view_count: data.view_count || 0
      }
    );
    return handleAPIResponse(response, 'Failed to update FAQ', true);
  } catch (error: any) {
    handleAPIError(error, 'Failed to update FAQ');
    return null;
  }
};

export const deleteFAQItem = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`faqs/items/${id}`);
    const result = handleAPIResponse(response, 'Failed to delete FAQ', true);
    return result !== null;
  } catch (error: any) {
    handleAPIError(error, 'Failed to delete FAQ');
    return false;
  }
};

export const incrementFAQViewCount = async (id: number) => {
  try {
    const response = await axiosInstance.post(`faqs/items/${id}/view`);
    return handleAPIResponse(response, 'Failed to increment view count');
  } catch (error: any) {
    handleAPIError(error, 'Failed to increment view count');
    return null;
  }
};

export const getMostViewedFAQs = async (faq_module_id?: number, topic_id?: number) => {
  try {
    const params: any = {};
    if (faq_module_id) params.faq_module_id = faq_module_id;
    if (topic_id) params.topic_id = topic_id;
    const response = await axiosInstance.get(`faqs/items/most-viewed`, { params });
    const result = handleAPIResponse(response, 'Failed to fetch most viewed FAQs');
    return result || [];
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch most viewed FAQs');
    return [];
  }
};

export const getFAQTypes = async (topic_id?: number) => {
  try {
    const params = topic_id ? { topic_id } : {};
    const response = await axiosInstance.get(`faqs/items/types/list`, { params });
    const result = handleAPIResponse(response, 'Failed to fetch FAQ types');
    return result || [];
  } catch (error: any) {
    handleAPIError(error, 'Failed to fetch FAQ types');
    return [];
  }
};

