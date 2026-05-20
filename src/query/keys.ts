/**
 * Namespaced query keys for project-wide TanStack Query use.
 * Add domains here (e.g. `crmKeys`, `plannerKeys`) as migrations expand.
 */

/**
 * Build a `(page, perPage, search)` paginated list key under `base`.
 * Shared shape used by every admin-style list (`tickets`, `faqs`, ...) so the
 * builders themselves stay one-liners.
 */
export const paginatedListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: { page: number; perPage: number; search: string },
) =>
  [
    ...base,
    "list",
    params.page,
    params.perPage,
    params.search,
  ] as const;

export const communicationsKeys = {
  root: ["communications"] as const,

  callLogs: {
    all: () => [...communicationsKeys.root, "callLogs"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      /** Serialized applied filters + refresh generation */
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...communicationsKeys.callLogs.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },

  callRecordings: {
    all: () => [...communicationsKeys.root, "callRecordings"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...communicationsKeys.callRecordings.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },

  finesse: {
    all: () => [...communicationsKeys.root, "finesse"] as const,
    campaigns: (teamId: string | number, username: string) =>
      [...communicationsKeys.finesse.all(), "campaigns", teamId, username] as const,
  },
};

export const plannerKeys = {
  root: ["planner"] as const,

  tasks: {
    all: () => [...plannerKeys.root, "tasks"] as const,
    list: (params: {
      scope: "embed" | "page";
      embedProjectId: number | null;
      embedRefresh: number | undefined;
      page: number;
      perPage: number;
      sortCol: string;
      sortDir: string;
      filtersKey: string;
      activeTab: string;
      projectsForFiltersKey: string;
      assigneeExtensionsKey: string;
    }) =>
      [
        ...plannerKeys.tasks.all(),
        "list",
        params.scope,
        params.embedProjectId ?? "none",
        params.embedRefresh ?? "—",
        params.page,
        params.perPage,
        params.sortCol,
        params.sortDir,
        params.filtersKey,
        params.activeTab,
        params.projectsForFiltersKey,
        params.assigneeExtensionsKey,
      ] as const,
    detail: (taskId: string) =>
      [...plannerKeys.tasks.all(), "detail", taskId] as const,
  },

  projects: {
    all: () => [...plannerKeys.root, "projects"] as const,
    detail: (projectId: string) =>
      [...plannerKeys.projects.all(), "detail", projectId] as const,
    filterDirectory: () =>
      [...plannerKeys.projects.all(), "filterDirectory"] as const,
  },

  statuses: {
    all: () => [...plannerKeys.root, "statuses"] as const,
    global: () => [...plannerKeys.statuses.all(), "global"] as const,
    /** Workflow statuses for task filters: project-scoped or global list */
    workflow: (projectId: number | null) =>
      [
        ...plannerKeys.statuses.all(),
        "workflow",
        projectId ?? "global",
      ] as const,
  },

  workload: {
    all: () => [...plannerKeys.root, "workload"] as const,
    listParams: (params: {
      ext: string;
      range: string;
      match: string;
      start?: string;
      end?: string;
      member?: string;
      project?: string;
    }) =>
      [
        ...plannerKeys.workload.all(),
        params.ext,
        params.range,
        params.match,
        params.start ?? "",
        params.end ?? "",
        params.member ?? "all",
        params.project ?? "all",
      ] as const,
    summary: (params: {
      ext: string;
      range: string;
      match: string;
      start?: string;
      end?: string;
      member?: string;
      project?: string;
    }) =>
      [...plannerKeys.workload.listParams(params), "summary"] as const,
    grid: (params: {
      ext: string;
      range: string;
      match: string;
      start?: string;
      end?: string;
      member?: string;
      project?: string;
    }) => [...plannerKeys.workload.listParams(params), "grid"] as const,
    board: (params: {
      ext: string;
      range: string;
      match: string;
      start?: string;
      end?: string;
      member?: string;
      project?: string;
    }) => [...plannerKeys.workload.listParams(params), "board"] as const,
    day: (params: { ext: string; date: string; match: string }) =>
      [...plannerKeys.workload.all(), "day", params.ext, params.date, params.match] as const,
    unassigned: (ext: string, projectKey = "all") =>
      [...plannerKeys.workload.all(), "unassigned", ext, projectKey] as const,
  },
};

/** DNCR / compliance module list reads (`src/pages/compliance/*`). */
export const complianceKeys = {
  root: ["compliance"] as const,

  cdr: {
    all: () => [...complianceKeys.root, "cdr"] as const,
    list: (params: {
      page: number;
      perPage: number;
      /** Serialized `AppliedFilters` for stable cache identity */
      filtersKey: string;
    }) =>
      [
        ...complianceKeys.cdr.all(),
        "list",
        params.page,
        params.perPage,
        params.filtersKey,
      ] as const,
  },

  localDndBlocks: {
    all: () => [...complianceKeys.root, "localDndBlocks"] as const,
    list: (params: {
      variant: "add-records" | "call-block";
      page: number;
      perPage: number;
      search: string;
      company: string;
    }) =>
      [
        ...complianceKeys.localDndBlocks.all(),
        "list",
        params.variant,
        params.page,
        params.perPage,
        params.search,
        params.company,
      ] as const,
  },
};

/** Workforce / employee dashboard reads (`src/pages/workforce/dashboard/*`). */
/** Main app dashboard (`/dashboard`) Summary tab analytics. */
export const mainDashboardKeys = {
  root: ["mainDashboard"] as const,
  crmListCounts: (startDate: string, endDate: string) =>
    [...mainDashboardKeys.root, "crmListCounts", startDate, endDate] as const,
  attendanceActivity: (startDate: string, endDate: string) =>
    [...mainDashboardKeys.root, "attendanceActivity", startDate, endDate] as const,
  crmCreatedCounts: (startDate: string, endDate: string) =>
    [...mainDashboardKeys.root, "crmCreatedCounts", startDate, endDate] as const,
  crmCreatedCountsMine: (startDate: string, endDate: string) =>
    [...mainDashboardKeys.root, "crmCreatedCountsMine", startDate, endDate] as const,
  crmDailyCreationCounts: (startDate: string, endDate: string) =>
    [...mainDashboardKeys.root, "crmDailyCreationCounts", startDate, endDate] as const,
};

export const workforceKeys = {
  root: ["workforce"] as const,

  dashboard: {
    all: () => [...workforceKeys.root, "dashboard"] as const,
    counters: (paramsKey: string) =>
      [...workforceKeys.dashboard.all(), "counters", paramsKey] as const,
    departmentHeadcount: (paramsKey: string) =>
      [...workforceKeys.dashboard.all(), "departmentHeadcount", paramsKey] as const,
    approvalsAging: (paramsKey: string) =>
      [...workforceKeys.dashboard.all(), "approvalsAging", paramsKey] as const,
    /** Headcount + approvals aging + leave calendar fetched together (matches prior `Promise.all`). */
    graphBundle: (paramsKey: string) =>
      [...workforceKeys.dashboard.all(), "graphBundle", paramsKey] as const,
  },

  /** Employee list & detail (`src/pages/workforce/employees/*`). */
  employees: {
    all: () => [...workforceKeys.root, "employees"] as const,
    profileDetail: (profileId: number) =>
      [...workforceKeys.employees.all(), "profileDetail", profileId] as const,
    /** Main-app directory rows for Add / Edit employee pickers (`fetchDepartmentUserRowsForModal`). */
    departmentUsers: (params: { companyUuid: string; departmentId: number }) =>
      [
        ...workforceKeys.employees.all(),
        "departmentUsers",
        params.companyUuid,
        params.departmentId,
      ] as const,
    list: (params: { page: number; limit: number; filtersKey: string; scopeKey: string }) =>
      [
        ...workforceKeys.employees.all(),
        "list",
        params.page,
        params.limit,
        params.filtersKey,
        params.scopeKey,
      ] as const,
  },

  /** Employee journeys (`src/pages/workforce/journey/*`). */
  journey: {
    all: () => [...workforceKeys.root, "journey"] as const,
    list: (params: { page: number; limit: number; filtersKey: string }) =>
      [
        ...workforceKeys.journey.all(),
        "list",
        params.page,
        params.limit,
        params.filtersKey,
      ] as const,
    detail: (journeyId: number) =>
      [...workforceKeys.journey.all(), "detail", journeyId] as const,
  },

  /** Org chart tree (`src/pages/workforce/org-chart/*`). */
  orgChart: {
    all: () => [...workforceKeys.root, "orgChart"] as const,
    tree: (filtersKey: string) =>
      [...workforceKeys.orgChart.all(), "tree", filtersKey] as const,
  },

  /** Request categories / dynamic fields (`src/pages/workforce/request-categories/*`). */
  requestCategories: {
    all: () => [...workforceKeys.root, "requestCategories"] as const,
    list: (params: { page: number; limit: number; search: string }) =>
      [
        ...workforceKeys.requestCategories.all(),
        "list",
        params.page,
        params.limit,
        params.search,
      ] as const,
    children: (parentId: number) =>
      [...workforceKeys.requestCategories.all(), "children", parentId] as const,
    fields: (categoryId: number) =>
      [...workforceKeys.requestCategories.all(), "fields", categoryId] as const,
    /** Flat picker list for create-request modal (`getUserRequestCategories` active tree). */
    newRequestModalCategories: () =>
      [...workforceKeys.requestCategories.all(), "newRequestModalCategories"] as const,
    /** Paginated list with `children: true` (`src/pages/workforce/sub-categories/*`). */
    subCategoriesList: (params: { page: number; limit: number }) =>
      [
        ...workforceKeys.requestCategories.all(),
        "subCategoriesList",
        params.page,
        params.limit,
      ] as const,
  },

  /** Attendance records + session status (`src/pages/workforce/attendance/*`). */
  attendance: {
    all: () => [...workforceKeys.root, "attendance"] as const,
    list: (params: { page: number; limit: number; filtersKey: string }) =>
      [
        ...workforceKeys.attendance.all(),
        "list",
        params.page,
        params.limit,
        params.filtersKey,
      ] as const,
    status: () => [...workforceKeys.attendance.all(), "status"] as const,
  },

  /** Approval requests inbox (`src/pages/workforce/approval-requests/*`). */
  approvalRequests: {
    all: () => [...workforceKeys.root, "approvalRequests"] as const,
    list: (params: { page: number; limit: number; filtersKey: string }) =>
      [
        ...workforceKeys.approvalRequests.all(),
        "list",
        params.page,
        params.limit,
        params.filtersKey,
      ] as const,
    categoriesBundle: () =>
      [...workforceKeys.approvalRequests.all(), "categoriesBundle"] as const,
    detail: (requestId: number) =>
      [...workforceKeys.approvalRequests.all(), "detail", requestId] as const,
    approvalInfo: (requestId: number) =>
      [...workforceKeys.approvalRequests.all(), "approvalInfo", requestId] as const,
    categoryDetail: (categoryId: number) =>
      [...workforceKeys.approvalRequests.all(), "categoryDetail", categoryId] as const,
  },
};

/** Customer billing portal reads (`src/pages/billing/customer/*`). */
export const billingCustomerKeys = {
  root: ["billingCustomer"] as const,

  /** Scoped subtree for one CRM company — use with `invalidateQueries({ queryKey })`. */
  crm: (crmId: string) =>
    [...billingCustomerKeys.root, "crm", crmId] as const,

  currencies: {
    all: () => [...billingCustomerKeys.root, "currencies"] as const,
  },

  paymentMethods: {
    /** Stripe portal cards (`GetPaymentMethods()` without company). */
    stripePortal: () =>
      [...billingCustomerKeys.root, "paymentMethods", "stripePortal"] as const,
    /** Accounting API scoped to CRM company. */
    forCompany: (crmId: string) =>
      [...billingCustomerKeys.crm(crmId), "paymentMethods"] as const,
  },

  payments: {
    recentOverview: (crmId: string) =>
      [...billingCustomerKeys.crm(crmId), "payments", "recentOverview"] as const,
    list: (params: {
      crmKey: string;
      page: number;
      perPage: number;
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...billingCustomerKeys.crm(params.crmKey),
        "payments",
        "list",
        params.page,
        params.perPage,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },

  invoices: {
    recentOverview: (crmId: string) =>
      [...billingCustomerKeys.crm(crmId), "invoices", "recentOverview"] as const,
    list: (params: {
      crmKey: string;
      page: number;
      perPage: number;
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...billingCustomerKeys.crm(params.crmKey),
        "invoices",
        "list",
        params.page,
        params.perPage,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },

  dashboardCounters: {
    overviewSlice: (crmId: string) =>
      [...billingCustomerKeys.crm(crmId), "dashboardCounters", "overviewSlice"] as const,
  },

  dashboard: {
    bundle: (crmKey: string, period: string, refreshKey: number) =>
      [
        ...billingCustomerKeys.root,
        "dashboardBundle",
        crmKey,
        period,
        refreshKey,
      ] as const,
    prefix: (crmKey: string) =>
      [...billingCustomerKeys.root, "dashboardBundle", crmKey] as const,
  },

  subscriptions: {
    pricingList: (params: {
      crmId: string;
      page: number;
      perPage: number;
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...billingCustomerKeys.crm(params.crmId),
        "subscriptions",
        "pricingList",
        params.page,
        params.perPage,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },
};

/** Params for {@link accountBillingKeys.invoiceHistory.list}. */
export type AccountBillingInvoiceHistoryListParams = {
  customerCompanyPicker: boolean;
  selectedCompanyId: string | number;
  search: string;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  paymentStatusFilter: string;
};

/**
 * Account (tenant) billing area – `src/components/billings/*` and
 * `src/pages/billing/account-billing/*`.
 */
export const accountBillingKeys = {
  root: ["accountBilling"] as const,

  /**
   * `tenant`: company details with empty `crm_company_id` (subscription / overview).
   * `session`: default company details (company info page, add-card sidebar).
   */
  companyDetails: (variant: "tenant" | "session") =>
    [...accountBillingKeys.root, "companyDetails", variant] as const,

  overviewUsersSummary: () =>
    [...accountBillingKeys.root, "overviewUsersSummary"] as const,

  tenantPayments: () => [...accountBillingKeys.root, "tenantPayments"] as const,

  documents: {
    all: () => [...accountBillingKeys.root, "documents"] as const,
    list: (companyId: string) =>
      [...accountBillingKeys.documents.all(), "list", companyId] as const,
  },

  invoiceHistory: {
    all: () => [...accountBillingKeys.root, "invoiceHistory"] as const,
    list: (params: AccountBillingInvoiceHistoryListParams) =>
      [
        ...accountBillingKeys.invoiceHistory.all(),
        params.customerCompanyPicker,
        String(params.selectedCompanyId),
        params.search,
        params.dateFrom,
        params.dateTo,
        params.statusFilter,
        params.paymentStatusFilter,
      ] as const,
  },
};
/** Tickets module (`src/pages/tickets/*`). */
export const ticketsKeys = {
  root: ["tickets"] as const,

  /** `DashboardData(filters)` — `/tickets` summary + module charts. */
  dashboard: {
    all: () => [...ticketsKeys.root, "dashboard"] as const,
    byFilters: (filtersKey: string) =>
      [...ticketsKeys.dashboard.all(), filtersKey] as const,
  },

  statuses: {
    all: () => [...ticketsKeys.root, "statuses"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(ticketsKeys.statuses.all(), params),
  },

  /** `GetHierarchyData(ModuleSlug.TICKET)` — extension pickers for ticket modules. */
  hierarchyExtensions: () => [...ticketsKeys.root, "hierarchyExtensions"] as const,

  /** `GetAllModules()` — dropdowns (categories / sub-categories). */
  modulesAll: () => [...ticketsKeys.root, "modulesAll"] as const,

  modules: {
    all: () => [...ticketsKeys.root, "ticketModules"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(ticketsKeys.modules.all(), params),
    /** Submodules under one ticket module (list modal). */
    submodulesByModule: (moduleId: string | number) =>
      [...ticketsKeys.modules.all(), "submodules", String(moduleId)] as const,
  },

  types: {
    all: () => [...ticketsKeys.root, "ticketTypes"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(ticketsKeys.types.all(), params),
  },

  /** `ListSubmodules` — ticket module categories (submodules) tab. */
  submodulesList: {
    all: () => [...ticketsKeys.root, "submodulesList"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...ticketsKeys.submodulesList.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },

  /** `ListSubmoduleChildren` — ticket sub-categories tab. */
  submoduleChildrenList: {
    all: () => [...ticketsKeys.root, "submoduleChildrenList"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...ticketsKeys.submoduleChildrenList.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },
};

/** FAQs / Help Center admin (`src/pages/faqs/*`). */
export const faqsKeys = {
  root: ["faqs"] as const,

  modules: {
    all: () => [...faqsKeys.root, "modules"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(faqsKeys.modules.all(), params),
    /** `getAllFAQModules` — topic form dropdown. */
    picker: () => [...faqsKeys.modules.all(), "picker"] as const,
  },

  topics: {
    all: () => [...faqsKeys.root, "topics"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(faqsKeys.topics.all(), params),
    /** `getAllFAQTopics` — item forms + types filter. */
    allTopics: () => [...faqsKeys.topics.all(), "all"] as const,
  },

  items: {
    all: () => [...faqsKeys.root, "items"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(faqsKeys.items.all(), params),
  },

  /** Distinct FAQ item type strings (`getFAQTypes`). */
  itemTypes: {
    all: () => [...faqsKeys.root, "itemTypes"] as const,
    byTopic: (topicId: number | null) =>
      [...faqsKeys.itemTypes.all(), topicId ?? "all"] as const,
  },
};

/** AI Chat / tools admin (`src/pages/chat/*`). */
export const chatKeys = {
  root: ["chat"] as const,

  tools: {
    all: () => [...chatKeys.root, "tools"] as const,
    list: () => [...chatKeys.tools.all(), "list"] as const,
  },

  companies: {
    all: () => [...chatKeys.root, "companies"] as const,
  },

  /** AI Chat FAQs — client-side paginated lists (`getGlobalFAQs` / `getTenantFAQs`). */
  aiFaqs: {
    global: {
      all: () => [...chatKeys.root, "aiFaqs", "global"] as const,
      list: (params: { page: number; perPage: number; search: string }) =>
        [
          ...chatKeys.aiFaqs.global.all(),
          "list",
          params.page,
          params.perPage,
          params.search,
        ] as const,
    },
    tenant: {
      all: () => [...chatKeys.root, "aiFaqs", "tenant"] as const,
      list: (params: {
        tenantId: string;
        page: number;
        perPage: number;
        search: string;
      }) =>
        [
          ...chatKeys.aiFaqs.tenant.all(),
          "list",
          params.tenantId,
          params.page,
          params.perPage,
          params.search,
        ] as const,
    },
  },

  /** Tools executor config (`getToolsExecutor`). */
  toolsExecutor: () => [...chatKeys.tools.all(), "executor"] as const,

  /** Chat bot training (`postChatTraining`, `getChatTrainingStatus`). */
  training: {
    all: () => [...chatKeys.root, "training"] as const,
    status: (tenantId: string) =>
      [...chatKeys.training.all(), "status", tenantId] as const,
    submit: (tenantId: string) =>
      [...chatKeys.training.all(), "submit", tenantId] as const,
  },

  /** Tenant analytics dashboard (`GET /chat/tenant/dashboard`). */
  tenantDashboard: {
    all: () => [...chatKeys.root, "tenantDashboard"] as const,
    detail: (tenantId: string) =>
      [...chatKeys.tenantDashboard.all(), tenantId || "__current__"] as const,
  },

  /** Admin analytics dashboard (`GET /chat/admin/dashboard`). */
  adminDashboard: {
    all: () => [...chatKeys.root, "adminDashboard"] as const,
    detail: () => [...chatKeys.adminDashboard.all(), "detail"] as const,
  },

  /** Tenant chat settings (`GET /chat/tenant/settings`). */
  tenantSettings: {
    all: () => [...chatKeys.root, "tenantSettings"] as const,
    detail: (tenantId: string) =>
      [...chatKeys.tenantSettings.all(), tenantId || "__current__"] as const,
  },

  /** AI assistant popup thread (`GET/POST /chat/`). */
  assistant: {
    all: () => [...chatKeys.root, "assistant"] as const,
    thread: (threadId: string) =>
      [...chatKeys.assistant.all(), "thread", threadId] as const,
  },
};

/** AI Analysis cost & analytics (`/ai-analytics/*`). */
export const aiAnalyticsKeys = {
  root: ["aiAnalytics"] as const,
  costPricing: {
    all: () => [...aiAnalyticsKeys.root, "costPricing"] as const,
    detail: (tenantId: string) =>
      [...aiAnalyticsKeys.costPricing.all(), tenantId || "__none__"] as const,
  },
  tenants: {
    all: () => [...aiAnalyticsKeys.root, "tenants"] as const,
    detail: (tenantId: string) =>
      [...aiAnalyticsKeys.tenants.all(), tenantId || "__none__"] as const,
  },
  costMonthly: {
    all: () => [...aiAnalyticsKeys.root, "costMonthly"] as const,
    list: (filters: {
      tenant_id?: string;
      year?: number;
      month?: number;
    }) =>
      [
        ...aiAnalyticsKeys.costMonthly.all(),
        filters.tenant_id ?? "",
        filters.year ?? "",
        filters.month ?? "",
      ] as const,
  },
  costCalls: {
    all: () => [...aiAnalyticsKeys.root, "costCalls"] as const,
    list: (filters: {
      tenant_id?: string;
      date_from?: string;
      date_to?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }) =>
      [
        ...aiAnalyticsKeys.costCalls.all(),
        filters.tenant_id ?? "",
        filters.date_from ?? "",
        filters.date_to ?? "",
        filters.status ?? "",
        filters.limit ?? 100,
        filters.offset ?? 0,
      ] as const,
  },
};

/** GSM / Telco gateway (`src/pages/gsm/*`). */
export const gsmKeys = {
  root: ["gsm"] as const,
  sync: {
    all: () => [...gsmKeys.root, "sync"] as const,
    gsmSelectOptions: () => [...gsmKeys.sync.all(), "gsmSelectOptions"] as const,
  },
};

/** CRM app pages: business types, activity history, campaigns list/bootstrap, company-by-id, etc. */
export const crmAppKeys = {
  root: ["crmApp"] as const,

  hierarchyExtensions: {
    all: () => [...crmAppKeys.root, "hierarchyExtensions"] as const,
    /** `GetHierarchyData` — pass stable module slug string (e.g. `ModuleSlug.CRM_HISTORY`). */
    module: (moduleSlug: string) =>
      [...crmAppKeys.hierarchyExtensions.all(), moduleSlug] as const,
  },

  /** CRM main dashboard (`src/pages/crm/dashboard` — dashboard payload + recent prospects). */
  crmDashboard: {
    all: () => [...crmAppKeys.root, "crmDashboard"] as const,
    home: () => [...crmAppKeys.crmDashboard.all(), "home"] as const,
  },

  activityHistory: {
    all: () => [...crmAppKeys.root, "activityHistory"] as const,
    list: (params: {
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
      search: string;
      typeTab: string;
      agentsKey: string;
      dateFrom: string;
      dateTo: string;
      extensionsStamp: string;
    }) =>
      [
        ...crmAppKeys.activityHistory.all(),
        "list",
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
        params.search,
        params.typeTab,
        params.agentsKey,
        params.dateFrom,
        params.dateTo,
        params.extensionsStamp,
      ] as const,
    recordDetail: (params: { recordType: string; recordId: string; open: boolean }) =>
      [
        ...crmAppKeys.activityHistory.all(),
        "recordDetail",
        params.recordType,
        params.recordId,
        params.open,
      ] as const,
  },

  businessTypes: {
    all: () => [...crmAppKeys.root, "businessTypes"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(crmAppKeys.businessTypes.all(), params),
    /** Unpaginated picklist for filters and deal forms (`getBusinessTypes` large `per_page`). */
    selectOptions: () => [...crmAppKeys.businessTypes.all(), "selectOptions"] as const,
  },

  companies: {
    all: () => [...crmAppKeys.root, "companies"] as const,
    byId: (id: number) => [...crmAppKeys.companies.all(), "byId", id] as const,
  },

  /** Companies list grid (`/crm/companies` on `src/pages/crm/companies`). */
  companiesPage: {
    all: () => [...crmAppKeys.root, "companiesPage"] as const,
    list: (params: {
      filtersKey: string;
      activeTab: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
    }) =>
      [
        ...crmAppKeys.companiesPage.all(),
        "list",
        params.filtersKey,
        params.activeTab,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
      ] as const,
  },

  leads: {
    all: () => [...crmAppKeys.root, "leads"] as const,
    byId: (id: number) => [...crmAppKeys.leads.all(), "byId", id] as const,
  },

  /** CRM leads list (`useCrmLeadsPageModel` / `src/pages/crm/leads`). */
  leadsPage: {
    all: () => [...crmAppKeys.root, "leadsPage"] as const,
    list: (params: {
      filtersKey: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
    }) =>
      [
        ...crmAppKeys.leadsPage.all(),
        "list",
        params.filtersKey,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
      ] as const,
    tabTotals: (requestKey: string) =>
      [...crmAppKeys.leadsPage.all(), "tabTotals", requestKey] as const,
  },

  /** Lead / opportunity create form (`src/pages/crm/leads/create`). */
  leadCreateForm: {
    all: () => [...crmAppKeys.root, "leadCreateForm"] as const,
    hierarchy: (moduleSlug: string) =>
      [...crmAppKeys.leadCreateForm.all(), "hierarchy", moduleSlug] as const,
    activeCampaignsPicklist: () =>
      [...crmAppKeys.leadCreateForm.all(), "activeCampaignsPicklist"] as const,
    crmDataPicklist100: () =>
      [...crmAppKeys.leadCreateForm.all(), "crmDataPicklist100"] as const,
    industriesPicklist1000: () =>
      [...crmAppKeys.leadCreateForm.all(), "industriesPicklist1000"] as const,
    crmRecordById: (id: number) =>
      [...crmAppKeys.leadCreateForm.all(), "crmRecordById", id] as const,
  },

  deals: {
    all: () => [...crmAppKeys.root, "deals"] as const,
    byId: (id: number) => [...crmAppKeys.deals.all(), "byId", id] as const,
  },

  /** CRM deals / approvals list (`getDeals` on `CrmDealsListScreen`). */
  dealsPage: {
    all: () => [...crmAppKeys.root, "dealsPage"] as const,
    list: (params: {
      filtersKey: string;
      activeTab: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
      approvalsVariant: boolean;
    }) =>
      [
        ...crmAppKeys.dealsPage.all(),
        "list",
        params.filtersKey,
        params.activeTab,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
        params.approvalsVariant ? "approvals" : "deals",
      ] as const,
  },

  /** CRM quotes list dummy/real list (`CrmQuotesListPage`). */
  crmQuotesListPage: {
    all: () => [...crmAppKeys.root, "crmQuotesListPage"] as const,
    list: (params: {
      variant: "billing" | "crm";
      filtersKey: string;
      activeTab: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
      refreshKey: number;
    }) =>
      [
        ...crmAppKeys.crmQuotesListPage.all(),
        "list",
        params.variant,
        params.filtersKey,
        params.activeTab,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
        params.refreshKey,
      ] as const,
  },

  /**
   * CRM prospects/contacts data-management list (`getCrmData` via
   * `useCrmListDataOperations`).
   */
  crmDataManagementList: {
    all: () => [...crmAppKeys.root, "crmDataManagementList"] as const,
    entityRoot: (entity: string) =>
      [...crmAppKeys.crmDataManagementList.all(), entity] as const,
    list: (params: {
      entity: string;
      filtersKey: string;
      activeTab: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
      refreshKey: number;
    }) =>
      [
        ...crmAppKeys.crmDataManagementList.entityRoot(params.entity),
        "list",
        params.filtersKey,
        params.activeTab,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
        params.refreshKey,
      ] as const,
  },

  /** CRM WhatsApp inbox (`src/pages/crm/inbox`) — chat directory. */
  crmWhatsAppInbox: {
    all: () => [...crmAppKeys.root, "crmWhatsAppInbox"] as const,
    chats: () => [...crmAppKeys.crmWhatsAppInbox.all(), "chats"] as const,
  },

  campaigns: {
    all: () => [...crmAppKeys.root, "campaigns"] as const,
    list: (params: {
      refreshKey: number;
      page: number;
      perPage: number;
      search: string;
      activeFilter: string;
      filtersKey: string;
      campaignFiltersKey: string;
    }) =>
      [
        ...crmAppKeys.campaigns.all(),
        "list",
        params.refreshKey,
        params.page,
        params.perPage,
        params.search,
        params.activeFilter,
        params.filtersKey,
        params.campaignFiltersKey,
      ] as const,
    tags: (refreshKey: number) =>
      [...crmAppKeys.campaigns.all(), "tags", refreshKey] as const,
    uploadCampaignOptions: (refreshKey: number) =>
      [...crmAppKeys.campaigns.all(), "uploadCampaignOptions", refreshKey] as const,
    industries: () => [...crmAppKeys.campaigns.all(), "industries"] as const,
    dealTemplates: () => [...crmAppKeys.campaigns.all(), "dealTemplates"] as const,
    /** `getCampaignById` — used by deal create/edit when sourcing campaign industries. */
    byCampaignId: (campaignId: number) =>
      [...crmAppKeys.campaigns.all(), "byCampaignId", campaignId] as const,
  },

  /** `getStages` by CRM stage type (`deal`, `lost_reason`, etc.). */
  crmStages: {
    all: () => [...crmAppKeys.root, "crmStages"] as const,
    byType: (type: string) => [...crmAppKeys.crmStages.all(), type] as const,
  },

  /** CRM tasks list (`src/pages/crm/tasks`). */
  tasks: {
    all: () => [...crmAppKeys.root, "tasks"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      activeFilter: string;
      filtersKey: string;
    }) =>
      [
        ...crmAppKeys.tasks.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.activeFilter,
        params.filtersKey,
      ] as const,
    detail: (taskId: number) => [...crmAppKeys.tasks.all(), "detail", taskId] as const,
  },

  /** Deal templates admin page — paginated list (`src/pages/crm/deal-templates`). */
  dealTemplatesPage: {
    all: () => [...crmAppKeys.root, "dealTemplatesPage"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      paginatedListKey(crmAppKeys.dealTemplatesPage.all(), params),
  },

  /** CRM lost reasons list (`getLostReasons`) — `src/pages/crm/lost-reasons`. */
  lostReasons: {
    all: () => [...crmAppKeys.root, "lostReasons"] as const,
    list: () => [...crmAppKeys.lostReasons.all(), "list"] as const,
  },

  /** Industries admin table (`src/pages/crm/industries`, `useIndustriesPage`). */
  industriesPage: {
    all: () => [...crmAppKeys.root, "industriesPage"] as const,
    list: (params: { page: number; perPage: number; search: string }) =>
      [
        ...crmAppKeys.industriesPage.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
      ] as const,
    productsByIndustry: (industryId: number) =>
      [...crmAppKeys.industriesPage.all(), "products", industryId] as const,
  },

  /** CRM products table (`useCrmProductsPage`). */
  crmProductsPage: {
    all: () => [...crmAppKeys.root, "crmProductsPage"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      activeFilter: string;
      industryId: number | null;
      category: string | null;
      brandKey: string;
    }) =>
      [
        ...crmAppKeys.crmProductsPage.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.activeFilter,
        params.industryId ?? "none",
        params.category ?? "none",
        params.brandKey,
      ] as const,
  },

  /** Order create/edit shared picklists (`getStages('order')`, hierarchy, products slice). */
  orderFormBootstrap: {
    all: () => [...crmAppKeys.root, "orderFormBootstrap"] as const,
    stages: () => [...crmAppKeys.orderFormBootstrap.all(), "stages"] as const,
    hierarchy: () => [...crmAppKeys.orderFormBootstrap.all(), "hierarchy"] as const,
    productsPicklist: () =>
      [...crmAppKeys.orderFormBootstrap.all(), "productsPicklist"] as const,
  },

  /** CRM orders main list (`getOrders` on `src/pages/crm/orders`). */
  ordersList: {
    all: () => [...crmAppKeys.root, "ordersList"] as const,
    page: (params: {
      filtersKey: string;
      activeTab: string;
      page: number;
      perPage: number;
      sortBy: string;
      sortOrder: string;
    }) =>
      [
        ...crmAppKeys.ordersList.all(),
        "page",
        params.filtersKey,
        params.activeTab,
        params.page,
        params.perPage,
        params.sortBy,
        params.sortOrder,
      ] as const,
  },

  /** CRM Tasks listing page (`src/pages/crm/crm-tasks`) — mock or real list API. */
  crmTasksListing: {
    all: () => [...crmAppKeys.root, "crmTasksListing"] as const,
    list: (params: Record<string, unknown>) =>
      [...crmAppKeys.crmTasksListing.all(), "list", JSON.stringify(params)] as const,
  },
};

/** Control Hub lists (`src/pages/controlhub/*`). */
export const controlhubKeys = {
  root: ["controlhub"] as const,

  users: {
    all: () => [...controlhubKeys.root, "users"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...controlhubKeys.users.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },

  teams: {
    all: () => [...controlhubKeys.root, "teams"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...controlhubKeys.teams.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },

  groups: {
    all: () => [...controlhubKeys.root, "groups"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...controlhubKeys.groups.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },

  ranks: {
    all: () => [...controlhubKeys.root, "ranks"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      filtersKey: string;
    }) =>
      [
        ...controlhubKeys.ranks.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
      ] as const,
  },
};
