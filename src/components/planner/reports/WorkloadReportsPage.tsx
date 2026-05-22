import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { ModuleSlug } from "@utils/Helper";
import { listProjects } from "@utils/tasks";
import {
  buildTaskReportsQuery,
  downloadTaskReportsExport,
  getTaskReportsOverview,
} from "@utils/taskReports";
import { TASK_REPORTS_MAX_DATE_RANGE_DAYS } from "@utils/reportsApiConstants";
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
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
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
import { ReportsErrorBlock, ReportsLoadingBlock } from "./WorkloadReportsViews";
import { ReportsTeamLivePanel } from "./WorkloadReportsLiveViews";
import { ReportsTeamBoardPanelWrapper } from "./WorkloadReportsTeamViews";
import {
  buildCompletionRateChartPoints,
  buildHistoricalWeeksChartSubtitle,
  buildOverdueTrendChartPoints,
  buildHistoricalMemberTrendRows,
  extractMemberTrendWeekHeaders,
  buildHistoricalPeriodSubtitle,
  type HistoricalTaskFilter,
} from "@page-modules/planner/reports/historicalReportsDomain";
import { ReportsHistoricalTrendsPanel } from "./WorkloadReportsHistoricalViews";
import { resolveTeamMemberRows } from "@page-modules/planner/reports/teamReportsDomain";
import {
  buildLiveDashboardKpis,
  buildLiveInProgressTaskRows,
  buildLiveMemberRows,
  buildLiveOverdueTaskRows,
  resolveLiveTopAssigneeSource,
} from "@page-modules/planner/reports/teamLiveViewDomain";
import {
  ReportsOverdueByProject,
  ReportsProjectDetailList,
  ReportsProjectKpiRow,
  ReportsTasksByProject,
  ReportsTeamSubTabs,
  ReportsViewTabs,
} from "./WorkloadReportsProjectViews";

function reportsErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Failed to load reports.";
}

const WorkloadReportsPage: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();
  const tenantId = getPlannerTenantId(session);
  const extension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const { hierarchyDataExtensions, hierarchyDataUsers } = useHierarchyData(
    ModuleSlug.WORK_PLANNER,
  );

  const [datePreset, setDatePreset] = useState<ReportsDatePreset>("last_30");
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

  const memberExtensions = useMemo(() => {
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
  }, [hierarchyDataExtensions, extension]);

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

  const data = reportData;
  const periodLabel = formatReportsPeriodLabel(dateRange.start, dateRange.end);

  const truncatedListLabels = useMemo(
    () => formatTruncatedReportListLabels(data?.list_limits),
    [data?.list_limits],
  );
  const showTruncatedNotice = hasTruncatedReportLists(data?.list_limits);

  const projectReportRows = useMemo(() => {
    const rows = buildProjectReportRows(projectFilterOptions, data);
    if (projectFilter === "all") return rows;
    if (projectFilter === REPORTS_ORGANIZATIONAL_PROJECT_ID) {
      return rows.filter((row) => row.id === REPORTS_ORGANIZATIONAL_PROJECT_ID);
    }
    return rows.filter((row) => row.id === projectFilter);
  }, [projectFilterOptions, data, projectFilter]);

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
      ),
    [liveMemberSource, hierarchyDataExtensions, hierarchyDataUsers],
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

  return (
    <div className="workload-reports-page">
      <Container fluid className="px-3 px-md-4 py-3">
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Reports" />

        <div className="workload-reports-page__header">
          <div>
            <h1 className="workload-reports-page__title">Reports</h1>
            <p className="text-muted small mb-0">
              Insights and Analytics for Team and Projects · {periodLabel}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={!enabled || exporting != null}
              onClick={() => handleExport("csv")}
            >
              <Download size={16} className="me-1" />
              {exporting === "csv" ? "Exporting…" : "Export CSV"}
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={!enabled || exporting != null}
              onClick={() => handleExport("xlsx")}
            >
              <Download size={16} className="me-1" />
              {exporting === "xlsx" ? "Exporting…" : "Export PDF"}
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              disabled={!enabled || overviewQuery.isFetching}
              onClick={() => overviewQuery.refetch()}
            >
              <RefreshCw size={16} className="me-1" />
              Refresh
            </Button>
          </div>
        </div>

        {tenantMissing ? (
          <Alert variant="warning">
            Tenant context is missing. Sign in again or contact your administrator.
          </Alert>
        ) : null}

        {dateRangeResult.wasClamped ? (
          <Alert variant="info" className="mb-3">
            Date range was limited to {TASK_REPORTS_MAX_DATE_RANGE_DAYS} days (API maximum).
          </Alert>
        ) : null}

        {showTruncatedNotice ? (
          <Alert variant="info" className="mb-3">
            Some lists are truncated for performance: {truncatedListLabels.join(", ")}. Summary
            KPIs remain full counts.
          </Alert>
        ) : null}

        <Card className="workload-reports-filters">
          <Card.Body className="workload-reports-filters__body">
          <Row className="g-2 align-items-end workload-reports-filters__row">
            <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
              <Form.Label className="small text-muted mb-1">Time period</Form.Label>
              <Form.Select
                size="sm"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as ReportsDatePreset)}
              >
                <option value="last_7">Last 7 days</option>
                <option value="last_30">Last 30 days</option>
                <option value="this_month">This month</option>
                <option value="custom">Custom range</option>
              </Form.Select>
            </Col>
            {datePreset === "custom" ? (
              <>
                <Col xs={6} sm={6} md="auto" className="workload-reports-filters__field">
                  <Form.Label className="small text-muted mb-1">Start</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </Col>
                <Col xs={6} sm={6} md="auto" className="workload-reports-filters__field">
                  <Form.Label className="small text-muted mb-1">End</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </Col>
              </>
            ) : null}
            <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
              <Form.Label className="small text-muted mb-1">Project</Form.Label>
              <Form.Select
                size="sm"
                value={projectFilter === "all" ? "all" : String(projectFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "all") {
                    setProjectFilter("all");
                    return;
                  }
                  const parsed = Number(v);
                  setProjectFilter(Number.isFinite(parsed) ? parsed : "all");
                }}
              >
                <option value="all">All projects</option>
                {projectFilterOptions.map((p) => (
                  <option key={`${p.id}-${p.name}`} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
              <Form.Label className="small text-muted mb-1">Member</Form.Label>
              <Form.Select
                size="sm"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
              >
                <option value="all">All members</option>
                {memberExtensions.map((ext) => (
                  <option key={ext} value={ext}>
                    {formatWorkloadMemberLabel(ext, hierarchyDataExtensions)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md="auto" className="workload-reports-filters__field">
              <Form.Label className="small text-muted mb-1">Stale (days)</Form.Label>
              <Form.Select
                size="sm"
                value={String(staleDays)}
                onChange={(e) => setStaleDays(Number(e.target.value))}
              >
                <option value="3">3+ days</option>
                <option value="5">5+ days</option>
                <option value="7">7+ days</option>
                <option value="14">14+ days</option>
              </Form.Select>
            </Col>
            <Col
              xs={12}
              md="auto"
              className="workload-reports-filters__apply-col"
            >
              <Form.Label
                className="small text-muted mb-1 workload-reports-filters__apply-label"
                aria-hidden="true"
              >
                &nbsp;
              </Form.Label>
              <Button
                variant="dark"
                size="sm"
                className="workload-reports-filters__apply-btn"
                disabled={!enabled || loadingOverview}
                onClick={() => void overviewQuery.refetch()}
              >
                Apply
              </Button>
            </Col>
          </Row>
          </Card.Body>
        </Card>

        <ReportsViewTabs activeView={mainView} onChange={setMainView} />

        {loadingOverview ? <ReportsLoadingBlock /> : null}
        {enabled && overviewQuery.isError ? (
          <ReportsErrorBlock message={reportsErrorMessage(overviewQuery.error)} />
        ) : null}

        {!loadingOverview && enabled && !data && !overviewQuery.isError ? (
          <Alert variant="secondary" className="text-center">
            No report data for the selected filters. Try a wider date range or different project.
          </Alert>
        ) : null}

        {data && !loadingOverview && mainView === "team" ? (
          <>
            <ReportsTeamSubTabs activeSubView={teamSubView} onChange={setTeamSubView} />

            {teamSubView === "live" ? (
              <ReportsTeamLivePanel
                kpiCards={liveKpiCards}
                memberRows={liveMembers}
                overdueTasks={liveOverdueTasks}
                inProgressTasks={liveInProgressTasks}
              />
            ) : null}

            {teamSubView === "board" ? (
              <ReportsTeamBoardPanelWrapper
                data={data}
                memberRows={teamMemberRows}
                hierarchyExtensions={hierarchyDataExtensions}
              />
            ) : null}
          </>
        ) : null}

        {data && !loadingOverview && mainView === "project" ? (
          <>
            <ReportsProjectKpiRow
              summary={projectReportSummary}
              subtexts={projectKpiSubtexts}
            />

            <div className="reports-panel mb-3">
              <h2 className="reports-panel__title">Project Health</h2>
              <p className="reports-panel__subtitle">Progress and delivery status</p>
              <ReportsProjectDetailList rows={projectReportRows} />
            </div>

            <Row className="g-3">
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Overdue by Project</h2>
                  <p className="reports-panel__subtitle">Tasks past their due date</p>
                  <ReportsOverdueByProject
                    entries={
                      overdueByProjectEntries.length > 0
                        ? overdueByProjectEntries
                        : undefined
                    }
                    rows={overdueByProjectFallback}
                    grouped={overdueByProjectEntries.length === 0}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Tasks by Project</h2>
                  <p className="reports-panel__subtitle">Task volume across projects</p>
                  <ReportsTasksByProject segments={tasksByProjectSegments} />
                </div>
              </Col>
            </Row>
          </>
        ) : null}

        {data && !loadingOverview && mainView === "historical" ? (
          <ReportsHistoricalTrendsPanel
            completionPoints={completionRateChartPoints}
            overduePoints={overdueTrendChartPoints}
            completionChartSubtitle={completionChartSubtitle}
            overdueChartSubtitle={overdueChartSubtitle}
            memberTrendRows={historicalMemberTrendRows}
            memberTrendWeekHeaders={historicalMemberTrendWeekHeaders}
            taskFilter={historicalTaskFilter}
            onTaskFilterChange={setHistoricalTaskFilter}
          />
        ) : null}
      </Container>
    </div>
  );
};

export default WorkloadReportsPage;
