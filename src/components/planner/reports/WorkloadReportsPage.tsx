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
  downloadTaskReportsExport,
  getTaskReportsOverview,
  type TaskReportsQuery,
} from "@utils/taskReports";
import { plannerKeys } from "../../../query/keys";
import {
  formatReportsPeriodLabel,
  getPlannerTenantId,
  getReportsDateRangeForPreset,
  normalizeReportsOverview,
  type ReportsDatePreset,
  type ReportsProjectFilter,
} from "@page-modules/planner/reports/reportsDomain";
import { formatWorkloadMemberLabel } from "@page-modules/planner/workload/workloadDomain";
import {
  ReportsAssigneeList,
  ReportsErrorBlock,
  ReportsKpiRow,
  ReportsLoadingBlock,
  ReportsMemberTable,
  ReportsPendingTasks,
  ReportsStaleTasks,
  ReportsStatusBreakdown,
  ReportsTransferTasks,
  ReportsTrendChart,
} from "./WorkloadReportsViews";

function reportsErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "Failed to load reports.";
}

const WorkloadReportsPage: React.FC = () => {
  const { data: session } = useSession();
  const tenantId = getPlannerTenantId(session);
  const extension = useMemo(() => getSessionPhoneOrExtension(session), [session]);
  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const [datePreset, setDatePreset] = useState<ReportsDatePreset>("last_30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [projectFilter, setProjectFilter] = useState<ReportsProjectFilter>("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [staleDays, setStaleDays] = useState(3);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const dateRange = useMemo(
    () => getReportsDateRangeForPreset(datePreset, customStart, customEnd),
    [datePreset, customStart, customEnd],
  );

  useEffect(() => {
    if (datePreset !== "custom" || (customStart && customEnd)) return;
    setCustomStart(dateRange.start);
    setCustomEnd(dateRange.end);
  }, [datePreset, customStart, customEnd, dateRange.start, dateRange.end]);

  const projectFilterKey =
    projectFilter === "all" ? "all" : String(projectFilter);

  const reportQuery = useMemo((): TaskReportsQuery | null => {
    if (!tenantId) return null;
    const q: TaskReportsQuery = {
      tenant_id: tenantId,
      start_date: dateRange.start,
      end_date: dateRange.end,
      pending_limit: 20,
      top_assignees_limit: 10,
      in_progress_stale_days: staleDays,
    };
    if (projectFilter !== "all") {
      q.project_id = projectFilter;
    }
    if (memberFilter !== "all") {
      q.extension_number = memberFilter;
    } else if (extension) {
      q.extension_number = extension;
    }
    return q;
  }, [
    tenantId,
    dateRange.start,
    dateRange.end,
    projectFilter,
    memberFilter,
    staleDays,
    extension,
  ]);

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

  const overviewQuery = useQuery({
    queryKey: plannerKeys.reports.overview(queryKey),
    queryFn: async () => {
      if (!reportQuery) throw new Error("Missing tenant");
      const raw = await getTaskReportsOverview(reportQuery);
      return normalizeReportsOverview(raw);
    },
    enabled,
  });

  const projectsQuery = useQuery({
    queryKey: [...plannerKeys.root, "reports", "projects"],
    queryFn: async () => {
      const res = await listProjects({ limit: 200 });
      const rows = (res as { data?: unknown } | null)?.data ?? [];
      if (!Array.isArray(rows)) return [];
      return rows
        .map((row) => {
          const r = row as { id?: number; name?: string };
          const id = Number(r.id);
          const name = typeof r.name === "string" ? r.name.trim() : "";
          if (!Number.isFinite(id) || !name) return null;
          return { id, name };
        })
        .filter((p): p is { id: number; name: string } => p != null);
    },
  });

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
        await downloadTaskReportsExport(reportQuery, format);
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } catch (err) {
        toast.error(reportsErrorMessage(err));
      } finally {
        setExporting(null);
      }
    },
    [reportQuery],
  );

  const data = overviewQuery.data;
  const periodLabel = formatReportsPeriodLabel(dateRange.start, dateRange.end);

  return (
    <div className="workload-reports-page">
      <Container fluid className="px-3 px-md-4 py-3">
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Reports" />

        <div className="workload-reports-page__header">
          <div>
            <h1 className="workload-reports-page__title">Reports</h1>
            <p className="text-muted small mb-0">
              Analyze your team&apos;s workload and performance · {periodLabel}
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
              {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
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

        {tenantId === "" ? (
          <Alert variant="warning">
            Tenant context is missing. Sign in again or contact your administrator.
          </Alert>
        ) : null}

        <Card className="workload-reports-filters">
          <Row className="g-2 align-items-end">
            <Col xs={12} md={6} lg={3}>
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
                <Col xs={6} md={3} lg={2}>
                  <Form.Label className="small text-muted mb-1">Start</Form.Label>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </Col>
                <Col xs={6} md={3} lg={2}>
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
            <Col xs={12} md={6} lg={3}>
              <Form.Label className="small text-muted mb-1">Project</Form.Label>
              <Form.Select
                size="sm"
                value={projectFilter === "all" ? "all" : String(projectFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  setProjectFilter(v === "all" ? "all" : Number(v));
                }}
              >
                <option value="all">All projects</option>
                {(projectsQuery.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={6} lg={3}>
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
            <Col xs={12} md={6} lg={2}>
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
          </Row>
        </Card>

        {overviewQuery.isPending ? <ReportsLoadingBlock /> : null}
        {overviewQuery.isError ? (
          <ReportsErrorBlock message={reportsErrorMessage(overviewQuery.error)} />
        ) : null}

        {data && !overviewQuery.isPending ? (
          <>
            <ReportsKpiRow summary={data.summary} />

            <Row className="g-3">
              <Col lg={7}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Status breakdown</h2>
                  <p className="reports-panel__subtitle">
                    Distribution of tasks by current status
                  </p>
                  <ReportsStatusBreakdown rows={data.status_breakdown} />
                </div>
              </Col>
              <Col lg={5}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Workload trend</h2>
                  <p className="reports-panel__subtitle">Task volume over time</p>
                  <ReportsTrendChart points={data.trends} />
                </div>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Top assignees</h2>
                  <p className="reports-panel__subtitle">
                    Members with the most completed work
                  </p>
                  <ReportsAssigneeList
                    rows={data.top_assignees}
                    hierarchyExtensions={hierarchyDataExtensions}
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Transfer tasks</h2>
                  <p className="reports-panel__subtitle">Tasks moved between members</p>
                  <ReportsTransferTasks tasks={data.transfer_tasks} />
                </div>
              </Col>
            </Row>

            <Row className="g-3">
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Pending tasks</h2>
                  <p className="reports-panel__subtitle">Tasks waiting to start</p>
                  <ReportsPendingTasks tasks={data.pending_tasks} />
                </div>
              </Col>
              <Col md={6}>
                <div className="reports-panel">
                  <h2 className="reports-panel__title">Stale in progress</h2>
                  <p className="reports-panel__subtitle">
                    In progress for {staleDays}+ days without updates
                  </p>
                  <ReportsStaleTasks tasks={data.stale_in_progress_tasks} staleDays={staleDays} />
                </div>
              </Col>
            </Row>

            <div className="reports-panel">
              <h2 className="reports-panel__title">Member report</h2>
              <p className="reports-panel__subtitle">Individual performance by status</p>
              <ReportsMemberTable
                rows={data.top_assignees}
                hierarchyExtensions={hierarchyDataExtensions}
              />
            </div>
          </>
        ) : null}
      </Container>
    </div>
  );
};

export default WorkloadReportsPage;
