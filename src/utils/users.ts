import { toast } from "react-toastify";
import { reportApiErrorFromCatch } from "./sentryLogger";
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
    
    

    if(isExport){
      toast.success(`${exportType.toUpperCase()} export - comming soon`);
    }
    
    return response?.data?.data;
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
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
        return false;
      }
    }else{
      toast.error('Failed to get parent users');
      return false;
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
};
export const GetUserProfile = async (id: string, encrypt: boolean = true) => {
  try {
   
    const response = await axiosInstance.get(
      `users/profile`,
      {params: {user_id: id, encFlag: encrypt}}
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
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
};

export const getUserProfileData = async (user_id: string) => {
  try {
    const response = await axiosInstance.get(`users/profile/get`, {
      params: { user_id }
    });
    if(response.data){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return null;
      }
    }
    return null;
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
};

const PROFILE_FORM_KEYS = [
  'title', 'first_name', 'last_name', 'email', 'phone_number', 'gender', 'job_title',
  'department', 'country', 'state', 'city', 'postal_code', 'address', 'timezone',
  'service_type', 'language'
] as const;

function appendProfileToFormData(formData: FormData, profileData: Record<string, unknown>): void {
  for (const key of PROFILE_FORM_KEYS) {
    const value = profileData[key];
    if (value) formData.append(key, String(value));
  }
  if (profileData.user_consent !== undefined) {
    formData.append('user_consent', String(profileData.user_consent));
  }
}

export const updateUserProfile = async (user_id: string, profileData: any, profilePicture?: File) => {
  try {
    const formData = new FormData();
    formData.append('user_id', user_id);
    appendProfileToFormData(formData, profileData);
    if (profilePicture) formData.append('profile_picture', profilePicture);

    const response = await axiosInstance.post(
      `users/profile/update`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const responseData = response.data;
    if (!responseData) return false;
    if (responseData.code === 200) {
      toast.success('Profile updated successfully');
      return responseData.data;
    }
    throw new Error(responseData.message);
  } catch (error: any) {
    reportApiErrorFromCatch(error, 'users');
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
        return true;
      }else{
        toast.error(responseData.message);
      }
    }
   
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
};

export const assignRankBulk = async (rank_id: string | number, user_ids: string[]) => {
  try {
    const response = await axiosInstance.post(
      `users/assignBulkRank`,
      {
        rank_id: rank_id,
        user_ids: user_ids
      }
      
    );
   
    if(response.data){
      const responseData = response.data;
      
      if(responseData.code === 200){
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }
    return false;
   
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    toast.error('Failed to assign ranks');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const GetHierarchyData = async (moduleSlug?: string) => {
  try {
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
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
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const SyncLdapUsers = async () => {
  try {
    const response = await axiosInstance.get(`users/syncLdapUsers`);
    if(response){
      console.log('Response:', response);
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to sync LDAP users');
      return false;
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const LinkCompany = async (user_id: string, company_id: string, module_id: string) => {
  try {
    const response = await axiosInstance.post(`users/linkCompany`, {
      user_id: user_id,
      company_id: company_id,
      module_id: module_id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
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
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const UnlinkCompany = async (id: string) => {
  try {
    const response = await axiosInstance.post(`users/unlinkCompany`, {
      id: id
    });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return true;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to unlink company');
      return false;
    }   
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const GetCompanies = async () => {
  try {
    const response = await axiosInstance.get(`users/getCompanies`);
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData?.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get companies');
      return false;
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const GetDepartments = async () => {
  try {
    const response = await axiosInstance.get(`users/departments`);
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData?.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
    }else{
      toast.error('Failed to get companies');
      return false;
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const GetMinifiedUsers = async (params: Record<string, unknown> = {}) => {
  try {
    const response = await axiosInstance.get(`users/users`, { params });
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData?.data;
      }else{
        toast.error(responseData.message);
        return [];
      }
    }else{
      toast.error('Failed to get users');
      return [];
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const SyncBillingCompanies = async () => {
  try {
    const response = await axiosInstance.get(`users/syncBillingCompanies`);
    if(response){
      const responseData = response.data;
      if(responseData.code === 200){
        return responseData.data;
      }
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const getUserAccessLevelSummary = async (userId?: string, encFlag?: boolean) => {
  try {
    const response = await axiosInstance.post(
      `users/userAccessLevelSummary`,
      {
        ...(userId ? { user_id: userId } : {}),
        ...(encFlag === undefined ? {} : { encFlag })
      }
    );
    if(response.data){
      const responseData = response.data;
      if(responseData.status === "success" || responseData.code === 200){
        return responseData.data;
      }else{
        toast.error(responseData.message || 'Failed to fetch user access level summary');
        return null;
      }
    }else{
      toast.error('Failed to fetch user access level summary');
      return null;
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Reset user password
 * @param data - Object containing username, password, and password_confirmation
 * @param endpoint - Optional API endpoint (defaults to 'users/reset-password')
 * @returns Promise with API response
 */
export const resetUserPassword = async (
  data: { username: string; password: string; password_confirmation: string },
  endpoint: string = 'users/reset-password'
) => {
  try {
    const response = await axiosInstance.post(endpoint, data);
    return response?.data;
  } catch (error: any) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
}

export const mainAppAuditLogs = async (params: Record<string, unknown> = {}) => {
  try {
    const response = await axiosInstance.get(`users/audit-logs`, { params });
    if (response) {
      const responseData = response.data;
      if (responseData.code === 200) {
        return responseData.data;
      }
    }
  } catch (error) {
    reportApiErrorFromCatch(error, 'users');
    console.error('API Error:', error);
    throw error;
  }
};