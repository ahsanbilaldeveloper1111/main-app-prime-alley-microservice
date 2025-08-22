import { toast } from "react-toastify";
import axiosInstance from "./axios";
import tokenService from "./tokenService";
import axios from "axios";


interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
}

export const DashboardData = async (filters: any = {}) => {
  try {
    const response = await axiosInstance.get('/tickets/dashboard', {
      params: filters
    });
    return response.data?.data;
  } catch (error) {
    throw error;
  }
};

export const ListTickets = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
    // Build query parameters for the new API
    const queryParams: any = {
      page,
      per_page: perPage,
      ...filters
    };
    
    // Add search if provided
    if (search) {
      queryParams.search = search;
    }
    
    const response = await axiosInstance.post('/tickets/list', {
      page,
      perPage,
      search,
      draw,
      ...filters,
      isExport,
      exportType
    }, {
      responseType: isExport ? 'blob' : 'json',
      headers: isExport ? {
        'Accept': '*/*',
        'Content-Type': 'application/json'
      } : undefined
    });
  
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const GetAllTickets = async () => {
    try {
      const response = await axiosInstance.post('/tickets/list', {
        all: true
      });
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
        `/tickets/update-ticket`,
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

export const UpdateTicketDetails = async (
  id: string, 
  title: string, 
  description: string,
  type: string,
  ticket_status_id: string,
  module_id: string,
  user_extension: string,
  priority?: string,
  due_date?: string
) => {
  try {

    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ticket_type_id', type);
    formData.append('ticket_status_id', ticket_status_id);
    formData.append('module_id', module_id);
    formData.append('user_extension', user_extension);
    if (priority !== undefined) {
      formData.append('priority', priority);
    }
    if (due_date !== undefined) {
      formData.append('due_date', due_date);
    }

    const response = await axiosInstance.post(
      `/tickets/update-ticket`,
      formData
    );
 
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        toast.success('Ticket details updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      } 
    }else{
      toast.error('Failed to update ticket details');
      return false;
    }
    
  } catch (error) {
    throw error;
  }
};

  export const DeleteTicket = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(`/tickets/delete-ticket`, {
        id: id
      });
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Ticket deleted successfully');
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
        toast.error('Failed to delete ticket');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateTicket = async (formData: FormData) => {
    try {
      // Add required fields if not present
      if (!formData.get('created_by')) {
        formData.append('created_by', 'system'); // Default value, should be replaced with actual user
      }
      
      // Debug: Log FormData contents
      console.log('FormData contents:');
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      
      console.log('About to make request to /tickets/create-ticket');
      console.log('FormData instanceof FormData:', formData instanceof FormData);
      console.log('FormData entries count:', Array.from(formData.entries()).length);
      
      // For FormData, we need to let the browser set the Content-Type header automatically
      // Don't override it as it needs to include the boundary parameter
      const response = await axiosInstance.post('/tickets/create-ticket', formData);

      console.log('Response received:', response);

      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Ticket created successfully');
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
        toast.error('Failed to create ticket');
        return false;
      }
      
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      // Log more details about the error
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request was made but no response received:', error.request);
        console.error('Request config:', error.config);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  };

export const GetTicket = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/view-ticket`, {
      id: id
    });
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch ticket');
    }
    
  } catch (error) {
    throw error;
  }
};

export const GetTicketsByStatus = async (statusId: string) => {
  try {
    const response = await axiosInstance.get(`/tickets/by-status/${statusId}`);
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch tickets by status');
    }
    
  } catch (error) {
    throw error;
  }
};

export const AddComment = async (ticketId: string, content: string, userExtension: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/${ticketId}/comments`, {
      content,
      user_extension: userExtension
    });
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        toast.success('Comment added successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      } 
    }else{
      toast.error('Failed to add comment');
      return false;
    }
    
  } catch (error) {
    throw error;
  }
};

export const AddAssigneeComment = async (ticketId: string, content: string, userExtension: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/${ticketId}/assignee-comments`, {
      content,
      user_extension: userExtension
    });
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        toast.success('Assignee comment added successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      } 
    }else{
      toast.error('Failed to add assignee comment');
        return false;
      }
    
  } catch (error) {
    throw error;
  }
};

export const GetComments = async (ticketId: string) => {
  try {
    const response = await axiosInstance.get(`/tickets/${ticketId}/comments`);
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch comments');
    }
    
  } catch (error) {
    throw error;
  }
};

export const GetAssigneeComments = async (ticketId: string) => {
  try {
    const response = await axiosInstance.get(`/tickets/${ticketId}/assignee-comments`);
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch assignee comments');
    }
    
  } catch (error) {
    throw error;
  }
};
