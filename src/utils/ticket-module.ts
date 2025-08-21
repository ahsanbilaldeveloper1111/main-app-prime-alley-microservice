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

export const ListModules = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `tickets/modules`,
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
  
    
    return response?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const GetAllModules = async () => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/modules`,{
          all: true
        }
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch modules');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const UpdateModule = async (id: string, name: string, description: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/update-module`,
        {
          id: id,
          name: name,
          description: description,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Module updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update module');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const DeleteModule = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/delete-module`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Module deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete module');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateModule = async (name: string, description: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/create-module`,
        {
          name: name,
          description: description,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Module created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create module');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
