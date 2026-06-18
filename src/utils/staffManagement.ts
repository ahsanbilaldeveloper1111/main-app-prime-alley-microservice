import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { GetMinifiedUsers } from "./users";
import { getHttpApiErrorDetail } from "./errors";

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
  toast.error(getHttpApiErrorDetail(error, fallbackMessage));
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
  meta?: {
    device?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: unknown;
  };
}

export interface AttendanceBreakStartPayload extends AttendanceCheckInPayload {
  break_type_id: number;
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
  is_on_break?: boolean;
  is_on_overtime?: boolean;
  attendance: AttendanceRecord | null;
}

export const MY_ATTENDANCE_ACTIONS = [
  "check_in",
  "check_out",
  "start_break",
  "end_break",
  "start_overtime",
  "end_overtime",
] as const;

export type MyAttendanceAction = (typeof MY_ATTENDANCE_ACTIONS)[number];

export interface MyAttendanceRecord {
  id: number;
  status?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
}

export interface MyAttendanceData {
  user_id: string;
  tenant_id: string | null;
  work_date: string;
  state: string;
  banner: string | null;
  is_checked_in: boolean;
  attendance: MyAttendanceRecord | null;
  actions: MyAttendanceAction[];
}

function parseMyAttendanceActions(raw: unknown): MyAttendanceAction[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const allowed = new Set<string>(MY_ATTENDANCE_ACTIONS);
  const actions: MyAttendanceAction[] = [];
  for (const item of raw) {
    const slug = String(item).trim();
    if (allowed.has(slug)) {
      actions.push(slug as MyAttendanceAction);
    }
  }
  return actions;
}

function readStaffManagementString(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function buildOptionalNumericIdField(id: number | null): { id: number } | Record<string, never> {
  if (typeof id === "number" && Number.isFinite(id)) {
    return { id };
  }
  return {};
}

function readAttendancePolicyBooleanField(primary: unknown, alternate: unknown): boolean | null {
  if (typeof primary === "boolean") {
    return primary;
  }
  if (typeof alternate === "boolean") {
    return alternate;
  }
  return null;
}

function readMyAttendanceString(value: unknown): string | null {
  return readStaffManagementString(value);
}

function normalizeMyAttendanceRecord(raw: unknown): MyAttendanceRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    status: readMyAttendanceString(row.status),
    check_in_at: readMyAttendanceString(row.check_in_at ?? row.checkInAt),
    check_out_at: readMyAttendanceString(row.check_out_at ?? row.checkOutAt),
  };
}

export function normalizeMyAttendanceData(raw: unknown): MyAttendanceData {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const attendanceRaw = row.attendance ?? row.attendanceRecord;
  const isCheckedIn = row.is_checked_in === true || row.isCheckedIn === true;

  return {
    user_id: readMyAttendanceString(row.user_id ?? row.userId) ?? "",
    tenant_id: readMyAttendanceString(row.tenant_id ?? row.tenantId),
    work_date: readMyAttendanceString(row.work_date ?? row.workDate) ?? "",
    state: readMyAttendanceString(row.state) ?? "",
    banner: readMyAttendanceString(row.banner),
    is_checked_in: isCheckedIn,
    attendance: normalizeMyAttendanceRecord(attendanceRaw),
    actions: parseMyAttendanceActions(row.actions),
  };
}

export const getAttendance = async (
  params?: {
    page?: number;
    limit?: number;
    [key: string]: unknown;
  },
  options?: { silent?: boolean }
): Promise<{ data: AttendanceRecord[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<AttendanceRecord[]>>(
      `${PREFIX}/attendance`,
      { params }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    if (options?.silent === true) {
      console.warn("[getAttendance] request failed (silent)", error);
      return { data: [] };
    }
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

export const getMyAttendance = async (): Promise<MyAttendanceData> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown>>(
      `${PREFIX}/attendance/my`,
    );
    return normalizeMyAttendanceData(extractData(response));
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch your attendance session");
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

export const attendanceBreakStart = async (
  data: AttendanceBreakStartPayload,
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/break/start`,
      data,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to start break");
  }
};

export const attendanceBreakEnd = async (
  data: AttendanceCheckInPayload = {},
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/break/end`,
      data,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to end break");
  }
};

export const attendanceOvertimeStart = async (
  data: AttendanceCheckInPayload = {},
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/overtime/start`,
      data,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to start overtime");
  }
};

export const ATTENDANCE_CORRECTION_STATUS_VALUES = [
  "present",
  "absent",
  "late",
  "on_break",
  "overtime",
  "on_leave",
  "no_show",
] as const;

export type AttendanceCorrectionStatus =
  (typeof ATTENDANCE_CORRECTION_STATUS_VALUES)[number];

export interface AttendanceCorrectionPayload {
  tenant_id: string;
  user_id: string;
  work_date: string;
  reason: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
  status: AttendanceCorrectionStatus;
  late_minutes?: number | null;
  total_minutes?: number | null;
}

export const createAttendanceCorrection = async (
  data: AttendanceCorrectionPayload,
): Promise<unknown> => {
  try {
    const response = await axiosInstance.post<ApiResponse<unknown>>(
      `${PREFIX}/attendance/corrections`,
      data,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to submit attendance correction");
  }
};

export const deleteAttendance = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/attendance/${id}`);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete attendance record");
  }
};

// --- Attendance reports ---

const ATTENDANCE_REPORT_LIST_KEYS = [
  "data",
  "items",
  "records",
  "rows",
  "list",
  "results",
  "result",
  "content",
  "collection",
  "report",
  "reports",
  "employees",
  "entries",
] as const;

function isAttendanceReportRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isAttendanceReportRow(record: Record<string, unknown>): boolean {
  return (
    "user_id" in record ||
    "userId" in record ||
    "extension" in record ||
    "employee_name" in record ||
    "employeeName" in record ||
    "user_name" in record ||
    "userName" in record ||
    "check_in_at" in record ||
    "checkInAt" in record ||
    "status" in record ||
    "present_days" in record ||
    "presentDays" in record ||
    "absent_days" in record ||
    "absentDays" in record ||
    "month" in record
  );
}

function isAttendanceReportRowArray(rows: unknown[]): boolean {
  return rows.some((row) => isAttendanceReportRecord(row));
}

function unwrapAttendanceReportListPayload(payload: unknown, depth = 0): unknown[] {
  if (payload == null || depth > 4) {
    return [];
  }
  if (Array.isArray(payload)) {
    return isAttendanceReportRowArray(payload)
      ? payload.filter((row) => isAttendanceReportRecord(row))
      : [];
  }
  if (!isAttendanceReportRecord(payload)) {
    return [];
  }

  for (const key of ATTENDANCE_REPORT_LIST_KEYS) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && isAttendanceReportRowArray(candidate)) {
      return candidate.filter((row) => isAttendanceReportRecord(row));
    }
    const nested = unwrapAttendanceReportListPayload(candidate, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  if (isAttendanceReportRow(payload)) {
    return [payload];
  }

  for (const value of Object.values(payload)) {
    const nested = unwrapAttendanceReportListPayload(value, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function extractAttendanceReportListResponse(
  response: { status: number; data: unknown },
): { rows: unknown[]; pagination?: ApiPagination } {
  if (response.status === 404) {
    return { rows: [], pagination: undefined };
  }

  const root = response.data;
  if (root == null) {
    return { rows: [], pagination: undefined };
  }

  if (Array.isArray(root)) {
    return {
      rows: isAttendanceReportRowArray(root)
        ? root.filter((row) => isAttendanceReportRecord(row))
        : [],
      pagination: undefined,
    };
  }

  if (!isAttendanceReportRecord(root)) {
    return { rows: [], pagination: undefined };
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;

  if (!isStaffApiSuccess(body.success)) {
    throw new Error(
      typeof body.message === "string" ? body.message : "API request failed",
    );
  }

  if (Array.isArray(body.data)) {
    const rows = isAttendanceReportRowArray(body.data)
      ? body.data.filter((row) => isAttendanceReportRecord(row))
      : body.data;
    return {
      rows,
      pagination: readAttendancePolicyPagination(body),
    };
  }

  let rows = unwrapAttendanceReportListPayload(body.data);
  if (rows.length === 0) {
    rows = unwrapAttendanceReportListPayload(body);
  }

  return {
    rows,
    pagination: readAttendancePolicyPagination(body) ?? readAttendancePolicyPagination(body.data),
  };
}

export interface DailyAttendanceReportRow {
  id?: number;
  tenant_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  shift_id?: number | null;
  shift_name?: string | null;
  work_date?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  worked_minutes?: number | null;
  worked_hours?: number | null;
  status?: string | null;
  late_minutes?: number | null;
  [key: string]: unknown;
}

export interface GetDailyAttendanceReportParams {
  tenant_id: string;
  date: string;
  department_id?: number;
  extensions?: readonly string[];
}

function normalizeDailyAttendanceReportRow(raw: unknown): DailyAttendanceReportRow {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    user_id: readAttendancePolicyString(
      row.user_id ?? row.userId ?? row.extension ?? row.extension_number ?? row.extensionNumber,
    ),
    user_name: readAttendancePolicyString(
      row.user_name ?? row.userName ?? row.employee_name ?? row.employeeName ?? row.name,
    ),
    department_id: readAttendancePolicyNumber(row.department_id ?? row.departmentId),
    department_name: readAttendancePolicyString(row.department_name ?? row.departmentName),
    shift_id: readAttendancePolicyNumber(row.shift_id ?? row.shiftId),
    shift_name: readAttendancePolicyString(row.shift_name ?? row.shiftName),
    work_date: readAttendancePolicyString(row.work_date ?? row.workDate ?? row.date),
    check_in_at: readAttendancePolicyString(row.check_in_at ?? row.checkInAt),
    check_out_at: readAttendancePolicyString(row.check_out_at ?? row.checkOutAt),
    worked_minutes: readAttendancePolicyNumber(
      row.worked_minutes ?? row.workedMinutes ?? row.total_minutes ?? row.totalMinutes,
    ),
    worked_hours: readAttendancePolicyNumber(
      row.worked_hours ?? row.workedHours ?? row.total_hours ?? row.totalHours,
    ),
    status: readAttendancePolicyString(row.status ?? row.attendance_status ?? row.attendanceStatus),
    late_minutes: readAttendancePolicyNumber(row.late_minutes ?? row.lateMinutes),
  };
}

export const getDailyAttendanceReport = async (
  params: GetDailyAttendanceReportParams,
): Promise<{ data: DailyAttendanceReportRow[]; pagination?: ApiPagination }> => {
  try {
    const requestParams: Record<string, string | number> = {
      tenant_id: params.tenant_id,
      date: params.date,
    };

    if (params.department_id != null && Number.isFinite(params.department_id)) {
      requestParams.department_id = params.department_id;
    }

    const extensions = (params.extensions ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
    if (extensions.length > 0) {
      requestParams.extensions = extensions.join(",");
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance/reports/daily`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    const { rows, pagination } = extractAttendanceReportListResponse(response);
    return {
      data: rows.map((row) => normalizeDailyAttendanceReportRow(row)),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch daily attendance report");
  }
};

export const TEAM_ATTENDANCE_SNAPSHOT_STATUS_FILTERS = [
  "all",
  "present",
  "absent",
  "late",
  "on_break",
  "overtime",
  "on_leave",
  "no_show",
] as const;

export type TeamAttendanceSnapshotStatusFilter =
  (typeof TEAM_ATTENDANCE_SNAPSHOT_STATUS_FILTERS)[number];

export interface TeamAttendanceSnapshotSummary {
  present?: number | null;
  absent?: number | null;
  late?: number | null;
  on_overtime?: number | null;
  on_break?: number | null;
  on_leave?: number | null;
  no_show?: number | null;
  total?: number | null;
}

export interface TeamAttendanceSnapshotAttendance {
  id?: number | null;
  status?: string | null;
}

export interface TeamAttendanceSnapshotEmployee {
  user_id?: string | null;
  user_name?: string | null;
  employee_code?: string | null;
  designation?: string | null;
  department_id?: number | null;
  status?: string | null;
  banner?: string | null;
  attendance?: TeamAttendanceSnapshotAttendance | null;
  hours_worked_minutes?: number | null;
}

export interface TeamAttendanceSnapshotResult {
  date: string | null;
  summary: TeamAttendanceSnapshotSummary;
  employees: TeamAttendanceSnapshotEmployee[];
}

export interface GetTeamAttendanceSnapshotParams {
  tenant_id: string;
  manager_id?: string;
  date?: string;
  extensions?: readonly string[];
  status?: TeamAttendanceSnapshotStatusFilter;
  search?: string;
  department_id?: number;
}

const EMPTY_TEAM_ATTENDANCE_SNAPSHOT: TeamAttendanceSnapshotResult = {
  date: null,
  summary: {},
  employees: [],
};

function normalizeTeamAttendanceSnapshotSummary(raw: unknown): TeamAttendanceSnapshotSummary {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const summary = raw as Record<string, unknown>;
  return {
    present: readAttendancePolicyNumber(summary.present),
    absent: readAttendancePolicyNumber(summary.absent),
    late: readAttendancePolicyNumber(summary.late),
    on_overtime: readAttendancePolicyNumber(
      summary.on_overtime ?? summary.onOvertime ?? summary.overtime,
    ),
    on_break: readAttendancePolicyNumber(summary.on_break ?? summary.onBreak),
    on_leave: readAttendancePolicyNumber(summary.on_leave ?? summary.onLeave),
    no_show: readAttendancePolicyNumber(summary.no_show ?? summary.noShow),
    total: readAttendancePolicyNumber(summary.total),
  };
}

function normalizeTeamAttendanceSnapshotAttendance(
  raw: unknown,
): TeamAttendanceSnapshotAttendance | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const attendance = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(attendance.id);
  const status = readAttendancePolicyString(attendance.status);

  if (id == null && !status) {
    return null;
  }

  return {
    ...(buildOptionalNumericIdField(id)),
    status,
  };
}

function normalizeTeamAttendanceSnapshotEmployee(
  raw: unknown,
): TeamAttendanceSnapshotEmployee {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const employee = raw as Record<string, unknown>;

  return {
    user_id: readAttendancePolicyString(
      employee.user_id ?? employee.userId ?? employee.extension ?? employee.extension_number,
    ),
    user_name: readAttendancePolicyString(
      employee.user_name ??
        employee.userName ??
        employee.employee_name ??
        employee.employeeName ??
        employee.name,
    ),
    employee_code: readAttendancePolicyString(
      employee.employee_code ?? employee.employeeCode ?? employee.code,
    ),
    designation: readAttendancePolicyString(employee.designation ?? employee.title),
    department_id: readAttendancePolicyNumber(employee.department_id ?? employee.departmentId),
    status: readAttendancePolicyString(employee.status),
    banner: readAttendancePolicyString(employee.banner),
    attendance: normalizeTeamAttendanceSnapshotAttendance(employee.attendance),
    hours_worked_minutes: readAttendancePolicyNumber(
      employee.hours_worked_minutes ??
        employee.hoursWorkedMinutes ??
        employee.worked_minutes ??
        employee.workedMinutes,
    ),
  };
}

function extractTeamAttendanceSnapshotResponse(
  response: { status: number; data: unknown },
): TeamAttendanceSnapshotResult {
  if (response.status === 404) {
    return EMPTY_TEAM_ATTENDANCE_SNAPSHOT;
  }

  const root = response.data;
  if (root == null || typeof root !== "object") {
    return EMPTY_TEAM_ATTENDANCE_SNAPSHOT;
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;
  if (!isStaffApiSuccess(body.success)) {
    throw new Error(typeof body.message === "string" ? body.message : "API request failed");
  }

  const payload = body.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return EMPTY_TEAM_ATTENDANCE_SNAPSHOT;
  }

  const data = payload as Record<string, unknown>;
  const employeesRaw = data.employees;

  return {
    date: readAttendancePolicyString(data.date),
    summary: normalizeTeamAttendanceSnapshotSummary(data.summary),
    employees: Array.isArray(employeesRaw)
      ? employeesRaw.map((row) => normalizeTeamAttendanceSnapshotEmployee(row))
      : [],
  };
}

export const getTeamAttendanceSnapshot = async (
  params: GetTeamAttendanceSnapshotParams,
): Promise<TeamAttendanceSnapshotResult> => {
  try {
    const tenantId = params.tenant_id.trim();
    const requestParams: Record<string, string | number> = {
      tenant_id: tenantId,
    };

    const managerId = params.manager_id?.trim();
    if (managerId) {
      requestParams.manager_id = managerId;
    }

    const date = params.date?.trim();
    if (date) {
      requestParams.date = date;
    }

    if (params.department_id != null && Number.isFinite(params.department_id)) {
      requestParams.department_id = params.department_id;
    }

    const search = params.search?.trim();
    if (search) {
      requestParams.search = search;
    }

    if (params.status && params.status !== "all") {
      requestParams.status = params.status;
    }

    const extensions = (params.extensions ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
    if (extensions.length > 0) {
      requestParams.extensions = extensions.join(",");
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance/team/snapshot`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    return extractTeamAttendanceSnapshotResponse(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch team attendance snapshot");
  }
};

export interface MonthlyAttendanceReportRow {
  id?: number;
  tenant_id?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  month?: string | null;
  attendance_rate?: number | null;
  present_days?: number | null;
  absent_days?: number | null;
  leave_days?: number | null;
  worked_minutes?: number | null;
  worked_hours?: number | null;
  late_days?: number | null;
  late_arrivals?: number | null;
  late_minutes?: number | null;
  overtime_hours?: number | null;
  overtime_minutes?: number | null;
  [key: string]: unknown;
}

export interface MonthlyAttendanceReportSummary {
  average_attendance_rate?: number | null;
  total_late_arrivals?: number | null;
  total_absent_days?: number | null;
  total_overtime_hours?: number | null;
}

export interface MonthlyAttendanceReportTrendPoint {
  date?: string | null;
  label?: string | null;
  attendance_rate?: number | null;
  present_count?: number | null;
  absent_count?: number | null;
  late_arrivals?: number | null;
  [key: string]: unknown;
}

export interface MonthlyAttendanceReportResult {
  month: string | null;
  summary: MonthlyAttendanceReportSummary;
  employees: MonthlyAttendanceReportRow[];
  trend: MonthlyAttendanceReportTrendPoint[];
}

export interface GetMonthlyAttendanceReportParams {
  tenant_id: string;
  month: string;
  department_id?: number;
}

const EMPTY_MONTHLY_ATTENDANCE_REPORT: MonthlyAttendanceReportResult = {
  month: null,
  summary: {},
  employees: [],
  trend: [],
};

function normalizeMonthlyAttendanceReportSummary(raw: unknown): MonthlyAttendanceReportSummary {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const summary = raw as Record<string, unknown>;
  return {
    average_attendance_rate: readAttendancePolicyNumber(
      summary.average_attendance_rate ?? summary.averageAttendanceRate,
    ),
    total_late_arrivals: readAttendancePolicyNumber(
      summary.total_late_arrivals ?? summary.totalLateArrivals,
    ),
    total_absent_days: readAttendancePolicyNumber(
      summary.total_absent_days ?? summary.totalAbsentDays,
    ),
    total_overtime_hours: readAttendancePolicyNumber(
      summary.total_overtime_hours ?? summary.totalOvertimeHours,
    ),
  };
}

function normalizeMonthlyAttendanceTrendPoint(raw: unknown): MonthlyAttendanceReportTrendPoint {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const point = raw as Record<string, unknown>;
  return {
    date: readAttendancePolicyString(point.date ?? point.day ?? point.report_date ?? point.reportDate),
    label: readAttendancePolicyString(point.label ?? point.name),
    attendance_rate: readAttendancePolicyNumber(point.attendance_rate ?? point.attendanceRate),
    present_count: readAttendancePolicyNumber(
      point.present_count ?? point.presentCount ?? point.present ?? point.present_days ?? point.presentDays,
    ),
    absent_count: readAttendancePolicyNumber(
      point.absent_count ?? point.absentCount ?? point.absent ?? point.absent_days ?? point.absentDays,
    ),
    late_arrivals: readAttendancePolicyNumber(
      point.late_arrivals ?? point.lateArrivals ?? point.late_count ?? point.lateCount,
    ),
  };
}

function extractMonthlyAttendanceReportResponse(
  response: { status: number; data: unknown },
): MonthlyAttendanceReportResult {
  if (response.status === 404) {
    return EMPTY_MONTHLY_ATTENDANCE_REPORT;
  }

  const root = response.data;
  if (root == null || typeof root !== "object") {
    return EMPTY_MONTHLY_ATTENDANCE_REPORT;
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;
  if (!isStaffApiSuccess(body.success)) {
    throw new Error(
      typeof body.message === "string" ? body.message : "API request failed",
    );
  }

  const payload = body.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return EMPTY_MONTHLY_ATTENDANCE_REPORT;
  }

  const data = payload as Record<string, unknown>;
  const employeesRaw = data.employees;
  const trendRaw = data.trend;

  return {
    month: readAttendancePolicyString(data.month),
    summary: normalizeMonthlyAttendanceReportSummary(data.summary),
    employees: Array.isArray(employeesRaw)
      ? employeesRaw.map((row) => normalizeMonthlyAttendanceReportRow(row))
      : [],
    trend: Array.isArray(trendRaw)
      ? trendRaw.map((row) => normalizeMonthlyAttendanceTrendPoint(row))
      : [],
  };
}

function normalizeMonthlyAttendanceReportRow(raw: unknown): MonthlyAttendanceReportRow {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    user_id: readAttendancePolicyString(
      row.user_id ?? row.userId ?? row.extension ?? row.extension_number ?? row.extensionNumber,
    ),
    user_name: readAttendancePolicyString(
      row.user_name ?? row.userName ?? row.employee_name ?? row.employeeName ?? row.name,
    ),
    department_id: readAttendancePolicyNumber(row.department_id ?? row.departmentId),
    department_name: readAttendancePolicyString(row.department_name ?? row.departmentName),
    month: readAttendancePolicyString(row.month ?? row.report_month ?? row.reportMonth),
    attendance_rate: readAttendancePolicyNumber(row.attendance_rate ?? row.attendanceRate),
    present_days: readAttendancePolicyNumber(
      row.present_days ?? row.presentDays ?? row.days_present ?? row.daysPresent,
    ),
    absent_days: readAttendancePolicyNumber(
      row.absent_days ?? row.absentDays ?? row.days_absent ?? row.daysAbsent,
    ),
    leave_days: readAttendancePolicyNumber(
      row.leave_days ?? row.leaveDays ?? row.days_on_leave ?? row.daysOnLeave,
    ),
    worked_minutes: readAttendancePolicyNumber(
      row.worked_minutes ??
        row.workedMinutes ??
        row.total_minutes ??
        row.totalMinutes ??
        row.total_worked_minutes ??
        row.totalWorkedMinutes,
    ),
    worked_hours: readAttendancePolicyNumber(
      row.worked_hours ??
        row.workedHours ??
        row.total_hours ??
        row.totalHours ??
        row.total_worked_hours ??
        row.totalWorkedHours,
    ),
    late_days: readAttendancePolicyNumber(
      row.late_days ?? row.lateDays ?? row.days_late ?? row.daysLate,
    ),
    late_arrivals: readAttendancePolicyNumber(
      row.late_arrivals ?? row.lateArrivals ?? row.total_late_arrivals ?? row.totalLateArrivals,
    ),
    late_minutes: readAttendancePolicyNumber(
      row.late_minutes ?? row.lateMinutes ?? row.total_late_minutes ?? row.totalLateMinutes,
    ),
    overtime_hours: readAttendancePolicyNumber(
      row.overtime_hours ?? row.overtimeHours ?? row.total_overtime_hours ?? row.totalOvertimeHours,
    ),
    overtime_minutes: readAttendancePolicyNumber(
      row.overtime_minutes ??
        row.overtimeMinutes ??
        row.total_overtime_minutes ??
        row.totalOvertimeMinutes,
    ),
  };
}

export const getMonthlyAttendanceReport = async (
  params: GetMonthlyAttendanceReportParams,
): Promise<MonthlyAttendanceReportResult> => {
  try {
    const requestParams: Record<string, string | number> = {
      tenant_id: params.tenant_id,
      month: params.month,
    };

    if (params.department_id != null && Number.isFinite(params.department_id)) {
      requestParams.department_id = params.department_id;
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance/reports/monthly`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    return extractMonthlyAttendanceReportResponse(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch monthly attendance report");
  }
};

export interface EmployeeAttendanceReportSummary {
  working_days?: number | null;
  present_days?: number | null;
  absent_days?: number | null;
  late_count?: number | null;
  overtime_hours?: number | null;
  break_violations?: number | null;
  attendance_rate?: number | null;
}

export interface EmployeeAttendanceReportDay {
  date?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
  total_hours?: string | null;
  overtime_minutes?: number | null;
  status?: string | null;
  late_minutes?: number | null;
  is_auto_checkout?: boolean | null;
}

export interface EmployeeAttendanceReportResult {
  user_id: string | null;
  month: string | null;
  summary: EmployeeAttendanceReportSummary;
  days: EmployeeAttendanceReportDay[];
}

export interface GetEmployeeAttendanceReportParams {
  user_id: string;
  tenant_id: string;
  month: string;
}

const EMPTY_EMPLOYEE_ATTENDANCE_REPORT: EmployeeAttendanceReportResult = {
  user_id: null,
  month: null,
  summary: {},
  days: [],
};

function normalizeEmployeeAttendanceReportSummary(raw: unknown): EmployeeAttendanceReportSummary {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const summary = raw as Record<string, unknown>;
  return {
    working_days: readAttendancePolicyNumber(summary.working_days ?? summary.workingDays),
    present_days: readAttendancePolicyNumber(summary.present_days ?? summary.presentDays),
    absent_days: readAttendancePolicyNumber(summary.absent_days ?? summary.absentDays),
    late_count: readAttendancePolicyNumber(summary.late_count ?? summary.lateCount),
    overtime_hours: readAttendancePolicyNumber(summary.overtime_hours ?? summary.overtimeHours),
    break_violations: readAttendancePolicyNumber(
      summary.break_violations ?? summary.breakViolations,
    ),
    attendance_rate: readAttendancePolicyNumber(
      summary.attendance_rate ?? summary.attendanceRate,
    ),
  };
}

function normalizeEmployeeAttendanceReportDay(raw: unknown): EmployeeAttendanceReportDay {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const day = raw as Record<string, unknown>;

  return {
    date: readAttendancePolicyString(day.date ?? day.work_date ?? day.workDate),
    check_in_at: readAttendancePolicyString(day.check_in_at ?? day.checkInAt),
    check_out_at: readAttendancePolicyString(day.check_out_at ?? day.checkOutAt),
    total_hours: readAttendancePolicyString(day.total_hours ?? day.totalHours),
    overtime_minutes: readAttendancePolicyNumber(
      day.overtime_minutes ?? day.overtimeMinutes,
    ),
    status: readAttendancePolicyString(day.status ?? day.attendance_status ?? day.attendanceStatus),
    late_minutes: readAttendancePolicyNumber(day.late_minutes ?? day.lateMinutes),
    is_auto_checkout: readAttendancePolicyBoolean(
      day.is_auto_checkout ?? day.isAutoCheckout,
    ),
  };
}

function extractEmployeeAttendanceReportResponse(
  response: { status: number; data: unknown },
): EmployeeAttendanceReportResult {
  if (response.status === 404) {
    return EMPTY_EMPLOYEE_ATTENDANCE_REPORT;
  }

  const root = response.data;
  if (root == null || typeof root !== "object") {
    return EMPTY_EMPLOYEE_ATTENDANCE_REPORT;
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;
  if (!isStaffApiSuccess(body.success)) {
    throw new Error(typeof body.message === "string" ? body.message : "API request failed");
  }

  const payload = body.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return EMPTY_EMPLOYEE_ATTENDANCE_REPORT;
  }

  const data = payload as Record<string, unknown>;
  const daysRaw = data.days;

  return {
    user_id: readAttendancePolicyString(data.user_id ?? data.userId),
    month: readAttendancePolicyString(data.month),
    summary: normalizeEmployeeAttendanceReportSummary(data.summary),
    days: Array.isArray(daysRaw)
      ? daysRaw.map((row) => normalizeEmployeeAttendanceReportDay(row))
      : [],
  };
}

export const getEmployeeAttendanceReport = async (
  params: GetEmployeeAttendanceReportParams,
): Promise<EmployeeAttendanceReportResult> => {
  try {
    const userId = params.user_id.trim();
    const tenantId = params.tenant_id.trim();
    const month = params.month.trim();

    const response = await axiosInstance.get(
      `${PREFIX}/attendance/reports/employee/${encodeURIComponent(userId)}`,
      {
        params: {
          tenant_id: tenantId,
          month,
        },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      },
    );

    return extractEmployeeAttendanceReportResponse(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch employee attendance report");
  }
};

// --- Shifts ---

export interface StaffShift {
  id: number;
  tenant_id?: string | null;
  name?: string | null;
  type?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  working_days?: number[] | null;
  earliest_checkin?: string | null;
  grace_period_minutes?: number | null;
  hard_limit_hours?: number | null;
  effective_from?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateStaffShiftPayload {
  tenant_id: string;
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  working_days: number[];
  earliest_checkin?: string;
  grace_period_minutes?: number;
  hard_limit_hours?: number;
  effective_from: string;
  status: string;
}

export interface GetStaffShiftsParams {
  tenant_id: string;
  status: string;
  type?: string;
  limit?: number;
  page?: number;
}

export const getStaffShifts = async (
  params: GetStaffShiftsParams,
): Promise<{ data: StaffShift[]; pagination?: ApiPagination }> => {
  try {
    const requestParams: Record<string, string | number> = {
      tenant_id: params.tenant_id,
      status: params.status,
    };
    const type = params.type?.trim();
    if (type) requestParams.type = type;
    if (params.limit != null) requestParams.limit = params.limit;
    if (params.page != null) requestParams.page = params.page;

    const response = await axiosInstance.get<ApiResponse<StaffShift[]>>(
      `${PREFIX}/shifts`,
      { params: requestParams },
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch shifts");
  }
};

export const createStaffShift = async (
  payload: CreateStaffShiftPayload,
): Promise<StaffShift> => {
  try {
    const response = await axiosInstance.post<ApiResponse<StaffShift>>(
      `${PREFIX}/shifts`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create shift");
  }
};

export const updateStaffShift = async (
  id: number,
  payload: CreateStaffShiftPayload,
): Promise<StaffShift> => {
  try {
    const response = await axiosInstance.put<ApiResponse<StaffShift>>(
      `${PREFIX}/shifts/${id}`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update shift");
  }
};

export const deleteStaffShift = async (
  id: number,
  tenantId: string,
): Promise<void> => {
  try {
    const response = await axiosInstance.delete(`${PREFIX}/shifts/${id}`, {
      params: { tenant_id: tenantId },
    });
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete shift");
  }
};

// --- Shift assignments ---

const SHIFT_ASSIGNMENT_LIST_KEYS = [
  "data",
  "items",
  "records",
  "rows",
  "list",
  "results",
  "result",
  "content",
  "collection",
  "shift_assignments",
  "shiftAssignments",
  "assignments",
] as const;

function isShiftAssignmentRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isShiftAssignmentRow(record: Record<string, unknown>): boolean {
  return (
    "shift_id" in record ||
    "shiftId" in record ||
    "user_id" in record ||
    "userId" in record ||
    "effective_from" in record ||
    "effectiveFrom" in record
  );
}

function isShiftAssignmentRowArray(rows: unknown[]): boolean {
  return rows.some((row) => isShiftAssignmentRecord(row));
}

function unwrapShiftAssignmentListPayload(payload: unknown, depth = 0): unknown[] {
  if (payload == null || depth > 4) {
    return [];
  }
  if (Array.isArray(payload)) {
    return isShiftAssignmentRowArray(payload)
      ? payload.filter((row) => isShiftAssignmentRecord(row))
      : [];
  }
  if (!isShiftAssignmentRecord(payload)) {
    return [];
  }

  for (const key of SHIFT_ASSIGNMENT_LIST_KEYS) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && isShiftAssignmentRowArray(candidate)) {
      return candidate.filter((row) => isShiftAssignmentRecord(row));
    }
    const nested = unwrapShiftAssignmentListPayload(candidate, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  if (isShiftAssignmentRow(payload)) {
    return [payload];
  }

  for (const value of Object.values(payload)) {
    const nested = unwrapShiftAssignmentListPayload(value, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function readShiftAssignmentPagination(source: unknown): ApiPagination | undefined {
  if (!isShiftAssignmentRecord(source)) {
    return undefined;
  }

  const paginationSource = source.pagination ?? source.meta;
  if (!isShiftAssignmentRecord(paginationSource)) {
    return undefined;
  }

  const total = readAttendancePolicyNumber(
    paginationSource.total ??
      paginationSource.total_count ??
      paginationSource.totalCount,
  );
  if (total == null) {
    return undefined;
  }

  return {
    total,
    limit:
      readAttendancePolicyNumber(
        paginationSource.limit ?? paginationSource.per_page ?? paginationSource.perPage,
      ) ?? 0,
    page:
      readAttendancePolicyNumber(
        paginationSource.page ??
          paginationSource.current_page ??
          paginationSource.currentPage,
      ) ?? 1,
    last_page:
      readAttendancePolicyNumber(
        paginationSource.last_page ?? paginationSource.lastPage,
      ) ?? 1,
    from: readAttendancePolicyNumber(paginationSource.from) ?? 0,
    to: readAttendancePolicyNumber(paginationSource.to) ?? 0,
  };
}

function extractShiftAssignmentListResponse(
  response: { status: number; data: unknown },
): { rows: unknown[]; pagination?: ApiPagination } {
  if (response.status === 404) {
    return { rows: [], pagination: undefined };
  }

  const root = response.data;
  if (root == null) {
    return { rows: [], pagination: undefined };
  }

  if (Array.isArray(root)) {
    return {
      rows: isShiftAssignmentRowArray(root)
        ? root.filter((row) => isShiftAssignmentRecord(row))
        : [],
      pagination: undefined,
    };
  }

  if (!isShiftAssignmentRecord(root)) {
    return { rows: [], pagination: undefined };
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;

  if (!isStaffApiSuccess(body.success)) {
    throw new Error(
      typeof body.message === "string" ? body.message : "API request failed",
    );
  }

  if (Array.isArray(body.data)) {
    const rows = isShiftAssignmentRowArray(body.data)
      ? body.data.filter((row) => isShiftAssignmentRecord(row))
      : body.data;
    return {
      rows,
      pagination:
        readShiftAssignmentPagination(body) ??
        readShiftAssignmentPagination(body.data),
    };
  }

  if (isShiftAssignmentRecord(body.data) && isShiftAssignmentRow(body.data)) {
    return {
      rows: [body.data],
      pagination: readShiftAssignmentPagination(body),
    };
  }

  let rows = unwrapShiftAssignmentListPayload(body.data);
  if (rows.length === 0) {
    rows = unwrapShiftAssignmentListPayload(body);
  }

  return {
    rows,
    pagination:
      readShiftAssignmentPagination(body) ??
      readShiftAssignmentPagination(body.data),
  };
}

export interface StaffShiftAssignment {
  id?: number;
  tenant_id?: string | null;
  shift_id?: number | null;
  user_id?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  reason?: string | null;
  shift_name?: string | null;
  user_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateStaffShiftAssignmentPayload {
  tenant_id: string;
  shift_id: number;
  user_id: string;
  effective_from: string;
  effective_to?: string | null;
  reason: string;
}

export type UpdateStaffShiftAssignmentPayload = CreateStaffShiftAssignmentPayload;

function normalizeShiftAssignmentRow(raw: unknown): StaffShiftAssignment {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);
  const shift = isShiftAssignmentRecord(row.shift) ? row.shift : null;

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    shift_id: readAttendancePolicyNumber(
      row.shift_id ?? row.shiftId ?? shift?.id,
    ),
    user_id: readAttendancePolicyString(row.user_id ?? row.userId),
    effective_from: readAttendancePolicyString(row.effective_from ?? row.effectiveFrom),
    effective_to: readAttendancePolicyString(row.effective_to ?? row.effectiveTo),
    reason: readAttendancePolicyString(row.reason),
    shift_name: readAttendancePolicyString(
      row.shift_name ??
        row.shiftName ??
        shift?.name ??
        (typeof row.shift === "string" ? row.shift : null),
    ),
    user_name: readAttendancePolicyString(
      row.user_name ?? row.userName ?? row.employee_name ?? row.employeeName,
    ),
    created_at: readAttendancePolicyString(row.created_at ?? row.createdAt),
    updated_at: readAttendancePolicyString(row.updated_at ?? row.updatedAt),
  };
}

export interface GetStaffShiftAssignmentsParams {
  tenant_id: string;
  page?: number;
  limit?: number;
}

export const getStaffShiftAssignments = async (
  params: GetStaffShiftAssignmentsParams,
): Promise<{ data: StaffShiftAssignment[]; pagination?: ApiPagination }> => {
  try {
    const requestParams: Record<string, string | number> = {
      tenant_id: params.tenant_id,
    };
    if (params.page != null) requestParams.page = params.page;
    if (params.limit != null) requestParams.limit = params.limit;

    const response = await axiosInstance.get(`${PREFIX}/shift-assignments`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    const { rows, pagination } = extractShiftAssignmentListResponse(response);
    return {
      data: rows.map((row) => normalizeShiftAssignmentRow(row)),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch shift assignments");
  }
};

export const createStaffShiftAssignment = async (
  payload: CreateStaffShiftAssignmentPayload,
): Promise<StaffShiftAssignment> => {
  try {
    const response = await axiosInstance.post<ApiResponse<StaffShiftAssignment>>(
      `${PREFIX}/shift-assignments`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create shift assignment");
  }
};

export const updateStaffShiftAssignment = async (
  id: number,
  payload: UpdateStaffShiftAssignmentPayload,
): Promise<StaffShiftAssignment> => {
  try {
    const response = await axiosInstance.put<ApiResponse<StaffShiftAssignment>>(
      `${PREFIX}/shift-assignments/${id}`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update shift assignment");
  }
};

export const deleteStaffShiftAssignment = async (
  id: number,
  tenantId: string,
): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/shift-assignments/${id}`, {
      params: { tenant_id: tenantId },
    });
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete shift assignment");
  }
};

// --- Holiday calendars ---

export interface HolidayCalendarHoliday {
  id?: number;
  name?: string | null;
  date?: string | null;
  type?: string | null;
  scope?: string | null;
  department_id?: number | null;
  half_day?: string | null;
  [key: string]: unknown;
}

export interface HolidayCalendar {
  id: number;
  tenant_id?: string | null;
  name?: string | null;
  year?: number | null;
  status?: string | null;
  description?: string | null;
  country_code?: string | null;
  is_default?: boolean | null;
  holidays?: HolidayCalendarHoliday[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface GetHolidayCalendarsParams {
  tenant_id: string;
  year?: number;
  status?: string;
  limit?: number;
}

export const getHolidayCalendars = async (
  params: GetHolidayCalendarsParams,
): Promise<{ data: HolidayCalendar[]; pagination?: ApiPagination }> => {
  try {
    const requestParams: Record<string, string | number> = {
      tenant_id: params.tenant_id,
    };
    const status = params.status?.trim();
    if (status) requestParams.status = status;
    if (params.year != null && Number.isFinite(params.year)) {
      requestParams.year = params.year;
    }
    if (params.limit != null) requestParams.limit = params.limit;

    const response = await axiosInstance.get<ApiResponse<HolidayCalendar[]>>(
      `${PREFIX}/holiday-calendars`,
      { params: requestParams },
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch holiday calendars");
  }
};

export interface CreateHolidayCalendarPayload {
  tenant_id: string;
  year: number;
  name: string;
  status: string;
}

export const createHolidayCalendar = async (
  payload: CreateHolidayCalendarPayload,
): Promise<HolidayCalendar> => {
  try {
    const response = await axiosInstance.post<ApiResponse<HolidayCalendar>>(
      `${PREFIX}/holiday-calendars`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create holiday calendar");
  }
};

export interface CreateCalendarHolidayPayload {
  name: string;
  date: string;
  scope: "company" | "department";
  department_id: number | null;
  half_day: "am" | "pm" | null;
}

export type UpdateCalendarHolidayPayload = CreateCalendarHolidayPayload;

export const getCalendarHolidays = async (
  calendarId: number,
): Promise<HolidayCalendarHoliday[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<HolidayCalendarHoliday[]>>(
      `${PREFIX}/holiday-calendars/${calendarId}/holidays`,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch calendar holidays");
  }
};

export const createCalendarHoliday = async (
  calendarId: number,
  payload: CreateCalendarHolidayPayload,
): Promise<HolidayCalendarHoliday> => {
  try {
    const response = await axiosInstance.post<ApiResponse<HolidayCalendarHoliday>>(
      `${PREFIX}/holiday-calendars/${calendarId}/holidays`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to add holiday");
  }
};

export const updateCalendarHoliday = async (
  calendarId: number,
  holidayId: number,
  payload: UpdateCalendarHolidayPayload,
): Promise<HolidayCalendarHoliday> => {
  try {
    const response = await axiosInstance.put<ApiResponse<HolidayCalendarHoliday>>(
      `${PREFIX}/holiday-calendars/${calendarId}/holidays/${holidayId}`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update holiday");
  }
};

export const deleteCalendarHoliday = async (
  calendarId: number,
  holidayId: number,
): Promise<void> => {
  try {
    const response = await axiosInstance.delete(
      `${PREFIX}/holiday-calendars/${calendarId}/holidays/${holidayId}`,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete holiday");
  }
};

export const publishHolidayCalendar = async (
  calendarId: number,
): Promise<HolidayCalendar> => {
  try {
    const response = await axiosInstance.post<ApiResponse<HolidayCalendar>>(
      `${PREFIX}/holiday-calendars/${calendarId}/publish`,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to publish holiday calendar");
  }
};

// --- Attendance policy list helpers ---

const ATTENDANCE_POLICY_LIST_KEYS = [
  "data",
  "items",
  "records",
  "policies",
  "work_hours",
  "workHours",
  "work_hours_policies",
  "workHoursPolicies",
  "work_hour_policies",
  "workHourPolicies",
  "attendance_work_hours",
  "attendanceWorkHours",
  "break_types",
  "breakTypes",
  "breaks",
  "break",
  "break_policies",
  "breakPolicies",
  "attendance_breaks",
  "attendanceBreaks",
  "overtime",
  "overtime_policies",
  "overtimePolicies",
  "attendance_overtime",
  "attendanceOvertime",
  "rows",
  "list",
  "results",
  "result",
  "content",
  "collection",
] as const;

function isStaffApiSuccess(success: unknown): boolean {
  if (success === false || success === 0 || success === "false") {
    return false;
  }
  return true;
}

function isAttendancePolicyRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function readAttendancePolicyNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function readAttendancePolicyString(value: unknown): string | null {
  return readStaffManagementString(value);
}

function isAttendancePolicyRow(record: Record<string, unknown>): boolean {
  return (
    "min_hours_per_day" in record ||
    "minHoursPerDay" in record ||
    "max_hours_per_day" in record ||
    "maxHoursPerDay" in record ||
    "effective_from" in record ||
    "effectiveFrom" in record ||
    "name" in record ||
    "grace_minutes" in record ||
    "graceMinutes" in record ||
    "duration_minutes" in record ||
    "durationMinutes" in record ||
    "max_breaks_per_day" in record ||
    "maxBreaksPerDay" in record ||
    "min_gap_minutes" in record ||
    "minGapMinutes" in record ||
    "buffer_minutes" in record ||
    "bufferMinutes" in record ||
    "weekly_cap_hours" in record ||
    "weeklyCapHours" in record ||
    "enabled" in record
  );
}

function isAttendancePolicyRowArray(rows: unknown[]): boolean {
  return rows.some((row) => isAttendancePolicyRecord(row));
}

function unwrapAttendancePolicyListPayload(
  payload: unknown,
  depth = 0,
): unknown[] {
  if (payload == null || depth > 4) {
    return [];
  }
  if (Array.isArray(payload)) {
    return isAttendancePolicyRowArray(payload)
      ? payload.filter((row) => isAttendancePolicyRecord(row))
      : [];
  }
  if (!isAttendancePolicyRecord(payload)) {
    return [];
  }

  for (const key of ATTENDANCE_POLICY_LIST_KEYS) {
    const candidate = payload[key];
    if (Array.isArray(candidate) && isAttendancePolicyRowArray(candidate)) {
      return candidate.filter((row) => isAttendancePolicyRecord(row));
    }
    const nested = unwrapAttendancePolicyListPayload(candidate, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  if (isAttendancePolicyRow(payload)) {
    return [payload];
  }

  for (const value of Object.values(payload)) {
    const nested = unwrapAttendancePolicyListPayload(value, depth + 1);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function readAttendancePolicyPagination(
  source: unknown,
): ApiPagination | undefined {
  if (!isAttendancePolicyRecord(source)) {
    return undefined;
  }

  const paginationSource = source.pagination ?? source.meta;
  if (!isAttendancePolicyRecord(paginationSource)) {
    return undefined;
  }

  const total = readAttendancePolicyNumber(
    paginationSource.total ??
      paginationSource.total_count ??
      paginationSource.totalCount,
  );
  if (total == null) {
    return undefined;
  }

  return {
    total,
    limit:
      readAttendancePolicyNumber(
        paginationSource.limit ?? paginationSource.per_page ?? paginationSource.perPage,
      ) ?? 0,
    page:
      readAttendancePolicyNumber(
        paginationSource.page ??
          paginationSource.current_page ??
          paginationSource.currentPage,
      ) ?? 1,
    last_page:
      readAttendancePolicyNumber(
        paginationSource.last_page ?? paginationSource.lastPage,
      ) ?? 1,
    from: readAttendancePolicyNumber(paginationSource.from) ?? 0,
    to: readAttendancePolicyNumber(paginationSource.to) ?? 0,
  };
}

function extractAttendancePolicyListResponse(
  response: { status: number; data: unknown },
): { rows: unknown[]; pagination?: ApiPagination } {
  if (response.status === 404) {
    return { rows: [], pagination: undefined };
  }

  const root = response.data;
  if (root == null) {
    return { rows: [], pagination: undefined };
  }

  if (Array.isArray(root)) {
    return {
      rows: isAttendancePolicyRowArray(root)
        ? root.filter((row) => isAttendancePolicyRecord(row))
        : [],
      pagination: undefined,
    };
  }

  if (!isAttendancePolicyRecord(root)) {
    return { rows: [], pagination: undefined };
  }

  const body = root as ApiResponse<unknown> & Record<string, unknown>;

  if (!isStaffApiSuccess(body.success)) {
    throw new Error(
      typeof body.message === "string" ? body.message : "API request failed",
    );
  }

  if (Array.isArray(body.data)) {
    const rows = isAttendancePolicyRowArray(body.data)
      ? body.data.filter((row) => isAttendancePolicyRecord(row))
      : body.data;
    return {
      rows,
      pagination:
        readAttendancePolicyPagination(body) ??
        readAttendancePolicyPagination(body.data),
    };
  }

  if (isAttendancePolicyRecord(body.data) && isAttendancePolicyRow(body.data)) {
    return {
      rows: [body.data],
      pagination: readAttendancePolicyPagination(body),
    };
  }

  let rows = unwrapAttendancePolicyListPayload(body.data);
  if (rows.length === 0) {
    rows = unwrapAttendancePolicyListPayload(body);
  }

  return {
    rows,
    pagination:
      readAttendancePolicyPagination(body) ??
      readAttendancePolicyPagination(body.data),
  };
}

function normalizeWorkHoursPolicyRow(raw: unknown): AttendanceWorkHoursPolicy {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    target_type: readAttendancePolicyString(row.target_type ?? row.targetType),
    target_id: readAttendancePolicyString(row.target_id ?? row.targetId),
    min_hours_per_day: readAttendancePolicyNumber(
      row.min_hours_per_day ??
        row.minHoursPerDay ??
        row.min_daily_hours ??
        row.minDailyHours ??
        row.minimum_hours_per_day ??
        row.minimumHoursPerDay,
    ),
    max_hours_per_day: readAttendancePolicyNumber(
      row.max_hours_per_day ??
        row.maxHoursPerDay ??
        row.max_daily_hours ??
        row.maxDailyHours ??
        row.maximum_hours_per_day ??
        row.maximumHoursPerDay,
    ),
    effective_from: readAttendancePolicyString(row.effective_from ?? row.effectiveFrom),
    effective_to: readAttendancePolicyString(row.effective_to ?? row.effectiveTo),
    created_at: readAttendancePolicyString(row.created_at ?? row.createdAt),
    updated_at: readAttendancePolicyString(row.updated_at ?? row.updatedAt),
  };
}

function normalizeBreakTypeRow(raw: unknown): AttendanceBreakType {
  if (!raw || typeof raw !== "object") {
    return { id: 0 };
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id) ?? 0;

  return {
    id,
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    name: readAttendancePolicyString(row.name),
    type: readAttendancePolicyString(row.type),
    duration_minutes: readAttendancePolicyNumber(
      row.duration_minutes ?? row.durationMinutes,
    ),
    is_paid: readAttendancePolicyBooleanField(row.is_paid, row.isPaid),
    is_active: readAttendancePolicyBooleanField(row.is_active, row.isActive),
    created_at: readAttendancePolicyString(row.created_at ?? row.createdAt),
    updated_at: readAttendancePolicyString(row.updated_at ?? row.updatedAt),
  };
}

// --- Attendance policies (work hours) ---

export interface AttendanceWorkHoursPolicy {
  id?: number;
  tenant_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  min_hours_per_day?: number | null;
  max_hours_per_day?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateAttendanceWorkHoursPolicyPayload {
  tenant_id: string;
  target_type: "company";
  target_id: string;
  min_hours_per_day: number;
  max_hours_per_day: number;
  effective_from: string;
  effective_to?: string | null;
}

function normalizeWorkHoursPolicyList(
  rows: readonly unknown[],
): AttendanceWorkHoursPolicy[] {
  return rows.map((row) => normalizeWorkHoursPolicyRow(row));
}

export interface GetAttendanceWorkHoursPoliciesParams {
  tenant_id: string;
  page?: number;
  limit?: number;
}

export const getAttendanceWorkHoursPolicies = async (
  params: GetAttendanceWorkHoursPoliciesParams | string,
): Promise<{ data: AttendanceWorkHoursPolicy[]; pagination?: ApiPagination }> => {
  try {
    const tenantId = typeof params === "string" ? params : params.tenant_id;
    const requestParams: Record<string, string | number> = { tenant_id: tenantId };
    if (typeof params !== "string") {
      if (params.page != null) requestParams.page = params.page;
      if (params.limit != null) requestParams.limit = params.limit;
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance-policies/work-hours`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    const { rows, pagination } = extractAttendancePolicyListResponse(response);
    return {
      data: normalizeWorkHoursPolicyList(rows),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch work hours policies");
  }
};

/** @deprecated Use getAttendanceWorkHoursPolicies */
export const getAttendanceWorkHoursPolicy = async (
  tenantId: string,
): Promise<AttendanceWorkHoursPolicy | null> => {
  const result = await getAttendanceWorkHoursPolicies(tenantId);
  return result.data[0] ?? null;
};

export const createAttendanceWorkHoursPolicy = async (
  payload: CreateAttendanceWorkHoursPolicyPayload,
): Promise<AttendanceWorkHoursPolicy> => {
  try {
    const response = await axiosInstance.post<ApiResponse<AttendanceWorkHoursPolicy>>(
      `${PREFIX}/attendance-policies/work-hours`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to save work hours policy");
  }
};

export type UpdateAttendanceWorkHoursPolicyPayload = CreateAttendanceWorkHoursPolicyPayload;

export const updateAttendanceWorkHoursPolicy = async (
  id: number,
  payload: UpdateAttendanceWorkHoursPolicyPayload,
): Promise<AttendanceWorkHoursPolicy> => {
  try {
    const response = await axiosInstance.put<ApiResponse<AttendanceWorkHoursPolicy>>(
      `${PREFIX}/attendance-policies/work-hours/${id}`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to update work hours policy");
  }
};

export const deleteAttendanceWorkHoursPolicy = async (
  id: number,
  tenantId: string,
): Promise<void> => {
  try {
    const response = await axiosInstance.delete(
      `${PREFIX}/attendance-policies/work-hours/${id}`,
      { params: { tenant_id: tenantId } },
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to delete work hours policy");
  }
};

// --- Attendance policies (grace period) ---

export interface AttendanceGracePeriodPolicy {
  id?: number;
  tenant_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  grace_minutes?: number | null;
  late_threshold_minutes?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateAttendanceGracePeriodPolicyPayload {
  tenant_id: string;
  target_type: "company";
  target_id: string;
  grace_minutes: number;
  late_threshold_minutes: number;
  effective_from: string;
  effective_to?: string | null;
}

export const getAttendanceGracePeriodPolicy = async (
  tenantId: string,
): Promise<AttendanceGracePeriodPolicy | null> => {
  try {
    const response = await axiosInstance.get<ApiResponse<AttendanceGracePeriodPolicy>>(
      `${PREFIX}/attendance-policies/grace-period`,
      {
        params: { tenant_id: tenantId },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
      },
    );

    if (response.status === 404 || response.data?.data == null) {
      return null;
    }

    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch grace period policy");
  }
};

export const createAttendanceGracePeriodPolicy = async (
  payload: CreateAttendanceGracePeriodPolicyPayload,
): Promise<AttendanceGracePeriodPolicy> => {
  try {
    const response = await axiosInstance.post<ApiResponse<AttendanceGracePeriodPolicy>>(
      `${PREFIX}/attendance-policies/grace-period`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to save grace period policy");
  }
};

// --- Attendance policies (breaks) ---

export interface AttendanceBreakPolicy {
  id?: number;
  tenant_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  max_breaks_per_day?: number | null;
  min_gap_minutes?: number | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateAttendanceBreakPolicyPayload {
  tenant_id: string;
  target_type: "company";
  target_id: string;
  max_breaks_per_day: number;
  min_gap_minutes: number;
  effective_from: string;
  effective_to?: string | null;
}

function normalizeBreakPolicyRow(raw: unknown): AttendanceBreakPolicy {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    target_type: readAttendancePolicyString(row.target_type ?? row.targetType),
    target_id: readAttendancePolicyString(row.target_id ?? row.targetId),
    max_breaks_per_day: readAttendancePolicyNumber(
      row.max_breaks_per_day ??
        row.maxBreaksPerDay ??
        row.maximum_breaks_per_day ??
        row.maximumBreaksPerDay,
    ),
    min_gap_minutes: readAttendancePolicyNumber(
      row.min_gap_minutes ??
        row.minGapMinutes ??
        row.minimum_gap_minutes ??
        row.minimumGapMinutes,
    ),
    effective_from: readAttendancePolicyString(row.effective_from ?? row.effectiveFrom),
    effective_to: readAttendancePolicyString(row.effective_to ?? row.effectiveTo),
    created_at: readAttendancePolicyString(row.created_at ?? row.createdAt),
    updated_at: readAttendancePolicyString(row.updated_at ?? row.updatedAt),
  };
}

function normalizeBreakPolicyList(rows: readonly unknown[]): AttendanceBreakPolicy[] {
  return rows.map((row) => normalizeBreakPolicyRow(row));
}

export interface GetAttendanceBreakPoliciesParams {
  tenant_id: string;
  page?: number;
  limit?: number;
}

export const getAttendanceBreakPolicies = async (
  params: GetAttendanceBreakPoliciesParams | string,
): Promise<{ data: AttendanceBreakPolicy[]; pagination?: ApiPagination }> => {
  try {
    const tenantId = typeof params === "string" ? params : params.tenant_id;
    const requestParams: Record<string, string | number> = { tenant_id: tenantId };
    if (typeof params !== "string") {
      if (params.page != null) requestParams.page = params.page;
      if (params.limit != null) requestParams.limit = params.limit;
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance-policies/break`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    const { rows, pagination } = extractAttendancePolicyListResponse(response);
    return {
      data: normalizeBreakPolicyList(rows),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch break policies");
  }
};

export const createAttendanceBreakPolicy = async (
  payload: CreateAttendanceBreakPolicyPayload,
): Promise<AttendanceBreakPolicy> => {
  try {
    const response = await axiosInstance.post<ApiResponse<AttendanceBreakPolicy>>(
      `${PREFIX}/attendance-policies/break`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create break policy");
  }
};

// --- Attendance policies (overtime) ---

export interface AttendanceOvertimePolicy {
  id?: number;
  tenant_id?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  buffer_minutes?: number | null;
  weekly_cap_hours?: number | null;
  enabled?: boolean | null;
  effective_from?: string | null;
  effective_to?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateAttendanceOvertimePolicyPayload {
  tenant_id: string;
  target_type: "company";
  target_id: string;
  buffer_minutes: number;
  weekly_cap_hours: number;
  enabled: boolean;
  effective_from: string;
  effective_to?: string | null;
}

function readAttendancePolicyBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1" || value === "true") {
    return true;
  }
  if (value === 0 || value === "0" || value === "false") {
    return false;
  }
  return null;
}

function normalizeOvertimePolicyRow(raw: unknown): AttendanceOvertimePolicy {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const row = raw as Record<string, unknown>;
  const id = readAttendancePolicyNumber(row.id);

  return {
    ...(buildOptionalNumericIdField(id)),
    tenant_id: readAttendancePolicyString(row.tenant_id ?? row.tenantId),
    target_type: readAttendancePolicyString(row.target_type ?? row.targetType),
    target_id: readAttendancePolicyString(row.target_id ?? row.targetId),
    buffer_minutes: readAttendancePolicyNumber(
      row.buffer_minutes ?? row.bufferMinutes,
    ),
    weekly_cap_hours: readAttendancePolicyNumber(
      row.weekly_cap_hours ??
        row.weeklyCapHours ??
        row.weekly_cap ??
        row.weeklyCap,
    ),
    enabled: readAttendancePolicyBoolean(row.enabled ?? row.is_enabled ?? row.isEnabled),
    effective_from: readAttendancePolicyString(row.effective_from ?? row.effectiveFrom),
    effective_to: readAttendancePolicyString(row.effective_to ?? row.effectiveTo),
    created_at: readAttendancePolicyString(row.created_at ?? row.createdAt),
    updated_at: readAttendancePolicyString(row.updated_at ?? row.updatedAt),
  };
}

function normalizeOvertimePolicyList(rows: readonly unknown[]): AttendanceOvertimePolicy[] {
  return rows.map((row) => normalizeOvertimePolicyRow(row));
}

export interface GetAttendanceOvertimePoliciesParams {
  tenant_id: string;
  page?: number;
  limit?: number;
}

export const getAttendanceOvertimePolicies = async (
  params: GetAttendanceOvertimePoliciesParams | string,
): Promise<{ data: AttendanceOvertimePolicy[]; pagination?: ApiPagination }> => {
  try {
    const tenantId = typeof params === "string" ? params : params.tenant_id;
    const requestParams: Record<string, string | number> = { tenant_id: tenantId };
    if (typeof params !== "string") {
      if (params.page != null) requestParams.page = params.page;
      if (params.limit != null) requestParams.limit = params.limit;
    }

    const response = await axiosInstance.get(`${PREFIX}/attendance-policies/overtime`, {
      params: requestParams,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });

    const { rows, pagination } = extractAttendancePolicyListResponse(response);
    return {
      data: normalizeOvertimePolicyList(rows),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch overtime policies");
  }
};

export const createAttendanceOvertimePolicy = async (
  payload: CreateAttendanceOvertimePolicyPayload,
): Promise<AttendanceOvertimePolicy> => {
  try {
    const response = await axiosInstance.post<ApiResponse<AttendanceOvertimePolicy>>(
      `${PREFIX}/attendance-policies/overtime`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create overtime policy");
  }
};

// --- Attendance policies (break types) ---

export interface AttendanceBreakType {
  id: number;
  tenant_id?: string | null;
  name?: string | null;
  type?: string | null;
  duration_minutes?: number | null;
  is_paid?: boolean | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface CreateAttendanceBreakTypePayload {
  tenant_id: string;
  name: string;
  type: string;
  duration_minutes: number;
  is_paid: boolean;
  is_active: boolean;
}

export const getAttendanceBreakTypes = async (
  tenantId: string,
): Promise<{ data: AttendanceBreakType[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/attendance-policies/break-types`, {
      params: { tenant_id: tenantId },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
    const { rows, pagination } = extractAttendancePolicyListResponse(response);
    return {
      data: rows.map((row) => normalizeBreakTypeRow(row)),
      pagination,
    };
  } catch (error: unknown) {
    handleApiError(error, "Failed to fetch break types");
  }
};

export const createAttendanceBreakType = async (
  payload: CreateAttendanceBreakTypePayload,
): Promise<AttendanceBreakType> => {
  try {
    const response = await axiosInstance.post<ApiResponse<AttendanceBreakType>>(
      `${PREFIX}/attendance-policies/break-types`,
      payload,
    );
    return extractData(response);
  } catch (error: unknown) {
    handleApiError(error, "Failed to create break type");
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



