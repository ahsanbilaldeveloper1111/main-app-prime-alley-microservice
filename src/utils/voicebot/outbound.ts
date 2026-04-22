import axiosInstance from "@utils/axios";

const PREFIX_TRUNKS = "trunks";
const PREFIX_VOICEBOTS = "voicebots";
const PREFIX_CAMPAIGNS = "campaigns";
const PREFIX_REPORTS = "reports";
const PREFIX_ANALYTICS = "analytics";
const PREFIX_AGENT = "agent";



// ---------------------------------------------------------------------------
// 1) Trunks Management
// ---------------------------------------------------------------------------

/** Request body for Create Trunk (POST /trunks) */
export interface CreateTrunkPayload {
  company_id: string;
  name: string;
  address: string;
  caller_ids: string[];
}

/** GET /trunks - List trunks. Response: { status, data: Trunk[] } */
export const getTrunks = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(PREFIX_TRUNKS, { params });
  return response.data;
};

/** POST /trunks - Create trunk */
export const postTrunks = async (payload: CreateTrunkPayload) => {
  const response = await axiosInstance.post(PREFIX_TRUNKS, payload);
  return response.data;
};

/** DELETE /trunks/:trunk_id - Delete trunk */
export const deleteTrunk = async (trunkId: string) => {
  const response = await axiosInstance.delete(`${PREFIX_TRUNKS}/${trunkId}`);
  return response.data;
};

// ---------------------------------------------------------------------------
// 2) VoiceBots Management
// ---------------------------------------------------------------------------

export interface ListVoicebotsParams {
  company_id?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

/** Request body for Create VoiceBot (POST /voicebots/) */
export interface CreateVoicebotPayload {
  company_id: string;
  name: string;
  trunk_id: string;
  default_greeting: string;
  default_system_prompt: string;
  description?: string;
  system_prompt?: string;
  first_message?: string;
  llm_model?: string;
  tts_model?: string;
  stt_model?: string;
  voice?: string;
  temperature?: number;
  max_tokens?: number;
  transfer_number?: string;
  enable_transfer?: boolean;
  idle_timeout_seconds?: number;
  max_call_duration_seconds?: number;
  status?: string;
}

/** Request body for Update VoiceBot (PUT /voicebots/:bot_id/) */
export interface UpdateVoicebotPayload {
  company_id?: string;
  name?: string;
  trunk_id?: string;
  default_greeting?: string;
  default_system_prompt?: string;
  description?: string;
  system_prompt?: string;
  first_message?: string;
  llm_model?: string;
  tts_model?: string;
  stt_model?: string;
  voice?: string;
  temperature?: number;
  max_tokens?: number;
  transfer_number?: string;
  enable_transfer?: boolean;
  idle_timeout_seconds?: number;
  max_call_duration_seconds?: number;
  status?: string;
}

/** GET /voicebots/ - List voicebots (company_id, status, page, page_size) */
export const getVoicebots = async (params?: ListVoicebotsParams) => {
  const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}`, { params });
  return response.data;
};

/** POST /voicebots/ - Create voicebot */
export const postVoicebots = async (payload: CreateVoicebotPayload) => {
  const response = await axiosInstance.post(`${PREFIX_VOICEBOTS}`, payload);
  return response.data;
};

/** GET /voicebots/:bot_id/ - Get voicebot details */
export const getVoicebot = async (botId: string, params?: { company_id?: string }) => {
  const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}/${botId}`, { params });
  return response.data;
};

/** PUT /voicebots/:bot_id/ - Update voicebot */
export const putVoicebot = async (botId: string, payload: UpdateVoicebotPayload) => {
  const response = await axiosInstance.put(`${PREFIX_VOICEBOTS}/${botId}`, payload);
  return response.data;
};

/** DELETE /voicebots/:bot_id/ - Delete voicebot */
export const deleteVoicebot = async (botId: string, params?: { company_id?: string }) => {
  const response = await axiosInstance.delete(`${PREFIX_VOICEBOTS}/${botId}`, { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// 3) Campaigns Management
// ---------------------------------------------------------------------------

export interface ListCampaignsParams {
  company_id?: string;
  voicebot_id?: number | string;
  status?: string;
  page?: number;
  page_size?: number;
}

/** Create campaign payload (POST /campaigns/) */
export interface CreateCampaignPayload {
  company_id: string;
  name: string;
  description?: string;
  voicebot_id?: number;
  trunk_id?: string;
  caller_id?: string;
  target_list?: string[];
  schedule_start?: string;
  schedule_end?: string;
  retry_attempts?: number;
  retry_interval_minutes?: number;
  status?: string;
}

/** Update campaign payload (PUT /campaigns/:campaign_id/) */
export interface UpdateCampaignPayload {
  company_id?: string;
  name?: string;
  description?: string;
  retry_attempts?: number;
  voicebot_id?: number;
  target_numbers?: string[];
  schedule_start?: string;
  schedule_end?: string;
  retry_interval_minutes?: number;
  status?: string;
  campaign_script?: string;
  custom_greeting?: string;
  input_method?: string;
}

/** GET /campaigns - Get campaigns */
export const getCampaigns = async (params?: ListCampaignsParams) => {
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}`, { params });
  return response.data;
};

/** POST /campaigns - Create campaign */
export const postCampaigns = async (payload: CreateCampaignPayload | Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}`, payload);
  return response.data;
};

/** GET /campaigns/{campaignId} - Get campaign by id */
export const getCampaign = async (campaignId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}`, { params });
  return response.data;
};

/** PUT /campaigns/{campaignId} - Update campaign */
export const putCampaign = async (campaignId: string, payload: UpdateCampaignPayload | Record<string, unknown>) => {
  const response = await axiosInstance.put(`${PREFIX_CAMPAIGNS}/${campaignId}`, payload);
  return response.data;
};

/** DELETE /campaigns/{campaignId} - Delete campaign */
export const deleteCampaign = async (campaignId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.delete(`${PREFIX_CAMPAIGNS}/${campaignId}`, { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// 4) Campaign Operations
// ---------------------------------------------------------------------------

/** POST /campaigns/{campaignId}/dispatch - Dispatch campaign */
export const postCampaignDispatch = async (campaignId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/dispatch`, payload ?? {});
  return response.data;
};

/** POST /campaigns/{campaignId}/pause - Pause campaign */
export const postCampaignPause = async (campaignId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/pause`, payload ?? {});
  return response.data;
};

/** POST /campaigns/{campaignId}/resume - Resume campaign */
export const postCampaignResume = async (campaignId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/resume`, payload ?? {});
  return response.data;
};

/** POST /campaigns/{campaignId}/stop - Stop campaign */
export const postCampaignStop = async (campaignId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/stop`, payload ?? {});
  return response.data;
};

/** POST /campaigns/{campaignId}/redispatch - Reset campaign and call all numbers from scratch (stopped or completed) */
export const postCampaignRedispatch = async (campaignId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/redispatch`, payload ?? {});
  return response.data;
};

/** GET /campaigns/{campaignId}/status - Get campaign status */
export const getCampaignStatus = async (campaignId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}/status`, { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// 5) Reports & Call Logs
// ---------------------------------------------------------------------------

/** POST /reports/calls - Create/report calls */
export const postReportsCalls = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_REPORTS}/calls`, payload);
  return response.data;
};

/** GET /reports/calls/{sessionId} - Get call report by session */
export const getReportsCallsBySession = async (sessionId: string, companyId: string) => {
  const response = await axiosInstance.get(`${PREFIX_REPORTS}/calls/${sessionId}`, { params: { company_id: companyId } });
  return response.data;
};

// ---------------------------------------------------------------------------
// 6) Analytics & Dashboard
// ---------------------------------------------------------------------------

/** GET /analytics/dashboard - Get analytics dashboard */
export const getAnalyticsDashboard = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/dashboard`, { params });
  return response.data;
};

/** GET /analytics/campaigns/{campaignId} - Get campaign analytics */
export const getAnalyticsCampaign = async (campaignId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/campaigns/${campaignId}`, { params });
  return response.data;
};

/** GET /analytics/voicebots/{voiceBotId} - Get voicebot analytics */
export const getAnalyticsVoicebot = async (voiceBotId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/voicebots/${voiceBotId}`, { params });
  return response.data;
};

/** GET /analytics/costs - Get analytics costs */
export const getAnalyticsCosts = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/costs`, { params });
  return response.data;
};

/** GET /analytics/trends - Get analytics trends */
export const getAnalyticsTrends = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/trends`, { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// 7) Agent Monitoring
// ---------------------------------------------------------------------------

/** GET /agent/errors - Get agent errors */
export const getAgentErrors = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_AGENT}/errors`, { params });
  return response.data;
};

/** GET /agent/status - Get agent status */
export const getAgentStatus = async (params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_AGENT}/status`, { params });
  return response.data;
};

/** POST /agent/errors/{errorId}/resolve - Resolve agent error */
export const postAgentErrorResolve = async (errorId: string, payload?: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_AGENT}/errors/${errorId}/resolve`, payload ?? {});
  return response.data;
};

// ---------------------------------------------------------------------------
// 8) Agent Webhooks (Internal)
// ---------------------------------------------------------------------------

/** POST /agent/webhook/error - Agent webhook error */
export const postAgentWebhookError = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_AGENT}/webhook/error`, payload);
  return response.data;
};

/** POST /agent/webhook/status - Agent webhook status */
export const postAgentWebhookStatus = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post(`${PREFIX_AGENT}/webhook/status`, payload);
  return response.data;
};
