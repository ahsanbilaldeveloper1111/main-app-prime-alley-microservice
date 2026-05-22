import { toast } from "react-toastify";
import axiosInstance from "./axios";
import {
  httpErrorStatus,
  parseHttpRetryAfterSeconds,
  rateLimitUserMessage,
  type ChatRateLimitErrorBody,
} from "./httpRetryAfter";

export type { ChatRateLimitErrorBody } from "./httpRetryAfter";

const tenant_id = "tenant_123";

/** Tenant FAQ CRUD base path (`GET/POST/DELETE /api/chat/tenant-faqs` when `BACKEND_URL` ends with `/api/`). */
const TENANT_FAQS_API_PATH = "/chat/tenant-faqs";

/** AI assistant thread API (`GET/POST /api/chat/` when `BACKEND_URL` ends with `/api/`). */
const CHAT_ASSISTANT_API_PATH = "/chat/";

/** AI assistant conversation list (`GET /api/chat/conversations` when `BACKEND_URL` ends with `/api/`). */
const CHAT_CONVERSATIONS_API_PATH = "/chat/conversations";

/** Bot training API (`POST /api/chat/training` when `BACKEND_URL` ends with `/api/`). */
const CHAT_TRAINING_API_PATH = "/chat/training";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Thrown when `POST/GET /api/chat/` returns HTTP 429. */
export class ChatRateLimitedError extends Error {
  readonly status = 429;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message?: string) {
    const seconds = Math.max(1, Math.floor(retryAfterSeconds));
    super(message ?? rateLimitUserMessage(seconds));
    this.name = "ChatRateLimitedError";
    this.retryAfterSeconds = seconds;
  }
}

export function isChatRateLimitedError(
  error: unknown,
): error is ChatRateLimitedError {
  return error instanceof ChatRateLimitedError;
}

/** POST `/api/chat/` when the caller's per-user monthly budget is exhausted. */
export const CHAT_USER_BUDGET_EXHAUSTED_CODE = "user_budget_exhausted";

/** Legacy POST `/chat/` code during rollout; prefer {@link CHAT_USER_BUDGET_EXHAUSTED_CODE}. */
const CHAT_LEGACY_BUDGET_EXHAUSTED_CODE = "budget_exhausted";

/** @deprecated Use {@link CHAT_LEGACY_BUDGET_EXHAUSTED_CODE} via {@link isChatUserBudgetExhaustedCode}. */
export const CHAT_BUDGET_EXHAUSTED_CODE_LEGACY = CHAT_LEGACY_BUDGET_EXHAUSTED_CODE;

export const CHAT_USER_BUDGET_EXHAUSTED_DEFAULT_MESSAGE =
  "You've reached your monthly chat budget. Please contact your administrator to raise it.";

export interface ChatBudgetStatus {
  user_id?: string;
  [key: string]: unknown;
}

/** Thrown when POST `/api/chat/` rejects due to per-user budget exhaustion (typically non-2xx). */
export class ChatUserBudgetExhaustedError extends Error {
  readonly code = CHAT_USER_BUDGET_EXHAUSTED_CODE;
  readonly budgetStatus: ChatBudgetStatus | undefined;
  readonly userId: string | undefined;

  constructor(
    message?: string,
    budgetStatus?: ChatBudgetStatus,
    userId?: string,
  ) {
    super(message ?? CHAT_USER_BUDGET_EXHAUSTED_DEFAULT_MESSAGE);
    this.name = "ChatUserBudgetExhaustedError";
    this.budgetStatus = budgetStatus;
    this.userId =
      userId ??
      (typeof budgetStatus?.user_id === "string"
        ? budgetStatus.user_id
        : undefined);
  }
}

export function isChatUserBudgetExhaustedError(
  error: unknown,
): error is ChatUserBudgetExhaustedError {
  return error instanceof ChatUserBudgetExhaustedError;
}

export function isChatUserBudgetExhaustedCode(
  code: string | undefined,
): boolean {
  return (
    code === CHAT_USER_BUDGET_EXHAUSTED_CODE ||
    code === CHAT_LEGACY_BUDGET_EXHAUSTED_CODE
  );
}

function readChatApiCode(data: Record<string, unknown>): string | undefined {
  if (typeof data.code === "string" && data.code.trim()) {
    return data.code.trim();
  }
  const metadata = data.metadata;
  if (isRecord(metadata) && typeof metadata.code === "string" && metadata.code.trim()) {
    return metadata.code.trim();
  }
  return undefined;
}

function readChatBudgetStatus(
  data: Record<string, unknown>,
): ChatBudgetStatus | undefined {
  const metadata = data.metadata;
  if (!isRecord(metadata)) {
    return undefined;
  }
  const budgetStatus = metadata.budget_status;
  if (!isRecord(budgetStatus)) {
    return undefined;
  }
  return budgetStatus;
}

function readChatApiResponseMessage(data: Record<string, unknown>): string | undefined {
  if (typeof data.response === "string" && data.response.trim()) {
    return data.response.trim();
  }
  return undefined;
}

function parseChatUserBudgetExhaustedFromBody(
  data: unknown,
): ChatUserBudgetExhaustedError | null {
  if (!isRecord(data)) {
    return null;
  }
  const code = readChatApiCode(data);
  if (!isChatUserBudgetExhaustedCode(code)) {
    return null;
  }
  const budgetStatus = readChatBudgetStatus(data);
  const message =
    readChatApiResponseMessage(data) ?? CHAT_USER_BUDGET_EXHAUSTED_DEFAULT_MESSAGE;
  return new ChatUserBudgetExhaustedError(message, budgetStatus);
}

/** True when a successful POST body includes a per-user budget exhaustion code. */
export function isChatUserBudgetExhaustedResponse(
  data: ChatSendMessageResponse | null | undefined,
): boolean {
  if (!data || !isRecord(data)) {
    return false;
  }
  return isChatUserBudgetExhaustedCode(readChatApiCode(data));
}

function chatRateLimitMessageFromError(error: unknown): string {
  if (isRecord(error)) {
    const response = error.response;
    if (isRecord(response) && isRecord(response.data)) {
      const body = response.data as ChatRateLimitErrorBody;
      if (typeof body.message === "string" && body.message.trim()) {
        return body.message.trim();
      }
      if (typeof body.error === "string" && body.error.trim()) {
        return body.error.trim();
      }
    }
  }
  const seconds = parseHttpRetryAfterSeconds(error) ?? 1;
  return rateLimitUserMessage(seconds);
}

function rethrowChatApiError(error: unknown, fallback: string): never {
  if (httpErrorStatus(error) === 429) {
    const retryAfter = parseHttpRetryAfterSeconds(error) ?? 1;
    const rateErr = new ChatRateLimitedError(
      retryAfter,
      chatRateLimitMessageFromError(error),
    );
    toast.error(rateErr.message);
    throw rateErr;
  }
  if (isRecord(error)) {
    const axiosData = error.response;
    if (isRecord(axiosData) && isRecord(axiosData.data)) {
      const budgetErr = parseChatUserBudgetExhaustedFromBody(axiosData.data);
      if (budgetErr) {
        toast.error(budgetErr.message);
        throw budgetErr;
      }
    }
  }
  toast.error(chatApiErrorMessage(error, fallback));
  throw error;
}

function messageFromAxiosErrorData(
  data: Record<string, unknown>,
): string | undefined {
  const budgetErr = parseChatUserBudgetExhaustedFromBody(data);
  if (budgetErr) {
    return budgetErr.message;
  }
  const responseMessage = readChatApiResponseMessage(data);
  if (responseMessage) {
    return responseMessage;
  }
  const apiError = data.error;
  if (typeof apiError === "string" && apiError.trim()) {
    return apiError.trim();
  }
  const apiMessage = data.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }
  return undefined;
}

function chatApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  if (!isRecord(error)) {
    return fallback;
  }
  const response = error.response;
  if (isRecord(response) && isRecord(response.data)) {
    const fromData = messageFromAxiosErrorData(response.data);
    if (fromData) {
      return fromData;
    }
  }
  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
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
  /** Present when per-user (or tenant) budget limits apply to the turn. */
  budget_status?: ChatBudgetStatus;
}

export interface ChatSendMessageResponse {
  response: string;
  tenant_id: string;
  thread_id: string;
  metadata: ChatSendMetadata;
  error?: string;
  /** e.g. `user_budget_exhausted` when the caller cannot consume more budget. */
  code?: string;
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

export interface ChatConversationSummary {
  thread_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface ChatConversationsResponse {
  tenant_id: string;
  count: number;
  conversations: ChatConversationSummary[];
  error?: string;
}

export type ChatAssistantConversationListItem = {
  id: string;
  title: string;
  timestamp: Date;
  threadId: string;
  messageCount: number;
  isActive: boolean;
};

function readChatStringField(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function readChatNumberField(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeChatConversationSummary(
  raw: unknown,
): ChatConversationSummary | null {
  if (!isRecord(raw)) {
    return null;
  }
  const thread_id =
    readChatStringField(raw.thread_id) || readChatStringField(raw.threadId);
  if (!thread_id) {
    return null;
  }
  return {
    thread_id,
    title: readChatStringField(raw.title) || "New Chat",
    message_count:
      readChatNumberField(raw.message_count) ??
      readChatNumberField(raw.messageCount) ??
      0,
    created_at:
      readChatStringField(raw.created_at) || readChatStringField(raw.createdAt),
    updated_at:
      readChatStringField(raw.updated_at) || readChatStringField(raw.updatedAt),
    is_active: raw.is_active !== false && raw.isActive !== false,
  };
}

/** Unwrap list payloads that may be nested under `data` or use alternate array keys. */
export function unwrapChatConversationsResponse(
  data: unknown,
): ChatConversationsResponse {
  if (!isRecord(data)) {
    return { tenant_id: "", count: 0, conversations: [] };
  }

  const inner = isRecord(data.data) ? data.data : data;
  let rawList: unknown[] = [];
  if (Array.isArray(inner.conversations)) {
    rawList = inner.conversations;
  } else if (Array.isArray(inner.results)) {
    rawList = inner.results;
  } else if (Array.isArray(data.conversations)) {
    rawList = data.conversations;
  }

  const conversations = rawList
    .map(normalizeChatConversationSummary)
    .filter((item): item is ChatConversationSummary => item !== null);

  return {
    tenant_id:
      readChatStringField(inner.tenant_id) || readChatStringField(inner.tenantId),
    count: readChatNumberField(inner.count) ?? conversations.length,
    conversations,
    error: readChatStringField(inner.error) || readChatStringField(data.error) || undefined,
  };
}

export function mapChatConversationsToListItems(
  conversations: ChatConversationSummary[],
): ChatAssistantConversationListItem[] {
  return [...conversations]
    .filter((c) => Boolean(c.thread_id?.trim()))
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at || 0).getTime() -
        new Date(a.updated_at || a.created_at || 0).getTime(),
    )
    .map((c) => ({
      id: c.thread_id,
      threadId: c.thread_id,
      title: c.title?.trim() || "New Chat",
      timestamp: new Date(c.updated_at || c.created_at || Date.now()),
      messageCount: c.message_count,
      isActive: c.is_active,
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
 * (i.e. `/api/chat/training`). Full stats on normal training; reconcile-only tenants
 * may return only `{ message }` (vector store pruned, no FAQs/files left).
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

/** GET `/chat/training/status` — tenant-scoped bot training metadata (when `BACKEND_URL` ends with `/api/`). */
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
 * List assistant conversations for the current tenant/user (GET `/api/chat/conversations`).
 */
export const getChatConversations = async (): Promise<ChatConversationsResponse> => {
  try {
    const response = await axiosInstance.get<unknown>(CHAT_CONVERSATIONS_API_PATH);
    const body = unwrapChatConversationsResponse(response.data);
    if (body.error) {
      throw new Error(body.error || "Failed to load conversations");
    }
    return body;
  } catch (error: unknown) {
    rethrowChatApiError(
      error,
      "Failed to load chat conversations. Please try again.",
    );
  }
};

function chatConversationDeletePath(tenantId: string, threadId: string): string {
  return `${CHAT_CONVERSATIONS_API_PATH}/${encodeURIComponent(tenantId.trim())}/${encodeURIComponent(threadId.trim())}`;
}

/**
 * Delete an assistant conversation (DELETE `/api/chat/conversations/{tenantId}/{threadId}`).
 */
export const deleteChatConversation = async (
  tenantId: string,
  threadId: string,
): Promise<void> => {
  const tenant = tenantId.trim();
  const thread = threadId.trim();
  if (!tenant) {
    throw new Error("Tenant id is required");
  }
  if (!thread) {
    throw new Error("Thread id is required");
  }
  try {
    const response = await axiosInstance.delete<unknown>(
      chatConversationDeletePath(tenant, thread),
    );
    if (isRecord(response.data)) {
      const err = readChatStringField(response.data.error);
      if (err) {
        throw new Error(err);
      }
    }
    toast.success("Conversation deleted.");
  } catch (error: unknown) {
    rethrowChatApiError(
      error,
      "Failed to delete conversation. Please try again.",
    );
  }
};

/**
 * Load an existing assistant thread (GET `/api/chat/?thread_id=…`).
 */
export const getChatThread = async (
  threadId: string,
): Promise<ChatThreadResponse> => {
  const id = threadId.trim();
  if (!id) {
    throw new Error("Thread id is required");
  }
  try {
    const response = await axiosInstance.get<ChatThreadResponse>(
      CHAT_ASSISTANT_API_PATH,
      {
        params: { thread_id: id },
      },
    );
    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to load chat thread");
    }
    return response.data;
  } catch (error: unknown) {
    rethrowChatApiError(error, "Failed to load conversation. Please try again.");
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
    rethrowChatApiError(
      error,
      "An error occurred while processing your request. Please try again.",
    );
  }
};

/**
 * Submit a chat survey/feedback
 * @param payload - Survey payload containing rating, feedback, thread_id, and tenant_id
 * @returns Promise with survey response
 */
export const submitChatSurvey = async (
  payload: ChatSurveyPayload,
): Promise<ChatSurveyResponse> => {
  try {
    const response = await axiosInstance.post<ChatSurveyResponse>(
      "/chat/survey",
      payload,
    );

    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || "An error occurred");
    }

    return response.data;
  } catch (error: any) {
    console.error("Survey submission error:", error);
    // Don't show toast for survey errors to avoid interrupting user flow
    throw error;
  }
};

type TenantFaqGetBody =
  | TenantFaqListResponse
  | FAQData[]
  | { data?: FAQData[]; error?: string };

function faqsArrayFromTenantGetBody(
  body: TenantFaqGetBody | null | undefined,
): FAQData[] {
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
      typeof o.error === "string" ? o.error : "Failed to fetch tenant FAQs",
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
export const getTenantFAQs = async (
  tenantId?: string,
  search?: string,
): Promise<FAQData[]> => {
  try {
    const body = await getTenantFAQsList(tenantId, search);
    return faqsArrayFromTenantGetBody(body);
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(
        error,
        "Failed to fetch tenant FAQs. Please try again.",
      ),
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
  payload: CreateTenantFAQPayload,
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
      formData,
    );

    // Check if response contains an error
    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to create tenant FAQs");
    }

    toast.success(
      response.data?.message?.trim() || "Tenant FAQs created successfully",
    );
    return response.data;
  } catch (error: unknown) {
    toast.error(
      chatApiErrorMessage(
        error,
        "Failed to create tenant FAQs. Please try again.",
      ),
    );
    throw error;
  }
};

function faqSideDeleteSuccessMessage(
  side: "Tenant" | "Global",
  params: DeleteTenantFAQParams | DeleteGlobalFAQParams,
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
  params: DeleteTenantFAQParams | DeleteGlobalFAQParams,
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
      chatApiErrorMessage(
        error,
        "Failed to delete tenant FAQ. Please try again.",
      ),
    );
    throw error;
  }
};

type GlobalFaqGetBody =
  | GlobalFaqListResponse
  | FAQData[]
  | { data?: FAQData[]; error?: string };

function faqsArrayFromGlobalGetBody(
  body: GlobalFaqGetBody | null | undefined,
): FAQData[] {
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
      typeof o.error === "string" ? o.error : "Failed to fetch global FAQs",
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
  payload: CreateGlobalFAQPayload,
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
      formData,
    );

    if (response.data?.error) {
      throw new Error(response.data.error || "Failed to create global FAQs");
    }

    toast.success(
      response.data?.message?.trim() || "Global FAQs created successfully",
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
export const deleteGlobalFAQ = async (
  params: DeleteGlobalFAQParams,
): Promise<void> => {
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

const EMPTY_TRAINING_DOCUMENT_STATS: ChatTrainingDocumentStats = {
  files: 0,
  chunks: 0,
};

const EMPTY_TRAINING_FAQ_STATS: ChatTrainingFaqStats = {
  count: 0,
  chunks: 0,
};

function readNonNegativeInt(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return 0;
}

function pickFirstDefined(...values: unknown[]): unknown {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
}

function readTrainingDocumentStats(
  value: unknown,
): ChatTrainingDocumentStats {
  if (!isRecord(value)) {
    return EMPTY_TRAINING_DOCUMENT_STATS;
  }
  return {
    files: readNonNegativeInt(
      pickFirstDefined(
        value.files,
        value.file_count,
        value.fileCount,
        value.documents,
        value.document_count,
        value.count,
      ),
    ),
    chunks: readNonNegativeInt(
      pickFirstDefined(
        value.chunks,
        value.chunk_count,
        value.chunkCount,
        value.total_chunks,
      ),
    ),
  };
}

function readTrainingFaqStats(value: unknown): ChatTrainingFaqStats {
  if (!isRecord(value)) {
    return EMPTY_TRAINING_FAQ_STATS;
  }
  return {
    count: readNonNegativeInt(
      pickFirstDefined(
        value.count,
        value.faq_count,
        value.faqCount,
        value.faqs,
        value.files,
      ),
    ),
    chunks: readNonNegativeInt(
      pickFirstDefined(value.chunks, value.chunk_count, value.chunkCount),
    ),
  };
}

function readTrainingDocumentStatsFromRaw(
  raw: Record<string, unknown>,
  scope: "tenant" | "global",
): ChatTrainingDocumentStats {
  const nestedKey = scope === "tenant" ? "tenant_documents" : "global_documents";
  const nestedCamel =
    scope === "tenant" ? "tenantDocuments" : "globalDocuments";
  const nested = readTrainingDocumentStats(
    pickFirstDefined(raw[nestedKey], raw[nestedCamel]),
  );
  if (nested.files > 0 || nested.chunks > 0) {
    return nested;
  }

  const prefix = scope === "tenant" ? "tenant" : "global";
  return {
    files: readNonNegativeInt(
      pickFirstDefined(
        raw[`${prefix}_document_files`],
        raw[`${prefix}_files`],
        raw[`${prefix}_document_count`],
      ),
    ),
    chunks: readNonNegativeInt(
      pickFirstDefined(
        raw[`${prefix}_document_chunks`],
        raw[`${prefix}_chunks`],
        raw[`${prefix}_document_chunk_count`],
      ),
    ),
  };
}

function readTrainingFaqStatsFromRaw(
  raw: Record<string, unknown>,
  scope: "tenant" | "global",
): ChatTrainingFaqStats {
  const nestedKey = scope === "tenant" ? "tenant_faqs" : "global_faqs";
  const nestedCamel = scope === "tenant" ? "tenantFaqs" : "globalFaqs";
  const nested = readTrainingFaqStats(
    pickFirstDefined(raw[nestedKey], raw[nestedCamel]),
  );
  if (nested.count > 0 || nested.chunks > 0) {
    return nested;
  }

  const prefix = scope === "tenant" ? "tenant" : "global";
  return {
    count: readNonNegativeInt(
      pickFirstDefined(raw[`${prefix}_faq_count`], raw[`${prefix}_faqs`]),
    ),
    chunks: readNonNegativeInt(
      pickFirstDefined(raw[`${prefix}_faq_chunks`], raw[`${prefix}_faq_chunk_count`]),
    ),
  };
}

function isChatTrainingReconcilePayload(data: Record<string, unknown>): boolean {
  const message =
    typeof data.message === "string" ? data.message.toLowerCase() : "";
  return message.includes("emptied") && message.includes("reconcil");
}

export type ChatTrainingResultLine = Readonly<{
  label: string;
  value: string;
}>;

function normalizeChatTrainingResponseBody(
  raw: Record<string, unknown>,
): ChatTrainingResponse {
  const message = typeof raw.message === "string" ? raw.message : "";
  const tenantId = typeof raw.tenant_id === "string" ? raw.tenant_id : "";
  const chunkSize = typeof raw.chunk_size === "number" ? raw.chunk_size : 0;
  const chunkOverlap =
    typeof raw.chunk_overlap === "number" ? raw.chunk_overlap : 0;

  if (isChatTrainingReconcilePayload(raw)) {
    return {
      message,
      tenant_id: tenantId,
      chunk_size: chunkSize,
      chunk_overlap: chunkOverlap,
      tenant_documents: EMPTY_TRAINING_DOCUMENT_STATS,
      global_documents: EMPTY_TRAINING_DOCUMENT_STATS,
      tenant_faqs: EMPTY_TRAINING_FAQ_STATS,
      global_faqs: EMPTY_TRAINING_FAQ_STATS,
      total_chunks: 0,
      vector_store_info: isRecord(raw.vector_store_info)
        ? raw.vector_store_info
        : {},
    };
  }

  const tenantDocuments = readTrainingDocumentStatsFromRaw(raw, "tenant");
  const globalDocuments = readTrainingDocumentStatsFromRaw(raw, "global");
  const tenantFaqs = readTrainingFaqStatsFromRaw(raw, "tenant");
  const globalFaqs = readTrainingFaqStatsFromRaw(raw, "global");

  const totalChunks = readNonNegativeInt(
    pickFirstDefined(raw.total_chunks, raw.totalChunks),
  );

  return {
    message,
    tenant_id: tenantId,
    chunk_size: chunkSize,
    chunk_overlap: chunkOverlap,
    tenant_documents: tenantDocuments,
    global_documents: globalDocuments,
    tenant_faqs: tenantFaqs,
    global_faqs: globalFaqs,
    total_chunks: totalChunks,
    vector_store_info: isRecord(raw.vector_store_info)
      ? raw.vector_store_info
      : {},
    error: typeof raw.error === "string" ? raw.error : undefined,
  };
}

function unwrapChatTrainingResponse(data: unknown): ChatTrainingResponse {
  if (!isRecord(data)) {
    throw new Error("Invalid training response");
  }
  const nested =
    (isRecord(data.data) ? data.data : undefined) ??
    (isRecord(data.result) ? data.result : undefined) ??
    (isRecord(data.body) ? data.body : undefined) ??
    (isRecord(data.payload) ? data.payload : undefined);
  const raw = isRecord(nested) ? nested : data;
  return normalizeChatTrainingResponseBody(raw);
}

/** Structured rows for training success UI (tenant/global documents and FAQs). */
export function getChatTrainingResultLines(
  response: ChatTrainingResponse,
): ChatTrainingResultLine[] {
  const apiMessage = response.message?.trim();
  if (isChatTrainingReconciledResponse(response) && apiMessage) {
    return [{ label: "Status", value: apiMessage }];
  }

  const lines: ChatTrainingResultLine[] = [
    {
      label: "Tenant documents",
      value: `${response.tenant_documents.files} file(s), ${response.tenant_documents.chunks} chunk(s)`,
    },
    {
      label: "Global documents",
      value: `${response.global_documents.files} file(s), ${response.global_documents.chunks} chunk(s)`,
    },
    {
      label: "Tenant FAQs",
      value: `${response.tenant_faqs.count} FAQ(s), ${response.tenant_faqs.chunks} chunk(s)`,
    },
    {
      label: "Global FAQs",
      value: `${response.global_faqs.count} FAQ(s), ${response.global_faqs.chunks} chunk(s)`,
    },
    {
      label: "Total chunks",
      value: String(response.total_chunks),
    },
  ];

  if (apiMessage) {
    lines.unshift({ label: "Summary", value: apiMessage });
  }

  return lines;
}

/** True when POST `/api/chat/training` reconciled an existing vector store with no content left. */
export function isChatTrainingReconciledResponse(
  response: ChatTrainingResponse,
): boolean {
  const message = response.message?.toLowerCase() ?? "";
  return message.includes("emptied") && message.includes("reconcil");
}

/** User-facing summary for training success modal and inline copy. */
export function formatChatTrainingResultMessage(
  response: ChatTrainingResponse,
): string {
  return getChatTrainingResultLines(response)
    .map((line) => `${line.label}: ${line.value}`)
    .join(" · ");
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
      CHAT_TRAINING_API_PATH,
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
 * Training status for a tenant (GET `/api/chat/training/status` when `BACKEND_URL` ends with `/api/`).
 * Sends `tenant_id` as a query parameter.
 */
export const getChatTrainingStatus = async (
  tenantId: string,
): Promise<ChatTrainingStatusResponse> => {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    const response = await axiosInstance.get<ChatTrainingStatusResponse>(
      "/chat/training/status",
      {
        params: { tenant_id: id },
      },
    );

    if (response.data?.error) {
      throw new Error(
        typeof response.data.error === "string"
          ? response.data.error
          : "Failed to fetch training status",
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
      typeof errorMsg === "string"
        ? errorMsg
        : "Failed to fetch training status. Please try again.",
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
  user_id?: string;
  title?: string;
  updated_at?: string;
  display_name?: string;
  /** LLM for the last turn; empty when none recorded. */
  model_used?: string;
  /** Tenant-charged thread cost (margin included); `"0"` when none. */
  cost?: string;
  /** @deprecated Prefer `updated_at`. */
  last_activity?: string;
  thread?: string;
  user?: string;
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
}

/** Tenant dashboard API (`GET /api/chat/tenant/dashboard` when `BACKEND_URL` ends with `/api/`). */
const CHAT_TENANT_DASHBOARD_API_PATH = "/chat/tenant/dashboard";

/**
 * Tenant analytics dashboard (GET `/api/chat/tenant/dashboard` when `BACKEND_URL` ends with `/api/`).
 * Optional `tenant_id` query scopes the dashboard to a tenant.
 */
export type TenantChatUserBudgetSource =
  | "user"
  | "tenant_default"
  | "global_default"
  | "unlimited"
  | (string & {});

export interface TenantChatUserRow {
  user_id: string;
  display_name: string;
  monthly_budget_usd: string | null;
  budget_threshold_pct: number | null;
  effective_budget_usd: string;
  effective_threshold_pct: number;
  mtd_spend: string;
  remaining_usd: string;
  used_pct: number;
  is_exhausted: boolean;
  budget_source: TenantChatUserBudgetSource;
  budget_synced_at: string | null;
  last_seen: string | null;
}

export interface TenantChatUsersResponse {
  tenant_id: string;
  count: number;
  rows: TenantChatUserRow[];
}

/** Tenant user budgets (`GET /api/chat/tenant/users` when `BACKEND_URL` ends with `/api/`). */
const CHAT_TENANT_USERS_API_PATH = "/chat/tenant/users";

export const CHAT_TENANT_USERS_FETCH_ERROR_MESSAGE =
  "Having trouble fetching user budgets. Please try again later.";

/**
 * Per-user budget and usage rows for the tenant (GET `/api/chat/tenant/users`).
 * Optional `tenant_id` query scopes to a tenant (admin); omitted uses session tenant.
 */
export const getTenantChatUsers = async (
  tenantId?: string,
): Promise<TenantChatUsersResponse> => {
  try {
    const params: Record<string, string> = {};
    const id = tenantId?.trim();
    if (id) params.tenant_id = id;

    const response = await axiosInstance.get<TenantChatUsersResponse>(
      CHAT_TENANT_USERS_API_PATH,
      { params },
    );

    if (response.data == null) {
      throw new Error("Failed to load tenant users");
    }

    return {
      tenant_id: response.data.tenant_id ?? "",
      count: response.data.count ?? 0,
      rows: Array.isArray(response.data.rows) ? response.data.rows : [],
    };
  } catch {
    throw new Error(CHAT_TENANT_USERS_FETCH_ERROR_MESSAGE);
  }
};

/** Single chat user profile (`GET /api/chat/users/{tenantId}/{userId}`). */
const CHAT_USER_DETAIL_API_PATH = "/chat/users";

export const CHAT_USER_DETAIL_FETCH_ERROR_MESSAGE =
  "Having trouble loading your chat budget. Please try again later.";

export interface ChatUserDetailLifetime {
  queries: number;
  failed: number;
  tokens: number;
  cost: string;
  avg_cost: string;
}

export interface ChatUserDetailBudget {
  budget: string | null;
  spend: string;
  /** Resolved MTD remaining when the API provides it (tenant users list shape). */
  remaining_usd?: string | null;
  used_pct: number;
  is_unlimited: boolean;
  is_exhausted: boolean;
  threshold_pct: number;
  budget_source: TenantChatUserBudgetSource;
  synced_at: string | null;
}

export interface ChatUserDetailTrendPoint {
  date: string;
  queries: number;
  cost: string;
  tokens: number;
}

export interface ChatUserDetailResponse {
  tenant_id: string;
  user_id: string;
  display_name: string;
  first_seen: string;
  last_seen: string;
  lifetime: ChatUserDetailLifetime;
  preferred_model?: string;
  rate_limit_now?: Record<string, number>;
  limits?: Record<string, number>;
  trend_30d?: ChatUserDetailTrendPoint[];
  budget: ChatUserDetailBudget;
}

function normalizeChatUserDetailLifetime(raw: unknown): ChatUserDetailLifetime {
  if (!isRecord(raw)) {
    return { queries: 0, failed: 0, tokens: 0, cost: "0", avg_cost: "0" };
  }
  return {
    queries: readChatNumberField(raw.queries) ?? 0,
    failed: readChatNumberField(raw.failed) ?? 0,
    tokens: readChatNumberField(raw.tokens) ?? 0,
    cost: readChatStringField(raw.cost) || "0",
    avg_cost: readChatStringField(raw.avg_cost) || "0",
  };
}

function emptyChatUserDetailBudget(): ChatUserDetailBudget {
  return {
    budget: null,
    spend: "0",
    remaining_usd: null,
    used_pct: 0,
    is_unlimited: false,
    is_exhausted: false,
    threshold_pct: 0,
    budget_source: "tenant_default",
    synced_at: null,
  };
}

function pickChatStringFromRecords(
  records: readonly Record<string, unknown>[],
  ...keys: string[]
): string | null {
  for (const record of records) {
    for (const key of keys) {
      const value = readChatStringField(record[key]);
      if (value) return value;
    }
  }
  return null;
}

function pickChatNumberFromRecords(
  records: readonly Record<string, unknown>[],
  ...keys: string[]
): number | undefined {
  for (const record of records) {
    for (const key of keys) {
      const value = readChatNumberField(record[key]);
      if (value != null) return value;
    }
  }
  return undefined;
}

function pickChatBooleanFromRecords(
  records: readonly Record<string, unknown>[],
  key: string,
): boolean | undefined {
  for (const record of records) {
    if (record[key] === true) return true;
    if (record[key] === false) return false;
  }
  return undefined;
}

/** Normalize budget from nested `budget` and/or flat fields (same keys as tenant users rows). */
function normalizeChatUserDetailBudget(
  raw: unknown,
  flatFallback?: Record<string, unknown>,
): ChatUserDetailBudget {
  const records: Record<string, unknown>[] = [];
  if (isRecord(raw)) records.push(raw);
  if (flatFallback) records.push(flatFallback);
  if (records.length === 0) {
    return emptyChatUserDetailBudget();
  }

  const cap = pickChatStringFromRecords(
    records,
    "budget",
    "effective_budget_usd",
    "effective_budget",
    "monthly_budget_usd",
  );
  const spend =
    pickChatStringFromRecords(records, "spend", "mtd_spend") || "0";
  const remaining = pickChatStringFromRecords(
    records,
    "remaining_usd",
    "remaining",
  );
  const budgetSource =
    pickChatStringFromRecords(records, "budget_source") || "tenant_default";
  const isUnlimitedFlag = pickChatBooleanFromRecords(records, "is_unlimited");
  const isExhaustedFlag = pickChatBooleanFromRecords(records, "is_exhausted");

  return {
    budget: cap,
    spend,
    remaining_usd: remaining,
    used_pct: pickChatNumberFromRecords(records, "used_pct") ?? 0,
    is_unlimited:
      isUnlimitedFlag === true ||
      budgetSource.trim().toLowerCase() === "unlimited",
    is_exhausted: isExhaustedFlag === true,
    threshold_pct:
      pickChatNumberFromRecords(
        records,
        "threshold_pct",
        "effective_threshold_pct",
        "budget_threshold_pct",
      ) ?? 0,
    budget_source: budgetSource || "tenant_default",
    synced_at:
      pickChatStringFromRecords(records, "synced_at", "budget_synced_at") ||
      null,
  };
}

/** Unwrap user detail payloads nested under `data` or with alternate keys. */
export function unwrapChatUserDetailResponse(data: unknown): ChatUserDetailResponse {
  const inner = isRecord(data) && isRecord(data.data) ? data.data : data;
  if (!isRecord(inner)) {
    throw new Error("Invalid chat user detail response");
  }
  const budgetRaw =
    inner.budget ?? inner.mtd_budget ?? inner.user_budget ?? inner.budget_status;
  return {
    tenant_id:
      readChatStringField(inner.tenant_id) || readChatStringField(inner.tenantId),
    user_id: readChatStringField(inner.user_id) || readChatStringField(inner.userId),
    display_name: readChatStringField(inner.display_name) || "",
    first_seen: readChatStringField(inner.first_seen) || "",
    last_seen: readChatStringField(inner.last_seen) || "",
    lifetime: normalizeChatUserDetailLifetime(inner.lifetime),
    budget: normalizeChatUserDetailBudget(budgetRaw, inner),
  };
}

/**
 * Chat user detail including MTD budget (GET `/api/chat/users/{tenantId}/{userId}`).
 * `userId` should be the caller's extension (see `resolveChatAssistantUserId`).
 */
export const getChatUserDetail = async (
  tenantId: string,
  userId: string,
): Promise<ChatUserDetailResponse> => {
  const tid = tenantId.trim();
  const uid = userId.trim();
  if (!tid || !uid) {
    throw new Error("Tenant and user are required to load chat budget.");
  }

  try {
    const path = `${CHAT_USER_DETAIL_API_PATH}/${encodeURIComponent(tid)}/${encodeURIComponent(uid)}`;
    const response = await axiosInstance.get<unknown>(path);
    if (response.data == null) {
      throw new Error("Failed to load chat user");
    }
    return unwrapChatUserDetailResponse(response.data);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid chat user detail response") {
      throw error;
    }
    throw new Error(CHAT_USER_DETAIL_FETCH_ERROR_MESSAGE);
  }
};

function emptyTenantDashboardKpiBucket(): TenantDashboardKpiBucket {
  return { queries: 0, tokens: 0, cost: "0", failed: 0 };
}

function normalizeTenantDashboardKpiBucket(raw: unknown): TenantDashboardKpiBucket {
  if (!isRecord(raw)) {
    return emptyTenantDashboardKpiBucket();
  }
  return {
    queries: readChatNumberField(raw.queries) ?? 0,
    tokens: readChatNumberField(raw.tokens) ?? 0,
    cost: readChatStringField(raw.cost) || "0",
    failed: readChatNumberField(raw.failed) ?? 0,
  };
}

function normalizeTenantDashboardKpis(
  raw: unknown,
): TenantChatDashboardResponse["kpis"] {
  if (!isRecord(raw)) {
    const empty = emptyTenantDashboardKpiBucket();
    return {
      today: empty,
      yesterday: empty,
      this_month: empty,
      active_users_7d: 0,
    };
  }
  return {
    today: normalizeTenantDashboardKpiBucket(raw.today),
    yesterday: normalizeTenantDashboardKpiBucket(raw.yesterday),
    this_month: normalizeTenantDashboardKpiBucket(
      raw.this_month ?? raw.thisMonth,
    ),
    active_users_7d:
      readChatNumberField(raw.active_users_7d) ??
      readChatNumberField(raw.activeUsers7d) ??
      0,
  };
}

function normalizeTenantDashboardKb(raw: unknown): TenantDashboardKb {
  if (!isRecord(raw)) {
    return {
      tenant_faqs: 0,
      global_faqs: 0,
      files: 0,
      is_trained: false,
      last_training: null,
    };
  }
  return {
    tenant_faqs: readChatNumberField(raw.tenant_faqs) ?? 0,
    global_faqs: readChatNumberField(raw.global_faqs) ?? 0,
    files: readChatNumberField(raw.files) ?? 0,
    is_trained: raw.is_trained === true,
    last_training: readChatStringField(raw.last_training) || null,
  };
}

function normalizeTenantDashboardTrendPoint(
  raw: unknown,
): TenantDashboardTrendPoint | null {
  if (!isRecord(raw)) {
    return null;
  }
  const date = readChatStringField(raw.date);
  if (!date) {
    return null;
  }
  return {
    date,
    queries: readChatNumberField(raw.queries) ?? 0,
    cost: readChatStringField(raw.cost) || "0",
    tokens: readChatNumberField(raw.tokens) ?? 0,
  };
}

/** Unwrap tenant dashboard payloads nested under `data` or with partial KPI blocks. */
export function unwrapTenantChatDashboardResponse(
  data: unknown,
): TenantChatDashboardResponse {
  const inner = isRecord(data) && isRecord(data.data) ? data.data : data;
  if (!isRecord(inner)) {
    throw new Error("Invalid tenant dashboard response");
  }

  let trendRaw: unknown[] = [];
  if (Array.isArray(inner.trend_30d)) {
    trendRaw = inner.trend_30d;
  } else if (Array.isArray(inner.trend30d)) {
    trendRaw = inner.trend30d;
  }

  return {
    tenant_id:
      readChatStringField(inner.tenant_id) || readChatStringField(inner.tenantId),
    company_name:
      readChatStringField(inner.company_name) ||
      readChatStringField(inner.companyName),
    generated_at:
      readChatStringField(inner.generated_at) ||
      readChatStringField(inner.generatedAt),
    kpis: normalizeTenantDashboardKpis(inner.kpis),
    trend_30d: trendRaw
      .map(normalizeTenantDashboardTrendPoint)
      .filter((p): p is TenantDashboardTrendPoint => p !== null),
    top_users: Array.isArray(inner.top_users) ? inner.top_users : [],
    kb: normalizeTenantDashboardKb(inner.kb),
    recent_conversations: Array.isArray(inner.recent_conversations)
      ? inner.recent_conversations
      : [],
    top_questions_7d: Array.isArray(inner.top_questions_7d)
      ? inner.top_questions_7d
      : [],
    recent_failures: Array.isArray(inner.recent_failures)
      ? inner.recent_failures
      : [],
  };
}

export const getTenantChatDashboard = async (
  tenantId?: string,
): Promise<TenantChatDashboardResponse> => {
  try {
    const params: Record<string, string> = {};
    const id = tenantId?.trim();
    if (id) params.tenant_id = id;

    const response = await axiosInstance.get<unknown>(CHAT_TENANT_DASHBOARD_API_PATH, {
      params,
    });

    if (response.data == null) {
      throw new Error("Failed to load tenant dashboard");
    }

    return unwrapTenantChatDashboardResponse(response.data);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid tenant dashboard response") {
      throw error;
    }
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
  tenant_revenue?: string;
  profit_usd?: string;
  margin_pct?: string | number | null;
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
  month_revenue?: string;
  month_profit?: string;
  margin_pct?: string | number | null;
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
    profit_this_month?: string;
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

/** GET tenant settings threshold field (numeric or string from API). */
export type TenantChatSettingsThresholdPct = number | string | null;

export interface TenantChatSettingsOverrides {
  user_per_minute?: number | null;
  default_user_budget_usd?: string | null;
  default_budget_threshold_pct?: TenantChatSettingsThresholdPct;
  model_name?: string | null;
  /** Percent markup on base LLM cost; `null` = no markup. */
  margin_pct?: string | null;
}

export interface TenantChatSettingsDefaults {
  rate_limits?: {
    user_per_minute?: number;
  };
  pricing_default_model?: string;
  pricing?: {
    input_cost_per_million?: string;
    output_cost_per_million?: string;
  };
  pricing_table?: Record<string, { input?: string; output?: string }>;
  available_models?: string[];
}

/** Flat PUT body for `/chat/tenant/settings` (all override fields as strings). */
export interface TenantChatSettingsUpdateRequest {
  tenant_id: string;
  user_per_minute: string;
  model_name: string;
  /** Blank clears markup; decimal string `>= 0` (e.g. `"25"` for +25%). */
  margin_pct: string;
  /** Default monthly budget (USD) applied to new users; blank clears. */
  default_user_budget_usd: string;
  /** Default alert threshold (%); blank clears. */
  default_budget_threshold_pct: string;
}

export interface TenantChatSettingsResponse {
  tenant_id?: string;
  overrides?: TenantChatSettingsOverrides;
  defaults?: TenantChatSettingsDefaults;
  updated_at?: string | null;
  budget?: TenantChatSettingsBudget;
  /** Legacy flat shape (still accepted by the mapper). */
  user_per_minute?: number;
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

/** Tenant settings API (`GET/PUT /api/chat/tenant/settings` when `BACKEND_URL` ends with `/api/`). */
const CHAT_TENANT_SETTINGS_API_PATH = "/chat/tenant/settings";

/** Tenant settings change history (`GET /api/chat/tenant/settings/history`). */
const CHAT_TENANT_SETTINGS_HISTORY_API_PATH = "/chat/tenant/settings/history";

/** `from` / `to` values in settings or pricing history change rows. */
export type ChatFieldChangeValue = string | number | null;

export interface TenantChatSettingsHistoryFieldChange {
  from: ChatFieldChangeValue;
  to: ChatFieldChangeValue;
}

export interface TenantChatSettingsHistoryRow {
  ts: string;
  ts_raw: string;
  event: string;
  user_id?: string;
  changes: Record<string, TenantChatSettingsHistoryFieldChange>;
}

export interface TenantChatSettingsHistoryResponse {
  tenant_id: string;
  rows: TenantChatSettingsHistoryRow[];
}

export interface TenantChatSettingsHistoryQueryParams {
  tenant_id?: string;
  from?: string;
  to?: string;
  limit?: number;
}

/** User-facing message when settings history request fails. */
export const CHAT_TENANT_SETTINGS_HISTORY_FETCH_ERROR_MESSAGE =
  "Having trouble fetching change history. Please try again later.";

function buildTenantChatSettingsHistoryQueryParams(
  params: TenantChatSettingsHistoryQueryParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  const tenantId = params.tenant_id?.trim();
  if (tenantId) query.tenant_id = tenantId;
  const from = params.from?.trim();
  if (from) query.from = from;
  const to = params.to?.trim();
  if (to) query.to = to;
  const limit =
    params.limit == null ? 50 : Math.min(200, Math.max(1, Math.floor(params.limit)));
  query.limit = limit;
  return query;
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
      CHAT_TENANT_SETTINGS_API_PATH,
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
 * `tenant_id` and override fields are sent in the JSON body as strings.
 */
export const updateTenantChatSettings = async (
  payload: TenantChatSettingsUpdateRequest,
): Promise<TenantChatSettingsResponse> => {
  try {
    const response = await axiosInstance.put<TenantChatSettingsResponse>(
      CHAT_TENANT_SETTINGS_API_PATH,
      payload,
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

/**
 * Tenant settings change history (GET `/api/chat/tenant/settings/history` when `BACKEND_URL` ends with `/api/`).
 */
export const getTenantChatSettingsHistory = async (
  params: TenantChatSettingsHistoryQueryParams = {},
): Promise<TenantChatSettingsHistoryResponse> => {
  try {
    const response = await axiosInstance.get<TenantChatSettingsHistoryResponse>(
      CHAT_TENANT_SETTINGS_HISTORY_API_PATH,
      { params: buildTenantChatSettingsHistoryQueryParams(params) },
    );

    if (response.data == null) {
      throw new Error("Failed to load settings history");
    }

    return {
      tenant_id: response.data.tenant_id ?? "",
      rows: Array.isArray(response.data.rows) ? response.data.rows : [],
    };
  } catch {
    throw new Error(CHAT_TENANT_SETTINGS_HISTORY_FETCH_ERROR_MESSAGE);
  }
};

/** Applied filters echoed by GET `/chat/admin/audit-log/`. */
export interface ChatAdminAuditLogFiltersEcho {
  tenant_id?: string | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
  event?: string | null;
  level?: string | null;
  logger?: string | null;
  limit?: number | null;
}

export interface ChatAdminAuditLogRow {
  ts: string;
  request_id: string;
  tenant_id: string;
  actor: string | null;
  event: string;
  target_type: string | null;
  target_id: string | null;
  message: string;
  meta: Record<string, unknown>;
}

export interface ChatAdminAuditLogResponse {
  filters: ChatAdminAuditLogFiltersEcho;
  count: number;
  rows: ChatAdminAuditLogRow[];
}

export interface ChatAdminAuditLogQueryParams {
  tenant_id?: string;
  event?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
}

const CHAT_ADMIN_AUDIT_LOG_API_PATH = "/chat/admin/audit-log/";

/** User-facing message when the admin audit log request fails (any HTTP/status). */
export const CHAT_ADMIN_AUDIT_LOG_FETCH_ERROR_MESSAGE =
  "Having trouble fetching logs. Please try again later.";

function buildChatAdminAuditLogQueryParams(
  params: ChatAdminAuditLogQueryParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  const tenantId = params.tenant_id?.trim();
  if (tenantId) query.tenant_id = tenantId;
  const event = params.event?.trim();
  if (event) query.event = event;
  const from = params.from?.trim();
  if (from) query.from = from;
  const to = params.to?.trim();
  if (to) query.to = to;
  const q = params.q?.trim();
  if (q) query.q = q;
  if (params.limit != null) {
    const limit = Math.min(500, Math.max(1, Math.floor(params.limit)));
    query.limit = limit;
  }
  return query;
}

/**
 * Admin chat audit log (GET `/api/chat/admin/audit-log/` when `BACKEND_URL` ends with `/api/`).
 */
export const getChatAdminAuditLog = async (
  params: ChatAdminAuditLogQueryParams = {},
): Promise<ChatAdminAuditLogResponse> => {
  try {
    const response = await axiosInstance.get<ChatAdminAuditLogResponse>(
      CHAT_ADMIN_AUDIT_LOG_API_PATH,
      { params: buildChatAdminAuditLogQueryParams(params) },
    );

    if (response.data == null) {
      throw new Error("Failed to load audit log");
    }

    return response.data;
  } catch {
    throw new Error(CHAT_ADMIN_AUDIT_LOG_FETCH_ERROR_MESSAGE);
  }
};

export interface AdminChatUserRow {
  tenant_id: string;
  user_id: string;
  display_name: string;
  monthly_budget_usd: string | null;
  budget_threshold_pct: number | null;
  effective_budget_usd: string;
  effective_threshold_pct: number;
  mtd_spend: string;
  mtd_base_spend?: string;
  profit_usd?: string;
  used_pct: number;
  is_exhausted: boolean;
  budget_synced_at: string | null;
  last_seen: string | null;
}

export interface AdminChatUsersResponse {
  count: number;
  rows: AdminChatUserRow[];
}

const CHAT_ADMIN_USERS_API_PATH = "/chat/admin/users";

export const CHAT_ADMIN_USERS_FETCH_ERROR_MESSAGE =
  "Having trouble fetching user budgets. Please try again later.";

/**
 * Admin-wide per-user budget and usage (GET `/api/chat/admin/users`).
 */
export interface ChatPricingFieldChange {
  from: ChatFieldChangeValue;
  to: ChatFieldChangeValue;
}

export interface ChatAdminPricingHistoryRow {
  ts: string;
  ts_raw: string;
  tenant_id: string;
  changes: Record<string, ChatPricingFieldChange>;
}

export interface ChatAdminPricingHistoryFiltersEcho {
  tenant_id?: string | null;
  from?: string | null;
  to?: string | null;
  field?: string | null;
  limit?: number | null;
}

export interface ChatAdminPricingHistoryResponse {
  filters: ChatAdminPricingHistoryFiltersEcho;
  count: number;
  rows: ChatAdminPricingHistoryRow[];
}

export type ChatAdminPricingHistoryField =
  | "margin_pct"
  | "input_cost_per_million"
  | "output_cost_per_million";

export interface ChatAdminPricingHistoryQueryParams {
  tenant_id?: string;
  from?: string;
  to?: string;
  field?: ChatAdminPricingHistoryField;
  limit?: number;
}

const CHAT_ADMIN_PRICING_HISTORY_API_PATH = "/chat/admin/pricing-history";

export const CHAT_ADMIN_PRICING_HISTORY_FETCH_ERROR_MESSAGE =
  "Having trouble fetching pricing history. Please try again later.";

const PRICING_HISTORY_FIELDS = new Set<string>([
  "margin_pct",
  "input_cost_per_million",
  "output_cost_per_million",
]);

function buildChatAdminPricingHistoryQueryParams(
  params: ChatAdminPricingHistoryQueryParams,
): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  const tenantId = params.tenant_id?.trim();
  if (tenantId) query.tenant_id = tenantId;
  const from = params.from?.trim();
  if (from) query.from = from;
  const to = params.to?.trim();
  if (to) query.to = to;
  const field = params.field?.trim();
  if (field && PRICING_HISTORY_FIELDS.has(field)) {
    query.field = field;
  }
  const limit =
    params.limit == null ? 100 : Math.min(500, Math.max(1, Math.floor(params.limit)));
  query.limit = limit;
  return query;
}

/**
 * Admin pricing change history (GET `/api/chat/admin/pricing-history`).
 */
export const getChatAdminPricingHistory = async (
  params: ChatAdminPricingHistoryQueryParams = {},
): Promise<ChatAdminPricingHistoryResponse> => {
  try {
    const response = await axiosInstance.get<ChatAdminPricingHistoryResponse>(
      CHAT_ADMIN_PRICING_HISTORY_API_PATH,
      { params: buildChatAdminPricingHistoryQueryParams(params) },
    );

    if (response.data == null) {
      throw new Error("Failed to load pricing history");
    }

    return {
      filters: response.data.filters ?? {},
      count: response.data.count ?? 0,
      rows: Array.isArray(response.data.rows) ? response.data.rows : [],
    };
  } catch {
    throw new Error(CHAT_ADMIN_PRICING_HISTORY_FETCH_ERROR_MESSAGE);
  }
};

export const getAdminChatUsers = async (): Promise<AdminChatUsersResponse> => {
  try {
    const response = await axiosInstance.get<AdminChatUsersResponse>(
      CHAT_ADMIN_USERS_API_PATH,
    );

    if (response.data == null) {
      throw new Error("Failed to load admin users");
    }

    return {
      count: response.data.count ?? 0,
      rows: Array.isArray(response.data.rows) ? response.data.rows : [],
    };
  } catch {
    throw new Error(CHAT_ADMIN_USERS_FETCH_ERROR_MESSAGE);
  }
};

export const getAdminChatDashboard =
  async (): Promise<AdminChatDashboardResponse> => {
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
