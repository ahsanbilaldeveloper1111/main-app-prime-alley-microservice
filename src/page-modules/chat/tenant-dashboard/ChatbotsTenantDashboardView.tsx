import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import {
  BookOpen,
  CalendarRange,
  Clock,
  DollarSign,
  Hash,
  MessageSquare,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Row, Table } from "react-bootstrap";

import "../shared/chatbotsDashboard.scss";
import {
  buildResponsiveLineChartOptions,
  resolveLineChartHeight,
} from "../shared/chatbotsDashboardChart";
import {
  chatbotsDashboardPrimaryCellClass,
  chatbotsDashboardTableClass,
  chatbotsDashboardTdClass,
  chatbotsDashboardThClass,
} from "../shared/chatbotsDashboardTable";
import { DashboardTableCard } from "../shared/DashboardTableCard";
import { useMediaQuery } from "../shared/useMediaQuery";

import type { TenantKnowledgeBaseStats } from "./types";
import { TenantDashboardBudgetOverview } from "./TenantDashboardBudgetOverview";
import { TenantDashboardUsersBudgetsTab } from "./TenantDashboardUsersBudgetsTab";
import {
  TENANT_DASHBOARD_TABS,
  type TenantDashboardTab,
} from "./tenantDashboardTabs";
import type { ChatbotsTenantDashboardCtx } from "./useChatbotsTenantDashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const usd3 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const float3 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const intFmt = new Intl.NumberFormat("en-US");

function StatCard(props: Readonly<{
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}>) {
  const { title, value, icon, accent } = props;
  return (
    <Col>
      <Card className="h-100 border-0 shadow-sm">
        <Card.Body className="d-flex flex-column gap-2">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 40,
              height: 40,
              backgroundColor: `${accent}18`,
              color: accent,
            }}
            aria-hidden
          >
            {icon}
          </div>
          <div className="text-muted small text-uppercase fw-semibold">
            {title}
          </div>
          <div className="fs-4 fw-semibold text-dark lh-sm">{value}</div>
        </Card.Body>
      </Card>
    </Col>
  );
}

function KnowledgeBaseCard({ kb }: Readonly<{ kb: TenantKnowledgeBaseStats }>) {
  const items: {
    label: string;
    value: string;
    valueClass?: string;
  }[] = [
    { label: "Tenant FAQs", value: intFmt.format(kb.tenantFaqs) },
    { label: "Global FAQs", value: intFmt.format(kb.globalFaqs) },
    {
      label: "Trained",
      value: kb.trained ? "Yes" : "No",
      valueClass: kb.trained ? "text-success" : "text-warning",
    },
    {
      label: "Last training",
      value: kb.lastTraining ?? "—",
      valueClass: "text-muted",
    },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2">
          <BookOpen size={18} className="text-primary" aria-hidden />
          Knowledge base
        </h5>
        <Row xs={1} sm={2} md={4} className="g-3">
          {items.map((item) => (
            <Col key={item.label}>
              <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-50">
                <div className="text-muted small text-uppercase fw-semibold">
                  {item.label}
                </div>
                <div
                  className={`fs-5 fw-semibold mt-1 ${item.valueClass ?? ""}`}
                >
                  {item.value}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}

export type ChatbotsTenantDashboardViewProps = Readonly<{
  ctx: ChatbotsTenantDashboardCtx;
}>;

function TenantDashboardTabRow(props: Readonly<{
  activeTab: TenantDashboardTab;
  onSelectTab: (tab: TenantDashboardTab) => void;
}>) {
  const { activeTab, onSelectTab } = props;
  return (
    <div className="chatbots-dashboard__tab-row" role="tablist">
      {TENANT_DASHBOARD_TABS.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const isLast = index === TENANT_DASHBOARD_TABS.length - 1;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTab(tab.id)}
            className={[
              "chatbots-dashboard__tab-btn",
              isActive ? "chatbots-dashboard__tab-btn--active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={isLast ? { borderRight: "1px solid #e0e0e0" } : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      className="d-flex justify-content-center align-items-center py-5"
      style={{ minHeight: 280 }}
    >
      <output className="spinner-border text-primary" aria-label="Loading dashboard">
        <span className="visually-hidden">Loading…</span>
      </output>
    </div>
  );
}

export function ChatbotsTenantDashboardView({
  ctx,
}: ChatbotsTenantDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<TenantDashboardTab>("overview");

  const {
    tenantId,
    model,
    companyName,
    isLoading,
    isError,
    error,
    refetch,
    dailyCostQueriesChart,
  } = ctx;

  const subTitle = companyName
    ? `Chatbots · ${companyName}`
    : "Chatbots · Tenant";

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />

      <PageHeader title="Tenant Dashboard" showSearch={false} />

      <Container
        fluid
        className="px-2 px-sm-3 px-lg-4 pb-4 chatbots-dashboard"
      >
        <TenantDashboardTabRow activeTab={activeTab} onSelectTab={setActiveTab} />

        {activeTab === "users" ? (
          <TenantDashboardUsersBudgetsTab
            tenantId={tenantId}
            active={activeTab === "users"}
          />
        ) : null}

        {activeTab === "overview" && isLoading ? <DashboardLoading /> : null}

        {activeTab === "overview" && isError && !isLoading ? (
          <Alert
            variant="danger"
            className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 gap-sm-3"
          >
            <span className="flex-grow-1">
              {error?.message ?? "Failed to load tenant dashboard."}
            </span>
            <Button
              variant="outline-danger"
              size="sm"
              className="align-self-stretch align-self-sm-center flex-shrink-0"
              onClick={refetch}
            >
              Retry
            </Button>
          </Alert>
        ) : null}

        {activeTab === "overview" && !isLoading && !isError && model ? (
          <TenantDashboardContent
            tenantId={tenantId}
            model={model}
            dailyCostQueriesChart={dailyCostQueriesChart}
          />
        ) : null}
      </Container>
    </React.Fragment>
  );
}

function TenantDashboardContent({
  tenantId,
  model,
  dailyCostQueriesChart,
}: Readonly<{
  tenantId: string;
  model: NonNullable<ChatbotsTenantDashboardViewProps["ctx"]["model"]>;
  dailyCostQueriesChart: ChatbotsTenantDashboardViewProps["ctx"]["dailyCostQueriesChart"];
}>) {
  const { summary, knowledgeBase } = model;
  const isMobile = useMediaQuery("(max-width: 767.98px)");
  const isTablet = useMediaQuery("(max-width: 991.98px)");

  const chartHeight = resolveLineChartHeight(isMobile, isTablet);

  const chartOptions = useMemo(
    () =>
      buildResponsiveLineChartOptions(
        dailyCostQueriesChart.options,
        isMobile,
      ),
    [dailyCostQueriesChart.options, isMobile],
  );

  return (
    <>
        <TenantDashboardBudgetOverview tenantId={tenantId} active />

        <Row xs={1} sm={2} md={3} xl={5} className="g-3 mb-3">
          <StatCard
            title="Queries today"
            value={float3.format(summary.queriesToday)}
            icon={<Hash size={20} />}
            accent="#2563eb"
          />
          <StatCard
            title="Cost today"
            value={usd3.format(summary.costTodayUsd)}
            icon={<DollarSign size={20} />}
            accent="#059669"
          />
          <StatCard
            title="Queries this month"
            value={float3.format(summary.queriesThisMonth)}
            icon={<CalendarRange size={20} />}
            accent="#7c3aed"
          />
          <StatCard
            title="Cost this month"
            value={usd3.format(summary.costThisMonthUsd)}
            icon={<DollarSign size={20} />}
            accent="#ea580c"
          />
          <StatCard
            title="Active users"
            value={float3.format(summary.activeUsers)}
            icon={<Users size={20} />}
            accent="#0891b2"
          />
        </Row>

        <Row className="mb-3">
          <Col xs={12} className="min-w-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="chatbots-dashboard__chart">
                <h5 className="mb-3 fw-semibold">
                  Daily cost &amp; queries — last 30 days
                </h5>
                <ReactApexChart
                  options={chartOptions}
                  series={dailyCostQueriesChart.series}
                  type="line"
                  height={chartHeight}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-3 g-3">
          <Col xs={12} lg={6}>
            <DashboardTableCard title="Top users (this month)">
              <Table hover size="sm" className={chatbotsDashboardTableClass}>
                <colgroup>
                  <col style={{ width: "46%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead className="table-light">
                  <tr>
                    <th className={chatbotsDashboardThClass}>User</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>Queries</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>Tokens</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {model.topUsersThisMonth.map((row) => (
                    <tr key={row.user}>
                      <td
                        data-label="User"
                        className={`${chatbotsDashboardTdClass} ${chatbotsDashboardPrimaryCellClass} fw-medium`}
                      >
                        {row.user}
                      </td>
                      <td
                        data-label="Queries"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {intFmt.format(row.queries)}
                      </td>
                      <td
                        data-label="Tokens"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {intFmt.format(row.tokens)}
                      </td>
                      <td
                        data-label="Cost"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {usd3.format(row.costUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DashboardTableCard>
          </Col>
          <Col xs={12} lg={6}>
            <DashboardTableCard title="Top questions (7d)">
              <Table hover size="sm" className={chatbotsDashboardTableClass}>
                <colgroup>
                  <col style={{ width: "70%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead className="table-light">
                  <tr>
                    <th className={chatbotsDashboardThClass}>Question</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>Asks</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>Users</th>
                  </tr>
                </thead>
                <tbody>
                  {model.topQuestions7d.map((row) => (
                    <tr key={row.question}>
                      <td
                        data-label="Question"
                        className={`${chatbotsDashboardTdClass} ${chatbotsDashboardPrimaryCellClass} fw-medium`}
                      >
                        {row.question}
                      </td>
                      <td
                        data-label="Asks"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {intFmt.format(row.asks)}
                      </td>
                      <td
                        data-label="Users"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {intFmt.format(row.users)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DashboardTableCard>
          </Col>
        </Row>

        <Row className="mb-3 g-3">
          <Col xs={12}>
            <KnowledgeBaseCard kb={knowledgeBase} />
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <DashboardTableCard title="Recent conversations" compact>
              <Table hover size="sm" className={chatbotsDashboardTableClass}>
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead className="table-light">
                  <tr>
                    <th className={chatbotsDashboardThClass}>Thread</th>
                    <th className={chatbotsDashboardThClass}>User</th>
                    <th className={chatbotsDashboardThClass}>Last activity</th>
                    <th className={chatbotsDashboardThClass}>Model</th>
                    <th className={`${chatbotsDashboardThClass} text-md-center`}>
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {model.recentConversations.map((row) => (
                    <tr key={row.threadId}>
                      <td
                        data-label="Thread"
                        className={`${chatbotsDashboardTdClass} ${chatbotsDashboardPrimaryCellClass} fw-medium`}
                      >
                        <span className="d-inline-flex align-items-center gap-1">
                          <MessageSquare
                            size={14}
                            className="text-muted flex-shrink-0"
                            aria-hidden
                          />
                          {row.thread}
                        </span>
                      </td>
                      <td
                        data-label="User"
                        className={`${chatbotsDashboardTdClass} text-nowrap`}
                      >
                        {row.user}
                      </td>
                      <td
                        data-label="Last activity"
                        className={`${chatbotsDashboardTdClass} text-muted small text-nowrap`}
                        title={row.lastActivity}
                      >
                        <span className="d-inline-flex align-items-center gap-1">
                          <Clock size={12} aria-hidden />
                          {row.lastActivity}
                        </span>
                      </td>
                      <td
                        data-label="Model"
                        className={`${chatbotsDashboardTdClass} text-muted small text-break`}
                        title={row.modelUsed}
                      >
                        {row.modelUsed}
                      </td>
                      <td
                        data-label="Cost"
                        className={`${chatbotsDashboardTdClass} text-md-center text-nowrap`}
                      >
                        {usd3.format(row.costUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DashboardTableCard>
          </Col>
        </Row>
    </>
  );
}
