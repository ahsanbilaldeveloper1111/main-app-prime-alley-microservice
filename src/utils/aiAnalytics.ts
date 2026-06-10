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
      const found = unwrapPricingBody(data[key]);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

const PRICING_PATH = "/ai-analytics/cost/pricing";

export interface AnalysisTenantRecord {
  /** Normalized from API `company_id`. */
  tenant_id: string;
  name: string | null;
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

/** PUT `/ai-analytics/companies/{companyId}` — nullable fields clear overrides. */
export interface AnalysisTenantUpdateRequest {
  name?: string;
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
  return (
    typeof value.tenant_id === "string" || typeof value.company_id === "string"
  );
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

function coerceOptionalIntId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function coerceStringId(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function normalizeTenantRecord(
  value: Record<string, unknown> | AnalysisTenantRecord,
): AnalysisTenantRecord {
  const alertRaw =
    value.alert_threshold_pct ??
    ("alert_threshold" in value ? value.alert_threshold : undefined);

  const companyOrTenantId = coerceStringId(
    "company_id" in value ? value.company_id : value.tenant_id,
  );

  return {
    tenant_id: companyOrTenantId,
    name: typeof value.name === "string" ? value.name : null,
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
    for (const key of ["data", "result", "tenant", "company"] as const) {
      const found = unwrapTenantRecord(data[key]);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function companyPath(companyId: string): string {
  const id = encodeURIComponent(companyId.trim());
  return `/ai-analytics/companies/${id}`;
}

/** GET `/api/ai-analytics/cost/pricing` */
export async function getAnalysisCostPricing(): Promise<AnalysisCostPricingResponse | null> {
  try {
    const response = await axiosInstance.get<unknown>(PRICING_PATH, {
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

/** PUT `/api/ai-analytics/cost/pricing` */
export async function updateAnalysisCostPricing(
  payload: AnalysisCostPricingUpdateRequest,
): Promise<AnalysisCostPricingResponse> {
  try {
    const response = await axiosInstance.put<unknown>(PRICING_PATH, payload);
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

/** GET `/ai-analytics/companies/{companyId}` */
export async function getAnalysisTenant(
  tenantId: string,
): Promise<AnalysisTenantRecord | null> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("company_id is required");
  }
  try {
    const response = await axiosInstance.get<unknown>(companyPath(id), {
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

/** PUT `/ai-analytics/companies/{companyId}` */
export async function updateAnalysisTenant(
  tenantId: string,
  payload: AnalysisTenantUpdateRequest,
): Promise<AnalysisTenantRecord> {
  const id = tenantId.trim();
  if (!id) {
    throw new Error("company_id is required");
  }
  try {
    await axiosInstance.put<unknown>(companyPath(id), payload);
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
    tenant_id: coerceStringId(value.tenant_id),
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

function parseMonthlyRollupRows(value: unknown): AnalysisMonthlyRollupRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isAnalysisMonthlyRollupRow)
    .map((row) => normalizeMonthlyRollupRow(row));
}

/** Walk nested API envelopes until `items` or a rollup row array is found. */
function findMonthlyRollupItems(data: unknown): unknown {
  if (data == null) {
    return undefined;
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (!isRecord(data)) {
    return undefined;
  }
  if ("items" in data) {
    return data.items;
  }
  for (const key of ["data", "results", "rollup"] as const) {
    const found = findMonthlyRollupItems(data[key]);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function unwrapMonthlyRollupList(data: unknown): AnalysisMonthlyRollupRow[] {
  return parseMonthlyRollupRows(findMonthlyRollupItems(data));
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
    (typeof value.call_id === "string" ||
      typeof value.id === "string" ||
      typeof value.id === "number") &&
    typeof value.tenant_id === "string"
  );
}

function normalizePerCallCostRow(
  value: Record<string, unknown> | AnalysisPerCallCostRow,
): AnalysisPerCallCostRow {
  return {
    id: coerceRowId(value),
    call_id: coerceStringId(value.call_id),
    tenant_id: coerceStringId(value.tenant_id),
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

function parsePerCallCostPayload(value: unknown): AnalysisPerCallCostListResponse {
  if (!isRecord(value)) {
    return { total: 0, items: [] };
  }
  const total =
    typeof value.total === "number" && Number.isFinite(value.total)
      ? value.total
      : 0;
  const itemsRaw = value.items;
  if (!Array.isArray(itemsRaw)) {
    return { total, items: [] };
  }
  return {
    total,
    items: itemsRaw
      .filter(isAnalysisPerCallCostRow)
      .map((row) => normalizePerCallCostRow(row)),
  };
}

/** Walk nested API envelopes until `{ total, items }` is found. */
function findPerCallCostPayload(data: unknown): unknown {
  if (data == null) {
    return undefined;
  }
  if (!isRecord(data)) {
    return undefined;
  }
  if ("items" in data) {
    return data;
  }
  for (const key of ["data", "result", "results"] as const) {
    const found = findPerCallCostPayload(data[key]);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

function unwrapPerCallCostList(data: unknown): AnalysisPerCallCostListResponse {
  return parsePerCallCostPayload(findPerCallCostPayload(data));
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

function companyConfigPath(companyId: string): string {
  return `${companyPath(companyId)}/config`;
}

function httpErrorResponseData(error: unknown): unknown {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  if (isRecord(response)) {
    return response.data;
  }
  return undefined;
}

export interface AnalysisConfigTag {
  tag_key: string;
  label: string;
  when_to_apply: string;
  example: string | null;
  color: string;
  enabled: boolean;
  sort_order: number | null;
}

export interface AnalysisConfigCriterion {
  criterion_key: string;
  text: string;
  weight: number;
  example: string | null;
  sort_order: number | null;
}

export interface AnalysisConfigBand {
  min_score: number;
  max_score: number;
  label: string;
  color: string;
  sort_order: number | null;
}

export interface AnalysisConfigAssessment {
  assess_key: string;
  label: string;
  enabled: boolean;
  sort_order: number | null;
  criteria: AnalysisConfigCriterion[];
  bands: AnalysisConfigBand[];
}

export type AnalysisConfigInfoFieldType = "text" | "yes_no" | "number";

export interface AnalysisConfigInfoField {
  field_key: string;
  label: string;
  field_type: AnalysisConfigInfoFieldType;
  description: string;
  example: string | null;
  enabled: boolean;
  sort_order: number | null;
}

export interface AnalysisConfigValidationIssue {
  id: string;
  code: string;
  severity: string;
  layer: string;
  target: string;
  message: string;
  model_backed: boolean;
}

export interface AnalysisCompanyConfigRecord {
  id: number | null;
  company_id: string;
  stated_industry: string;
  inferred_industry: string | null;
  industry_key: string | null;
  template_id: string | null;
  template_version: string | null;
  config_sha256: string | null;
  registry_version: string | null;
  authored_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: AnalysisConfigTag[];
  assessments: AnalysisConfigAssessment[];
  info_fields: AnalysisConfigInfoField[];
}

export interface AnalysisCompanyConfigUpdateRequest {
  stated_industry: string;
  industry_key?: string;
  authored_by?: string;
  tags?: AnalysisConfigTag[];
  assessments?: AnalysisConfigAssessment[];
  info_fields?: AnalysisConfigInfoField[];
}

export interface AnalysisCompanyConfigSaveResult {
  config: AnalysisCompanyConfigRecord;
  warnings: AnalysisConfigValidationIssue[];
}

export class AnalysisCompanyConfigValidationError extends Error {
  readonly issues: AnalysisConfigValidationIssue[];

  constructor(message: string, issues: AnalysisConfigValidationIssue[]) {
    super(message);
    this.name = "AnalysisCompanyConfigValidationError";
    this.issues = issues;
  }
}

function normalizeConfigTag(value: Record<string, unknown>): AnalysisConfigTag {
  return {
    tag_key: coerceStringId(value.tag_key),
    label: coerceStringId(value.label),
    when_to_apply:
      typeof value.when_to_apply === "string" ? value.when_to_apply : "",
    example: coerceOptionalString(value.example),
    color: typeof value.color === "string" ? value.color : "green",
    enabled: value.enabled !== false,
    sort_order: coerceNullableFiniteNumber(value.sort_order),
  };
}

function normalizeConfigCriterion(
  value: Record<string, unknown>,
): AnalysisConfigCriterion {
  return {
    criterion_key: coerceStringId(value.criterion_key),
    text: typeof value.text === "string" ? value.text : "",
    weight: coerceFiniteNumber(value.weight),
    example: coerceOptionalString(value.example),
    sort_order: coerceNullableFiniteNumber(value.sort_order),
  };
}

function normalizeConfigBand(value: Record<string, unknown>): AnalysisConfigBand {
  return {
    min_score: coerceFiniteNumber(value.min_score),
    max_score: coerceFiniteNumber(value.max_score),
    label: coerceStringId(value.label),
    color: typeof value.color === "string" ? value.color : "neutral",
    sort_order: coerceNullableFiniteNumber(value.sort_order),
  };
}

function normalizeConfigAssessment(
  value: Record<string, unknown>,
): AnalysisConfigAssessment {
  const criteriaRaw = value.criteria;
  const bandsRaw = value.bands;
  return {
    assess_key: coerceStringId(value.assess_key),
    label: coerceStringId(value.label),
    enabled: value.enabled !== false,
    sort_order: coerceNullableFiniteNumber(value.sort_order),
    criteria: Array.isArray(criteriaRaw)
      ? criteriaRaw
          .filter(isRecord)
          .map((row) => normalizeConfigCriterion(row))
      : [],
    bands: Array.isArray(bandsRaw)
      ? bandsRaw.filter(isRecord).map((row) => normalizeConfigBand(row))
      : [],
  };
}

function normalizeInfoFieldType(value: unknown): AnalysisConfigInfoFieldType {
  if (value === "yes_no" || value === "number" || value === "text") {
    return value;
  }
  return "text";
}

function normalizeConfigInfoField(
  value: Record<string, unknown>,
): AnalysisConfigInfoField {
  return {
    field_key: coerceStringId(value.field_key),
    label: coerceStringId(value.label),
    field_type: normalizeInfoFieldType(value.field_type),
    description: typeof value.description === "string" ? value.description : "",
    example: coerceOptionalString(value.example),
    enabled: value.enabled !== false,
    sort_order: coerceNullableFiniteNumber(value.sort_order),
  };
}

function isAnalysisCompanyConfigRecord(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.company_id === "string" ||
    typeof value.stated_industry === "string"
  );
}

function normalizeCompanyConfigRecord(
  value: Record<string, unknown>,
): AnalysisCompanyConfigRecord {
  const tagsRaw = value.tags;
  const assessmentsRaw = value.assessments;
  const infoFieldsRaw = value.info_fields;

  return {
    id: coerceOptionalIntId(value.id),
    company_id: coerceStringId(value.company_id),
    stated_industry:
      typeof value.stated_industry === "string" ? value.stated_industry : "",
    inferred_industry: coerceOptionalString(value.inferred_industry),
    industry_key: coerceOptionalString(value.industry_key),
    template_id: coerceOptionalString(value.template_id),
    template_version: coerceOptionalString(value.template_version),
    config_sha256: coerceOptionalString(value.config_sha256),
    registry_version: coerceOptionalString(value.registry_version),
    authored_by: coerceOptionalString(value.authored_by),
    created_at: typeof value.created_at === "string" ? value.created_at : null,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : null,
    tags: Array.isArray(tagsRaw)
      ? tagsRaw.filter(isRecord).map((row) => normalizeConfigTag(row))
      : [],
    assessments: Array.isArray(assessmentsRaw)
      ? assessmentsRaw.filter(isRecord).map((row) => normalizeConfigAssessment(row))
      : [],
    info_fields: Array.isArray(infoFieldsRaw)
      ? infoFieldsRaw.filter(isRecord).map((row) => normalizeConfigInfoField(row))
      : [],
  };
}

function parseValidationIssues(value: unknown): AnalysisConfigValidationIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isRecord)
    .map((issue) => ({
      id: coerceStringId(issue.id ?? issue.code),
      code: coerceStringId(issue.code ?? issue.id),
      severity: typeof issue.severity === "string" ? issue.severity : "error",
      layer: typeof issue.layer === "string" ? issue.layer : "",
      target: typeof issue.target === "string" ? issue.target : "",
      message: typeof issue.message === "string" ? issue.message : "",
      model_backed: issue.model_backed === true,
    }))
    .filter((issue) => issue.message || issue.code);
}

function unwrapCompanyConfigRecord(data: unknown): AnalysisCompanyConfigRecord | null {
  if (data == null) {
    return null;
  }
  if (isRecord(data) && isAnalysisCompanyConfigRecord(data)) {
    return normalizeCompanyConfigRecord(data);
  }
  if (isRecord(data)) {
    if ("config" in data) {
      return unwrapCompanyConfigRecord(data.config);
    }
    for (const key of ["data", "result"] as const) {
      const found = unwrapCompanyConfigRecord(data[key]);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function unwrapCompanyConfigSaveResult(
  data: unknown,
): AnalysisCompanyConfigSaveResult | null {
  if (data == null) {
    return null;
  }
  if (isRecord(data)) {
    const config = unwrapCompanyConfigRecord(data.config ?? data);
    if (!config) {
      return null;
    }
    const warnings = parseValidationIssues(data.warnings);
    return { config, warnings };
  }
  return null;
}

function parseValidationBlockedError(
  error: unknown,
): AnalysisCompanyConfigValidationError | null {
  const raw = httpErrorResponseData(error);
  if (!isRecord(raw)) {
    return null;
  }
  const payload = isRecord(raw.data) ? raw.data : raw;
  if (payload.error_code !== "VALIDATION_BLOCKED") {
    return null;
  }
  const issues = parseValidationIssues(payload.issues);
  const message =
    issues[0]?.message ??
    (typeof payload.message === "string" ? payload.message : "Validation blocked.");
  return new AnalysisCompanyConfigValidationError(message, issues);
}

/** GET `/ai-analytics/companies/{companyId}/config` */
export async function getAnalysisCompanyConfig(
  companyId: string,
): Promise<AnalysisCompanyConfigRecord | null> {
  const id = companyId.trim();
  if (!id) {
    throw new Error("company_id is required");
  }
  try {
    const response = await axiosInstance.get<unknown>(companyConfigPath(id), {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
    if (response.status === 404 || response.data == null) {
      return null;
    }
    return unwrapCompanyConfigRecord(response.data);
  } catch (error: unknown) {
    throw new Error(
      apiErrorMessage(
        error,
        "Failed to load company config. Please try again.",
      ),
    );
  }
}

/** PUT `/ai-analytics/companies/{companyId}/config` */
export async function updateAnalysisCompanyConfig(
  companyId: string,
  payload: AnalysisCompanyConfigUpdateRequest,
): Promise<AnalysisCompanyConfigSaveResult> {
  const id = companyId.trim();
  if (!id) {
    throw new Error("company_id is required");
  }
  try {
    const response = await axiosInstance.put<unknown>(
      companyConfigPath(id),
      payload,
    );
    const result = unwrapCompanyConfigSaveResult(response.data);
    if (!result) {
      throw new Error("Failed to save company config");
    }
    return result;
  } catch (error: unknown) {
    const blocked = parseValidationBlockedError(error);
    if (blocked) {
      throw blocked;
    }
    throw new Error(
      apiErrorMessage(error, "Failed to save company config. Please try again."),
    );
  }
}
