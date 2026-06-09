import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { ModuleSlug } from "@utils/Helper";
import { listProjects } from "@utils/tasks";
import {
  buildTaskReportsQuery,
  downloadTaskReportsExport,
  getTaskReportsOverview,
} from "@utils/taskReports";
import { plannerKeys } from "../../../query/keys";
import { normalizedStatusesFromListResponse } from "@components/planner/plannerStatuses/plannerStatusesDomain";
import {
  buildPlannerStatusNamesMap,
  formatReportsPeriodLabel,
  formatTruncatedReportListLabels,
  getPlannerTenantId,
  getReportsDateRangeForPreset,
  hasTruncatedReportLists,
  normalizeReportsOverview,
  resolveSummaryMetric,
  type ReportsDatePreset,
  type ReportsNormalizeContext,
  type ReportsProjectFilter,
} from "@page-modules/planner/reports/reportsDomain";
import { listStatuses } from "@utils/work-planner";
import {
  buildOverdueByProjectEntries,
  buildOverdueByProjectRows,
  buildProjectReportRows,
  buildProjectReportSummary,
  buildTasksByProjectSegments,
  mergeReportsProjectFilterOptions,
  normalizePlannerProjectList,
  REPORTS_ORGANIZATIONAL_PROJECT_ID,
  resolveProjectViewKpiSubtexts,
  type ReportsMainView,
  type ReportsTeamSubView,
} from "@page-modules/planner/reports/projectReportsDomain";
import {
  buildCompletionRateChartPoints,
  buildHistoricalWeeksChartSubtitle,
  buildOverdueTrendChartPoints,
  buildHistoricalMemberTrendRows,
  extractMemberTrendWeekHeaders,
  buildHistoricalPeriodSubtitle,
  type HistoricalTaskFilter,
} from "@page-modules/planner/reports/historicalReportsDomain";
import { resolveTeamMemberRows } from "@page-modules/planner/reports/teamReportsDomain";
import {
  buildLiveDashboardKpis,
  buildLiveInProgressTaskRows,
  buildLiveMemberRows,
  buildLiveOverdueTaskRows,
  buildLiveStaleTaskRows,
  resolveLiveTopAssigneeSource,
} from "@page-modules/planner/reports/teamLiveViewDomain";

export function reportsErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Failed to load reports.";
}

function filterProjectReportRows<T extends { id: number }>(
  rows: T[],
  projectFilter: ReportsProjectFilter,
): T[] {
  if (projectFilter === "all") return rows;
  if (projectFilter === REPORTS_ORGANIZATIONAL_PROJECT_ID) {
    return rows.filter((row) => row.id === REPORTS_ORGANIZATIONAL_PROJECT_ID);
  }
  return rows.filter((row) => row.id === projectFilter);
}

function collectMemberExtensions(
  hierarchyDataExtensions: unknown,
  extension: string | undefined,
): string[] {
  const fromHierarchy = Array.isArray(hierarchyDataExtensions)
    ? hierarchyDataExtensions
        .map((row) => {
          const r = row as { extension_number?: string; extension?: string; id?: string };
          const ext = String(r.extension_number ?? r.extension ?? r.id ?? "").trim();
          return ext || null;
        })
        .filter((ext): ext is string => Boolean(ext))
    : [];
  if (fromHierarchy.length > 0) return [...new Set(fromHierarchy)];
  return extension ? [extension] : [];
}

export function useWorkloadReportsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = getPlannerTenantId(session);
  const extension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const { hierarchyDataExtensions, hierarchyDataUsers } = useHierarchyData(
    ModuleSlug.WORK_PLANNER,
  );

  const [datePreset, setDatePreset] = useState<ReportsDatePreset>("last_7");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [projectFilter, setProjectFilter] = useState<ReportsProjectFilter>("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [staleDays, setStaleDays] = useState(3);
  const [mainView, setMainView] = useState<ReportsMainView>("team");
  const [teamSubView, setTeamSubView] = useState<ReportsTeamSubView>("live");
  const [historicalTaskFilter, setHistoricalTaskFilter] =
    useState<HistoricalTaskFilter>("all");
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const dateRangeResult = useMemo(
    () => getReportsDateRangeForPreset(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd],
  );
  const dateRange = useMemo(
    () => ({ start: dateRangeResult.start, end: dateRangeResult.end }),
    [dateRangeResult.end, dateRangeResult.start],
  );

  useEffect(() => {
    if (datePreset !== "custom" || (customStart && customEnd)) return;
    setCustomStart(dateRange.start);
    setCustomEnd(dateRange.end);
  }, [datePreset, customStart, customEnd, dateRange.start, dateRange.end]);

  const projectFilterKey =
    projectFilter === "all" ? "all" : String(projectFilter);

  const reportQuery = useMemo(() => {
    if (!tenantId) return null;
    return buildTaskReportsQuery({
      tenant_id: tenantId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      in_progress_stale_days: staleDays,
      project_id:
        projectFilter === "all" || projectFilter === REPORTS_ORGANIZATIONAL_PROJECT_ID
          ? undefined
          : projectFilter,
      extension_number: memberFilter === "all" ? undefined : memberFilter,
    });
  }, [tenantId, dateRange.start, dateRange.end, projectFilter, memberFilter, staleDays]);

  const queryKey = useMemo(
    () => ({
      tenant: tenantId,
      start: dateRange.start,
      end: dateRange.end,
      project: projectFilterKey,
      member: memberFilter,
      staleDays,
    }),
    [tenantId, dateRange.start, dateRange.end, projectFilterKey, memberFilter, staleDays],
  );

  const enabled = Boolean(reportQuery);
  const tenantMissing = sessionStatus === "authenticated" && !tenantId;

  const reportNormalizeContext = useMemo((): ReportsNormalizeContext => {
    return {
      memberFilter,
      sessionExtension: extension,
      hierarchyExtensions: hierarchyDataExtensions,
      hierarchyUsers: hierarchyDataUsers,
    };
  }, [memberFilter, extension, hierarchyDataExtensions, hierarchyDataUsers]);

  const statusesQuery = useQuery({
    queryKey: [...plannerKeys.root, "reports", "statuses"],
    queryFn: async () => normalizedStatusesFromListResponse(await listStatuses()),
    enabled,
  });

  const overviewQuery = useQuery({
    queryKey: plannerKeys.reports.overview(queryKey),
    queryFn: async () => {
      if (!reportQuery) throw new Error("Missing tenant");
      return getTaskReportsOverview(reportQuery);
    },
    enabled,
  });

  const reportData = useMemo(() => {
    if (!overviewQuery.data) return undefined;
    return normalizeReportsOverview(overviewQuery.data, {
      ...reportNormalizeContext,
      statusNamesById: buildPlannerStatusNamesMap(statusesQuery.data),
    });
  }, [overviewQuery.data, statusesQuery.data, reportNormalizeContext]);

  const loadingOverview =
    sessionStatus === "loading" || (enabled && overviewQuery.isLoading);

  const projectsQuery = useQuery({
    queryKey: [...plannerKeys.root, "reports", "projects"],
    queryFn: async () => {
      const res = await listProjects({ page: 1, limit: 200 });
      return normalizePlannerProjectList(res);
    },
    enabled,
    staleTime: 120_000,
  });

  const projectFilterOptions = useMemo(() => {
    const fromList = projectsQuery.data?.projects ?? [];
    const fromBreakdown = reportData?.project_breakdown ?? [];
    return mergeReportsProjectFilterOptions(fromList, fromBreakdown);
  }, [projectsQuery.data?.projects, reportData?.project_breakdown]);

  const memberExtensions = useMemo(
    () => collectMemberExtensions(hierarchyDataExtensions, extension),
    [hierarchyDataExtensions, extension],
  );

  const handleExport = useCallback(
    async (format: "csv" | "xlsx") => {
      if (!reportQuery) {
        toast.error("Tenant is required to export reports.");
        return;
      }
      setExporting(format);
      try {
        const exportQuery = buildTaskReportsQuery({
          tenant_id: reportQuery.tenant_id,
          start_date: reportQuery.start_date,
          end_date: reportQuery.end_date,
          in_progress_stale_days: reportQuery.in_progress_stale_days,
          project_id: reportQuery.project_id,
          extension_number: reportQuery.extension_number,
          extension_numbers: reportQuery.extension_numbers,
          forExport: true,
        });
        await downloadTaskReportsExport(exportQuery, format);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } catch (err) {
        toast.error(reportsErrorMessage(err));
      } finally {
        setExporting(null);
      }
    },
    [reportQuery],
  );

  const handleRefetchOverview = useCallback(() => {
    overviewQuery.refetch().catch((err) => {
      toast.error(reportsErrorMessage(err));
    });
  }, [overviewQuery]);

  const data = reportData;
  const periodLabel = formatReportsPeriodLabel(dateRange.start, dateRange.end);

  const truncatedListLabels = useMemo(
    () => formatTruncatedReportListLabels(data?.list_limits),
    [data?.list_limits],
  );
  const showTruncatedNotice = hasTruncatedReportLists(data?.list_limits);

  const projectReportRows = useMemo(
    () => filterProjectReportRows(buildProjectReportRows(projectFilterOptions, data), projectFilter),
    [projectFilterOptions, data, projectFilter],
  );

  const projectReportSummary = useMemo(
    () =>
      buildProjectReportSummary(
        projectFilterOptions,
        projectReportRows,
        projectsQuery.data?.summary,
        data?.project_breakdown,
        data ? resolveSummaryMetric(data.summary, "overdue_tasks") : undefined,
      ),
    [
      projectFilterOptions,
      projectReportRows,
      projectsQuery.data?.summary,
      data?.project_breakdown,
      data?.summary,
    ],
  );

  const projectKpiSubtexts = useMemo(
    () => resolveProjectViewKpiSubtexts(datePreset),
    [datePreset],
  );

  const overdueByProjectEntries = useMemo(
    () => buildOverdueByProjectEntries(projectReportRows),
    [projectReportRows],
  );

  const tasksByProjectSegments = useMemo(
    () => buildTasksByProjectSegments(projectReportRows),
    [projectReportRows],
  );

  const overdueByProjectFallback = useMemo(() => buildOverdueByProjectRows(data), [data]);

  const teamMemberRows = useMemo(() => (data ? resolveTeamMemberRows(data) : []), [data]);

  const liveMemberSource = useMemo(
    () => (data ? resolveLiveTopAssigneeSource(data) : []),
    [data],
  );

  const liveMembers = useMemo(
    () =>
      buildLiveMemberRows(
        liveMemberSource,
        hierarchyDataExtensions,
        hierarchyDataUsers,
        data ?? null,
      ),
    [liveMemberSource, hierarchyDataExtensions, hierarchyDataUsers, data],
  );

  const liveOverdueTasks = useMemo(
    () =>
      data
        ? buildLiveOverdueTaskRows(
            data,
            hierarchyDataExtensions,
            hierarchyDataUsers,
          )
        : [],
    [data, hierarchyDataExtensions, hierarchyDataUsers],
  );

  const liveInProgressTasks = useMemo(
    () =>
      data
        ? buildLiveInProgressTaskRows(
            data,
            hierarchyDataExtensions,
            hierarchyDataUsers,
          )
        : [],
    [data, hierarchyDataExtensions, hierarchyDataUsers],
  );

  const liveStaleTaskRows = useMemo(
    () =>
      data
        ? buildLiveStaleTaskRows(
            data.stale_in_progress_tasks ?? [],
            staleDays,
          )
        : [],
    [data, staleDays],
  );

  const liveKpiCards = useMemo(() => {
    if (!data) return [];
    return buildLiveDashboardKpis(
      data.summary,
      data.status_breakdown,
      data.trends,
    );
  }, [data]);

  const completionRateChartPoints = useMemo(
    () =>
      data
        ? buildCompletionRateChartPoints(
            data.trends,
            data.completion_trends ?? [],
            data.weekly_completion_trends,
            data.summary,
            dateRange,
          )
        : [],
    [data, dateRange],
  );

  const overdueTrendChartPoints = useMemo(
    () =>
      data
        ? buildOverdueTrendChartPoints(data.overdue_trends, data.summary, dateRange)
        : [],
    [data, dateRange],
  );

  const historicalWeekCount = useMemo(() => {
    const fromOverdue = data?.overdue_trends?.length ?? 0;
    const fromCompletion = data?.weekly_completion_trends?.length ?? 0;
    return Math.max(fromOverdue, fromCompletion, overdueTrendChartPoints.length);
  }, [data, overdueTrendChartPoints.length]);

  const completionChartSubtitle = useMemo(
    () => buildHistoricalWeeksChartSubtitle(historicalWeekCount),
    [historicalWeekCount],
  );

  const overdueChartSubtitle = useMemo(
    () =>
      historicalWeekCount > 0
        ? "Overdue tasks per week"
        : buildHistoricalPeriodSubtitle(dateRange.start, dateRange.end),
    [historicalWeekCount, dateRange.start, dateRange.end],
  );

  const historicalTrendsWeeksLimit = useMemo(() => {
    const raw = data?.list_limits as Record<string, unknown> | undefined;
    const limit = raw?.trends_weeks_limit;
    return typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(1, Math.floor(limit))
      : 4;
  }, [data?.list_limits]);

  const historicalMemberTrendRows = useMemo(
    () =>
      data
        ? buildHistoricalMemberTrendRows(
            teamMemberRows,
            data.member_trends,
            hierarchyDataExtensions,
            hierarchyDataUsers,
            historicalTaskFilter,
            historicalTrendsWeeksLimit,
          )
        : [],
    [
      data,
      teamMemberRows,
      hierarchyDataExtensions,
      hierarchyDataUsers,
      historicalTaskFilter,
      historicalTrendsWeeksLimit,
    ],
  );

  const historicalMemberTrendWeekHeaders = useMemo(
    () => extractMemberTrendWeekHeaders(historicalMemberTrendRows),
    [historicalMemberTrendRows],
  );

  return {
    datePreset,
    setDatePreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    projectFilter,
    setProjectFilter,
    memberFilter,
    setMemberFilter,
    staleDays,
    setStaleDays,
    mainView,
    setMainView,
    teamSubView,
    setTeamSubView,
    historicalTaskFilter,
    setHistoricalTaskFilter,
    exporting,
    dateRangeResult,
    enabled,
    tenantMissing,
    overviewQuery,
    loadingOverview,
    hierarchyDataExtensions,
    hierarchyDataUsers,
    handleExport,
    handleRefetchOverview,
    periodLabel,
    truncatedListLabels,
    showTruncatedNotice,
    projectFilterOptions,
    memberExtensions,
    data,
    projectReportRows,
    projectReportSummary,
    projectKpiSubtexts,
    overdueByProjectEntries,
    tasksByProjectSegments,
    overdueByProjectFallback,
    teamMemberRows,
    liveKpiCards,
    liveMembers,
    liveOverdueTasks,
    liveInProgressTasks,
    liveStaleTaskRows,
    completionRateChartPoints,
    overdueTrendChartPoints,
    completionChartSubtitle,
    overdueChartSubtitle,
    historicalMemberTrendRows,
    historicalMemberTrendWeekHeaders,
  };
}
