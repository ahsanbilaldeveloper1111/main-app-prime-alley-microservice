import type { TenantChatDashboardResponse } from "@utils/chat";

import type { ChatbotsTenantDashboardModel } from "./types";

function parseCost(value: string | number | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
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

function mapPricing(
  pricing: TenantChatDashboardResponse["pricing"],
): ChatbotsTenantDashboardModel["pricing"] {
  if (!pricing) {
    return null;
  }
  return {
    model: pricing.model?.trim() || "—",
    inputPerMillion: pricing.input_per_million?.trim() || "0",
    outputPerMillion: pricing.output_per_million?.trim() || "0",
  };
}

export function mapTenantDashboardApi(
  data: TenantChatDashboardResponse,
): ChatbotsTenantDashboardModel {
  const trend = [...(data.trend_30d ?? [])].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return {
    tenantId: data.tenant_id,
    companyName: data.company_name,
    generatedAt: data.generated_at,
    summary: {
      queriesToday: data.kpis.today.queries,
      costTodayUsd: parseCost(data.kpis.today.cost),
      queriesThisMonth: data.kpis.this_month.queries,
      costThisMonthUsd: parseCost(data.kpis.this_month.cost),
      activeUsers: data.kpis.active_users_7d,
    },
    dailyCostQueriesLast30Days: {
      categories: trend.map((p) => formatTrendLabel(p.date)),
      costSeries: trend.map((p) => parseCost(p.cost)),
      queriesSeries: trend.map((p) => p.queries),
    },
    topUsersThisMonth: (data.top_users ?? []).map((row) => ({
      user: row.display_name?.trim() || row.user_id,
      queries: row.queries,
      tokens: row.tokens,
      costUsd: parseCost(row.cost),
    })),
    topQuestions7d: (data.top_questions_7d ?? []).map((row) => ({
      question: row.question,
      asks: row.asks,
      users: row.unique_users,
    })),
    knowledgeBase: {
      tenantFaqs: data.kb.tenant_faqs,
      globalFaqs: data.kb.global_faqs,
      trained: data.kb.is_trained,
      lastTraining: data.kb.last_training
        ? formatActivity(data.kb.last_training)
        : null,
    },
    recentConversations: (data.recent_conversations ?? []).map((row, i) => {
      const threadId = row.thread_id?.trim() || `row-${i}`;
      return {
        threadId,
        thread:
          row.title?.trim() ||
          row.thread?.trim() ||
          threadId ||
          `Thread ${i + 1}`,
        user:
          row.display_name?.trim() ||
          row.user?.trim() ||
          row.user_id?.trim() ||
          "—",
        lastActivity: formatActivity(row.updated_at ?? row.last_activity),
        modelUsed: row.model_used?.trim() || "—",
        costUsd: parseCost(row.cost),
      };
    }),
    pricing: mapPricing(data.pricing),
  };
}
