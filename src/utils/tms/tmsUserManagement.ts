import { toast } from "react-toastify";
import axiosInstance from "@utils/axios";
import { tmsSession } from "@utils/tmsSession";

/**
 * General function to handle TMS authentication errors (4009 response code)
 * Clears TMS session and redirects to TMS login page
 * @param response - The API response object
 */
const handleTmsAuthError = (response: any) => {
  const responseCode = response?.data?.code;
  if (responseCode === 4009) {
    toast.error(response?.data?.message);
    // Clear TMS session and redirect to TMS login
    tmsSession.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/tms/verification';
    }
  }

};

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


export const ListUsers = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getTmsUsers`,
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
  handleTmsAuthError(response);
  const responseData = response?.data?.data; 
  return transformApiResponse(responseData, draw);
  
}

export const GetModule = async () => {
  const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "id": 12,
              "name": "user_setting",
              "description": null,
              "created_at": "2025-08-16T16:36:39.233000Z",
              "updated_at": "2025-08-16T16:36:39.233000Z",
              "permissions": [
                  {
                      "id": 40,
                      "action": "view",
                      "module_id": "12",
                      "created_at": "2025-08-16T16:36:39.243000Z",
                      "updated_at": "2025-08-16T16:36:39.243000Z"
                  },
                  {
                      "id": 41,
                      "action": "update",
                      "module_id": "12",
                      "created_at": "2025-08-16T16:36:39.257000Z",
                      "updated_at": "2025-08-16T16:36:39.257000Z"
                  }
              ]
          }
      ],
      "pagination": {
          "total": 11,
          "limit": 10,
          "page": 1,
          "last_page": 2,
          "from": 1,
          "to": 10
      }
  }
  const requiredResponse = {
      "draw": 1,
      "recordsTotal": response.pagination.total,
      "recordsFiltered": response.pagination.total,
      "dataList": response.data,
      "meta": response.pagination
    }
    return requiredResponse;
}



export  const getRanks = async (params: PaginationParams = {}) => {
  const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
  const response = await axiosInstance.get(
    `tms/getTmsRanks`,
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
  handleTmsAuthError(response);
  const responseData = response?.data?.data; 
  
  return transformApiResponse(responseData, draw);
}

export  const GetModules = async () => {
  const response = await axiosInstance.get(
    `tms/getTmsModules`
  );
  return checkResponse(response);
}

export const AddRank = async (data: any) => {
  const response = await axiosInstance.post(`tms/addRank`, data);
  return checkResponse(response);
}

export const EditRank = async (data: any) => {
  const response = await axiosInstance.post(`tms/updateRank`, data);
  return checkResponse(response);
}

export const DeleteRank = async (id: number) => {
  const response = await axiosInstance.post(`tms/deleteRank`, {
    id:id
  });
  return checkResponse(response);
}

export const DeleteUser = async (id: number) => {
  const response = await axiosInstance.post(`tms/deleteTmsUser`, {
    user_id:id
  });
  return checkResponse(response);
}

export const assignPermissions = async (payload: any) => {
  try {
    const response = await axiosInstance.post(
      `tms/updateRankPermissions`,
      payload
    );
    console.log('response assignPermissions', response);
    return checkResponse(response);
  } catch (error) {
    throw error;
  }
};

export const viewRank = async (id: string) => {
  try {
      
    const response = await axiosInstance.get(
      `tms/viewTmsRank`,{
        params: {
          id: id
        }
      }
      
    );
    
    return checkResponse(response);
    
  } catch (error) {
    throw error;
  }
};

export const UpdateUserTms = async (data: any) => {
  const response = await axiosInstance.post(`tms/updateTmsUser`, data);
  return checkResponse(response);
}

const checkResponse = (response: any) => {
  
  const responseData = response?.data;
  if(responseData?.success){
    return responseData?.data;
  }else{
    console.log('responseData?.message', responseData);
    toast.error(responseData?.message);
    return false;
  }
}