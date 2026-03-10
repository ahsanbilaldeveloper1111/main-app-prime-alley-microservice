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

/** GET /companies/ - List companies. Set show_inactive=true to include inactive. */
export const getCompanies = async (params?: ListCompaniesParams) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/companies/`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /companies/ - Create a new company */
export const postCompanies = async (payload: CreateCompanyPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/companies/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /companies/{companyId}/ - Get company details */
export const getCompany = async (companyId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/companies/${companyId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** PUT /companies/{companyId}/ - Update company */
export const putCompany = async (companyId: string, payload: UpdateCompanyPayload) => {
  try {
    const response = await axiosInstance.put(`${PREFIX}/companies/${companyId}/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** DELETE /companies/{companyId}/ - Delete company */
export const deleteCompany = async (companyId: string) => {
  try {
    const response = await axiosInstance.delete(`${PREFIX}/companies/${companyId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /companies/{companyId}/activate/ - Activate company */
export const activateCompany = async (companyId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/companies/${companyId}/activate/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /companies/{companyId}/deactivate/ - Deactivate company */
export const deactivateCompany = async (companyId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/companies/${companyId}/deactivate/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /companies/{companyId}/stats/ - Get company stats */
export const getCompanyStats = async (companyId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/companies/${companyId}/stats/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /companies/{companyId}/bots/ - Get company bots */
export const getCompanyBots = async (companyId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/companies/${companyId}/bots/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------

export interface ListBotsParams {
  company_id?: string;
  limit?: number;
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
  company: string;
  name: string;
  description?: string;
  status?: string;
  configuration: BotConfiguration;
}

export interface UpdateBotPayload {
  name?: string;
  description?: string;
  status?: string;
  configuration?: Partial<BotConfiguration>;
}

export interface RollbackBotPayload {
  version: number;
}

/** GET /bots/ - List bots, optionally by company_id and limit */
export const getBots = async (params?: ListBotsParams) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/bots/`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /bots/ - Create bot */
export const postBots = async (payload: CreateBotPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/bots/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /bots/lookup/ - Lookup bot by phone_number or sip_trunk_id */
export const getBotsLookup = async (params: { phone_number?: string; sip_trunk_id?: string }) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/bots/lookup/`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /bots/{botId}/ - Get bot details */
export const getBot = async (botId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/bots/${botId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** PUT /bots/{botId}/ - Update bot */
export const putBot = async (botId: string, payload: UpdateBotPayload) => {
  try {
    const response = await axiosInstance.put(`${PREFIX}/bots/${botId}/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** DELETE /bots/{botId}/ - Delete bot */
export const deleteBot = async (botId: string) => {
  try {
    const response = await axiosInstance.delete(`${PREFIX}/bots/${botId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /bots/{botId}/publish/ - Publish bot */
export const publishBot = async (botId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/bots/${botId}/publish/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /bots/{botId}/unpublish/ - Unpublish bot */
export const unpublishBot = async (botId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/bots/${botId}/unpublish/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /bots/{botId}/config/ - Get bot runtime config (published bots only) */
export const getBotConfig = async (botId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/bots/${botId}/config/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /bots/{botId}/versions/ - Get bot version history */
export const getBotVersions = async (botId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/bots/${botId}/versions/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /bots/{botId}/rollback/ - Rollback bot to a version */
export const rollbackBot = async (botId: string, payload: RollbackBotPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/bots/${botId}/rollback/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export interface ListCallsParams {
  company_id?: string;
  bot_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
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
  try {
    const response = await axiosInstance.get(`${PREFIX}/calls/`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /calls/ - Create call log */
export const postCalls = async (payload: CreateCallPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/calls/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /calls/stats/ - Get call statistics */
export const getCallsStats = async (params?: GetCallsStatsParams) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/calls/stats/`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /calls/{callId}/ - Get call details */
export const getCall = async (callId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/calls/${callId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /calls/{callId}/add_message/ - Add messages to call */
export const addCallMessage = async (callId: string, messages: CallMessageItem[]) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/calls/${callId}/add_message/`, messages);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /calls/{callId}/update_stats/ - Update call stats and usage */
export const updateCallStats = async (callId: string, payload: UpdateCallStatsPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/calls/${callId}/update_stats/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /calls/{callId}/transcript/ - Get call transcript */
export const getCallTranscript = async (callId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX}/calls/${callId}/transcript/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /calls/{callId}/add_recording/ - Add recording to call */
export const addCallRecording = async (callId: string, payload: AddRecordingPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX}/calls/${callId}/add_recording/`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};
