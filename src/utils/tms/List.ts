// API functions for Cisco PBX responses
import axiosInstance from '@utils/axios';
import { toast } from "react-toastify";

/**
 * General function to handle TMS authentication errors (4009 response code)
 * TMS auth has been removed - this function now only shows error message
 * @param response - The API response object
 */
const handleTmsAuthError = (response: any) => {
  const responseCode = response?.data?.code;
  if (responseCode === 4009) {
    toast.error(response?.data?.message);
    // TMS auth has been removed - no session clearing or redirect
  }
};

interface ApiParams {
    page?: number;
    perPage?: number;
    search?: string;
    filters?: any;
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
  meta: {
    total: number;
    limit: number;
    page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * General utility function to transform API responses to a standardized format
 * @param response - The API response object
 * @param draw - The draw number for DataTables (default: 1)
 * @returns Transformed response in the required format
 */
const transformApiResponse = (response: ApiResponse, draw: number = 1): TransformedResponse => {
  if (response.success === true) {
    return {
      draw,
      recordsTotal: response?.pagination?.total,
      recordsFiltered: response?.pagination?.total,
      dataList: response?.data,
      meta: response?.pagination
    };
  } else {
    console.log('response msg', response?.message);
    return {
      draw,
      recordsTotal: 0,
      recordsFiltered: 0,
      dataList: [],
      meta: {
        total: 0,
        limit: 10,
        page: 1,
        last_page: 0,
        from: 0,
        to: 0
      }
    };
  }
};

export const ListRecordingProfile = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRecordingProfiles', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching recording profiles:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};
  
export const ListDeviePool = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getDevicePool', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching device pools:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListRoutePartition = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRoutePartitions', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching route partitions:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListFacilitiesInfo = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getFacilitiesInfo', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching facilities info:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListAppUsers = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getAppUsers', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching app users:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListCSS = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getCss', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching CSS:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const getCiscoPbxUsersDirectory = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getPbxUserDirectory', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching LDAP directory:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const getCiscoPbxUsers = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getPbxusers', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });

        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching Cisco PBX users:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const getAuditLogs = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getAuditLogs', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListCustomUsers = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getCustomUsers', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching custom users:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListLine = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getLines', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching lines:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListLocation = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getLocations', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListPhone = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getPhones', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching phones:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListRegion = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRegions', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching regions:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListRemoteDestination = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRemoteDestinations', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching remote destinations:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListRemoteDestinationProfile = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRemoteDestinationProfiles', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching remote destination profiles:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListRoutePattern = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getRoutePatterns', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching route patterns:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListSipTrunks = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getSipTrunks', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching SIP trunks:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListTranslationPatterns = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getTranslationPatterns', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching translation patterns:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};

export const ListUnifiedOps = async (params: ApiParams = {}) => {
    try {
        const response = await axiosInstance.get('tms/getUnifiedOps', {
            params: {
                search: params.search || '',
                page: params.page || 1,
                perPage: params.perPage || 100,
                ...params.filters
            }
        });
        
        handleTmsAuthError(response);
        const responseData = response?.data?.data; 
        return transformApiResponse(responseData, 1);
    } catch (error) {
        console.error('Error fetching unified ops:', error);
        return {
            draw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            dataList: [],
            meta: {
                total: 0,
                limit: 10,
                page: 1,
                last_page: 0,
                from: 0,
                to: 0
            }
        };
    }
};


export const GetTmsAuditLogs = async (params: any = {}) => {
    try {
        const response = await axiosInstance.get('tms/getAuditLogs', { params });
        return response.data ?? [];
    } catch (error) {
        toast.error("Failed to fetch audit logs");
        console.error('Error fetching audit logs:', error);
        throw error;
    }
};