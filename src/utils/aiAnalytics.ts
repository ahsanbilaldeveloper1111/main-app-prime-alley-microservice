import axiosInstance from "./axios";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function apiErrorMessage(error: unknown, fallback: string): string {
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

export interface AnalysisCostPricingResponse {
  cost_per_call_usd: number;
  cost_per_input_token_usd: number;
  cost_per_output_token_usd: number;
  currency: string;
  notes: string | null;
  updated_at?: string | null;
}

export interface AnalysisCostPricingUpdateRequest {
  cost_per_call_usd?: number;
  cost_per_input_token_usd?: number;
  cost_per_output_token_usd?: number;
  currency?: string;
  notes?: string;
}

function isAnalysisCostPricingResponse(
  value: unknown,
): value is AnalysisCostPricingResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.cost_per_call_usd === "number" &&
    typeof value.cost_per_input_token_usd === "number" &&
    typeof value.cost_per_output_token_usd === "number" &&
    typeof value.currency === "string"
  );
}

function unwrapPricingBody(data: unknown): AnalysisCostPricingResponse | null {
  if (data == null) {
    return null;
  }
  if (isAnalysisCostPricingResponse(data)) {
    return data;
  }
  if (isRecord(data)) {
    for (const key of ["data", "result", "pricing"] as const) {
      const nested = data[key];
      if (isAnalysisCostPricingResponse(nested)) {
        return nested;
      }
    }
  }
  return null;
}

function pricingPath(tenantId: string): string {
  const id = encodeURIComponent(tenantId.trim());
  return `/ai-analytics/cost/pricing/${id}`;
}

export interface AnalysisTenantRecord {
  tenant_id: string;
  industry_type: string | null;
  primary_language: string | null;
  monthly_call_limit: number | null;
  alert_threshold_pct: number;
  cost_limit_usd: number;
  cost_per_call_usd: number | null;
  cost_per_input_token_usd: number | null;
  cost_per_output_token_usd: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** PUT `/api/v2/tenants/{tenant_id}` — nullable fields clear overrides. */
export interface AnalysisTenantUpdateRequest {
  industry_type?: string;
  primary_language?: string;
  monthly_call_limit?: number | null;
  alert_threshold_pct?: number;
  cost_limit_usd?: number;
  cost_per_call_usd?: number | null;
  cost_per_input_token_usd?: number | null;
  cost_per_output_token_usd?: number | null;
}

function isAnalysisTenantRecord(value: unknown): value is AnalysisTenantRecord {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.tenant_id === "string";
}

function coerceFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}

function coerceNullableFiniteNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function normalizeTenantRecord(
  value: Record<string, unknown> | AnalysisTenantRecord,
): AnalysisTenantRecord {
  const alertRaw =
    value.alert_threshold_pct ??
    ("alert_threshold" in value ? value.alert_threshold : undefined);

  return {
    tenant_id: String(value.tenant_id ?? ""),
    industry_type:
      typeof value.industry_type === "string" ? value.industry_type : null,
    primary_language:
      typeof value.primary_language === "string" ? value.primary_language : null,
    monthly_call_limit: coerceNullableFiniteNumber(value.monthly_call_limit),
    alert_threshold_pct: coerceFiniteNumber(alertRaw),
    cost_limit_usd: coerceFiniteNumber(value.cost_limit_usd),
    cost_per_call_usd: coerceNullableFiniteNumber(value.cost_per_call_usd),
    cost_per_input_token_usd: coerceNullableFiniteNumber(
      value.cost_per_input_token_usd ??
        ("cost_per_input_token_usd_override" in value
          ? value.cost_per_input_token_usd_override
          : undefined),
    ),
    cost_per_output_token_usd: coerceNullableFiniteNumber(
      value.cost_per_output_token_usd ??
        ("cost_per_output_token_usd_override" in value
          ? value.cost_per_output_token_usd_override
          : undefined),
    ),
    created_at: typeof value.created_at === "string" ? value.created_at : null,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : null,
  };
}

function unwrapTenantRecord(data: unknown): AnalysisTenantRecord | null {
  if (data == null) {
    return null;
  }
  if (isAnalysisTenantRecord(data)) {
    return normalizeTenantRecord(data);
  }
  if (isRecord(data)) {
    for (const key of ["data", "result", "tenant"] as const) {
      const nested = data[key];
      if (isAnalysisTenantRecord(nested)) {
        return normalizeTenantRecord(nested);
      }
    }
  }
  return null;
}

function analysisTenantPath(tenantId: string): string {
  const id = encodeURIComponent(tenantId.trim());
  return `/ai-analytics/cost/tenants/${id}`;
}

function updateTenantPath(tenantId: string): string {
  const id = encodeURIComponent(tenantId.trim());
  return `/ai-analytics/tenants/${id}`;
}

/** GET `/api/ai-analytics/cost/pricing/{tenant_id}` */
export async function getAnalysisCostPricing(
  tenantId: string,
): Promise<AnalysisCostPricingResponse | null> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    const response = await axiosInstance.get<unknown>(pricingPath(id), {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
    if (response.status === 404 || response.data == null) {
      return null;
    }
    return unwrapPricingBody(response.data);
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to load analysis pricing. Please try again.",
      ),
    );
  }
}

/** PUT `/api/ai-analytics/cost/pricing/{tenant_id}` */
export async function updateAnalysisCostPricing(
  tenantId: string,
  payload: AnalysisCostPricingUpdateRequest,
): Promise<AnalysisCostPricingResponse> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    const response = await axiosInstance.put<unknown>(pricingPath(id), payload);
    const body = unwrapPricingBody(response.data);
    if (!body) {
      throw new Error("Failed to save analysis pricing");
    }
    return body;
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to save analysis pricing. Please try again.",
      ),
    );
  }
}

/** GET `/api/ai-analytics/cost/tenants/{tenantId}` */
export async function getAnalysisTenant(
  tenantId: string,
): Promise<AnalysisTenantRecord | null> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    const response = await axiosInstance.get<unknown>(analysisTenantPath(id), {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
    if (response.status === 404 || response.data == null) {
      return null;
    }
    return unwrapTenantRecord(response.data);
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to load analysis tenant settings. Please try again.",
      ),
    );
  }
}

/** PUT `/api/ai-analytics/tenants/{tenantId}` */
export async function updateAnalysisTenant(
  tenantId: string,
  payload: AnalysisTenantUpdateRequest,
): Promise<AnalysisTenantRecord> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("tenant_id is required");
  }
  try {
    await axiosInstance.put<unknown>(updateTenantPath(id), payload);
    const refreshed = await getAnalysisTenant(id);
    if (!refreshed) {
      throw new Error("Failed to load tenant settings after save");
    }
    return refreshed;
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to save analysis tenant settings. Please try again.",
      ),
    );
  }
}

export interface AnalysisMonthlyRollupFilters {
  tenant_id?: string;
  year?: number;
  month?: number;
}

export interface AnalysisMonthlyRollupRow {
  tenant_id: string;
  year: number;
  month: number;
  total_calls: number;
  total_cost_usd: number;
  success_count: number;
  failed_count: number;
  cache_count: number;
  fresh_count: number;
  success_rate: number;
}

function isAnalysisMonthlyRollupRow(
  value: unknown,
): value is AnalysisMonthlyRollupRow {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.tenant_id === "string" &&
    typeof value.year === "number" &&
    typeof value.month === "number"
  );
}

function normalizeMonthlyRollupRow(
  value: Record<string, unknown> | AnalysisMonthlyRollupRow,
): AnalysisMonthlyRollupRow {
  return {
    tenant_id: String(value.tenant_id ?? ""),
    year: coerceFiniteNumber(value.year),
    month: coerceFiniteNumber(value.month),
    total_calls: coerceFiniteNumber(value.total_calls),
    total_cost_usd: coerceFiniteNumber(value.total_cost_usd),
    success_count: coerceFiniteNumber(value.success_count),
    failed_count: coerceFiniteNumber(value.failed_count),
    cache_count: coerceFiniteNumber(value.cache_count),
    fresh_count: coerceFiniteNumber(value.fresh_count),
    success_rate: coerceFiniteNumber(value.success_rate),
  };
}

function unwrapMonthlyRollupList(data: unknown): AnalysisMonthlyRollupRow[] {
  if (Array.isArray(data)) {
    return data
      .filter(isAnalysisMonthlyRollupRow)
      .map((row) => normalizeMonthlyRollupRow(row));
  }
  if (!isRecord(data)) {
    return [];
  }
  for (const key of ["data", "results", "items", "rollup"] as const) {
    const nested = data[key];
    if (Array.isArray(nested)) {
      return nested
        .filter(isAnalysisMonthlyRollupRow)
        .map((row) => normalizeMonthlyRollupRow(row));
    }
  }
  return [];
}

function buildMonthlyRollupParams(
  filters: AnalysisMonthlyRollupFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const tenantId = filters.tenant_id?.trim();
  if (tenantId) {
    params.tenant_id = tenantId;
  }
  if (filters.year != null && Number.isFinite(filters.year)) {
    params.year = filters.year;
  }
  if (filters.month != null && Number.isFinite(filters.month)) {
    params.month = filters.month;
  }
  return params;
}

/** GET `/api/ai-analytics/cost/monthly` */
export async function listAnalysisMonthlyRollup(
  filters: AnalysisMonthlyRollupFilters = {},
): Promise<AnalysisMonthlyRollupRow[]> {
  try {
    const response = await axiosInstance.get<unknown>(
      "/ai-analytics/cost/monthly",
      { params: buildMonthlyRollupParams(filters) },
    );
    return unwrapMonthlyRollupList(response.data);
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to load monthly rollup. Please try again.",
      ),
    );
  }
}

export type AnalysisPerCallCostStatus = "success" | "failed";

export interface AnalysisPerCallCostFilters {
  tenant_id?: string;
  date_from?: string;
  date_to?: string;
  status?: AnalysisPerCallCostStatus;
  limit?: number;
  offset?: number;
}

export interface AnalysisPerCallCostRow {
  id: string;
  call_id: string;
  tenant_id: string;
  agent_id: string | null;
  call_date: string | null;
  call_datetime: string | null;
  duration_s: number;
  input_tokens: number;
  output_tokens: number;
  analysis_cost_usd: number;
  status: string;
  fail_reason: string | null;
  served_from: string | null;
  created_at: string | null;
}

export interface AnalysisPerCallCostListResponse {
  total: number;
  items: AnalysisPerCallCostRow[];
}

function coerceOptionalString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

function coerceRowId(
  value: Record<string, unknown> | AnalysisPerCallCostRow,
): string {
  if (typeof value.id === "string" || typeof value.id === "number") {
    return String(value.id);
  }
  if (typeof value.call_id === "string" && value.call_id) {
    return value.call_id;
  }
  return "";
}

function isAnalysisPerCallCostRow(value: unknown): value is AnalysisPerCallCostRow {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (typeof value.call_id === "string" || typeof value.id === "string") &&
    typeof value.tenant_id === "string"
  );
}

function normalizePerCallCostRow(
  value: Record<string, unknown> | AnalysisPerCallCostRow,
): AnalysisPerCallCostRow {
  return {
    id: coerceRowId(value),
    call_id: String(value.call_id ?? ""),
    tenant_id: String(value.tenant_id ?? ""),
    agent_id: coerceOptionalString(value.agent_id),
    call_date: coerceOptionalString(value.call_date),
    call_datetime: coerceOptionalString(value.call_datetime),
    duration_s: coerceFiniteNumber(value.duration_s),
    input_tokens: coerceFiniteNumber(value.input_tokens),
    output_tokens: coerceFiniteNumber(value.output_tokens),
    analysis_cost_usd: coerceFiniteNumber(value.analysis_cost_usd),
    status: typeof value.status === "string" ? value.status : "",
    fail_reason: coerceOptionalString(value.fail_reason),
    served_from: coerceOptionalString(value.served_from),
    created_at: coerceOptionalString(value.created_at),
  };
}

function unwrapPerCallCostList(data: unknown): AnalysisPerCallCostListResponse {
  if (!isRecord(data)) {
    return { total: 0, items: [] };
  }
  const total =
    typeof data.total === "number" && Number.isFinite(data.total)
      ? data.total
      : 0;
  const itemsRaw = data.items;
  if (Array.isArray(itemsRaw)) {
    return {
      total,
      items: itemsRaw
        .filter(isAnalysisPerCallCostRow)
        .map((row) => normalizePerCallCostRow(row)),
    };
  }
  return { total, items: [] };
}

function buildPerCallCostParams(
  filters: AnalysisPerCallCostFilters,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const tenantId = filters.tenant_id?.trim();
  if (tenantId) {
    params.tenant_id = tenantId;
  }
  const dateFrom = filters.date_from?.trim();
  if (dateFrom) {
    params.date_from = dateFrom;
  }
  const dateTo = filters.date_to?.trim();
  if (dateTo) {
    params.date_to = dateTo;
  }
  if (filters.status === "success" || filters.status === "failed") {
    params.status = filters.status;
  }
  const limit = filters.limit ?? 100;
  params.limit = Math.min(500, Math.max(1, limit));
  const offset = filters.offset ?? 0;
  params.offset = Math.max(0, offset);
  return params;
}

/** GET `/api/ai-analytics/cost/calls` */
export async function listAnalysisPerCallCosts(
  filters: AnalysisPerCallCostFilters = {},
): Promise<AnalysisPerCallCostListResponse> {
  try {
    const response = await axiosInstance.get<unknown>(
      "/ai-analytics/cost/calls",
      { params: buildPerCallCostParams(filters) },
    );
    return unwrapPerCallCostList(response.data);
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to load per-call cost data. Please try again.",
      ),
    );
  }
}
