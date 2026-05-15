import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import {
  BookOpen,
  CalendarRange,
  Clock,
  DollarSign,
  Gauge,
  Hash,
  MessageSquare,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";
import { Alert, Button, Card, Col, Container, ProgressBar, Row, Table } from "react-bootstrap";

import type { RateLimitUsage, TenantKnowledgeBaseStats } from "./types";
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

function rateLimitPercent(remaining: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (remaining / limit) * 100));
}

function rateLimitProgressVariant(
  pct: number,
): "danger" | "warning" | "success" {
  if (pct < 20) return "danger";
  if (pct < 40) return "warning";
  return "success";
}

function RateLimitRow(props: Readonly<{
  label: string;
  remaining: number;
  limit: number;
}>) {
  const { label, remaining, limit } = props;
  const used = Math.max(0, limit - remaining);
  const pct = rateLimitPercent(remaining, limit);
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="fw-medium">{label}</span>
        <span className="text-muted small">
          {intFmt.format(remaining)} remaining of {intFmt.format(limit)}
        </span>
      </div>
      <ProgressBar
        now={pct}
        variant={rateLimitProgressVariant(pct)}
        className="mb-0"
        style={{ height: 8 }}
        aria-label={`${label}: ${intFmt.format(remaining)} remaining`}
      />
      <div className="text-muted small mt-1">{intFmt.format(used)} used</div>
    </div>
  );
}

function RateLimitUsageCard({ rateLimit }: Readonly<{ rateLimit: RateLimitUsage }>) {
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body>
        <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2">
          <Gauge size={18} className="text-primary" aria-hidden />
          Rate limit usage
        </h5>
        <RateLimitRow
          label="Queries per minute"
          remaining={rateLimit.queriesPerMinuteRemaining}
          limit={rateLimit.queriesPerMinuteLimit}
        />
        <RateLimitRow
          label="Queries today"
          remaining={rateLimit.queriesTodayRemaining}
          limit={rateLimit.queriesTodayLimit}
        />
      </Card.Body>
    </Card>
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
        <Row xs={2} md={4} className="g-3">
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

function DashboardTableCard(props: Readonly<{
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}>) {
  const { title, children, compact } = props;
  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className={compact ? "py-2 px-3" : undefined}>
        <h5 className={`fw-semibold ${compact ? "mb-2 fs-6" : "mb-3"}`}>
          {title}
        </h5>
        <div className="table-responsive mb-0">{children}</div>
      </Card.Body>
    </Card>
  );
}

export type ChatbotsTenantDashboardViewProps = Readonly<{
  ctx: ChatbotsTenantDashboardCtx;
}>;

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
  const {
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

      <Container fluid className="px-0 pb-4">
        {isLoading && <DashboardLoading />}

        {isError && !isLoading && (
          <Alert variant="danger" className="d-flex align-items-center justify-content-between">
            <span>{error?.message ?? "Failed to load tenant dashboard."}</span>
            <Button variant="outline-danger" size="sm" onClick={refetch}>
              Retry
            </Button>
          </Alert>
        )}

        {!isLoading && !isError && model && (
          <TenantDashboardContent
            model={model}
            dailyCostQueriesChart={dailyCostQueriesChart}
          />
        )}
      </Container>
    </React.Fragment>
  );
}

function TenantDashboardContent({
  model,
  dailyCostQueriesChart,
}: Readonly<{
  model: NonNullable<ChatbotsTenantDashboardViewProps["ctx"]["model"]>;
  dailyCostQueriesChart: ChatbotsTenantDashboardViewProps["ctx"]["dailyCostQueriesChart"];
}>) {
  const { summary, rateLimit, knowledgeBase } = model;

  return (
    <>
        <Row xs={1} sm={2} lg={5} className="g-3 mb-3">
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
          <Col xs={12} lg={4}>
            <RateLimitUsageCard rateLimit={rateLimit} />
          </Col>
          <Col xs={12} lg={8} className="mt-3 mt-lg-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 fw-semibold">
                  Daily cost &amp; queries — last 30 days
                </h5>
                <ReactApexChart
                  options={dailyCostQueriesChart.options}
                  series={dailyCostQueriesChart.series}
                  type="line"
                  height={280}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col lg={6} className="mb-3 mb-lg-0">
            <DashboardTableCard title="Top users (this month)">
              <Table hover size="sm" className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-nowrap">User</th>
                    <th className="text-end text-nowrap">Queries</th>
                    <th className="text-end text-nowrap">Tokens</th>
                    <th className="text-end text-nowrap">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {model.topUsersThisMonth.map((row) => (
                    <tr key={row.user}>
                      <td className="fw-medium">{row.user}</td>
                      <td className="text-end text-nowrap">
                        {intFmt.format(row.queries)}
                      </td>
                      <td className="text-end text-nowrap">
                        {intFmt.format(row.tokens)}
                      </td>
                      <td className="text-end text-nowrap">
                        {usd3.format(row.costUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DashboardTableCard>
          </Col>
          <Col lg={6}>
            <DashboardTableCard title="Top questions (7d)">
              <Table hover size="sm" className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Question</th>
                    <th className="text-end text-nowrap">Asks</th>
                    <th className="text-end text-nowrap">Users</th>
                  </tr>
                </thead>
                <tbody>
                  {model.topQuestions7d.map((row) => (
                    <tr key={row.question}>
                      <td className="fw-medium">{row.question}</td>
                      <td className="text-end text-nowrap">
                        {intFmt.format(row.asks)}
                      </td>
                      <td className="text-end text-nowrap">
                        {intFmt.format(row.users)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DashboardTableCard>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col xs={12}>
            <KnowledgeBaseCard kb={knowledgeBase} />
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <DashboardTableCard title="Recent conversations" compact>
              <Table hover size="sm" className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-nowrap">Thread</th>
                    <th className="text-nowrap">User</th>
                    <th className="text-nowrap">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {model.recentConversations.map((row) => (
                    <tr key={`${row.thread}-${row.user}`}>
                      <td className="fw-medium">
                        <span className="d-inline-flex align-items-center gap-1">
                          <MessageSquare
                            size={14}
                            className="text-muted flex-shrink-0"
                            aria-hidden
                          />
                          {row.thread}
                        </span>
                      </td>
                      <td className="text-nowrap">{row.user}</td>
                      <td
                        className="text-muted small text-nowrap"
                        style={{ maxWidth: "9.5rem" }}
                        title={row.lastActivity}
                      >
                        <span className="d-inline-flex align-items-center gap-1">
                          <Clock size={12} aria-hidden />
                          {row.lastActivity}
                        </span>
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
