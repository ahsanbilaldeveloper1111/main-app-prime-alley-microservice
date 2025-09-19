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

export const getAllUsers = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
  //  console.log('Sending request with params:', { page, perPage, search, draw, filters });
    
    const response = await axiosInstance.post(
      `users/list`,
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
    
    // console.log('Raw API response:', response);
    // console.log('Response data:', response.data);

    if(isExport){
      // const blob = response.data;
      
      // const mimeType = exportType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf';
      // const fileBlob = new Blob([blob], { type: mimeType });
      
      // const url = window.URL.createObjectURL(fileBlob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `users-export.${exportType === 'excel' ? 'xlsx' : 'pdf'}`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
      toast.success(`${exportType.toUpperCase()} export - comming soon`);
    }
    
    return response?.data?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getParentUsers = async () => {
  try {
    const response = await axiosInstance.post(`users/list`, { show_all: 1 });
    if(response.data){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get parent users');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserById = async (id: string, encrypt: boolean = true) => {
  try {
   
    const response = await axiosInstance.post(
      `users/view`,
      {
        user_id: id,
        encFlag: encrypt
      },
      {
        responseType: 'json',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );
   
    if(response.data){
      const responseData = response.data;
      
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
      }
    }
   
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const assignRoleToUser = async (id: string, role_id: string) => {
  try {
   
    const response = await axiosInstance.post(
      `users/assignRank`,
      {
        user_id: id,
        rank_id: role_id
      },
      {
        responseType: 'json',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );
   
    if(response.data){
      const responseData = response.data;
      
      if(responseData.code === 200){
        toast.success('Rank updated successfully');
      }else{
        toast.error(responseData.message);
      }
    }
   
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const assignGroupToUser = async (id: string, group_id: string) => {
  try {
   
    const response = await axiosInstance.post(
      `users/assignGroup`,
      {
        user_id: id,
        group_id: group_id
      },
      {
        responseType: 'json',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );
   
    if(response.data){
      const responseData = response.data;
      
      if(responseData.code === 200){
        toast.success('Group updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
   
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const updateUserStatus = async (id: string, status: string) => {
  try {
   
    const response = await axiosInstance.post(
      `users/updateStatus`,
      {
        user_id: id,
        status: status
      },
      {
        responseType: 'json',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );
   
    if(response.data){
      const responseData = response.data;
      
      if(responseData.code === 200){
        toast.success('Status updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
   
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const getUserPermissions = async (id: string) => {
  try {
    const response = await axiosInstance.post(`users/permissions`, {
      user_id: id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
        toast.error('Failed to get user permissions');
      return false;
    }
    } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const UpdateExtendedPermission = async (id: string, permissions: string[]) => {
  try {
    
    const response = await axiosInstance.post(`users/extendPermissions`, {
      user_id: id,
      permissions: permissions
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        toast.success('Extended permissions updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
  } catch (error) {
    
  }
}

export const UpdateBlockedPermission = async (id: string, permissions: string[]) => {
  try {
    const response = await axiosInstance.post(`users/blockPermissions`, {
      user_id: id,
      permissions: permissions
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        toast.success('Blocked permissions updated successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const linkUsers = async (user_id: string, link_id: string, module_id: string) => {
  try {
    const response = await axiosInstance.post(`users/linkUsers`, {
      user_id: user_id,
      link_id: link_id, 
      module_id: module_id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        toast.success('User linked successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to link users');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const unlinkUsers = async (id: string, linkedUser: string, moduleId: string) => {
  try {
    const response = await axiosInstance.post(`users/unlinkUsers`, {
      user_id: id,
      link_id: linkedUser,
      module_id: moduleId
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        toast.success('User unlinked successfully');
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to unlink users');
      return false;
    }   
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const GetHierarchyData = async (moduleSlug?: string) => {
  try {
    //console.log("Module Slug", moduleSlug);
    const params = moduleSlug ? { module_slug: moduleSlug } : {};
    const response = await axiosInstance.get(`users/hierarchyData`, { params });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get hierarchy data');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const GetCustomFields = async (user_id: string) => {
  try {
    const response = await axiosInstance.post(`users/list-custom-fields`, {
      user_id: user_id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get custom fields');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}


export const AddCustomFields = async (user_id: string, field_name: string,field_value: string) => {
  try {
    const response = await axiosInstance.post(`users/add-custom-fields`, {
      user_id: user_id,
      field_name: field_name,
      field_value: field_value
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get custom fields');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const UpdateCustomFields = async (id: string, field_name: string,field_value: string) => {
  try {
    const response = await axiosInstance.post(`users/update-custom-fields`, {
      id: id,
      field_name: field_name,
      field_value: field_value
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to update custom fields');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const DeleteCustomFields = async (id: string) => {
  try {
    const response = await axiosInstance.post(`users/delete-custom-fields`, {
      id: id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData?.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to delete custom fields');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const GetModules = async () => {
  try {
    const response = await axiosInstance.get(`users/modules`);
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData?.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get modules');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const MarkAsCompanyAdmin = async (id: string, is_company_admin: boolean) => {
  try {
    const response = await axiosInstance.post(`users/mark-company-admin`, {
      user_id: id,
      is_company_admin: is_company_admin
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        toast.success('Company admin updated successfully');
        return true;
      }
    }else{
      toast.error('Failed to update company admin');
      return false;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}