import axiosInstance from "@utils/axios";

const PREFIX_TRUCKS = "trunks";
const PREFIX_VOICEBOTS = "voicebots";
const PREFIX_CAMPAIGNS = "campaigns";
const PREFIX_REPORTS = "reports";
const PREFIX_ANALYTICS = "analytics";
const PREFIX_AGENT = "agent";

/** Fixed `company_id` for outbound list/report requests that require it (callers cannot override). */
const DEFAULT_COMPANY_ID = "default";

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
  const response = await axiosInstance.get(`${PREFIX_TRUCKS}`, { params });
  return response.data;
};

/** POST /trunks/ - Create trunk */
export const postTrunks = async (payload: CreateTrunkPayload) => {
  const response = await axiosInstance.post(`${PREFIX_TRUCKS}`, payload);
  return response.data;
};

/** DELETE /trunks/:trunk_id/ - Delete trunk */
export const deleteTrunk = async (trunkId: string) => {
  const response = await axiosInstance.delete(`${PREFIX_TRUCKS}/${trunkId}`);
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

/** Request body for Create / Update VoiceBot (POST /voicebots/, PUT /voicebots/:bot_id/) */
export interface CreateVoicebotPayload {
  company_id: string;
  name: string;
  description?: string;
  trunk_id: string;
  tts_provider: string;
  voice_model: string;
  language: string;
  default_greeting: string;
  default_system_prompt: string;
  transfer_number?: string;
  transfer_trunk_id?: string;
  concurrency_limit: number;
  max_call_duration: number;
  idle_timeout: number;
}

/** Request body for Update VoiceBot (PUT /voicebots/:bot_id/) — same fields as create */
export type UpdateVoicebotPayload = CreateVoicebotPayload;

/** GET /api/voicebots — list voicebots; `company_id` is always `"default"`. */
export const getVoicebots = async (params?: ListVoicebotsParams) => {
  const { company_id: _ignored, ...rest } = params ?? {};
  const merged: ListVoicebotsParams = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}`, { params: merged });
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

/** DELETE /api/voicebots/:bot_id — query always includes `company_id=default`. */
export const deleteVoicebot = async (botId: string, params?: { company_id?: string }) => {
  const { company_id: _ignored, ...rest } = params ?? {};
  const merged = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.delete(`${PREFIX_VOICEBOTS}/${botId}`, { params: merged });
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

/** Create / update campaign body (POST /campaigns/, PUT /campaigns/:id/) */
export interface CreateCampaignPayload {
  company_id: string;
  voicebot_id: number;
  name: string;
  description?: string;
  campaign_script?: string;
  custom_greeting?: string;
  target_numbers: string[];
  schedule_time: string;
  failure_threshold: number;
}

/** Same shape as create (full replace on PUT). */
export type UpdateCampaignPayload = CreateCampaignPayload;

/** GET /api/campaigns — list campaigns; `company_id` is always `"default"`. */
export const getCampaigns = async (params?: ListCampaignsParams) => {
  const { company_id: _ignored, ...rest } = params ?? {};
  const merged: ListCampaignsParams = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}`, { params: merged });
  return response.data;
};

/** POST /api/campaigns — body always includes `company_id` (`"default"`). */
export const postCampaigns = async (payload: CreateCampaignPayload | Record<string, unknown>) => {
  const p = payload as Record<string, unknown>;
  const { company_id: _c, ...rest } = p;
  const merged = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.post(`${PREFIX_CAMPAIGNS}`, merged);
  return response.data;
};

/** GET /campaigns/{campaignId} — query `company_id` is always `"default"`. */
export const getCampaign = async (campaignId: string, params?: Record<string, unknown>) => {
  const { company_id: _i, ...rest } = params ?? {};
  const merged = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}`, { params: merged });
  return response.data;
};

/** PUT /api/campaigns/{id} — body always includes `company_id` (`"default"`). */
export const putCampaign = async (campaignId: string, payload: UpdateCampaignPayload | Record<string, unknown>) => {
  const p = payload as Record<string, unknown>;
  const { company_id: _c, ...rest } = p;
  const merged = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.put(`${PREFIX_CAMPAIGNS}/${campaignId}`, merged);
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

/** GET /campaigns/{campaignId}/status - Get campaign status */
export const getCampaignStatus = async (campaignId: string, params?: Record<string, unknown>) => {
  const response = await axiosInstance.get(`${PREFIX_CAMPAIGNS}/${campaignId}/status`, { params });
  return response.data;
};

// ---------------------------------------------------------------------------
// 5) Reports & Call Logs
// ---------------------------------------------------------------------------

/** POST /api/reports/calls — server expects numeric ids where applicable; `company_id` is always `"default"` (callers cannot override). */
export interface PostReportsCallsPayload {
  company_id?: string;
  campaign_id?: number;
  voicebot_id?: number;
  call_status?: string;
  date_from?: string;
  date_to?: string;
  duration_min?: number;
  duration_max?: number;
  page?: number;
  page_size?: number;
  /** Optional; included when supported by the API */
  search?: string;
}

function firstArrayFromRecord(obj: Record<string, unknown>, keys: readonly string[]): unknown[] | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return undefined;
}

const LIST_KEYS = ["results", "data", "items", "voicebots"] as const;

/** Extract list rows from paginated or wrapped API bodies (GET /voicebots, etc.). */
export function extractListFromApiResponse(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (res == null || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  const top = firstArrayFromRecord(r, LIST_KEYS);
  if (top) return top;
  const nested = r.data;
  if (nested != null && typeof nested === "object") {
    const inner = firstArrayFromRecord(nested as Record<string, unknown>, LIST_KEYS);
    if (inner) return inner;
  }
  return [];
}

/** Normalize voicebots list responses from GET /voicebots into `{ id, name }` rows. */
export function normalizeVoicebotsListResponse(res: unknown): Array<{ id: number | string; name: string }> {
  const arr = extractListFromApiResponse(res);
  return arr
    .map((v) => {
      const row = v as {
        id?: number | string;
        bot_id?: number | string;
        voicebot_id?: number | string;
        voice_bot_id?: number | string;
        name?: string;
      };
      const rawId = row.id ?? row.bot_id ?? row.voicebot_id ?? row.voice_bot_id;
      if (rawId === undefined || rawId === null || rawId === "") {
        return { id: "", name: "" };
      }
      const nameTrim = typeof row.name === "string" ? row.name.trim() : "";
      return { id: rawId, name: nameTrim || String(rawId) };
    })
    .filter((v) => v.id !== "" && v.id != null);
}

export const postReportsCalls = async (payload: PostReportsCallsPayload) => {
  const { company_id: _ignored, ...rest } = payload;
  const merged: PostReportsCallsPayload = { ...rest, company_id: DEFAULT_COMPANY_ID };
  const response = await axiosInstance.post(`${PREFIX_REPORTS}/calls`, merged);
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

/** GET /analytics/costs — query params: `company_id` (always `"default"`), `date_from`, `date_to` (YYYY-MM-DD). */
export interface AnalyticsCostsParams {
  company_id?: string;
  date_from?: string;
  date_to?: string;
}

export const getAnalyticsCosts = async (params?: AnalyticsCostsParams) => {
  const { company_id: _ignored, date_from, date_to } = params ?? {};
  const query: Record<string, unknown> = { company_id: DEFAULT_COMPANY_ID };
  if (date_from) query.date_from = date_from;
  if (date_to) query.date_to = date_to;
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/costs`, { params: query });
  return response.data;
};

/** GET /analytics/costs response body (`data` matches API contract). */
export interface AnalyticsCostsByCampaignItem {
  campaign_id?: number;
  campaign_name?: string;
  is_deleted?: boolean;
  total?: number;
  count?: number;
}

export interface AnalyticsCostsTrendItem {
  date?: string;
  total?: number;
}

export interface AnalyticsCostsData {
  total_cost?: number;
  llm_cost?: number;
  tts_cost?: number;
  stt_cost?: number;
  cost_by_campaign?: AnalyticsCostsByCampaignItem[];
  cost_trend?: AnalyticsCostsTrendItem[];
}

export interface AnalyticsCostsApiResponse {
  status?: boolean;
  data?: AnalyticsCostsData;
  message?: string;
  detail?: string;
}

/** GET /analytics/trends — query params: `company_id` (always `"default"`) and `period` (`7d` | `14d` | `30d`). */
export type AnalyticsTrendsPeriod = "7d" | "14d" | "30d";

export interface AnalyticsTrendsParams {
  company_id?: string;
  period?: AnalyticsTrendsPeriod;
}

export const getAnalyticsTrends = async (params?: AnalyticsTrendsParams) => {
  const period = params?.period ?? "7d";
  const query: Record<string, unknown> = { company_id: DEFAULT_COMPANY_ID, period };
  const response = await axiosInstance.get(`${PREFIX_ANALYTICS}/trends`, { params: query });
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
