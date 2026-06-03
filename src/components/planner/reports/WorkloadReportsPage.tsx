import React from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { Download, RefreshCw } from "lucide-react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { TASK_REPORTS_MAX_DATE_RANGE_DAYS } from "@utils/reportsApiConstants";
import { ReportsViewTabs } from "./WorkloadReportsProjectViews";
import { WorkloadReportsFiltersCard } from "./WorkloadReportsFiltersCard";
import { WorkloadReportsPageContent } from "./WorkloadReportsPageContent";
import { useWorkloadReportsPage } from "./useWorkloadReportsPage";

const WorkloadReportsPage: React.FC = () => {
  const vm = useWorkloadReportsPage();

  return (
    <div className="workload-reports-page">
      <Container fluid className="px-0 py-0">
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Reports" />

        <div className="workload-reports-page__header">
          <div>
            <h1 className="workload-reports-page__title">Reports</h1>
            <p className="text-muted small mb-0">
              Insights and Analytics for Team and Projects · {vm.periodLabel}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={!vm.enabled || vm.exporting != null}
              onClick={() => vm.handleExport("csv")}
            >
              <Download size={16} className="me-1" />
              {vm.exporting === "csv" ? "Exporting…" : "Export CSV"}
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              disabled={!vm.enabled || vm.exporting != null}
              onClick={() => vm.handleExport("xlsx")}
            >
              <Download size={16} className="me-1" />
              {vm.exporting === "xlsx" ? "Exporting…" : "Export PDF"}
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              disabled={!vm.enabled || vm.overviewQuery.isFetching}
              onClick={vm.handleRefetchOverview}
            >
              <RefreshCw size={16} className="me-1" />
              Refresh
            </Button>
          </div>
        </div>

        {vm.tenantMissing ? (
          <Alert variant="warning">
            Tenant context is missing. Sign in again or contact your administrator.
          </Alert>
        ) : null}

        {vm.dateRangeResult.wasClamped ? (
          <Alert variant="info" className="mb-3">
            Date range was limited to {TASK_REPORTS_MAX_DATE_RANGE_DAYS} days (API maximum).
          </Alert>
        ) : null}

        {vm.showTruncatedNotice ? (
          <Alert variant="info" className="mb-3">
            Some lists are truncated for performance: {vm.truncatedListLabels.join(", ")}. Summary
            KPIs remain full counts.
          </Alert>
        ) : null}

        <WorkloadReportsFiltersCard
          datePreset={vm.datePreset}
          onDatePresetChange={vm.setDatePreset}
          customStart={vm.customStart}
          onCustomStartChange={vm.setCustomStart}
          customEnd={vm.customEnd}
          onCustomEndChange={vm.setCustomEnd}
          projectFilter={vm.projectFilter}
          onProjectFilterChange={vm.setProjectFilter}
          projectFilterOptions={vm.projectFilterOptions}
          memberFilter={vm.memberFilter}
          onMemberFilterChange={vm.setMemberFilter}
          memberExtensions={vm.memberExtensions}
          hierarchyDataExtensions={vm.hierarchyDataExtensions}
          staleDays={vm.staleDays}
          onStaleDaysChange={vm.setStaleDays}
          enabled={vm.enabled}
          loadingOverview={vm.loadingOverview}
          onApply={vm.handleRefetchOverview}
        />

        <ReportsViewTabs activeView={vm.mainView} onChange={vm.setMainView} />

        <div className="workload-reports-page__content">
          <WorkloadReportsPageContent vm={vm} overviewQuery={vm.overviewQuery} />
        </div>
      </Container>
    </div>
  );
};

export default WorkloadReportsPage;
