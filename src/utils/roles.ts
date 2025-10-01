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

export const updateRole = async (id: string, name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/update`,
        {
          role_id: id,
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
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

  export const addRole = async (name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/add`,
        {
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
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

  
