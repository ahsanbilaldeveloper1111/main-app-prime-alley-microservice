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

/** Tickets module (`src/pages/tickets/*`). */
export const ticketsKeys = {
  root: ["tickets"] as const,

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
};

/** GSM / Telco gateway (`src/pages/gsm/*`). */
export const gsmKeys = {
  root: ["gsm"] as const,
  sync: {
    all: () => [...gsmKeys.root, "sync"] as const,
    gsmSelectOptions: () => [...gsmKeys.sync.all(), "gsmSelectOptions"] as const,
  },
};
