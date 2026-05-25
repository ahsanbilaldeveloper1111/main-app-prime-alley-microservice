import { toast } from "react-toastify";
import axiosInstance from "./axios";
import {
  normalizePostPagedListResult,
  postPagedList,
  type NormalizedPagedList,
  type PaginationParams,
} from "./paginatedList";

/** Paginated list payload from POST groups/list (dataList + meta, or legacy data + total). */
type GroupListPayload = {
  dataList?: unknown[];
  data?: unknown[];
  meta?: { total?: number };
  total?: number;
  recordsTotal?: number;
  recordsFiltered?: number;
};

export const ListGroups = async (
  params: PaginationParams = {},
): Promise<NormalizedPagedList<unknown>> => {
  const raw = await postPagedList<GroupListPayload>(`groups/list`, params, {
    context: "groups",
  });
  return normalizePostPagedListResult(raw);
};

export const getAllGroups = async () => {
    try {
        
      const response = await axiosInstance.get(
        `groups/get`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch groups');
      }
      
    } catch (error) {
      throw error;
    }
  };

export const updateGroup = async (id: string, name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/update`,
        {
          group_id: id,
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group updated successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to update group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteGroup = async (id: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/delete`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group deleted successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to delete group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const addGroup = async (name: string) => {
    try {
        
      const response = await axiosInstance.post(
        `groups/add`,
        {
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.code == 200){
          toast.success('Group created successfully');
          return true;
        }else{
          toast.error(responseData.message);
          return false;
        } 
      }else{
        toast.error('Failed to create group');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  // Team Assignment Functions
  export const addTeamsToGroup = async (group_id: number, team_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `groups/teams/add`,
        {
          group_id: group_id,
          team_ids: team_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Teams added to group successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to add teams to group');
          return null;
        } 
      }else{
        toast.error('Failed to add teams to group');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const removeTeamsFromGroup = async (group_id: number, team_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `groups/teams/remove`,
        {
          group_id: group_id,
          team_ids: team_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Teams removed from group successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove teams from group');
          return null;
        } 
      }else{
        toast.error('Failed to remove teams from group');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const getGroupTeams = async (group_id?: number, id?: number): Promise<any[]> => {
    try {
      const response = await axiosInstance.post(
        `groups/teams/get`,
        {
          ...(group_id ? { group_id } : {}),
          ...(id ? { id } : {})
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === "success" or code === 200
        if(responseData.status === "success" || responseData.code === 200){
          // If data has a teams property, return that, otherwise return data itself
          if(responseData.data && responseData.data.teams && Array.isArray(responseData.data.teams)){
            return responseData.data.teams;
          } else if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          } else {
            return [];
          }
        }else{
          toast.error(responseData.message || 'Failed to fetch group teams');
          return [];
        } 
      }else{
        toast.error('Failed to fetch group teams');
        return [];
      }
    } catch (error) {
      throw error;
    }
  };

  // Module Assignment Functions
  export const addModulesToGroup = async (group_id: number, module_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `groups/modules/add`,
        {
          group_id: group_id,
          module_ids: module_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Modules added to group successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to add modules to group');
          return null;
        } 
      }else{
        toast.error('Failed to add modules to group');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const removeModulesFromGroup = async (group_id: number, module_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `groups/modules/remove`,
        {
          group_id: group_id,
          module_ids: module_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Modules removed from group successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove modules from group');
          return null;
        } 
      }else{
        toast.error('Failed to remove modules from group');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const getGroupModules = async (group_id?: number, id?: number): Promise<any[]> => {
    try {
      const response = await axiosInstance.post(
        `groups/modules/get`,
        {
          ...(group_id ? { group_id } : {}),
          ...(id ? { id } : {})
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === "success" or code === 200
        if(responseData.status === "success" || responseData.code === 200){
          // If data has a modules property, return that, otherwise return data itself
          if(responseData.data && responseData.data.modules && Array.isArray(responseData.data.modules)){
            return responseData.data.modules;
          } else if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          } else {
            return [];
          }
        }else{
          toast.error(responseData.message || 'Failed to fetch group modules');
          return [];
        } 
      }else{
        toast.error('Failed to fetch group modules');
        return [];
      }
    } catch (error) {
      throw error;
    }
  };
