import { Session } from 'next-auth';
import { toast } from "react-toastify";
import { reportApiError } from "./sentryLogger";
import axiosInstance from "./axios";

const prefix = 'work-planner';

// ==================== Types/Interfaces ====================

interface CreateStatusData {
  name: string;
  color: string;
  order?: number;
  is_default?: boolean;
  is_completed?: boolean;
}

interface UpdateStatusData {
  name?: string;
  color?: string;
  order?: number;
  is_default?: boolean;
  is_completed?: boolean;
}

// ==================== Helper Functions ====================

const reportWorkPlannerApiError = (response: any, errorMessage: string) => {
  reportApiError("work-planner", errorMessage, { apiResponse: response, responseData: response?.data });
};

/**
 * Helper function to validate API response
 */
const validateResponse = (
  response: any,
  errorMessage: string,
  successMessage?: string,
  showSuccessToast: boolean = true
): any => {
  if (response?.data) {
    const responseData = response.data;
    if (responseData.success === false) {
      reportWorkPlannerApiError(response, responseData.message || errorMessage);
      toast.error(responseData.message || errorMessage);
      return null;
    }
    if (successMessage && showSuccessToast) {
      toast.success(successMessage);
    }
    return responseData.data || responseData;
  }
  reportWorkPlannerApiError(response, errorMessage);
  return null;
};

/**
 * Helper function to get current user's role/type from members array
 * @param membersArray - Array of project members
 * @param session - NextAuth session object
 * @returns The current user's role (e.g., 'owner', 'admin', 'member', 'viewer') or null if not found
 */
export const getCurrentUserRoleInMembers = (
  membersArray: any[],
  session: Session | null
): string | null => {
  if (!session?.user || !Array.isArray(membersArray) || membersArray.length === 0) {
    return null;
  }

  // Get current user's extension_number from session (check multiple possible properties)
  const user = session.user as any;
  const currentUserExtension = user?.extension_number || user?.extension || user?.id || null;
  if (!currentUserExtension) {
    return null;
  }

  // Find the member matching current user's extension_number
  const currentUserMember = membersArray.find((member: any) => {
    const memberExt = String(member?.extension_number || '').trim();
    const currentExt = String(currentUserExtension || '').trim();
    return memberExt && currentExt && memberExt === currentExt;
  });

  return currentUserMember?.role || null;
};

/**
 * Helper function to check if current user can add members to a project
 * @param membersArray - Array of project members
 * @param selectedProject - Selected project object with owner_extension_number
 * @param session - NextAuth session object
 * @returns true if user can add members, false otherwise
 */
export const canManage = (
  membersArray: any[],
  selectedProject: any,
  session: Session | null
): boolean => {
  if (!session?.user) return false;

  // Get current user's extension number from session
  const user = session.user as any;
  const currentUserExtension = user?.extension_number || user?.extension || user?.id || null;
  if (!currentUserExtension) {
    return false;
  }

  // Check if user is the project owner
  const ownerExtension = selectedProject?.apiData?.owner_extension_number;
  if (ownerExtension) {
    const ownerExt = String(ownerExtension || '').trim();
    const userExt = String(currentUserExtension || '').trim();
    if (ownerExt && userExt && ownerExt === userExt) {
      return true;
    }
  }

  // Get current user's role in members
  const currentUserRole = getCurrentUserRoleInMembers(membersArray, session);

  // If user is not found in members, allow
  if (currentUserRole === null) {
    return true;
  }

  // If user is found and role is admin, allow
  return currentUserRole === 'admin';
};

// ==================== Statuses API ====================

/**
 * List all statuses
 */
export const listStatuses = async () => {
  try {
    const response = await axiosInstance.get(`${prefix}/statuses`);
    
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        reportWorkPlannerApiError(response, responseData.message || 'Failed to fetch statuses');
        toast.error(responseData.message || 'Failed to fetch statuses');
        return null;
      }
      // Return the statuses array
      return responseData.data || responseData;
    }
    
    return null;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to fetch statuses');
    throw error;
  }
};

/**
 * Create a new status
 */
export const createStatus = async (data: CreateStatusData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/statuses`, data);
    
    return validateResponse(response, 'Failed to create status', 'Status created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create status');
    throw error;
  }
};

/**
 * Get a single status by ID
 */
export const getStatus = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/statuses/${id}`);
    
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        reportWorkPlannerApiError(response, responseData.message || 'Failed to fetch status');
        toast.error(responseData.message || 'Failed to fetch status');
        return null;
      }
      // Return the status data object
      return responseData.data || responseData;
    }
    
    return null;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to fetch status');
    throw error;
  }
};

/**
 * Update a status
 */
export const updateStatus = async (id: string | number, data: UpdateStatusData) => {
  try {
    const response = await axiosInstance.put(`${prefix}/statuses/${id}`, data);
    
    return validateResponse(response, 'Failed to update status', 'Status updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update status');
    throw error;
  }
};

/**
 * Delete a status
 */
export const deleteStatus = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/statuses/${id}`);
    
    return validateResponse(response, 'Failed to delete status', 'Status deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete status');
    throw error;
  }
};

// ==================== Audit Logs API ====================

/**
 * GET audit-logs
 */
export const AuditLogsWorkPlanner = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${prefix}/audit-logs`, { params });
    if (response?.data) {
     
      return response.data ?? response;
    }
    return null;
  } catch (error: unknown) {
    throw error;
  }
};
