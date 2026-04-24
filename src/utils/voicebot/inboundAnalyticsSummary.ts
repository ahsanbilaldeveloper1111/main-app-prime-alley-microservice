import {
  DURATION_BUCKETS,
  getDateKeysInRange,
} from "@components/voicebot/inbound/analytics/constants";
import type { BotPerformanceRow } from "@components/voicebot/inbound/analytics";

export interface InboundAnalyticsStats {
  total_calls?: number;
  completed?: number;
  failed?: number;
  transferred?: number;
  avg_duration_seconds?: number;
  total_cost?: number;
}

export interface VolumeDataItem {
  date: string;
  dateKey: string;
  calls: number;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Unwraps `data` / `summary` wrappers used by GET /analytics/summary. */
export function getAnalyticsSummaryNested(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  const top = raw as Record<string, unknown>;
  let nested: Record<string, unknown> = top;
  if (top.data != null && typeof top.data === "object") {
    nested = top.data as Record<string, unknown>;
  }
  if (nested.summary != null && typeof nested.summary === "object") {
    nested = nested.summary as Record<string, unknown>;
  }
  return nested;
}

/**
 * Unwraps GET /calls/stats/ payloads (`data` wrapper or top-level object).
 * Does not unwrap `summary` (unlike analytics summary).
 */
function getCallsStatsPayloadNested(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw == null || typeof raw !== "object") return null;
  const top = raw as Record<string, unknown>;
  if (
    top.data != null &&
    typeof top.data === "object" &&
    !Array.isArray(top.data)
  ) {
    return top.data as Record<string, unknown>;
  }
  return top;
}

/** Shared scalar extraction for GET /calls/stats/ and analytics summary payloads. */
function extractInboundStatsScalars(
  nested: Record<string, unknown>,
): InboundAnalyticsStats | null {
  const total_calls = toFiniteNumber(
    nested.total_calls ?? nested.total_calls_count ?? nested.totalCalls,
  );
  const completedPrimary = toFiniteNumber(
    nested.completed ??
      nested.completed_calls ??
      nested.completed_count ??
      nested.calls_completed ??
      nested.completedCalls,
  );
  const completedFromAnswered = toFiniteNumber(
    nested.answered_calls ??
      nested.calls_answered ??
      nested.answered ??
      nested.successful_calls,
  );
  const completed =
    completedPrimary !== undefined ? completedPrimary : completedFromAnswered;

  const avg_duration_seconds = toFiniteNumber(
    nested.avg_duration_seconds ??
      nested.average_duration_seconds ??
      nested.avg_duration,
  );
  const total_cost = toFiniteNumber(nested.total_cost ?? nested.total_cost_usd);
  const failed = toFiniteNumber(
    nested.failed ?? nested.failed_calls ?? nested.failed_count,
  );
  const transferred = toFiniteNumber(
    nested.transferred ??
      nested.transferred_calls ??
      nested.transfer_count,
  );

  const out: InboundAnalyticsStats = {};
  if (total_calls !== undefined) out.total_calls = total_calls;
  if (completed !== undefined) out.completed = completed;
  if (failed !== undefined) out.failed = failed;
  if (transferred !== undefined) out.transferred = transferred;
  if (avg_duration_seconds !== undefined) {
    out.avg_duration_seconds = avg_duration_seconds;
  }
  if (total_cost !== undefined) out.total_cost = total_cost;

  return Object.keys(out).length > 0 ? out : null;
}

/** Parse GET /voicebot-platform/calls/stats/ (and similar) into key metrics scalars. */
export function parseCallsStatsPayload(raw: unknown): InboundAnalyticsStats | null {
  const nested = getCallsStatsPayloadNested(raw);
  if (!nested) return null;
  return extractInboundStatsScalars(nested);
}

function sortStatusDistributionEntries(
  entries: { name: string; value: number }[],
): { name: string; value: number }[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name));
}

function entriesFromStatusRecord(
  record: Record<string, unknown>,
): { name: string; value: number }[] {
  return Object.entries(record)
    .map(([k, val]) => {
      const num = toFiniteNumber(val);
      if (num === undefined || num <= 0) return null;
      return { name: String(k).toLowerCase(), value: num };
    })
    .filter((x): x is { name: string; value: number } => x != null);
}

function statusLabelFromDistributionRow(
  row: Record<string, unknown>,
): string | null {
  const nameRaw =
    row.status ??
    row.call_status ??
    row.name ??
    row.label ??
    row.key ??
    row.state;
  if (typeof nameRaw === "string") return nameRaw.toLowerCase();
  if (typeof nameRaw === "number" && Number.isFinite(nameRaw)) {
    return String(nameRaw);
  }
  return null;
}

function tryParseStatusDistributionFromDicts(
  nested: Record<string, unknown>,
): { name: string; value: number }[] | null {
  const dictKeys = [
    "calls_by_status",
    "call_status_counts",
    "by_status",
    "status_counts",
  ] as const;
  for (const key of dictKeys) {
    const v = nested[key];
    if (v == null || typeof v !== "object" || Array.isArray(v)) continue;
    const record = v as Record<string, unknown>;
    if (Object.keys(record).length === 0) return [];
    const entries = entriesFromStatusRecord(record);
    if (entries.length > 0) return sortStatusDistributionEntries(entries);
  }
  return null;
}

function tryParseStatusDistributionFromArrays(
  nested: Record<string, unknown>,
): { name: string; value: number }[] | null {
  const arrayKeys = [
    "status_distribution",
    "call_status_distribution",
    "status_breakdown",
  ] as const;
  for (const key of arrayKeys) {
    const v = nested[key];
    if (!Array.isArray(v)) continue;
    if (v.length === 0) return [];
    const entries: { name: string; value: number }[] = [];
    for (const item of v) {
      if (item == null || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const label = statusLabelFromDistributionRow(row);
      const valueRaw =
        row.count ?? row.value ?? row.calls ?? row.total ?? row.quantity;
      const num = toFiniteNumber(valueRaw);
      if (label == null || num === undefined || num <= 0) continue;
      entries.push({ name: label, value: num });
    }
    if (entries.length > 0) return sortStatusDistributionEntries(entries);
  }
  return null;
}

function buildStatusDistributionFromScalars(
  nested: Record<string, unknown>,
): { name: string; value: number }[] | null {
  const completedPrimary = toFiniteNumber(
    nested.completed ??
      nested.completed_calls ??
      nested.completed_count ??
      nested.calls_completed ??
      nested.completedCalls,
  );
  const completedFromAnswered = toFiniteNumber(
    nested.answered_calls ??
      nested.calls_answered ??
      nested.answered ??
      nested.successful_calls,
  );
  const completed =
    completedPrimary !== undefined ? completedPrimary : completedFromAnswered;
  const failed = toFiniteNumber(
    nested.failed ?? nested.failed_calls ?? nested.failed_count,
  );
  const transferred = toFiniteNumber(
    nested.transferred ?? nested.transferred_calls ?? nested.transfer_count,
  );
  const total_calls = toFiniteNumber(
    nested.total_calls ?? nested.total_calls_count ?? nested.totalCalls,
  );

  const fromScalars: { name: string; value: number }[] = [];
  if (completed !== undefined && completed > 0) {
    fromScalars.push({ name: "completed", value: completed });
  }
  if (failed !== undefined && failed > 0) {
    fromScalars.push({ name: "failed", value: failed });
  }
  if (transferred !== undefined && transferred > 0) {
    fromScalars.push({ name: "transferred", value: transferred });
  }

  if (fromScalars.length === 0) return null;

  const knownSum = fromScalars.reduce((s, x) => s + x.value, 0);
  if (
    total_calls !== undefined &&
    total_calls > knownSum &&
    total_calls - knownSum > 0
  ) {
    fromScalars.push({ name: "other", value: total_calls - knownSum });
  }

  return sortStatusDistributionEntries(fromScalars);
}

/**
 * Parses call status breakdown from the analytics summary payload.
 * Returns `null` when no breakdown is present (caller should use client-side aggregation).
 */
export function parseCallStatusDistribution(
  raw: unknown,
): { name: string; value: number }[] | null {
  const nested =
    getCallsStatsPayloadNested(raw) ?? getAnalyticsSummaryNested(raw);
  if (!nested) return null;

  const fromDict = tryParseStatusDistributionFromDicts(nested);
  if (fromDict !== null) return fromDict;

  const fromArrays = tryParseStatusDistributionFromArrays(nested);
  if (fromArrays !== null) return fromArrays;

  return buildStatusDistributionFromScalars(nested);
}

/** Maps common API shapes from GET /analytics/summary to Key Metrics fields. */
export function parseAnalyticsSummaryPayload(
  raw: unknown,
): InboundAnalyticsStats | null {
  const nested = getAnalyticsSummaryNested(raw);
  if (!nested) return null;
  return extractInboundStatsScalars(nested);
}

function matchDurationBucketKey(apiKey: string): string | null {
  const t = apiKey.trim().toLowerCase();
  for (const b of DURATION_BUCKETS) {
    if (t === b.key.toLowerCase() || t === b.label.toLowerCase()) {
      return b.key;
    }
  }
  return null;
}

function accumulateDurationCounts(
  record: Record<string, unknown>,
): Record<string, number> {
  const byKey: Record<string, number> = {};
  for (const [k, val] of Object.entries(record)) {
    const num = toFiniteNumber(val);
    if (num === undefined || num < 0) continue;
    const bucket = matchDurationBucketKey(k);
    if (bucket) {
      byKey[bucket] = (byKey[bucket] ?? 0) + num;
    }
  }
  return byKey;
}

function durationChartDataFromByKey(
  byKey: Record<string, number>,
): { name: string; count: number }[] {
  return DURATION_BUCKETS.map((b) => ({
    name: b.label,
    count: byKey[b.key] ?? 0,
  }));
}

function durationFromDictNested(
  nested: Record<string, unknown>,
): { name: string; count: number }[] | null {
  const dictKeys = [
    "duration_distribution",
    "calls_by_duration",
    "duration_buckets",
    "call_duration_distribution",
  ] as const;
  for (const key of dictKeys) {
    const v = nested[key];
    if (v == null || typeof v !== "object" || Array.isArray(v)) continue;
    const record = v as Record<string, unknown>;
    if (Object.keys(record).length === 0) return [];
    const byKey = accumulateDurationCounts(record);
    const data = durationChartDataFromByKey(byKey);
    if (data.some((d) => d.count > 0)) return data;
  }
  return null;
}

function accumulateDurationCountsFromSeries(
  items: unknown[],
): Record<string, number> {
  const byKey: Record<string, number> = {};
  for (const item of items) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const bucketRaw =
      row.bucket ?? row.range ?? row.label ?? row.name ?? row.key;
    const countRaw = row.count ?? row.calls ?? row.value ?? row.total;
    const num = toFiniteNumber(countRaw);
    if (typeof bucketRaw !== "string" || num === undefined || num < 0) {
      continue;
    }
    const bucket = matchDurationBucketKey(bucketRaw);
    if (!bucket) continue;
    byKey[bucket] = (byKey[bucket] ?? 0) + num;
  }
  return byKey;
}

function durationFromArrayNested(
  nested: Record<string, unknown>,
): { name: string; count: number }[] | null {
  const arrayKeys = [
    "duration_distribution_series",
    "calls_by_duration_series",
  ] as const;
  for (const key of arrayKeys) {
    const v = nested[key];
    if (!Array.isArray(v) || v.length === 0) continue;
    const byKey = accumulateDurationCountsFromSeries(v);
    const data = durationChartDataFromByKey(byKey);
    if (data.some((d) => d.count > 0)) return data;
  }
  return null;
}

function parseDurationFromNested(
  nested: Record<string, unknown>,
): { name: string; count: number }[] | null {
  const fromDict = durationFromDictNested(nested);
  if (fromDict !== null) return fromDict;
  return durationFromArrayNested(nested);
}

/**
 * Parses duration bucket counts for {@link CallDurationDistributionChart}.
 * Returns `null` if the summary has no duration breakdown.
 */
export function parseDurationDistributionFromSummary(
  raw: unknown,
): { name: string; count: number }[] | null {
  const nested = getAnalyticsSummaryNested(raw);
  if (!nested) return null;
  return parseDurationFromNested(nested);
}

/**
 * Parses duration buckets from GET /voicebot-platform/calls/stats/ when the API
 * includes the same shapes as analytics (`duration_distribution`, `calls_by_duration`, etc.).
 * Prefer this on the analytics page when filters apply — params match GET /calls/.
 */
export function parseDurationDistributionFromCallsStats(
  raw: unknown,
): { name: string; count: number }[] | null {
  const nested = getCallsStatsPayloadNested(raw);
  if (!nested) return null;
  return parseDurationFromNested(nested);
}

function normalizeDateKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  const ymd = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
  return null;
}

function formatVolumeDateLabel(dateKey: string): string {
  return new Date(`${dateKey}Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function mergeCallsByDateIntoRange(
  callsByDate: Record<string, number>,
  timePeriod: string,
): VolumeDataItem[] {
  const dateKeysInRange = getDateKeysInRange(timePeriod);
  if (dateKeysInRange.length > 0) {
    return dateKeysInRange.map((dateKey) => ({
      dateKey,
      date: formatVolumeDateLabel(dateKey),
      calls: callsByDate[dateKey] ?? 0,
    }));
  }
  return Object.entries(callsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, calls]) => ({
      dateKey,
      date: formatVolumeDateLabel(dateKey),
      calls,
    }));
}

function callsByDateFromRecord(
  record: Record<string, unknown>,
): Record<string, number> {
  const callsByDate: Record<string, number> = {};
  for (const [k, val] of Object.entries(record)) {
    const dk = normalizeDateKey(k);
    if (!dk) continue;
    const num = toFiniteNumber(val);
    if (num !== undefined && num >= 0) callsByDate[dk] = num;
  }
  return callsByDate;
}

function callsByDateFromSeries(items: unknown[]): Record<string, number> {
  const callsByDate: Record<string, number> = {};
  for (const item of items) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const dateRaw =
      row.date ?? row.day ?? row.date_key ?? row.bucket ?? row.timestamp;
    const dk =
      typeof dateRaw === "string" ? normalizeDateKey(dateRaw) : null;
    if (!dk) continue;
    const num = toFiniteNumber(
      row.calls ?? row.count ?? row.total ?? row.value,
    );
    if (num === undefined || num < 0) continue;
    callsByDate[dk] = (callsByDate[dk] ?? 0) + num;
  }
  return callsByDate;
}

function volumeFromDictNested(
  nested: Record<string, unknown>,
  timePeriod: string,
): VolumeDataItem[] | null {
  const dictKeys = [
    "calls_by_date",
    "daily_calls",
    "volume_by_date",
    "calls_per_day",
  ] as const;
  for (const key of dictKeys) {
    const v = nested[key];
    if (v == null || typeof v !== "object" || Array.isArray(v)) continue;
    const record = v as Record<string, unknown>;
    if (Object.keys(record).length === 0) return [];
    const callsByDate = callsByDateFromRecord(record);
    if (Object.keys(callsByDate).length === 0) continue;
    return mergeCallsByDateIntoRange(callsByDate, timePeriod);
  }
  return null;
}

function volumeFromArrayNested(
  nested: Record<string, unknown>,
  timePeriod: string,
): VolumeDataItem[] | null {
  const arrayKeys = [
    "calls_timeseries",
    "volume_timeseries",
    "daily_volume",
    "call_volume_by_day",
  ] as const;
  for (const key of arrayKeys) {
    const v = nested[key];
    if (!Array.isArray(v)) continue;
    if (v.length === 0) return [];
    const callsByDate = callsByDateFromSeries(v);
    if (Object.keys(callsByDate).length === 0) continue;
    return mergeCallsByDateIntoRange(callsByDate, timePeriod);
  }
  return null;
}

/**
 * Parses daily call volume for {@link CallVolumeOverTimeChart}.
 * Returns `null` if the summary has no time series (caller uses GET /calls sample).
 */
export function parseVolumeDataFromSummary(
  raw: unknown,
  timePeriod: string,
): VolumeDataItem[] | null {
  const nested = getAnalyticsSummaryNested(raw);
  if (!nested) return null;

  const fromDict = volumeFromDictNested(nested, timePeriod);
  if (fromDict !== null) return fromDict;

  return volumeFromArrayNested(nested, timePeriod);
}

function pickScalarId(v: unknown): string {
  if (v == null || typeof v === "object") return "";
  const s = String(v).trim();
  return s && s !== "[object Object]" ? s : "";
}

/** Prefer bot_id / uuid fields over display name for cross-API lookups. */
function resolveBotIdFromPerformanceRow(row: Record<string, unknown>): string {
  return (
    pickScalarId(row.bot_id) ||
    pickScalarId(row.bot_uuid) ||
    pickScalarId(row.botId) ||
    pickScalarId(row.uuid) ||
    pickScalarId(row.voicebot_id) ||
    pickScalarId(row.voice_bot_id) ||
    pickScalarId(row.id) ||
    ""
  );
}

function coerceBotDisplayName(row: Record<string, unknown>): string {
  const tryStr = (v: unknown): string => {
    if (v == null) return "";
    if (typeof v === "string") return v.trim();
    if (typeof v === "number" || typeof v === "boolean") return String(v).trim();
    return "";
  };
  const fromNestedBot = (): string => {
    const b = row.bot;
    if (b && typeof b === "object" && !Array.isArray(b)) {
      const o = b as Record<string, unknown>;
      return (
        tryStr(o.name) ||
        tryStr(o.bot_name) ||
        tryStr(o.id) ||
        tryStr(o.bot_id)
      );
    }
    return "";
  };
  return (
    tryStr(row.bot_name) ||
    tryStr(row.name) ||
    (typeof row.bot === "string" ? tryStr(row.bot) : "") ||
    fromNestedBot() ||
    tryStr(row.bot_id) ||
    tryStr(row.id)
  );
}

function parseBotPerformanceRow(
  row: Record<string, unknown>,
): BotPerformanceRow | null {
  const name = coerceBotDisplayName(row);
  const total = toFiniteNumber(
    row.total_calls ?? row.total ?? row.calls ?? row.count,
  );
  const completed = toFiniteNumber(
    row.completed ??
      row.completed_calls ??
      row.successful ??
      row.answered_calls ??
      row.answered,
  );
  const transferred = toFiniteNumber(
    row.transferred ?? row.transferred_calls,
  );
  const failed = toFiniteNumber(row.failed ?? row.failed_calls);
  if (!name) {
    return null;
  }
  if (total === undefined || total <= 0) {
    return null;
  }
  const c = completed ?? 0;
  const t = transferred ?? 0;
  const f = failed ?? 0;
  const successRate =
    total > 0 ? ((c / total) * 100).toFixed(1) : "0.0";
  const botLookupId = resolveBotIdFromPerformanceRow(row) || name;
  return {
    name,
    botLookupId,
    total,
    completed: c,
    transferred: t,
    failed: f,
    successRate,
  };
}

function botRowsFromArray(v: unknown[]): BotPerformanceRow[] | null {
  if (v.length === 0) return [];
  const rows: BotPerformanceRow[] = [];
  for (const item of v) {
    if (item == null || typeof item !== "object") continue;
    const parsed = parseBotPerformanceRow(item as Record<string, unknown>);
    if (parsed) rows.push(parsed);
  }
  return rows.length > 0 ? rows : null;
}

function botRowsFromBotsDict(
  record: Record<string, unknown>,
): BotPerformanceRow[] | null {
  const ids = Object.keys(record);
  if (ids.length === 0) return [];
  const rows: BotPerformanceRow[] = [];
  for (const botId of ids) {
    const val = record[botId];
    if (val == null || typeof val !== "object" || Array.isArray(val)) {
      continue;
    }
    const inner = val as Record<string, unknown>;
    const parsed = parseBotPerformanceRow({
      ...inner,
      bot_id: botId,
      name: inner.bot_name ?? inner.name ?? botId,
    });
    if (parsed) rows.push(parsed);
  }
  return rows.length > 0 ? rows : null;
}

function botPerformanceFromNested(
  nested: Record<string, unknown>,
): BotPerformanceRow[] | null {
  const arrayKeys = [
    "bots_performance",
    "performance_by_bot",
    "bot_stats",
    "bots_breakdown",
    "by_bot",
  ] as const;
  for (const key of arrayKeys) {
    const v = nested[key];
    if (!Array.isArray(v)) continue;
    const rows = botRowsFromArray(v);
    if (rows !== null) return rows;
  }

  const dictKeys = ["bots", "bot_totals"] as const;
  for (const key of dictKeys) {
    const v = nested[key];
    if (v == null || typeof v !== "object" || Array.isArray(v)) continue;
    const rows = botRowsFromBotsDict(v as Record<string, unknown>);
    if (rows !== null) return rows;
  }

  return null;
}

/**
 * Parses per-bot stats for {@link BotPerformanceTable} / {@link BotPerformanceComparisonChart}.
 * Returns `null` if the summary has no bot breakdown.
 */
export function parseBotPerformanceFromSummary(
  raw: unknown,
): BotPerformanceRow[] | null {
  const nested = getAnalyticsSummaryNested(raw);
  if (!nested) return null;
  return botPerformanceFromNested(nested);
}
