// API functions for Cisco PBX responses
import axiosInstance from '@utils/axios';
import { toast } from "react-toastify";

/**
 * General function to handle TMS authentication errors (4009 response code)
 * TMS auth has been removed - this function now only shows error message
 * @param response - The API response object
 */
const handleResponse = (response: any) => {
  const responseCode = response?.data;
  if (responseCode?.code === 4009) {
    toast.error(response?.data?.message);
    // TMS auth has been removed - no session clearing or redirect
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
    return handleResponse(response.data);
  } catch (error) {
    throw error;
  }
};