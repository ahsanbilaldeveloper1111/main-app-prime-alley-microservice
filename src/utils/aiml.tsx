import { toast } from "react-toastify";
import axiosInstance from "./axios";


  export const GetTranscriptions = async (uuid: string) => {
    try {
        
      const response = await axiosInstance.post(
        `aiml/transcriptions`,
        {
          uuid
        }
      );

      
      if(response.data){
        const responseData = response.data;
        return responseData;
      }else{
        toast.error('Failed to get transcriptions');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

export const GetTranslations = async (uuid: string, target: string) => {
  try {
    const response = await axiosInstance.post(`aiml/translations`, {
      uuid,
      target
    });

    if(response.data){
      const responseData = response.data;
      return responseData;
    }else{
      toast.error('Failed to get translations');
      return false;
    }
  } catch (error) {
    throw error;
  }
};


export const GetCallAnalysis = async (date: string, localPartyNumber: string, ownerUsername: string, uuid: string) => {
  try {
    const response = await axiosInstance.post(`aiml/transcriptions-analysis`, {
      date,
      localPartyNumber,
      ownerUsername,
      uuid
    });

    if(response.data){
      const responseData = response.data;
      return responseData;
    }else{
      toast.error('Failed to get call analysis');
      return false;
    }
  } catch (error) {
    throw error;
  }
};
