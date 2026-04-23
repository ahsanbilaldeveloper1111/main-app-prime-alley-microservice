import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import {
  getCalls,
  getCallsStats,
  getAnalyticsSummary,
  getCompanies,
} from "@utils/voicebot/inbound";
import {
  parseAnalyticsSummaryPayload,
  parseCallStatusDistribution,
  parseDurationDistributionFromCallsStats,
  parseDurationDistributionFromSummary,
  parseVolumeDataFromSummary,
  parseBotPerformanceFromSummary,
} from "@utils/voicebot/inboundAnalyticsSummary";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";
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

  const stats = useMemo(() => {
    return (
      parseAnalyticsSummaryPayload(callsStatsRaw) ??
      parseAnalyticsSummaryPayload(analyticsSummaryRaw)
    );
  }, [callsStatsRaw, analyticsSummaryRaw]);

  const statusDistributionFromApi = useMemo(() => {
    return (
      parseCallStatusDistribution(callsStatsRaw) ??
      parseCallStatusDistribution(analyticsSummaryRaw)
    );
  }, [callsStatsRaw, analyticsSummaryRaw]);

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

  const statusData = statusDistributionFromApi ?? clientStatusData;
  const durationData =
    durationFromCallsStats ?? durationFromSummary ?? clientDurationData;
  const volumeData = volumeFromApi ?? clientVolumeData;
  const botPerformanceRows = botRowsFromApi ?? clientBotRows;

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies();
      setCompanies(normalizeCompaniesResponse(res, { prefer: "company_id" }));
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
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 500 };
      const companyIdentifier = (session?.user as { company_identifier?: string })
        ?.company_identifier;
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      else if (companyFilter) params.company_id = companyFilter;
      const { start_date, end_date } = getDateRange(timePeriod);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;

      const callsRes = await getCalls(params);

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
        bot?: string;
        bot_name?: string;
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
        const s = String(c.status ?? "unknown").toLowerCase();
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
        const botId = c.bot ?? "";
        if (botId) {
          if (!byBot[botId]) {
            byBot[botId] = {
              name: String(c.bot_name ?? "—"),
              total: 0,
              completed: 0,
              transferred: 0,
              failed: 0,
            };
          }
          byBot[botId].total += 1;
          if (s === "completed") byBot[botId].completed += 1;
          else if (s === "transferred") byBot[botId].transferred += 1;
          else if (s === "failed") byBot[botId].failed += 1;
        }
      });

      setClientStatusData(
        Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      );
      setClientBotRows(
        Object.entries(byBot).map(([, v]) => ({
          name: v.name,
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
      setClientStatusData([]);
      setClientDurationData([]);
      setClientVolumeData([]);
      setClientBotRows([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, session?.user, companyFilter, timePeriod]);

  const fetchStats = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [summaryRes, callsStatsRes] = await Promise.all([
        getAnalyticsSummary(),
        getCallsStats(),
      ]);
      setAnalyticsSummaryRaw(summaryRes);
      setCallsStatsRaw(callsStatsRes);
    } catch {
      setAnalyticsSummaryRaw(null);
      setCallsStatsRaw(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

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
  const completedCount =
    statusCount(statusData, "completed") ?? stats?.completed ?? 0;
  const failedCount = statusCount(statusData, "failed") ?? stats?.failed ?? 0;
  const transferredCount =
    statusCount(statusData, "transferred") ?? stats?.transferred ?? 0;
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
    statusDistributionFromApi == null && (summaryLoading || loading);
  const durationChartLoading =
    durationFromCallsStats == null &&
    durationFromSummary == null &&
    (summaryLoading || loading);
  const volumeChartLoading =
    volumeFromApi == null && (summaryLoading || loading);
  const botChartsLoading = botRowsFromApi == null && (summaryLoading || loading);

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Analytics" />
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
