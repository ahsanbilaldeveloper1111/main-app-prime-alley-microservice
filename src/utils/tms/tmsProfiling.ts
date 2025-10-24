
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


export const ListCustomerProfiling = async () => {
    const response = await axiosInstance.get(`tms/getCompanies`, {
        params: {
            page: 1,
            perPage: 10,
            search: "",
            draw: 1,
            load_calling_access:true,
            load_profile:true,
            user_count:true,
            load_company_iccid:true
        }
    });
    handleTmsAuthError(response);
    const responseData = response?.data?.data; 
    return transformApiResponse(responseData, 1);
}

export const DeleteCompany = async (id: number) => {
    const response = await axiosInstance.delete(`tms/deleteCompany`, {
        params: {
            id: id
        }
    });
    handleTmsAuthError(response);
    return response?.data?.data;
}

export const AddUpdateICCID = async (data: any) => {
    const response = await axiosInstance.post(`tms/company/create-update-company-iccid`, data);
    handleTmsAuthError(response);
    if(response?.data?.success===false){
        toast.error(response?.data?.message);
        toast.error(response?.data?.response?.message);
        return false;
    }
    return response?.data?.data;
}

export const ListDratCustomerProfile = async () => {
    const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "id": 164,
                "company_id": "98",
                "user_id": "testnewuser98_S99",
                "data": {
                    "companyName": "XYZ FZ LLC",
                    "extensionNumber": 20214,
                    "firstName": "testnewuser",
                    "email": "ahsanbilal11@gmail.com",
                    "lastName": "98",
                    "displayName": "testnewuser 98",
                    "userId": "testnewuser98_S99",
                    "country": "Pakistan",
                    "company_id": 98,
                    "department": "test",
                    "jobTitle": "test",
                    "password": "2:_xqn>Dbc1c",
                    "client_transactionid": "tms-b4ffd7a9ca6242e58c97",
                    "update_user": false,
                    "verify": false
                },
                "created_at": "2025-08-28T22:35:05.757000Z",
                "updated_at": "2025-08-28T22:35:05.757000Z",
                "company": {
                    "id": 98,
                    "name": "XYZ FZ LLC",
                    "parent_id": null,
                    "created_at": "2025-07-23T11:48:47.443000Z",
                    "updated_at": "2025-07-23T15:04:55.887000Z",
                    "organization_unit": "OU=xyzllc,OU=customers,DC=sipzon,DC=com"
                }
            }
        ],
        "pagination": {
            "total": 1,
            "limit": 10,
            "page": 1,
            "last_page": 1,
            "from": 1,
            "to": 1
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



export const ListCustomerProfilingLogs = async (params: PaginationParams = {}) => {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, } = params;
    const response = await axiosInstance.get(
        `tms/getProfillingLog`,
        {
            params: {
                page,
                perPage,
                search,
                draw,
                load_user:true,
                load_company:true,
                ...filters
            }
        }
    );
    handleTmsAuthError(response);
    const responseData = response?.data?.data; 
    return transformApiResponse(responseData, draw);
}


export const  ListCompanies = async (parantid:number|null = null, ids:number[] = []) => {

    const response = await axiosInstance.get(
        `tms/getCompanies`,
        {
            params: {
                load_calling_access:true,
                load_profile:true,
                load_company_iccid:true,
                parent_id:parantid,
                ids:ids
            }
        }
    );
    handleTmsAuthError(response);
    const responseData = response?.data?.data; 
    return transformApiResponse(responseData, 1);
}

export const  ListRoutePartitions   = async () => {
    //http://crmstaging.sipzon.com:7580/api/cisco-pbx-response/list-route-partition?search=&cluster_name=SIPZON
    const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON",
                "name": "TOYOTA-Z",
                "description": "TOYOTA-Z",
                "dialPlanWizardGenId": "",
                "timeScheduleIdName": "",
                "useOriginatingDeviceTimeZone": "true",
                "timeZone": "Etc\/GMT",
                "partitionUsage": "General"
            }
        ]
    };
    if(response.success){
        return response.data;
    }
    return [];
}

export const ListFacilitiesInfo = async () => {
    //http://crmstaging.sipzon.com:7580/api/cisco-pbx-response/list-fac-info?search=&cluster_name=SIPZON
    const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON",
                "name": "111242113212111",
                "code": "111242113212111",
                "authorizationLevel": "0"
            }
        ]
    };

    if(response.success){
        return response.data;
    }
    return [];

}


export const ListAppUsers = async () => {
    //http://crmstaging.sipzon.com:7580/api/cisco-pbx-response/list-app-user?search=&cluster_name=SIPZON
    const response = {
        "success": true,
        "message": "Success",
        "action": "view",
        "data": [
            {
                "ClusterName": "SIPZON",
                "userid": "appadmin",
                "presenceGroupName": "Standard Presence group",
                "acceptPresenceSubscription": "false",
                "acceptOutOfDialogRefer": "false",
                "acceptUnsolicitedNotification": "false",
                "allowReplaceHeader": "false",
                "isStandard": "true"
            }
        ]
    }
    if(response.success){
        return response.data;
    }
    return [];

}


export const createUpdateCompanyCallingAccess = async (data: any) => {
    const response = await axiosInstance.post(`tms/createUpdateCompanyCallingAccess`, data);
    handleTmsAuthError(response);
    
}

export const createUpdateCompanyProfile = async (data: any) => {
    const response = await axiosInstance.post(`tms/createUpdateCompanyProfile`, data);
    handleTmsAuthError(response);
    return response?.data?.data;
}

export const GetCompany = async (id: number) => {
    const response = await axiosInstance.get(`tms/getCompany`, {
        params: {
            id: id
        }
    });
    handleTmsAuthError(response);
    return response?.data?.data;
}

export const GetAvailableCompanyIccids = async (companyId: number, userId: number) => {
    const response = await axiosInstance.get(`tms/getAvailableCompanyIccids`, {
        params: {
            company_id: companyId,
            user_id: userId
        }
    });
    handleTmsAuthError(response);
    return response?.data?.data;
}

export const GetAvailableExtensions = async (companyId: number) => {
    const response = await axiosInstance.get(`tms/getCompanyAvailableExtensions`, {
        params: {
            id: companyId
        }
    });
    handleTmsAuthError(response);
    return response?.data?.data;
}

export const generateFacCode = async (data: any): Promise<any> => {
    try {
      const response = await axiosInstance.post(
        "/tms/company/generate-fac-code",
        data
      );
      handleTmsAuthError(response);
    return response?.data?.data;
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate FAC code");
      throw error;
    }
  };
  
  export const createUpdateCompany = async (data: any): Promise<any> => {
    try {
      const response = await axiosInstance.post(
        "/tms/createUpdateCompanyProfile",
        data
      );
      handleTmsAuthError(response);
      return response?.data?.data;
    } catch (error: any) {
      toast.error(error?.message || "Failed to create/update company");
      throw error;
    }
  };