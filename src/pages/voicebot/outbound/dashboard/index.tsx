import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Col, Form, Row, Spinner } from "react-bootstrap";
import { useSession } from "next-auth/react";
import { getAnalyticsDashboard } from "@utils/voicebot/outbound";
import { formatDurationSeconds, formatFixed } from "@utils/voicebot/outbound/formatters";
import { getCompanies } from "@utils/voicebot/inbound";
import { normalizeCompaniesResponse } from "@utils/companyOptions";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

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
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const rawIsAdmin = (session?.user as { is_admin?: unknown })?.is_admin;
  const isAdmin =
    (typeof rawIsAdmin === "string" || typeof rawIsAdmin === "number") &&
    String(rawIsAdmin) === "1";
  const sessionCompanyIdentifier = (session?.user as { company_identifier?: string })?.company_identifier ?? "";
  const effectiveCompanyId = isAdmin ? selectedCompanyId : sessionCompanyIdentifier;

  const fetchDashboard = useCallback(async () => {
    if (!effectiveCompanyId) {
      setDashboard(null);
      setLoading(false);
      return;
    }
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
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchCompanies() {
      try {
        const res = await getCompanies({ show_inactive: false });
        const opts = normalizeCompaniesResponse(res, { prefer: "company_id" }).map((c) => ({
          id: c.company_id ?? c.identifier ?? c.id,
          name: c.name,
        })).filter((c) => Boolean(c.id));
        if (!cancelled) setCompanies(opts);
      } catch {
        if (!cancelled) setCompanies([]);
      }
    }
    fetchCompanies();
    return () => { cancelled = true; };
  }, [isAdmin]);

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

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Outbound Dashboard" />
      <PageHeader title="Outbound Dashboard" showSearch={false}
        buttons={
          <>
           {isAdmin && (
        <Row className="mb-3 justify-content-end">
          <Col xs="auto">
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
          </Col>
        </Row>
      )}
          </>
        }
      
      />

     

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status" />
        </div>
      )}
      {!loading && !effectiveCompanyId && (
        <p className="text-muted">Select a company to view dashboard.</p>
      )}
      {!loading && effectiveCompanyId && (
        <Row className="g-3 mb-4">
          {METRIC_CARDS.map(({ key, label }) => (
            <Col key={key} xs={6} md={6} lg={3}>
              <div className="p-3 rounded border bg-light h-100">
                <div className="small text-muted">{label}</div>
                <div className="h5 mb-0 fw-bold">{cardValues[key] ?? "—"}</div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </React.Fragment>
  );
};

OutboundDashboardPage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OutboundDashboardPage;
