import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Col, Form, Row, Spinner } from "react-bootstrap";
import { useSession } from "next-auth/react";
import {
  getAnalyticsCosts,
  getAnalyticsDashboard,
  getAnalyticsTrends,
  getCampaigns,
  getVoicebots,
  normalizeVoicebotsListResponse,
  postReportsCalls,
  type AnalyticsCostsApiResponse,
  type AnalyticsCostsByCampaignItem,
  type AnalyticsCostsData,
  type AnalyticsTrendsPeriod,
  type PostReportsCallsPayload,
} from "@utils/voicebot/outbound";
import { OUTBOUND_VOICEBOT_CREATE_COMPANY_ID, OUTBOUND_VOICEBOT_LIST_PAGE_SIZE } from "@utils/voicebot/outboundVoicebotForm";
import moment from "moment";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { GetCompanies } from "@utils/users";
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

const REPORTS_CALL_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "timeout", label: "Timeout" },
];

const TRENDS_PERIOD_OPTIONS: Array<{ value: AnalyticsTrendsPeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "14d", label: "Last 14 days" },
  { value: "30d", label: "Last 30 days" },
];

type OutboundReportsCallsChartFilters = {
  companyIdentifier: string;
  campaignId: string;
  voicebotId: string;
  callStatus: string;
  durationMin: number;
  durationMax: number;
  fromDate: string;
  toDate: string;
};

function buildAnalyticsReportsCallsPayload(args: {
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
    company_id: companyIdentifier,
    page,
    page_size: pageSize,
    date_from: fromDate,
    date_to: toDate,
    duration_min: durationMin,
    duration_max: durationMax,
  };
  if (campaignId) {
    const n = Number(campaignId);
    if (Number.isFinite(n)) payload.campaign_id = n;
  }
  if (voicebotId) {
    const n = Number(voicebotId);
    if (Number.isFinite(n)) payload.voicebot_id = n;
  }
  if (callStatus) payload.call_status = callStatus;
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

type ReportsCallsResponse = {
  status?: boolean;
  count?: number;
  results?: Array<{ session_start_time?: string; created_at?: string }>;
  detail?: string;
  message?: string;
};

type CampaignPerformanceRow = {
  campaign_id?: number | string;
  campaign_name?: string;
  call_status?: string;
};

function campaignLabelFromRow(r: CampaignPerformanceRow): string {
  const idKey = String(r?.campaign_id ?? "");
  const name = String(r?.campaign_name ?? "").trim();
  return name || (idKey ? `#${idKey}` : "—");
}

function aggregateCampaignPerformance(list: CampaignPerformanceRow[]) {
  const map = new Map<string, { campaignLabel: string; completed: number; failed: number; total: number }>();
  for (const r of list) {
    const label = campaignLabelFromRow(r);
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

type CompanyOption = { id: string; name: string };
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

function useOutboundDashboard(companyIdentifier: string, campaignId: string, fromDate: string, toDate: string) {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { company_id: companyIdentifier };
        if (campaignId) params.campaign_id = campaignId;
        if (fromDate) {
          params.start_date = ymdStartIso(fromDate);
          params.date_from = fromDate;
        }
        if (toDate) {
          params.end_date = ymdEndIso(toDate);
          params.date_to = toDate;
        }
        const res = (await getAnalyticsDashboard(params)) as DashboardResponse;
        const data = res?.data ?? null;
        if (!cancelled) setDashboard(data && typeof data === "object" ? data : null);
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
  }, [companyIdentifier, campaignId, fromDate, toDate]);

  return { loading, dashboard };
}

function useOutboundCallVolume(filters: OutboundReportsCallsChartFilters) {
  const { companyIdentifier, campaignId, voicebotId, callStatus, durationMin, durationMax, fromDate, toDate } = filters;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Array<{ dateKey: string; calls: number }>>([]);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!fromDate || !toDate) {
      setData([]);
      setTruncated(false);
      return;
    }

    let cancelled = false;

    async function fetchVolume() {
      setLoading(true);
      try {
        const PAGE_SIZE = 5000;
        const payload = buildAnalyticsReportsCallsPayload({
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

        const res = (await postReportsCalls(payload)) as ReportsCallsResponse;
        const list = Array.isArray(res?.results) ? res.results : [];
        const count = Number(res?.count ?? list.length);
        if (!cancelled) setTruncated(Number.isFinite(count) && count > PAGE_SIZE);

        const keys = getDateKeysBetween(fromDate, toDate);
        const map: Record<string, number> = {};
        keys.forEach((k) => {
          map[k] = 0;
        });

        for (const row of list) {
          const dayKey = safeToYmd(row?.session_start_time ?? row?.created_at);
          if (!dayKey) continue;
          if (map[dayKey] == null) continue;
          map[dayKey] += 1;
        }

        if (!cancelled) {
          setData(keys.map((k) => ({ dateKey: k, calls: map[k] ?? 0 })));
        }
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
  }, [companyIdentifier, campaignId, voicebotId, callStatus, durationMin, durationMax, fromDate, toDate]);

  return { loading, data, truncated };
}

function useOutboundCosts(fromDate: string, toDate: string) {
  const [loading, setLoading] = useState(false);
  const [costs, setCosts] = useState<AnalyticsCostsData | null>(null);

  useEffect(() => {
    if (!fromDate || !toDate) {
      setCosts(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchCosts() {
      setLoading(true);
      try {
        const res = (await getAnalyticsCosts({
          date_from: fromDate,
          date_to: toDate,
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
  }, [fromDate, toDate]);

  return { loading, costs };
}

function useOutboundCampaignPerformance(filters: OutboundReportsCallsChartFilters) {
  const { companyIdentifier, campaignId, voicebotId, callStatus, durationMin, durationMax, fromDate, toDate } = filters;
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Array<{ campaignLabel: string; completed: number; failed: number; total: number }>>([]);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!fromDate || !toDate) {
      setRows([]);
      setTruncated(false);
      return;
    }

    let cancelled = false;

    async function fetchPerformance() {
      setLoading(true);
      try {
        const PAGE_SIZE = 5000;
        const payload = buildAnalyticsReportsCallsPayload({
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

        const res = (await postReportsCalls(payload)) as {
          status?: boolean;
          count?: number;
          results?: CampaignPerformanceRow[];
        };

        const list = Array.isArray(res?.results) ? res.results : [];
        const count = Number(res?.count ?? list.length);
        if (!cancelled) setTruncated(Number.isFinite(count) && count > PAGE_SIZE);
        if (!cancelled) setRows(aggregateCampaignPerformance(list));
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
  }, [companyIdentifier, campaignId, voicebotId, callStatus, durationMin, durationMax, fromDate, toDate]);

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
  companyIdentifier: string;
  isAdmin: boolean;
  dashboardLoading: boolean;
  dashboard: DashboardData | null;
}): React.ReactNode {
  const { companyIdentifier, isAdmin, dashboardLoading, dashboard } = args;
  if (!companyIdentifier) return renderCompanyEmptyState({ isAdmin });
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
  fromDate: string;
  toDate: string;
  volumeLoading: boolean;
  volumeData: Array<{ dateKey: string; calls: number }>;
}): React.ReactNode {
  const { fromDate, toDate, volumeLoading, volumeData } = args;
  if (!fromDate || !toDate) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">Select a date range</p>
        <p className="small mb-0 opacity-75">Choose From Date and To Date (or use the time period dropdown).</p>
      </div>
    );
  }
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
        <Tooltip
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
        <p className="small mb-0 opacity-75">Try a different trends period or check back later.</p>
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
        <Tooltip
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
  fromDate: string;
  toDate: string;
  loading: boolean;
  rows: Array<{ campaignLabel: string; completed: number; failed: number; total: number }>;
}): React.ReactNode {
  const { fromDate, toDate, loading, rows } = args;
  if (!fromDate || !toDate) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5" style={{ minHeight: "280px" }}>
        <BarChart3 size={48} className="mb-3 opacity-50" strokeWidth={1.5} />
        <p className="mb-1 fw-medium">Select a date range</p>
        <p className="small mb-0 opacity-75">Choose From Date and To Date (or use the time period dropdown).</p>
      </div>
    );
  }
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
        <Tooltip
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
    return row.is_deleted ? `${name} (deleted)` : name;
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
                <Tooltip
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
                  <Tooltip
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
                  <Tooltip
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



const OutboundAnalytics = () => {
  const { data: session } = useSession();
  const isAdmin = String((session?.user as { is_admin?: string | number } | undefined)?.is_admin ?? "") === "1";
  /** All outbound analytics API calls use this `company_id` for now. */
  const analyticsCompanyId = OUTBOUND_VOICEBOT_CREATE_COMPANY_ID;

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [voicebotOptions, setVoicebotOptions] = useState<Array<{ id: number | string; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedVoicebotId, setSelectedVoicebotId] = useState<string>("");
  const [callStatusFilter, setCallStatusFilter] = useState<string>("");
  const [durationMinSec, setDurationMinSec] = useState(0);
  const [durationMaxSec, setDurationMaxSec] = useState(3600);
  const debouncedDurationMinSec = useDebouncedValue(durationMinSec, 400);
  const debouncedDurationMaxSec = useDebouncedValue(durationMaxSec, 400);

  const effectiveCampaignId = selectedCampaignId;

  const [timePeriod, setTimePeriod] = useState<TimePeriodOption["value"]>("7");
  const [trendsPeriod, setTrendsPeriod] = useState<AnalyticsTrendsPeriod>("7d");
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);

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
      companyIdentifier: analyticsCompanyId,
      campaignId: effectiveCampaignId,
      voicebotId: selectedVoicebotId,
      callStatus: callStatusFilter,
      durationMin: debouncedDurationMinSec,
      durationMax: debouncedDurationMaxSec,
      fromDate,
      toDate,
    }),
    [
      analyticsCompanyId,
      effectiveCampaignId,
      selectedVoicebotId,
      callStatusFilter,
      debouncedDurationMinSec,
      debouncedDurationMaxSec,
      fromDate,
      toDate,
    ]
  );

  const { loading: dashboardLoading, dashboard } = useOutboundDashboard(analyticsCompanyId, effectiveCampaignId, fromDate, toDate);
  const { loading: volumeLoading, data: volumeData, truncated: volumeTruncated } = useOutboundCallVolume(reportsCallsChartFilters);
  const { loading: costLoading, costs } = useOutboundCosts(fromDate, toDate);
  const { loading: perfLoading, rows: perfRows, truncated: perfTruncated } = useOutboundCampaignPerformance(reportsCallsChartFilters);

  useEffect(() => {
    let cancelled = false;
    const period = trendsPeriod;

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
  }, [trendsPeriod]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchCompanies() {
      try {
        const res = await GetCompanies();
        const list =
          Array.isArray(res)
            ? res
            : (res as { results?: unknown[] })?.results ?? (res as { data?: unknown[] })?.data ?? [];
        const opts = (Array.isArray(list) ? list : []).map((c) => {
          const item = c as { company_id?: string; id?: string; identifier?: string; name?: string };
          const id = item.company_id ?? item.identifier ?? item.id ?? "";
          return { id, name: item.name ?? id };
        }).filter((c) => Boolean(c.id));
        if (!cancelled) setCompanies(opts);
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
      try {
        const res = await getCampaigns({ page: 1, page_size: 500 });
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
  }, []);

  useEffect(() => {
    const next = getDefaultDateRange(timePeriod);
    if (!next.from || !next.to) return;
    setFromDate(next.from);
    setToDate(next.to);
  }, [timePeriod]);

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
    companyIdentifier: analyticsCompanyId,
    isAdmin,
    dashboardLoading,
    dashboard,
  });
  const volumeContent = renderVolumeContent({ fromDate, toDate, volumeLoading, volumeData });
  const successRateTrendContent = renderSuccessRateTrendContent({
    loading: trendsLoading,
    trends,
  });
  const campaignPerformanceContent = renderCampaignPerformanceContent({
    fromDate,
    toDate,
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
      />

      <Row className="mb-3">
        <Col md={12}>
          <div className="d-flex justify-content-end flex-wrap gap-3">
            {isAdmin && (
              <React.Fragment>
                <Form.Group className="mb-0">
                  <Form.Label className="small mb-1">Company</Form.Label>
                  <Form.Select
                    style={{ width: "220px" }}
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-0">
                  <Form.Label className="small mb-1">Campaign</Form.Label>
                  <Form.Select
                    style={{ width: "220px" }}
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
              <Form.Label className="small mb-1">Time period</Form.Label>
              <Form.Select
                style={{ width: "200px" }}
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriodOption["value"])}
              >
                {TIME_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">Trends period</Form.Label>
              <Form.Select
                style={{ width: "200px" }}
                value={trendsPeriod}
                onChange={(e) => setTrendsPeriod(e.target.value as AnalyticsTrendsPeriod)}
              >
                {TRENDS_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">From Date</Form.Label>
              <Form.Control
                type="date"
                style={{ width: "180px" }}
                value={fromDate}
                max={toDate || todayYmd}
                onChange={(e) => onFromDateChange(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">To Date</Form.Label>
              <Form.Control
                type="date"
                style={{ width: "180px" }}
                value={toDate}
                min={fromDate || undefined}
                max={todayYmd}
                onChange={(e) => onToDateChange(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">Voicebot</Form.Label>
              <Form.Select
                style={{ width: "200px" }}
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
              <Form.Label className="small mb-1">Call status</Form.Label>
              <Form.Select
                style={{ width: "180px" }}
                value={callStatusFilter}
                onChange={(e) => setCallStatusFilter(e.target.value)}
              >
                {REPORTS_CALL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">Duration min (s)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                style={{ width: "120px" }}
                value={durationMinSec}
                onChange={(e) => setDurationMinSec(Number(e.target.value) || 0)}
              />
            </Form.Group>

            <Form.Group className="mb-0">
              <Form.Label className="small mb-1">Duration max (s)</Form.Label>
              <Form.Control
                type="number"
                min={0}
                style={{ width: "120px" }}
                value={durationMaxSec}
                onChange={(e) => setDurationMaxSec(Number(e.target.value) || 0)}
              />
            </Form.Group>
          </div>
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
              Success rate by date for the selected trends period ({trendsPeriod}).
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
