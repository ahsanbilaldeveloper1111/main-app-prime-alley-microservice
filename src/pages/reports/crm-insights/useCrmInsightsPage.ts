import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import moment from "moment";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { ModuleSlug } from "@utils/Helper";
import { usePermissions } from "@utils/permissionUtils";
import { GetHierarchyData } from "@utils/users";
import {
  CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
  getCampaigns,
  getDealConversionReport,
  getDealFunnelReport,
  getDealLostReasonReport,
  getDealStageDurationReport,
  getDealValueReport,
  getLeadAssignmentReport,
  getLeadConversionReport,
  getLeadOverviewReport,
  getLeadSourceReport,
  getLeadStageDurationReport,
  getOrderCancellationReport,
  getOrderRevenueReport,
  getOrderStageDurationReport,
  getOrderStatusReport,
  getOrderSummaryReport,
  getStages,
  type CampaignData,
  type DealConversionReport,
  type DealFunnelReport,
  type DealLostReasonReport,
  type DealStageDurationReport,
  type DealValueReport,
  type LeadAssignmentReport,
  type LeadConversionReport,
  type LeadOverviewReport,
  type LeadSourceReport,
  type LeadStageDurationReport,
  type OrderCancellationReport,
  type OrderRevenueReport,
  type OrderStageDurationReport,
  type OrderStatusReport,
  type OrderSummaryReport,
  type StageData,
} from "@utils/crm";
import {
  buildSharedCrmReportFilters,
  crmInsightsModuleSlug,
  crmInsightsStageType,
  resolveCrmDateRangePreset,
  resolveCrmInsightsUserDisplayName,
  toDealReportFilters,
  toLeadReportFilters,
  toOrderReportFilters,
  type CrmReportModuleId,
} from "./crmInsightsDomain";

export type CrmInsightsTab = { id: CrmReportModuleId; label: string };

export function useCrmInsightsPage() {
  const { PERMISSIONS } = HEADER_CONSTANTS;
  const { hasPermission } = usePermissions();

  const canViewReports = hasPermission(PERMISSIONS.VIEW_CRM_REPORTS);
  const canViewLeadsReports = hasPermission(PERMISSIONS.VIEW_CRM_LEADS_REPORTS);
  const canViewDealsReports = hasPermission(PERMISSIONS.VIEW_CRM_DEALS_REPORTS);
  const canViewOrdersReports = hasPermission(PERMISSIONS.VIEW_CRM_ORDERS_REPORTS);

  const getInitialTab = useCallback((): CrmReportModuleId => {
    if (canViewLeadsReports) return "leads";
    if (canViewDealsReports) return "deals";
    if (canViewOrdersReports) return "orders";
    return "leads";
  }, [canViewLeadsReports, canViewDealsReports, canViewOrdersReports]);

  const [selectedReportModule, setSelectedReportModule] = useState<CrmReportModuleId>(getInitialTab);
  const [, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(moment().subtract(30, "days").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));

  const [selectedDateRange, setSelectedDateRange] = useState<string>("this_month");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const [stages, setStages] = useState<StageData[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);

  const [leadOverview, setLeadOverview] = useState<LeadOverviewReport | null>(null);
  const [leadSources, setLeadSources] = useState<LeadSourceReport[]>([]);
  const [leadAssignments, setLeadAssignments] = useState<LeadAssignmentReport[]>([]);
  const [leadConversion, setLeadConversion] = useState<LeadConversionReport | null>(null);
  const [leadStageDuration, setLeadStageDuration] = useState<LeadStageDurationReport[]>([]);
  const [loading, setLoading] = useState(false);

  const [dealFunnel, setDealFunnel] = useState<DealFunnelReport[]>([]);
  const [dealValue, setDealValue] = useState<DealValueReport | null>(null);
  const [dealStageDuration, setDealStageDuration] = useState<DealStageDurationReport[]>([]);
  const [dealLostReasons, setDealLostReasons] = useState<DealLostReasonReport[]>([]);
  const [dealConversion, setDealConversion] = useState<DealConversionReport | null>(null);
  const [dealLoading, setDealLoading] = useState(false);

  const [orderSummary, setOrderSummary] = useState<OrderSummaryReport | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatusReport[]>([]);
  const [orderRevenue, setOrderRevenue] = useState<OrderRevenueReport | null>(null);
  const [orderStageDuration, setOrderStageDuration] = useState<OrderStageDurationReport[]>([]);
  const [orderCancellations, setOrderCancellations] = useState<OrderCancellationReport[]>([]);
  const [orderLoading, setOrderLoading] = useState(false);

  const sharedFiltersRef = useRef(
    buildSharedCrmReportFilters({
      startDate,
      endDate,
      selectedStage,
      selectedOwner,
      selectedCampaign,
    }),
  );
  sharedFiltersRef.current = buildSharedCrmReportFilters({
    startDate,
    endDate,
    selectedStage,
    selectedOwner,
    selectedCampaign,
  });

  const fetchLeadReports = useCallback(async () => {
    setLoading(true);
    try {
      const filters = toLeadReportFilters(sharedFiltersRef.current);
      const [overview, sources, assignments, conversion, stageDuration] = await Promise.all([
        getLeadOverviewReport(filters),
        getLeadSourceReport(filters),
        getLeadAssignmentReport(filters),
        getLeadConversionReport(filters),
        getLeadStageDurationReport(filters),
      ]);
      setLeadOverview(overview);
      setLeadSources(sources);
      setLeadAssignments(assignments);
      setLeadConversion(conversion);
      setLeadStageDuration(stageDuration);
    } catch (error) {
      console.error("Failed to fetch lead reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDealReports = useCallback(async () => {
    setDealLoading(true);
    try {
      const filters = toDealReportFilters(sharedFiltersRef.current);
      const [funnel, value, stageDuration, lostReasons, conversion] = await Promise.all([
        getDealFunnelReport(filters),
        getDealValueReport(filters),
        getDealStageDurationReport(filters),
        getDealLostReasonReport(filters),
        getDealConversionReport(filters),
      ]);
      setDealFunnel(funnel);
      setDealValue(value);
      setDealStageDuration(stageDuration);
      setDealLostReasons(lostReasons);
      setDealConversion(conversion);
    } catch (error) {
      console.error("Failed to fetch deal reports:", error);
    } finally {
      setDealLoading(false);
    }
  }, []);

  const fetchOrderReports = useCallback(async () => {
    setOrderLoading(true);
    try {
      const filters = toOrderReportFilters(sharedFiltersRef.current);
      const [summary, status, revenue, stageDuration, cancellations] = await Promise.all([
        getOrderSummaryReport(filters),
        getOrderStatusReport(filters),
        getOrderRevenueReport(filters),
        getOrderStageDurationReport(filters),
        getOrderCancellationReport(filters),
      ]);
      setOrderSummary(summary);
      setOrderStatus(status);
      setOrderRevenue(revenue);
      setOrderStageDuration(stageDuration);
      setOrderCancellations(cancellations);
    } catch (error) {
      console.error("Failed to fetch order reports:", error);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [stagesData, hierarchyData, campaignsData] = await Promise.all([
          getStages(crmInsightsStageType(selectedReportModule)),
          GetHierarchyData(crmInsightsModuleSlug(selectedReportModule)),
          getCampaigns({
            per_page: 1000,
            module_slug: ModuleSlug.CRM_CAMPAIGNS,
            filters: CRM_CAMPAIGNS_LIST_ACTIVE_ONLY,
          }),
        ]);
        setStages(stagesData || []);
        if (hierarchyData?.extensions) {
          setUsers(hierarchyData.extensions as Record<string, unknown>[]);
        }
        if (campaignsData?.data) {
          setCampaigns(campaignsData.data);
        }
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      }
    };
    void fetchFilterData();
  }, [selectedReportModule]);

  const handleDateRangeChange = useCallback((range: string) => {
    const resolved = resolveCrmDateRangePreset(range);
    if (!resolved) return;
    if (resolved.kind === "custom") {
      setSelectedDateRange("custom");
      return;
    }
    setStartDate(resolved.start);
    setEndDate(resolved.end);
    setSelectedDateRange(range);
  }, []);

  useEffect(() => {
    const resolved = resolveCrmDateRangePreset("this_month");
    if (resolved?.kind === "range") {
      setStartDate(resolved.start);
      setEndDate(resolved.end);
      setSelectedDateRange("this_month");
    }
  }, []);

  useEffect(() => {
    if (selectedReportModule === "leads") {
      void fetchLeadReports();
    } else if (selectedReportModule === "deals") {
      void fetchDealReports();
    } else if (selectedReportModule === "orders") {
      void fetchOrderReports();
    }
    // Only refetch when the module tab changes; filter changes require Apply (matches legacy behavior).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [selectedReportModule]);

  const reportTabs = useMemo<CrmInsightsTab[]>(
    () => [
      { id: "leads", label: "Leads" },
      { id: "deals", label: "Deals" },
      { id: "orders", label: "Orders" },
    ],
    [],
  );

  const availableReportTabs = useMemo(
    () =>
      reportTabs.filter((tab) => {
        if (tab.id === "leads") return canViewLeadsReports;
        if (tab.id === "deals") return canViewDealsReports;
        if (tab.id === "orders") return canViewOrdersReports;
        return false;
      }),
    [reportTabs, canViewLeadsReports, canViewDealsReports, canViewOrdersReports],
  );

  useEffect(() => {
    if (!availableReportTabs.some((tab) => tab.id === selectedReportModule)) {
      if (availableReportTabs.length > 0) {
        setSelectedReportModule(availableReportTabs[0].id);
      }
    }
    // Mirrors legacy effect: react when submodule permissions change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keep parity with original page
  }, [canViewLeadsReports, canViewDealsReports, canViewOrdersReports]);

  const getUserDisplayName = useCallback(
    (extension: string | number) => resolveCrmInsightsUserDisplayName(users, extension),
    [users],
  );

  const fetchCurrentModuleReports = useCallback(() => {
    if (selectedReportModule === "leads") void fetchLeadReports();
    else if (selectedReportModule === "deals") void fetchDealReports();
    else if (selectedReportModule === "orders") void fetchOrderReports();
  }, [selectedReportModule, fetchLeadReports, fetchDealReports, fetchOrderReports]);

  const resetFilters = useCallback(() => {
    setSelectedDateRange("this_month");
    setSelectedOwner("");
    setSelectedCampaign(null);
    setSelectedStage(null);
    const thisMonthStart = moment().startOf("month");
    const thisMonthEnd = moment().endOf("month");
    setStartDate(thisMonthStart.format("YYYY-MM-DD"));
    setEndDate(thisMonthEnd.format("YYYY-MM-DD"));
  }, []);

  return {
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
    leadOverview,
    leadSources,
    leadAssignments,
    leadConversion,
    leadStageDuration,
    loading,
    dealFunnel,
    dealValue,
    dealStageDuration,
    dealLostReasons,
    dealConversion,
    dealLoading,
    orderSummary,
    orderStatus,
    orderRevenue,
    orderStageDuration,
    orderCancellations,
    orderLoading,
    handleDateRangeChange,
    fetchLeadReports,
    fetchDealReports,
    fetchOrderReports,
    fetchCurrentModuleReports,
    availableReportTabs,
    getUserDisplayName,
    resetFilters,
  };
}
