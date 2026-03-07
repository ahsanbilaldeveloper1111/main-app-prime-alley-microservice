import axiosInstance from "@utils/axios";

const PREFIX_TRUCKS = "trunks";
const PREFIX_VOICEBOTS = "voicebots";
const PREFIX_CAMPAIGNS = "campaigns";
const PREFIX_REPORTS = "reports";
const PREFIX_ANALYTICS = "analytics";
const PREFIX_AGENT = "agent";



// ---------------------------------------------------------------------------
// 1) Trunks Management
// ---------------------------------------------------------------------------

/** Request body for Create Trunk (POST /trunks/) */
export interface CreateTrunkPayload {
  name: string;
  address: string;
  caller_ids: string[];
}

/** GET /trunks/ - List all trunks */
export const getTrunks = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_TRUCKS}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /trunks/ - Create trunk */
export const postTrunks = async (payload: CreateTrunkPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_TRUCKS}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** DELETE /trunks/:trunk_id/ - Delete trunk */
export const deleteTrunk = async (trunkId: string) => {
  try {
    const response = await axiosInstance.delete(`${PREFIX_TRUCKS}/${trunkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 2) VoiceBots Management
// ---------------------------------------------------------------------------

export interface ListVoicebotsParams {
  company_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

/** Request body for Create VoiceBot (POST /voicebots/) */
export interface CreateVoicebotPayload {
  company_id: string;
  name: string;
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
  try {
    const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /voicebots/ - Create voicebot */
export const postVoicebots = async (payload: CreateVoicebotPayload) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_VOICEBOTS}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /voicebots/:bot_id/ - Get voicebot details */
export const getVoicebot = async (botId: string, params?: { company_id?: string }) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}/${botId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** PUT /voicebots/:bot_id/ - Update voicebot */
export const putVoicebot = async (botId: string, payload: UpdateVoicebotPayload) => {
  try {
    const response = await axiosInstance.put(`${PREFIX_VOICEBOTS}/${botId}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** DELETE /voicebots/:bot_id/ - Delete voicebot */
export const deleteVoicebot = async (botId: string, params?: { company_id?: string }) => {
  try {
    const response = await axiosInstance.delete(`${PREFIX_VOICEBOTS}/${botId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 3) Campaigns Management
// ---------------------------------------------------------------------------

/** GET /campaigns - Get campaigns */
export const getCampaigns = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /campaigns - Create campaign */
export const postCampaigns = async (payload: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /campaigns/{campaignId} - Get campaign by id */
export const getCampaign = async (campaignId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** PUT /campaigns/{campaignId} - Update campaign */
export const putCampaign = async (campaignId: string, payload: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.put(`${PREFIX_CAMPAIGNS}/${campaignId}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** DELETE /campaigns/{campaignId} - Delete campaign */
export const deleteCampaign = async (campaignId: string) => {
  try {
    const response = await axiosInstance.delete(`${PREFIX_CAMPAIGNS}/${campaignId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 4) Campaign Operations
// ---------------------------------------------------------------------------

/** POST /campaigns/{campaignId}/dispatch - Dispatch campaign */
export const postCampaignDispatch = async (campaignId: string, payload?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/dispatch`, payload ?? {});
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /campaigns/{campaignId}/pause - Pause campaign */
export const postCampaignPause = async (campaignId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/pause`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /campaigns/{campaignId}/resume - Resume campaign */
export const postCampaignResume = async (campaignId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/resume`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /campaigns/{campaignId}/stop - Stop campaign */
export const postCampaignStop = async (campaignId: string) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}/${campaignId}/stop`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /campaigns/{campaignId}/status - Get campaign status */
export const getCampaignStatus = async (campaignId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 5) Reports & Call Logs
// ---------------------------------------------------------------------------

/** POST /reports/calls - Create/report calls */
export const postReportsCalls = async (payload: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_REPORTS}/calls`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /reports/calls/{sessionId} - Get call report by session */
export const getReportsCallsBySession = async (sessionId: string) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_REPORTS}/calls/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 6) Analytics & Dashboard
// ---------------------------------------------------------------------------

/** GET /analytics/dashboard - Get analytics dashboard */
export const getAnalyticsDashboard = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/dashboard`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /analytics/campaigns/{campaignId} - Get campaign analytics */
export const getAnalyticsCampaign = async (campaignId: string, params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/campaigns/${campaignId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /analytics/voicebots/{voiceBotId} - Get voicebot analytics */
export const getAnalyticsVoicebot = async (voiceBotId: string, params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/voicebots/${voiceBotId}`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /analytics/costs - Get analytics costs */
export const getAnalyticsCosts = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/costs`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /analytics/trends - Get analytics trends */
export const getAnalyticsTrends = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/trends`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 7) Agent Monitoring
// ---------------------------------------------------------------------------

/** GET /agent/errors - Get agent errors */
export const getAgentErrors = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_AGENT}/errors`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** GET /agent/status - Get agent status */
export const getAgentStatus = async (params?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.get(`${PREFIX_AGENT}/status`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /agent/errors/{errorId}/resolve - Resolve agent error */
export const postAgentErrorResolve = async (errorId: string, payload?: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_AGENT}/errors/${errorId}/resolve`, payload ?? {});
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 8) Agent Webhooks (Internal)
// ---------------------------------------------------------------------------

/** POST /agent/webhook/error - Agent webhook error */
export const postAgentWebhookError = async (payload: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_AGENT}/webhook/error`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/** POST /agent/webhook/status - Agent webhook status */
export const postAgentWebhookStatus = async (payload: Record<string, unknown>) => {
  try {
    const response = await axiosInstance.post(`${PREFIX_AGENT}/webhook/status`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};
