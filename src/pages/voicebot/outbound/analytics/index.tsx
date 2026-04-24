import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Card, Col, Collapse, Form, OverlayTrigger, Row, Spinner, Tooltip as BsTooltip } from "react-bootstrap";
import { useSession } from "next-auth/react";
import {
  getAnalyticsCosts,
  getAnalyticsDashboard,
  getAnalyticsTrends,
  getCampaigns,
  getVoicebots,
  normalizeVoicebotsListResponse,
  parsePostReportsCallsResponse,
  postReportsCalls,
  type AnalyticsCostsApiResponse,
  type AnalyticsCostsByCampaignItem,
  type AnalyticsCostsData,
  type AnalyticsTrendsPeriod,
  type PostReportsCallsPayload,
} from "@utils/voicebot/outbound";
import { OUTBOUND_VOICEBOT_LIST_PAGE_SIZE } from "@utils/voicebot/outboundVoicebotForm";
import moment from "moment";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { BarChart3, ChevronDown, CircleHelp, Filter } from "lucide-react";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { formatFixed, formatPercent, toYmd } from "@utils/voicebot/outbound/formatters";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { useDebouncedValue } from "@hooks/useDebouncedValue";

type TimePeriodOption = { value: "7" | "14" | "30" | "60" | "90"; label: string };

const TIME_PERIOD_OPTIONS: TimePeriodOption[] = [
  { value: "7", label: "Last 7 Days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
  { value: "60", label: "Last 60 days" },
  { value: "90", label: "Last 90 days" },
];

/** Maps day presets to `/analytics/trends` (API only supports 7d, 14d, 30d; 30/60/90 → 30d). */
function trendsPeriodFromTimePeriod(days: TimePeriodOption["value"]): AnalyticsTrendsPeriod {
  if (days === "7") return "7d";
  if (days === "14") return "14d";
  return "30d";
}

const REPORTS_CALL_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "timeout", label: "Timeout" },
];

/** When a key is false, that dimension is omitted from outbound analytics API requests. */
type AnalyticsFilterMask = {
  company: boolean;
  campaign: boolean;
  voicebot: boolean;
  callStatus: boolean;
  durationMin: boolean;
  durationMax: boolean;
  fromDate: boolean;
  toDate: boolean;
  timePeriod: boolean;
};

const DEFAULT_ANALYTICS_FILTER_MASK: AnalyticsFilterMask = {
  company: true,
  campaign: true,
  voicebot: true,
  callStatus: true,
  durationMin: true,
  durationMax: true,
  fromDate: true,
  toDate: true,
  timePeriod: true,
};

type OutboundReportsCallsChartFilters = {
  mask: AnalyticsFilterMask;
  companyIdentifier: string;
  campaignId: string;
  voicebotId: string;
  callStatus: string;
  durationMin: number;
  durationMax: number;
  fromDate: string;
  toDate: string;
};

function appendReportsPayloadDurations(
  payload: PostReportsCallsPayload,
  mask: AnalyticsFilterMask,
  durationMin: number,
  durationMax: number,
): void {
  if (mask.durationMin) payload.duration_min = durationMin;
  if (mask.durationMax) payload.duration_max = durationMax;
}

function appendReportsPayloadCompany(
  payload: PostReportsCallsPayload,
  mask: AnalyticsFilterMask,
  companyIdentifier: string,
): void {
  if (!mask.company) return;
  const companyTrim = companyIdentifier.trim();
  if (companyTrim) payload.company_id = companyTrim;
}

function appendReportsPayloadDateRange(
  payload: PostReportsCallsPayload,
  mask: AnalyticsFilterMask,
  fromDate: string,
  toDate: string,
): void {
  if (mask.fromDate && fromDate.trim()) payload.date_from = fromDate.trim();
  if (mask.toDate && toDate.trim()) payload.date_to = toDate.trim();
}

function appendReportsPayloadNumericId(
  payload: PostReportsCallsPayload,
  maskOn: boolean,
  rawId: string,
  key: "campaign_id" | "voicebot_id",
): void {
  if (!maskOn || !rawId) return;
  const n = Number(rawId);
  if (Number.isFinite(n)) payload[key] = n;
}

function appendReportsPayloadCallStatus(
  payload: PostReportsCallsPayload,
  mask: AnalyticsFilterMask,
  callStatus: string,
): void {
  if (mask.callStatus && callStatus) payload.call_status = callStatus;
}

function buildAnalyticsReportsCallsPayload(args: {
  mask: AnalyticsFilterMask;
  companyIdentifier: string;
  campaignId: string;
  voicebotId: string;
  callStatus: string;
  durationMin: number;
  durationMax: number;
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
}): PostReportsCallsPayload {
  const {
    mask,
    companyIdentifier,
    campaignId,
    voicebotId,
    callStatus,
    durationMin,
    durationMax,
    fromDate,
    toDate,
    page,
    pageSize,
  } = args;
  const payload: PostReportsCallsPayload = {
    page,
    page_size: pageSize,
  };
  appendReportsPayloadDurations(payload, mask, durationMin, durationMax);
  appendReportsPayloadCompany(payload, mask, companyIdentifier);
  appendReportsPayloadDateRange(payload, mask, fromDate, toDate);
  appendReportsPayloadNumericId(payload, mask.campaign, campaignId, "campaign_id");
  appendReportsPayloadNumericId(payload, mask.voicebot, voicebotId, "voicebot_id");
  appendReportsPayloadCallStatus(payload, mask, callStatus);
  return payload;
}

type DashboardToday = {
  calls?: number;
  cost?: number;
  success_rate?: number;
};

type DashboardData = {
  total_campaigns?: number;
  active_campaigns?: number;
  total_calls?: number;
  success_rate?: number;
  avg_call_duration?: number; // seconds
  total_cost?: number;
  today?: DashboardToday;
};

type DashboardResponse = {
  status?: boolean;
  data?: DashboardData;
  message?: string;
  detail?: string;
};

type CampaignPerformanceRow = {
  campaign_id?: number | string;
  campaign_name?: string;
  call_status?: string;
  /** When true, campaign is soft-deleted (or equivalent API flag). */
  is_deleted?: boolean;
  campaign_is_deleted?: boolean;
};

const CAMPAIGN_DELETED_MARKER = "(deleted)";

/** API may already suffix names with "(deleted)"; avoid doubling when we add the marker. Linear-time (no regex backtracking). */
function campaignNameAlreadyHasDeletedSuffix(name: string): boolean {
  return name.trimEnd().toLowerCase().endsWith(CAMPAIGN_DELETED_MARKER);
}

function campaignRowIndicatesDeleted(r: CampaignPerformanceRow): boolean {
  const o = r as Record<string, unknown>;
  const candidates: unknown[] = [r.is_deleted, r.campaign_is_deleted, o.campaign_deleted, o.is_campaign_deleted];
  return candidates.some((v) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true");
}

function campaignLabelFromRow(r: CampaignPerformanceRow, deletedCampaignIdsFromCosts?: ReadonlySet<string>): string {
  const idKey = String(r?.campaign_id ?? "").trim();
  const rawName = String(r?.campaign_name ?? "").trim();
  const base = rawName || (idKey ? `#${idKey}` : "—");
  const fromRow = campaignRowIndicatesDeleted(r);
  const fromCosts = Boolean(idKey && deletedCampaignIdsFromCosts?.has(idKey));
  const isDeleted = fromRow || fromCosts;
  if (!isDeleted) return base;
  return campaignNameAlreadyHasDeletedSuffix(base) ? base : `${base} (deleted)`;
}

function aggregateCampaignPerformance(
  list: CampaignPerformanceRow[],
  deletedCampaignIdsFromCosts?: ReadonlySet<string>
) {
  const map = new Map<string, { campaignLabel: string; completed: number; failed: number; total: number }>();
  for (const r of list) {
    const label = campaignLabelFromRow(r, deletedCampaignIdsFromCosts);
    const current = map.get(label) ?? { campaignLabel: label, completed: 0, failed: 0, total: 0 };
    const status = String(r?.call_status ?? "").toLowerCase();
    const isCompleted = status === "completed";
    current.completed += isCompleted ? 1 : 0;
    current.failed += isCompleted ? 0 : 1;
    current.total += 1;
    map.set(label, current);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

type CampaignOption = { id: number | string; name: string };

/** Campaign id from API / table rows (numeric id or string key). */
type CampaignIdParam = number | string | undefined;

type TrendItem = {
  date?: string; // YYYY-MM-DD
  calls?: number;
  success_rate?: number;
  cost?: number;
};

type AnalyticsTrendsResponse = {
  status?: boolean;
  period?: string;
  data?: TrendItem[];
  message?: string;
  detail?: string;
};

function formatAed(value: unknown): string {
  return formatFixed(value, 4, "0.0000");
}

function ymdStartIso(ymd: string): string {
  return `${ymd}T00:00:00Z`;
}

function ymdEndIso(ymd: string): string {
  return `${ymd}T23:59:59Z`;
}

function getDateKeysBetween(fromYmd: string, toYmd: string): string[] {
  if (!fromYmd || !toYmd) return [];
  const start = new Date(`${fromYmd}T00:00:00Z`);
  const end = new Date(`${toYmd}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return [];
  const keys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function safeToYmd(value: unknown): string | null {
  const s = typeof value === "string" ? value : "";
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function buildAnalyticsDashboardParams(args: {
  mask: AnalyticsFilterMask;
  companyIdentifier: string;
  campaignId: string;
  fromDate: string;
  toDate: string;
}): Record<string, unknown> {
  const { mask, companyIdentifier, campaignId, fromDate, toDate } = args;
  const params: Record<string, unknown> = {};
  if (mask.company) {
    const companyTrim = companyIdentifier.trim();
    if (companyTrim) params.company_id = companyTrim;
  }
  if (mask.campaign && campaignId) params.campaign_id = campaignId;
  if (mask.fromDate && fromDate.trim()) {
    params.start_date = ymdStartIso(fromDate);
    params.date_from = fromDate.trim();
  }
  if (mask.toDate && toDate.trim()) {
    params.end_date = ymdEndIso(toDate);
    params.date_to = toDate.trim();
  }
  return params;
}

function dashboardDataFromResponse(res: DashboardResponse): DashboardData | null {
  const data = res?.data ?? null;
  return data && typeof data === "object" ? data : null;
}

type DashboardQueryArgs = {
  mask: AnalyticsFilterMask;
  companyIdentifier: string;
  campaignId: string;
  fromDate: string;
  toDate: string;
};

function useOutboundDashboard({ mask, companyIdentifier, campaignId, fromDate, toDate }: DashboardQueryArgs) {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      try {
        const params = buildAnalyticsDashboardParams({
          mask,
          companyIdentifier,
          campaignId,
          fromDate,
          toDate,
        });
        const res = (await getAnalyticsDashboard(params)) as DashboardResponse;
        if (!cancelled) setDashboard(dashboardDataFromResponse(res));
      } catch (err) {
        console.error("getAnalyticsDashboard error:", err);
        if (!cancelled) setDashboard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [mask, companyIdentifier, campaignId, fromDate, toDate]);

  return { loading, dashboard };
}

function buildVolumeChartSeries(
  list: Array<{ session_start_time?: string; created_at?: string }>,
  fromDate: string,
  toDate: string,
  mask: Pick<AnalyticsFilterMask, "fromDate" | "toDate">,
): Array<{ dateKey: string; calls: number }> {
  const map: Record<string, number> = {};
  for (const row of list) {
    const dayKey = safeToYmd(row?.session_start_time ?? row?.created_at);
    if (!dayKey) continue;
    map[dayKey] = (map[dayKey] ?? 0) + 1;
  }
  let keys: string[];
  const from = mask.fromDate ? fromDate.trim() : "";
  const to = mask.toDate ? toDate.trim() : "";
  if (from && to) {
    keys = getDateKeysBetween(from, to);
    for (const k of keys) {
      map[k] ??= 0;
    }
  } else {
    keys = Object.keys(map).sort((a, b) => a.localeCompare(b));
  }
  return keys.map((k) => ({ dateKey: k, calls: map[k] ?? 0 }));
}

function useOutboundCallVolume(filters: OutboundReportsCallsChartFilters) {
  const {
    mask,
    companyIdentifier,
    campaignId,
    voicebotId,
    callStatus,
    durationMin,
    durationMax,
    fromDate,
    toDate,
  } = filters;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Array<{ dateKey: string; calls: number }>>([]);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchVolume() {
      setLoading(true);
      try {
        const PAGE_SIZE = 5000;
        const payload = buildAnalyticsReportsCallsPayload({
          mask,
          companyIdentifier,
          campaignId,
          voicebotId,
          callStatus,
          durationMin,
          durationMax,
          fromDate,
          toDate,
          page: 1,
          pageSize: PAGE_SIZE,
        });

        const res = await postReportsCalls(payload);
        const parsed = parsePostReportsCallsResponse(res);
        const list = parsed.results as Array<{ session_start_time?: string; created_at?: string }>;
        const count = Number(parsed.count ?? list.length);
        if (!cancelled) setTruncated(Number.isFinite(count) && count > PAGE_SIZE);

        if (!cancelled) setData(buildVolumeChartSeries(list, fromDate, toDate, mask));
      } catch (err) {
        console.error("postReportsCalls error:", err);
        if (!cancelled) {
          setData([]);
          setTruncated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchVolume();
    return () => {
      cancelled = true;
    };
  }, [mask, companyIdentifier, campaignId, voicebotId, callStatus, durationMin, durationMax, fromDate, toDate]);

  return { loading, data, truncated };
}

function useOutboundCosts(
  fromDate: string,
  toDate: string,
  mask: Pick<AnalyticsFilterMask, "fromDate" | "toDate">,
) {
  const [loading, setLoading] = useState(false);
  const [costs, setCosts] = useState<AnalyticsCostsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCosts() {
      setLoading(true);
      try {
        const res = (await getAnalyticsCosts({
          date_from: mask.fromDate && fromDate.trim() ? fromDate.trim() : undefined,
          date_to: mask.toDate && toDate.trim() ? toDate.trim() : undefined,
        })) as AnalyticsCostsApiResponse;
        if (!cancelled) setCosts(res?.data ?? null);
      } catch (err) {
        console.error("getAnalyticsCosts error:", err);
        if (!cancelled) setCosts(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCosts();
    return () => {
      cancelled = true;
    };
  }, [fromDate, toDate, mask.fromDate, mask.toDate]);

  return { loading, costs };
}

function useOutboundCampaignPerformance(
  filters: OutboundReportsCallsChartFilters,
  deletedCampaignIdsFromCosts?: ReadonlySet<string>
) {
  const {
    mask,
    companyIdentifier,
    campaignId,
    voicebotId,
    callStatus,
    durationMin,
    durationMax,
    fromDate,
    toDate,
  } = filters;
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<{ campaignLabel: string; completed: number; failed: number; total: number }>>([]);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPerformance() {
      setLoading(true);
      try {
        const PAGE_SIZE = 5000;
        const payload = buildAnalyticsReportsCallsPayload({
          mask,
          companyIdentifier,
          campaignId,
          voicebotId,
          callStatus,
          durationMin,
          durationMax,
          fromDate,
          toDate,
          page: 1,
          pageSize: PAGE_SIZE,
        });

        const res = await postReportsCalls(payload);
        const parsed = parsePostReportsCallsResponse(res);
        const list = parsed.results as CampaignPerformanceRow[];
        const count = Number(parsed.count ?? list.length);
        if (!cancelled) setTruncated(Number.isFinite(count) && count > PAGE_SIZE);
        if (!cancelled) setRows(aggregateCampaignPerformance(list, deletedCampaignIdsFromCosts));
      } catch (err) {
        console.error("postReportsCalls (campaign performance) error:", err);
        if (!cancelled) {
          setRows([]);
          setTruncated(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPerformance();
    return () => {
      cancelled = true;
    };
  }, [
    mask,
    companyIdentifier,
    campaignId,
    voicebotId,
    callStatus,
    durationMin,
    durationMax,
    fromDate,
    toDate,
    deletedCampaignIdsFromCosts,
  ]);

  return { loading, rows, truncated };
}

function renderCompanyEmptyState(args: { isAdmin: boolean }): React.ReactNode {
  const { isAdmin } = args;
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "180px" }}>
      <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
      <p className="mb-1 fw-medium">
        {isAdmin ? "Select company to load data" : "Company identifier not available"}
      </p>
      <p className="small mb-0 opacity-75">
        {isAdmin ? "Choose a company from the Company dropdown above." : "Please contact your administrator to set your company in the session."}
      </p>
    </div>
  );
}

function renderDashboardContent(args: {
  requireCompanyFilter: boolean;
  companyIdentifier: string;
  isAdmin: boolean;
  dashboardLoading: boolean;
  dashboard: DashboardData | null;
}): React.ReactNode {
  const { requireCompanyFilter, companyIdentifier, isAdmin, dashboardLoading, dashboard } = args;
  if (requireCompanyFilter && !companyIdentifier.trim() && !isAdmin) {
    return renderCompanyEmptyState({ isAdmin });
  }
  if (requireCompanyFilter && isAdmin && !companyIdentifier.trim()) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center text-muted py-5"
        style={{ minHeight: "180px" }}
      >
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">Select a company</p>
        <p className="small mb-0 text-center px-3 opacity-75">
          With the Company filter enabled, choose a company above. Disable the Company filter to load aggregate dashboard
          metrics.
        </p>
      </div>
    );
  }
  if (dashboardLoading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        <span className="text-muted">Loading analytics...</span>
      </div>
    );
  }

  return (
    <Row className="g-3">
      <Col>
        <Card className="h-100">
          <Card.Body>
            <div className="text-muted small">Total Campaigns</div>
            <div className="fs-4 fw-semibold">{dashboard?.total_campaigns ?? 0}</div>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card className="h-100">
          <Card.Body>
            <div className="text-muted small">Active Campaigns</div>
            <div className="fs-4 fw-semibold">{dashboard?.active_campaigns ?? 0}</div>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card className="h-100">
          <Card.Body>
            <div className="text-muted small">Total Calls</div>
            <div className="fs-4 fw-semibold">{dashboard?.total_calls ?? 0}</div>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card className="h-100">
          <Card.Body>
            <div className="text-muted small">Success Rate</div>
            <div className="fs-4 fw-semibold">{formatPercent(dashboard?.success_rate ?? 0)}</div>
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card className="h-100">
          <Card.Body>
            <div className="text-muted small">Total Cost</div>
            <div className="fs-4 fw-semibold">{formatAed(dashboard?.total_cost ?? 0)}</div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

function renderVolumeContent(args: {
  volumeLoading: boolean;
  volumeData: Array<{ dateKey: string; calls: number }>;
}): React.ReactNode {
  const { volumeLoading, volumeData } = args;
  if (volumeLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
        Loading...
      </div>
    );
  }
  if (volumeData.every((d) => d.calls === 0)) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">No call volume data available</p>
        <p className="small mb-0 opacity-75">Try a different date range.</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={volumeData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="dateKey"
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={{ stroke: "#e5e7eb" }}
          tickFormatter={(v) => moment(v).format("MMM D")}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          allowDecimals={false}
          axisLine={false}
          tickLine={{ stroke: "#e5e7eb" }}
          label={{ value: "Number of calls", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
        />
        <RechartsTooltip
          formatter={(value: number) => [value, "Calls"]}
          contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          labelFormatter={(label) => `Date: ${moment(label).format("MMM D, YYYY")}`}
        />
        <Bar dataKey="calls" name="Calls" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderSuccessRateTrendContent(args: { loading: boolean; trends: TrendItem[] }): React.ReactNode {
  const { loading, trends } = args;
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
        Loading...
      </div>
    );
  }
  if (!Array.isArray(trends) || trends.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">No trend data available</p>
        <p className="small mb-0 opacity-75">Try a different time period or check back later.</p>
      </div>
    );
  }

  const data = trends
    .map((t) => ({
      date: String(t?.date ?? ""),
      success_rate: Number(t?.success_rate ?? 0),
    }))
    .filter((d) => Boolean(d.date));

  const maxY = Math.min(100, Math.ceil(Math.max(0, ...data.map((d) => d.success_rate)) / 10) * 10 || 10);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => (v ? moment(v).format("MMM D") : "")}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          domain={[0, maxY]}
          tickFormatter={(v) => `${v}%`}
        />
        <RechartsTooltip
          formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Success rate"]}
          contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
          labelFormatter={(label) => `Date: ${moment(label).format("MMM D, YYYY")}`}
        />
        <Line type="monotone" dataKey="success_rate" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function renderCampaignPerformanceContent(args: {
  loading: boolean;
  rows: Array<{ campaignLabel: string; completed: number; failed: number; total: number }>;
}): React.ReactNode {
  const { loading, rows } = args;
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "280px" }}>
        Loading...
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">No campaign performance data</p>
        <p className="small mb-0 opacity-75">Try a different date range.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 32 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="campaignLabel"
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={70}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          allowDecimals={false}
          axisLine={false}
          tickLine={{ stroke: "#e5e7eb" }}
          label={{ value: "Number of calls", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
        />
        <RechartsTooltip
          formatter={(value: number, name: string) => {
            if (name === "completed") return [value, "Completed"];
            if (name === "failed") return [value, "Failed"];
            return [value, name];
          }}
          contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        />
        <Legend />
        <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function labelForCostCampaignRow(
  row: AnalyticsCostsByCampaignItem,
  fallbackName: (campaignId: CampaignIdParam) => string
): string {
  const name = String(row.campaign_name ?? "").trim();
  if (name) {
    if (!row.is_deleted) return name;
    return campaignNameAlreadyHasDeletedSuffix(name) ? name : `${name} (deleted)`;
  }
  return fallbackName(row.campaign_id);
}

function renderCostContent(
  costLoading: boolean,
  costs: AnalyticsCostsData | null,
  getCampaignLabel: (campaignId: CampaignIdParam) => string
): React.ReactNode {
  if (costLoading) {
    return (
      <div className="d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        <span className="text-muted">Loading costs...</span>
      </div>
    );
  }
  if (costs == null) return <div className="text-muted">No cost data available.</div>;

  const campaignCostChartRows = (costs.cost_by_campaign ?? []).map((c) => ({
    campaign: labelForCostCampaignRow(c, getCampaignLabel),
    total: Number(c?.total ?? 0),
    count: Number(c?.count ?? 0),
    is_deleted: Boolean(c?.is_deleted),
  }));

  return (
    <React.Fragment>
      <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
        <div>
          <div className="text-muted small">Total Cost</div>
          <div className="fs-5 fw-semibold">{formatAed(costs.total_cost ?? 0)}</div>
        </div>
        <div>
          <div className="text-muted small">LLM</div>
          <div className="fw-semibold">{formatAed(costs.llm_cost ?? 0)}</div>
        </div>
        <div>
          <div className="text-muted small">TTS</div>
          <div className="fw-semibold">{formatAed(costs.tts_cost ?? 0)}</div>
        </div>
        <div>
          <div className="text-muted small">STT</div>
          <div className="fw-semibold">{formatAed(costs.stt_cost ?? 0)}</div>
        </div>
      </div>

      <Row className="g-3">
        <Col lg={6}>
          <div className="p-3 border rounded" style={{ minHeight: "360px" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Cost Breakdown</h6>
              <span className="small text-muted">LLM / TTS / STT</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "LLM", cost: Number(costs.llm_cost ?? 0) },
                  { name: "TTS", cost: Number(costs.tts_cost ?? 0) },
                  { name: "STT", cost: Number(costs.stt_cost ?? 0) },
                ]}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip
                  formatter={(value: number) => [formatAed(value), "Cost"]}
                  contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="cost" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col lg={6}>
          <div className="p-3 border rounded" style={{ minHeight: "360px" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Cost Trend</h6>
              <span className="small text-muted">Total by date</span>
            </div>
            {Array.isArray(costs.cost_trend) && costs.cost_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={(costs.cost_trend ?? []).map((t) => ({
                    date: String(t?.date ?? ""),
                    total: Number(t?.total ?? 0),
                  }))}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => (v ? moment(v).format("MMM D") : "")} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: number) => [formatAed(value), "Cost"]}
                    contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                    labelFormatter={(label) => `Date: ${moment(label).format("MMM D, YYYY")}`}
                  />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
                <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
                <p className="mb-1 fw-medium">No trend data available</p>
                <p className="small mb-0 opacity-75">Try selecting a date range.</p>
              </div>
            )}
          </div>
        </Col>

        <Col xs={12}>
          <div className="p-3 border rounded" style={{ minHeight: "360px" }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="mb-0">Cost by Campaign</h6>
              <span className="small text-muted">Total cost per campaign</span>
            </div>
            {campaignCostChartRows.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignCostChartRows} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="campaign" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={72} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    formatter={(value: number, name: string, item: { payload?: { count?: number } }) => {
                      if (name === "total") {
                        const calls = item?.payload?.count;
                        const callsLabel = typeof calls === "number" ? ` · ${calls} calls` : "";
                        return [`${formatAed(value)}${callsLabel}`, "Cost"];
                      }
                      if (name === "count") return [value, "Calls"];
                      return [value, name];
                    }}
                    contentStyle={{ border: "none", borderRadius: "6px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="total" name="total" radius={[4, 4, 0, 0]}>
                    {campaignCostChartRows.map((row, i) => (
                      <Cell
                        key={`cost-campaign-${row.campaign}-${i}`}
                        fill={row.is_deleted ? "rgba(34, 197, 94, 0.45)" : "#22c55e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
                <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
                <p className="mb-1 fw-medium">No campaign breakdown available</p>
                <p className="small mb-0 opacity-75">Try selecting a date range.</p>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </React.Fragment>
  );
}

const OUTBOUND_FIELD_TOOLTIPS = {
  company:
    "Scopes summary cards, the campaign list, Call volume, and Campaign performance to the selected organization. Cost analysis and Success rate trend use From / To dates only.",
  campaign:
    "Limits summary cards, Call volume, and Campaign performance to the selected campaign.",
  fromDate:
    "When on, sets the start of the range for the dashboard, call volume, campaign performance, and cost analysis.",
  toDate:
    "When on, sets the end of the range for the dashboard, call volume, campaign performance, and cost analysis.",
  voicebot:
    "When on, limits Call volume and Campaign performance to the selected voicebot.",
  callStatus:
    "When on, limits Call volume and Campaign performance to calls in that status.",
  durationMin:
    "When on, Call volume and Campaign performance only include sessions at least this long (seconds).",
  durationMax:
    "When on, Call volume and Campaign performance only include sessions up to this length (seconds).",
} as const;

function OutboundFilterFieldHint({ id, text }: Readonly<{ id: string; text: string }>) {
  return (
    <OverlayTrigger placement="top" overlay={<BsTooltip id={`outbound-flt-tip-${id}`}>{text}</BsTooltip>}>
      <button
        type="button"
        className="btn btn-link p-0 ms-1 text-muted align-baseline shadow-none border-0 d-inline-flex"
        aria-label="More information"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <CircleHelp size={14} strokeWidth={1.75} aria-hidden />
      </button>
    </OverlayTrigger>
  );
}

function outboundCheckLabel(id: string, labelText: string, tooltip: string): React.ReactNode {
  return (
    <span className="d-inline-flex align-items-center">
      {labelText}
      <OutboundFilterFieldHint id={id} text={tooltip} />
    </span>
  );
}

const OutboundAnalytics = () => {
  const { data: session } = useSession();
  const isAdmin = String((session?.user as { is_admin?: string | number } | undefined)?.is_admin ?? "") === "1";
  const sessionUser = session?.user as
    | { company_id?: string | null; company_identifier?: string | null }
    | undefined;
  const userCompanyId = String(sessionUser?.company_id ?? "").trim();
  const userCompanyIdentifier = String(sessionUser?.company_identifier ?? "").trim();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [voicebotOptions, setVoicebotOptions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedVoicebotId, setSelectedVoicebotId] = useState<string>("");
  const [filterMask, setFilterMask] = useState<AnalyticsFilterMask>(() => ({ ...DEFAULT_ANALYTICS_FILTER_MASK }));
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Admin: optional company from dropdown when filter is on. Tenant: always session company. */
  const scopeCompanyId = useMemo(() => {
    if (!isAdmin) return userCompanyId || userCompanyIdentifier;
    if (!filterMask.company) return "";
    return selectedCompanyId.trim();
  }, [isAdmin, filterMask.company, selectedCompanyId, userCompanyId, userCompanyIdentifier]);

  /** Mask sent to analytics APIs; tenants always apply company scope (no company checkbox). */
  const analyticsApiMask = useMemo(
    (): AnalyticsFilterMask => ({
      ...filterMask,
      company: isAdmin ? filterMask.company : true,
    }),
    [filterMask, isAdmin],
  );

  const companyIdForCampaigns = scopeCompanyId;
  const [callStatusFilter, setCallStatusFilter] = useState<string>("");
  const [durationMinSec, setDurationMinSec] = useState(0);
  const [durationMaxSec, setDurationMaxSec] = useState(3600);
  const debouncedDurationMinSec = useDebouncedValue(durationMinSec, 400);
  const debouncedDurationMaxSec = useDebouncedValue(durationMaxSec, 400);

  const effectiveCampaignId = selectedCampaignId;

  const [timePeriod, setTimePeriod] = useState<TimePeriodOption["value"]>("7");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);

  const trendsApiPeriod = useMemo(() => trendsPeriodFromTimePeriod(timePeriod), [timePeriod]);

  const successRateTrendDescriptionSuffix = useMemo(() => {
    if (!filterMask.timePeriod) {
      return " — enable the Time period filter to load this chart.";
    }
    const cap =
      timePeriod === "60" || timePeriod === "90"
        ? "; success-rate chart covers at most 30 days while from/to use 60 or 90 days"
        : "";
    return ` for ${trendsApiPeriod} (from the Time period control${cap}).`;
  }, [filterMask.timePeriod, trendsApiPeriod, timePeriod]);

  const timePeriodFilterTooltip = useMemo(() => {
    const cap =
      timePeriod === "60" || timePeriod === "90"
        ? " For 60- or 90-day presets, the success-rate chart shows at most 30 days while From/To cover the full range."
        : "";
    if (isAdmin) {
      return `When on, presets From and To dates and sets the success-rate trend window (${trendsApiPeriod} from this control).${cap}`;
    }
    return `When on, presets From and To dates and the window for Success rate trend below (${trendsApiPeriod}).${cap}`;
  }, [isAdmin, timePeriod, trendsApiPeriod]);

  const todayYmd = useMemo(() => toYmd(new Date()), []);

  const getDefaultDateRange = (period: TimePeriodOption["value"]) => {
    const days = Number.parseInt(period, 10);
    if (!Number.isFinite(days) || days <= 0) return { from: "", to: todayYmd };
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    return { from: toYmd(start), to: toYmd(end) };
  };

  const [fromDate, setFromDate] = useState<string>(() => getDefaultDateRange("7").from);
  const [toDate, setToDate] = useState<string>(() => getDefaultDateRange("7").to);

  const reportsCallsChartFilters = useMemo<OutboundReportsCallsChartFilters>(
    () => ({
      mask: analyticsApiMask,
      companyIdentifier: scopeCompanyId,
      campaignId: filterMask.campaign ? effectiveCampaignId : "",
      voicebotId: filterMask.voicebot ? selectedVoicebotId : "",
      callStatus: filterMask.callStatus ? callStatusFilter : "",
      durationMin: debouncedDurationMinSec,
      durationMax: debouncedDurationMaxSec,
      fromDate,
      toDate,
    }),
    [
      analyticsApiMask,
      scopeCompanyId,
      filterMask.campaign,
      filterMask.voicebot,
      filterMask.callStatus,
      effectiveCampaignId,
      selectedVoicebotId,
      callStatusFilter,
      debouncedDurationMinSec,
      debouncedDurationMaxSec,
      fromDate,
      toDate,
    ]
  );

  const { loading: dashboardLoading, dashboard } = useOutboundDashboard({
    mask: analyticsApiMask,
    companyIdentifier: scopeCompanyId,
    campaignId: filterMask.campaign ? effectiveCampaignId : "",
    fromDate,
    toDate,
  });
  const { loading: volumeLoading, data: volumeData, truncated: volumeTruncated } = useOutboundCallVolume(reportsCallsChartFilters);
  const { loading: costLoading, costs } = useOutboundCosts(fromDate, toDate, {
    fromDate: filterMask.fromDate,
    toDate: filterMask.toDate,
  });

  const deletedCampaignIdsFromCosts = useMemo(() => {
    const ids = new Set<string>();
    for (const c of costs?.cost_by_campaign ?? []) {
      if (!c?.is_deleted) continue;
      const id = c.campaign_id;
      if (id != null && String(id).trim() !== "") ids.add(String(id));
    }
    return ids;
  }, [costs]);

  const { loading: perfLoading, rows: perfRows, truncated: perfTruncated } = useOutboundCampaignPerformance(
    reportsCallsChartFilters,
    deletedCampaignIdsFromCosts
  );

  useEffect(() => {
    if (!filterMask.timePeriod) {
      setTrends([]);
      setTrendsLoading(false);
      return;
    }

    let cancelled = false;
    const period = trendsApiPeriod;

    async function fetchTrends() {
      setTrendsLoading(true);
      try {
        const res = (await getAnalyticsTrends({ period })) as AnalyticsTrendsResponse;
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setTrends(list);
      } catch (err) {
        console.error("getAnalyticsTrends error:", err);
        if (!cancelled) setTrends([]);
      } finally {
        if (!cancelled) setTrendsLoading(false);
      }
    }

    void fetchTrends();
    return () => {
      cancelled = true;
    };
  }, [trendsApiPeriod, filterMask.timePeriod]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchCompanies() {
      try {
        const res = await GetCompanies();
        if (!cancelled) setCompanies(normalizeCompaniesResponse(res));
      } catch (err) {
        console.error("GetCompanies error:", err);
        if (!cancelled) setCompanies([]);
      }
    }
    fetchCompanies();
    return () => { cancelled = true; };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    setSelectedCampaignId("");
  }, [isAdmin, selectedCompanyId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchVoicebots() {
      try {
        const res = await getVoicebots({ page: 1, page_size: OUTBOUND_VOICEBOT_LIST_PAGE_SIZE });
        if (!cancelled) setVoicebotOptions(normalizeVoicebotsListResponse(res));
      } catch (err) {
        console.error("getVoicebots (analytics) error:", err);
        if (!cancelled) setVoicebotOptions([]);
      }
    }
    fetchVoicebots();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchCampaigns() {
      if (!companyIdForCampaigns) {
        if (!cancelled) setCampaigns([]);
        return;
      }
      try {
        const res = await getCampaigns({ company_id: companyIdForCampaigns, page: 1, page_size: 200 });
        const list =
          Array.isArray(res)
            ? res
            : (res as { results?: unknown[] })?.results ?? (res as { data?: unknown[] })?.data ?? [];
        const opts = (Array.isArray(list) ? list : []).map((c) => {
          const item = c as { campaign_id?: number | string; id?: number | string; name?: string };
          const id = item.campaign_id ?? item.id ?? "";
          return { id, name: item.name ?? String(id) };
        }).filter((c) => Boolean(String(c.id)));
        if (!cancelled) setCampaigns(opts);
      } catch (err) {
        console.error("getCampaigns error:", err);
        if (!cancelled) setCampaigns([]);
      }
    }
    fetchCampaigns();
    return () => { cancelled = true; };
  }, [companyIdForCampaigns]);

  useEffect(() => {
    if (!filterMask.timePeriod) return;
    const next = getDefaultDateRange(timePeriod);
    if (!next.from || !next.to) return;
    setFromDate(next.from);
    setToDate(next.to);
  }, [timePeriod, filterMask.timePeriod]);

  const onFromDateChange = (value: string) => {
    setFromDate(value);
    if (toDate && value && value > toDate) setToDate(value);
  };

  const onToDateChange = (value: string) => {
    setToDate(value);
    if (fromDate && value && value < fromDate) setFromDate(value);
  };

  const campaignNameById = useMemo(() => {
    const map: Record<string, string> = {};
    campaigns.forEach((c) => {
      const key = String(c.id ?? "");
      if (key) map[key] = c.name;
    });
    return map;
  }, [campaigns]);

  const getCampaignLabel = (campaignId: CampaignIdParam) => {
    const key = String(campaignId ?? "");
    const name = key ? campaignNameById[key] : "";
    return name || (key ? `#${key}` : "—");
  };

  const dashboardContent = renderDashboardContent({
    requireCompanyFilter: isAdmin ? filterMask.company : true,
    companyIdentifier: scopeCompanyId,
    isAdmin,
    dashboardLoading,
    dashboard,
  });
  const volumeContent = renderVolumeContent({ volumeLoading, volumeData });
  const successRateTrendContent = renderSuccessRateTrendContent({
    loading: trendsLoading,
    trends,
  });
  const campaignPerformanceContent = renderCampaignPerformanceContent({
    loading: perfLoading,
    rows: perfRows,
  });
  const costContent = renderCostContent(costLoading, costs, getCampaignLabel);


  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Outbound Analytics" />

      <PageHeader
        title="Outbound Analytics"
        showSearch={false}
        filters={
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-inline-flex align-items-center gap-1"
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="outbound-analytics-filters"
            aria-label={filtersOpen ? "Hide filters" : "Show filters"}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter size={16} strokeWidth={1.75} aria-hidden />
            Filters
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              aria-hidden
              className="text-muted"
              style={{
                transform: filtersOpen ? "rotate(180deg)" : undefined,
                transition: "transform 0.15s ease",
              }}
            />
          </Button>
        }
      />

      <Row className="mb-3">
        <Col md={12} className="d-flex flex-column align-items-start">
          <Collapse in={filtersOpen}>
            <div id="outbound-analytics-filters" className="w-100">
              <div className="d-flex justify-content-start flex-wrap gap-3 align-items-end">
            {isAdmin && (
              <React.Fragment>
                <Form.Group className="mb-0">
                  <Form.Check
                    id="out-analytics-flt-company"
                    type="checkbox"
                    className="small mb-1"
                    checked={filterMask.company}
                    onChange={(e) => setFilterMask((m) => ({ ...m, company: e.target.checked }))}
                    label={outboundCheckLabel("company", "Company", OUTBOUND_FIELD_TOOLTIPS.company)}
                  />
                  <Form.Select
                    style={{ width: "220px" }}
                    disabled={!filterMask.company}
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="">All companies</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.identifier ?? c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Check
                    id="out-analytics-flt-campaign"
                    type="checkbox"
                    className="small mb-1"
                    checked={filterMask.campaign}
                    onChange={(e) => setFilterMask((m) => ({ ...m, campaign: e.target.checked }))}
                    label={outboundCheckLabel("campaign", "Campaign", OUTBOUND_FIELD_TOOLTIPS.campaign)}
                  />
                  <Form.Select
                    style={{ width: "220px" }}
                    disabled={!filterMask.campaign}
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                  >
                    <option value="">All campaigns</option>
                    {campaigns.map((c) => (
                      <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </React.Fragment>
            )}

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-time-period"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.timePeriod}
                onChange={(e) => setFilterMask((m) => ({ ...m, timePeriod: e.target.checked }))}
                label={outboundCheckLabel("time-period", "Time period", timePeriodFilterTooltip)}
              />
              <Form.Select
                style={{ width: "220px" }}
                disabled={!filterMask.timePeriod}
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriodOption["value"])}
              >
                {TIME_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-from-date"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.fromDate}
                onChange={(e) => setFilterMask((m) => ({ ...m, fromDate: e.target.checked }))}
                label={outboundCheckLabel("from-date", "From date", OUTBOUND_FIELD_TOOLTIPS.fromDate)}
              />
              <Form.Control
                type="date"
                style={{ width: "180px" }}
                disabled={!filterMask.fromDate}
                value={fromDate}
                max={toDate || todayYmd}
                onChange={(e) => onFromDateChange(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-to-date"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.toDate}
                onChange={(e) => setFilterMask((m) => ({ ...m, toDate: e.target.checked }))}
                label={outboundCheckLabel("to-date", "To date", OUTBOUND_FIELD_TOOLTIPS.toDate)}
              />
              <Form.Control
                type="date"
                style={{ width: "180px" }}
                disabled={!filterMask.toDate}
                value={toDate}
                min={fromDate || undefined}
                max={todayYmd}
                onChange={(e) => onToDateChange(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-voicebot"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.voicebot}
                onChange={(e) => setFilterMask((m) => ({ ...m, voicebot: e.target.checked }))}
                label={outboundCheckLabel("voicebot", "Voicebot", OUTBOUND_FIELD_TOOLTIPS.voicebot)}
              />
              <Form.Select
                style={{ width: "200px" }}
                disabled={!filterMask.voicebot}
                value={selectedVoicebotId}
                onChange={(e) => setSelectedVoicebotId(e.target.value)}
              >
                <option value="">All voicebots</option>
                {voicebotOptions.map((v) => (
                  <option key={String(v.id)} value={String(v.id)}>{v.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-call-status"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.callStatus}
                onChange={(e) => setFilterMask((m) => ({ ...m, callStatus: e.target.checked }))}
                label={outboundCheckLabel("call-status", "Call status", OUTBOUND_FIELD_TOOLTIPS.callStatus)}
              />
              <Form.Select
                style={{ width: "180px" }}
                disabled={!filterMask.callStatus}
                value={callStatusFilter}
                onChange={(e) => setCallStatusFilter(e.target.value)}
              >
                {REPORTS_CALL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-duration-min"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.durationMin}
                onChange={(e) => setFilterMask((m) => ({ ...m, durationMin: e.target.checked }))}
                label={outboundCheckLabel("duration-min", "Duration min (s)", OUTBOUND_FIELD_TOOLTIPS.durationMin)}
              />
              <Form.Control
                type="number"
                min={0}
                style={{ width: "120px" }}
                disabled={!filterMask.durationMin}
                value={durationMinSec}
                onChange={(e) => setDurationMinSec(Number(e.target.value) || 0)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Check
                id="out-analytics-flt-duration-max"
                type="checkbox"
                className="small mb-1"
                checked={filterMask.durationMax}
                onChange={(e) => setFilterMask((m) => ({ ...m, durationMax: e.target.checked }))}
                label={outboundCheckLabel("duration-max", "Duration max (s)", OUTBOUND_FIELD_TOOLTIPS.durationMax)}
              />
              <Form.Control
                type="number"
                min={0}
                style={{ width: "120px" }}
                disabled={!filterMask.durationMax}
                value={durationMaxSec}
                onChange={(e) => setDurationMaxSec(Number(e.target.value) || 0)}
              />
            </Form.Group>
              </div>
            </div>
          </Collapse>
        </Col>
      </Row>

      {dashboardContent}

      <React.Fragment>
          <div className="mt-4 p-4 card" style={{ minHeight: "360px" }}>
            <h5 className="mb-1">Call Volume Over Time</h5>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <p className="small text-muted mb-0">Calls by date</p>
              {volumeTruncated && <span className="small text-muted">Showing first 5000 calls (results truncated)</span>}
            </div>
            {volumeContent}
          </div>

          <div className="mt-4 p-4 card" style={{ minHeight: "360px" }}>
            <h5 className="mb-1">Success Rate Trend</h5>
            <p className="small text-muted mb-3">
              Success rate by date
              {successRateTrendDescriptionSuffix}
            </p>
            {successRateTrendContent}
          </div>

          <div className="mt-4 p-4 card" style={{ minHeight: "360px" }}>
            <h5 className="mb-1">Campaign Performance Comparison</h5>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <p className="small text-muted mb-0">Completed vs failed by campaign</p>
              {perfTruncated && <span className="small text-muted">Showing first 5000 calls (results truncated)</span>}
            </div>
            {campaignPerformanceContent}
          </div>

          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <h5 className="mb-1">Cost Analysis</h5>
                  <p className="small text-muted mb-3">Breakdown and trends</p>
                  {costContent}
                </Card.Body>
              </Card>
            </Col>
          </Row>
      </React.Fragment>
    </React.Fragment>
  );
};

OutboundAnalytics.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OutboundAnalytics;
