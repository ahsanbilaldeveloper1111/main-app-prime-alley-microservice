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
  moduleSlug?: string;
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
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '', moduleSlug = '' } = params;
    
    // Build query parameters for the new API
    const queryParams: any = {
      page,
      per_page: perPage,
      module_slug: moduleSlug,
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
      exportType,
      module_slug: moduleSlug
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
  submodule_id: string,
  submodule_child_id?: string,
  user_extension?: string | string[],
  priority?: string,
  due_date?: string,
  images?: (string | File)[],
  tags?: string[],
  is_approved?: boolean
) => {
  try {

    const formData = new FormData();
    formData.append('id', id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ticket_type_id', type);
    formData.append('ticket_status_id', ticket_status_id);
    formData.append('module_id', module_id);
    formData.append('submodule_id', submodule_id);
    if (submodule_child_id) {
      formData.append('submodule_child_id', submodule_child_id);
    }
    if (user_extension) {
      // Handle both array and single value for backward compatibility
      if (Array.isArray(user_extension)) {
        user_extension.forEach((ext) => {
          formData.append('user_extension[]', ext);
        });
      } else {
        formData.append('user_extension[]', user_extension);
      }
    }
    if (priority !== undefined) {
      formData.append('priority', priority);
    }
    if (due_date !== undefined) {
      formData.append('due_date', due_date);
    }
    if (tags && tags.length > 0) {
      tags.forEach((tag) => {
        formData.append('tags[]', tag);
      });
    }
    if (is_approved !== undefined) {
      formData.append('is_approved', String(is_approved));
    }
    
    // Append images if provided - handle both strings (existing) and Files (new)
    if (images && images.length > 0) {
      images.forEach((image) => {
        if (image instanceof File) {
          // New file - append as File
          formData.append('image[]', image);
        } else {
          // Existing image string - append as string
          formData.append('image[]', image);
        }
      });
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

  export const CreateUserTicket = async (
    title: string,
    description: string,
    ticket_type_id: number,
    priority: number,
    images?: File[]
  ) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('ticket_type_id', ticket_type_id.toString());
      formData.append('ticket_status_id', '1');
      formData.append('priority', priority.toString());
      
      // Append images if provided
      if (images && images.length > 0) {
        images.forEach((image) => {
          formData.append('image[]', image);
        });
      }

      const response = await axiosInstance.post('/tickets/create-user-ticket', formData);

      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            return responseData?.data;
          }else{
            toast.error(responseData?.data?.message || 'Failed to create ticket');
            return false;
          }
        }else{
          toast.error(responseData.message || 'Failed to create ticket');
          return false;
        } 
      }else{
        toast.error('Failed to create ticket');
        return false;
      }
      
    } catch (error: any) {
      console.error('Error creating user ticket:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create ticket';
      toast.error(errorMessage);
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

export const AddComment = async (ticketId: string, content: string, userExtension: string, attachment?: File) => {
  try {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('user_extension', userExtension);
    
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await axiosInstance.post(`/tickets/${ticketId}/comments`, formData);
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

export const AddAssigneeComment = async (ticketId: string, content: string, userExtension: string, attachment?: File) => {
  try {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('user_extension', userExtension);
    
    if (attachment) {
      formData.append('attachment', attachment);
    }

    const response = await axiosInstance.post(`/tickets/${ticketId}/assignee-comments`, formData);
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


export const loadImage = async (image: string) => {
  try {
    const response = await axiosInstance.get(`/${image}`, {
      params: { image: image },
      // responseType: 'blob'
    });
    if(response?.data){
      return response.data?.data?.base64_data_url;
    }else{
      toast.error('Failed to load image');
    }
  } catch (error) {
    throw error;
  }
};