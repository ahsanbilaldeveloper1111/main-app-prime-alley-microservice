import { toast } from "react-toastify";
import axiosInstance from "./axios";
import {
  normalizePostPagedListResult,
  postPagedList,
  type NormalizedPagedList,
  type PaginationParams,
} from "./paginatedList";
import type { TeamListResponse } from "../types/controlhub/teams";

export const ListTeams = async (
  params: PaginationParams = {},
): Promise<NormalizedPagedList<TeamListResponse["dataList"][number]>> => {
  const raw = await postPagedList<TeamListResponse>(`teams/list`, params, {
    context: "teams",
  });
  return normalizePostPagedListResult(raw);
};

export const getAllTeams = async (): Promise<any[]> => {
    try {
        
      const response = await axiosInstance.get(
        `teams/get`
      );
      if(response.data){
        return response.data?.data;
      }else{
        toast.error('Failed to fetch teams');
        return [];
      }
      
    } catch (error) {
      throw error;
    }
  };

export const updateTeam = async (team_id: number, name: string): Promise<boolean> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/update`,
        {
          team_id: team_id,
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === true || responseData.code == 200){
          toast.success('Team updated successfully');
          return true;
        }else{
          toast.error(responseData.message || 'Failed to update team');
          return false;
        } 
      }else{
        toast.error('Failed to update team');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const deleteTeam = async (id: number): Promise<boolean> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/delete`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === true || responseData.code == 200){
          toast.success('Team deleted successfully');
          return true;
        }else{
          toast.error(responseData.message || 'Failed to delete team');
          return false;
        } 
      }else{
        toast.error('Failed to delete team');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const addTeam = async (name: string): Promise<boolean> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/add`,
        {
          name: name
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === true || responseData.code == 200){
          toast.success('Team created successfully');
          return true;
        }else{
          toast.error(responseData.message || 'Failed to create team');
          return false;
        } 
      }else{
        toast.error('Failed to create team');
        return false;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const viewTeam = async (id: number): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/view`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === true){
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to fetch team');
          return null;
        } 
      }else{
        toast.error('Failed to fetch team');
        return null;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const editTeam = async (id: number): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/edit`,
        {
          id: id
        }
      );
      if(response.data){
        const responseData = response.data;
        if(responseData.status === true){
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to fetch team');
          return null;
        } 
      }else{
        toast.error('Failed to fetch team');
        return null;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const assignUsersToTeam = async (team_id: number, user_ids: number[], owner_ids?: number[]): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/assign-users`,
        {
          team_id: team_id,
          user_ids: user_ids,
          ...(owner_ids && owner_ids.length > 0 ? { owner_ids: owner_ids } : {})
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200){
          toast.success('Users assigned to team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to assign users to team');
          return null;
        } 
      }else{
        toast.error('Failed to assign users to team');
        return null;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const removeUsersFromTeam = async (team_id: number, user_ids: number[]): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/remove-users`,
        {
          team_id: team_id,
          user_ids: user_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200){
          toast.success('Users removed from team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove users from team');
          return null;
        } 
      }else{
        toast.error('Failed to remove users from team');
        return null;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const removeOwnersFromTeam = async (team_id: number, owner_ids: number[]): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/remove-owners`,
        {
          team_id: team_id,
          owner_ids: owner_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200){
          toast.success('Owners removed from team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove owners from team');
          return null;
        } 
      }else{
        toast.error('Failed to remove owners from team');
        return null;
      }
      
    } catch (error) {
      throw error;
    }
  };

  export const getTeamUsers = async (team_id?: number, id?: number): Promise<any> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/users`,
        {
          ...(team_id ? { team_id } : {}),
          ...(id ? { id } : {})
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200){
          // New API response structure with team_member and team_owners
          if(responseData.data && typeof responseData.data === 'object' && ('team_member' in responseData.data || 'team_owners' in responseData.data)){
            return responseData.data;
          }
          // If data has a users property, return that, otherwise return data itself
          if(responseData.data && responseData.data.users && Array.isArray(responseData.data.users)){
            return responseData.data.users;
          } else if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          } else {
            return { team_member: [], team_owners: [] };
          }
        }else{
          toast.error(responseData.message || 'Failed to fetch team users');
          return { team_member: [], team_owners: [] };
        } 
      }else{
        toast.error('Failed to fetch team users');
        return { team_member: [], team_owners: [] };
      }
      
    } catch (error) {
      throw error;
    }
  };

  // Rank Assignment Functions
  export const addRanksToTeam = async (team_id: number, rank_id: number): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `teams/ranks/add`,
        {
          team_id: team_id,
          rank_id: rank_id
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === "success" or code === 200
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Rank added to team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to add rank to team');
          return null;
        } 
      }else{
        toast.error('Failed to add rank to team');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const removeRanksFromTeam = async (team_id: number, rank_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `teams/ranks/remove`,
        {
          team_id: team_id,
          rank_ids: rank_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === "success" or code === 200
        if(responseData.status === "success" || responseData.code === 200){
          toast.success('Ranks removed from team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove ranks from team');
          return null;
        } 
      }else{
        toast.error('Failed to remove ranks from team');
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  export const getTeamRanks = async (team_id?: number, id?: number): Promise<any[]> => {
    try {
      const response = await axiosInstance.post(
        `teams/ranks/get`,
        {
          ...(team_id ? { team_id } : {}),
          ...(id ? { id } : {})
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === "success" or code === 200
        if(responseData.status === "success" || responseData.code === 200){
          // Check if data.team.ranks exists (could be object or array)
          if(responseData.data && responseData.data.team && responseData.data.team.ranks){
            const ranks = responseData.data.team.ranks;
            // If ranks is an array, return it
            if(Array.isArray(ranks)){
              return ranks;
            }
            // If ranks is a single object, return it as an array with one item
            if(ranks && typeof ranks === 'object' && ranks.id){
              return [ranks];
            }
          }
          // Fallback: check if data.ranks exists (array)
          if(responseData.data && responseData.data.ranks && Array.isArray(responseData.data.ranks)){
            return responseData.data.ranks;
          }
          // Fallback: check if data itself is an array
          if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          }
          return [];
        }else{
          toast.error(responseData.message || 'Failed to fetch team ranks');
          return [];
        } 
      }else{
        toast.error('Failed to fetch team ranks');
        return [];
      }
    } catch (error) {
      throw error;
    }
  };

  // Module Assignment Functions
  export const addModulesToTeam = async (team_id: number, module_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `teams/modules/add`,
        {
          team_id: team_id,
          module_ids: module_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200 || responseData.status === "success"){
          toast.success('Modules added to team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to add modules to team');
          return null;
        } 
      }else{
        toast.error('Failed to add modules to team');
        return null;
      }
    } catch (error) {
      console.error('Error adding modules to team:', error);
      throw error;
    }
  };

  export const updateTeamModules = async (team_id: number, module_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `teams/modules/update`,
        {
          team_id: team_id,
          module_ids: module_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200 || responseData.status === "success"){
          toast.success('Team modules updated successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to update team modules');
          return null;
        } 
      }else{
        toast.error('Failed to update team modules');
        return null;
      }
    } catch (error) {
      console.error('Error updating team modules:', error);
      throw error;
    }
  };

  export const removeModulesFromTeam = async (team_id: number, module_ids: number[]): Promise<any | null> => {
    try {
      const response = await axiosInstance.post(
        `teams/modules/remove`,
        {
          team_id: team_id,
          module_ids: module_ids
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200 || responseData.status === "success"){
          toast.success('Modules removed from team successfully');
          return responseData.data;
        }else{
          toast.error(responseData.message || 'Failed to remove modules from team');
          return null;
        } 
      }else{
        toast.error('Failed to remove modules from team');
        return null;
      }
    } catch (error) {
      console.error('Error removing modules from team:', error);
      throw error;
    }
  };

  export const getTeamModules = async (team_id: number): Promise<any[]> => {
    try {
      const response = await axiosInstance.post(
        `teams/modules/get`,
        {
          team_id: team_id
        }
      );
      if(response.data){
        const responseData = response.data;
        // Handle both response formats: status === true or code === 200
        if(responseData.status === true || responseData.code === 200 || responseData.status === "success"){
          // Check if data.team.modules exists (could be object or array)
          if(responseData.data && responseData.data.team && responseData.data.team.modules){
            const modules = responseData.data.team.modules;
            // If modules is an array, return it
            if(Array.isArray(modules)){
              return modules;
            }
            // If modules is a single object, return it as an array with one item
            if(modules && typeof modules === 'object' && modules.id){
              return [modules];
            }
          }
          // Fallback: check if data.modules exists (array)
          if(responseData.data && responseData.data.modules && Array.isArray(responseData.data.modules)){
            return responseData.data.modules;
          }
          // Fallback: check if data itself is an array
          if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          }
          return [];
        }else{
          toast.error(responseData.message || 'Failed to fetch team modules');
          return [];
        } 
      }else{
        toast.error('Failed to fetch team modules');
        return [];
      }
    } catch (error) {
      console.error('Error fetching team modules:', error);
      return [];
    }
  };

