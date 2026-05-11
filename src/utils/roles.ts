import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { postPagedList, type PaginationParams } from "./paginatedList";


export const ListRoles = async (params: PaginationParams = {}) => {
  return await postPagedList(`ranks/list`, params, { context: "ranks" });
};

export const getAllRoles = async () => {
    try {
        
      const response = await axiosInstance.get(
        `ranks/get`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch ranks');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const updateRole = async (id: string, name: string, user_type_id?: number | null) => {
    try {
        const payload: any = {
          role_id: id,
          name: name
        };
        
        // Include user_type_id if provided (can be null to remove)
        if (user_type_id !== undefined) {
          payload.user_type_id = user_type_id;
        }
        
      const response = await axiosInstance.post(
        `ranks/update`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code == 200){
          toast.success('Rank updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteRole = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/delete`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Rank deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const addRole = async (name: string, user_type_id?: number | null) => {
    try {
        const payload: any = {
          name: name
        };
        
        // Include user_type_id if provided
        if (user_type_id !== undefined && user_type_id !== null) {
          payload.user_type_id = user_type_id;
        }
        
      const response = await axiosInstance.post(
        `ranks/add`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code == 200){
          toast.success('Rank created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  

  export const updateRankPermissions = async (id: string, permissions: any) => {
    try {
        
      const response = await axiosInstance.post(
        `ranks/assignPermissions`,
        {
          id: id,
          permissions: permissions
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const assignPermissions = async (payload: any) => {
    try {
      const response = await axiosInstance.post(
        `ranks/assignPermissions`,
        payload
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        }
      }else{
        toast.error('Failed to assign permissions');
        return false;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  /** Next.js `router.query.id` may be `string | string[] | undefined`. */
  function normalizeRankRouteId(id: string | string[] | undefined): string | null {
    if (id == null) return null;
    const raw = Array.isArray(id) ? id[0] : id;
    const s = String(raw).trim();
    return s === "" ? null : s;
  }

  export const viewRank = async (id: string | string[] | undefined) => {
    const rankId = normalizeRankRouteId(id);
    if (rankId == null) {
      toast.error("Invalid rank");
      throw new Error("Invalid rank id");
    }
    try {
      const response = await axiosInstance.post(`ranks/view`, {
        id: rankId,
        role_id: rankId,
      });
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          return responseData.data;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to rank');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };
  
 

  export const BulkDeleteRoles = async (ids: string[]) => {
    try {
      const response = await axiosInstance.post(`ranks/bulk-delete`, { ids });
      const responseData = response.data;
      if(responseData.code == 200){
        return responseData.data;
      }else{
        toast.error(responseData.message);
        return false;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get all user types
  export const getUserTypes = async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get(`users/user-types/get`);
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          return responseData.data || [];
        }else{
          toast.error(responseData.message || 'Failed to fetch user types');
          return [];
        }
      }else{
        toast.error('Failed to fetch user types');
        return [];
      }
    } catch (error) {
      console.error('Error fetching user types:', error);
      return [];
    }
  };

  // Get all modules
  export const getModules = async (): Promise<any[]> => {
    try {
      const response = await axiosInstance.get(`users/modules`);
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          return responseData.data || [];
        }else{
          toast.error(responseData.message || 'Failed to fetch modules');
          return [];
        }
      }else{
        toast.error('Failed to fetch modules');
        return [];
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      return [];
    }
  };

  // Get permissions by module
  export const getPermissionsByModule = async (moduleId: number): Promise<any[]> => {
    try {
      const response = await axiosInstance.get(`ranks/permissions-by-module`, {
        params: {
          module_id: moduleId
        }
      });
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          return responseData.data || [];
        }else{
          toast.error(responseData.message || 'Failed to fetch permissions');
          return [];
        }
      }else{
        toast.error('Failed to fetch permissions');
        return [];
      }
    } catch (error) {
      console.error('Error fetching permissions by module:', error);
      return [];
    }
  };

  // Update severity level
  export const updateSeverityLevel = async (permissionId: number, moduleId: number, severityLevel: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post(`ranks/update-severity-level`, {
        permission_id: permissionId,
        module_id: moduleId,
        severity_level: severityLevel
      });
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Severity level updated successfully');
          return true;
        }else{
          toast.error(responseData.message || 'Failed to update severity level');
          return false;
        }
      }else{
        toast.error('Failed to update severity level');
        return false;
      }
    } catch (error) {
      console.error('Error updating severity level:', error);
      toast.error('Failed to update severity level');
      return false;
    }
  };

  // Clone rank
  export const cloneRank = async (id: string, name: string): Promise<boolean> => {
    try {
      const response = await axiosInstance.post(
        `ranks/clone/${id}`,
        { name: name }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Rank cloned successfully');
          return true;
        }else{
          toast.error(responseData.message || 'Failed to clone rank');
          return false;
        }
      }else{
        toast.error('Failed to clone rank');
        return false;
      }
    } catch (error) {
      console.error('Error cloning rank:', error);
      toast.error('Failed to clone rank');
      return false;
    }
  };

  
