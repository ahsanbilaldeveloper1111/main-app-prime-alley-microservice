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

export const ListTeams = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;
    
    const response = await axiosInstance.post(
      `teams/list`,
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
    console.error('API Error:', error);
    throw error;
  }
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

  export const assignUsersToTeam = async (team_id: number, user_ids: number[]): Promise<any | null> => {
    try {
        
      const response = await axiosInstance.post(
        `teams/assign-users`,
        {
          team_id: team_id,
          user_ids: user_ids
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

  export const getTeamUsers = async (team_id?: number, id?: number): Promise<any[]> => {
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
          // If data has a users property, return that, otherwise return data itself
          if(responseData.data && responseData.data.users && Array.isArray(responseData.data.users)){
            return responseData.data.users;
          } else if(responseData.data && Array.isArray(responseData.data)){
            return responseData.data;
          } else {
            return [];
          }
        }else{
          toast.error(responseData.message || 'Failed to fetch team users');
          return [];
        } 
      }else{
        toast.error('Failed to fetch team users');
        return [];
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

