import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { getAnalyticsDashboard } from "@utils/voicebot/outbound";
import { OUTBOUND_VOICEBOT_CREATE_COMPANY_ID } from "@utils/voicebot/outboundVoicebotForm";
import { formatDurationSeconds, formatFixed } from "@utils/voicebot/outbound/formatters";
import { GetCompanies } from "@utils/users";
import { normalizeCompaniesResponse, type CompanyOption } from "@utils/companyOptions";

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
  const { data: session } = useSession();
  const isAdmin = String((session?.user as { is_admin?: string | number } | undefined)?.is_admin ?? "") === "1";
  const sessionUser = session?.user as
    | { company_id?: string | null; company_identifier?: string | null }
    | undefined;
  const userCompanyId = String(sessionUser?.company_id ?? "").trim();
  const userCompanyIdentifier = String(sessionUser?.company_identifier ?? "").trim();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const effectiveCompanyId = useMemo(() => {
    if (isAdmin) {
      return selectedCompanyId.trim() || OUTBOUND_VOICEBOT_CREATE_COMPANY_ID;
    }
    return userCompanyId || userCompanyIdentifier || OUTBOUND_VOICEBOT_CREATE_COMPANY_ID;
  }, [isAdmin, selectedCompanyId, userCompanyId, userCompanyIdentifier]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await GetCompanies();
        if (res === false) {
          if (!cancelled) setCompanies([]);
          return;
        }
        if (!cancelled) setCompanies(normalizeCompaniesResponse(res));
      } catch {
        if (!cancelled) setCompanies([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { company_id: effectiveCompanyId };
      const res = (await getAnalyticsDashboard(params)) as DashboardResponse;
      const data = res?.data;
      setDashboard(data && typeof data === "object" ? data : null);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [effectiveCompanyId]);

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

      {isAdmin && (
        <Row className="mb-3 align-items-end">
          <Col xs={12} md={4} lg={3}>
            <Form.Group className="mb-0">
              <Form.Label className="small text-muted mb-1">Company</Form.Label>
              <Form.Select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                aria-label="Filter dashboard by company"
              >
                <option value="">Default (all)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      )}

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
