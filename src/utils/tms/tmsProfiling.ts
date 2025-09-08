
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
      window.location.href = '/tms/login';
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
    const response = {
      "success": true,
      "message": "Success",
      "action": "view",
      "data": [
          {
              "id": 102,
              "name": "ZAIN MEDICAL SUPPLIES TRADING",
              "parent_id": null,
              "created_at": "2025-08-01T13:00:29.980000Z",
              "updated_at": "2025-08-01T13:00:29.980000Z",
              "organization_unit": "OU=calling,OU=customers,DC=sipzon,DC=com",
              "users_count": "8",
              "profile": {
                  "id": 11,
                  "partition": "PT-V-links-Internal",
                  "extention_ranges": [
                      {
                          "start": 10188,
                          "end": 15088
                      }
                  ],
                  "recording_profile": "2_Secondary_Imagicle_Rec_Profile",
                  "mobile_user": "Yes",
                  "sim_ports": [],
                  "additional_info": "added by Rizwan",
                  "company_id": "102",
                  "created_at": "2025-08-04T20:57:46.177000Z",
                  "updated_at": "2025-08-04T21:01:27.570000Z",
                  "app_user": "webdialerauth",
                  "device_pool": "DP-Mobility-DR",
                  "fac_info": "Starlink-DNCL-Prefix",
                  "recording_profile_mobile": "Imagicle_Recording_Profile",
                  "app_user_mobile": null,
                  "device_pool_mobile": "Default",
                  "fact_code": null,
                  "max_users": "40",
                  "user_id_prefix": "S01",
                  "directory_name": null,
                  "allow_gsm": null
              },
              "calling_access": [
                  {
                      "id": 908,
                      "company_id": "102",
                      "front_end_calling_access": "International",
                      "back_end_calling_access": "CSS-ExpProf-G156-MOB-LL",
                      "created_at": "2025-08-01T13:00:30.000000Z",
                      "updated_at": "2025-08-04T20:55:07.977000Z",
                      "allow_dncr": "1",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 909,
                      "company_id": "102",
                      "front_end_calling_access": "Landline",
                      "back_end_calling_access": "CSS-SupTrading-G126-Interntional",
                      "created_at": "2025-08-01T13:00:30.013000Z",
                      "updated_at": "2025-08-04T20:54:01.447000Z",
                      "allow_dncr": "1",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 910,
                      "company_id": "102",
                      "front_end_calling_access": "National",
                      "back_end_calling_access": "CSS-OceanSide-SIP-Mob-LL-I-wPrefix",
                      "created_at": "2025-08-01T13:00:30.027000Z",
                      "updated_at": "2025-08-04T20:56:36.827000Z",
                      "allow_dncr": "1",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 911,
                      "company_id": "102",
                      "front_end_calling_access": "International",
                      "back_end_calling_access": null,
                      "created_at": "2025-08-01T13:00:30.040000Z",
                      "updated_at": "2025-08-01T13:00:30.040000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "1",
                      "company_iccid_id": null
                  },
                  {
                      "id": 912,
                      "company_id": "102",
                      "front_end_calling_access": "Landline",
                      "back_end_calling_access": null,
                      "created_at": "2025-08-01T13:00:30.053000Z",
                      "updated_at": "2025-08-01T13:00:30.053000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "1",
                      "company_iccid_id": null
                  },
                  {
                      "id": 913,
                      "company_id": "102",
                      "front_end_calling_access": "National",
                      "back_end_calling_access": null,
                      "created_at": "2025-08-01T13:00:30.063000Z",
                      "updated_at": "2025-08-01T13:00:30.063000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "1",
                      "company_iccid_id": null
                  },
                  {
                      "id": 914,
                      "company_id": "102",
                      "front_end_calling_access": "International",
                      "back_end_calling_access": "CSS-ExpProf-G156-MOB-LL",
                      "created_at": "2025-08-01T13:00:30.073000Z",
                      "updated_at": "2025-08-04T20:55:02.280000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 915,
                      "company_id": "102",
                      "front_end_calling_access": "Landline",
                      "back_end_calling_access": "CSS-Brillant-SIP-MOB-LL",
                      "created_at": "2025-08-01T13:00:30.080000Z",
                      "updated_at": "2025-08-04T20:51:45.740000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 916,
                      "company_id": "102",
                      "front_end_calling_access": "National",
                      "back_end_calling_access": "CSS-Devisers-Analoge-GP2",
                      "created_at": "2025-08-01T13:00:30.087000Z",
                      "updated_at": "2025-08-04T20:51:27.953000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 926,
                      "company_id": "102",
                      "front_end_calling_access": "fff",
                      "back_end_calling_access": "CSS-Starlink-G158-Mob-LL",
                      "created_at": "2025-08-04T20:52:26.113000Z",
                      "updated_at": "2025-08-04T20:52:31.473000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  },
                  {
                      "id": 927,
                      "company_id": "102",
                      "front_end_calling_access": "2222",
                      "back_end_calling_access": "CSS-CareerH-G130-Mob-LL",
                      "created_at": "2025-08-04T20:52:36.663000Z",
                      "updated_at": "2025-08-04T20:53:24.530000Z",
                      "allow_dncr": "0",
                      "allow_fac_info": "0",
                      "company_iccid_id": null
                  }
              ],
              "iccids": [
                  {
                      "id": 1,
                      "name": "Test1",
                      "iccid_numbers": [
                          "Test1",
                          "Test2",
                          "Test3",
                          "Test3"
                      ],
                      "company_id": "102",
                      "created_at": "2025-08-05T07:31:12.197000Z",
                      "updated_at": "2025-08-05T07:31:12.197000Z"
                  },
                  {
                      "id": 2,
                      "name": "Test2",
                      "iccid_numbers": [
                          "121212"
                      ],
                      "company_id": "102",
                      "created_at": "2025-08-05T07:39:49.310000Z",
                      "updated_at": "2025-08-06T09:51:31.323000Z"
                  }
              ]
          }
      ],
      "pagination": {
          "total": 102,
          "limit": 10,
          "page": 1,
          "last_page": 11,
          "from": 1,
          "to": 10
      }
  };
  const requiredResponse = {
      "draw": 1,
      "recordsTotal": response.pagination.total,
      "recordsFiltered": response.pagination.total,
      "dataList": response.data,
      "meta": response.pagination
    }
    return requiredResponse;
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