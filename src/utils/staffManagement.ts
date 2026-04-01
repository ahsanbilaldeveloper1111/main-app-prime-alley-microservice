import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { GetMinifiedUsers } from "./users";

const PREFIX = "/staff-management";

/** Company identifier from session; set via setStaffManagementCompanyIdentifier (e.g. from employees page). */
let _companyIdentifier: string | null = null;

export function setStaffManagementCompanyIdentifier(companyIdentifier: string | null): void {
  _companyIdentifier = companyIdentifier;
}

export function getStaffManagementCompanyIdentifier(): string | null {
  return _companyIdentifier;
}

/** Merge company_identifier into params when set; use for staff-management API calls. */
function staffParams<T extends Record<string, unknown>>(params?: T): (T & { company_identifier?: string }) {
  const base = (params ?? {}) as T;
  if (_companyIdentifier != null && _companyIdentifier !== "") {
    return { ...base, company_identifier: _companyIdentifier } as T & { company_identifier: string };
  }
  return base as T & { company_identifier?: string };
}

// --- API Response & Pagination ---

export interface ApiPagination {
  total: number;
  limit: number;
  page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  action?: string;
  data: T;
  pagination?: ApiPagination;
}

function extractData<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data;
  if (body?.success && body.data !== undefined) {
    return body.data;
  }
  throw new Error(body?.message || "API request failed");
}

function extractDataWithPagination<T>(
  response: { data: ApiResponse<T[]> }
): { data: T[]; pagination?: ApiPagination } {
  const body = response.data;
  if (body?.success && body.data !== undefined) {
    return { data: body.data, pagination: body.pagination };
  }
  throw new Error(body?.message || "API request failed");
}

function handleApiError(error: unknown, fallbackMessage: string): never {
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message)
      : fallbackMessage;
  toast.error(msg);
  throw error;
}

// --- Dashboard ---

export interface DashboardOverview {
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  outstanding_amount: number;
  overdue_amount: number;
  profit_margin: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  recent_invoices: unknown[];
  recent_payments: unknown[];
  recent_expenses: unknown[];
  monthly_revenue: unknown[];
  monthly_expenses: unknown[];
  outstanding_invoices: unknown[];
  overdue_invoices: unknown[];
  currency_stats: unknown[];
}

export const getDashboard = async (): Promise<DashboardData> => {
  try {
    const response = await axiosInstance.get<ApiResponse<DashboardData>>(
      `${PREFIX}/dashboard`,
      { params: staffParams() }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch dashboard");
  }
};

// --- Audit Logs ---



export const AuditLogsStaffManagement = async (
  params: Record<string, unknown> = {}
): Promise<{ data: unknown[]; pagination?: ApiPagination } | unknown[] | null> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/audit-logs`,
      { params }
    );
   return response.data ?? response;
  } catch (error: unknown) {
    throw error;
  }
};

// --- User Profile ---

export interface UserProfileAddress {
  id?: number;
  name?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
}

export interface UserProfilePayload {
  tenant_id?: string | null;
  user_id?: string | null;
  extension_number?: string | null;
  department_id?: number | null;
  location_id?: number | null;
  employee_code?: string | null;
  identification_number?: string | null;
  job_title?: string | null;
  employment_type?: string | null;
  contract_type?: string | null;
  designation?: string | null;
  location?: string | null;
  phone?: string | null;
  status?: string | null;
  meta?: Record<string, unknown> | null;
  address_name?: string;
  address_zip_code?: string;
  address_city?: string;
  address_country?: string;
  address_address?: string;
  addresses?: UserProfileAddress[];
}

export interface UserProfile extends UserProfilePayload {
  id: number;
  [key: string]: unknown;
}

export interface UserProfileMinified {
  id: number;
  user_id: string;
  parent_id: string | null;
  department_id: string;
}

export const getUserProfiles = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{ data: UserProfile[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserProfile[]>>(
      `${PREFIX}/user-profiles`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user profiles");
  }
};

export const getUserProfilesMinified = async (): Promise<UserProfileMinified[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserProfileMinified[]>>(
      `${PREFIX}/user-profiles?minified_data=true`
    );
    const raw = extractData(response);
    return Array.isArray(raw) ? raw : [];
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user profiles minified");
  }
};

export const createUserProfile = async (
  data: UserProfilePayload
): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserProfile>>(
      `${PREFIX}/user-profiles`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create user profile");
  }
};

export const getUserProfile = async (id: number): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserProfile>>(
      `${PREFIX}/user-profiles/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user profile");
  }
};

export const updateUserProfile = async (
  id: number,
  data: Partial<UserProfilePayload>
): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.put<ApiResponse<UserProfile>>(
      `${PREFIX}/user-profiles/${id}`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update user profile");
  }
};

export const deleteUserProfile = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/user-profiles/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete user profile");
  }
};

export const getUserProfilesOrgChart = async (): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/user-profiles/org-chart`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch org chart");
  }
};

export const getUserProfilesOrgChartTree = async (params?: {
  department_id?: string;
  user_ids?: string[];
}): Promise<unknown> => {
  try {
    const requestParams: Record<string, string | string[] | undefined> = {};
    if (params?.department_id != null && params.department_id !== "") requestParams.department_id = params.department_id;
    if (params?.user_ids != null && params.user_ids.length > 0) requestParams.user_ids = params.user_ids;
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/user-profiles/org-chart-tree`,
      { params: Object.keys(requestParams).length ? requestParams : undefined }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch org chart tree");
  }
};

export const putUserProfileBulkReports = async (
  id: string | number,
  data: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `${PREFIX}/user-profiles/${id}/bulk-reports`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update user profile bulk reports");
  }
};

export const putUserProfileParent = async (
  id: string | number,
  data: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `${PREFIX}/user-profiles/${id}/parent`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update user profile parent");
  }
};

// --- User Request Categories ---

/** Assignee for a workflow level */
export interface WorkflowLevelAssignee {
  user_id: string; // extension number of assignee
  sort_order?: number;
}

/** Single approval workflow level */
export interface WorkflowLevelPayload {
  level: number; // min 1
  name?: string | null;
  approval_rule?: "any" | "all" | null; // any = one approval completes, all = all must approve
  approve_in_order?: boolean | null;
  assignees?: WorkflowLevelAssignee[] | null;
}

export interface UserRequestCategoryPayload {
  parent_id?: number | null;
  name?: string | null; // required for child categories, optional for parent
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number | null;
  tracking_enabled?: boolean | null;
  tracking_code_prefix?: string | null; // max 50 when tracking enabled
  workflow_levels?: WorkflowLevelPayload[] | null;
}

export interface UserRequestCategory extends UserRequestCategoryPayload {
  id: number;
  fields?: UserRequestCategoryField[];
  [key: string]: unknown;
}

/** Serialize query params so that null/undefined are still sent (e.g. parent=null). */
function stringifyRequestParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      searchParams.set(key, "null");
    } else if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export const getUserRequestCategories = async (params?: {
  page?: number;
  limit?: number;
  parent?: number | null;
  [key: string]: unknown;
}): Promise<{
  data: UserRequestCategory[];
  pagination?: ApiPagination;
}> => {
  try {
    const requestParams = params ?? {};
    const response = await axiosInstance.get<
      ApiResponse<UserRequestCategory[]>
    >(`${PREFIX}/user-request-categories`, {
      params: requestParams,
      paramsSerializer: (p: Record<string, unknown>) => stringifyRequestParams(p),
    });
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user request categories");
  }
};

export const createUserRequestCategory = async (
  data: UserRequestCategoryPayload
): Promise<UserRequestCategory> => {
  try {
    const response = await axiosInstance.post<
      ApiResponse<UserRequestCategory>
    >(`${PREFIX}/user-request-categories`, data);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create user request category");
  }
};

export const getUserRequestCategory = async (
  id: number
): Promise<UserRequestCategory> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<UserRequestCategory>
    >(`${PREFIX}/user-request-categories/${id}`);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user request category");
  }
};

export const updateUserRequestCategory = async (
  id: number,
  data: Partial<UserRequestCategoryPayload>
): Promise<UserRequestCategory> => {
  try {
    const response = await axiosInstance.put<
      ApiResponse<UserRequestCategory>
    >(`${PREFIX}/user-request-categories/${id}`, data);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update user request category");
  }
};

export const deleteUserRequestCategory = async (id: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete(`${PREFIX}/user-request-categories/${id}`);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete user request category");
  }
};

// --- User Request Category Fields ---

export type UserRequestCategoryFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "boolean"
  | "checkbox"
  | "radio"
  | "toggle"
  | "file";

export interface FieldConfigValidation {
  pattern?: string | null;
  mimes?: string | null;
  min?: string | null;
  max?: string | null;
}

export interface FieldConfigCondition {
  key: string;
  op: "eq" | "neq" | "in" | "contains";
  value: string;
}

export interface UserRequestCategoryFieldConfig {
  placeholder?: string | null;
  help_text?: string | null;
  validation?: FieldConfigValidation | null;
  required_if?: FieldConfigCondition | null;
  show_if?: FieldConfigCondition | null;
}

export interface UserRequestCategoryFieldOption {
  label: string;
  value: string;
}

export interface UserRequestCategoryFieldPayload {
  key: string;
  label: string;
  type: UserRequestCategoryFieldType;
  required?: boolean;
  options?: UserRequestCategoryFieldOption[] | null;
  config?: UserRequestCategoryFieldConfig | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UserRequestCategoryField
  extends UserRequestCategoryFieldPayload {
  id: number;
  [key: string]: unknown;
}

export const getUserRequestCategoryFields = async (
  categoryId: number
): Promise<UserRequestCategoryField[]> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<UserRequestCategoryField[]>
    >(`${PREFIX}/user-request-categories/${categoryId}/fields`);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch category fields");
  }
};

export const createUserRequestCategoryField = async (
  categoryId: number,
  data: UserRequestCategoryFieldPayload
): Promise<UserRequestCategoryField> => {
  try {
    const response = await axiosInstance.post<
      ApiResponse<UserRequestCategoryField>
    >(`${PREFIX}/user-request-categories/${categoryId}/fields`, data);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create category field");
  }
};

export const updateUserRequestCategoryField = async (
  categoryId: number,
  fieldId: number,
  data: Partial<UserRequestCategoryFieldPayload>
): Promise<UserRequestCategoryField> => {
  try {
    const response = await axiosInstance.put<
      ApiResponse<UserRequestCategoryField>
    >(
      `${PREFIX}/user-request-categories/${categoryId}/fields/${fieldId}`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update category field");
  }
};

export const deleteUserRequestCategoryField = async (
  categoryId: number,
  fieldId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `${PREFIX}/user-request-categories/${categoryId}/fields/${fieldId}`
    );
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete category field");
  }
};

export interface FieldsReorderItem {
  id: number;
  sort_order: number;
}

export const reorderUserRequestCategoryFields = async (
  categoryId: number,
  fields: FieldsReorderItem[]
): Promise<void> => {
  try {
    await axiosInstance.put(
      `${PREFIX}/user-request-categories/${categoryId}/fields-reorder`,
      { fields }
    );
  } catch (error: unknown) {
    handleApiError(error, "Failed to reorder category fields");
  }
};

// --- User Requests ---

export interface UserRequestAttachment {
  id: number;
  field_key: string | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string | null;
}

export interface UserRequestEvent {
  id: number;
  event_type: string;
  comment: string | null;
  created_at: string | null;
}

export interface UserRequest {
  id: number;
  tenant_id: string | null;
  user_request_category_id: number | null;
  user_id: string;
  status: string;
  subject: string | null;
  reason: string | null;
  dynamic_fields: Record<string, unknown> | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  attachments: UserRequestAttachment[];
  events: UserRequestEvent[];
  [key: string]: unknown;
}

export interface UserRequestCreatePayload {
  tenant_id?: string | null;
  user_request_category_id: number;
  user_id?: string;
  subject: string;
  reason?: string | null;
  /** Start date (YYYY-MM-DD) */
  start_date?: string | null;
  /** End date (YYYY-MM-DD, must be >= start_date) */
  end_date?: string | null;
  dynamic_fields?: Record<string, unknown>;
  comment?: string | null;
}

export interface UserRequestUpdatePayload {
  status?: string | null;
  subject?: string | null;
  reason?: string | null;
  dynamic_fields?: Record<string, unknown> | null;
  comment?: string | null;
}

export const getUserRequests = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{ data: UserRequest[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserRequest[]>>(
      `${PREFIX}/user-requests`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user requests");
  }
};

export type UserRequestCreateInput =
  | FormData
  | (UserRequestCreatePayload & {
      dynamic_files?: Record<string, File | File[]>;
      files?: File[];
    });

export const createUserRequest = async (
  data: UserRequestCreateInput
): Promise<UserRequest> => {
  try {
    const body =
      data instanceof FormData ? data : buildUserRequestFormData(data);
    const response = await axiosInstance.post<ApiResponse<UserRequest>>(
      `${PREFIX}/user-requests`,
      body
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create user request");
  }
};

function buildUserRequestFormData(
  payload: UserRequestCreatePayload & {
    dynamic_files?: Record<string, File | File[]>;
    files?: File[];
  }
): FormData {
  const form = new FormData();
  if (payload.tenant_id != null && payload.tenant_id !== "")
    form.append("tenant_id", payload.tenant_id);
  form.append("user_request_category_id", String(payload.user_request_category_id));
  if (payload.user_id) form.append("user_id", payload.user_id);
  form.append("subject", payload.subject);
  if (payload.reason != null) form.append("reason", payload.reason);
  if (payload.start_date != null && payload.start_date !== "")
    form.append("start_date", payload.start_date);
  if (payload.end_date != null && payload.end_date !== "")
    form.append("end_date", payload.end_date);
  if (payload.dynamic_fields)
    form.append(
      "dynamic_fields",
      typeof payload.dynamic_fields === "string"
        ? payload.dynamic_fields
        : JSON.stringify(payload.dynamic_fields)
    );
  if (payload.comment != null) form.append("comment", payload.comment);
  if (payload.dynamic_files) {
    Object.entries(payload.dynamic_files).forEach(([key, fileOrFiles]) => {
      const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      files.forEach((f) => form.append(`dynamic_files[${key}]`, f));
    });
  }
  if (payload.files?.length) {
    payload.files.forEach((f) => form.append("files[]", f));
  }
  return form;
}

export const getUserRequest = async (id: number): Promise<UserRequest> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserRequest>>(
      `${PREFIX}/user-requests/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user request");
  }
};

export const getUserRequestApprovalInfo = async (
  id: number
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/user-requests/${id}/approval-info`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch user request approval info");
  }
};

export type UserRequestUpdateInput =
  | FormData
  | (UserRequestUpdatePayload & {
      dynamic_files?: Record<string, File | File[]>;
      files?: File[];
    });

export const updateUserRequest = async (
  id: number,
  data: UserRequestUpdateInput
): Promise<UserRequest> => {
  try {
    const body =
      data instanceof FormData
        ? (() => {
            const fd = new FormData();
            fd.append("_method", "PUT");
            data.forEach((value, key) => {
              fd.append(key, value as string | Blob);
            });
            return fd;
          })()
        : buildUserRequestUpdateFormData(id, data);
    const response = await axiosInstance.post<ApiResponse<UserRequest>>(
      `${PREFIX}/user-requests/${id}`,
      body
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update user request");
  }
};

export const approveUserRequest = async (
  id: number,
  payload?: {
    extension_number?: string | null;
    notes?: string | null;
    timezone?: string | null;
  }
): Promise<UserRequest> => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserRequest>>(
      `${PREFIX}/user-requests/${id}/approve`,
      payload ?? {}
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to approve user request");
  }
};

export const rejectUserRequest = async (
  id: number,
  payload?: {
    extension_number?: string | null;
    notes?: string | null;
    timezone?: string | null;
  }
): Promise<UserRequest> => {
  try {
    const response = await axiosInstance.post<ApiResponse<UserRequest>>(
      `${PREFIX}/user-requests/${id}/reject`,
      payload ?? {}
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to reject user request");
  }
};

function buildUserRequestUpdateFormData(
  _id: number,
  payload: UserRequestUpdatePayload & {
    dynamic_files?: Record<string, File | File[]>;
    files?: File[];
  }
): FormData {
  const form = new FormData();
  form.append("_method", "PUT");
  if (payload.status != null) form.append("status", payload.status);
  if (payload.subject != null) form.append("subject", payload.subject);
  if (payload.reason != null) form.append("reason", payload.reason);
  if (payload.dynamic_fields !== undefined) {
    if (payload.dynamic_fields === null) {
      form.append("dynamic_fields", "");
    } else if (typeof payload.dynamic_fields === "string") {
      form.append("dynamic_fields", payload.dynamic_fields);
    } else {
      form.append("dynamic_fields", JSON.stringify(payload.dynamic_fields));
    }
  }
  if (payload.comment != null) form.append("comment", payload.comment);
  if (payload.dynamic_files) {
    Object.entries(payload.dynamic_files).forEach(([key, fileOrFiles]) => {
      const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      files.forEach((f) => form.append(`dynamic_files[${key}]`, f));
    });
  }
  if (payload.files?.length) {
    payload.files.forEach((f) => form.append("files[]", f));
  }
  return form;
}

export const deleteUserRequest = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/user-requests/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete user request");
  }
};

export const downloadUserRequestAttachment = async (
  attachmentId: number
): Promise<Blob> => {
  try {
    const response = await axiosInstance.get<Blob>(
      `${PREFIX}/user-requests/attachments/${attachmentId}/download`,
      { responseType: "blob" }
    );
    return response.data;
  } catch (error: unknown) {
    handleApiError(error, "Failed to download attachment");
  }
};

// --- Locations ---

export interface LocationPayload {
  tenant_id?: string | null;
  user_profile_id?: number | null;
  name?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  address?: string;
  [key: string]: unknown;
}

export interface Location extends LocationPayload {
  id: number;
}

export const getLocations = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{ data: Location[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Location[]>>(
      `${PREFIX}/locations`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch locations");
  }
};

export const createLocation = async (
  data: LocationPayload
): Promise<Location> => {
  try {
    const response = await axiosInstance.post<ApiResponse<Location>>(
      `${PREFIX}/locations`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create location");
  }
};

export const getLocation = async (id: number): Promise<Location> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Location>>(
      `${PREFIX}/locations/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch location");
  }
};

export const updateLocation = async (
  id: number,
  data: Partial<LocationPayload>
): Promise<Location> => {
  try {
    const response = await axiosInstance.put<ApiResponse<Location>>(
      `${PREFIX}/locations/${id}`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update location");
  }
};

export const deleteLocation = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/locations/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete location");
  }
};

// --- Attendance ---

export interface AttendanceCheckInPayload {
  tenant_id?: string | null;
  user_id?: string;
  work_date?: string; // YYYY-MM-DD
  meta?: Record<string, unknown>;
}

export interface AttendanceRecord {
  id: number;
  tenant_id: string | null;
  user_id: string;
  work_date: string;
  check_in_at: string;
  check_out_at: string | null;
  meta?: Record<string, unknown>;
}

export interface AttendanceStatusData {
  user_id: string;
  tenant_id: string | null;
  work_date: string;
  is_checked_in: boolean;
  attendance: AttendanceRecord | null;
}

export const getAttendance = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{ data: AttendanceRecord[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<AttendanceRecord[]>>(
      `${PREFIX}/attendance`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch attendance");
  }
};

export const getAttendanceStatus = async (): Promise<AttendanceStatusData> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<AttendanceStatusData>
    >(`${PREFIX}/attendance/status`);
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch attendance status");
  }
};

export const attendanceCheckIn = async (
  data: AttendanceCheckInPayload = {}
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/check-in`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to check in");
  }
};

export const attendanceCheckOut = async (
  data: AttendanceCheckInPayload = {}
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/check-out`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to check out");
  }
};

export const deleteAttendance = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/attendance/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete attendance record");
  }
};

// --- Analytics ---

export const getEmployeeManagementHome = async (): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-management-home`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch employee management home");
  }
};

/** Params sent to employee dashboard APIs (counters + graphs). */
export interface EmployeeDashboardParams {
  days?: string;
  period_type?: "monthly" | "date" | "range";
  date?: string;
  start_date?: string;
  end_date?: string;
}

export const getEmployeeDashboardCounters = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/counters`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch employee dashboard counters");
  }
};

export const getEmployeeDashboardGraphDepartmentHeadcount = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/graphs/department-headcount`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch department headcount graph");
  }
};

export const getEmployeeDashboardGraphApprovalsAging = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/graphs/approvals-aging`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch approvals aging graph");
  }
};

export const getEmployeeDashboardGraphJourneyStatus = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/graphs/journey-status`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch journey status graph");
  }
};

export const getEmployeeDashboardGraphAttendanceTrend = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/graphs/attendance-trend`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch attendance trend graph");
  }
};

export const getEmployeeDashboardLeaveCalendar = async (
  params?: EmployeeDashboardParams
): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/analytics/employee-dashboard/leave-calendar`,
      { params: params ?? {} }
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch leave calendar");
  }
};

// --- Journeys ---

export const getJourneys = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{ data: unknown[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/journeys`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch journeys");
  }
};

export const createJourney = async (data: Record<string, unknown>): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/journeys`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create journey");
  }
};

export const getJourney = async (id: number): Promise<unknown> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/journeys/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch journey");
  }
};

export const updateJourney = async (
  id: number,
  data: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `${PREFIX}/journeys/${id}`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update journey");
  }
};

export const deleteJourney = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/journeys/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete journey");
  }
};

export const createJourneyStep = async (
  id: number,
  data: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/journeys/${id}/steps`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create journey step");
  }
};

export const updateJourneyStep = async (
  id: number,
  stepId: number,
  data: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axiosInstance.put<ApiResponse<unknown>>(
      `${PREFIX}/journeys/${id}/steps/${stepId}`,
      data
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update journey step");
  }
};

export const deleteJourneyStep = async (
  id: number,
  stepId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/journeys/${id}/steps/${stepId}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete journey step");
  }
};

// --- Main App lookups ---

export const getMainAppCompanies = async (): Promise<unknown[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/main-app/companies`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch companies");
  }
};

export const getMainAppDepartments = async (
  companyUuid: string
): Promise<unknown[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/main-app/${companyUuid}/departments`
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch departments");
  }
};

export const getMainAppUsers = async (
  companyUuid: string,
  params?: { department_id?: number }
): Promise<unknown[]> => {
  try {
   const users = await GetMinifiedUsers({ department_id: params?.department_id,status: 'Active' });
   return users ?? [];
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch users");
    return [];
  }
};

// --- Companies (prefix: companies) ---

const COMPANIES_PREFIX = "/companies";

export const postCompanyImage = async (
  companyId: string,
  image: File
): Promise<unknown> => {
  try {
    const form = new FormData();
    form.append("image", image);
    form.append("company_id", companyId);
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${COMPANIES_PREFIX}/image`,
      form
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to upload company image");
  }
};

export const getCompanyImage = async (
  companyId: string
): Promise<Blob | null> => {
  try {
    const response = await axiosInstance.get<Blob>(`${COMPANIES_PREFIX}/image`, {
      params: { company_id: companyId },
      responseType: "blob",
    });
    return response.data;
  } catch {
    return null;
  }
};

export const deleteCompanyImage = async (companyId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`${COMPANIES_PREFIX}/image`, {
      params: { company_id: companyId },
    });
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete company image");
  }
};



