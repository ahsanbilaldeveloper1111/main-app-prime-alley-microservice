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

export const ListStatuses = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `tickets/statuses`,
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

export const GetAllStatuses = async () => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/statuses`,{
          all: true
        }
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch statuses');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const UpdateStatus = async (id: string, name: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/update-status`,
        {
          id: id,
          name: name,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Status updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update status');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const DeleteStatus = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/delete-status`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Status deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete status');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateStatus = async (name: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/create-status`,
        {
          name: name,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Status created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create status');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
