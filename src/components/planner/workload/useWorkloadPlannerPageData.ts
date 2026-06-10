import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { plannerKeys } from "../../../query/keys";
import {
  getWorkloadBoard,
  getWorkloadDay,
  getWorkloadGrid,
  getWorkloadSummary,
  getWorkloadUnassigned,
  listProjects,
} from "@utils/tasks";
import {
  createDefaultWorkloadPlannerFilters,
  isDefaultWorkloadPlannerFilters,
  isWorkloadPlannerDraftRangeValid,
  resolveWorkloadBoardDisplayData,
  resolveWorkloadGridDisplayData,
  resolveWorkloadPeriodDisplayMembers,
  workloadCellKey,
  workloadPlannerFiltersEqual,
  getWorkloadWeekRange,
  type WorkloadPlannerFilterState,
} from "@page-modules/planner/workload/workloadDomain";
import type { WorkloadRangePreset } from "@utils/tasks";
import {
  buildWorkloadGridBoardQuery,
  buildWorkloadSummaryQuery,
  resolveWorkloadDisplayTeamExtensions,
} from "@page-modules/planner/workload/workloadTeamScope";
import type { WorkloadProjectOption } from "./WorkloadPlannerChrome";
import {
  WORKLOAD_MOCK_BOARD_DATA,
  WORKLOAD_MOCK_GRID_DATA,
} from "./workloadOnboarding";
import {
  buildWorkloadCellMap,
  computeWorkloadIsApplyingFilters,
  computeWorkloadLoadingMain,
  isWorkloadForbiddenError,
  mergeWorkloadFilterMemberExtensions,
  resolveAppliedProjectFilterKey,
  resolveWorkloadGridRangeFallback,
  resolveWorkloadMemberExtensions,
  type WorkloadSelectedCellState,
} from "./workloadPlannerPageHelpers";
import type { useWorkloadPlannerPageScope } from "./useWorkloadPlannerPageScope";

type WorkloadScope = ReturnType<typeof useWorkloadPlannerPageScope>;
type MainView = "grid" | "board";

type UseWorkloadPlannerPageDataInput = Readonly<{
  scope: WorkloadScope;
  mainView: MainView;
  useMockData: boolean;
  selectedCell: WorkloadSelectedCellState;
}>;

export function useWorkloadPlannerPageData({
  scope,
  mainView,
  useMockData,
  selectedCell,
}: UseWorkloadPlannerPageDataInput) {
  const {
    extension,
    isWorkloadRoot,
    teamScope,
    effectiveTeamScope,
    companyExtensionAllowlist,
    rosterExtensions,
    companyRosterLoading,
    hasWorkloadScope,
    filtersEnabled,
  } = scope;

  const [draftFilters, setDraftFilters] = useState<WorkloadPlannerFilterState>(
    createDefaultWorkloadPlannerFilters,
  );
  const [appliedFilters, setAppliedFilters] =
    useState<WorkloadPlannerFilterState>(createDefaultWorkloadPlannerFilters);

  const appliedRangeValid = useMemo(
    () => isWorkloadPlannerDraftRangeValid(appliedFilters),
    [appliedFilters],
  );
  const draftRangeInvalid = useMemo(
    () => !isWorkloadPlannerDraftRangeValid(draftFilters),
    [draftFilters],
  );
  const appliedProjectFilterKey = useMemo(
    () => resolveAppliedProjectFilterKey(appliedFilters.projectFilter),
    [appliedFilters.projectFilter],
  );
  const workloadQueryInput = useMemo(
    () => ({
      viewerExtension: extension,
      teamScope: effectiveTeamScope,
      memberFilter: appliedFilters.memberFilter,
      assigneeMatch: appliedFilters.assigneeMatch,
      range: appliedFilters.range,
      customStart: appliedFilters.customStart,
      customEnd: appliedFilters.customEnd,
      customRangeValid: appliedRangeValid,
      projectFilter: appliedFilters.projectFilter,
    }),
    [extension, effectiveTeamScope, appliedFilters, appliedRangeValid],
  );
  const summaryQueryBase = useMemo(
    () => buildWorkloadSummaryQuery(workloadQueryInput),
    [workloadQueryInput],
  );
  const gridBoardQueryBase = useMemo(
    () => buildWorkloadGridBoardQuery(workloadQueryInput),
    [workloadQueryInput],
  );
  const workloadQueryKeyParams = useMemo(
    () => ({
      ext: isWorkloadRoot ? "root" : extension,
      range: appliedFilters.range,
      match: appliedFilters.assigneeMatch,
      start: appliedFilters.range === "custom" ? appliedFilters.customStart : undefined,
      end: appliedFilters.range === "custom" ? appliedFilters.customEnd : undefined,
      member: appliedFilters.memberFilter,
      project: appliedProjectFilterKey,
    }),
    [extension, isWorkloadRoot, appliedFilters, appliedProjectFilterKey],
  );

  const queriesEnabled =
    appliedRangeValid &&
    hasWorkloadScope &&
    !teamScope.loading &&
    !companyRosterLoading;

  const handleDraftRangeChange = useCallback((value: WorkloadRangePreset) => {
    setDraftFilters((prev) => {
      if (value === "custom") {
        const week = getWorkloadWeekRange("this_week");
        return {
          ...prev,
          range: value,
          customStart: week.start,
          customEnd: week.end,
        };
      }
      return { ...prev, range: value };
    });
  }, []);

  const handleApplyFilters = useCallback(() => {
    if (!isWorkloadPlannerDraftRangeValid(draftFilters)) {
      toast.error("Choose a valid custom date range.");
      return;
    }
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const handleClearFilters = useCallback(() => {
    const defaults = createDefaultWorkloadPlannerFilters();
    setDraftFilters(defaults);
    setAppliedFilters(defaults);
  }, []);

  const summaryQuery = useQuery({
    queryKey: plannerKeys.workload.summary(workloadQueryKeyParams),
    queryFn: () => getWorkloadSummary(summaryQueryBase),
    enabled: queriesEnabled,
  });
  const gridQuery = useQuery({
    queryKey: plannerKeys.workload.grid(workloadQueryKeyParams),
    queryFn: () => getWorkloadGrid(gridBoardQueryBase),
    enabled: queriesEnabled,
  });
  const boardQuery = useQuery({
    queryKey: plannerKeys.workload.board(workloadQueryKeyParams),
    queryFn: () => getWorkloadBoard(gridBoardQueryBase),
    enabled: queriesEnabled && mainView === "board",
  });

  const effectiveGridData = useMockData ? WORKLOAD_MOCK_GRID_DATA : gridQuery.data;
  const effectiveBoardData = useMockData ? WORKLOAD_MOCK_BOARD_DATA : boardQuery.data;

  const dayQuery = useQuery({
    queryKey: plannerKeys.workload.day({
      ext: selectedCell?.extension ?? "",
      date: selectedCell?.date ?? "",
      match: appliedFilters.assigneeMatch,
    }),
    queryFn: async () => {
      const cell = selectedCell;
      if (!cell) {
        throw new Error("No day selected");
      }
      return getWorkloadDay({
        extension_number: cell.extension,
        date: cell.date,
        assignee_match: appliedFilters.assigneeMatch,
      });
    },
    enabled: Boolean(selectedCell && queriesEnabled),
  });

  const projectsQuery = useQuery({
    queryKey: [...plannerKeys.workload.all(), "project-options"],
    queryFn: async () => {
      const res = await listProjects({ page: 1, limit: 200 });
      const rows =
        (res as { data?: { id?: number; name?: string }[] } | null)?.data ?? [];
      return rows
        .filter((p) => typeof p.id === "number" && p.name)
        .map((p) => ({ id: p.id as number, name: String(p.name) }));
    },
    enabled: filtersEnabled,
    staleTime: 120_000,
  });

  const projectOptions: WorkloadProjectOption[] = projectsQuery.data ?? [];
  const unassignedProjectId =
    typeof appliedFilters.projectFilter === "number"
      ? appliedFilters.projectFilter
      : undefined;

  const unassignedQuery = useQuery({
    queryKey: plannerKeys.workload.unassigned(extension, appliedProjectFilterKey),
    queryFn: () =>
      getWorkloadUnassigned({
        extension_number: extension,
        limit: 100,
        project_id: unassignedProjectId,
      }),
    enabled: queriesEnabled,
    staleTime: 30_000,
  });

  const gridRangeFallback = useMemo(
    () => resolveWorkloadGridRangeFallback(appliedFilters, appliedRangeValid),
    [appliedFilters, appliedRangeValid],
  );
  const gridTeamExtensionNumbers = useMemo(
    () => resolveWorkloadDisplayTeamExtensions(rosterExtensions, extension),
    [rosterExtensions, extension],
  );
  const displayGridData = useMemo(
    () =>
      resolveWorkloadGridDisplayData(effectiveGridData, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        rangeFallback: gridRangeFallback,
        teamExtensionNumbers: gridTeamExtensionNumbers,
        companyExtensionAllowlist,
      }),
    [
      effectiveGridData,
      extension,
      appliedFilters.memberFilter,
      gridRangeFallback,
      gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    ],
  );
  const displayBoardData = useMemo(
    () =>
      resolveWorkloadBoardDisplayData(effectiveBoardData, {
        viewerExtension: extension,
        memberFilter: appliedFilters.memberFilter,
        teamExtensionNumbers: gridTeamExtensionNumbers,
        companyExtensionAllowlist,
      }),
    [
      effectiveBoardData,
      extension,
      appliedFilters.memberFilter,
      gridTeamExtensionNumbers,
      companyExtensionAllowlist,
    ],
  );
  const cellMap = useMemo(
    () =>
      buildWorkloadCellMap(
        displayGridData?.cells ?? effectiveGridData?.cells,
        workloadCellKey,
      ),
    [displayGridData?.cells, effectiveGridData?.cells],
  );
  const memberExtensions = useMemo(
    () =>
      resolveWorkloadMemberExtensions(
        displayGridData,
        extension,
        displayBoardData?.columns,
      ),
    [displayGridData, extension, displayBoardData?.columns],
  );
  const filterMemberExtensions = useMemo(
    () =>
      mergeWorkloadFilterMemberExtensions(
        isWorkloadRoot,
        rosterExtensions,
        memberExtensions,
      ),
    [isWorkloadRoot, rosterExtensions, memberExtensions],
  );
  const displayPeriodMembers = useMemo(
    () =>
      resolveWorkloadPeriodDisplayMembers(
        summaryQuery.data?.members,
        extension,
        rosterExtensions.length > 0 ? rosterExtensions : undefined,
        companyExtensionAllowlist,
      ),
    [summaryQuery.data?.members, extension, rosterExtensions, companyExtensionAllowlist],
  );

  const summaryForbidden =
    summaryQuery.isError && isWorkloadForbiddenError(summaryQuery.error);
  const gridForbidden = gridQuery.isError && isWorkloadForbiddenError(gridQuery.error);
  const boardForbidden =
    boardQuery.isError && isWorkloadForbiddenError(boardQuery.error);
  const accessForbidden = summaryForbidden || gridForbidden || boardForbidden;

  const hasActiveFilters = useMemo(
    () => !isDefaultWorkloadPlannerFilters(draftFilters),
    [draftFilters],
  );
  const hasPendingFilters = useMemo(
    () => !workloadPlannerFiltersEqual(draftFilters, appliedFilters),
    [draftFilters, appliedFilters],
  );
  const loadingMain = computeWorkloadLoadingMain(
    queriesEnabled,
    mainView,
    summaryQuery.isPending,
    gridQuery.isPending,
    boardQuery.isPending,
  );
  const applyDisabled =
    !filtersEnabled || draftRangeInvalid || !hasPendingFilters || loadingMain;
  const isApplyingFilters = computeWorkloadIsApplyingFilters(
    hasPendingFilters,
    queriesEnabled,
    mainView,
    summaryQuery.isFetching,
    gridQuery.isFetching,
    boardQuery.isFetching,
  );

  return {
    draftFilters,
    setDraftFilters,
    appliedFilters,
    draftRangeInvalid,
    queriesEnabled,
    filtersEnabled,
    handleDraftRangeChange,
    handleApplyFilters,
    handleClearFilters,
    summaryQuery,
    gridQuery,
    boardQuery,
    dayQuery,
    unassignedQuery,
    projectOptions,
    effectiveBoardData,
    displayGridData,
    displayBoardData,
    cellMap,
    memberExtensions,
    filterMemberExtensions,
    displayPeriodMembers,
    accessForbidden,
    boardForbidden,
    hasActiveFilters,
    applyDisabled,
    isApplyingFilters,
    loadingMain,
  };
}
