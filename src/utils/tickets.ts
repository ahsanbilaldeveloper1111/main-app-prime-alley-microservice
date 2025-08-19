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

export const ListTickets = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `tickets/list`,
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

export const GetAllTickets = async () => {
    try {
        
      const response = await axiosInstance.get(
        `tickets/list`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch tickets');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const UpdateTicket = async (id: string, name: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/update-ticket`,
        {
          id: id,
          name: name,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Ticket updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update ticket');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const DeleteTicket = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/delete-ticket`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Ticket deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete ticket');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateTicket = async (name: string, color: string) => {
    try {
        
      const response = await axiosInstance.post(
        `tickets/create-ticket`,
        {
          name: name,
          color: color
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Ticket created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create ticket');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
