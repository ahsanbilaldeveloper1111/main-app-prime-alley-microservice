/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-enable @typescript-eslint/ban-ts-comment */
import React from "react";
import { Calendar } from "lucide-react";
import moment from "moment";
import Layout from "@layout/index";
import ProtectedRoute from "@components/ProtectedRoute";
import { CrmInsightsDealsSection } from "./CrmInsightsDealsSection";
import { CrmInsightsFiltersBar } from "./CrmInsightsFiltersBar";
import { CrmInsightsLeadsSection } from "./CrmInsightsLeadsSection";
import { CrmInsightsOrdersSection } from "./CrmInsightsOrdersSection";
import { useCrmInsightsPage } from "./useCrmInsightsPage";

const CrmReports = () => {
  const page = useCrmInsightsPage();
  const {
    PERMISSIONS,
    canViewReports,
    canViewLeadsReports,
    canViewDealsReports,
    canViewOrdersReports,
    selectedReportModule,
    setSelectedReportModule,
    setShowDatePicker,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedDateRange,
    selectedOwner,
    setSelectedOwner,
    selectedCampaign,
    setSelectedCampaign,
    selectedStage,
    setSelectedStage,
    stages,
    users,
    campaigns,
    handleDateRangeChange,
    fetchLeadReports,
    fetchDealReports,
    fetchOrderReports,
    fetchCurrentModuleReports,
    availableReportTabs,
    getUserDisplayName,
    resetFilters,
    loading,
    dealLoading,
    orderLoading,
    leadOverview,
    leadSources,
    leadAssignments,
    leadConversion,
    leadStageDuration,
    dealFunnel,
    dealValue,
    dealStageDuration,
    dealLostReasons,
    dealConversion,
    orderSummary,
    orderStatus,
    orderRevenue,
    orderStageDuration,
    orderCancellations,
  } = page;

  if (!canViewReports) {
    return (
      <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_REPORTS]}>
        <div />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CRM_REPORTS]}>
      <div style={{ background: "#f8f9fa", minHeight: "100vh" }}>
        <div
          style={{
            background: "white",
            padding: "20px 32px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="mb-0 fw-bold" style={{ fontSize: "20px", color: "#1f2937" }}>
            CRM Insights
          </h2>
          <div className="d-flex gap-3 align-items-center">
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setShowDatePicker((prev: boolean) => !prev)}
                className="d-flex align-items-center gap-2 border-0 bg-transparent"
                style={{
                  padding: "8px 16px",
                  background: "#f8f9fa",
                  borderRadius: "8px",
                  border: "1px solid #dee2e6",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <Calendar size={16} style={{ color: "#6b7280" }} />
                <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>
                  {moment(startDate).format("MMM D")} - {moment(endDate).format("MMM D")}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "0 32px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: "32px",
          }}
        >
          {availableReportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedReportModule(tab.id);
                if (tab.id === "leads") void fetchLeadReports();
                else if (tab.id === "deals") void fetchDealReports();
                else if (tab.id === "orders") void fetchOrderReports();
              }}
              style={{
                padding: "16px 0",
                border: "none",
                background: "transparent",
                borderBottom:
                  selectedReportModule === tab.id ? "2px solid #4F46E5" : "2px solid transparent",
                color: selectedReportModule === tab.id ? "#4F46E5" : "#6b7280",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CrmInsightsFiltersBar
          selectedDateRange={selectedDateRange}
          onDateRangeChange={handleDateRangeChange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          selectedOwner={selectedOwner}
          onOwnerChange={setSelectedOwner}
          selectedCampaign={selectedCampaign}
          onCampaignChange={setSelectedCampaign}
          selectedStage={selectedStage}
          onStageChange={setSelectedStage}
          users={users}
          campaigns={campaigns}
          stages={stages}
          onApply={fetchCurrentModuleReports}
          onReset={() => {
            resetFilters();
          }}
          loading={loading}
          dealLoading={dealLoading}
          orderLoading={orderLoading}
        />

        {selectedReportModule === "leads" && canViewLeadsReports && (
          <CrmInsightsLeadsSection
            loading={loading}
            leadOverview={leadOverview}
            leadConversion={leadConversion}
            leadSources={leadSources}
            leadAssignments={leadAssignments}
            leadStageDuration={leadStageDuration}
            getUserDisplayName={getUserDisplayName}
          />
        )}

        {selectedReportModule === "deals" && canViewDealsReports && (
          <CrmInsightsDealsSection
            dealLoading={dealLoading}
            dealValue={dealValue}
            dealConversion={dealConversion}
            dealFunnel={dealFunnel}
            dealStageDuration={dealStageDuration}
            dealLostReasons={dealLostReasons}
            getUserDisplayName={getUserDisplayName}
          />
        )}

        {selectedReportModule === "orders" && canViewOrdersReports && (
          <CrmInsightsOrdersSection
            orderLoading={orderLoading}
            orderSummary={orderSummary}
            orderStatus={orderStatus}
            orderRevenue={orderRevenue}
            orderStageDuration={orderStageDuration}
            orderCancellations={orderCancellations}
            getUserDisplayName={getUserDisplayName}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

CrmReports.getLayout = function getLayout(page: React.ReactNode) {
  return <Layout>{page}</Layout>;
};

export default CrmReports;
