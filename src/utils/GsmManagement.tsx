import { toast } from "react-toastify";
import axiosInstance from "./axios";


interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
}

export const ListGsmManagement = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `gsm/list`,
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
    
    return response.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const ListGsmInbox = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
    
    // Build query parameters, only including non-empty values
    const queryParams: any = {
      page,
      perPage,
      search,
      draw,
    };
    
    // Add filter parameters if they exist and are not empty
    if (filters.gsm_id && filters.gsm_id !== '') {
      queryParams.gsm_id = filters.gsm_id;
    }
    if (filters.sender && filters.sender.trim() !== '') {
      queryParams.sender = filters.sender.trim();
    }
    
    console.log('Final query params:', queryParams);
    
    const response = await axiosInstance.get(
      `gsm/inbox/list`,
      {
        params: queryParams,
      },
    );
    
    // Handle the nested response structure
    const responseData = response.data?.data;
    if (responseData) {
      return {
        data: responseData.data || [],
        total: responseData.recordsTotal || 0,
        per_page: perPage,
        current_page: page,
        last_page: Math.ceil((responseData.recordsTotal || 0) / perPage),
        from: ((page - 1) * perPage) + 1,
        to: Math.min(page * perPage, responseData.recordsTotal || 0),
      };
    }
    
    return {
      data: [],
      total: 0,
      per_page: perPage,
      current_page: page,
      last_page: 1,
      from: 0,
      to: 0,
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getGsmData = async () => {
    try {
        
      const response = await axiosInstance.get(
        `gsm/getGsmData`
      );
      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
            const apiResponse = responseData.data;
            return apiResponse;
        }else{
            toast.error(responseData.message);
            return false;
        }
      }else{
        toast.error('Failed to fetch gsm');
        return false;
      }
    } catch (error) {
      throw error;
    }
  };

export const updateGsm = async (id: string, name: string, ip_address: string, username: string, password: string, status: string) => {
    try {
        
      const response = await axiosInstance.post(
        `gsm/update`,
        {
          id: id,
          name: name,
          ip_address: ip_address,
          username: username,
          password: password,
          status: status
        }
      );
      if(response.data){
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
          }else{
            toast.error('Failed to update GSM');
            return false;
          }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteGsm = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `gsm/delete`,
        {
          id: id
        }
      );

      if(response.data){
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
          }else{
            toast.error('Failed to create GSM');
            return false;
          }
     
      
    } catch (error) {
      throw error;
    }
  };

  export const addGsm = async (name: string, ip_address: string, username: string, password: string) => {
    try {
        
      const response = await axiosInstance.post(
        `gsm/add`,
        {
          name: name,
          ip_address: ip_address,
          username: username,
          password: password
        }
      );
      if(response.data){
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
      }else{
        toast.error('Failed to create GSM');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };


  export const DashboardData = async () => {
    try {
        
      const response = await axiosInstance.get(
        `gsm/dashboard`
      );
      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
            const apiResponse = responseData?.data?.data;
            return apiResponse;
        }else{
            toast.error(responseData.message);
            return false;
        }
      }else{
        toast.error('Failed to fetch dashboard data');
        return false;
      }
    } catch (error) {
      throw error;
    }
  };