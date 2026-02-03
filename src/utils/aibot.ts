import axiosInstance from './axios';

const prefix = 'voicebot';

// ==================== Types ====================

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqItemWithId extends FaqItem {
  id?: number;
}

// Vector store types
export interface VectorStorePostPayload {
  force_rebuild: boolean;
}

export interface VectorStoreMetadata {
  client_id: string;
  total_faqs: number;
  model: string;
  created_at: string;
  last_updated: string;
  version: string;
}

export interface VectorStoreInfo {
  exists: boolean;
  client_id: string;
  total_faqs: number;
  vector_dimension: number;
  metadata: VectorStoreMetadata;
  last_update: string;
  directory: string;
}

export interface GetVectorStoreResponse {
  status: boolean;
  client_id: string;
  vector_store_info: VectorStoreInfo;
}

// Outbound calls / getFaqsInbound (paginated) types
export interface ConversationMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface OutboundCallItem {
  created_at: string;
  session_id: string;
  participant_sid: string | null;
  participant_identity: string;
  participant_name: string | null;
  voice_agent_name: string | null;
  stt_duration: number;
  tts_characters_count: number;
  llm_tokens: {
    llm_prompt_tokens: number;
    llm_prompt_cached_tokens: number;
    llm_completion_tokens: number;
  };
  conversation: ConversationMessage[];
}

export interface OutboundCallsResults {
  status: boolean;
  OutBound_CALL: OutboundCallItem[];
}

export interface GetFaqsInboundPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: OutboundCallsResults;
}

export interface GetFaqsInboundPaginatedParams {
  page?: number;
  page_size?: number;
}

// ==================== APIs ====================

/**
 * GET faqs-inbound/
 * Get all active FAQs.
 */
export const getFaqsInbound = (): Promise<any> => {
  return axiosInstance.get<FaqItemWithId[]>(`${prefix}/faqs-inbound/`);
};

/**
 * POST faqs-inbound/
 * Create or update multiple FAQs. Send as array of FAQ objects.
 */
export const postFaqsInbound = (faqs: FaqItem[]) => {
  return axiosInstance.post(`${prefix}/faqs-inbound/`, faqs);
};

/**
 * GET faqs-inbound/{id}/
 * Get a specific FAQ by ID.
 */
export const getFaqInboundById = (id: number | string) => {
  return axiosInstance.get<FaqItemWithId>(
    `${prefix}/faqs-inbound/${encodeURIComponent(String(id))}/`
  );
};

/**
 * PUT faqs-inbound/{id}/
 * Update a specific FAQ by ID.
 */
export const putFaqInbound = (id: number | string, data: FaqItem) => {
  return axiosInstance.put(
    `${prefix}/faqs-inbound/${encodeURIComponent(String(id))}/`,
    data
  );
};

/**
 * DELETE faqs-inbound/{id}/
 * Delete a specific FAQ by ID.
 */
export const deleteFaqInbound = (id: number | string) => {
  return axiosInstance.delete(
    `${prefix}/faqs-inbound/${encodeURIComponent(String(id))}/`
  );
};

/**
 * POST vector-store
 * Trigger vector store build/rebuild. Payload: { force_rebuild: boolean }.
 */
export const postVectorStore = (forceRebuild = false) => {
  const payload: VectorStorePostPayload = { force_rebuild: forceRebuild };
  return axiosInstance.post<{ status: boolean }>(`${prefix}/vector-store/`, payload);
};

/**
 * GET vector-store
 * Get current vector store info (exists, total_faqs, metadata, etc.).
 */
export const getVectorStore = () => {
  return axiosInstance.get<GetVectorStoreResponse>(`${prefix}/vector-store/`);
};

/**
 * POST getFaqsInbound (paginated)
 * Query params: page=1&page_size=50. Returns count, next, previous, results (OutBound_CALL list).
 */
export const getFaqsInboundPaginated = (params: GetFaqsInboundPaginatedParams = {}) => {
  const { page = 1, page_size = 50 } = params;
  return axiosInstance.post<GetFaqsInboundPaginatedResponse>(
    `${prefix}/get-all-outbound-calls/`,
    {},
    { params: { page, page_size } }
  );
};

/**
 * Fetch a specific page by URL (for next/previous pagination).
 */
export const getFaqsInboundPaginatedByUrl = (url: string) => {
  return axiosInstance.post<GetFaqsInboundPaginatedResponse>(url, {});
};
