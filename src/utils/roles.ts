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

export const ListRoles = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `ranks/list`,
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
    

    if(isExport){
      toast.success(`${exportType.toUpperCase()} export - comming soon`);
    }
    
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getAllRoles = async () => {
    try {
        
      const response = await axiosInstance.get(
        `ranks/get`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch ranks');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const updateRole = async (id: string, name: string, user_type_id?: number | null) => {
    try {
        const payload: any = {
          role_id: id,
          name: name
        };
        
        // Include user_type_id if provided (can be null to remove)
        if (user_type_id !== undefined) {
          payload.user_type_id = user_type_id;
        }
        
      const response = await axiosInstance.post(
        `ranks/update`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code == 200){
          toast.success('Rank updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteRole = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/delete`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Rank deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const addRole = async (name: string, user_type_id?: number | null) => {
    try {
        const payload: any = {
          name: name
        };
        
        // Include user_type_id if provided
        if (user_type_id !== undefined && user_type_id !== null) {
          payload.user_type_id = user_type_id;
        }
        
      const response = await axiosInstance.post(
        `ranks/add`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code == 200){
          toast.success('Rank created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  

  export const updateRankPermissions = async (id: string, permissions: any) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/assignPermissions`,
        {
          id: id,
          permissions: permissions
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const assignPermissions = async (payload: any) => {
    try {
      const response = await axiosInstance.post(
        `ranks/assignPermissions`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        }
      }else{
        toast.error('Failed to assign permissions');
        return false;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const viewRank = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/view`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
  
 

  export const BulkDeleteRoles = async (ids: string[]) => {
    try {
      const response = await axiosInstance.post(`ranks/bulk-delete`, { ids });
      const responseData = response.data;
      if(responseData.code == 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get all user types
  export const getUserTypes = async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get(`users/user-types/get`);
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          return responseData.data || [];
        }else{
          toast.error(responseData.message || 'Failed to fetch user types');
          return [];
        }
      }else{
        toast.error('Failed to fetch user types');
        return [];
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
      return [];
    }
  };

  
