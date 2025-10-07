// API functions for Cisco PBX responses
import axiosInstance from '@utils/axios';
import { toast } from "react-toastify";
import { tmsSession } from "@utils/tmsSession";

/**
 * General function to handle TMS authentication errors (4009 response code)
 * Clears TMS session and redirects to TMS login page
 * @param response - The API response object
 */
const handleResponse = (response: any) => {
  const responseCode = response?.data;
  if (responseCode?.code === 4009) {
    toast.error(response?.data?.message);
    // Clear TMS session and redirect to TMS login
    tmsSession.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/tms/verification';
    }
  }

  if(response?.data?.success === true){
    return response?.data?.data;
  }else{
    return [];
  }


};

export const GetCounterData = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/counters', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};


export const GetDashboardOverview = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/dashboard-overview', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const CompanyMonthlyInteraction = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/company-monthly-interactions', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const ComanyMobileUserStats = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/company-mobile-user-stats', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const CompanyUserActivity = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/company-user-activity', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const TopCompaniesByUserCount = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/top-companies-by-user-count', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const AuditLogSummary = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/analytics/audit-log-summary', { params });
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

export const GetListCompanies = async (params: any = {}) => {
  try {
    const response = await axiosInstance.get('/tms/getCompanies');
    console.log("response GetListCompanies", response.data);
    return handleResponse(response.data);
  } catch (error) {
    throw error;
  }
};