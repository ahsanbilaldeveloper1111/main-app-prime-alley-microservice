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

export const ListTypes = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
    const response = await axiosInstance.post(
      `/tickets/types`,
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

export const GetAllTypes = async () => {
    try {
        
      const response = await axiosInstance.post(
        `/tickets/types`,{
          all: true
        }
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch ticket types');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const UpdateType = async (id: string, name: string, description: string) => {
    try {
        
      const response = await axiosInstance.post(
        `/tickets/update-type`,
        {
          id: id,
          name: name,
          description: description
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Ticket type updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update ticket type');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const DeleteType = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `/tickets/delete-type`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Ticket type deleted successfully');
            return true;
          }else{
            toast.error(responseData?.data?.message);
            return false;
          }
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete ticket type');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateType = async (name: string, description: string) => {
    try {
      const response = await axiosInstance.post('/tickets/create-type', {
        name: name,
        description: description
      });

      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Ticket type created successfully');
            return true;
          }else{
            toast.error(responseData?.data?.message);
            return false;
          }
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create ticket type');
        return false;
      }
      
    } catch (error) {
      console.error('Error creating ticket type:', error);
      throw error;
    }
  };

export const GetType = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/view-type`, {
      id: id
    });
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch ticket type');
    }
    
  } catch (error) {
    throw error;
  }
};
