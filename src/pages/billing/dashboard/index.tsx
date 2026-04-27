import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Row, Col, Badge, Form } from "react-bootstrap";
import { AlertCircle, Clock, FileText, Package, Wallet } from "lucide-react";
import StatsCards, { StatsCardData } from "@components/GenericStatsCards";
import router from "next/router";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatNumber } from "@utils/Helper";

const CURRENCY_SYMBOL = "";
const formatWithOneDecimal = (
  value: number | string | undefined | null,
): string =>
  (Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const formatInteger = (value: number | string | undefined | null): string =>
  (Number(value) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

import "@assets/scss/billing.scss";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import {
  GetDashboardCounters,
  GetProfitLossData,
  GetTopProducts,
  GetRecentActivity,
  GetAnalyticsByMonth,
  GetCompanyDetails,
} from "@utils/accounting";
import { getMinifiedCompanies } from "@utils/crm";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";

type SpendingRow = {
  month: string;
  month_name?: string;
  spent: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
};

type SpendingChartTooltipProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SpendingRow }>;
  currency: string;
}>;

function SpendingChartTooltip({
  active,
  payload,
  currency,
}: SpendingChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }
  const data = payload[0]?.payload;
  if (!data) {
    return null;
  }
  return (
    <div className="bg-white border rounded shadow-sm p-3">
      <p className="mb-2 fw-semibold">{data.month_name}</p>
      <p className="mb-1 small">
        <span className="text-muted">Open Invoice Amount: </span>
        <span className="fw-semibold text-primary">
          {currency} {formatNumber(data.total_amount)}
        </span>
      </p>
      <p className="mb-1 small">
        <span className="text-muted">Paid Amount: </span>
        <span className="fw-semibold text-success">
          {currency} {formatNumber(data.paid_amount)}
        </span>
      </p>
      <p className="mb-0 small">
        <span className="text-muted">Open Unpaid Amount: </span>
        <span className="fw-semibold text-warning">
          {currency} {formatNumber(data.outstanding_amount)}
        </span>
      </p>
    </div>
  );
}

type DashboardSpendingChartProps = Readonly<{
  spendingData: SpendingRow[];
  currency: string;
}>;

type RechartsTooltipContentProps = Readonly<{
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SpendingRow }>;
}>;

function SpendingTooltipForCurrency({
  currency,
  active,
  payload,
}: RechartsTooltipContentProps & { currency: string }) {
  return (
    <SpendingChartTooltip
      active={active}
      payload={payload}
      currency={currency}
    />
  );
}

function DashboardSpendingChart({
  spendingData,
  currency,
}: DashboardSpendingChartProps) {
  const barChartData = useMemo(
    () =>
      spendingData.map((item) => ({
        month: item.month,
        month_name: item.month_name,
        total_amount: item.total_amount,
        paid_amount: item.paid_amount,
        outstanding_amount: item.outstanding_amount,
      })),
    [spendingData],
  );

  const renderSpendingTooltip = useCallback(
    (props: RechartsTooltipContentProps) => (
      <SpendingTooltipForCurrency currency={currency} {...props} />
    ),
    [currency],
  );

  return (
    <ResponsiveContainer width="100%" height={354}>
      <BarChart data={barChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip content={renderSpendingTooltip} />
        <Legend />
        <Bar dataKey="total_amount" fill="#04a9f5" name="Total Amount" />
        <Bar dataKey="paid_amount" fill="#28a745" name="Paid" />
        <Bar dataKey="outstanding_amount" fill="#ffc107" name="Unpaid" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function formatChartDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function getDateRangeForPeriod(period: string): {
  start_date: string;
  end_date: string;
} {
  const today = new Date();
  const endDate = new Date(today);
  let startDate = new Date(today);

  switch (period) {
    case "Last 3 months":
      startDate.setMonth(today.getMonth() - 3);
      break;
    case "Last 6 months":
      startDate.setMonth(today.getMonth() - 6);
      break;
    case "This year":
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      startDate.setMonth(today.getMonth() - 3);
  }

  return {
    start_date: formatChartDate(startDate),
    end_date: formatChartDate(endDate),
  };
}

const CustomerDashboard = () => {
  const [currency, setCurrency] = useState<string>("");
  const [topProducts, setTopProducts] = useState<
    Array<{
      name: string;
      total_revenue: string;
      status: string;
      subscriptions: string;
    }>
  >([]);
  const [spendingData, setSpendingData] = useState<SpendingRow[]>([]);
  const [selectedPeriod, setSelectedPeriod] =
    useState<string>("Last 3 months");
  const [summaryCards, setSummaryCards] = useState<StatsCardData[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | number
  >("");
  const [customerEnsureRefreshKey, setCustomerEnsureRefreshKey] = useState(0);
  const [isDashboardLoading, setIsDashboardLoading] =
    useState<boolean>(true);

  const onAccountingCustomerCreated = useCallback(() => {
    setCustomerEnsureRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId || null, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_dashboard_ensure_customer_failed",
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      const result = await getMinifiedCompanies({
        send_all: "true",
      });
      setCompanies(result ?? ([] as any));
    };
    fetchCompanies();
  }, []);

  const loadDashboardCounters = async (params: {
    crm_company_id?: string | number;
  } = {}) => {
    const response = (await GetDashboardCounters(params)) as any;
    setSummaryCards([
      {
        title: "Subscriptions",
        value: formatInteger(response?.products?.total ?? 0),
        icon: Package,
        iconColor: "#3b82f6",
        iconBgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        title: "Total Invoice Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.total_amount)}`,
        icon: FileText,
        iconColor: "#3b82f6",
        iconBgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        title: "Outstanding Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.outstanding_amount)}`,
        icon: AlertCircle,
        iconColor: "#fbbf24",
        iconBgColor: "rgba(251, 191, 36, 0.1)",
      },
      {
        title: "Overdue Invoices",
        value: formatInteger(
          response?.invoices?.overdue_invoices_count ?? 0,
        ),
        icon: Clock,
        iconColor: "#ef4444",
        iconBgColor: "rgba(239, 68, 68, 0.1)",
      },
      {
        title: "Overdue Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.overdue_amount)}`,
        icon: AlertCircle,
        iconColor: "#fbbf24",
        iconBgColor: "rgba(251, 191, 36, 0.1)",
        link: {
          text: "Pay Now",
          onClick: () => router.push("/billing/invoices"),
        },
      },
      {
        title: "Paid This Month",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(response?.invoices?.paid_amount)}`,
        icon: Wallet,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        subtitle: "Last 30 days",
      },
    ]);
  };

  const loadProfitLossData = async (params: {
    crm_company_id?: string | number;
  } = {}) => {
    await GetProfitLossData(params);
  };

  const loadTopProducts = async (params: {
    crm_company_id?: string | number;
  } = {}) => {
    const response = await GetTopProducts(params);
    setTopProducts(response as any);
  };

  const loadRecentActivity = async (params: {
    crm_company_id?: string | number;
  } = {}) => {
    await GetRecentActivity(params);
  };

  const loadAnalyticsByMonth = async (params: {
    crm_company_id?: string | number;
  } = {}) => {
    const dateRange = getDateRangeForPeriod(selectedPeriod);
    const response = (await GetAnalyticsByMonth(
      dateRange.start_date,
      dateRange.end_date,
      params,
    )) as any[];

    const transformedData: SpendingRow[] = response.map((item: any) => {
      const monthAbbr = item.month_name;
      return {
        month: monthAbbr,
        month_name: item.month_name,
        spent: item.total_amount || 0,
        total_amount: item.total_amount || 0,
        paid_amount: item.paid_amount || 0,
        outstanding_amount: item.outstanding_amount || 0,
      };
    });

    setSpendingData(transformedData);
  };

  const loadCompanyCurrency = async () => {
    const response = (await GetCompanyDetails()) as any;
    setCurrency(response?.profile?.currency ?? "");
  };

  useEffect(() => {
    const apiPayload = selectedCompanyId
      ? { crm_company_id: selectedCompanyId }
      : {};
    setIsDashboardLoading(true);
    Promise.all([
      loadDashboardCounters(apiPayload),
      loadProfitLossData(apiPayload),
      loadTopProducts(apiPayload),
      loadRecentActivity(apiPayload),
      loadAnalyticsByMonth(apiPayload),
      loadCompanyCurrency(),
    ]).finally(() => setIsDashboardLoading(false));
  }, [selectedPeriod, selectedCompanyId, customerEnsureRefreshKey]);

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return "primary";
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "trial":
        return "warning";
      case "suspended":
        return "secondary";
      case "in progress":
        return "info";
      case "inactive":
        return "secondary";
      default:
        return "primary";
    }
  };

  const getStatusBackgroundColor = (status: string | null | undefined) => {
    if (!status) return "59, 130, 246";
    switch (status.toLowerCase()) {
      case "active":
        return "34, 197, 94";
      case "trial":
        return "251, 191, 36";
      case "in progress":
        return "59, 130, 246";
      case "suspended":
        return "156, 163, 175";
      case "inactive":
        return "107, 114, 128";
      default:
        return "59, 130, 246";
    }
  };

  const getStatusIconColor = (status: string | null | undefined) => {
    if (!status) return "#3b82f6";
    switch (status.toLowerCase()) {
      case "active":
        return "#22c55e";
      case "trial":
        return "#fbbf24";
      case "in progress":
        return "#3b82f6";
      case "suspended":
        return "#9ca3af";
      case "inactive":
        return "#6b7280";
      default:
        return "#3b82f6";
    }
  };

  const SKELETON_CARD_KEYS = [
    "sk-card-a",
    "sk-card-b",
    "sk-card-c",
    "sk-card-d",
    "sk-card-e",
    "sk-card-f",
  ] as const;
  const SKELETON_BAR_KEYS = [
    "sk-bar-a",
    "sk-bar-b",
    "sk-bar-c",
    "sk-bar-d",
    "sk-bar-e",
    "sk-bar-f",
  ] as const;
  const SKELETON_ROW_KEYS = [
    "sk-row-a",
    "sk-row-b",
    "sk-row-c",
    "sk-row-d",
    "sk-row-e",
  ] as const;

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Billing Dashboard" />

      <div>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/billing" className="text-decoration-none">
                    Billing
                  </a>
                </li>
                <li
                  className="breadcrumb-item active fw-bold"
                  aria-current="page"
                >
                  Dashboard
                </li>
              </ol>
            </nav>
          </div>
          <div className="mb-3 mb-md-0">
            <Form.Select
              size="sm"
              style={{ width: "220px" }}
              value={selectedCompanyId}
              onChange={(e) =>
                setSelectedCompanyId(e.target.value === "" ? "" : e.target.value)
              }
            >
              <option value="">All companies</option>
              {companies.map((c: { id: string | number; name?: string }) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.id}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {isDashboardLoading ? (
          <>
            <div
              className="mb-4"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              {SKELETON_CARD_KEYS.map((skKey) => (
                <Card key={skKey} className="border-0 shadow-sm">
                  <Card.Body style={{ padding: "20px" }}>
                    <div className="placeholder-glow">
                      <span
                        className="placeholder d-block col-8 mb-2"
                        style={{ height: 14 }}
                      />
                      <span
                        className="placeholder d-block col-5"
                        style={{ height: 28 }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
            <Row>
              <Col lg={8} className="mb-4">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="placeholder-glow">
                        <span
                          className="placeholder col-4"
                          style={{ height: 24 }}
                        />
                      </div>
                    </div>
                    <div
                      className="placeholder-glow d-flex align-items-end gap-2"
                      style={{ height: 354 }}
                    >
                      {[40, 65, 45, 80, 55, 70].map((h, i) => (
                        <span
                          key={SKELETON_BAR_KEYS[i]}
                          className="placeholder flex-grow-1 rounded"
                          style={{ height: `${h}%`, minWidth: 24 }}
                        />
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} className="mb-4">
                <Card
                  style={{
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <Card.Body>
                    <div className="placeholder-glow mb-4">
                      <span
                        className="placeholder col-5"
                        style={{ height: 24 }}
                      />
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {SKELETON_ROW_KEYS.map((skKey) => (
                        <div
                          key={skKey}
                          className="d-flex align-items-center gap-2"
                        >
                          <span
                            className="placeholder rounded"
                            style={{ width: 36, height: 36 }}
                          />
                          <span
                            className="placeholder col-6"
                            style={{ height: 20 }}
                          />
                          <span
                            className="placeholder col-2"
                            style={{ height: 22 }}
                          />
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <StatsCards
              data={summaryCards}
              gridMinWidth="180px"
              valueFontSize="28px"
            />

            <Row>
              <Col lg={8} className="mb-4">
                <Card>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h5 className="mb-0" style={{ fontWeight: "600" }}>
                        Spending Overview
                      </h5>
                      <Form.Select
                        size="sm"
                        style={{ width: "150px" }}
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                      >
                        <option value="Last 3 months">Last 3 months</option>
                        <option value="Last 6 months">Last 6 months</option>
                        <option value="This year">This year</option>
                      </Form.Select>
                    </div>
                    <DashboardSpendingChart
                      spendingData={spendingData}
                      currency={currency}
                    />
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4} className="mb-4">
                <Card
                  style={{
                    border: "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <Card.Body>
                    <h5 className="mb-4" style={{ fontWeight: "600" }}>
                      Subscriptions
                    </h5>
                    <div style={{ maxHeight: "367px", overflowY: "auto" }}>
                      {topProducts.map((subscription) => (
                        <div
                          key={
                            subscription.name
                              ? `sub-${subscription.name}`
                              : `sub-${subscription.status ?? "row"}`
                          }
                          className="mb-3 pb-2 border-bottom"
                        >
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="rounded d-flex align-items-center justify-content-center"
                              style={{
                                width: "36px",
                                height: "36px",
                                backgroundColor: `rgba(${getStatusBackgroundColor(subscription?.status)}, 0.1)`,
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  color: getStatusIconColor(
                                    subscription?.status,
                                  ),
                                }}
                              >
                                {subscription?.subscriptions || "0"}
                              </div>
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h6
                                className="mb-0 text-truncate text-capitalize"
                                style={{
                                  fontSize: "0.9rem",
                                  fontWeight: "500",
                                }}
                              >
                                {subscription?.name}
                              </h6>
                            </div>
                            <div
                              style={{ marginLeft: "8px", flexShrink: 0 }}
                            >
                              <Badge
                                bg={getStatusBadgeColor(
                                  subscription?.status,
                                )}
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.35rem 0.65rem",
                                }}
                              >
                                {subscription?.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </React.Fragment>
  );
};

CustomerDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CustomerDashboard;
