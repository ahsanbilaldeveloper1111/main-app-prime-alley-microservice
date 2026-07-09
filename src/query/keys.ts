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

export type CrmFiltersSortPageListParams = {
  filtersKey: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: string;
};

/** CRM list keys with filters + sort columns (`leadsPage`). */
export const crmFiltersSortPageListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmFiltersSortPageListParams,
) =>
  [
    ...base,
    "list",
    params.filtersKey,
    params.page,
    params.perPage,
    params.sortBy,
    params.sortOrder,
  ] as const;

export type CrmSortPageListParams = {
  filtersKey: string;
  activeTab: string;
  page: number;
  perPage: number;
  sortBy: string;
  sortOrder: string;
};

/** CRM list keys with tab + sort columns (`companiesPage`, etc.). */
export const crmSortPageListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmSortPageListParams,
  suffix: readonly unknown[] = [],
) =>
  [
    ...base,
    "list",
    params.filtersKey,
    params.activeTab,
    params.page,
    params.perPage,
    params.sortBy,
    params.sortOrder,
    ...suffix,
  ] as const;

/** CRM orders list (`ordersList.page` — uses `"page"` instead of `"list"`). */
export const crmOrdersListPageKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmSortPageListParams,
) =>
  [
    ...base,
    "page",
    params.filtersKey,
    params.activeTab,
    params.page,
    params.perPage,
    params.sortBy,
    params.sortOrder,
  ] as const;

export type CrmActivityHistoryListParams = {
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
};

export const crmActivityHistoryListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmActivityHistoryListParams,
) =>
  [
    ...base,
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
  ] as const;

export const crmActivityHistoryRecordDetailKey = <Base extends readonly unknown[]>(
  base: Base,
  params: { recordType: string; recordId: string; open: boolean },
) =>
  [
    ...base,
    "recordDetail",
    params.recordType,
    params.recordId,
    params.open,
  ] as const;

export type CrmProductsPageListParams = {
  page: number;
  perPage: number;
  search: string;
  activeFilter: string;
  industryId: number | null;
  category: string | null;
  brandKey: string;
};

const nullishQueryKeySegment = (
  value: string | number | null | undefined,
  fallback: string,
): string => (value == null ? fallback : String(value));

export const crmProductsPageListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmProductsPageListParams,
) =>
  [
    ...base,
    "list",
    params.page,
    params.perPage,
    params.search,
    params.activeFilter,
    nullishQueryKeySegment(params.industryId, "none"),
    nullishQueryKeySegment(params.category, "none"),
    params.brandKey,
  ] as const;

export type CrmCampaignsListParams = {
  refreshKey: number;
  page: number;
  perPage: number;
  search: string;
  activeFilter: string;
  filtersKey: string;
  campaignFiltersKey: string;
};

export const crmCampaignsListKey = <Base extends readonly unknown[]>(
  base: Base,
  params: CrmCampaignsListParams,
) =>
  [
    ...base,
    "list",
    params.refreshKey,
    params.page,
    params.perPage,
    params.search,
    params.activeFilter,
    params.filtersKey,
    params.campaignFiltersKey,
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

  messagingSenders: {
    all: () => [...communicationsKeys.root, "messagingSenders"] as const,
    emailSenders: () =>
      [...communicationsKeys.messagingSenders.all(), "emailSenders"] as const,
    sendGridConfig: () =>
      [...communicationsKeys.messagingSenders.all(), "sendGridConfig"] as const,
    whatsAppSenders: () =>
      [...communicationsKeys.messagingSenders.all(), "whatsAppSenders"] as const,
    twilioConfig: () =>
      [...communicationsKeys.messagingSenders.all(), "twilioConfig"] as const,
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

  reports: {
    all: () => [...plannerKeys.root, "reports"] as const,
    overview: (params: {
      tenant: string;
      start: string;
      end: string;
      project: string;
      member: string;
      staleDays: number;
    }) =>
      [
        ...plannerKeys.reports.all(),
        "overview",
        params.tenant,
        params.start,
        params.end,
        params.project,
        params.member,
        params.staleDays,
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
    my: () => [...workforceKeys.attendance.all(), "my"] as const,
    /* Late adjustment query key (disabled)
    lateAdjustment: (params: { tenantId: string; status: string; userId: string }) =>
      [
        ...workforceKeys.attendance.all(),
        "lateAdjustment",
        params.tenantId,
        params.status,
        params.userId,
      ] as const,
    */
    settings: (tenantId: string) =>
      [...workforceKeys.attendance.all(), "settings", tenantId] as const,
    dailyReport: (params: {
      tenantId: string;
      date: string;
      departmentId: string;
      extensionsKey: string;
    }) =>
      [
        ...workforceKeys.attendance.all(),
        "reports",
        "daily",
        params.tenantId,
        params.date,
        params.departmentId,
        params.extensionsKey,
      ] as const,
    dailyReportExtensions: (params: {
      companyIdentifier: string;
      departmentId: string;
    }) =>
      [
        ...workforceKeys.attendance.all(),
        "reports",
        "daily",
        "extensions",
        params.companyIdentifier,
        params.departmentId,
      ] as const,
    monthlyReport: (params: {
      tenantId: string;
      month: string;
      departmentId: string;
    }) =>
      [
        ...workforceKeys.attendance.all(),
        "reports",
        "monthly",
        params.tenantId,
        params.month,
        params.departmentId,
      ] as const,
    employeeReport: (params: { tenantId: string; userId: string; month: string }) =>
      [
        ...workforceKeys.attendance.all(),
        "reports",
        "employee",
        params.tenantId,
        params.userId,
        params.month,
      ] as const,
    teamSnapshot: (params: {
      tenantId: string;
      date: string;
      departmentId: string;
      extensionsKey: string;
      status: string;
      search: string;
      managerId: string;
    }) =>
      [
        ...workforceKeys.attendance.all(),
        "team",
        "snapshot",
        params.tenantId,
        params.date,
        params.departmentId,
        params.extensionsKey,
        params.status,
        params.search,
        params.managerId,
      ] as const,
  },

  /** Shift definitions (`main-settings/policies-attendance/shift-management`). */
  shifts: {
    all: () => [...workforceKeys.root, "shifts"] as const,
    list: (params: {
      tenantId: string;
      status: string;
      type: string;
      page: number;
      limit: number;
    }) =>
      [
        ...workforceKeys.shifts.all(),
        "list",
        params.tenantId,
        params.status,
        params.type,
        params.page,
        params.limit,
      ] as const,
    assignments: (params: { tenantId: string; page: number; limit: number }) =>
      [
        ...workforceKeys.shifts.all(),
        "assignments",
        params.tenantId,
        params.page,
        params.limit,
      ] as const,
  },

  /** Company work-hours policy (`main-settings/policies-attendance/company-config`). */
  attendancePolicies: {
    all: () => [...workforceKeys.root, "attendancePolicies"] as const,
    workHours: (params: { tenantId: string; page: number; limit: number }) =>
      [
        ...workforceKeys.attendancePolicies.all(),
        "workHours",
        params.tenantId,
        params.page,
        params.limit,
      ] as const,
    gracePeriod: (tenantId: string) =>
      [...workforceKeys.attendancePolicies.all(), "gracePeriod", tenantId] as const,
    breakTypes: (tenantId: string) =>
      [...workforceKeys.attendancePolicies.all(), "breakTypes", tenantId] as const,
    breaks: (params: { tenantId: string; page: number; limit: number }) =>
      [
        ...workforceKeys.attendancePolicies.all(),
        "breaks",
        params.tenantId,
        params.page,
        params.limit,
      ] as const,
    overtime: (params: { tenantId: string; page: number; limit: number }) =>
      [
        ...workforceKeys.attendancePolicies.all(),
        "overtime",
        params.tenantId,
        params.page,
        params.limit,
      ] as const,
  },

  /** Holiday calendars (`main-settings/policies-attendance/holiday-management`). */
  holidayCalendars: {
    all: () => [...workforceKeys.root, "holidayCalendars"] as const,
    list: (params: {
      tenantId: string;
      year: string;
      status: string;
      limit: number;
    }) =>
      [
        ...workforceKeys.holidayCalendars.all(),
        "list",
        params.tenantId,
        params.year,
        params.status,
        params.limit,
      ] as const,
    holidays: (calendarId: number) =>
      [...workforceKeys.holidayCalendars.all(), "holidays", calendarId] as const,
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

/** FAQs / Help Center admin (`/main-settings/help-center/*`). */
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

  /** Tenant user budgets & usage (`GET /chat/tenant/users`). */
  tenantUsers: {
    all: () => [...chatKeys.root, "tenantUsers"] as const,
    detail: (tenantId: string) =>
      [...chatKeys.tenantUsers.all(), tenantId || "__current__"] as const,
  },

  /** Admin analytics dashboard (`GET /chat/admin/dashboard`). */
  adminDashboard: {
    all: () => [...chatKeys.root, "adminDashboard"] as const,
    detail: () => [...chatKeys.adminDashboard.all(), "detail"] as const,
  },

  /** Admin user budgets across tenants (`GET /chat/admin/users`). */
  adminUsers: {
    all: () => [...chatKeys.root, "adminUsers"] as const,
    list: () => [...chatKeys.adminUsers.all(), "list"] as const,
  },

  /** Admin pricing history (`GET /chat/admin/pricing-history`). */
  adminPricingHistory: {
    all: () => [...chatKeys.root, "adminPricingHistory"] as const,
    list: (filters: {
      tenant_id?: string;
      from?: string;
      to?: string;
      field?: string;
      limit?: number;
    }) => [...chatKeys.adminPricingHistory.all(), "list", filters] as const,
  },

  /** Admin chat audit log (`GET /chat/admin/audit-log/`). */
  adminAuditLog: {
    all: () => [...chatKeys.root, "adminAuditLog"] as const,
    list: (filters: {
      tenant_id?: string;
      event?: string;
      from?: string;
      to?: string;
      q?: string;
      limit?: number;
    }) => [...chatKeys.adminAuditLog.all(), "list", filters] as const,
  },

  /** Tenant chat settings (`GET /chat/tenant/settings`). */
  tenantSettings: {
    all: () => [...chatKeys.root, "tenantSettings"] as const,
    detail: (tenantId: string) =>
      [...chatKeys.tenantSettings.all(), tenantId || "__current__"] as const,
    history: (tenantId: string, filters: { from?: string; to?: string; limit?: number }) =>
      [
        ...chatKeys.tenantSettings.all(),
        "history",
        tenantId || "__current__",
        filters,
      ] as const,
  },

  /** AI assistant popup thread (`GET/POST /chat/`). */
  assistant: {
    all: () => [...chatKeys.root, "assistant"] as const,
    conversations: () => [...chatKeys.assistant.all(), "conversations"] as const,
    thread: (threadId: string) =>
      [...chatKeys.assistant.all(), "thread", threadId] as const,
    rateLimit: () => [...chatKeys.assistant.all(), "rateLimit"] as const,
    userBudget: (tenantId: string, userId: string) =>
      [
        ...chatKeys.assistant.all(),
        "userBudget",
        tenantId || "__none__",
        userId || "__none__",
      ] as const,
  },
};

/** AI Analysis cost & analytics (`/ai-analytics/*`). */
export const aiAnalyticsKeys = {
  root: ["aiAnalytics"] as const,
  costPricing: {
    all: () => [...aiAnalyticsKeys.root, "costPricing"] as const,
    detail: () => [...aiAnalyticsKeys.costPricing.all(), "detail"] as const,
  },
  tenants: {
    all: () => [...aiAnalyticsKeys.root, "tenants"] as const,
    detail: (tenantId: string) =>
      [...aiAnalyticsKeys.tenants.all(), tenantId || "__none__"] as const,
  },
  companyConfig: {
    all: () => [...aiAnalyticsKeys.root, "companyConfig"] as const,
    detail: (companyId: string) =>
      [...aiAnalyticsKeys.companyConfig.all(), companyId || "__none__"] as const,
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
        filters.limit ?? 15,
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
    list: (params: CrmActivityHistoryListParams) =>
      crmActivityHistoryListKey(crmAppKeys.activityHistory.all(), params),
    recordDetail: (params: { recordType: string; recordId: string; open: boolean }) =>
      crmActivityHistoryRecordDetailKey(crmAppKeys.activityHistory.all(), params),
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
    list: (params: CrmSortPageListParams) =>
      crmSortPageListKey(crmAppKeys.companiesPage.all(), params),
  },

  leads: {
    all: () => [...crmAppKeys.root, "leads"] as const,
    byId: (id: number) => [...crmAppKeys.leads.all(), "byId", id] as const,
  },

  /** CRM leads list (`useCrmLeadsPageModel` / `src/pages/crm/leads`). */
  leadsPage: {
    all: () => [...crmAppKeys.root, "leadsPage"] as const,
    list: (params: CrmFiltersSortPageListParams) =>
      crmFiltersSortPageListKey(crmAppKeys.leadsPage.all(), params),
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
    list: (params: CrmSortPageListParams & { approvalsVariant: boolean }) =>
      crmSortPageListKey(crmAppKeys.dealsPage.all(), params, [
        params.approvalsVariant ? "approvals" : "deals",
      ]),
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
    list: (params: CrmCampaignsListParams) =>
      crmCampaignsListKey(crmAppKeys.campaigns.all(), params),
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
      paginatedListKey(crmAppKeys.industriesPage.all(), params),
    productsByIndustry: (industryId: number) =>
      [...crmAppKeys.industriesPage.all(), "products", industryId] as const,
  },

  /** CRM products table (`useCrmProductsPage`). */
  crmProductsPage: {
    all: () => [...crmAppKeys.root, "crmProductsPage"] as const,
    list: (params: CrmProductsPageListParams) =>
      crmProductsPageListKey(crmAppKeys.crmProductsPage.all(), params),
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
    page: (params: CrmSortPageListParams) =>
      crmOrdersListPageKey(crmAppKeys.ordersList.all(), params),
  },

  /** CRM Tasks listing page (`src/pages/crm/crm-tasks`) — mock or real list API. */
  crmTasksListing: {
    all: () => [...crmAppKeys.root, "crmTasksListing"] as const,
    list: (params: Record<string, unknown>) =>
      [...crmAppKeys.crmTasksListing.all(), "list", JSON.stringify(params)] as const,
  },

  /** CRM tickets list (`src/pages/crm/tickets`) — `/tickets/list`. */
  crmTicketsPage: {
    all: () => [...crmAppKeys.root, "crmTicketsPage"] as const,
    list: (params: {
      search: string;
      filtersKey: string;
      page: number;
      perPage: number;
      activeTab: string;
    }) =>
      [
        ...crmAppKeys.crmTicketsPage.all(),
        "list",
        params.search,
        params.filtersKey,
        params.page,
        params.perPage,
        params.activeTab,
      ] as const,
    dashboard: (filtersKey: string) =>
      [...crmAppKeys.crmTicketsPage.all(), "dashboard", filtersKey] as const,
    detail: (ticketId: string) =>
      [...crmAppKeys.crmTicketsPage.all(), "detail", ticketId] as const,
    hierarchyExtensions: () =>
      [...crmAppKeys.crmTicketsPage.all(), "hierarchyExtensions"] as const,
    statuses: () => [...crmAppKeys.crmTicketsPage.all(), "statuses"] as const,
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
    /** Full user directory (`POST users/list` paginated), Main Settings → Users & Teams. */
    directoryAll: (tenantScope: string) =>
      [...controlhubKeys.users.all(), "directoryAll", tenantScope] as const,
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

/**
 * CTI (Computer Telephony Integration) query keys.
 *
 * Used by TanStack Query mutation hooks to invalidate / optimistically update
 * call state after REST commands.
 *
 * Live call state itself lives in CtiContext (SSE-driven), not in the Query
 * cache.  These keys are used for:
 *   - REST command mutations (dial, end, hold, resume, attend, transfer, monitor)
 *   - Reconciliation reads (ongoing calls, call legs)
 */
export const notificationSettingsKeys = {
  root: ["notificationSettings"] as const,

  global: {
    all: () => [...notificationSettingsKeys.root, "global"] as const,
    resolved: (userExtension: string) =>
      [...notificationSettingsKeys.global.all(), "resolved", userExtension] as const,
  },

  smartCrm: {
    all: () => [...notificationSettingsKeys.root, "smartCrm"] as const,
    resolved: (userExtension: string) =>
      [...notificationSettingsKeys.smartCrm.all(), "resolved", userExtension] as const,
  },
};

export const ctiKeys = {
  root: ["cti"] as const,

  /** Active calls snapshot from GET/ongoing-calls — used for reconciliation. */
  ongoingCalls: (userDn: string) =>
    [...ctiKeys.root, "ongoingCalls", userDn] as const,

  /** Individual call leg detail. */
  callLegs: (callId: string) =>
    [...ctiKeys.root, "callLegs", callId] as const,

  /** Dial command result (optimistic) — keyed by a client-side pending id. */
  dialResult: (pendingId: string) =>
    [...ctiKeys.root, "dialResult", pendingId] as const,
};
