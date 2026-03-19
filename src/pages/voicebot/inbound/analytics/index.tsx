import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { getCalls, getCallsStats, getCompanies } from "@utils/voicebot/inbound";
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

interface StatsState {
  total_calls?: number;
  completed?: number;
  avg_duration_seconds?: number;
  total_cost?: number;
}

const AnalyticsPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [timePeriod, setTimePeriod] = useState("7");
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [durationData, setDurationData] = useState<{ name: string; count: number }[]>([]);
  const [volumeData, setVolumeData] = useState<{ date: string; dateKey: string; calls: number }[]>([]);
  const [stats, setStats] = useState<StatsState | null>(null);
  const [botPerformanceRows, setBotPerformanceRows] = useState<BotPerformanceRow[]>([]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getCompanies();
      setCompanies(normalizeCompaniesResponse(res, { prefer: "company_id" }));
    } catch {
      setCompanies([]);
    }
  }, []);

  useEffect(() => {
    const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
    if (!isAdmin && companyIdentifier) setCompanyFilter(companyIdentifier);
  }, [isAdmin, session?.user]);

  const fetchCallsForDistribution = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 500 };
      const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      else if (companyFilter) params.company_id = companyFilter;
      const { start_date, end_date } = getDateRange(timePeriod);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;

      const res = await getCalls(params);
      const list = Array.isArray(res)
        ? res
        : (res as { results?: { status?: string; call_duration_seconds?: number; session_start_time?: string }[] })?.results ??
          (res as { data?: { status?: string; call_duration_seconds?: number; session_start_time?: string }[] })?.data ??
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
      const byBot: Record<string, { name: string; total: number; completed: number; transferred: number; failed: number }> = {};
      DURATION_BUCKETS.forEach((b) => { byDuration[b.key] = 0; });

      rawList.forEach((c: CallItem) => {
        const s = String(c.status ?? "unknown");
        byStatus[s] = (byStatus[s] ?? 0) + 1;
        const sec = Number(c.call_duration_seconds);
        const validSec = Number.isFinite(sec) && sec >= 0 ? sec : 0;
        const bucket = DURATION_BUCKETS.find((b) => validSec >= b.min && validSec <= b.max);
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
          if (!byBot[botId]) byBot[botId] = { name: String(c.bot_name ?? "—"), total: 0, completed: 0, transferred: 0, failed: 0 };
          byBot[botId].total += 1;
          if (s === "completed") byBot[botId].completed += 1;
          else if (s === "transferred") byBot[botId].transferred += 1;
          else if (s === "failed") byBot[botId].failed += 1;
        }
      });

      setStatusData(Object.entries(byStatus).map(([name, value]) => ({ name, value })));
      setBotPerformanceRows(
        Object.entries(byBot).map(([, v]) => ({
          name: v.name,
          total: v.total,
          completed: v.completed,
          transferred: v.transferred,
          failed: v.failed,
          successRate: v.total > 0 ? ((v.completed / v.total) * 100).toFixed(1) : "0.0",
        }))
      );
      setDurationData(DURATION_BUCKETS.map((b) => ({ name: b.label, count: byDuration[b.key] ?? 0 })));

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
      setVolumeData(volumeSorted);
    } catch {
      setStatusData([]);
      setDurationData([]);
      setVolumeData([]);
      setBotPerformanceRows([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, session?.user, companyFilter, timePeriod]);

  const fetchStats = useCallback(async () => {
    try {
      const params: Record<string, string | undefined> = {};
      const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      else if (companyFilter) params.company_id = companyFilter;
      const { start_date, end_date } = getDateRange(timePeriod);
      if (start_date) params.start_date = start_date;
      if (end_date) params.end_date = end_date;
      const res = await getCallsStats(params);
      const data = (res as { data?: StatsState })?.data ?? (res as StatsState);
      setStats(typeof data === "object" && data ? data : null);
    } catch {
      setStats(null);
    }
  }, [isAdmin, session?.user, companyFilter, timePeriod]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);
  useEffect(() => { fetchCallsForDistribution(); }, [fetchCallsForDistribution]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const totalCalls = statusData.reduce((sum, d) => sum + d.value, 0);
  const completedCount = statusData.find((d) => d.name === "completed")?.value ?? stats?.completed ?? 0;
  const failedCount = statusData.find((d) => d.name === "failed")?.value ?? 0;
  const transferredCount = statusData.find((d) => d.name === "transferred")?.value ?? 0;
  const totalFromStats = stats?.total_calls ?? totalCalls;
  const successRate = totalFromStats > 0 ? ((completedCount / totalFromStats) * 100).toFixed(1) : "0.0";
  const transferRate = totalFromStats > 0 ? ((transferredCount / totalFromStats) * 100).toFixed(1) : "0.0";
  const totalCost = Number(stats?.total_cost ?? 0);
  const costPerCall = totalFromStats > 0 && totalCost >= 0 ? (totalCost / totalFromStats).toFixed(4) : "0.0000";
  const formatAvgDuration = (sec?: number) => {
    if (sec == null) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
        <CallStatusDistributionChart loading={loading} data={statusData} totalCalls={totalCalls} />
        <CallDurationDistributionChart loading={loading} data={durationData} />
      </Row>
      <Row>
        <CallVolumeOverTimeChart loading={loading} data={volumeData} />
      </Row>

      <div className="mt-4">
        <BotPerformanceTable loading={loading} rows={botPerformanceRows} />
      </div>

      <Row>
        <BotPerformanceComparisonChart loading={loading} rows={botPerformanceRows} />
      </Row>


    </React.Fragment>
  );
};

AnalyticsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default AnalyticsPage;
