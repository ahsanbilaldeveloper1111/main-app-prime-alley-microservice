import "@components/billings/customer/billingCustomerDatatablePortalStyles";
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
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";
import { useEnsureCustomerForCrmCompany } from "@hooks/billing/useEnsureCustomerForCrmCompany";
import { useMinifiedCompaniesForSelect } from "@hooks/billing/useMinifiedCompaniesForSelect";
import { BillingCustomerCompanySelect } from "@components/billings/customer/BillingCustomerCompanySelect";
import { billingCustomerRoutes } from "@utils/billingCustomerRoutes";
import type { SpendingRow } from "@page-modules/billing/customer/billingCustomerDashboardModel";
import { useBillingCustomerDashboardBundleQuery } from "@page-modules/billing/customer/useBillingCustomerDashboardBundleQuery";

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

type SubscriptionVisualStyle = {
  badgeBg: string;
  bgRgb: string;
  iconColor: string;
};

const SUBSCRIPTION_STYLE_DEFAULT: SubscriptionVisualStyle = {
  badgeBg: "primary",
  bgRgb: "59, 130, 246",
  iconColor: "#3b82f6",
};

const SUBSCRIPTION_STYLE_BY_STATUS_KEY: Record<
  string,
  SubscriptionVisualStyle
> = {
  active: {
    badgeBg: "success",
    bgRgb: "34, 197, 94",
    iconColor: "#22c55e",
  },
  trial: {
    badgeBg: "warning",
    bgRgb: "251, 191, 36",
    iconColor: "#fbbf24",
  },
  "in progress": {
    badgeBg: "info",
    bgRgb: "59, 130, 246",
    iconColor: "#3b82f6",
  },
  suspended: {
    badgeBg: "secondary",
    bgRgb: "156, 163, 175",
    iconColor: "#9ca3af",
  },
  inactive: {
    badgeBg: "secondary",
    bgRgb: "107, 114, 128",
    iconColor: "#6b7280",
  },
};

function subscriptionStyleForStatus(
  status: string | null | undefined,
): SubscriptionVisualStyle {
  const key = status?.trim().toLowerCase() ?? "";
  return SUBSCRIPTION_STYLE_BY_STATUS_KEY[key] ?? SUBSCRIPTION_STYLE_DEFAULT;
}

const CustomerDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] =
    useState<string>("Last 3 months");
  const { companyOptions } = useMinifiedCompaniesForSelect(
    "billing_dashboard_load_companies_failed",
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | number
  >("");
  const [customerEnsureRefreshKey, setCustomerEnsureRefreshKey] = useState(0);

  const onAccountingCustomerCreated = useCallback(() => {
    setCustomerEnsureRefreshKey((k) => k + 1);
  }, []);

  useEnsureCustomerForCrmCompany(selectedCompanyId || null, {
    onCreated: onAccountingCustomerCreated,
    errorToastId: "billing_dashboard_ensure_customer_failed",
  });

  const {
    data: bundle,
    isPending,
    isError,
    error,
  } = useBillingCustomerDashboardBundleQuery(
    selectedCompanyId,
    selectedPeriod,
    customerEnsureRefreshKey,
  );

  useEffect(() => {
    if (!isError || error == null) return;
    toast.error(`Failed to load dashboard: ${getErrorMessage(error)}`, {
      toastId: "billing_dashboard_bundle_failed",
    });
  }, [isError, error]);

  const currency = bundle?.currency ?? "";
  const topProducts = bundle?.topProducts ?? [];
  const spendingData = bundle?.spendingData ?? [];

  const summaryCards = useMemo((): StatsCardData[] => {
    if (!bundle) return [];
    const inv = bundle.parsedCounters.invoices;
    const parsed = bundle.parsedCounters;
    return [
      {
        title: "Subscriptions",
        value: formatInteger(parsed.productsTotal),
        icon: Package,
        iconColor: "#3b82f6",
        iconBgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        title: "Total Invoice Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(inv.total_amount)}`,
        icon: FileText,
        iconColor: "#3b82f6",
        iconBgColor: "rgba(59, 130, 246, 0.1)",
      },
      {
        title: "Outstanding Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(inv.outstanding_amount)}`,
        icon: AlertCircle,
        iconColor: "#fbbf24",
        iconBgColor: "rgba(251, 191, 36, 0.1)",
      },
      {
        title: "Overdue Invoices",
        value: formatInteger(inv.overdue_invoices_count),
        icon: Clock,
        iconColor: "#ef4444",
        iconBgColor: "rgba(239, 68, 68, 0.1)",
      },
      {
        title: "Overdue Amount",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(inv.overdue_amount)}`,
        icon: AlertCircle,
        iconColor: "#fbbf24",
        iconBgColor: "rgba(251, 191, 36, 0.1)",
        link: {
          text: "Pay Now",
          onClick: () => router.push(billingCustomerRoutes.invoices()),
        },
      },
      {
        title: "Paid This Month",
        value: `${CURRENCY_SYMBOL} ${formatWithOneDecimal(inv.paid_amount)}`,
        icon: Wallet,
        iconColor: "#10B981",
        iconBgColor: "#D1FAE5",
        subtitle: "Last 30 days",
      },
    ];
  }, [bundle]);

  const isDashboardLoading = isPending && !bundle;

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
            <BillingCustomerCompanySelect
              value={selectedCompanyId}
              onChange={(next) => setSelectedCompanyId(next)}
              companies={companyOptions}
            />
          </div>
        </div>

        {isDashboardLoading ? (
          <>
            <div className="mb-4 bc-dashboard-skeleton-cards-grid">
              {SKELETON_CARD_KEYS.map((skKey) => (
                <Card key={skKey} className="border-0 shadow-sm">
                  <Card.Body className="bc-card-body-p-20">
                    <div className="placeholder-glow">
                      <span
                        className="placeholder d-block col-8 mb-2 bc-ph-h-14"
                      />
                      <span
                        className="placeholder d-block col-5 bc-ph-h-28"
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
                          className="placeholder col-4 bc-ph-h-24"
                        />
                      </div>
                    </div>
                    <div
                      className="placeholder-glow d-flex align-items-end gap-2 bc-chart-skeleton-h"
                    >
                      {[40, 65, 45, 80, 55, 70].map((h, i) => (
                        <span
                          key={SKELETON_BAR_KEYS[i]}
                          className="placeholder flex-grow-1 rounded bc-ph-bar"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} className="mb-4">
                <Card className="bc-dashboard-soft-card">
                  <Card.Body>
                    <div className="placeholder-glow mb-4">
                      <span
                        className="placeholder col-5 bc-ph-h-24"
                      />
                    </div>
                    <div className="d-flex flex-column gap-3">
                      {SKELETON_ROW_KEYS.map((skKey) => (
                        <div
                          key={skKey}
                          className="d-flex align-items-center gap-2"
                        >
                          <span
                            className="placeholder rounded bc-ph-36"
                          />
                          <span
                            className="placeholder col-6 bc-ph-h-20"
                          />
                          <span
                            className="placeholder col-2 bc-ph-h-22"
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
                      <h5 className="mb-0 fw-semibold">
                        Spending Overview
                      </h5>
                      <Form.Select
                        size="sm"
                        className="bc-period-select"
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
                <Card className="bc-dashboard-soft-card">
                  <Card.Body>
                    <h5 className="mb-4 fw-semibold">
                      Subscriptions
                    </h5>
                    <div className="bc-subscriptions-scroll">
                      {topProducts.map((subscription) => {
                        const subStyle = subscriptionStyleForStatus(
                          subscription.status,
                        );
                        return (
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
                              className="rounded d-flex align-items-center justify-content-center bc-subscription-icon-wrap"
                              style={
                                {
                                  "--bc-sub-bg": `rgba(${subStyle.bgRgb}, 0.1)`,
                                  "--bc-sub-icon": subStyle.iconColor,
                                } as React.CSSProperties
                              }
                            >
                              <div className="bc-subscription-icon-inner">
                                {subscription.subscriptions || "0"}
                              </div>
                            </div>
                            <div className="bc-subscription-main">
                              <h6
                                className="mb-0 text-truncate text-capitalize bc-subscription-title"
                              >
                                {subscription.name}
                              </h6>
                            </div>
                            <div className="bc-subscription-badge-wrap">
                              <Badge
                                bg={subStyle.badgeBg}
                                className="bc-subscription-status-badge"
                              >
                                {subscription.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        );
                      })}
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
