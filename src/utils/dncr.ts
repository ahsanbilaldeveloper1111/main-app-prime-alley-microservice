import { toast } from "react-toastify";
import axiosInstance from "./axios";


  export const CheckNumber = async (phoneNumber: string) => {
    try {
        
      const response = await axiosInstance.post(
        `dncr/checkNumber`,
        {
          numbers: phoneNumber
        }
      );
      if(response?.data){
        const responseData = response?.data?.data;
        return responseData;
      }else{
        toast.error('Failed to check number');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };


  export const BulkCheckNumber = async (formData: FormData) => {
      try { 
          
        // Debug logging for FormData
        console.log('=== BULK CHECK NUMBER DEBUG ===');
        console.log('FormData entries:', Array.from(formData.entries()));
        console.log('FormData keys:', Array.from(formData.keys()));
        console.log('FormData values:', Array.from(formData.values()));
        
        const response = await axiosInstance.post(
          `dncr/bulkCheckNumbers`,
          formData
        );
        if(response?.data){
          const responseData = response?.data?.data;
          return responseData;
        }else{
          toast.error('Failed to check number');
          return false;
        }
        
      } catch (error: any) {
        console.error('=== BULK CHECK NUMBER ERROR ===');
        console.error('Error:', error);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          console.error('Response headers:', error.response.headers);
        }
        throw error;
      }
    };

  // Local DND Blocks APIs
  export interface LocalDNDBlockRecord {
    id: number;
    called_number: string;
    company_name: string;
    date_time: string;
    comments: string;
  }

  export interface LocalDNDResponse {
    status: string;
    total: number;
    records: LocalDNDBlockRecord[];
    limit: number;
    offset: number;
  }

  export interface AddLocalDNDResponse {
    status: string;
    message: string;
    record_id: number;
  }

  export interface BulkAddLocalDNDResponse {
    status: string;
    message: string;
    records_added?: number;
  }

  export interface BulkDeleteLocalDNDResponse {
    status: string;
    message: string;
  }

  // Fetch Local DND Blocks
  export const fetchLocalDNDBlocks = async (params?: {
    limit?: number;
    offset?: number;
    search?: string;
    company?: string;
  }) => {
    try {
      const response = await axiosInstance.get<LocalDNDResponse>('/dncr/local-dnd-blocks', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Local DND blocks:', error);
      throw error;
    }
  };

  // Add Single Local DND Block
  export const addLocalDNDBlock = async (data: {
    called_number: string;
    company_name?: string;
    comments?: string;
  }) => {
    try {
      const payload: any = {
        called_number: data.called_number.trim(),
      };

      if (data.company_name?.trim()) {
        payload.company_name = data.company_name.trim();
      }
      if (data.comments?.trim()) {
        payload.comments = data.comments.trim();
      }

      const response = await axiosInstance.post<AddLocalDNDResponse>('/dncr/local-dnd-blocks/add', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error adding Local DND block:', error);
      throw error;
    }
  };

  // Delete Single Local DND Block
  export const deleteLocalDNDBlock = async (recordId: number) => {
    try {
      const response = await axiosInstance.delete(`/dncr/local-dnd-blocks/delete/${recordId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting Local DND block:', error);
      throw error;
    }
  };

  // Bulk Delete Local DND Blocks
  export const bulkDeleteLocalDNDBlocks = async (ids: number[]) => {
    try {
      const response = await axiosInstance.post<BulkDeleteLocalDNDResponse>('/dncr/local-dnd-blocks/bulk-delete', { ids });
      return response.data;
    } catch (error: any) {
      console.error('Error bulk deleting Local DND blocks:', error);
      throw error;
    }
  };

  // Bulk Add Local DND Blocks
  export const bulkAddLocalDNDBlocks = async (payload: { records: Array<{ called_number: string; comments?: string }> }) => {
    try {
      const response = await axiosInstance.post<BulkAddLocalDNDResponse>('/dncr/local-dnd-blocks/bulk-add', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error bulk adding Local DND blocks:', error);
      throw error;
    }
  };