import React, { useState } from "react";
import { Alert, Button, Container } from "react-bootstrap";
import { Download } from "lucide-react";
import { TASK_REPORTS_MAX_DATE_RANGE_DAYS } from "@utils/reportsApiConstants";
import { ReportsViewTabs } from "./WorkloadReportsProjectViews";
import { WorkloadReportsFiltersCard } from "./WorkloadReportsFiltersCard";
import { WorkloadReportsPageContent } from "./WorkloadReportsPageContent";
import { useWorkloadReportsPage } from "./useWorkloadReportsPage";

const WorkloadReportsPage: React.FC = () => {
  const vm = useWorkloadReportsPage();
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="workload-reports-page">
      <Container fluid className="px-0 py-0">
        <div className="workload-reports-page__header">
          <div>
            <h1 className="workload-reports-page__title">Reports</h1>
            <p className="text-muted small mb-0">
              Insights and Analytics for Team and Projects · {vm.periodLabel}
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <div style={{ position: "relative" }}>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={!vm.enabled || vm.exporting != null}
                onClick={() => setExportOpen((prev) => !prev)}
              >
                <Download size={16} className="me-1" />
                Export
                <i className="ti ti-chevron-down" style={{ fontSize: "11px", marginLeft: "4px" }} />
              </Button>
              {exportOpen ? (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #eaf0f6",
                  borderRadius: "6px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  zIndex: 500,
                  minWidth: "140px",
                  padding: "4px",
                }}>
                  <button
                    type="button"
                    style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", fontFamily: "Lexend Deca, sans-serif", color: "#141414", borderRadius: "4px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    onClick={() => { vm.handleExport("csv"); setExportOpen(false); }}
                  >
                    <Download size={13} />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 12px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", fontFamily: "Lexend Deca, sans-serif", color: "#141414", borderRadius: "4px" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f5f7fa"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    onClick={() => { vm.handleExport("xlsx"); setExportOpen(false); }}
                  >
                    <Download size={13} />
                    Export PDF
                  </button>
                </div>
              ) : null}
            </div>
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

        <ReportsViewTabs activeView={vm.mainView} onChange={vm.setMainView} />
        {vm.mainView === "my_day_monthly" ? null : (
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
        )}

        <div className="workload-reports-page__content">
          <WorkloadReportsPageContent vm={vm} overviewQuery={vm.overviewQuery} />
        </div>
      </Container>
    </div>
  );
};

export default WorkloadReportsPage;
