export interface ChatbotsTenantSummaryStats {
  queriesToday: number;
  costTodayUsd: number;
  queriesThisMonth: number;
  costThisMonthUsd: number;
  activeUsers: number;
}

export interface TenantTopUserRow {
  user: string;
  queries: number;
  tokens: number;
  costUsd: number;
}

export interface TenantTopQuestionRow {
  question: string;
  asks: number;
  users: number;
}

export interface TenantKnowledgeBaseStats {
  tenantFaqs: number;
  globalFaqs: number;
  trained: boolean;
  lastTraining: string | null;
}

export interface TenantRecentConversationRow {
  threadId: string;
  thread: string;
  user: string;
  lastActivity: string;
  modelUsed: string;
  costUsd: number;
}

/** Tenant-facing LLM rates from dashboard `pricing` (margin already applied). */
export interface TenantDashboardPricing {
  model: string;
  inputPerMillion: string;
  outputPerMillion: string;
}

export interface TenantUserBudgetRow {
  userId: string;
  displayName: string;
  monthlyBudgetUsd: string | null;
  budgetThresholdPct: number | null;
  effectiveBudgetUsd: string;
  effectiveThresholdPct: number;
  mtdSpend: string;
  remainingUsd: string;
  usedPct: number;
  isExhausted: boolean;
  budgetSource: string;
  budgetSourceLabel: string;
  budgetSyncedAt: string | null;
  lastSeen: string | null;
}

export interface ChatbotsTenantDashboardModel {
  tenantId?: string;
  companyName?: string;
  generatedAt?: string;
  summary: ChatbotsTenantSummaryStats;
  dailyCostQueriesLast30Days: {
    categories: string[];
    costSeries: number[];
    queriesSeries: number[];
  };
  topUsersThisMonth: TenantTopUserRow[];
  topQuestions7d: TenantTopQuestionRow[];
  knowledgeBase: TenantKnowledgeBaseStats;
  recentConversations: TenantRecentConversationRow[];
  pricing: TenantDashboardPricing | null;
}
