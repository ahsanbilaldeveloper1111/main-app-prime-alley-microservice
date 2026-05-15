export interface ChatbotsSummaryStats {
  queriesToday: number;
  costTodayUsd: number;
  costMonthUsd: number;
  tenants: number;
  users: number;
  failuresToday: number;
}

export interface TopCompanyRow {
  company: string;
  queries: number;
  costUsd: number;
}

export interface TopUserRow {
  user: string;
  company: string;
  costUsd: number;
}

export interface NamedAmountSlice {
  label: string;
  value: number;
}

/** All companies rollup (e.g. admin directory). */
export interface AllCompaniesRow {
  company: string;
  monthQueries: number;
  monthCostUsd: number;
  /** Display-ready timestamp (API may send ISO; UI can format). */
  lastActivity: string;
}

/** Top Q&A prompts aggregated across tenants. */
export interface TopQaAcrossCompaniesRow {
  question: string;
  asked: number;
}

export interface ChatbotsAdminDashboardModel {
  generatedAt?: string;
  summary: ChatbotsSummaryStats;
  costQueriesLast30Days: {
    categories: string[];
    costSeries: number[];
    queriesSeries: number[];
  };
  topCompaniesThisMonth: TopCompanyRow[];
  topUsersThisMonth: TopUserRow[];
  modelCostThisMonth: NamedAmountSlice[];
  callTypesThisMonth: NamedAmountSlice[];
  allCompanies: AllCompaniesRow[];
  topQasAcrossCompanies: TopQaAcrossCompaniesRow[];
}
