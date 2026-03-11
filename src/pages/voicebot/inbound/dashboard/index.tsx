import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { getCompanies, getBots, getCalls, getCallsStats } from "@utils/voicebot/inbound";
import { useSession } from "next-auth/react";
import {
  CompanyOverviewCards,
  RecentCallsTable,
  CompanyOverviewTable,
  formatDuration,
  type CompanyRow,
  type BotRow,
  type CallRow,
  type CompanyTableRow,
} from "./partials";
import "@assets/scss/common.scss";

interface StatsState {
  total_calls?: number;
  completed?: number;
  avg_duration_seconds?: number;
  total_cost?: number;
}

const InboundDashboardPage = () => {
  const { data: session } = useSession();
  const isAdmin = String(session?.user?.is_admin ?? "") === "1";
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [bots, setBots] = useState<BotRow[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRow[]>([]);
  const [stats, setStats] = useState<StatsState | null>(null);
  const [companyRows, setCompanyRows] = useState<CompanyTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const parseList = <T,>(res: unknown): T[] => {
    const list = Array.isArray(res)
      ? res
      : (res as { results?: T[] })?.results ?? (res as { data?: T[] })?.data ?? [];
    return Array.isArray(list) ? list : [];
  };

  const companyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier;

  const fetchCompanies = useCallback(async () => {
    try {
      const params: { show_inactive?: boolean; company_id?: string } = { show_inactive: false };
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      const res = await getCompanies(params);
      setCompanies(parseList<CompanyRow>(res));
    } catch {
      setCompanies([]);
    }
  }, [isAdmin, companyIdentifier]);

  const fetchBots = useCallback(async () => {
    try {
      const params = !isAdmin && companyIdentifier ? { company_id: companyIdentifier, limit: 500 } : { limit: 500 };
      const res = await getBots(params);
      setBots(parseList<BotRow>(res));
    } catch {
      setBots([]);
    }
  }, [isAdmin, companyIdentifier]);

  const fetchRecentCalls = useCallback(async () => {
    try {
      const params: { limit: number; company_id?: string } = { limit: 5 };
      if (!isAdmin && companyIdentifier) params.company_id = companyIdentifier;
      const res = await getCalls(params);
      setRecentCalls(parseList<CallRow>(res));
    } catch {
      setRecentCalls([]);
    }
  }, [isAdmin, companyIdentifier]);

  const fetchStats = useCallback(async () => {
    try {
      const params = !isAdmin && companyIdentifier ? { company_id: companyIdentifier } : undefined;
      const res = await getCallsStats(params);
      const data = (res as { data?: StatsState })?.data ?? (res as StatsState);
      setStats(typeof data === "object" && data ? data : null);
    } catch {
      setStats(null);
    }
  }, [isAdmin, companyIdentifier]);

  const fetchCompanyStats = useCallback(
    async (companyList: CompanyRow[]) => {
      if (!companyList.length) {
        setCompanyRows([]);
        return;
      }
      const botsByCompany: Record<string, number> = {};
      bots.forEach((b) => {
        const cid = String(b.company_id ?? b.company ?? "");
        if (cid) botsByCompany[cid] = (botsByCompany[cid] ?? 0) + 1;
      });
      const rows: CompanyTableRow[] = await Promise.all(
        companyList.map(async (c) => {
          const cid = String(c.company_id ?? c.id ?? "");
          try {
            const res = await getCallsStats(cid ? { company_id: cid } : undefined);
            const data = (res as { data?: { total_calls?: number; total_cost?: number } })?.data ?? (res as { total_calls?: number; total_cost?: number });
            const totalCalls = typeof data === "object" && data ? (data.total_calls ?? 0) : 0;
            const totalCost = data?.total_cost == null ? 0 : Number(data.total_cost);
            return {
              company: String(c.name ?? "—"),
              tier: String(c.subscription_tier ?? "Free"),
              bots: botsByCompany[cid] ?? 0,
              calls: totalCalls,
              cost: totalCost.toFixed(4),
            };
          } catch {
            return {
              company: String(c.name ?? "—"),
              tier: String(c.subscription_tier ?? "Free"),
              bots: botsByCompany[cid] ?? 0,
              calls: 0,
              cost: "0.0000",
            };
          }
        })
      );
      setCompanyRows(rows);
    },
    [bots]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchCompanies(), fetchBots(), fetchRecentCalls(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchCompanies, fetchBots, fetchRecentCalls, fetchStats]);

  useEffect(() => {
    if (!loading && companies.length > 0) fetchCompanyStats(companies);
  }, [loading, companies, fetchCompanyStats]);

  const totalCompanies = companies.length;
  const publishedBots = bots.filter((b) => b.status === "published").length;
  const activeBots = bots.filter((b) => b.is_active === true).length;
  const totalCalls = stats?.total_calls ?? 0;
  const completedCalls = stats?.completed ?? 0;
  const successRate = totalCalls > 0 ? ((completedCalls / totalCalls) * 100).toFixed(1) : "0.0";
  const totalCost = stats?.total_cost == null ? 0 : Number(stats.total_cost);
  const avgDuration = formatDuration(stats?.avg_duration_seconds);
  const transferRate = "0.0";

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Voicebot Inbound - Dashboard" />
      <h2 className="mb-4">Dashboard</h2>

      <CompanyOverviewCards
        isAdmin={isAdmin}
        loading={loading}
        totalCompanies={totalCompanies}
        publishedBots={publishedBots}
        successRate={successRate}
        avgDuration={avgDuration}
        activeBots={activeBots}
        totalCalls={totalCalls}
        transferRate={transferRate}
        totalCostFormatted={`$${totalCost.toFixed(4)}`}
      />

      <RecentCallsTable loading={loading} calls={recentCalls} />

      <CompanyOverviewTable loading={loading} rows={companyRows} />
    </React.Fragment>
  );
};

InboundDashboardPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default InboundDashboardPage;
