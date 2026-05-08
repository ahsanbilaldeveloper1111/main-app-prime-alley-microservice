import {
  GetAnalyticsByMonth,
  GetCompanyDetails,
  GetDashboardCounters,
  GetProfitLossData,
  GetRecentActivity,
  GetTopProducts,
} from "@utils/accounting";

export const DASHBOARD_CURRENCY_SYMBOL = "";

export type SpendingRow = {
  month: string;
  month_name?: string;
  spent: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
};

export type TopProductRowState = {
  name: string;
  total_revenue: string;
  status: string;
  subscriptions: string;
};

export type ParsedDashboardCounters = {
  productsTotal: number;
  invoices: {
    total_amount: number;
    outstanding_amount: number;
    overdue_invoices_count: number;
    overdue_amount: number;
    paid_amount: number;
  };
};

export function formatChartDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getDateRangeForPeriod(period: string): {
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

export function readUnknownNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Avoid `String(object)` → `[object Object]` (Sonar S7789-style). */
export function unknownToDisplayString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function asUnknownRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function parseDashboardCountersPayload(
  payload: unknown,
): ParsedDashboardCounters {
  const root = asUnknownRecord(payload) ?? {};
  const products = asUnknownRecord(root.products) ?? {};
  const invoices = asUnknownRecord(root.invoices) ?? {};
  return {
    productsTotal: readUnknownNumber(products.total),
    invoices: {
      total_amount: readUnknownNumber(invoices.total_amount),
      outstanding_amount: readUnknownNumber(invoices.outstanding_amount),
      overdue_invoices_count: readUnknownNumber(
        invoices.overdue_invoices_count,
      ),
      overdue_amount: readUnknownNumber(invoices.overdue_amount),
      paid_amount: readUnknownNumber(invoices.paid_amount),
    },
  };
}

export function normalizeTopProductsResponse(
  response: unknown,
): TopProductRowState[] {
  if (!Array.isArray(response)) {
    return [];
  }
  return response.map((item) => {
    const row = asUnknownRecord(item);
    if (!row) {
      return {
        name: "",
        total_revenue: "",
        status: "",
        subscriptions: "",
      };
    }
    return {
      name: unknownToDisplayString(row.name),
      total_revenue: unknownToDisplayString(row.total_revenue),
      status: unknownToDisplayString(row.status),
      subscriptions: unknownToDisplayString(row.subscriptions),
    };
  });
}

export function mapAnalyticsRowsToSpendingData(rows: unknown[]): SpendingRow[] {
  return rows.map((item) => {
    const row = asUnknownRecord(item) ?? {};
    const monthLabel = unknownToDisplayString(row.month_name);
    const total = readUnknownNumber(row.total_amount);
    const paid = readUnknownNumber(row.paid_amount);
    const outstanding = readUnknownNumber(row.outstanding_amount);
    return {
      month: monthLabel,
      month_name: monthLabel,
      spent: total,
      total_amount: total,
      paid_amount: paid,
      outstanding_amount: outstanding,
    };
  });
}

export function currencyCodeFromCompanyDetailsPayload(
  payload: unknown,
): string {
  const root = asUnknownRecord(payload);
  const profile = root ? asUnknownRecord(root.profile) : null;
  const raw = profile?.currency;
  return typeof raw === "string" ? raw : "";
}

export type BillingCustomerDashboardBundle = Readonly<{
  parsedCounters: ParsedDashboardCounters;
  topProducts: TopProductRowState[];
  spendingData: SpendingRow[];
  currency: string;
}>;

export async function fetchBillingCustomerDashboardBundle(params: {
  selectedCompanyId: string | number | null | undefined;
  selectedPeriod: string;
}): Promise<BillingCustomerDashboardBundle> {
  const apiPayload = params.selectedCompanyId
    ? { crm_company_id: params.selectedCompanyId }
    : {};
  const dateRange = getDateRangeForPeriod(params.selectedPeriod);

  const [countersRaw, , topRaw, , analyticsRaw, companyRaw] =
    await Promise.all([
      GetDashboardCounters(apiPayload),
      GetProfitLossData(apiPayload),
      GetTopProducts(apiPayload),
      GetRecentActivity(apiPayload),
      GetAnalyticsByMonth(
        dateRange.start_date,
        dateRange.end_date,
        apiPayload,
      ),
      GetCompanyDetails(),
    ]);

  const parsedCounters = parseDashboardCountersPayload(countersRaw);
  const topProducts = normalizeTopProductsResponse(topRaw);
  const rows = Array.isArray(analyticsRaw) ? analyticsRaw : [];
  const spendingData = mapAnalyticsRowsToSpendingData(rows);
  const currency = currencyCodeFromCompanyDetailsPayload(companyRaw);

  return {
    parsedCounters,
    topProducts,
    spendingData,
    currency,
  };
}
