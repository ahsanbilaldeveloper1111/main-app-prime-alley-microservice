import type { AdminChatDashboardResponse } from "@utils/chat";

import type { ChatbotsAdminDashboardModel } from "./types";

function parseCost(value: string | number | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function parseMarginPct(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function formatTrendLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatActivity(value: string | undefined): string {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tenantDisplayName(
  tenantId: string,
  name: string | undefined,
): string {
  const n = name?.trim();
  return n || tenantId;
}

function buildTenantNameMap(data: AdminChatDashboardResponse): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of data.tenants ?? []) {
    map.set(row.tenant_id, tenantDisplayName(row.tenant_id, row.name));
  }
  for (const row of data.top_tenants ?? []) {
    if (!map.has(row.tenant_id)) {
      map.set(row.tenant_id, tenantDisplayName(row.tenant_id, row.name));
    }
  }
  return map;
}

export function mapAdminDashboardApi(
  data: AdminChatDashboardResponse,
): ChatbotsAdminDashboardModel {
  const trend = [...(data.trend_30d ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const tenantNames = buildTenantNameMap(data);

  return {
    generatedAt: data.generated_at,
    summary: {
      queriesToday: data.kpis.today.queries,
      costTodayUsd: parseCost(data.kpis.today.cost),
      costMonthUsd: parseCost(data.kpis.this_month.cost),
      profitMonthUsd: parseCost(data.kpis.profit_this_month),
      tenants: data.kpis.active_tenants_7d,
      users: data.kpis.active_users_7d,
      failuresToday: data.kpis.today.failed,
    },
    costQueriesLast30Days: {
      categories: trend.map((p) => formatTrendLabel(p.date)),
      costSeries: trend.map((p) => parseCost(p.cost)),
      queriesSeries: trend.map((p) => p.queries),
    },
    topCompaniesThisMonth: (data.top_tenants ?? []).map((row) => ({
      company: tenantDisplayName(row.tenant_id, row.name),
      queries: row.queries,
      costUsd: parseCost(row.cost),
      revenueUsd: parseCost(row.tenant_revenue),
      profitUsd: parseCost(row.profit_usd),
      marginPct: parseMarginPct(row.margin_pct),
    })),
    topUsersThisMonth: (data.top_users ?? []).map((row) => ({
      user: row.display_name?.trim() || row.user_id,
      company:
        tenantNames.get(row.tenant_id) ??
        tenantDisplayName(row.tenant_id, undefined),
      costUsd: parseCost(row.cost),
    })),
    modelCostThisMonth: (data.model_mix ?? []).map((row) => ({
      label: row.model_used,
      value: parseCost(row.cost),
    })),
    callTypesThisMonth: (data.type_mix ?? []).map((row) => ({
      label: row.call_type,
      value: row.queries,
    })),
    allCompanies: (data.tenants ?? []).map((row) => ({
      company: tenantDisplayName(row.tenant_id, row.name),
      monthQueries: row.month_queries,
      monthCostUsd: parseCost(row.month_cost),
      monthRevenueUsd: parseCost(row.month_revenue),
      monthProfitUsd: parseCost(row.month_profit),
      marginPct: parseMarginPct(row.margin_pct),
      lastActivity: formatActivity(row.last_activity),
    })),
    topQasAcrossCompanies: (data.top_questions_7d ?? []).map((row) => ({
      question: row.question,
      asked: row.asks,
    })),
  };
}
