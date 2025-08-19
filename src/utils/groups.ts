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

export const ListGroups = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `groups/list`,
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

export const getAllGroups = async () => {
    try {
        
      const response = await axiosInstance.get(
        `groups/get`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch groups');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const updateGroup = async (id: string, name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/update`,
        {
          group_id: id,
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteGroup = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/delete`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const addGroup = async (name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/add`,
        {
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
