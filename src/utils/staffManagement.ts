import { toast } from "react-toastify";
import axiosInstance from "./axios";

const PREFIX = "/staff-management";

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
      `${PREFIX}/dashboard`
    );
    return extractData(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch dashboard";
    toast.error(msg);
    throw error;
  }
};

// --- Audit Logs ---

export interface AuditLogParams {
  page?: number;
  limit?: number;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export const getAuditLogs = async (
  params: AuditLogParams = {}
): Promise<{ data: unknown[]; pagination?: ApiPagination }> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/audit-logs`,
      { params: { sort_field: "created_at", sort_direction: "desc", ...params } }
    );
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch audit logs";
    toast.error(msg);
    throw error;
  }
};

// --- User Profile ---

export interface UserProfileAddress {
  id?: number;
  name?: string;
  zip_code?: string;
  city?: string;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user profiles";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to create user profile";
    toast.error(msg);
    throw error;
  }
};

export const getUserProfile = async (id: number): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.get<ApiResponse<UserProfile>>(
      `${PREFIX}/user-profiles/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user profile";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to update user profile";
    toast.error(msg);
    throw error;
  }
};

export const deleteUserProfile = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/user-profiles/${id}`);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete user profile";
    toast.error(msg);
    throw error;
  }
};

// --- User Request Categories ---

export interface UserRequestCategoryPayload {
  tenant_id?: string | null;
  name: string;
  code?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface UserRequestCategory extends UserRequestCategoryPayload {
  id: number;
  fields?: UserRequestCategoryField[];
  [key: string]: unknown;
}

export const getUserRequestCategories = async (params?: {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}): Promise<{
  data: UserRequestCategory[];
  pagination?: ApiPagination;
}> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<UserRequestCategory[]>
    >(`${PREFIX}/user-request-categories`, { params });
    return extractDataWithPagination(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user request categories";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to create user request category";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user request category";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to update user request category";
    toast.error(msg);
    throw error;
  }
};

export const deleteUserRequestCategory = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/user-request-categories/${id}`);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete user request category";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch category fields";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to create category field";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to update category field";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete category field";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to reorder category fields";
    toast.error(msg);
    throw error;
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
  tenant_id: string;
  user_request_category_id: number;
  user_id?: string;
  subject: string;
  reason?: string | null;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user requests";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to create user request";
    toast.error(msg);
    throw error;
  }
};

function buildUserRequestFormData(
  payload: UserRequestCreatePayload & {
    dynamic_files?: Record<string, File | File[]>;
    files?: File[];
  }
): FormData {
  const form = new FormData();
  form.append("tenant_id", payload.tenant_id);
  form.append("user_request_category_id", String(payload.user_request_category_id));
  if (payload.user_id) form.append("user_id", payload.user_id);
  form.append("subject", payload.subject);
  if (payload.reason != null) form.append("reason", payload.reason);
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch user request";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to update user request";
    toast.error(msg);
    throw error;
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
  if (payload.dynamic_fields !== undefined)
    form.append(
      "dynamic_fields",
      payload.dynamic_fields === null
        ? ""
        : typeof payload.dynamic_fields === "string"
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

export const deleteUserRequest = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/user-requests/${id}`);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete user request";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to download attachment";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch locations";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to create location";
    toast.error(msg);
    throw error;
  }
};

export const getLocation = async (id: number): Promise<Location> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Location>>(
      `${PREFIX}/locations/${id}`
    );
    return extractData(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch location";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to update location";
    toast.error(msg);
    throw error;
  }
};

export const deleteLocation = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/locations/${id}`);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete location";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch attendance";
    toast.error(msg);
    throw error;
  }
};

export const getAttendanceStatus = async (): Promise<AttendanceStatusData> => {
  try {
    const response = await axiosInstance.get<
      ApiResponse<AttendanceStatusData>
    >(`${PREFIX}/attendance/status`);
    return extractData(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch attendance status";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to check in";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to check out";
    toast.error(msg);
    throw error;
  }
};

export const deleteAttendance = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`${PREFIX}/attendance/${id}`);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete attendance record";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch companies";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch departments";
    toast.error(msg);
    throw error;
  }
};

export const getMainAppUsers = async (
  companyUuid: string,
  params?: { department_id?: number }
): Promise<unknown[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<unknown[]>>(
      `${PREFIX}/main-app/${companyUuid}/users`,
      { params }
    );
    return extractData(response);
  } catch (error: unknown) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to fetch users";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to upload company image";
    toast.error(msg);
    throw error;
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
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Failed to delete company image";
    toast.error(msg);
    throw error;
  }
};
