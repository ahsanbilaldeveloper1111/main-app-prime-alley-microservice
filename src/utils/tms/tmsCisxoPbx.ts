import { toast } from "react-toastify";
import axiosInstance from "@utils/axios";

interface PaginationParams {
    page?: number;
    perPage?: number;
    search?: string;
    draw?: number;
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
      recordsTotal: response.pagination.total,
      recordsFiltered: response.pagination.total,
      dataList: response.data,
      meta: response.pagination
    };
  } else {
    console.log('response msg', response.message);
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
  
  export const getCiscoPbxUsers = async (params: PaginationParams = {}) => {
    try {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
    
      const response = await axiosInstance.get(
        `tms/getPbxusers`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );

      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

export const getCiscoPbxUsersDirectory = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      
      const response = await axiosInstance.get(
        `tms/getPbxUserDirectory`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
}

export const ListAppUsers = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getAppUsers`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
     
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
}

export const ListCustomUsers = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getCustomUsers`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
}

export const ListFacilitiesInfo = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getFacilitiesInfo`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
     
}

export const ListRecordingProfile = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getRecordingProfiles`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
}

export const ListRemoteDestination = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getRemoteDesitination`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
      
}

export const ListRemoteDestinationProfile = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getRemoteDesitinationProfile`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
}

export const ListLine = async (params: PaginationParams = {}) => {
      const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
      const response = await axiosInstance.get(
        `tms/getLines`,
        {
          params: {
            page,
            perPage,
            search,
            draw,
            ...filters
          }
        },
      );
      const responseData = response?.data?.data; 
      return transformApiResponse(responseData, draw);
      
}

export const ListPhone = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getPhones`,
    {
      params: {
        page,
     
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListSipTrunks = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getSipTruncks`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListTranslationPatterns = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getTranslationPatterns`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListDeviePool = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getDevicePool`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListLocation = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getLocations`,
    {
      params: {
        page,
  
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListRoutePartition = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getRoutePartitions`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListCSS= async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getCss`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListRegion = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getOrigins`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
}

export const ListRoutePattern= async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getRoutePatterns`,
    {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters
      }
    },
  );
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
  
}