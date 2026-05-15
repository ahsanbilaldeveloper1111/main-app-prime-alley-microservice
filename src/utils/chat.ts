import { toast } from "react-toastify";
import axiosInstance from "./axios";

const tenant_id = "tenant_123";

/** Tenant FAQ CRUD base path (`GET/POST/DELETE /api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`). */
const TENANT_FAQS_API_PATH = "/chat/tenant-faqs";

/** AI assistant thread API (`GET/POST /api/chat/` when `BACKEND_URL` ends with `/api/`). */
const CHAT_ASSISTANT_API_PATH = "/chat/";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function httpErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response.status;
  return typeof status === "number" ? status : undefined;
}

function chatApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (!isRecord(error)) {
    return fallback;
  }
  const response = error.response;
  if (isRecord(response) && isRecord(response.data)) {
    const { error: apiError, message: apiMessage } = response.data;
    if (typeof apiError === "string" && apiError) {
      return apiError;
    }
    if (typeof apiMessage === "string" && apiMessage) {
      return apiMessage;
    }
  }
  if (typeof error.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}

// AI assistant chat thread (GET/POST `/api/chat/`)

export interface ChatSendMessagePayload {
  message: string;
  thread_id?: string;
}

/** @deprecated Use {@link ChatSendMessagePayload}; `tenant_id` is resolved server-side. */
export type ChatMessagePayload = ChatSendMessagePayload & {
  tenant_id?: string;
};

export interface ChatSendMetadata {
  selected_tools: string[];
  rag_documents_count: number;
  tool_results: unknown[];
  needs_rag: boolean;
  needs_tool: boolean;
  awaiting_parameters: boolean;
  parameter_request: string;
}

export interface ChatSendMessageResponse {
  response: string;
  tenant_id: string;
  thread_id: string;
  metadata: ChatSendMetadata;
  error?: string;
}

/** @deprecated Use {@link ChatSendMessageResponse}. */
export type ChatMessageResponse = ChatSendMessageResponse & {
  message?: string;
};

export interface ChatThreadMessage {
  type: "human" | "ai";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatThreadResponse {
  tenant_id: string;
  thread_id: string;
  title: string;
  message_count: number;
  messages: ChatThreadMessage[];
  created_at: string;
  updated_at: string;
  error?: string;
}

export type ChatUiMessageRole = "user" | "assistant";

export interface ChatUiMessage {
  id: string;
  role: ChatUiMessageRole;
  content: string;
  timestamp: Date;
}

export function mapChatThreadMessagesToUi(
  messages: ChatThreadMessage[],
): ChatUiMessage[] {
  return messages.map((m, index) => ({
    id: `${m.type}-${index}-${m.created_at}`,
    role: m.type === "human" ? "user" : "assistant",
    content: m.content,
    timestamp: new Date(m.created_at),
  }));
}

// Chat Survey Interfaces
export interface ChatSurveyPayload {
  rating: number;
  feedback?: string | null;
  thread_id?: string;
  tenant_id: string;
}

export interface ChatSurveyResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// FAQ Interfaces
export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQData extends Record<string, unknown> {
  id?: number;
  question: string;
  answer: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

/** One FAQ row from GET `/chat/tenant-faqs` (current API shape). */
export interface TenantFaqListEntry extends FAQData {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FAQListResponse {
  tenant_id?: string;
  tenant_name?: string | null;
  faqs_count?: number;
  faqs?: FAQData[];
  files_count?: number;
  files?: any[];
  data?: FAQData[];
  success?: boolean;
  message?: string;
  error?: string;
}

export interface FAQResponse {
  id?: number;
  question?: string;
  answer?: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
  success?: boolean;
  message?: string;
  error?: string;
}

export interface CreateTenantFAQPayload {
  tenant_id: string;
  /** JSON string of `[{ question, answer }]` */
  faqs: string;
  /** PDF or TXT; each appended as `files[]` in multipart/form-data */
  files?: File[];
}

/** Single FAQ row returned after a successful tenant FAQ create. */
export interface TenantFaqCreatedEntry {
  id: number;
  question: string;
  answer: string;
}

/** File metadata returned after upload; fields may grow with the API. */
export type TenantFaqSavedFile = Readonly<Record<string, unknown>>;

/** GET `/chat/tenant-faqs` success body (list + counts + file metadata). */
export interface TenantFaqListResponse {
  tenant_id: string;
  faqs_count: number;
  faqs: TenantFaqListEntry[];
  files_count: number;
  files: TenantFaqSavedFile[];
  error?: string;
}

/** POST `/chat/tenant-faqs` success body (multipart create). */
export interface CreateTenantFAQResponse {
  message: string;
  tenant_id: string;
  tenant_created: boolean;
  faqs_created: number;
  faqs: TenantFaqCreatedEntry[];
  files_saved: number;
  files: TenantFaqSavedFile[];
  error?: string;
}

export type CreateGlobalFAQPayload = {
  /** JSON string of `[{ question, answer }]` */
  faqs: string;
  files?: File[];
};

export interface GlobalFaqVectorStorePropagation {
  synced: string[];
  skipped: string[];
}

export interface GlobalFaqVectorStoreSync {
  faq_propagation: GlobalFaqVectorStorePropagation;
}

/** POST `/chat/global-faqs` success body (201, multipart create). */
export interface CreateGlobalFAQResponse {
  message: string;
  faqs_created: number;
  faqs: TenantFaqCreatedEntry[];
  files_saved: number;
  files: TenantFaqSavedFile[];
  vector_store_sync: GlobalFaqVectorStoreSync;
  error?: string;
}

/** GET `/chat/global-faqs` success body. */
export interface GlobalFaqListResponse {
  faqs_count: number;
  faqs: FAQData[];
  files_count: number;
  files: TenantFaqSavedFile[];
  error?: string;
}

/**
 * DELETE `/chat/global-faqs` — JSON body (same choices as tenant, no `tenant_id`):
 * `{"faq_id"}`, `{"filename"}`, or `{}` when `scope: "all"`.
 */
export type DeleteGlobalFAQParams =
  | { faq_id: number }
  | { filename: string }
  | { scope: "all" };

/** DELETE `/chat/tenant-faqs` success body when deleting by `faq_id`. */
export interface DeleteTenantFAQResponse {
  message: string;
  tenant_id: string;
  faqs_deleted: number;
  files_deleted: number;
  error?: string;
}

/**
 * DELETE `/chat/tenant-faqs` (i.e. `/api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`):
 * - `{ faq_id }` → delete one FAQ (`{"faq_id": 129}`)
 * - `{ tenant_id, filename }` → delete one file (`tenant_id` as query param)
 * - `{ tenant_id, scope: "all" }` → delete all FAQs and files for the tenant
 */
export type DeleteTenantFAQParams =
  | { faq_id: number }
  | { tenant_id: string; filename: string }
  | { tenant_id: string; scope: "all" };

// Training Interface
export interface ChatTrainingPayload {
  tenant_id: string;
  chunk_size: number;
  chunk_overlap: number;
}

export interface ChatTrainingDocumentStats {
  files: number;
  chunks: number;
}

export interface ChatTrainingFaqStats {
  count: number;
  chunks: number;
}

/** Opaque or evolving `vector_store_info` object from the training API. */
export type ChatTrainingVectorStoreInfo = Readonly<Record<string, unknown>>;

/**
 * POST `/chat/training` success body (200) when `BACKEND_URL` ends with `/api/`
 * (i.e. `/api/chat/training`).
 */
export interface ChatTrainingResponse {
  message: string;
  tenant_id: string;
  chunk_size: number;
  chunk_overlap: number;
  tenant_documents: ChatTrainingDocumentStats;
  global_documents: ChatTrainingDocumentStats;
  tenant_faqs: ChatTrainingFaqStats;
  global_faqs: ChatTrainingFaqStats;
  total_chunks: number;
  vector_store_info: ChatTrainingVectorStoreInfo;
  /** Present on error payloads; not part of the documented 200 success body. */
  error?: string;
}

/** GET `/training/status/` — tenant-scoped bot training metadata (when `BACKEND_URL` ends with `/api/`). */
export interface ChatTrainingStatusResponse {
  tenant_id: string;
  is_trained: boolean;
  last_updated: string | null;
  processed_files: number;
  processed_faqs: number;
  vector_store_path: string | null;
  error?: string;
}

/**
 * Load an existing assistant thread (GET `/api/chat/?thread_id=…`).
 */
export const getChatThread = async (threadId: string): Promise<ChatThreadResponse> => {
  const id = threadId.trim();
  if (!id) {
    throw new Error("Thread id is required");
  }
  try {
    const response = await axiosInstance.get<ChatThreadResponse>(CHAT_ASSISTANT_API_PATH, {
      params: { thread_id: id },
    });
    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to load chat thread");
    }
    return response.data;
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(error, "Failed to load conversation. Please try again."),
    );
    throw error;
  }
};

/**
 * Send a message to the AI assistant (POST `/api/chat/`).
 * Body: `{ message, thread_id? }` — omit `thread_id` to start a new thread.
 */
export const sendChatMessage = async (
  payload: ChatSendMessagePayload,
): Promise<ChatSendMessageResponse> => {
  try {
    const body: ChatSendMessagePayload = { message: payload.message };
    const threadId = payload.thread_id?.trim();
    if (threadId) {
      body.thread_id = threadId;
    }

    const response = await axiosInstance.post<ChatSendMessageResponse>(
      CHAT_ASSISTANT_API_PATH,
      body,
    );

    if (response.data?.error) {
      throw new Error(response.data.error || "An error occurred");
    }

    return response.data;
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(
        error,
        "An error occurred while processing your request. Please try again.",
      ),
    );
    throw error;
  }
};

/**
 * Submit a chat survey/feedback
 * @param payload - Survey payload containing rating, feedback, thread_id, and tenant_id
 * @returns Promise with survey response
 */
export const submitChatSurvey = async (
  payload: ChatSurveyPayload
): Promise<ChatSurveyResponse> => {
  try {
    const response = await axiosInstance.post<ChatSurveyResponse>('/chat/survey', payload);
    
    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || 'An error occurred');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Survey submission error:', error);
    // Don't show toast for survey errors to avoid interrupting user flow
    throw error;
  }
};

type TenantFaqGetBody =
  | TenantFaqListResponse
  | FAQData[]
  | { data?: FAQData[]; error?: string };

function faqsArrayFromTenantGetBody(body: TenantFaqGetBody | null | undefined): FAQData[] {
  if (body == null) {
    return [];
  }
  if (Array.isArray(body)) {
    return body;
  }
  if (typeof body !== "object") {
    return [];
  }
  const o = body as { error?: unknown; faqs?: unknown; data?: unknown };
  if (o.error) {
    throw new Error(
      typeof o.error === "string" ? o.error : "Failed to fetch tenant FAQs"
    );
  }
  if (Array.isArray(o.faqs)) {
    return o.faqs as FAQData[];
  }
  if (Array.isArray(o.data)) {
    return o.data as FAQData[];
  }
  return [];
}

function tenantFaqsListQuery(tenantId?: string, search?: string): string {
  const params = new URLSearchParams();
  const id = tenantId?.trim();
  if (id) params.set("tenant_id", id);
  if (search?.trim()) params.set("search", search.trim());
  const query = params.toString();
  return query ? `${TENANT_FAQS_API_PATH}?${query}` : TENANT_FAQS_API_PATH;
}

/**
 * Get tenant FAQ list payload (GET `/api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`).
 * Success body is {@link TenantFaqListResponse}; legacy array / `{ data }` shapes are still accepted.
 */
export const getTenantFAQsList = async (
  tenantId?: string,
  search?: string,
): Promise<TenantFaqGetBody> => {
  const response = await axiosInstance.get<TenantFaqGetBody>(
    tenantFaqsListQuery(tenantId, search),
  );
  return response.data;
};

/**
 * Get tenant-specific FAQs (GET `/api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`).
 * Success body is {@link TenantFaqListResponse}; legacy array / `{ data }` shapes are still accepted.
 *
 * @param tenantId - Optional tenant identifier; when not provided or empty, request is sent without tenant_id (no default tenant_123)
 * @param search - Optional search term to filter FAQs (sent as query param for server-side search)
 * @returns Promise with list of tenant FAQs
 */
export const getTenantFAQs = async (tenantId?: string, search?: string): Promise<FAQData[]> => {
  try {
    const body = await getTenantFAQsList(tenantId, search);
    return faqsArrayFromTenantGetBody(body);
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(error, "Failed to fetch tenant FAQs. Please try again."),
    );
    throw error;
  }
};

/**
 * Create tenant-specific FAQs (POST `/api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`).
 * Body: `multipart/form-data` with `faqs` (JSON string of `[{question, answer}]`), optional `tenant_id`,
 * and/or `files[]` (PDF or TXT).
 */
export const createTenantFAQ = async (
  payload: CreateTenantFAQPayload
): Promise<CreateTenantFAQResponse> => {
  try {
    const formData = new FormData();
    formData.append("tenant_id", payload.tenant_id);
    formData.append("faqs", payload.faqs);

    if (payload.files?.length) {
      for (const file of payload.files) {
        formData.append("files[]", file);
      }
    }

    const response = await axiosInstance.post<CreateTenantFAQResponse>(
      TENANT_FAQS_API_PATH,
      formData
    );

    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to create tenant FAQs");
    }

    toast.success(
      response.data?.message?.trim() || "Tenant FAQs created successfully"
    );
    return response.data;
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(error, "Failed to create tenant FAQs. Please try again."),
    );
    throw error;
  }
};

function faqSideDeleteSuccessMessage(
  side: "Tenant" | "Global",
  params: DeleteTenantFAQParams | DeleteGlobalFAQParams
): string {
  if ("scope" in params && params.scope === "all") {
    return `${side} FAQs and files deleted successfully`;
  }
  if ("faq_id" in params) {
    return `${side} FAQ deleted successfully`;
  }
  return `${side} file deleted successfully`;
}

function buildFaqSideDeleteBody(
  params: DeleteTenantFAQParams | DeleteGlobalFAQParams
): Record<string, never> | { faq_id: number } | { filename: string } {
  if ("scope" in params && params.scope === "all") {
    return {};
  }
  if ("faq_id" in params) {
    return { faq_id: params.faq_id };
  }
  if ("filename" in params) {
    return { filename: params.filename };
  }
  return {};
}

/**
 * Delete tenant FAQs and/or files (DELETE `/api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`).
 * Single-FAQ delete sends JSON body `{"faq_id": number}` only.
 */
export const deleteTenantFAQ = async (
  params: DeleteTenantFAQParams,
): Promise<DeleteTenantFAQResponse> => {
  try {
    const body = buildFaqSideDeleteBody(params);
    const hasTenantQuery =
      "tenant_id" in params && typeof params.tenant_id === "string";

    const response = await axiosInstance.delete<DeleteTenantFAQResponse>(
      TENANT_FAQS_API_PATH,
      {
        ...(hasTenantQuery ? { params: { tenant_id: params.tenant_id } } : {}),
        data: body,
      },
    );

    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to delete tenant FAQ");
    }

    toast.success(
      response.data?.message?.trim() ||
        faqSideDeleteSuccessMessage("Tenant", params),
    );
    return response.data;
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(error, "Failed to delete tenant FAQ. Please try again."),
    );
    throw error;
  }
};

type GlobalFaqGetBody =
  | GlobalFaqListResponse
  | FAQData[]
  | { data?: FAQData[]; error?: string };

function faqsArrayFromGlobalGetBody(body: GlobalFaqGetBody | null | undefined): FAQData[] {
  if (body == null) {
    return [];
  }
  if (Array.isArray(body)) {
    return body;
  }
  if (typeof body !== "object") {
    return [];
  }
  const o = body as { error?: unknown; faqs?: unknown; data?: unknown };
  if (o.error) {
    throw new Error(
      typeof o.error === "string" ? o.error : "Failed to fetch global FAQs"
    );
  }
  if (Array.isArray(o.faqs)) {
    return o.faqs as FAQData[];
  }
  if (Array.isArray(o.data)) {
    return o.data as FAQData[];
  }
  return [];
}

/**
 * Get global FAQs (GET `/api/chat/global-faqs` when `BACKEND_URL` ends with `/api/`).
 * Success body is {@link GlobalFaqListResponse}; legacy array / `{ data }` shapes are still accepted.
 *
 * @param search - Optional search term (sent as query param for server-side search)
 * @returns Promise with list of global FAQs
 */
export const getGlobalFAQs = async (search?: string): Promise<FAQData[]> => {
  try {
    const url = search?.trim()
      ? `/chat/global-faqs?search=${encodeURIComponent(search.trim())}`
      : "/chat/global-faqs";
    const response = await axiosInstance.get<GlobalFaqGetBody>(url);

    return faqsArrayFromGlobalGetBody(response.data);
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch global FAQs. Please try again.";

    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Create or update global FAQs (POST `/api/chat/global-faqs` when `BACKEND_URL` ends with `/api/`).
 * Body: `multipart/form-data` with `faqs` (JSON string) and/or `files[]`. No `tenant_id`.
 */
export const createGlobalFAQ = async (
  payload: CreateGlobalFAQPayload
): Promise<CreateGlobalFAQResponse> => {
  try {
    const formData = new FormData();
    formData.append("faqs", payload.faqs);

    if (payload.files?.length) {
      for (const file of payload.files) {
        formData.append("files[]", file);
      }
    }

    const response = await axiosInstance.post<CreateGlobalFAQResponse>(
      "/chat/global-faqs",
      formData
    );

    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to create global FAQs");
    }

    toast.success(
      response.data?.message?.trim() || "Global FAQs created successfully"
    );
    return response.data;
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to create global FAQs. Please try again.";

    toast.error(errorMsg);
    throw error;
  }
};

/**
 * Delete global FAQs and/or files (DELETE `/api/chat/global-faqs` when `BACKEND_URL` ends with `/api/`).
 * JSON body: `{"faq_id"}`, `{"filename"}`, or `{}` for delete-all (use `{ scope: "all" }` in params).
 */
export const deleteGlobalFAQ = async (params: DeleteGlobalFAQParams): Promise<void> => {
  try {
    const body = buildFaqSideDeleteBody(params);
    const response = await axiosInstance.delete("/chat/global-faqs", {
      data: body,
    });

    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to delete global FAQ");
    }

    toast.success(faqSideDeleteSuccessMessage("Global", params));
  } catch (error: any) {
    const errorMsg =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete global FAQ. Please try again.";

    toast.error(errorMsg);
    throw error;
  }
};

function unwrapChatTrainingResponse(data: unknown): ChatTrainingResponse {
  const body = data as Record<string, unknown>;
  const nested =
    (body.data as ChatTrainingResponse | undefined) ??
    (body.result as ChatTrainingResponse | undefined);
  return nested ?? (data as ChatTrainingResponse);
}

/**
 * Start chatbot training (POST `/api/chat/training` when `BACKEND_URL` ends with `/api/`).
 */
export const postChatTraining = async (
  payload: ChatTrainingPayload,
): Promise<ChatTrainingResponse> => {
  const tenantId = payload.tenant_id?.trim();
  if (!tenantId) {
    throw new Error("tenant_id is required");
  }

  try {
    const response = await axiosInstance.post<ChatTrainingResponse>(
      "/chat/training",
      {
        tenant_id: tenantId,
        chunk_size: payload.chunk_size,
        chunk_overlap: payload.chunk_overlap,
      },
    );

    if (response.data == null) {
      throw new Error("Failed to train bot");
    }

    const result = unwrapChatTrainingResponse(response.data);
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error: unknown) {
    throw new Error(
      chatApiErrorMessage(error, "Failed to train bot. Please try again."),
    );
  }
};

/**
 * @deprecated Prefer {@link postChatTraining}. Kept for existing callers; shows a toast on failure.
 */
export const submitChatTraining = async (
  payload: ChatTrainingPayload,
): Promise<ChatTrainingResponse> => {
  try {
    return await postChatTraining(payload);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to train bot.";
    toast.error(message);
    throw error;
  }
};

/**
 * Training status for a tenant (GET `/api/training/status/` when `BACKEND_URL` ends with `/api/`).
 * Sends `tenant_id` as a query parameter.
 */
export const getChatTrainingStatus = async (
  tenantId: string
): Promise<ChatTrainingStatusResponse> => {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    const response = await axiosInstance.get<ChatTrainingStatusResponse>(
      "/training/status/",
      {
        params: { tenant_id: id },
      }
    );

    if (response.data?.error) {
      throw new Error(
        typeof response.data.error === "string"
          ? response.data.error
          : "Failed to fetch training status"
      );
    }

    if (response.data == null) {
      throw new Error("Failed to fetch training status");
    }

    return response.data;
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };
    const errorMsg =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "Failed to fetch training status. Please try again.";

    throw new Error(
      typeof errorMsg === "string" ? errorMsg : "Failed to fetch training status. Please try again."
    );
  }
};

/** KPI bucket on GET `/chat/tenant/dashboard`. */
export interface TenantDashboardKpiBucket {
  queries: number;
  tokens: number;
  cost: string;
  failed: number;
}

export interface TenantDashboardTrendPoint {
  date: string;
  queries: number;
  cost: string;
  tokens: number;
}

export interface TenantDashboardTopUser {
  user_id: string;
  display_name: string;
  queries: number;
  tokens: number;
  cost: string;
}

export interface TenantDashboardKb {
  tenant_faqs: number;
  global_faqs: number;
  files: number;
  is_trained: boolean;
  last_training: string | null;
}

export interface TenantDashboardTopQuestion {
  question: string;
  asks: number;
  unique_users: number;
  avg_cost: string;
  served_by_rag_pct: number;
  served_by_tool_pct: number;
}

export interface TenantDashboardRecentConversation {
  thread_id?: string;
  thread?: string;
  title?: string;
  user_id?: string;
  display_name?: string;
  user?: string;
  last_activity?: string;
}

export interface TenantDashboardRateLimit {
  per_minute_used: number;
  per_minute_limit: number;
  per_minute_remaining: number;
  per_day_used: number;
  per_day_limit: number;
  per_day_remaining: number;
}

export interface TenantChatDashboardResponse {
  tenant_id: string;
  company_name: string;
  generated_at: string;
  kpis: {
    today: TenantDashboardKpiBucket;
    yesterday: TenantDashboardKpiBucket;
    this_month: TenantDashboardKpiBucket;
    active_users_7d: number;
  };
  trend_30d: TenantDashboardTrendPoint[];
  top_users: TenantDashboardTopUser[];
  kb: TenantDashboardKb;
  recent_conversations: TenantDashboardRecentConversation[];
  top_questions_7d: TenantDashboardTopQuestion[];
  recent_failures: unknown[];
  rate_limit: TenantDashboardRateLimit;
}

/**
 * Tenant analytics dashboard (GET `/api/chat/tenant/dashboard` when `BACKEND_URL` ends with `/api/`).
 * Optional `tenant_id` query scopes the dashboard to a tenant.
 */
export const getTenantChatDashboard = async (
  tenantId?: string,
): Promise<TenantChatDashboardResponse> => {
  try {
    const params: Record<string, string> = {};
    const id = tenantId?.trim();
    if (id) params.tenant_id = id;

    const response = await axiosInstance.get<TenantChatDashboardResponse>(
      "/chat/tenant/dashboard",
      { params },
    );

    if (response.data == null) {
      throw new Error("Failed to load tenant dashboard");
    }

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      chatApiErrorMessage(
        error,
        "Failed to load tenant dashboard. Please try again.",
      ),
    );
  }
};

export interface AdminDashboardKpiBucket {
  queries: number;
  tokens: number;
  cost: string;
  failed: number;
}

export interface AdminDashboardTrendPoint {
  date: string;
  queries: number;
  cost: string;
  tokens: number;
}

export interface AdminDashboardTopTenant {
  tenant_id: string;
  name: string;
  queries: number;
  tokens: number;
  cost: string;
  failed: number;
}

export interface AdminDashboardTopUser {
  tenant_id: string;
  user_id: string;
  display_name: string;
  queries: number;
  tokens: number;
  cost: string;
}

export interface AdminDashboardModelMix {
  model_used: string;
  queries: number;
  cost: string;
}

export interface AdminDashboardTypeMix {
  call_type: string;
  queries: number;
  cost: string;
}

export interface AdminDashboardTenantRow {
  tenant_id: string;
  name: string;
  last_activity: string;
  month_cost: string;
  month_queries: number;
}

export interface AdminDashboardTopQuestion {
  question: string;
  asks: number;
  unique_users: number;
  served_by_rag_pct: number;
  served_by_tool_pct: number;
}

export interface AdminChatDashboardResponse {
  generated_at: string;
  kpis: {
    today: AdminDashboardKpiBucket;
    yesterday: AdminDashboardKpiBucket;
    this_month: AdminDashboardKpiBucket;
    active_tenants_7d: number;
    active_users_7d: number;
  };
  trend_30d: AdminDashboardTrendPoint[];
  top_tenants: AdminDashboardTopTenant[];
  top_users: AdminDashboardTopUser[];
  model_mix: AdminDashboardModelMix[];
  type_mix: AdminDashboardTypeMix[];
  tenants: AdminDashboardTenantRow[];
  top_questions_7d: AdminDashboardTopQuestion[];
  recent_failures: unknown[];
}

/**
 * Admin analytics dashboard (GET `/api/chat/admin/dashboard` when `BACKEND_URL` ends with `/api/`).
 */
export interface TenantChatSettingsBudget {
  spend: string;
  budget: string | null;
  used_pct: number;
  is_unlimited: boolean;
  is_exhausted: boolean;
  threshold_pct: number;
  resets_on: string;
}

export interface TenantChatSettingsModelOption {
  id?: string;
  value?: string;
  model?: string;
  label?: string;
  name?: string;
}

export interface TenantChatSettingsOverrides {
  user_per_minute?: number | null;
  user_per_day?: number | null;
  tenant_per_minute?: number | null;
  tenant_per_day?: number | null;
  input_cost_per_million?: string | null;
  output_cost_per_million?: string | null;
  monthly_budget_usd?: string | null;
  threshold_pct?: number | null;
  model_name?: string | null;
}

export interface TenantChatSettingsDefaults {
  rate_limits?: {
    user_per_minute?: number;
    user_per_day?: number;
    tenant_per_minute?: number;
    tenant_per_day?: number;
  };
  pricing_default_model?: string;
  pricing?: {
    input_cost_per_million?: string;
    output_cost_per_million?: string;
  };
  pricing_table?: Record<
    string,
    { input?: string; output?: string }
  >;
  available_models?: string[];
}

export interface TenantChatSettingsUpdateRequest {
  overrides: TenantChatSettingsOverrides;
}

export interface TenantChatSettingsResponse {
  tenant_id?: string;
  overrides?: TenantChatSettingsOverrides;
  defaults?: TenantChatSettingsDefaults;
  updated_at?: string | null;
  budget?: TenantChatSettingsBudget;
  /** Legacy flat shape (still accepted by the mapper). */
  user_per_minute?: number;
  user_per_day?: number;
  tenant_per_minute?: number;
  tenant_per_day?: number;
  rate_limits?: TenantChatSettingsDefaults["rate_limits"];
  available_models?: Array<string | TenantChatSettingsModelOption>;
  openai_model?: string;
  model?: string;
  pricing?: TenantChatSettingsDefaults["pricing"];
}

function isTenantChatSettingsResponse(
  value: unknown,
): value is TenantChatSettingsResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    "defaults" in value ||
    "overrides" in value ||
    "budget" in value ||
    "rate_limits" in value
  );
}

function unwrapTenantChatSettingsBody(
  data: unknown,
): TenantChatSettingsResponse | null {
  if (data == null) {
    return null;
  }
  if (isTenantChatSettingsResponse(data)) {
    return data;
  }
  if (!isRecord(data)) {
    return null;
  }
  for (const key of ["data", "settings", "result"] as const) {
    const nested = data[key];
    if (isTenantChatSettingsResponse(nested)) {
      return nested;
    }
  }
  return null;
}

/**
 * Tenant chat settings (GET `/api/chat/tenant/settings` when `BACKEND_URL` ends with `/api/`).
 * Returns `null` when the API responds with 404 or an empty body — callers apply defaults.
 */
export const getTenantChatSettings = async (
  tenantId?: string,
): Promise<TenantChatSettingsResponse | null> => {
  try {
    const params: Record<string, string> = {};
    const id = tenantId?.trim();
    if (id) params.tenant_id = id;

    const response = await axiosInstance.get<TenantChatSettingsResponse>(
      "/chat/tenant/settings",
      {
        params,
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
      },
    );

    if (response.status === 404 || response.data == null) {
      return null;
    }

    return unwrapTenantChatSettingsBody(response.data);
  } catch (error: unknown) {
    if (httpErrorStatus(error) === 404) return null;
    throw new Error(
      chatApiErrorMessage(
        error,
        "Failed to load chat settings. Please try again.",
      ),
    );
  }
};

/**
 * Save tenant chat overrides (PUT `/api/chat/tenant/settings` when `BACKEND_URL` ends with `/api/`).
 */
export const updateTenantChatSettings = async (
  payload: TenantChatSettingsUpdateRequest,
  tenantId?: string,
): Promise<TenantChatSettingsResponse> => {
  try {
    const params: Record<string, string> = {};
    const id = tenantId?.trim();
    if (id) params.tenant_id = id;

    const response = await axiosInstance.put<TenantChatSettingsResponse>(
      "/chat/tenant/settings",
      payload,
      { params },
    );

    if (response.data == null) {
      throw new Error("Failed to save chat settings");
    }

    const settings = unwrapTenantChatSettingsBody(response.data);
    if (!settings) {
      throw new Error("Failed to save chat settings");
    }
    return settings;
  } catch (error: unknown) {
    throw new Error(
      chatApiErrorMessage(
        error,
        "Failed to save chat settings. Please try again.",
      ),
    );
  }
};

export const getAdminChatDashboard = async (): Promise<AdminChatDashboardResponse> => {
  try {
    const response = await axiosInstance.get<AdminChatDashboardResponse>(
      "/chat/admin/dashboard",
    );

    if (response.data == null) {
      throw new Error("Failed to load admin dashboard");
    }

    return response.data;
  } catch (error: unknown) {
    throw new Error(
      chatApiErrorMessage(
        error,
        "Failed to load admin dashboard. Please try again.",
      ),
    );
  }
};
