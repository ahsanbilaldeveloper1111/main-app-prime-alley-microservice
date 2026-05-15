export interface ChatbotsTenantSummaryStats {
  queriesToday: number;
  costTodayUsd: number;
  queriesThisMonth: number;
  costThisMonthUsd: number;
  activeUsers: number;
}

export interface RateLimitUsage {
  queriesPerMinuteLimit: number;
  queriesPerMinuteRemaining: number;
  queriesTodayLimit: number;
  queriesTodayRemaining: number;
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
  thread: string;
  user: string;
  lastActivity: string;
}

export interface ChatbotsTenantDashboardModel {
  tenantId?: string;
  companyName?: string;
  generatedAt?: string;
  summary: ChatbotsTenantSummaryStats;
  rateLimit: RateLimitUsage;
  dailyCostQueriesLast30Days: {
    categories: string[];
    costSeries: number[];
    queriesSeries: number[];
  };
  topUsersThisMonth: TenantTopUserRow[];
  topQuestions7d: TenantTopQuestionRow[];
  knowledgeBase: TenantKnowledgeBaseStats;
  recentConversations: TenantRecentConversationRow[];
}
