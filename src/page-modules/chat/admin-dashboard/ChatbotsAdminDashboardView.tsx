import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
import ChartDonut from "@components/ChartDonut";
import {
  AlertTriangle,
  Building2,
  CalendarRange,
  DollarSign,
  Hash,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import React from "react";
import { Alert, Button, Card, Col, Container, Row, Table } from "react-bootstrap";

import type { ChatbotsAdminDashboardCtx } from "./useChatbotsAdminDashboard";

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

/** Resolve donut slice raw value from Apex formatter context (label may be %). */
function donutSliceRawValue(
  labeledValue: number,
  opts: unknown,
  fallbackSeries: readonly number[],
): number {
  const o = opts as {
    seriesIndex?: number;
    w?: { globals?: { series?: number[] | number[][] } };
  };
  const i =
    typeof o?.seriesIndex === "number" && Number.isFinite(o.seriesIndex)
      ? o.seriesIndex
      : 0;
  const s = o?.w?.globals?.series;
  if (Array.isArray(s)) {
    const first = s[0];
    if (Array.isArray(first) && typeof first[i] === "number") return first[i];
    const flat = s as number[];
    if (typeof flat[i] === "number") return flat[i];
  }
  if (typeof fallbackSeries[i] === "number") return fallbackSeries[i];
  return labeledValue;
}

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

export type ChatbotsAdminDashboardViewProps = Readonly<{
  ctx: ChatbotsAdminDashboardCtx;
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

export function ChatbotsAdminDashboardView({
  ctx,
}: ChatbotsAdminDashboardViewProps) {
  const { model, costQueriesChart, isLoading, isError, error, refetch } = ctx;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Chatbots · Admin" />

      <PageHeader title="Admin Dashboard" showSearch={false} />

      <Container fluid className="px-0 pb-4">
        {isLoading && <DashboardLoading />}

        {isError && !isLoading && (
          <Alert variant="danger" className="d-flex align-items-center justify-content-between">
            <span>{error?.message ?? "Failed to load admin dashboard."}</span>
            <Button variant="outline-danger" size="sm" onClick={refetch}>
              Retry
            </Button>
          </Alert>
        )}

        {!isLoading && !isError && model && (
          <AdminDashboardContent model={model} costQueriesChart={costQueriesChart} />
        )}
      </Container>
    </React.Fragment>
  );
}

function AdminDashboardContent({
  model,
  costQueriesChart,
}: Readonly<{
  model: NonNullable<ChatbotsAdminDashboardViewProps["ctx"]["model"]>;
  costQueriesChart: ChatbotsAdminDashboardViewProps["ctx"]["costQueriesChart"];
}>) {
  const { summary } = model;

  const modelDonutSeries = model.modelCostThisMonth.map((s) => s.value);
  const modelDonutLabels = model.modelCostThisMonth.map((s) => s.label);

  const callTypeSeries = model.callTypesThisMonth.map((s) => s.value);
  const callTypeLabels = model.callTypesThisMonth.map((s) => s.label);

  return (
    <>
        <Row xs={1} md={3} className="g-3 mb-4">
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
            title="Cost this month"
            value={usd3.format(summary.costMonthUsd)}
            icon={<CalendarRange size={20} />}
            accent="#7c3aed"
          />
          <StatCard
            title="Tenants"
            value={float3.format(summary.tenants)}
            icon={<Building2 size={20} />}
            accent="#ea580c"
          />
          <StatCard
            title="Users"
            value={float3.format(summary.users)}
            icon={<Users size={20} />}
            accent="#0891b2"
          />
          <StatCard
            title="Failures today"
            value={float3.format(summary.failuresToday)}
            icon={<AlertTriangle size={20} />}
            accent="#dc2626"
          />
        </Row>

        <Row className="mb-3">
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 fw-semibold">
                  Cost &amp; queries — last 30 days (all tenants)
                </h5>
                <ReactApexChart
                  options={costQueriesChart.options}
                  series={costQueriesChart.series}
                  type="line"
                  height={340}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col lg={6} className="mb-3 mb-lg-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 fw-semibold">
                  Top companies (this month)
                </h5>
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Company</th>
                        <th className="text-end">Queries</th>
                        <th className="text-end">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.topCompaniesThisMonth.map((row) => (
                        <tr key={row.company}>
                          <td className="fw-medium">{row.company}</td>
                          <td className="text-end">
                            {intFmt.format(row.queries)}
                          </td>
                          <td className="text-end">
                            {usd3.format(row.costUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 fw-semibold">Top users (this month)</h5>
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>User</th>
                        <th>Company</th>
                        <th className="text-end">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.topUsersThisMonth.map((row) => (
                        <tr key={`${row.user}-${row.company}`}>
                          <td className="fw-medium">{row.user}</td>
                          <td className="text-muted">{row.company}</td>
                          <td className="text-end">
                            {usd3.format(row.costUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col lg={6} className="mb-3 mb-lg-0">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-2 fw-semibold">
                  Model cost usage (this month)
                </h5>
                <p className="text-muted small mb-3">
                  Share of spend by model (all tenants).
                </p>
                <ChartDonut
                  series={modelDonutSeries}
                  labels={modelDonutLabels}
                  height={320}
                  dataType="cost"
                  legendPosition="bottom"
                  showDataLabels
                />
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-2 fw-semibold">
                  Call types usage (this month)
                </h5>
                <p className="text-muted small mb-3">
                  Query volume by channel (all tenants).
                </p>
                <ChartDonut
                  series={callTypeSeries}
                  labels={callTypeLabels}
                  height={320}
                  dataType="custom"
                  customTooltipFormatter={(value) =>
                    `${Number(value).toFixed(3)} queries`
                  }
                  dataLabelsFormatter={(val, opts) =>
                    `${donutSliceRawValue(val, opts, callTypeSeries).toFixed(3)}`
                  }
                  legendPosition="bottom"
                  showDataLabels
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mb-2">
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-2 px-3">
                <h5 className="mb-2 fw-semibold fs-6">All companies</h5>
                <div className="table-responsive mb-0">
                  <Table hover size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="text-nowrap">Company</th>
                        <th className="text-end text-nowrap">Month queries</th>
                        <th className="text-end text-nowrap">Month cost</th>
                        <th className="text-nowrap">Last activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.allCompanies.map((row) => (
                        <tr key={row.company}>
                          <td className="fw-medium text-truncate" title={row.company}>
                            {row.company}
                          </td>
                          <td className="text-end text-nowrap">
                            {intFmt.format(row.monthQueries)}
                          </td>
                          <td className="text-end text-nowrap">
                            {usd3.format(row.monthCostUsd)}
                          </td>
                          <td
                            className="text-muted small text-truncate"
                            style={{ maxWidth: "9.5rem" }}
                            title={row.lastActivity}
                          >
                            {row.lastActivity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 fw-semibold">
                  Top Q&amp;As across the companies
                </h5>
                <div className="table-responsive">
                  <Table hover size="sm" className="align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Question</th>
                        <th className="text-end">Asked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.topQasAcrossCompanies.map((row) => (
                        <tr key={row.question}>
                          <td className="fw-medium">{row.question}</td>
                          <td className="text-end">
                            {intFmt.format(row.asked)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
    </>
  );
}
