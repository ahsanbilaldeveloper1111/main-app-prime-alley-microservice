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
        
      } catch (error) {
        throw error;
      }
    };