import axiosInstance from "@utils/axios";

const PREFIX = "/voicebot-platform";

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------

export interface ListCompaniesParams {
  show_inactive?: boolean;
  company_id?: string;
}

export interface CreateCompanyPayload {
  company_id?: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  subscription_tier?: string;
  max_bots?: number;
  max_calls_per_month?: number;
}

export interface UpdateCompanyPayload {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  subscription_tier?: string;
  max_bots?: number;
  max_calls_per_month?: number;
  company_id?: string;
}

/**
 * GET users/getCompanies — company list for the current user (aligned with `GetCompanies` in `@utils/users`).
 * Query params `show_inactive` / `company_id` are forwarded when the API supports them.
 * Voicebot company CRUD still uses `${PREFIX}/companies/…`.
 */
export const getCompanies = async (params?: ListCompaniesParams) => {
  const response = await axiosInstance.get("users/getCompanies", { params });
  const body = response.data;
  if (
    body &&
    typeof body === "object" &&
    (body as { code?: number }).code === 200 &&
    "data" in body
  ) {
    return (body as { data: unknown }).data;
  }
  return body;
};

/** POST /companies/ - Create a new company */
export const postCompanies = async (payload: CreateCompanyPayload) => {
  const response = await axiosInstance.post(`${PREFIX}/companies/`, payload);
  return response.data;
};

/** GET /companies/{companyId}/ - Get company details */
export const getCompany = async (companyId: string) => {
  const response = await axiosInstance.get(`${PREFIX}/companies/${companyId}/`);
  return response.data;
};

/** PUT /companies/{companyId}/ - Update company */
export const putCompany = async (
  companyId: string,
  payload: UpdateCompanyPayload,
) => {
  const response = await axiosInstance.put(
    `${PREFIX}/companies/${companyId}/`,
    payload,
  );
  return response.data;
};

/** DELETE /companies/{companyId}/ - Delete company */
export const deleteCompany = async (companyId: string) => {
  const response = await axiosInstance.delete(
    `${PREFIX}/companies/${companyId}/`,
  );
  return response.data;
};

/** POST /companies/{companyId}/activate/ - Activate company */
export const activateCompany = async (companyId: string) => {
  const response = await axiosInstance.post(
    `${PREFIX}/companies/${companyId}/activate/`,
  );
  return response.data;
};

/** POST /companies/{companyId}/deactivate/ - Deactivate company */
export const deactivateCompany = async (companyId: string) => {
  const response = await axiosInstance.post(
    `${PREFIX}/companies/${companyId}/deactivate/`,
  );
  return response.data;
};

/** GET /companies/{companyId}/stats/ - Get company stats */
export const getCompanyStats = async (companyId: string) => {
  const response = await axiosInstance.get(
    `${PREFIX}/companies/${companyId}/stats/`,
  );
  return response.data;
};

/** GET /companies/{companyId}/bots/ - Get company bots */
export const getCompanyBots = async (companyId: string) => {
  const response = await axiosInstance.get(
    `${PREFIX}/companies/${companyId}/bots/`,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------

export interface ListBotsParams {
  company_id?: string;
  limit?: number;
  status?: string;
}

export interface BotConfiguration {
  instructions?: string;
  knowledge_base?: string;
  voice_name?: string;
  voice_model?: string;
  voice_speed?: number;
  voice_instructions?: string;
  llm_model?: string;
  temperature?: number;
  max_tokens?: number;
  greeting_message?: string;
  transfer_enabled?: boolean;
  transfer_number?: string;
  transfer_trunk_id?: string;
  max_duration?: number;
  idle_timeout?: number;
  sip_trunk_id?: string;
  phone_number?: string;
  allow_interruptions?: boolean;
  min_endpointing_delay?: number;
  noise_cancellation?: boolean;
  [key: string]: unknown;
}

export interface CreateBotPayload {
  company_id: string;
  name: string;
  description?: string;
  status?: string;
  configuration: BotConfiguration;
}

export interface UpdateBotPayload {
  company_id?: string;
  name?: string;
  description?: string;
  status?: string;
  configuration?: Partial<BotConfiguration>;
}

/** GET /bots/ - List bots, optionally by company_id and limit */
export const getBots = async (params?: ListBotsParams) => {
  const response = await axiosInstance.get(`${PREFIX}/bots/`, { params });
  return response.data;
};

/** POST /bots/ - Create bot */
export const postBots = async (payload: CreateBotPayload) => {
  const response = await axiosInstance.post(`${PREFIX}/bots/`, payload);
  return response.data;
};

/** GET /bots/lookup/ - Lookup bot by phone_number or sip_trunk_id */
export const getBotsLookup = async (params: {
  phone_number?: string;
  sip_trunk_id?: string;
}) => {
  const response = await axiosInstance.get(`${PREFIX}/bots/lookup/`, {
    params,
  });
  return response.data;
};

/** GET /bots/{botId}/ - Get bot details */
export const getBot = async (botId: string) => {
  const response = await axiosInstance.get(`${PREFIX}/bots/${botId}/`);
  return response.data;
};

/** PUT /bots/{botId}/ - Update bot */
export const putBot = async (botId: string, payload: UpdateBotPayload) => {
  const response = await axiosInstance.put(`${PREFIX}/bots/${botId}/`, payload);
  return response.data;
};

/** DELETE /bots/{botId}/ - Delete bot */
export const deleteBot = async (botId: string) => {
  const response = await axiosInstance.delete(`${PREFIX}/bots/${botId}/`);
  return response.data;
};

/** POST /bots/{botId}/publish/ - Publish bot */
export const publishBot = async (botId: string) => {
  const response = await axiosInstance.post(`${PREFIX}/bots/${botId}/publish/`);
  return response.data;
};

/** POST /bots/{botId}/unpublish/ - Unpublish bot */
export const unpublishBot = async (botId: string) => {
  const response = await axiosInstance.post(
    `${PREFIX}/bots/${botId}/unpublish/`,
  );
  return response.data;
};

/** GET /bots/{botId}/config/ - Get bot runtime config (published bots only) */
export const getBotConfig = async (botId: string) => {
  const response = await axiosInstance.get(`${PREFIX}/bots/${botId}/config/`);
  return response.data;
};

/** Response item from GET /bots/{botId}/versions/ */
export interface BotVersionItem {
  id: string;
  version: number;
  configuration_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  change_description: string;
}

/** GET /bots/{botId}/versions/ - Get bot version history */
export const getBotVersions = async (
  botId: string,
): Promise<BotVersionItem[]> => {
  const response = await axiosInstance.get<BotVersionItem[]>(
    `${PREFIX}/bots/${botId}/versions/`,
  );
  return response.data;
};

/** POST /bots/{botId}/switch/{version}/ - Switch bot to a version (rollback) */
export const switchBotVersion = async (botId: string, version: number) => {
  const response = await axiosInstance.post(
    `${PREFIX}/bots/${botId}/switch/${version}/`,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// SIP trunks
// ---------------------------------------------------------------------------

export interface ListSipTrunksParams {
  company_id?: string;
}

/** Row shape for GET /sip-trunks/ list items (fields vary by API version). */
export interface SipTrunkListItem {
  sip_trunk_id?: string;
  id?: string;
  trunk_id?: string;
  name?: string;
  caller_ids?: string[];
  company_id?: string;
  company_name?: string;
  company?: string | Record<string, unknown>;
  [key: string]: unknown;
}

/** GET /sip-trunks/ - List SIP trunks (scoped by `company_id` when provided). */
export const getSipTrunks = async (params?: ListSipTrunksParams) => {
  const response = await axiosInstance.get(`${PREFIX}/sip-trunks/`, { params });
  return response.data;
};

/**
 * POST /sip-trunks/ - Create SIP trunk. `company_id` is the company identifier (TMS/slug) when
 * available. Optional fields match API defaults: `sip_address` "" = any origin, `caller_ids` [] = none.
 */
export interface CreateSipTrunkPayload {
  company_id: string;
  name: string;
  /** Allowed origin; empty string = any origin. */
  sip_address: string;
  caller_ids: string[];
}

export const postSipTrunk = async (payload: CreateSipTrunkPayload) => {
  const response = await axiosInstance.post(
    `${PREFIX}/sip-trunks/`,
    payload,
  );
  return response.data;
};

/** DELETE /sip-trunks/{trunk_id}/ - Remove a SIP trunk. */
export const deleteSipTrunk = async (trunkId: string) => {
  const id = String(trunkId ?? "").trim();
  if (!id) {
    throw new Error("trunk_id is required");
  }
  const enc = encodeURIComponent(id);
  const response = await axiosInstance.delete(
    `${PREFIX}/sip-trunks/${enc}/`,
  );
  return response.data;
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

/**
 * Query parameters for GET /calls/.
 *
 * `company_id` is required by the API at runtime; kept optional here because
 * admin-facing views may omit it when aggregating across tenants.
 */
export interface ListCallsParams {
  company_id?: string;
  bot_id?: string;
  status?: string;
  caller_phone?: string;
  /** ISO datetime — calls on or after this time. */
  date_from?: string;
  /** ISO datetime — calls on or before this time. */
  date_to?: string;
  /** Records per page (max 100). */
  limit?: number;
  /** Records to skip. */
  offset?: number;
}

export interface CreateCallPayload {
  session_id: string;
  company: string;
  bot: string;
  caller_phone?: string;
  caller_id?: string;
  room_name?: string;
  sip_call_id?: string;
  sip_call_id_full?: string;
  session_start_time?: string;
}

export interface CallMessageItem {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
  token_count?: number;
  processing_time_ms?: number;
}

export interface UpdateCallStatsPayload {
  status?: string;
  disconnect_reason?: string;
  session_end_time?: string;
  call_duration_seconds?: number;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  transfer_to?: string;
  transfer_completed?: boolean;
  idle_timeout_triggered?: boolean;
  max_duration_triggered?: boolean;
  error_message?: string;
  usage_metrics?: {
    stt_tokens?: number;
    llm_input_tokens?: number;
    llm_output_tokens?: number;
    tts_tokens?: number;
    stt_cost?: number;
    llm_cost?: number;
    tts_cost?: number;
    model_used?: string;
    voice_used?: string;
    stt_model?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AddRecordingPayload {
  recording_url?: string;
  file_path?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  format?: string;
  transcription?: string;
  transcription_confidence?: number;
}

export interface GetCallsStatsParams {
  company_id?: string;
  bot_id?: string;
  start_date?: string;
  end_date?: string;
}

/** GET /calls/ - List calls with optional filters */
export const getCalls = async (params?: ListCallsParams) => {
  const response = await axiosInstance.get(`${PREFIX}/calls/`, { params });
  return response.data;
};

/** POST /calls/ - Create call log */
export const postCalls = async (payload: CreateCallPayload) => {
  const response = await axiosInstance.post(`${PREFIX}/calls/`, payload);
  return response.data;
};

/** GET /calls/stats/ - Get call statistics */
export const getCallsStats = async (params?: GetCallsStatsParams) => {
  const response = await axiosInstance.get(`${PREFIX}/calls/stats/`, {
    params,
  });
  return response.data;
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

/** GET /analytics/summary/ - Aggregated analytics summary for inbound */
export const getAnalyticsSummary = async () => {
  const response = await axiosInstance.get(`${PREFIX}/analytics/summary/`);
  return response.data;
};

/** GET /calls/{callId}/ - Get call details */
export const getCall = async (callId: string) => {
  const response = await axiosInstance.get(`${PREFIX}/calls/${callId}/`);
  return response.data;
};

/** POST /calls/{callId}/add_message/ - Add messages to call */
export const addCallMessage = async (
  callId: string,
  messages: CallMessageItem[],
) => {
  const response = await axiosInstance.post(
    `${PREFIX}/calls/${callId}/add_message/`,
    messages,
  );
  return response.data;
};

/** POST /calls/{callId}/update_stats/ - Update call stats and usage */
export const updateCallStats = async (
  callId: string,
  payload: UpdateCallStatsPayload,
) => {
  const response = await axiosInstance.post(
    `${PREFIX}/calls/${callId}/update_stats/`,
    payload,
  );
  return response.data;
};

/** GET /calls/{callId}/transcript/ - Get call transcript */
export const getCallTranscript = async (callId: string) => {
  const response = await axiosInstance.get(
    `${PREFIX}/calls/${callId}/transcript/`,
  );
  return response.data;
};

/** POST /calls/{callId}/add_recording/ - Add recording to call */
export const addCallRecording = async (
  callId: string,
  payload: AddRecordingPayload,
) => {
  const response = await axiosInstance.post(
    `${PREFIX}/calls/${callId}/add_recording/`,
    payload,
  );
  return response.data;
};
