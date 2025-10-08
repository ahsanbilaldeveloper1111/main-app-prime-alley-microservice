import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { AxiosResponse } from "axios";


interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
}

export const ListGsmAssign = async (params: PaginationParams = {}): Promise<any> => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response: AxiosResponse<any> = await axiosInstance.post(
      `gsm/assign/list`,
      {
        page,
        perPage,
        search,
        draw,
        ...filters,
        isExport,
        exportType
      },
      {
        responseType: isExport ? 'blob' : 'json',
        headers: isExport ? {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        } : undefined
      }
    );
    
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const AssignPorts = async (gsm_id: string, company_id: string, unassigned_ports: number[]): Promise<boolean> => {
  try {
    const response = await axiosInstance.post(`gsm/assign/ports`, {
      gsm:gsm_id,
      company:company_id,
      ports:unassigned_ports
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const UnassignPorts = async (gsm_id: string, company_id: string, unassigned_ports: number[]) => {
  try {
    const response = await axiosInstance.post(`gsm/unassign/ports`, {
      gsm:gsm_id,
      company:company_id,
      ports:unassigned_ports
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }

  } catch (error) {
    throw error;
  }
};


export const DelinkCompany = async (assign_id: string) => {
  try {
    const response = await axiosInstance.post(`gsm/unassignCompany`, {
      id:assign_id
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
  } catch (error) {
    throw error;
  }
}


export const EditAssign = async (assign_id: string, gsm_ip: string, company_identifier: string) => {
  try {
    const response = await axiosInstance.post(`gsm/assign/update`, {
      id: assign_id,
      gsm: gsm_ip,      
      company: company_identifier
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
  } catch (error) {
    throw error;
  }
}


export const NewAssignement = async (gsm_ip: string, company_identifier: string) => {
  try {
    const response = await axiosInstance.post(`gsm/assign/add`, {
      gsm: gsm_ip,
      company: company_identifier
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
  } catch (error) {
    throw error;
  }
}

export const ViewGsm = async (id: string, params: any = {}): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axiosInstance.get(`gsm/view-gsm/${id}`, { params });
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const GetCompanyList = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axiosInstance.get(`gsm/company/list`);
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getDashboardData = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await axiosInstance.get(`gsm/dashboard`);
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const GetClientGsmProfile = async (params: PaginationParams = {}): Promise<any> => {
  try {
    const { page = 1, perPage = 15, search = "", filters = {} } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('perPage', perPage.toString());
    if (search) queryParams.append('search', search);
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    const response: AxiosResponse<any> = await axiosInstance.get(`gsm/client_gsm_profile?${queryParams.toString()}`);
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const SyncPorts = async (type?: string, gsm?: string): Promise<boolean> => {
  try {
    const requestData: any = {};
    
    if (type) {
      requestData.type = type;
    }
    
    if (gsm) {
      requestData.gsm = gsm;
    }

    const response = await axiosInstance.post(`gsm/ports/sync_ports`, requestData);

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const SyncPortsMobileNumber = async (ports: number[], gsm: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('gsm', gsm);
    ports.forEach(portId => {
      formData.append('ports[]', portId.toString());
    });

    const response = await axiosInstance.post(`gsm/ports/sync_ports_mobile_number`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        const apiResponse = responseData.data;
        if(apiResponse.code == 200){
          toast.success(apiResponse.message);
          return true;
        }else{
          toast.error(apiResponse.message);
          return false;
        }
      }else{
        toast.error(responseData.message);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const SendGsmUssd = async (params: any = {}) => {
  try {
    const response = await axiosInstance.post(`gsm/send_ussd`, params);
    return response?.data?.data;
  } catch (error) {
    throw error;
  }
};

export const SendSms = async (params: any = {}) => {
  try {
    const response = await axiosInstance.post(`gsm/send_sms`, params);
    return response?.data?.data;
  } catch (error) {
    throw error;
  }
};

