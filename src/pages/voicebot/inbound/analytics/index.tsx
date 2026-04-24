import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getBots,
  getCalls,
  getCallsStats,
  getAnalyticsSummary,
  type GetCallsStatsParams,
  type ListBotsParams,
} from "@utils/voicebot/inbound";
import { GetCompanies } from "@utils/users";
import {
  parseAnalyticsSummaryPayload,
  parseCallsStatsPayload,
  parseCallStatusDistribution,
  parseDurationDistributionFromCallsStats,
  parseDurationDistributionFromSummary,
  parseVolumeDataFromSummary,
  parseBotPerformanceFromSummary,
} from "@utils/voicebot/inboundAnalyticsSummary";
import { inboundCallListStatus } from "@utils/voicebot/formDisplay";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
import { humanizeSnakeCase } from "@utils/Helper";
import { Row } from "react-bootstrap";
import { useSession } from "next-auth/react";
import {
  KeyMetrics,
  AnalyticsFilters,
  CallStatusDistributionChart,
  CallDurationDistributionChart,
  CallVolumeOverTimeChart,
  BotPerformanceTable,
  BotPerformanceComparisonChart,
  getDateRange,
  getDateKeysInRange,
  DURATION_BUCKETS,
  type BotPerformanceRow,
} from "@components/voicebot/inbound/analytics";
import "@assets/scss/common.scss";

function statusCount(
  rows: { name: string; value: number }[],
  canonical: string,
): number | undefined {
  const row = rows.find((d) => d.name.toLowerCase() === canonical);
  return row?.value;
}

/** Unwrap common voicebot list envelopes: results, data, items, nested data.{…}. */
function coerceListFromVoicebot(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  const o = res as Record<string, unknown>;
  const asArr = (v: unknown): unknown[] | null =>
    Array.isArray(v) ? v : null;
  const top =
    asArr(o.results) ??
    asArr(o.data) ??
    asArr(o.items) ??
    asArr(o.bots) ??
    asArr(o.records);
  if (top) return top;
  const data = o.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const d = data as Record<string, unknown>;
    return (
      asArr(d.results) ??
      asArr(d.data) ??
      asArr(d.items) ??
      asArr(d.bots) ??
      []
    );
  }
  return [];
}

function addBotIdAlias(
  out: Record<string, string>,
  rawId: unknown,
  displayName: string,
) {
  const name = displayName.trim();
  if (!name || rawId == null || typeof rawId === "object") return;
  const s = String(rawId).trim();
  if (!s || s === "[object Object]") return;
  out[s] = name;
  out[s.toLowerCase()] = name;
}

/** Map bot id variants -> display name from GET /bots/ list items. */
function buildBotNameLookup(res: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of coerceListFromVoicebot(res)) {
    if (raw == null || typeof raw !== "object") continue;
    const b = raw as Record<string, unknown>;
    const name =
      (typeof b.name === "string" && b.name.trim()) ||
      (typeof b.title === "string" && b.title.trim()) ||
      "";
    if (!name) continue;
    const idFields: unknown[] = [
      b.id,
      b.bot_id,
      b.uuid,
      b.bot_uuid,
      b.pk,
      b.botId,
      b.voicebot_id,
      b.voice_bot_id,
      typeof b.bot === "string" ? b.bot : null,
    ];
    for (const idv of idFields) {
      addBotIdAlias(out, idv, name);
    }
  }
  return out;
}

function mergeBotLookups(...maps: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...maps);
}

/** Prefer stable bot id from call row (avoid using human name as grouping key). */
function resolveBotIdFromCallRow(c: Record<string, unknown>): string {
  const pick = (v: unknown): string => {
    if (v == null || typeof v === "object") return "";
    const s = String(v).trim();
    return s && s !== "[object Object]" ? s : "";
  };
  const direct =
    pick(c.bot_id) ||
    pick(c.bot_uuid) ||
    pick(c.botId) ||
    pick(c.bot_pk) ||
    pick(c.voicebot_id) ||
    pick(c.voice_bot_id);
  if (direct) return direct;
  const bot = c.bot;
  if (typeof bot === "string" && bot.trim()) return bot.trim();
  if (bot && typeof bot === "object") {
    const o = bot as Record<string, unknown>;
    return (
      pick(o.id) ||
      pick(o.bot_id) ||
      pick(o.uuid) ||
      pick(o.voicebot_id) ||
      pick(o.voice_bot_id)
    );
  }
  return "";
}

function botNameFromLookup(lookup: Record<string, string>, id: string): string {
  const k = id.trim();
  if (!k) return "";
  return (lookup[k] ?? lookup[k.toLowerCase()] ?? "").trim();
}

function enrichBotRowNames(
  rows: BotPerformanceRow[],
  lookup: Record<string, string>,
): BotPerformanceRow[] {
  if (!rows.length || !Object.keys(lookup).length) return rows;
  return rows.map((row) => {
    const key = (row.botLookupId ?? row.name).trim();
    const mapped = botNameFromLookup(lookup, key);
    if (mapped) return { ...row, name: mapped };
    return row;
  });
}

const AnalyticsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [timePeriod, setTimePeriod] = useState("7");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [analyticsSummaryRaw, setAnalyticsSummaryRaw] = useState<unknown>(null);
  /** GET /calls/stats/ (no params) — scalars + status counts; no duration buckets in current API. */
  const [callsStatsRaw, setCallsStatsRaw] = useState<unknown>(null);

  const [clientStatusData, setClientStatusData] = useState<
    { name: string; value: number }[]
  >([]);
  const [clientDurationData, setClientDurationData] = useState<
    { name: string; count: number }[]
  >([]);
  const [clientVolumeData, setClientVolumeData] = useState<
    { date: string; dateKey: string; calls: number }[]
  >([]);
  const [clientBotRows, setClientBotRows] = useState<BotPerformanceRow[]>([]);
  const [botNameById, setBotNameById] = useState<Record<string, string>>({});

  /** Ignore out-of-order responses when company/time filters change quickly. */
  const callsListFetchIdRef = useRef(0);
  const statsFetchIdRef = useRef(0);

  const stats = useMemo(() => {
    return (
      parseCallsStatsPayload(callsStatsRaw) ??
      parseAnalyticsSummaryPayload(callsStatsRaw) ??
      parseAnalyticsSummaryPayload(analyticsSummaryRaw)
    );
  }, [callsStatsRaw, analyticsSummaryRaw]);

  /** Company/date-scoped breakdown only (GET /calls/stats/). Do not fall back to unscoped analytics summary — wrong tenant. */
  const statusDistributionFromApi = useMemo(
    () => parseCallStatusDistribution(callsStatsRaw),
    [callsStatsRaw],
  );

  const durationFromCallsStats = useMemo(
    () => parseDurationDistributionFromCallsStats(callsStatsRaw),
    [callsStatsRaw],
  );

  const durationFromSummary = useMemo(
    () => parseDurationDistributionFromSummary(analyticsSummaryRaw),
    [analyticsSummaryRaw],
  );

  const volumeFromApi = useMemo(
    () => parseVolumeDataFromSummary(analyticsSummaryRaw, timePeriod),
    [analyticsSummaryRaw, timePeriod],
  );

  const botRowsFromApi = useMemo(
    () => parseBotPerformanceFromSummary(analyticsSummaryRaw),
    [analyticsSummaryRaw],
  );

  /**
   * Prefer client aggregation from GET /calls/ (same filters as stats). It updates when
   * company/period changes and avoids stale pie data when the API returns [] or an old
   * non-empty breakdown while stats are still catching up.
   */
  const statusData = useMemo(() => {
    if (loading) return [];
    const humanize = (rows: { name: string; value: number }[]) =>
      rows.map((d) => ({ ...d, name: humanizeSnakeCase(d.name, d.name) }));
    if (clientStatusData.length > 0) return humanize(clientStatusData);
    const fromApi = statusDistributionFromApi;
    if (fromApi != null && fromApi.length > 0) return humanize(fromApi);
    return [];
  }, [loading, clientStatusData, statusDistributionFromApi]);

  const statusChartDataSignature = useMemo(
    () =>
      statusData
        .map((d) => `${String(d.name).toLowerCase()}:${d.value}`)
        .sort()
        .join("|"),
    [statusData],
  );
  const durationData =
    durationFromCallsStats ?? durationFromSummary ?? clientDurationData;
  const volumeData = volumeFromApi ?? clientVolumeData;
  /** Empty API array is truthy with `??` and would hide client rows (where names come from GET /calls/). */
  const botPerformanceRows = useMemo(() => {
    const base =
      botRowsFromApi && botRowsFromApi.length > 0 ? botRowsFromApi : clientBotRows;
    return enrichBotRowNames(base, botNameById);
  }, [botRowsFromApi, clientBotRows, botNameById]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await GetCompanies();
      if (res === false) {
        setCompanies([]);
        return;
      }
      setCompanies(normalizeCompaniesResponse(res));
    } catch {
      setCompanies([]);
    }
  }, []);

  useEffect(() => {
    const companyIdentifier = (session?.user as { company_identifier?: string })
      ?.company_identifier;
    if (!isAdmin && companyIdentifier) setCompanyFilter(companyIdentifier);
  }, [isAdmin, session?.user]);

  const fetchCallsForDistribution = useCallback(async () => {
    const fetchId = ++callsListFetchIdRef.current;
    setLoading(true);
    setClientStatusData([]);
    setClientDurationData([]);
    setClientVolumeData([]);
    setClientBotRows([]);
    setBotNameById({});
    try {
      const params: Record<string, string | number | undefined> = { limit: 100 };
      const companyIdentifier = (session?.user as { company_identifier?: string })
        ?.company_identifier;
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      else if (companyFilter) params.company_id = companyFilter;
      const { start_date, end_date } = getDateRange(timePeriod);
      if (start_date) params.date_from = start_date;
      if (end_date) params.date_to = end_date;

      const botsParams: ListBotsParams = { limit: 100 };
      if (!isAdmin && companyIdentifier) botsParams.company_id = companyIdentifier;
      else if (companyFilter) botsParams.company_id = companyFilter;

      const sessionCompanyId = String(
        (session?.user as { company_id?: string })?.company_id ?? "",
      ).trim();
      const needSessionBots =
        !isAdmin &&
        sessionCompanyId.length > 0 &&
        sessionCompanyId !== String(botsParams.company_id ?? "").trim();

      const [callsRes, botsScoped, botsSessionCo, botsAllAdmin] = await Promise.all([
        getCalls(params),
        getBots(botsParams).catch(() => null),
        needSessionBots
          ? getBots({ company_id: sessionCompanyId, limit: 100 }).catch(() => null)
          : Promise.resolve(null),
        isAdmin ? getBots({ limit: 100 }).catch(() => null) : Promise.resolve(null),
      ]);
      if (fetchId !== callsListFetchIdRef.current) return;

      const botLookup = mergeBotLookups(
        buildBotNameLookup(botsAllAdmin ?? []),
        buildBotNameLookup(botsSessionCo ?? []),
        buildBotNameLookup(botsScoped ?? []),
      );
      setBotNameById(botLookup);

      const list = Array.isArray(callsRes)
        ? callsRes
        : (callsRes as { results?: { status?: string; call_duration_seconds?: number; session_start_time?: string }[] })?.results ??
          (callsRes as { data?: { status?: string; call_duration_seconds?: number; session_start_time?: string }[] })?.data ??
          [];
      const rawList = Array.isArray(list) ? list : [];

      type CallItem = {
        status?: string;
        call_duration_seconds?: number;
        session_start_time?: string;
        bot?: string | Record<string, unknown>;
        bot_id?: string | number;
        bot_name?: string;
      };

      const botLabelForCall = (c: CallItem, botId: string): string => {
        const row = c as Record<string, unknown>;
        const n = c.bot_name ?? row.bot_name;
        if (typeof n === "string" && n.trim()) return n.trim();
        const b = c.bot;
        if (typeof b === "string" && b.trim()) return b.trim();
        if (b && typeof b === "object") {
          const o = b as { name?: unknown; id?: unknown };
          if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
        }
        return botId || "—";
      };

      const byStatus: Record<string, number> = {};
      const byDuration: Record<string, number> = {};
      const byDate: Record<string, number> = {};
      const byBot: Record<
        string,
        {
          name: string;
          total: number;
          completed: number;
          transferred: number;
          failed: number;
        }
      > = {};
      DURATION_BUCKETS.forEach((b) => {
        byDuration[b.key] = 0;
      });

      rawList.forEach((c: CallItem) => {
        const s = inboundCallListStatus(c as Record<string, unknown>) || "unknown";
        byStatus[s] = (byStatus[s] ?? 0) + 1;
        const sec = Number(c.call_duration_seconds);
        const validSec = Number.isFinite(sec) && sec >= 0 ? sec : 0;
        const bucket = DURATION_BUCKETS.find(
          (b) => validSec >= b.min && validSec <= b.max,
        );
        if (bucket) byDuration[bucket.key]++;
        const startTime = c.session_start_time;
        if (startTime) {
          try {
            const d = new Date(startTime);
            const key = d.toISOString().slice(0, 10);
            byDate[key] = (byDate[key] ?? 0) + 1;
          } catch {
            // skip invalid date
          }
        }
        const botId = resolveBotIdFromCallRow(c as Record<string, unknown>);
        if (botId) {
          if (!byBot[botId]) {
            const fromLookup = botNameFromLookup(botLookup, botId);
            byBot[botId] = {
              name: fromLookup || botLabelForCall(c, botId),
              total: 0,
              completed: 0,
              transferred: 0,
              failed: 0,
            };
          }
          byBot[botId].total += 1;
          if (s === "completed" || s === "answered") byBot[botId].completed += 1;
          else if (s === "transferred") byBot[botId].transferred += 1;
          else if (s === "failed" || s === "timeout" || s === "dropped") {
            byBot[botId].failed += 1;
          }
        }
      });

      for (const bid of Object.keys(byBot)) {
        const mapped = botNameFromLookup(botLookup, bid);
        if (mapped) byBot[bid].name = mapped;
      }

      setClientStatusData(
        Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      );
      setClientBotRows(
        Object.entries(byBot).map(([bid, v]) => ({
          name: v.name,
          botLookupId: bid,
          total: v.total,
          completed: v.completed,
          transferred: v.transferred,
          failed: v.failed,
          successRate:
            v.total > 0 ? ((v.completed / v.total) * 100).toFixed(1) : "0.0",
        })),
      );
      setClientDurationData(
        DURATION_BUCKETS.map((b) => ({
          name: b.label,
          count: byDuration[b.key] ?? 0,
        })),
      );

      const formatDateLabel = (dateKey: string) =>
        new Date(dateKey + "Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      const dateKeysInRange = getDateKeysInRange(timePeriod);
      const volumeSorted =
        dateKeysInRange.length > 0
          ? dateKeysInRange.map((dateKey) => ({
              dateKey,
              date: formatDateLabel(dateKey),
              calls: byDate[dateKey] ?? 0,
            }))
          : Object.entries(byDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, calls]) => ({
                dateKey,
                date: formatDateLabel(dateKey),
                calls,
              }));
      setClientVolumeData(volumeSorted);
    } catch {
      if (fetchId !== callsListFetchIdRef.current) return;
      setClientStatusData([]);
      setClientDurationData([]);
      setClientVolumeData([]);
      setClientBotRows([]);
      setBotNameById({});
    } finally {
      if (fetchId === callsListFetchIdRef.current) setLoading(false);
    }
  }, [isAdmin, session?.user, companyFilter, timePeriod]);

  const fetchStats = useCallback(async () => {
    const fetchId = ++statsFetchIdRef.current;
    setSummaryLoading(true);
    setCallsStatsRaw(null);
    setAnalyticsSummaryRaw(null);
    try {
      const params: GetCallsStatsParams = {};
      const companyIdentifier = (session?.user as { company_identifier?: string })
        ?.company_identifier;
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      else if (companyFilter) params.company_id = companyFilter;
      const { start_date, end_date } = getDateRange(timePeriod);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;

      const [summaryRes, callsStatsRes] = await Promise.all([
        getAnalyticsSummary(),
        getCallsStats(params),
      ]);
      if (fetchId !== statsFetchIdRef.current) return;
      setAnalyticsSummaryRaw(summaryRes);
      setCallsStatsRaw(callsStatsRes);
    } catch {
      if (fetchId !== statsFetchIdRef.current) return;
      setAnalyticsSummaryRaw(null);
      setCallsStatsRaw(null);
    } finally {
      if (fetchId === statsFetchIdRef.current) setSummaryLoading(false);
    }
  }, [isAdmin, session?.user, companyFilter, timePeriod]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);
  useEffect(() => {
    fetchCallsForDistribution();
  }, [fetchCallsForDistribution]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalCalls = statusData.reduce((sum, d) => sum + d.value, 0);
  const completedCount = (() => {
    if (typeof stats?.completed === "number" && !Number.isNaN(stats.completed)) {
      return stats.completed;
    }
    const done = statusCount(statusData, "completed");
    const answered = statusCount(statusData, "answered");
    return (done ?? 0) + (answered ?? 0);
  })();
  const failedCount = (() => {
    if (typeof stats?.failed === "number" && !Number.isNaN(stats.failed)) {
      return stats.failed;
    }
    const failed = statusCount(statusData, "failed");
    const timeout = statusCount(statusData, "timeout");
    const dropped = statusCount(statusData, "dropped");
    return (failed ?? 0) + (timeout ?? 0) + (dropped ?? 0);
  })();
  const transferredCount = (() => {
    if (
      typeof stats?.transferred === "number" &&
      !Number.isNaN(stats.transferred)
    ) {
      return stats.transferred;
    }
    return statusCount(statusData, "transferred") ?? 0;
  })();
  const totalFromStats = stats?.total_calls ?? totalCalls;
  const successRate =
    totalFromStats > 0
      ? ((completedCount / totalFromStats) * 100).toFixed(1)
      : "0.0";
  const transferRate =
    totalFromStats > 0
      ? ((transferredCount / totalFromStats) * 100).toFixed(1)
      : "0.0";
  const totalCost = Number(stats?.total_cost ?? 0);
  const costPerCall =
    totalFromStats > 0 && totalCost >= 0
      ? (totalCost / totalFromStats).toFixed(4)
      : "0.0000";
  const formatAvgDuration = (sec?: number) => {
    if (sec == null) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusChartLoading =
    loading || (summaryLoading && statusData.length === 0);
  const durationChartLoading =
    durationFromCallsStats == null &&
    durationFromSummary == null &&
    (summaryLoading || loading);
  const volumeChartLoading =
    volumeFromApi == null && (summaryLoading || loading);
  const botChartsLoading =
    clientBotRows.length === 0 &&
    !(botRowsFromApi && botRowsFromApi.length > 0) &&
    (summaryLoading || loading);

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Voicebot Inbound - Analytics"
      />
      <AnalyticsFilters
        isAdmin={isAdmin}
        companyFilter={companyFilter}
        timePeriod={timePeriod}
        companies={companies}
        onCompanyChange={setCompanyFilter}
        onTimePeriodChange={setTimePeriod}
      />
      <KeyMetrics
        totalCalls={stats?.total_calls ?? totalCalls ?? 0}
        successRate={successRate}
        avgDuration={formatAvgDuration(stats?.avg_duration_seconds)}
        totalCost={totalCost.toFixed(4)}
        completedCount={completedCount}
        transferRate={transferRate}
        failedCount={failedCount}
        costPerCall={costPerCall}
      />
      <Row>
        <CallStatusDistributionChart
          key={statusChartDataSignature}
          loading={statusChartLoading}
          data={statusData}
          totalCalls={totalCalls}
        />
        <CallDurationDistributionChart
          loading={durationChartLoading}
          data={durationData}
        />
      </Row>
      <Row>
        <CallVolumeOverTimeChart loading={volumeChartLoading} data={volumeData} />
      </Row>

      <div className="mt-4">
        <BotPerformanceTable loading={botChartsLoading} rows={botPerformanceRows} />
      </div>

      <Row>
        <BotPerformanceComparisonChart
          loading={botChartsLoading}
          rows={botPerformanceRows}
        />
      </Row>
    </React.Fragment>
  );
};

AnalyticsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AnalyticsPage;
