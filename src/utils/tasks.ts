import { toast } from "react-toastify";
import { reportApiError } from "./sentryLogger";
import axiosInstance from "./axios";

// ==================== Types/Interfaces ====================

const prefix = 'work-planner';

interface ListProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  /** Filter projects by owner / PM extension numbers (query: extension_numbers[]) */
  extension_numbers?: string[];
  start_date_from?: string;
  end_date_to?: string;
}

interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  timezone?: string;
}

interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
  start_date?: string;
  end_date?: string | null;
  status?: string;
  timezone?: string;
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
  is_default?: boolean;
  is_completed?: boolean;
}

interface ReorderStatusesData {
  status_ids: number[];
}

export interface BulkDeleteStatusesPayload {
  status_ids: number[];
}

interface AddMemberData {
  extension_number: string;
  role: string;
}

interface UpdateMemberRoleData {
  role: string;
}

/** Pagination block returned with list-tasks responses. */
export interface ListTasksPagination {
  page?: number;
  limit?: number;
  total?: number;
  last_page?: number;
  from?: number;
  to?: number;
}

/** Summary stats block returned with some list-tasks responses. */
export interface ListTasksSummary {
  total?: number;
  open?: number;
  openTasks?: number;
  overdue?: number;
  dueThisWeek?: number;
  todayDue?: number;
  unassigned?: number;
  highPriority?: number;
  scheduled?: number;
  completed?: number;
  pending?: number;
  anytime?: number;
}

/** Parsed JSON body from list-tasks API responses (after axios unwrap). */
export interface ListTasksParsedBody {
  success?: boolean;
  message?: string;
  data?: unknown[];
  pagination?: ListTasksPagination;
  summary?: ListTasksSummary;
}

interface ListTasksParams {
  page?: number;
  limit?: number;
  type?: "regular" | "recurring" | "todo";
  project_id?: number;
  search?: string;
  /** Filter by workflow status id (legacy); prefer `status` (name) when both are not needed. */
  status_id?: number;
  /** Filter by workflow status name (query param `status`). */
  status?: string;
  priority?: string;
  is_completed?: boolean;
  due_date_from?: string;
  due_date_to?: string;
  frequency?: string;
  is_active?: boolean;
  withRelations?: string[];
  created_at_from?: string;
  created_at_to?: string;
  /** Filter by assignee extension numbers (query: `assignees[]`). */
  assignees?: string[];
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
  /** UTC ISO timestamp when a calendar due time is set; omit or null when no time. */
  due_time?: string | null;
  start_date?: string;
  estimated_hours?: string;
  progress?: number;
  extension_numbers?: string[];
  watchers?: string[];
  label_ids?: number[];
  timezone?: string;
  type?: "regular" | "recurring" | "todo";
}

/** Subset of `frequency_config` when `frequency` is `custom` (task store request). */
export interface TaskFrequencyConfigPayload {
  unit: 'days' | 'weeks' | 'months' | 'years';
  interval: number;
}

interface CreateRecurringTaskData {
  title: string;
  description?: string;
  frequency: string;
  frequency_config?: TaskFrequencyConfigPayload;
  repeat_interval?: number;
  repeat_on?: string | string[];
  start_date: string;
  end_date?: string | null;
  /** Mutually exclusive with `end_date` for recurring templates. */
  occurrences?: number | null;
  due_time?: string;
  priority?: string;
  project_id?: number;
  status_id: number;
  extension_numbers?: string[];
  label_ids?: number[];
  type: "recurring";
  is_active?: boolean;
  timezone?: string;
  time_zone?: string;
  reminder_minutes?: number | null;
  estimated_duration_minutes?: number | null;
  recurring_auto_create_next_on_complete?: boolean;
  recurring_create_next_if_previous_incomplete?: boolean;
}

/** Parent task reference for update payloads; `null` detaches the parent. */
type TaskParentId = number | string | null;

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: string;
  status_id?: number;
  project_id?: number;
  due_date?: string;
  /** UTC ISO for due time, or null to clear a previously stored time. */
  due_time?: string | null;
  timezone?: string;
  start_date?: string;
  end_date?: string;
  extension_numbers?: string[];
  watchers?: string[];
  label_ids?: number[];
  /** Send `null` to detach parent when updating. */
  parent_task_id?: TaskParentId;
  estimated_duration_minutes?: number | null;
}

interface UpdateRecurringTaskData {
  title?: string;
  description?: string;
  type?: 'recurring';
  frequency?: string;
  frequency_config?: TaskFrequencyConfigPayload | null;
  repeat_interval?: number;
  repeat_on?: string | string[];
  start_date?: string;
  end_date?: string | null;
  occurrences?: number | null;
  due_time?: string | null;
  priority?: string;
  project_id?: number;
  status_id?: number;
  extension_numbers?: string[];
  label_ids?: number[];
  is_active?: boolean;
  parent_task_id?: TaskParentId;
  timezone?: string;
  time_zone?: string;
  reminder_minutes?: number | null;
  estimated_duration_minutes?: number | null;
  recurring_auto_create_next_on_complete?: boolean;
  recurring_create_next_if_previous_incomplete?: boolean;
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
const reportTasksApiError = (response: any, errorMessage: string) => {
  reportApiError("tasks", errorMessage, { apiResponse: response, responseData: response?.data });
};

const validateResponse = (
  response: any,
  errorMessage: string,
  successMessage?: string,
  returnDataOnSuccess: boolean = true
): any => {
  if (!response?.data) {
    reportTasksApiError(response, errorMessage);
    toast.error(errorMessage);
    return returnDataOnSuccess ? null : false;
  }

  const responseData = response.data;

  // Check if success field exists and is false
  if (responseData.success === false) {
    reportTasksApiError(response, responseData.message || errorMessage);
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
    reportTasksApiError(response, errorMessage);
    toast.error(errorMessage);
    return [];
  }

  const responseData = response.data;

  if (responseData.success === false) {
    reportTasksApiError(response, responseData.message || errorMessage);
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
    const { page = 1, limit = 20, search = "", status, start_date_from, end_date_to } = params;

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

    if (start_date_from) {
      formattedParams.append('start_date_from', start_date_from);
    }

    if (end_date_to) {
      formattedParams.append('end_date_to', end_date_to);
    }

    const queryString = formattedParams.toString();
    const url = queryString ? `${prefix}/projects?${queryString}` : `${prefix}/projects`;

    const response = await axiosInstance.get(url);
    
    // For list operations, we need the full response (data, pagination, summary)
    if (response?.data) {
      const responseData = response.data;
      if (responseData.success === false) {
        reportTasksApiError(response, responseData.message || 'Failed to fetch projects');
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

/** Optional query params merged into GET /projects/:id (e.g. sub_task_count). */
export type GetProjectQueryParams = Record<string, string | number | boolean | undefined>;

/**
 * Get a single project by ID with optional relations
 */
export const getProject = async (
  id: string | number,
  withRelations?: string[],
  queryParams?: GetProjectQueryParams
) => {
  try {
    // Format array parameters correctly for with[] query params
    const formattedParams = new URLSearchParams();
    if (withRelations && withRelations.length > 0) {
      withRelations.forEach((relation) => {
        formattedParams.append('with[]', relation);
      });
    }
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value === undefined) continue;
        formattedParams.append(key, String(value));
      }
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
        reportTasksApiError(response, responseData.message || 'Failed to fetch project');
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
 * Delete multiple statuses in one request (work-planner).
 */
export const bulkDeleteStatuses = async (
  payload: BulkDeleteStatusesPayload,
): Promise<unknown> => {
  const statusIds = payload.status_ids
    .map((id) => Math.trunc(Number(id)))
    .filter((id) => Number.isFinite(id));
  if (statusIds.length === 0) {
    toast.error('No valid status IDs to delete');
    return null;
  }
  try {
    const response = await axiosInstance.post(`${prefix}/statuses/bulk-delete`, {
      status_ids: statusIds,
    });
    return validateResponse(
      response,
      'Failed to delete statuses',
      'Statuses deleted successfully',
      false,
    );
  } catch (error: any) {
    console.error('API Error:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete statuses');
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

type TaskQueryParamValue = string | number | undefined;

function appendTruthyQueryParam(
  searchParams: URLSearchParams,
  key: string,
  value: TaskQueryParamValue,
): void {
  if (value) {
    searchParams.append(key, String(value));
  }
}

function appendBooleanIfDefined(
  searchParams: URLSearchParams,
  key: string,
  value: boolean | undefined,
): void {
  if (value !== undefined) {
    searchParams.append(key, String(value));
  }
}

function appendRepeatedQueryParam(
  searchParams: URLSearchParams,
  key: string,
  values: string[] | undefined,
): void {
  if (!values?.length) {
    return;
  }
  for (const item of values) {
    searchParams.append(key, item);
  }
}

function appendOrderParams(
  searchParams: URLSearchParams,
  order: ListTasksParams['order'],
): void {
  const column = order?.column;
  const dir = order?.dir;
  if (column) {
    searchParams.append('order[column]', column);
  }
  if (dir) {
    searchParams.append('order[dir]', dir);
  }
}

function buildListTasksSearchParams(params: ListTasksParams): URLSearchParams {
  const {
    page = 1,
    limit = 20,
    type = '',
    project_id,
    search = '',
    status_id,
    status: statusNameFilter,
    priority,
    is_completed,
    due_date_from,
    due_date_to,
    frequency,
    is_active,
    withRelations,
    created_at_from,
    created_at_to,
    assignees,
    order,
  } = params;

  const searchParams = new URLSearchParams();
  searchParams.append('page', String(page));
  searchParams.append('limit', String(limit));
  searchParams.append('type', type);

  appendTruthyQueryParam(searchParams, 'project_id', project_id);
  appendTruthyQueryParam(searchParams, 'search', search);
  const trimmedStatusName =
    statusNameFilter == null ? "" : String(statusNameFilter).trim();
  const hasStatusNameFilter = trimmedStatusName.length > 0;
  if (hasStatusNameFilter) {
    searchParams.append("status", trimmedStatusName);
  } else {
    appendTruthyQueryParam(searchParams, "status_id", status_id);
  }
  appendTruthyQueryParam(searchParams, 'priority', priority);
  appendBooleanIfDefined(searchParams, 'is_completed', is_completed);
  appendTruthyQueryParam(searchParams, 'due_date_from', due_date_from);
  appendTruthyQueryParam(searchParams, 'due_date_to', due_date_to);
  appendTruthyQueryParam(searchParams, 'frequency', frequency);
  appendBooleanIfDefined(searchParams, 'is_active', is_active);
  appendTruthyQueryParam(searchParams, 'created_at_from', created_at_from);
  appendTruthyQueryParam(searchParams, 'created_at_to', created_at_to);

  appendOrderParams(searchParams, order);
  appendRepeatedQueryParam(searchParams, 'with[]', withRelations);
  appendRepeatedQueryParam(searchParams, 'assignees[]', assignees);

  return searchParams;
}

function parseListTasksResponse(
  response: { data?: unknown },
): ListTasksParsedBody | null {
  const responseData = response?.data;
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }
  const body = responseData as { success?: boolean; message?: string };
  if (body.success === false) {
    reportTasksApiError(response, body.message || 'Failed to fetch tasks');
    toast.error(body.message || 'Failed to fetch tasks');
    return null;
  }
  return responseData as ListTasksParsedBody;
}

/**
 * List all tasks with pagination and filters
 */
export const listTasks = async (
  params: ListTasksParams = {},
): Promise<ListTasksParsedBody | null> => {
  try {
    const formattedParams = buildListTasksSearchParams(params);
    const url = `${prefix}/tasks?${formattedParams.toString()}`;
    const response = await axiosInstance.get(url);
    return parseListTasksResponse(response);
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

export interface TaskActivitiesQuery {
  page?: number;
  limit?: number;
  /** Filter by free-text search (API param: `search`). */
  search?: string;
  /** Filter by action type (API param: `action`). */
  action?: string;
}

export interface TaskActivitiesPagedResult {
  data: any[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    last_page: number;
    from?: number;
    to?: number;
  };
}

/**
 * Task activities with pagination metadata (supports `search` and `action` filters).
 */
export const getTaskActivitiesPaged = async (
  taskId: string | number,
  query: TaskActivitiesQuery = {},
): Promise<TaskActivitiesPagedResult | null> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  try {
    const params: Record<string, string | number> = { page, limit, task_id: taskId };
    const search = query.search?.trim();
    if (search) {
      params.search = search;
    }
    const action = query.action?.trim();
    if (action) {
      params.action = action;
    }

    const response = await axiosInstance.get(`${prefix}/tasks/activities`, { params });
    if (!response?.data) {
      reportTasksApiError(response, 'Failed to fetch task activities');
      toast.error('Failed to fetch task activities');
      return null;
    }

    const responseData = response.data;
    if (responseData.success === false) {
      reportTasksApiError(response, responseData.message || 'Failed to fetch task activities');
      toast.error(responseData.message || 'Failed to fetch task activities');
      return null;
    }

    const data = Array.isArray(responseData.data) ? responseData.data : [];
    const rawPag = responseData.pagination;
    const pagination =
      rawPag && typeof rawPag === 'object'
        ? {
            total: Number(rawPag.total) || data.length,
            limit: Number(rawPag.limit) || limit,
            page: Number(rawPag.page) || page,
            last_page: Math.max(1, Number(rawPag.last_page) || 1),
            from: rawPag.from,
            to: rawPag.to,
          }
        : {
            total: data.length,
            limit,
            page,
            last_page: Math.max(1, Math.ceil(data.length / Math.max(limit, 1)) || 1),
          };

    return { data, pagination };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Project-scoped activities with pagination (same endpoint shape as task activities; uses `project_id`).
 * Falls back to client-side pagination via {@link getRecentActivity} when the request fails.
 */
export const getProjectActivitiesPaged = async (
  projectId: number,
  query: TaskActivitiesQuery = {},
): Promise<TaskActivitiesPagedResult | null> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  try {
    const params: Record<string, string | number> = { page, limit, project_id: projectId };
    const search = query.search?.trim();
    if (search) {
      params.search = search;
    }
    const action = query.action?.trim();
    if (action) {
      params.action = action;
    }

    const response = await axiosInstance.get(`${prefix}/tasks/activities`, { params });
    if (!response?.data) {
      reportTasksApiError(response, 'Failed to fetch project activities');
      return null;
    }

    const responseData = response.data;
    if (responseData.success === false) {
      reportTasksApiError(response, responseData.message || 'Failed to fetch project activities');
      return null;
    }

    const data = Array.isArray(responseData.data) ? responseData.data : [];
    const rawPag = responseData.pagination;
    const pagination =
      rawPag && typeof rawPag === 'object'
        ? {
            total: Number(rawPag.total) || data.length,
            limit: Number(rawPag.limit) || limit,
            page: Number(rawPag.page) || page,
            last_page: Math.max(1, Number(rawPag.last_page) || 1),
            from: rawPag.from,
            to: rawPag.to,
          }
        : {
            total: data.length,
            limit,
            page,
            last_page: Math.max(1, Math.ceil(data.length / Math.max(limit, 1)) || 1),
          };

    return { data, pagination };
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
};

/**
 * Get activities for a specific task (data array only; backward compatible).
 */
export const getTaskActivities = async (
  taskId: string | number,
  page: number = 1,
  limit: number = 20,
  filters?: Pick<TaskActivitiesQuery, 'search' | 'action'>,
) => {
  const result = await getTaskActivitiesPaged(taskId, { page, limit, ...filters });
  if (result == null) {
    return [];
  }
  return result.data;
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
        reportTasksApiError(response, responseData.message || 'Failed to fetch task documents');
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

export interface MyDayPreferences {
  daily_capacity_minutes?: number;
  my_day_default_view?: boolean;
  rollover_shown_date?: string | null;
  last_my_day_seen_date?: string | null;
}

/**
 * My Day HTTP paths use the work-planner proxy prefix (`/api/work-planner/my-day/...`).
 * Laravel may also expose the same handlers under `/api/tasks/my-day/...` (Postman); keep paths in sync with your deployed API.
 */

export interface MyDayTasksMeta {
  planned_minutes?: number;
  completed_minutes?: number;
  active_count?: number;
  completed_count?: number;
  tasks_planned?: number;
  tasks_completed?: number;
  unestimated_task_count?: number;
}

/** Postman: `daily_log` (EOD / past-days rebuild); `my_day_entries` (live plan fallback). */
export type MyDayHistorySource = "daily_log" | "my_day_entries";

export interface MyDayTasksPayload {
  active: unknown[];
  completed: unknown[];
  deleted_tasks?: unknown[];
  plan_date?: string;
  meta?: MyDayTasksMeta;
  read_only?: boolean;
  is_empty_by_design?: boolean;
  last_my_day_seen_date?: string | null;
  history_source?: MyDayHistorySource | null;
}

export type MyDaySuggestionCategory =
  | "overdue"
  | "due_today"
  | "high_priority"
  | "assigned_to_me"
  | "organizational_tasks"
  | "personal_tasks"
  | "flexible_upcoming"
  | "backlog"
  | "repeatedly_ignored";

export type MyDaySuggestionsPayload = Partial<Record<MyDaySuggestionCategory, unknown[]>>;

export interface MyDayCapacityPayload {
  default_capacity_minutes?: number;
  override_capacity_minutes?: number | null;
  effective_capacity_minutes?: number;
  planned_minutes?: number;
  completed_minutes?: number;
  tasks_planned?: number;
  tasks_completed?: number;
  unestimated_task_count?: number;
  capacity_used_percent?: number;
  is_over_capacity?: boolean;
  minutes_over_capacity?: number;
}

/** Raw suggestions body may use `flexible_tasks` as an alias for `flexible_upcoming`. */
export type MyDaySuggestionsApiPayload = MyDaySuggestionsPayload & {
  flexible_tasks?: unknown[];
};

export interface MyDayRolloverPayload {
  tasks: unknown[];
  /** Server: tasks exist, not acked today, `days_since_last_seen === 1`. */
  show_rollover_prompt?: boolean;
  tasks_preview?: unknown[];
  prompt_acknowledged_today?: boolean;
  previous_date?: string | null;
  days_since_last_seen?: number | null;
  last_my_day_seen_date?: string | null;
}

export interface MyDayTeamReporteePayload {
  extension_number: string;
  active: unknown[];
  completed: unknown[];
  meta?: MyDayTasksMeta;
}

export interface MyDayTeamPayload {
  plan_date?: string;
  reportees: MyDayTeamReporteePayload[];
}

export interface MyDayRolloverAckPayload {
  rollover_shown_date?: string | null;
  prompt_acknowledged_today?: boolean;
}

/** EOD snapshot from `GET /my-day/daily-logs/{date}` (Postman: daily-log-save cron). */
export interface MyDayDailyLogPayload {
  log_date?: string;
  plan_date?: string;
  tasks_planned?: number;
  tasks_completed?: number;
  planned_minutes?: number;
  completed_minutes?: number;
  effective_capacity_minutes?: number;
  default_capacity_minutes?: number;
  override_capacity_minutes?: number;
  capacity_used_percent?: number;
  load_percent?: number;
  tasks?: unknown[];
  deleted_tasks?: unknown[];
  snapshots?: unknown[];
  meta?: MyDayTasksMeta;
  history_source?: MyDayHistorySource | null;
}

export interface MyDayDailyLogsListPayload {
  logs?: MyDayDailyLogPayload[];
}

function parseMyDayResponseData<T>(response: { data?: unknown }): T {
  const responseData = response?.data;
  if (responseData == null || typeof responseData !== "object") {
    throw new Error("Invalid My Day API response");
  }
  const body = responseData as { success?: boolean; message?: string; data?: T };
  if (body.success === false) {
    throw new Error(body.message || "My Day API request failed");
  }
  if (body.data !== undefined) {
    return body.data;
  }
  return responseData as T;
}

function buildMyDayQuery(params: Record<string, string | number | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });
  return searchParams;
}

function buildMyDayQueryWithArrays(
  params: Record<string, string | number | undefined>,
  arrayParams: Record<string, string[]> = {},
): URLSearchParams {
  const searchParams = buildMyDayQuery(params);
  Object.entries(arrayParams).forEach(([key, values]) => {
    values.forEach((value) => {
      if (value.trim() !== "") searchParams.append(key, value);
    });
  });
  return searchParams;
}

export function parseMyDayHistorySource(value: unknown): MyDayHistorySource | null {
  if (value === "daily_log" || value === "my_day_entries") {
    return value;
  }
  return null;
}

function normalizeMyDayTasksPayload(payload: MyDayTasksPayload): MyDayTasksPayload {
  const meta = payload.meta ?? {};
  const historySource = parseMyDayHistorySource(payload.history_source);
  return {
    active: Array.isArray(payload.active) ? payload.active : [],
    completed: Array.isArray(payload.completed) ? payload.completed : [],
    deleted_tasks: Array.isArray(payload.deleted_tasks) ? payload.deleted_tasks : [],
    plan_date: payload.plan_date,
    meta: {
      ...meta,
      active_count: meta.active_count ?? undefined,
      completed_count: meta.completed_count ?? undefined,
    },
    read_only: payload.read_only === true,
    is_empty_by_design: payload.is_empty_by_design === true,
    last_my_day_seen_date: payload.last_my_day_seen_date ?? null,
    history_source: historySource,
  };
}

function buildMyDayUrl(path: string, query: URLSearchParams): string {
  const queryString = query.toString();
  if (queryString === "") return path;
  return `${path}?${queryString}`;
}

export const getMyDayPreferences = async (
  extensionNumber?: string,
): Promise<MyDayPreferences> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const url = buildMyDayUrl("work-planner/my-day/preferences", query);
  const response = await axiosInstance.get(url);
  return parseMyDayResponseData<MyDayPreferences>(response);
};

export const patchMyDayPreferences = async (
  payload: Partial<Pick<MyDayPreferences, "daily_capacity_minutes" | "my_day_default_view">>,
  extensionNumber?: string,
): Promise<MyDayPreferences> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const url = buildMyDayUrl("work-planner/my-day/preferences", query);
  const response = await axiosInstance.patch(url, payload);
  return parseMyDayResponseData<MyDayPreferences>(response);
};

export const listMyDayTasks = async (
  params: { date?: string; extension_number?: string } = {},
): Promise<MyDayTasksPayload> => {
  const query = buildMyDayQuery({
    date: params.date,
    extension_number: params.extension_number,
  });
  const response = await axiosInstance.get(`work-planner/my-day/tasks?${query.toString()}`);
  const payload = parseMyDayResponseData<MyDayTasksPayload>(response);
  return normalizeMyDayTasksPayload(payload);
};

export const getMyDaySuggestions = async (
  params: { search?: string; extension_number?: string } = {},
): Promise<MyDaySuggestionsPayload> => {
  const trimmedSearch = params.search?.trim();
  const query = buildMyDayQuery({
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    extension_number: params.extension_number,
  });
  const response = await axiosInstance.get(`work-planner/my-day/suggestions?${query.toString()}`);
  return parseMyDayResponseData<MyDaySuggestionsApiPayload>(response);
};

export const getMyDayCapacity = async (
  params: { date?: string; extension_number?: string } = {},
): Promise<MyDayCapacityPayload> => {
  const query = buildMyDayQuery({
    date: params.date,
    extension_number: params.extension_number,
  });
  const response = await axiosInstance.get(`work-planner/my-day/capacity?${query.toString()}`);
  return parseMyDayResponseData<MyDayCapacityPayload>(response);
};

export const overrideMyDayCapacity = async (
  payload: { minutes: number; for_date?: string },
  extensionNumber?: string,
): Promise<MyDayCapacityPayload> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const url = buildMyDayUrl("work-planner/my-day/capacity/override", query);
  const response = await axiosInstance.patch(url, payload);
  return parseMyDayResponseData<MyDayCapacityPayload>(response);
};

export const addTaskToMyDay = async (
  payload: { task_id: number; plan_date?: string; estimated_minutes?: number },
  extensionNumber?: string,
): Promise<{ added?: boolean; already_in_my_day?: boolean; task?: unknown }> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const url = buildMyDayUrl("work-planner/my-day/add", query);
  const response = await axiosInstance.post(url, payload);
  const parsed = parseMyDayResponseData<{
    added?: boolean;
    already_in_my_day?: boolean;
    task?: unknown;
  }>(response);
  if (typeof parsed === "object" && parsed !== null) {
    return parsed;
  }
  return { added: true };
};

export const removeTaskFromMyDay = async (
  taskId: number,
  params: { plan_date?: string; extension_number?: string } = {},
): Promise<unknown> => {
  const query = buildMyDayQuery({
    plan_date: params.plan_date,
    extension_number: params.extension_number,
  });
  const response = await axiosInstance.delete(
    buildMyDayUrl(`work-planner/my-day/remove/${taskId}`, query),
  );
  return parseMyDayResponseData(response);
};

export const toggleMyDayTaskComplete = async (
  taskId: number,
  extensionNumber?: string,
): Promise<unknown> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.patch(
    buildMyDayUrl(`work-planner/my-day/complete/${taskId}`, query),
  );
  return parseMyDayResponseData(response);
};

export const getMyDayRollover = async (
  extensionNumber?: string,
): Promise<MyDayRolloverPayload> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.get(
    buildMyDayUrl("work-planner/my-day/rollover", query),
  );
  const payload = parseMyDayResponseData<MyDayRolloverPayload>(response);
  const tasksList = Array.isArray(payload.tasks) ? payload.tasks : [];
  return {
    tasks: tasksList,
    tasks_preview: Array.isArray(payload.tasks_preview) ? payload.tasks_preview : undefined,
    show_rollover_prompt: payload.show_rollover_prompt === true,
    prompt_acknowledged_today: payload.prompt_acknowledged_today === true,
    previous_date: payload.previous_date ?? null,
    days_since_last_seen:
      payload.days_since_last_seen == null ? null : Number(payload.days_since_last_seen),
    last_my_day_seen_date: payload.last_my_day_seen_date ?? null,
  };
};

export const ackMyDayRolloverPrompt = async (
  extensionNumber?: string,
): Promise<MyDayRolloverAckPayload> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.post(
    buildMyDayUrl("work-planner/my-day/rollover/ack", query),
  );
  return parseMyDayResponseData<MyDayRolloverAckPayload>(response);
};

export const getMyDayTeam = async (
  params: {
    extension_number?: string;
    reportee_extensions: string[];
    date?: string;
  },
): Promise<MyDayTeamPayload> => {
  const query = buildMyDayQueryWithArrays(
    {
      extension_number: params.extension_number,
      date: params.date,
    },
    { "reportee_extensions[]": params.reportee_extensions },
  );
  const response = await axiosInstance.get(`work-planner/my-day/team?${query.toString()}`);
  const payload = parseMyDayResponseData<MyDayTeamPayload>(response);
  return {
    plan_date: payload.plan_date,
    reportees: Array.isArray(payload.reportees) ? payload.reportees : [],
  };
};

export const submitMyDayRolloverAction = async (
  payload: { task_ids: number[]; action: "today" | "schedule" | "dismiss"; schedule_date?: string },
  extensionNumber?: string,
): Promise<unknown> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.post(
    buildMyDayUrl("work-planner/my-day/rollover/action", query),
    payload,
  );
  return parseMyDayResponseData(response);
};

export const getMyDayPastDaySnapshot = async (
  date: string,
  extensionNumber?: string,
): Promise<MyDayTasksPayload> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.get(
    buildMyDayUrl(`work-planner/my-day/past-days/${date}`, query),
  );
  const payload = parseMyDayResponseData<MyDayTasksPayload>(response);
  return normalizeMyDayTasksPayload({ ...payload, read_only: true });
};

export const listMyDayDailyLogs = async (
  params: {
    extension_number?: string;
    from?: string;
    to?: string;
    limit?: number;
  } = {},
): Promise<MyDayDailyLogPayload[]> => {
  const query = buildMyDayQuery({
    extension_number: params.extension_number,
    from: params.from,
    to: params.to,
    limit: params.limit ?? 90,
  });
  const response = await axiosInstance.get(
    `work-planner/my-day/daily-logs?${query.toString()}`,
  );
  const payload = parseMyDayResponseData<MyDayDailyLogsListPayload | MyDayDailyLogPayload[]>(
    response,
  );
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.logs) ? payload.logs : [];
};

export const getMyDayDailyLogByDate = async (
  date: string,
  extensionNumber?: string,
): Promise<MyDayDailyLogPayload> => {
  const query = buildMyDayQuery({ extension_number: extensionNumber });
  const response = await axiosInstance.get(
    buildMyDayUrl(`work-planner/my-day/daily-logs/${date}`, query),
  );
  return parseMyDayResponseData<MyDayDailyLogPayload>(response);
};

// ==================== Workload (team capacity / planner) ====================
/** Same handlers as `/api/tasks/workload` when routed under the work-planner group. */
const workloadTasksPath = `${prefix}/tasks/workload`;

export type WorkloadRangePreset = "this_week" | "next_week" | "custom";
export type AssigneeMatch = "primary" | "any";

export interface WorkloadSummaryMember {
  extension_number: string;
  load_band?: string;
  load_percent?: number;
  task_count?: number;
  unestimated_task_count?: number;
  is_overloaded?: boolean;
}

export interface WorkloadSummaryData {
  /** Primary KPI cards (TaskWorkloadController summary). */
  total_tasks_this_week: number;
  unestimated_tasks: number;
  critical_priority_tasks: number;
  overloaded_members: number;
  total_members?: number;
  /** Legacy / additional counts (still returned by API). */
  total_tasks_in_range?: number;
  total_workload?: number;
  overdue_tasks?: number;
  overdue_tasks_in_range?: number;
  under_allocated_cells?: number;
  over_allocated_cells?: number;
  range?: { start: string; end: string };
  extension_numbers?: string[];
  assignee_match?: AssigneeMatch;
  members?: WorkloadSummaryMember[];
}

export interface WorkloadGridMember {
  extension_number: string;
  name?: string | null;
  display_name?: string | null;
  is_owner?: boolean;
  role?: string | null;
}

export interface WorkloadGridCell {
  extension_number: string;
  date: string;
  estimated_minutes: number;
  unestimated_count: number;
  task_count: number;
  effective_capacity_minutes: number;
  load_percent: number;
  load_band: string;
  has_unestimated: boolean;
}

export interface WorkloadGridData {
  extension_numbers: string[];
  assignee_match: AssigneeMatch;
  timezone: string;
  range: { start: string; end: string };
  members: WorkloadGridMember[];
  days: string[];
  cells: WorkloadGridCell[];
  empty_team: boolean;
  empty_team_message: string | null;
}

export interface WorkloadTaskCard {
  id: number;
  task_id: string;
  title: string;
  priority: number;
  due_date: string | null;
  is_overdue: boolean;
  estimated_duration_minutes?: number | null;
  /** Some workload endpoints return this instead of `estimated_duration_minutes`. */
  estimated_minutes?: number | null;
  estimated_hours?: number | string | null;
  project_id: number | null;
  project_name: string | null;
  status_id: number;
  status_name: string | null;
  status_color: string | null;
  is_completed: boolean;
  type: string;
  phase: string;
  primary_assignee_extension: string | null;
}

export interface WorkloadBoardColumn {
  extension_number: string;
  name?: string | null;
  display_name?: string | null;
  is_owner?: boolean;
  role?: string | null;
  estimated_minutes: number;
  unestimated_count: number;
  task_count: number;
  effective_capacity_minutes_per_day: number;
  effective_capacity_minutes_period: number;
  range_day_count: number;
  load_percent: number;
  load_band: string;
  tasks: WorkloadTaskCard[];
}

export interface WorkloadBoardData {
  extension_numbers: string[];
  assignee_match: AssigneeMatch;
  range: { start: string; end: string };
  columns: WorkloadBoardColumn[];
  empty_team: boolean;
  empty_team_message: string | null;
}

export interface WorkloadDayData {
  heading_extension: string;
  date: string;
  tasks: WorkloadTaskCard[];
  summary: {
    estimated_minutes: number;
    unestimated_task_count: number;
    task_count: number;
  };
}

export interface WorkloadUnassignedData {
  count: number;
  tasks: WorkloadTaskCard[];
}

export interface WorkloadOverloadCheckData {
  overloaded: boolean;
  current_estimated_minutes: number;
  after_estimated_minutes: number;
  effective_capacity_minutes: number;
}

function parseWorkloadPlannerResponseData<T>(response: { data?: unknown }): T {
  const body = response?.data;
  if (body == null || typeof body !== "object") {
    throw new Error("Invalid workload response");
  }
  const wrapped = body as {
    success?: boolean;
    message?: string;
    data?: T;
  };
  if (wrapped.success === false) {
    throw new Error(wrapped.message || "Workload request failed");
  }
  if (wrapped.data === undefined || wrapped.data === null) {
    throw new Error(wrapped.message || "Workload response missing data");
  }
  return wrapped.data;
}

export interface WorkloadQueryBase {
  extension_number: string;
  assignee_match?: AssigneeMatch;
  range?: WorkloadRangePreset;
  start?: string;
  end?: string;
  extension_numbers?: string[];
  /** When set, scopes grid/board/summary to one project (server-supported). */
  project_id?: number;
  /** When true, scope to organization tasks with no project (server-supported). */
  no_project?: boolean;
}

function appendWorkloadQueryParams(
  params: URLSearchParams,
  q: WorkloadQueryBase,
): void {
  params.set("extension_number", q.extension_number);
  if (q.assignee_match) params.set("assignee_match", q.assignee_match);
  if (q.range) params.set("range", q.range);
  if (q.start) params.set("start", q.start);
  if (q.end) params.set("end", q.end);
  if (q.project_id != null) {
    params.set("project_id", String(q.project_id));
  }
  if (q.no_project === true) {
    params.set("no_project", "1");
  }
  if (Array.isArray(q.extension_numbers)) {
    for (const ext of q.extension_numbers) {
      if (ext) params.append("extension_numbers[]", ext);
    }
  }
}

export async function getWorkloadSummary(
  q: WorkloadQueryBase,
): Promise<WorkloadSummaryData> {
  const params = new URLSearchParams();
  appendWorkloadQueryParams(params, q);
  const response = await axiosInstance.get(
    `${workloadTasksPath}/summary?${params.toString()}`,
  );
  const data = parseWorkloadPlannerResponseData<WorkloadSummaryData>(response);
  return normalizeWorkloadSummaryData(data);
}

function readWorkloadSummaryCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function countOverloadedMembersFromSummary(members: WorkloadSummaryMember[] | undefined): number {
  if (!Array.isArray(members)) return 0;
  return members.filter(
    (m) => m.is_overloaded === true || m.load_band === "overloaded",
  ).length;
}

function normalizeWorkloadSummaryData(raw: WorkloadSummaryData): WorkloadSummaryData {
  const members = Array.isArray(raw.members) ? raw.members : [];
  const totalTasksThisWeek = readWorkloadSummaryCount(
    raw.total_tasks_this_week ??
      raw.total_tasks_in_range ??
      raw.total_workload,
  );
  const overloadedFromMembers = countOverloadedMembersFromSummary(members);
  const overloadedMembers = readWorkloadSummaryCount(
    raw.overloaded_members ?? overloadedFromMembers,
  );

  return {
    total_tasks_this_week: totalTasksThisWeek,
    unestimated_tasks: readWorkloadSummaryCount(raw.unestimated_tasks),
    critical_priority_tasks: readWorkloadSummaryCount(raw.critical_priority_tasks),
    overloaded_members: overloadedMembers,
    total_members:
      raw.total_members != null
        ? readWorkloadSummaryCount(raw.total_members)
        : members.length > 0
          ? members.length
          : undefined,
    total_tasks_in_range: readWorkloadSummaryCount(raw.total_tasks_in_range) || totalTasksThisWeek,
    total_workload: readWorkloadSummaryCount(raw.total_workload),
    overdue_tasks: readWorkloadSummaryCount(raw.overdue_tasks),
    overdue_tasks_in_range: readWorkloadSummaryCount(raw.overdue_tasks_in_range),
    under_allocated_cells: readWorkloadSummaryCount(raw.under_allocated_cells),
    over_allocated_cells: readWorkloadSummaryCount(raw.over_allocated_cells),
    range: raw.range,
    extension_numbers: raw.extension_numbers,
    assignee_match: raw.assignee_match,
    members,
  };
}

export async function getWorkloadGrid(
  q: WorkloadQueryBase,
): Promise<WorkloadGridData> {
  const params = new URLSearchParams();
  appendWorkloadQueryParams(params, q);
  const response = await axiosInstance.get(
    `${workloadTasksPath}/grid?${params.toString()}`,
  );
  return parseWorkloadPlannerResponseData<WorkloadGridData>(response);
}

export async function getWorkloadBoard(
  q: WorkloadQueryBase,
): Promise<WorkloadBoardData> {
  const params = new URLSearchParams();
  appendWorkloadQueryParams(params, q);
  const response = await axiosInstance.get(
    `${workloadTasksPath}/board?${params.toString()}`,
  );
  return parseWorkloadPlannerResponseData<WorkloadBoardData>(response);
}

export async function getWorkloadDay(params: {
  extension_number: string;
  date: string;
  assignee_match?: AssigneeMatch;
}): Promise<WorkloadDayData> {
  const search = new URLSearchParams();
  search.set("extension_number", params.extension_number);
  search.set("date", params.date);
  if (params.assignee_match) {
    search.set("assignee_match", params.assignee_match);
  }
  const response = await axiosInstance.get(
    `${workloadTasksPath}/day?${search.toString()}`,
  );
  return parseWorkloadPlannerResponseData<WorkloadDayData>(response);
}

export async function getWorkloadUnassigned(params: {
  extension_number: string;
  limit?: number;
  project_id?: number;
}): Promise<WorkloadUnassignedData> {
  const search = new URLSearchParams();
  search.set("extension_number", params.extension_number);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.project_id != null) {
    search.set("project_id", String(params.project_id));
  }
  const response = await axiosInstance.get(
    `${workloadTasksPath}/unassigned?${search.toString()}`,
  );
  return parseWorkloadPlannerResponseData<WorkloadUnassignedData>(response);
}

export async function getWorkloadOverloadCheck(params: {
  extension_number: string;
  date: string;
  additional_estimated_minutes: number;
  exclude_task_id?: number | null;
  assignee_match?: AssigneeMatch;
}): Promise<WorkloadOverloadCheckData> {
  const search = new URLSearchParams();
  search.set("extension_number", params.extension_number);
  search.set("date", params.date);
  search.set(
    "additional_estimated_minutes",
    String(params.additional_estimated_minutes),
  );
  if (params.exclude_task_id != null) {
    search.set("exclude_task_id", String(params.exclude_task_id));
  }
  if (params.assignee_match) {
    search.set("assignee_match", params.assignee_match);
  }
  const response = await axiosInstance.get(
    `${workloadTasksPath}/overload-check?${search.toString()}`,
  );
  return parseWorkloadPlannerResponseData<WorkloadOverloadCheckData>(response);
}

export interface PatchWorkloadTaskBody {
  due_date?: string | null;
  extension_numbers?: string[];
  is_completed?: boolean;
  /** Planner task priority string (`low`, `normal`, `high`, `urgent`). */
  priority?: string;
  estimated_duration_minutes?: number;
}

export async function patchWorkloadTask(
  taskId: number | string,
  extension_number: string,
  body: PatchWorkloadTaskBody,
): Promise<unknown> {
  const search = new URLSearchParams();
  search.set("extension_number", extension_number);
  const response = await axiosInstance.patch(
    `${workloadTasksPath}/${taskId}?${search.toString()}`,
    body,
  );
  return parseWorkloadPlannerResponseData<unknown>(response);
}

