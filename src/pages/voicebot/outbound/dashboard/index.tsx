import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Spinner } from "react-bootstrap";
import { getAnalyticsDashboard } from "@utils/voicebot/outbound";
import { OUTBOUND_VOICEBOT_CREATE_COMPANY_ID } from "@utils/voicebot/outboundVoicebotForm";
import { formatDurationSeconds, formatFixed } from "@utils/voicebot/outbound/formatters";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";

interface DashboardData {
  total_campaigns?: number;
  active_campaigns?: number;
  total_calls?: number;
  success_rate?: number;
  avg_call_duration?: number;
  total_cost?: number;
  today?: { calls?: number; cost?: number; success_rate?: number };
}

interface DashboardResponse {
  status?: boolean;
  data?: DashboardData;
}

const METRIC_CARDS = [
  { key: "total_campaigns", label: "Total Companies" },
  { key: "published_bots", label: "Published Bots" },
  { key: "success_rate", label: "Success Rate" },
  { key: "avg_duration", label: "Avg Duration" },
  { key: "active_campaigns", label: "Active Bots" },
  { key: "total_calls", label: "Total Calls" },
  { key: "transfer_rate", label: "Transfer Rate" },
  { key: "total_cost", label: "Total Cost" },
] as const;

const OutboundDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { company_id: OUTBOUND_VOICEBOT_CREATE_COMPANY_ID };
      const res = (await getAnalyticsDashboard(params)) as DashboardResponse;
      const data = res?.data;
      setDashboard(data && typeof data === "object" ? data : null);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const d = dashboard ?? {};
  const totalCampaigns = d.total_campaigns ?? 0;
  const publishedBots = totalCampaigns; // API has no separate field; use total campaigns
  const successRate = formatFixed(d.success_rate, 1, "0.0");
  const avgDuration = formatDurationSeconds(d.avg_call_duration);
  const activeBots = d.active_campaigns ?? 0;
  const totalCalls = d.total_calls ?? 0;
  const transferRate = "0.0"; // Not provided by API
  const totalCost = `$${formatFixed(d.total_cost, 4, "0")}`;

  const cardValues: Record<string, string | number> = {
    total_campaigns: totalCampaigns,
    published_bots: publishedBots,
    success_rate: `${successRate}%`,
    avg_duration: avgDuration,
    active_campaigns: activeBots,
    total_calls: totalCalls,
    transfer_rate: `${transferRate}%`,
    total_cost: totalCost,
  };

  const statsCardsData: StatsCardData[] = METRIC_CARDS.map(({ key, label }) => ({
    title: label,
    value: cardValues[key] ?? "—",
  }));

  return (
    <React.Fragment>
      <style jsx global>{`
        .outbound-dashboard-stats > div {
          grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
        }

        @media (max-width: 1399.98px) {
          .outbound-dashboard-stats > div {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 767.98px) {
          .outbound-dashboard-stats > div {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Outbound Dashboard" />
      <PageHeader title="Outbound Dashboard" showSearch={false} />

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      )}
      {!loading && (
        <div className="outbound-dashboard-stats">
          <StatsCards data={statsCardsData} valueFontSize="28px" />
        </div>
      )}
    </React.Fragment>
  );
};

OutboundDashboardPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OutboundDashboardPage;
