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