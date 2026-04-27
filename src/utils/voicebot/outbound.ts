import axiosInstance from "@utils/axios";

const PREFIX_TRUNKS = "trunks";
const PREFIX_VOICEBOTS = "voicebots";
const PREFIX_CAMPAIGNS = "campaigns";
const PREFIX_REPORTS = "reports";
const PREFIX_ANALYTICS = "analytics";
const PREFIX_AGENT = "agent";

/** Fallback `company_id` when the UI does not send a tenant/company scope. */
const DEFAULT_COMPANY_ID = "default";

function outboundRequestCompanyId(raw: unknown): string {
  if (raw == null || raw === "") return DEFAULT_COMPANY_ID;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s || DEFAULT_COMPANY_ID;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const s = String(raw).trim();
    return s || DEFAULT_COMPANY_ID;
  }
  return DEFAULT_COMPANY_ID;
}

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
export const deleteTrunk = async (trunkId: string, params: { company_id: string }) => {
  const response = await axiosInstance.delete(`${PREFIX_TRUNKS}/${trunkId}`, {
    params: { company_id: params.company_id },
  });
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

/** GET /voicebots — list voicebots; scoped by `company_id` when provided. */
export const getVoicebots = async (params?: ListVoicebotsParams) => {
  const merged: ListVoicebotsParams = {
    ...params,
    company_id: outboundRequestCompanyId(params?.company_id),
  };
  const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}`, { params: merged });
  return response.data;
};

/** POST /voicebots/ - Create voicebot (company_id also sent as query param for tenant routing, same as getVoicebot). */
export const postVoicebots = async (payload: CreateVoicebotPayload) => {
  const response = await axiosInstance.post(`${PREFIX_VOICEBOTS}`, payload, {
    params: { company_id: payload.company_id },
  });
  return response.data;
};

/** GET /voicebots/:bot_id/ - Get voicebot details */
export const getVoicebot = async (botId: string, params?: { company_id?: string }) => {
  const response = await axiosInstance.get(`${PREFIX_VOICEBOTS}/${botId}`, { params });
  return response.data;
};

/** PUT /voicebots/:bot_id/ - Update voicebot */
export const putVoicebot = async (botId: string, payload: UpdateVoicebotPayload) => {
  const response = await axiosInstance.put(`${PREFIX_VOICEBOTS}/${botId}`, payload, {
    params: { company_id: payload.company_id },
  });
  return response.data;
};

/** DELETE /voicebots/:bot_id — tenant scope via `company_id` query param. */
export const deleteVoicebot = async (botId: string, params?: { company_id?: string }) => {
  const response = await axiosInstance.delete(`${PREFIX_VOICEBOTS}/${botId}`, {
    params: { company_id: outboundRequestCompanyId(params?.company_id) },
  });
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
  /** GET /campaigns — when true, API may return soft-deleted campaigns. */
  include_deleted?: boolean;
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
  schedule_time?: string;
  failure_threshold: number;
}

/** Same shape as create (full replace on PUT). */
export type UpdateCampaignPayload = CreateCampaignPayload;

/** GET /api/campaigns — list campaigns; `company_id` falls back to `"default"` when omitted. */
export const getCampaigns = async (params?: ListCampaignsParams) => {
  const rest = params ? { ...params } : {};
  const merged: ListCampaignsParams = { ...rest, company_id: outboundRequestCompanyId(rest.company_id) };
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

/** POST /api/reports/calls — server expects numeric ids where applicable; `company_id` falls back to `"default"` when omitted. */
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

/** Aggregates returned with POST /reports/calls (shape varies by gateway). */
export type PostReportsCallsSummary = {
  total_calls?: number;
  success_rate?: number;
  avg_duration?: number;
  total_cost?: number | string;
};

function readNumberFromRecord(obj: Record<string, unknown>, keys: readonly string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v == null || v === "") continue;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim());
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function pickReportsCallsDataLayer(r: Record<string, unknown>): Record<string, unknown> | null {
  return isPlainRecord(r.data) ? r.data : null;
}

function firstArray(...candidates: unknown[]): unknown[] {
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

function extractReportsCallsRows(r: Record<string, unknown>, dataLayer: Record<string, unknown> | null): unknown[] {
  const innerData =
    dataLayer && isPlainRecord(dataLayer.data) && !Array.isArray(dataLayer.data) ? dataLayer.data : null;
  return firstArray(
    r.results,
    r.calls,
    r.rows,
    r.records,
    r.sessions,
    dataLayer?.results,
    dataLayer?.calls,
    dataLayer?.rows,
    dataLayer?.records,
    dataLayer?.sessions,
    dataLayer?.items,
    innerData?.results,
    innerData?.calls,
    innerData?.rows,
    Array.isArray(r.data) ? r.data : null,
  );
}

function extractReportsCallsCount(
  r: Record<string, unknown>,
  dataLayer: Record<string, unknown> | null,
  rowCount: number,
): number {
  const meta = isPlainRecord(r.meta) ? r.meta : null;
  const dMeta = dataLayer && isPlainRecord(dataLayer.meta) ? dataLayer.meta : null;
  const raw =
    dataLayer?.count ??
    dataLayer?.total ??
    dataLayer?.total_count ??
    dMeta?.total ??
    dMeta?.count ??
    r.count ??
    r.total ??
    r.total_count ??
    meta?.total ??
    meta?.count;
  const n = Number(raw);
  return Number.isFinite(n) ? n : rowCount;
}

function extractRawSummaryRecord(
  r: Record<string, unknown>,
  dataLayer: Record<string, unknown> | null,
): Record<string, unknown> | null {
  const candidates: unknown[] = [
    r.summary,
    r.aggregates,
    r.aggregate,
    r.statistics,
    r.stats,
    r.totals,
    dataLayer?.summary,
    dataLayer?.aggregates,
    dataLayer?.aggregate,
    dataLayer?.statistics,
    dataLayer?.stats,
    dataLayer?.totals,
  ];
  for (const c of candidates) {
    if (isPlainRecord(c)) return c;
  }
  const meta = isPlainRecord(r.meta) ? r.meta : null;
  const dMeta = dataLayer && isPlainRecord(dataLayer.meta) ? dataLayer.meta : null;
  if (meta && isPlainRecord(meta.summary)) return meta.summary;
  if (dMeta && isPlainRecord(dMeta.summary)) return dMeta.summary;
  return null;
}

/** Merge nested metric bags (e.g. `{ metrics: { total_calls: 1 } }`) into one lookup object. */
function flattenSummaryRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.metrics ?? raw.statistics ?? raw.totals ?? raw.aggregate;
  if (isPlainRecord(nested)) {
    return { ...nested, ...raw };
  }
  return raw;
}

function mapPostReportsCallsSummary(rawSummary: Record<string, unknown>): PostReportsCallsSummary | null {
  const flat = flattenSummaryRecord(rawSummary);
  const total_calls = readNumberFromRecord(flat, [
    "total_calls",
    "totalCalls",
    "call_count",
    "calls",
    "total",
  ]);
  let success_rate = readNumberFromRecord(flat, [
    "success_rate",
    "successRate",
    "completion_rate",
    "completed_rate",
  ]);
  if (success_rate != null && success_rate > 0 && success_rate <= 1) {
    success_rate *= 100;
  }
  const avg_duration = readNumberFromRecord(flat, [
    "avg_duration",
    "avgDuration",
    "avg_call_duration",
    "average_duration",
    "mean_duration",
    "mean_call_duration",
  ]);
  const total_cost = readNumberFromRecord(flat, ["total_cost", "totalCost", "cost", "sum_cost"]);

  const summary: PostReportsCallsSummary = {};
  if (total_calls != null) summary.total_calls = total_calls;
  if (success_rate != null) summary.success_rate = success_rate;
  if (avg_duration != null) summary.avg_duration = avg_duration;
  if (total_cost != null) summary.total_cost = total_cost;

  const hasAny =
    summary.total_calls != null ||
    summary.success_rate != null ||
    summary.avg_duration != null ||
    summary.total_cost != null;
  return hasAny ? summary : null;
}

function callReportRowStatusLower(row: Record<string, unknown>): string {
  const v = row.call_status ?? row.callStatus ?? row.status;
  if (typeof v === "string") return v.trim().toLowerCase();
  return "";
}

function sumCallReportPageMetrics(rows: unknown[]): { completed: number; durSum: number; durN: number; costSum: number } {
  let completed = 0;
  let durSum = 0;
  let durN = 0;
  let costSum = 0;
  for (const raw of rows) {
    if (!isPlainRecord(raw)) continue;
    if (callReportRowStatusLower(raw) === "completed") completed += 1;
    const dur = readNumberFromRecord(raw, [
      "call_duration_seconds",
      "callDurationSeconds",
      "call_duration",
      "duration",
    ]);
    if (dur != null && dur >= 0) {
      durSum += dur;
      durN += 1;
    }
    const c = readNumberFromRecord(raw, ["total_cost", "totalCost", "cost"]);
    if (c != null) costSum += c;
  }
  return { completed, durSum, durN, costSum };
}

/** When the API omits `summary`, derive aggregates from the current page (exact success rate only when all rows fit one page). */
function derivePostReportsCallsSummaryFromRows(rows: unknown[], totalCount: number): PostReportsCallsSummary | null {
  if (rows.length === 0) return null;
  const { completed, durSum, durN, costSum } = sumCallReportPageMetrics(rows);
  const out: PostReportsCallsSummary = {};
  const tc = totalCount > 0 ? totalCount : rows.length;
  out.total_calls = tc;
  const fullPage = tc > 0 && rows.length === tc;
  if (fullPage) {
    out.success_rate = rows.length > 0 ? (completed / rows.length) * 100 : 0;
  }
  if (durN > 0) out.avg_duration = durSum / durN;
  out.total_cost = costSum;
  return Object.keys(out).length ? out : null;
}

/**
 * Normalizes POST /reports/calls JSON: `results` / `count` / `summary` may live on the root or under `data`,
 * and summary fields may be camelCase or snake_case. Success rate may be a 0–1 fraction or a 0–100 percentage.
 */
export function parsePostReportsCallsResponse(res: unknown): {
  results: unknown[];
  count: number;
  summary: PostReportsCallsSummary | null;
} {
  const empty: { results: unknown[]; count: number; summary: PostReportsCallsSummary | null } = {
    results: [],
    count: 0,
    summary: null,
  };
  if (res == null || typeof res !== "object") return empty;
  const r = res as Record<string, unknown>;
  const dataLayer = pickReportsCallsDataLayer(r);
  const results = extractReportsCallsRows(r, dataLayer);
  const count = extractReportsCallsCount(r, dataLayer, results.length);
  const rawSummary = extractRawSummaryRecord(r, dataLayer);
  let summary = rawSummary ? mapPostReportsCallsSummary(rawSummary) : null;
  if (!summary && results.length > 0) {
    summary = derivePostReportsCallsSummaryFromRows(results, count);
  }
  return { results, count, summary };
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
  const merged: PostReportsCallsPayload = {
    ...rest,
    company_id: outboundRequestCompanyId(payload.company_id),
  };
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
