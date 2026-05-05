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
    
    const response = await axiosInstance.post(
      `/tickets/modules`,
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
        `/tickets/modules`,{
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

export const UpdateModule = async (id: string, name: string, description: string, color: string, user_extension?: string | null) => {
    try {
        
      const response = await axiosInstance.post(
        `/tickets/update-module`,
        {
          id: id,
          name: name,
          description: description,
          color: color,
          user_extension: user_extension
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
        `/tickets/delete-module`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Module deleted successfully');
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
        toast.error('Failed to delete module');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const CreateModule = async (name: string, description: string, color: string, user_extension?: string | null) => {
    try {
      const response = await axiosInstance.post('/tickets/create-module', {
        name: name,
        description: description,
        color: color,
        user_extension: user_extension
      });

      if(response){
        const responseData = response.data;
        if(responseData.code == 200){
          if(responseData?.data?.success == true){
            toast.success('Module created successfully');
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
        toast.error('Failed to create module');
        return false;
      }
      
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  };

export const GetModule = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/view-module`, {
      id: id
    });
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch module');
    }
    
  } catch (error) {
    throw error;
  }
};

// Submodule functions
export const ListSubmodules = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;

    const response = await axiosInstance.post(
      `/tickets/submodules`,
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

export const GetAllSubmodules = async () => {
  try {
    const response = await axiosInstance.get(`/tickets/submodules/all`);
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch submodules');
    }
  } catch (error) {
    throw error;
  }
};

export const CreateSubmodule = async (name: string, description: string, module_id: string, user_extension?: string | null) => {
  try {
    const response = await axiosInstance.post('/tickets/create-submodule', {
      name: name,
      description: description,
      module_id: module_id,
      user_extension: user_extension
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        if(responseData?.data?.success == true){
          toast.success('Submodule created successfully');
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
      toast.error('Failed to create submodule');
      return false;
    }
  } catch (error) {
    console.error('Error creating submodule:', error);
    throw error;
  }
};

export const UpdateSubmodule = async (id: string, name: string, description: string, module_id: string, color: string, user_extension?: string | null) => {
  try {
    const response = await axiosInstance.post(
      `/tickets/update-submodule`,
      {
        id: id,
        name: name,
        description: description,
        module_id: module_id,
        color: color,
        user_extension: user_extension
      }
    );
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        toast.success('Submodule updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      } 
    }else{
      toast.error('Failed to update submodule');
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const DeleteSubmodule = async (id: string) => {
  try {
    const response = await axiosInstance.post(
      `/tickets/delete-submodule`,
      {
        id: id
      }
    );
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        if(responseData?.data?.success == true){
          toast.success('Submodule deleted successfully');
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
      toast.error('Failed to delete submodule');
      return false;
    }
  } catch (error) {
    throw error;
  }
};

// Submodule child functions
export const ListSubmoduleChildren = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
    const response = await axiosInstance.post(
      `/tickets/submodule-children`,
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

export const GetAllSubmoduleChildren = async () => {
  try {
    const response = await axiosInstance.get(`/tickets/submodule-children/all`);
    if(response.data){
      return response.data?.data;
    }else{
      toast.error('Failed to fetch submodule children');
    }
  } catch (error) {
    throw error;
  }
};

export const CreateSubmoduleChild = async (name: string, description: string, module_id: string, submodule_id: string, user_extension?: string | null) => {
  try {
    const response = await axiosInstance.post('/tickets/create-submodule-child', {
      name: name,
      description: description,
      module_id: module_id,
      submodule_id: submodule_id,
      user_extension: user_extension
    });

    if(response){
      const responseData = response.data;
      if(responseData.code == 200){
        if(responseData?.data?.success == true){
          toast.success('Submodule child created successfully');
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
      toast.error('Failed to create submodule child');
      return false;
    }
  } catch (error) {
    console.error('Error creating submodule child:', error);
    throw error;
  }
};

export const UpdateSubmoduleChild = async (id: string, name: string, description: string, submodule_id: string, color: string, user_extension?: string | null) => {
  try {
    const response = await axiosInstance.post(
      `/tickets/update-submodule-child`,
      {
        id: id,
        name: name,
        description: description,
        submodule_id: submodule_id,
        color: color,
        user_extension: user_extension
      }
    );
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        toast.success('Submodule child updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      } 
    }else{
      toast.error('Failed to update submodule child');
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const DeleteSubmoduleChild = async (id: string) => {
  try {
    const response = await axiosInstance.post(
      `/tickets/delete-submodule-child`,
      {
        id: id
      }
    );
    if(response.data){
      const responseData = response.data;
      if(responseData.code == 200){
        if(responseData?.data?.success == true){
          toast.success('Submodule child deleted successfully');
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
      toast.error('Failed to delete submodule child');
      return false;
    }
  } catch (error) {
    throw error;
  }
};
