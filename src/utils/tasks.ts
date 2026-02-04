import { toast } from "react-toastify";
import axiosInstance from "./axios";

// ==================== Types/Interfaces ====================

const prefix = 'work-planner';

interface ListProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  user_extensions?: string[];
}

interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
}

interface CreateLabelData {
  name: string;
  color?: string;
}

interface UpdateLabelData {
  name?: string;
  color?: string;
}

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
}

interface ReorderStatusesData {
  status_ids: number[];
}

interface AddMemberData {
  extension_number: string;
  role: string;
}

interface UpdateMemberRoleData {
  role: string;
}

interface ListTasksParams {
  page?: number;
  limit?: number;
  type?: "regular" | "recurring" | "todo";
  project_id?: number;
  search?: string;
  status_id?: number;
  priority?: string;
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  frequency?: string;
  is_active?: boolean;
  withRelations?: string[];
  created_at_from?: string;
  created_at_to?: string;
  extension_numbers?: string[];
  order?: {
    column?: string;
    dir?: 'asc' | 'desc';
  };
}

interface CreateTaskData {
  title: string;
  description?: string;
  project_id?: number;
  status_id?: number;
  priority?: string;
  due_date?: string;
  start_date?: string;
  estimated_hours?: string;
  progress?: number;
  extension_numbers?: string[];
  watchers?: string[];
  label_ids?: number[];
  timezone?: string;
  type?: "regular" | "recurring" | "todo";
}

interface CreateRecurringTaskData {
  title: string;
  description?: string;
  frequency: string;
  repeat_interval?: number;
  repeat_on?: string;
  start_date: string;
  end_date?: string | null;
  due_time?: string;
  priority?: string;
  project_id: number;
  status_id: number;
  extension_numbers?: string[];
  label_ids?: number[];
  type: "recurring";
  is_active?: boolean;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: string;
  status_id?: number;
  project_id?: number;
  due_date?: string;
  due_time?: string;
  timezone?: string;
  start_date?: string;
  end_date?: string;
  extension_numbers?: string[];
  watchers?: string[];
  label_ids?: number[];
}

interface UpdateRecurringTaskData {
  title?: string;
  description?: string;
  frequency?: string;
  repeat_interval?: number;
  repeat_on?: string;
  start_date?: string;
  end_date?: string | null;
  due_time?: string;
  priority?: string;
  project_id?: number;
  status_id?: number;
  extension_numbers?: string[];
  label_ids?: number[];
  is_active?: boolean;
}

// ==================== Helper Functions ====================

/**
 * Validate API response based on success field
 * @param response - The axios response object
 * @param errorMessage - Default error message if success is false
 * @param successMessage - Optional success message to show
 * @param returnDataOnSuccess - Whether to return data on success (default: true)
 * @returns The response data if successful, null/false if failed
 */
const validateResponse = (
  response: any,
  errorMessage: string,
  successMessage?: string,
  returnDataOnSuccess: boolean = true
): any => {
  if (!response?.data) {
    toast.error(errorMessage);
    return returnDataOnSuccess ? null : false;
  }

  const responseData = response.data;

  // Check if success field exists and is false
  if (responseData.success === false) {
    toast.error(responseData.message || errorMessage);
    return returnDataOnSuccess ? null : false;
  }

  // If success is true or undefined (for GET requests that might not have success field)
  if (responseData.success === true) {
    if (successMessage) {
      toast.success(responseData.message || successMessage);
    }
    return returnDataOnSuccess ? (responseData.data || responseData) : true;
  }

  // For GET requests that might not have success field, assume success if data exists
  if (returnDataOnSuccess && (responseData.data !== undefined || responseData !== undefined)) {
    return responseData.data || responseData;
  }

  // Default: return data if available
  return returnDataOnSuccess ? (responseData.data || responseData) : true;
};

/**
 * Validate array response and return data array
 * Common pattern for API responses that return arrays
 */
const validateArrayResponse = (
  response: any,
  errorMessage: string
): any[] => {
  if (!response?.data) {
    toast.error(errorMessage);
    return [];
  }

  const responseData = response.data;

  if (responseData.success === false) {
    toast.error(responseData.message || errorMessage);
    return [];
  }

  // Return the data array
  return responseData.data || [];
};

// ==================== Projects API ====================

/**
 * List all projects with pagination
 */
export const listProjects = async (params: ListProjectsParams = {}) => {
  try {
    const { page = 1, limit = 20, search = "", status, user_extensions } = params;

    // Ensure array params use `param[]` formatting
    const formattedParams = new URLSearchParams();
    formattedParams.append('page', String(page));
    formattedParams.append('limit', String(limit));

    if (search) {
      formattedParams.append('search', search);
    }

    if (status) {
      formattedParams.append('status', status);
    }

    if (Array.isArray(user_extensions) && user_extensions.length > 0) {
      user_extensions.forEach((ext) => {
        if (ext) formattedParams.append('user_extensions[]', String(ext));
      });
    }

    const queryString = formattedParams.toString();
    const url = queryString ? `${prefix}/projects?${queryString}` : `${prefix}/projects`;

    const response = await axiosInstance.get(url);
    
    // For list operations, we need the full response (data, pagination, summary)
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        toast.error(responseData.message || 'Failed to fetch projects');
        return null;
      }
      // Return full response object for list operations
      return responseData;
    }
    
    return null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a new project
 */
export const createProject = async (data: CreateProjectData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/projects`, data);
    
    return validateResponse(response, 'Failed to create project', 'Project created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create project');
    throw error;
  }
};

/**
 * Get a single project by ID with optional relations
 */
export const getProject = async (
  id: string | number,
  withRelations?: string[]
) => {
  try {
    // Format array parameters correctly for with[] query params
    const formattedParams = new URLSearchParams();
    if (withRelations && withRelations.length > 0) {
      withRelations.forEach((relation) => {
        formattedParams.append('with[]', relation);
      });
    }
    
    const queryString = formattedParams.toString();
    const url = queryString 
      ? `${prefix}/projects/${id}?${queryString}`
      : `${prefix}/projects/${id}`;
    
    const response = await axiosInstance.get(url);
    
    // For single project view, return the full response object
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        toast.error(responseData.message || 'Failed to fetch project');
        return null;
      }
      // Return the project data object
      return responseData.data || responseData;
    }
    
    return null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Update a project
 */
export const updateProject = async (id: string | number, data: UpdateProjectData) => {
  try {
    const response = await axiosInstance.put(`${prefix}/projects/${id}`, data);
    
    return validateResponse(response, 'Failed to update project', 'Project updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update project');
    throw error;
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/projects/${id}`);
    
    return validateResponse(response, 'Failed to delete project', 'Project deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete project');
    throw error;
  }
};

// ==================== Project Labels API ====================

/**
 * Get all labels for a project
 */
export const getProjectLabels = async (projectId: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/projects/${projectId}/labels`);
    return validateArrayResponse(response, 'Failed to fetch project labels');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a new label for a project
 */
export const createProjectLabel = async (projectId: string | number, data: CreateLabelData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/projects/${projectId}/labels`, data);
    return validateResponse(response, 'Failed to create label', 'Label created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create label');
    throw error;
  }
};

/**
 * Update a label
 */
export const updateProjectLabel = async (
  projectId: string | number,
  labelId: string | number,
  data: UpdateLabelData
) => {
  try {
    const response = await axiosInstance.put(`${prefix}/projects/${projectId}/labels/${labelId}`, data);
    return validateResponse(response, 'Failed to update label', 'Label updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update label');
    throw error;
  }
};

/**
 * Delete a label
 */
export const deleteProjectLabel = async (projectId: string | number, labelId: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/projects/${projectId}/labels/${labelId}`);
    return validateResponse(response, 'Failed to delete label', 'Label deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete label');
    throw error;
  }
};

// ==================== Project Statuses API ====================

/**
 * Create a new status for a project
 */
export const createStatus = async (projectId: string | number, data: CreateStatusData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/projects/${projectId}/statuses`, data);
    return validateResponse(response, 'Failed to create status', 'Status created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create status');
    throw error;
  }
};

/**
 * Update a status
 */
export const updateStatus = async (
  projectId: string | number,
  statusId: string | number,
  data: UpdateStatusData
) => {
  try {
    const response = await axiosInstance.put(`${prefix}/projects/${projectId}/statuses/${statusId}`, data);
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
export const deleteStatus = async (projectId: string | number, statusId: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/projects/${projectId}/statuses/${statusId}`);
    return validateResponse(response, 'Failed to delete status', 'Status deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete status');
    throw error;
  }
};

/**
 * Reorder statuses for a project
 */
export const reorderStatuses = async (projectId: string | number, data: ReorderStatusesData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/projects/${projectId}/statuses/reorder`, data);
    return validateResponse(response, 'Failed to reorder statuses', 'Statuses reordered successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to reorder statuses');
    throw error;
  }
};

// ==================== Project Members API ====================

/**
 * Add a member to a project
 */
export const addMember = async (projectId: string | number, data: AddMemberData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/projects/${projectId}/members`, data);
    return validateResponse(response, 'Failed to add member', 'Member added successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to add member');
    throw error;
  }
};

/**
 * Update a member's role in a project
 */
export const updateMemberRole = async (
  projectId: string | number,
  extensionNumber: string,
  data: UpdateMemberRoleData
) => {
  try {
    const response = await axiosInstance.put(`${prefix}/projects/${projectId}/members/${extensionNumber}`, data);
    return validateResponse(response, 'Failed to update member role', 'Member role updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update member role');
    throw error;
  }
};

/**
 * Remove a member from a project
 */
export const removeMember = async (projectId: string | number, extensionNumber: string) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/projects/${projectId}/members/${extensionNumber}`);
    return validateResponse(response, 'Failed to remove member', 'Member removed successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to remove member');
    throw error;
  }
};

// ==================== Tasks API ====================

/**
 * List all tasks with pagination and filters
 */
export const listTasks = async (params: ListTasksParams = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      type = "regular",
      project_id,
      search = "",
      status_id,
      priority,
      is_completed,
      due_date_from,
      due_date_to,
      frequency,
      is_active,
      withRelations,
      created_at_from,
      created_at_to,
      extension_numbers,
      order
    } = params;
    
    // Format array parameters correctly for with[] query params
    const formattedParams = new URLSearchParams();
    
    // Add regular query parameters
    formattedParams.append('page', page.toString());
    formattedParams.append('limit', limit.toString());
    formattedParams.append('type', type);
    
    if (project_id) formattedParams.append('project_id', project_id.toString());
    if (search) formattedParams.append('search', search);
    if (status_id) formattedParams.append('status_id', status_id.toString());
    if (priority) formattedParams.append('priority', priority);
    if (is_completed !== undefined) formattedParams.append('is_completed', is_completed.toString());
    if (due_date_from) formattedParams.append('due_date_from', due_date_from);
    if (due_date_to) formattedParams.append('due_date_to', due_date_to);
    if (frequency) formattedParams.append('frequency', frequency);
    if (is_active !== undefined) formattedParams.append('is_active', is_active.toString());
    if (created_at_from) formattedParams.append('created_at_from', created_at_from);
    if (created_at_to) formattedParams.append('created_at_to', created_at_to);
    
    // Add order parameters if provided
    if (order?.column) {
      formattedParams.append('order[column]', order.column);
    }
    if (order?.dir) {
      formattedParams.append('order[dir]', order.dir);
    }
    
    // Add with[] parameters if provided
    if (withRelations && withRelations.length > 0) {
      withRelations.forEach((relation) => {
        formattedParams.append('with[]', relation);
      });
    }
    
    // Add extension_numbers as JSON array string
    if (extension_numbers && extension_numbers.length > 0) {
      extension_numbers.forEach((relation) => {
        formattedParams.append('extension_numbers[]', relation);
      });
      
    }
    
    const queryString = formattedParams.toString();
    const url = `${prefix}/tasks?${queryString}`;
    
    const response = await axiosInstance.get(url);
    
    // For list operations, we need the full response (data, pagination, summary)
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        toast.error(responseData.message || 'Failed to fetch tasks');
        return null;
      }
      // Return full response object for list operations
      return responseData;
    }
    
    return null;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a new task
 */
export const createTask = async (data: CreateTaskData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks`, data);
    return validateResponse(response, 'Failed to create task', 'Task created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create task');
    throw error;
  }
};

/**
 * Get a single task by ID
 */
export const getTask = async (id: string | number, withRelations?: string[]) => {
  try {
    let url = `${prefix}/tasks/${id}`;
    
    // Add with[] parameters if provided
    if (withRelations && withRelations.length > 0) {
      const formattedParams = new URLSearchParams();
      withRelations.forEach((relation) => {
        formattedParams.append('with[]', relation);
      });
      url += `?${formattedParams.toString()}`;
    }
    
    const response = await axiosInstance.get(url);
    return validateResponse(response, 'Failed to fetch task');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Update a task
 */
export const updateTask = async (id: string | number, data: UpdateTaskData) => {
  try {
    const response = await axiosInstance.put(`${prefix}/tasks/${id}`, data);
    return validateResponse(response, 'Failed to update task', 'Task updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update task');
    throw error;
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/tasks/${id}`);
    return validateResponse(response, 'Failed to delete task', 'Task deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete task');
    throw error;
  }
};

/**
 * Mark a task as complete
 */
export const completeTask = async (id: string | number) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks/${id}/complete`);
    return validateResponse(response, 'Failed to complete task', 'Task marked as complete');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to complete task');
    throw error;
  }
};

/**
 * Mark a task as incomplete
 */
export const incompleteTask = async (id: string | number) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks/${id}/incomplete`);
    return validateResponse(response, 'Failed to mark task as incomplete', 'Task marked as incomplete');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to mark task as incomplete');
    throw error;
  }
};

/**
 * Get recent activity for tasks
 */
export const getRecentActivity = async (projectId?: number) => {
  try {
    const params = projectId ? { project_id: projectId } : {};
    const response = await axiosInstance.get(`${prefix}/tasks/recent-activity`, {
      params
    });
    
    return validateArrayResponse(response, 'Failed to fetch recent activity');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Get activities for a specific task
 */
export const getTaskActivities = async (taskId: string | number, page: number = 1, limit: number = 20) => {
  try {
    const response = await axiosInstance.get(`${prefix}/tasks/activities`
      , {
        params: { page: page, limit: limit, task_id: taskId }
      }
    );
    return validateResponse(response, 'Failed to fetch task activities');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== Task Comments API ====================

/**
 * Get comments for a specific task
 */
export const getTaskComments = async (taskId: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/tasks/${taskId}/comments`);
    return validateResponse(response, 'Failed to fetch task comments');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a comment for a task
 */
export const createTaskComment = async (taskId: string | number, comment: string) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks/${taskId}/comments`, { comment });
    return validateResponse(response, 'Failed to create comment', 'Comment created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create comment');
    throw error;
  }
};

/**
 * Update a comment
 */
export const updateTaskComment = async (taskId: string | number, commentId: string | number, comment: string) => {
  try {
    const response = await axiosInstance.put(`${prefix}/tasks/${taskId}/comments/${commentId}`, { comment });
    return validateResponse(response, 'Failed to update comment', 'Comment updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update comment');
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteTaskComment = async (taskId: string | number, commentId: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/tasks/${taskId}/comments/${commentId}`);
    return validateResponse(response, 'Failed to delete comment', 'Comment deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete comment');
    throw error;
  }
};

/**
 * Get overdue tasks
 */
export const getOverdueTasks = async (projectId?: number) => {
  try {
    const params = projectId ? { project_id: projectId } : {};
    const response = await axiosInstance.get(`${prefix}/tasks/overdue`, {
      params
    });
    
    return validateArrayResponse(response, 'Failed to fetch overdue tasks');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Process due recurring tasks
 */
export const processDueRecurringTasks = async () => {
  try {
    const response = await axiosInstance.post(`${prefix}/process-due`);
    return validateResponse(response, 'Failed to process recurring tasks', 'Recurring tasks processed successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to process recurring tasks');
    throw error;
  }
};

// ==================== Recurring Tasks API ====================

/**
 * List all recurring tasks
 */
export const listRecurringTasks = async (params: ListTasksParams = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      project_id,
      frequency,
      is_active
    } = params;
    
    const queryParams: any = {
      type: "recurring",
      page,
      limit
    };
    
    if (search) queryParams.search = search;
    if (project_id) queryParams.project_id = project_id;
    if (frequency) queryParams.frequency = frequency;
    if (is_active !== undefined) queryParams.is_active = is_active;
    
    const response = await axiosInstance.get(`${prefix}/tasks`, {
      params: queryParams
    });
    
    return validateResponse(response, 'Failed to fetch recurring tasks');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a new recurring task
 */
export const createRecurringTask = async (data: CreateRecurringTaskData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks`, data);
    return validateResponse(response, 'Failed to create recurring task', 'Recurring task created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create recurring task');
    throw error;
  }
};

/**
 * Get a single recurring task by ID
 */
export const getRecurringTask = async (id: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/tasks/${id}`);
    return validateResponse(response, 'Failed to fetch recurring task');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Update a recurring task
 */
export const updateRecurringTask = async (id: string | number, data: UpdateRecurringTaskData) => {
  try {
    const response = await axiosInstance.put(`${prefix}/tasks/${id}`, data);
    return validateResponse(response, 'Failed to update recurring task', 'Recurring task updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update recurring task');
    throw error;
  }
};

/**
 * Delete a recurring task
 */
export const deleteRecurringTask = async (id: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/tasks/${id}`);
    return validateResponse(response, 'Failed to delete recurring task', 'Recurring task deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete recurring task');
    throw error;
  }
};

// ==================== Dashboard API ====================

/**
 * Get dashboard data
 */
export const getDashboard = async () => {
  try {
    const response = await axiosInstance.get(`${prefix}/dashboard`);
    return validateResponse(response, 'Failed to fetch dashboard data');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};


export const getLabels = async () => {
  try {
    const response = await axiosInstance.get(`${prefix}/labels`);
    return validateArrayResponse(response, 'Failed to fetch project labels');
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Create a new label for a project
 */
export const createLabel = async (data: CreateLabelData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/labels`, data);
    return validateResponse(response, 'Failed to create label', 'Label created successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to create label');
    throw error;
  }
};

/**
 * Update a label
 */
export const updateLabel = async (
  labelId: string | number,
  data: UpdateLabelData
) => {
  try {
    const response = await axiosInstance.put(`${prefix}/labels/${labelId}`, data);
    return validateResponse(response, 'Failed to update label', 'Label updated successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to update label');
    throw error;
  }
};

/**
 * Delete a label
 */
export const deleteLabel = async (labelId: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/labels/${labelId}`);
    return validateResponse(response, 'Failed to delete label', 'Label deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete label');
    throw error;
  }
};



// ==================== Task Documents API ====================

/**
 * Get documents for a task
 */
export const getTaskDocuments = async (taskId: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/tasks/${taskId}/documents`);
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        toast.error(responseData.message || 'Failed to fetch task documents');
        return null;
      }
      return responseData.data ?? responseData;
    }
    return null;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to fetch task documents');
    throw error;
  }
};

/**
 * Upload document(s) for a task
 */
export const postTaskDocuments = async (taskId: string | number, data: FormData) => {
  try {
    const response = await axiosInstance.post(`${prefix}/tasks/${taskId}/documents`, data);
    return validateResponse(response, 'Failed to upload task document', 'Document uploaded successfully');
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to upload task document');
    throw error;
  }
};

/**
 * Delete a task document
 */
export const deleteTaskDocument = async (taskId: string | number, documentId: string | number) => {
  try {
    const response = await axiosInstance.delete(`${prefix}/tasks/${taskId}/documents/${documentId}`);
    return validateResponse(response, 'Failed to delete task document', 'Document deleted successfully', false);
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete task document');
    throw error;
  }
};

/**
 * Download a task document
 */
export const getTaskDocumentDownload = async (taskId: string | number, documentId: string | number) => {
  try {
    const response = await axiosInstance.get(`${prefix}/tasks/${taskId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response?.data ?? null;
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to download task document');
    throw error;
  }
};


